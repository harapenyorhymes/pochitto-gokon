'use client'

import { useState } from 'react'

interface InvitationCodeDisplayProps {
  code: string
  eventId: string
  eventDate: string
  eventTime: string
}

export default function InvitationCodeDisplay({
  code,
  eventId,
  eventDate,
  eventTime
}: InvitationCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitationUrl = `${appUrl}/invite/${code}`

  const invitationMessage = `🎉 ポチッと合コンに一緒に参加しない？

📅 日程: ${eventDate} ${eventTime}
📍 エリア: 名古屋栄

招待コード: ${code}

${invitationUrl}

※このコードで登録すると、一緒にマッチングされるよ！`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShareToLine = () => {
    const encodedMessage = encodeURIComponent(invitationMessage)
    const lineUrl = `https://line.me/R/msg/text/?${encodedMessage}`
    window.open(lineUrl, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          友達を招待
        </h3>
        <p className="text-sm text-gray-600">
          招待コードを友達に送って、一緒に合コンに参加しよう！
        </p>
      </div>

      {/* 招待コード表示 */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-600 mb-2">あなたの招待コード</p>
        <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent tracking-wider">
          {code}
        </div>
      </div>

      {/* イベント情報 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex items-center text-sm">
          <span className="text-gray-600 w-16">📅 日程</span>
          <span className="font-medium text-gray-900">{eventDate} {eventTime}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-600 w-16">📍 場所</span>
          <span className="font-medium text-gray-900">名古屋栄エリア</span>
        </div>
      </div>

      {/* 共有ボタン */}
      <div className="space-y-3">
        <button
          onClick={handleShareToLine}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#06C755] hover:bg-[#05b34d] text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-98"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINEで送る
        </button>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-all duration-200 active:scale-98"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">コピーしました！</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>招待メッセージをコピー</span>
            </>
          )}
        </button>
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-xs text-blue-900 leading-relaxed">
          <span className="font-bold">💡 ヒント：</span><br />
          招待コードは7日間有効で、最大5人まで使用できます。友達が登録する際にこのコードを入力すると、自動的に同じグループに参加します。
        </p>
      </div>
    </div>
  )
}
