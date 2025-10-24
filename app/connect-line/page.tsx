'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { signInWithLine } from '@/lib/auth'

const DEFAULT_RETURN_TO = '/events'

export default function ConnectLinePage() {
  const [returnTo, setReturnTo] = useState<string>(DEFAULT_RETURN_TO)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const next = params.get('returnTo')

    if (next && next.startsWith('/')) {
      setReturnTo(next)
    }
  }, [])

  const handleConnect = () => {
    signInWithLine(returnTo)
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 text-pink-500 text-2xl">
              💌
            </div>
            <h1 className="text-2xl font-bold text-gray-900">LINE連携を完了しましょう</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              マッチ通知などのお知らせをLINEで受け取るため、公式アカウントと連携してください。
            </p>
          </div>

          <button
            type="button"
            onClick={handleConnect}
            className="w-full rounded-xl bg-green-500 px-4 py-3 text-white font-semibold shadow hover:bg-green-600 transition"
          >
            LINEで連携する
          </button>

          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
            <p>・LINEログインの同意画面が表示されたら「許可する」を選択してください。</p>
            <p>・連携完了後は自動的に元の画面へ戻ります。</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
