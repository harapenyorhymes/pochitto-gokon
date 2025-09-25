import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id

    // グループ情報を取得（ユーザーがメンバーかどうかも確認）
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner (
          user_id,
          joined_at,
          profiles (
            nickname,
            age,
            gender,
            bio
          )
        )
      `)
      .eq('id', groupId)
      .eq('group_members.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 })
      }
      throw error
    }

    // 他のメンバー情報も取得
    const { data: allMembers, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        joined_at,
        profiles (
          nickname,
          age,
          gender,
          bio
        )
      `)
      .eq('group_id', groupId)

    if (membersError) {
      throw membersError
    }

    return NextResponse.json({
      group: {
        ...group,
        all_members: allMembers
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const body = await request.json()
    const { status } = body

    if (!status || !['formed', 'active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // ユーザーがグループメンバーかどうか確認
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // グループステータスを更新
    const { data: group, error } = await supabase
      .from('groups')
      .update({ status })
      .eq('id', groupId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ group })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}