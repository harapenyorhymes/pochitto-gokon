import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createBasicMatching, MatchingCandidate, MatchingStats, calculateMatchingStats } from '@/lib/matching'
import { sendBulkNotification } from '@/lib/line-notify'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // 管理者権限チェック（将来実装）
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user || !isAdmin(user)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // ペンディング状態のイベントとプロフィールを取得
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        profiles!inner (
          id,
          user_id,
          nickname,
          age,
          gender,
          bio
        )
      `)
      .eq('status', 'pending')
      .gte('event_date', new Date().toISOString().split('T')[0]) // 今日以降の日程のみ

    if (eventsError) {
      throw eventsError
    }

    if (!eventsData || eventsData.length === 0) {
      return NextResponse.json({
        message: 'No pending events found',
        stats: {
          totalCandidates: 0,
          totalGroups: 0,
          matchedCandidates: 0,
          unmatchedCandidates: 0,
          maleCount: 0,
          femaleCount: 0,
          averageAge: 0
        }
      })
    }

    // マッチング候補者データを変換
    const candidates: MatchingCandidate[] = eventsData.map(event => ({
      event: {
        id: event.id,
        user_id: event.user_id,
        event_date: event.event_date,
        event_time: event.event_time,
        area_id: event.area_id,
        participation_type: event.participation_type,
        status: event.status,
        created_at: event.created_at
      },
      profile: {
        id: event.profiles.id,
        user_id: event.profiles.user_id,
        nickname: event.profiles.nickname,
        age: event.profiles.age,
        gender: event.profiles.gender,
        bio: event.profiles.bio
      }
    }))

    // マッチング実行
    const matchedGroups = createBasicMatching(candidates)

    // マッチング統計を計算
    const stats = calculateMatchingStats(candidates, matchedGroups)

    // データベースにグループを保存
    const createdGroups = []
    for (const group of matchedGroups) {
      try {
        // グループを作成
        const { data: newGroup, error: groupError } = await supabase
          .from('groups')
          .insert({
            event_date: group.event_date,
            event_time: group.event_time,
            area_id: group.area_id,
            status: group.status
          })
          .select()
          .single()

        if (groupError) {
          console.error('Error creating group:', groupError)
          continue
        }

        // グループメンバーを追加
        const groupMembers = group.members.map(member => ({
          group_id: newGroup.id,
          user_id: member.profile.user_id
        }))

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(groupMembers)

        if (membersError) {
          console.error('Error adding group members:', membersError)
          // グループを削除してロールバック
          await supabase.from('groups').delete().eq('id', newGroup.id)
          continue
        }

        // 対応するイベントのステータスを更新
        const eventIds = group.members.map(member => member.event.id)
        const { error: eventUpdateError } = await supabase
          .from('events')
          .update({ status: 'matched' })
          .in('id', eventIds)

        if (eventUpdateError) {
          console.error('Error updating event status:', eventUpdateError)
        }

        createdGroups.push({
          ...newGroup,
          members: group.members.map(m => ({
            user_id: m.profile.user_id,
            nickname: m.profile.nickname,
            age: m.profile.age,
            gender: m.profile.gender
          }))
        })

        // マッチング成立通知を送信
        try {
          await sendMatchingNotifications(newGroup, group.members)
        } catch (notificationError) {
          console.error('Error sending match notifications:', notificationError)
        }

      } catch (error) {
        console.error('Error processing group:', error)
        continue
      }
    }

    return NextResponse.json({
      message: `Matching completed. Created ${createdGroups.length} groups.`,
      groups: createdGroups,
      stats: {
        ...stats,
        actualGroupsCreated: createdGroups.length
      }
    })

  } catch (error: any) {
    console.error('Matching execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// マッチング成立通知を送信
async function sendMatchingNotifications(group: any, members: MatchingCandidate[]) {
  const supabase = createServerSupabaseClient()

  try {
    // グループメンバーの通知設定とLINE情報を取得
    const userIds = members.map(m => m.profile.user_id)

    const { data: usersData, error } = await supabase
      .from('users')
      .select(`
        id,
        line_user_id,
        notification_settings (
          match_notifications,
          chat_notifications,
          reminder_notifications,
          line_connected
        )
      `)
      .in('id', userIds)

    if (error) {
      throw error
    }

    // 通知データを準備
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    }

    const notificationData = {
      date: formatDate(group.event_date),
      time: group.event_time,
      memberCount: members.length,
      chatUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${group.id}`
    }

    // ユーザー通知リストを作成
    const userNotifications = usersData.map(user => ({
      lineUserId: user.line_user_id,
      settings: (user.notification_settings && user.notification_settings.length > 0)
        ? user.notification_settings[0]
        : {
            match_notifications: true,
            chat_notifications: true,
            reminder_notifications: true,
            line_connected: false
          }
    }))

    // 一括通知送信
    const result = await sendBulkNotification(
      userNotifications,
      {
        type: 'match_success',
        data: notificationData
      }
    )

    console.log(`Match notifications sent: ${result.success} success, ${result.failed} failed`)

  } catch (error) {
    console.error('Error in sendMatchingNotifications:', error)
    throw error
  }
}