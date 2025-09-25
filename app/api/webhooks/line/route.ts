import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

interface LineWebhookEvent {
  type: string
  source: {
    type: string
    userId?: string
  }
  timestamp: number
  mode: string
  webhookEventId: string
}

interface LineWebhookBody {
  destination: string
  events: LineWebhookEvent[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')

    // Webhook署名検証
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const webhookData: LineWebhookBody = JSON.parse(body)
    const supabase = createServerSupabaseClient()

    // 各イベントを処理
    for (const event of webhookData.events) {
      try {
        await handleLineEvent(event, supabase)
      } catch (error) {
        console.error('Error handling LINE event:', error)
        // 個別のエラーは続行する
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('LINE Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Webhook署名検証
 */
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false

  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) {
    console.warn('LINE_CHANNEL_SECRET is not set')
    return false
  }

  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body, 'utf8')
    .digest('base64')

  return signature === hash
}

/**
 * LINEイベントを処理
 */
async function handleLineEvent(event: LineWebhookEvent, supabase: any) {
  const { type, source } = event

  switch (type) {
    case 'follow':
      await handleFollowEvent(source.userId!, supabase)
      break

    case 'unfollow':
      await handleUnfollowEvent(source.userId!, supabase)
      break

    case 'message':
      // メッセージイベント（将来実装）
      console.log('Message event received:', event)
      break

    default:
      console.log('Unhandled event type:', type)
  }
}

/**
 * 友達追加イベント処理
 */
async function handleFollowEvent(lineUserId: string, supabase: any) {
  try {
    // LINE User IDでユーザーを検索
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError
    }

    if (existingUser) {
      // 既存ユーザーの場合、LINE連携をONにする
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: existingUser.id,
          line_connected: true
        })

      console.log(`LINE re-connected for user: ${existingUser.id}`)
    } else {
      // 新規ユーザーの場合、ウェルカムメッセージを送信（将来実装）
      console.log(`New LINE user followed: ${lineUserId}`)
    }

  } catch (error) {
    console.error('Error handling follow event:', error)
    throw error
  }
}

/**
 * 友達削除/ブロックイベント処理
 */
async function handleUnfollowEvent(lineUserId: string, supabase: any) {
  try {
    // LINE User IDでユーザーを検索
    const { data: user, error: searchError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single()

    if (searchError) {
      if (searchError.code === 'PGRST116') {
        // ユーザーが見つからない場合は何もしない
        return
      }
      throw searchError
    }

    // LINE連携をOFFにする
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        line_connected: false
      })

    console.log(`LINE disconnected for user: ${user.id}`)

  } catch (error) {
    console.error('Error handling unfollow event:', error)
    throw error
  }
}