import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { sendNotification } from '@/lib/line-notify'

const CRON_SECRET = process.env.CRON_JOB_SECRET

type AckRecord = {
  match_id: string
  user_id: string
  initial_notification_sent_at: string | null
  acknowledged_at: string | null
  reminder_sent_at: string | null
  groups?: {
    event_date: string
    event_time: string
  } | null
}

type PenaltyLogRecord = {
  match_id: string
  user_id: string
}

export async function POST(request: NextRequest) {
  if (CRON_SECRET) {
    const headerKey = request.headers.get('x-cron-secret')
    const queryKey = request.nextUrl.searchParams.get('key')
    if (headerKey !== CRON_SECRET && queryKey !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const warningHours = Number(process.env.MATCH_ACK_WARNING_HOURS || 24)
  const penaltyPoints = Number(process.env.MATCH_ACK_PENALTY_POINTS || 1)

  const serviceSupabase = createServiceSupabaseClient()

  const { data: ackRecords, error: ackError } = await serviceSupabase
    .from('match_acknowledgements')
    .select('match_id, user_id, initial_notification_sent_at, acknowledged_at, reminder_sent_at, groups!match_acknowledgements_match_id_fkey(event_date, event_time)')
    .is('acknowledged_at', null)
    .returns<AckRecord[]>()

  if (ackError) {
    console.error('Failed to fetch acknowledgement records:', ackError)
    return NextResponse.json({ error: 'Failed to fetch acknowledgements' }, { status: 500 })
  }

  if (!ackRecords || ackRecords.length === 0) {
    return NextResponse.json({ message: 'No pending acknowledgements found', warningsSent: 0, penaltiesApplied: 0 })
  }

  const matchIds = Array.from(new Set(ackRecords.map(record => record.match_id)))

  const { data: penaltyLogs, error: penaltyLogError } = await serviceSupabase
    .from('penalty_logs')
    .select('match_id, user_id')
    .in('match_id', matchIds)
    .returns<PenaltyLogRecord[]>()

  if (penaltyLogError) {
    console.error('Failed to fetch penalty logs:', penaltyLogError)
    return NextResponse.json({ error: 'Failed to fetch penalty logs' }, { status: 500 })
  }

  const penaltyAppliedMap = new Set(penaltyLogs?.map(log => `${log.match_id}:${log.user_id}`) ?? [])

  let warningsSent = 0
  let penaltiesApplied = 0
  const lineUserCache = new Map<string, { line_user_id: string | null; line_friend_flag: boolean | null }>()

  for (const ack of ackRecords) {
    if (!ack.groups) continue

    const eventDateTime = buildEventDate(ack.groups.event_date, ack.groups.event_time)
    if (!eventDateTime) continue

    const now = new Date()
    const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const lineUser = await fetchLineUser(serviceSupabase, ack.user_id, lineUserCache)

    if (!lineUser?.line_user_id || !lineUser.line_friend_flag) {
      continue
    }

    // Send reminder if within warning window and not already sent
    if (hoursUntilEvent <= warningHours && hoursUntilEvent > 0 && !ack.reminder_sent_at) {
      const template = {
        type: 'penalty_warning' as const,
        data: {
          date: ack.groups.event_date,
          time: ack.groups.event_time
        }
      }

      const sent = await sendNotification(lineUser.line_user_id, template)
      if (sent) {
        warningsSent++
        await serviceSupabase
          .from('match_acknowledgements')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('match_id', ack.match_id)
          .eq('user_id', ack.user_id)
      }
      continue
    }

    // Apply penalty if event passed and not acknowledged
    if (now >= eventDateTime && !penaltyAppliedMap.has(`${ack.match_id}:${ack.user_id}`)) {
      const { newLevel } = await decrementUserLevel(serviceSupabase, ack.user_id, penaltyPoints)

      await serviceSupabase.from('penalty_logs').insert({
        user_id: ack.user_id,
        match_id: ack.match_id,
        penalty_type: 'no_acknowledgement',
        points_delta: -penaltyPoints,
        detail: `Match acknowledgement not confirmed before event on ${ack.groups.event_date} ${ack.groups.event_time}`
      })

      penaltyAppliedMap.add(`${ack.match_id}:${ack.user_id}`)
      penaltiesApplied++

      const template = {
        type: 'penalty_applied' as const,
        data: {
          date: ack.groups.event_date,
          time: ack.groups.event_time,
          penaltyPoints,
          level: newLevel
        }
      }

      await sendNotification(lineUser.line_user_id, template)
    }
  }

  return NextResponse.json({
    message: 'Penalty job completed',
    warningsSent,
    penaltiesApplied
  })
}

async function fetchLineUser(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  userId: string,
  cache: Map<string, { line_user_id: string | null; line_friend_flag: boolean | null }>
) {
  if (cache.has(userId)) {
    return cache.get(userId) || null
  }

  const { data, error } = await supabase
    .from('users')
    .select('line_user_id, line_friend_flag')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch user line info:', error)
    return null
  }

  cache.set(userId, data || { line_user_id: null, line_friend_flag: null })
  return data
}

async function decrementUserLevel(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  userId: string,
  penaltyPoints: number
) {
  const { data, error } = await supabase
    .from('users')
    .select('level')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch user level:', error)
    return { newLevel: null }
  }

  const currentLevel = data?.level ?? 0
  const newLevel = currentLevel - penaltyPoints

  const { error: updateError } = await supabase
    .from('users')
    .update({ level: newLevel })
    .eq('id', userId)

  if (updateError) {
    console.error('Failed to update user level:', updateError)
  }

  return { newLevel }
}

function buildEventDate(eventDate: string | null, eventTime: string | null): Date | null {
  if (!eventDate || !eventTime) return null

  const iso = `${eventDate}T${eventTime}`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}
