import { createServiceSupabaseClient } from '@/lib/supabase-server'

export interface LineNotificationPayload {
  to: string // LINE User ID
  messages: LineMessage[]
}

export interface LineMessage {
  type: 'text' | 'template'
  text?: string
  template?: any
}

export interface NotificationTemplate {
  type: 'match_success' | 'chat_created' | 'reminder' | 'penalty_warning' | 'penalty_applied'
  data: Record<string, any>
}

export interface NotificationSettings {
  match_notifications: boolean
  chat_notifications: boolean
  reminder_notifications: boolean
  line_connected: boolean
}

/**
 * LINE Messaging APIクライアント
 */
export class LineNotificationService {
  private channelAccessToken: string
  private baseUrl = 'https://api.line.me/v2/bot'

  constructor() {
    this.channelAccessToken =
      process.env.LINE_MESSAGING_ACCESS_TOKEN ||
      process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      ''

    if (!this.channelAccessToken) {
      console.warn('LINE_MESSAGING_ACCESS_TOKEN is not set. LINE notifications will be disabled.')
    }
  }

  /**
   * メッセージを送信
   */
  async sendMessage(payload: LineNotificationPayload): Promise<boolean> {
    if (!this.channelAccessToken) {
      console.log('LINE notifications disabled (no access token)')
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/message/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('LINE API Error:', response.status, errorData)
        return false
      }

      return true

    } catch (error) {
      console.error('Error sending LINE message:', error)
      return false
    }
  }

  /**
   * テンプレートからメッセージを生成
   */
  createMessageFromTemplate(template: NotificationTemplate): LineMessage[] {
    switch (template.type) {
      case 'match_success':
        return this.createMatchSuccessMessage(template.data)

      case 'chat_created':
        return this.createChatCreatedMessage(template.data)

      case 'reminder':
        return this.createReminderMessage(template.data)

      case 'penalty_warning':
        return this.createPenaltyWarningMessage(template.data)

      case 'penalty_applied':
        return this.createPenaltyAppliedMessage(template.data)

      default:
        return [{
          type: 'text',
          text: 'ポチッと合コンからお知らせです'
        }]
    }
  }

  /**
   * マッチング成立通知メッセージ
   */
  private createMatchSuccessMessage(data: any): LineMessage[] {
    const { date, time, memberCount, chatUrl } = data

    const lines = [
      'Great news! A group date has been confirmed.',
      'Date: ' + date + ' ' + time,
      'Participants: ' + memberCount
    ]

    if (chatUrl) {
      lines.push('Chat room: ' + chatUrl)
    }

    const message = lines.join('\n')

    return [{
      type: 'text',
      text: message
    }]
  }

  /**
   * チャットルーム作成通知メッセージ
   */
  private createChatCreatedMessage(data: any): LineMessage[] {
    const { chatUrl } = data

    const message = `💬 チャットルームが作成されました

合コンメンバーとの交流を始めましょう！
自己紹介や当日の話をして盛り上がってください。

📱 チャットを開く: ${chatUrl}`

    return [{
      type: 'text',
      text: message
    }]
  }

  /**
   * リマインド通知メッセージ
   */
  private createReminderMessage(data: any): LineMessage[] {
    const { date, time, location } = data

    const message = 'Reminder: your group date is coming soon!\nDate: ' + date + ' ' + time + '\nPlace: ' + location + '\n\nGet ready and have fun!'

    return [{
      type: 'text',
      text: message
    }]
  }

  private createPenaltyWarningMessage(data: any): LineMessage[] {
    const { date, time } = data

    const message = 'Your group date is approaching.\nDate: ' + date + ' ' + time + '\n\nPlease confirm the match in the app. If the start time passes without confirmation, your level will decrease.'

    return [{
      type: 'text',
      text: message
    }]
  }

  private createPenaltyAppliedMessage(data: any): LineMessage[] {
    const { date, time, penaltyPoints, level } = data

    const message = 'We could not confirm your participation.\nDate: ' + date + ' ' + time + '\nPenalty: -' + penaltyPoints + ' level point(s)\nCurrent level: ' + level + '\n\nPlease confirm future matches before the start time.'

    return [{
      type: 'text',
      text: message
    }]
  }

  /**
   * ユーザーがボットを友達追加しているかチェック
   */
  async checkFriendship(lineUserId: string): Promise<boolean> {
    if (!this.channelAccessToken) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/profile/${lineUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
        },
      })

      return response.ok

    } catch (error) {
      console.error('Error checking LINE friendship:', error)
      return false
    }
  }
}

/**
 * 通知を送信する共通関数
 */
export async function sendNotification(
  lineUserId: string | null,
  template: NotificationTemplate,
  userSettings?: NotificationSettings
): Promise<boolean> {
  if (!lineUserId) {
    console.log('Skipping notification: LINE user ID is missing')
    return false
  }

  if (userSettings) {
    if (!userSettings.line_connected) {
      console.log('Skipping notification: LINE not connected in settings')
      return false
    }

    const shouldSend = checkNotificationSettings(template.type, userSettings)
    if (!shouldSend) {
      console.log(`Skipping notification: ${template.type} notifications disabled`)
      return false
    }
  }

  const lineService = new LineNotificationService()
  const messages = lineService.createMessageFromTemplate(template)

  const payload: LineNotificationPayload = {
    to: lineUserId,
    messages
  }

  const result = await lineService.sendMessage(payload)

  if (typeof window === 'undefined') {
    await logLineMessage(lineUserId, messages, result ? 'sent' : 'failed')
  }

  return result
}

/**

/**
 * 通知設定をチェック
 */
function checkNotificationSettings(
  notificationType: string,
  settings: NotificationSettings
): boolean {
  switch (notificationType) {
    case 'match_success':
      return settings.match_notifications

    case 'chat_created':
      return settings.chat_notifications

    case 'reminder':
      return settings.reminder_notifications

    case 'penalty_warning':
    case 'penalty_applied':
      return true

    default:
      return false
  }
}

/**
 * 複数ユーザーに一括通知
 */
export async function sendBulkNotification(
  userNotifications: Array<{
    lineUserId: string | null
    settings: NotificationSettings
  }>,
  template: NotificationTemplate
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // 並列実行で通知を送信（API制限を考慮して適度な制限をかける）
  const chunks = chunkArray(userNotifications, 5) // 5件ずつ処理

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ lineUserId, settings }) => {
      try {
        const result = await sendNotification(lineUserId, template, settings)
        return result ? 'success' : 'failed'
      } catch (error) {
        return 'failed'
      }
    })

    const results = await Promise.all(promises)
    success += results.filter(r => r === 'success').length
    failed += results.filter(r => r === 'failed').length

    // 次のチャンクまで少し待機（API制限対策）
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return { success, failed }
}

async function logLineMessage(lineUserId: string, messages: LineMessage[], status: 'sent' | 'failed') {
  try {
    const supabase = createServiceSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .maybeSingle()

    if (!user?.id) {
      return
    }

    await supabase.from('line_message_logs').insert({
      user_id: user.id,
      message_type: messages[0]?.type ?? 'text',
      message_payload: { messages },
      status
    })
  } catch (error) {
    console.error('Failed to log LINE message:', error)
  }
}

/**
 * 配列をチャンクに分割
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
