import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { sendNotification } from '@/lib/line-notify'

const CRON_SECRET = process.env.CRON_JOB_SECRET

type GroupRecord = {
  id: string
  event_date: string
  event_time: string
  created_at: string
}

type MemberRecord = {
  group_id: string
  user_id: string
  users?: {
    line_user_id: string | null
    line_friend_flag: boolean | null
  } | null
}

type AckRecord = {
  match_id: string
  user_id: string
  initial_notification_sent_at: string | null
  acknowledged_at: string | null
  reminder_sent_at: string | null
}

export async function POST(request: NextRequest) {
  if (CRON_SECRET) {
    const headerKey = request.headers.get('x-cron-secret')
    const queryKey = request.nextUrl.searchParams.get('key')
    if (headerKey !== CRON_SECRET && queryKey !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const serviceSupabase = createServiceSupabaseClient()
  const lookbackMinutes = Number(process.env.MATCH_PUSH_LOOKBACK_MINUTES || 120)
  const lookbackIso = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString()

  const { data: groups, error: groupError } = await serviceSupabase
    .from('groups')
    .select('id, event_date, event_time, created_at')
    .eq('status', 'formed')
    .gte('created_at', lookbackIso)
    .returns<GroupRecord[]>()

  if (groupError) {
    console.error('Failed to fetch recent groups:', groupError)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }

  if (!groups || groups.length === 0) {
    return NextResponse.json({ message: 'No recent matches found', sent: 0, skipped: 0 })
  }

  const groupIds = groups.map(group => group.id)

  const { data: members, error: membersError } = await serviceSupabase
    .from('group_members')
    .select('group_id, user_id, users!group_members_user_id_fkey(line_user_id, line_friend_flag)')
    .in('group_id', groupIds)
    .returns<MemberRecord[]>()

  if (membersError) {
    console.error('Failed to fetch group members:', membersError)
    return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 })
  }

  const { data: ackRecords, error: ackError } = await serviceSupabase
    .from('match_acknowledgements')
    .select('match_id, user_id, initial_notification_sent_at, acknowledged_at, reminder_sent_at')
    .in('match_id', groupIds)
    .returns<AckRecord[]>()

  if (ackError) {
    console.error('Failed to fetch acknowledgement records:', ackError)
    return NextResponse.json({ error: 'Failed to fetch acknowledgements' }, { status: 500 })
  }

  const ackMap = new Map<string, AckRecord>()
  ackRecords?.forEach(record => {
    ackMap.set(`${record.match_id}:${record.user_id}`, record)
  })

  const membersByGroup = new Map<string, MemberRecord[]>()
  members?.forEach(member => {
    const list = membersByGroup.get(member.group_id) || []
    list.push(member)
    membersByGroup.set(member.group_id, list)
  })

  let sent = 0
  let skipped = 0

  for (const group of groups) {
    const groupMembers = membersByGroup.get(group.id) ?? []

    for (const member of groupMembers) {
      const memberKey = `${group.id}:${member.user_id}`
      const ackRecord = ackMap.get(memberKey)

      const lineUserId = member.users?.line_user_id ?? null
      const friendFlag = member.users?.line_friend_flag ?? false

      if (!lineUserId || !friendFlag) {
        skipped++
        continue
      }

      if (ackRecord?.initial_notification_sent_at) {
        skipped++
        continue
      }

      const memberCount = groupMembers.length
      const template = {
        type: 'match_success' as const,
        data: {
          date: group.event_date,
          time: group.event_time,
          memberCount
        }
      }

      const notificationSent = await sendNotification(lineUserId, template)

      if (notificationSent) {
        sent++
        if (ackRecord) {
          await serviceSupabase
            .from('match_acknowledgements')
            .update({ initial_notification_sent_at: new Date().toISOString() })
            .eq('match_id', group.id)
            .eq('user_id', member.user_id)
        } else {
          await serviceSupabase.from('match_acknowledgements').insert({
            match_id: group.id,
            user_id: member.user_id,
            initial_notification_sent_at: new Date().toISOString()
          })
        }
      } else {
        skipped++
      }
    }
  }

  return NextResponse.json({ message: 'Match notifications processed', sent, skipped })
}
