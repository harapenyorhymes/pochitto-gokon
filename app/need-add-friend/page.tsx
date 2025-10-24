'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { signInWithLine } from '@/lib/auth'

const DEFAULT_RETURN_TO = '/events'
const RAW_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_ADD_URL
const FRIEND_URL =
  RAW_FRIEND_URL && !RAW_FRIEND_URL.includes('YOUR_OFFICIAL_ACCOUNT_ID') ? RAW_FRIEND_URL : null

const TEXT = {
  icon: '\ud83c\udf1f',
  title: '\u53cb\u3060\u3061\u8ffd\u52a0\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044',
  description:
    '\u516c\u5f0f\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u53cb\u3060\u3061\u8ffd\u52a0\u3059\u308b\u3068\u3001\u30de\u30c3\u30c1\u901a\u77e5\u3092LINE\u3067\u3082\u53d7\u3051\u53d6\u308c\u307e\u3059\u3002\u8ffd\u52a0\u5f8c\u306f\u300c\u78ba\u8a8d\u3059\u308b\u300d\u30dc\u30bf\u30f3\u3067\u518d\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
  friendButton: '\u53cb\u3060\u3061\u8ffd\u52a0\u30da\u30fc\u30b8\u3092\u958b\u304f',
  friendMissing: 'LINE\u53cb\u3060\u3061\u8ffd\u52a0URL\u304c\u8a2d\u5b9a\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002\u7ba1\u7406\u8005\u306b\u304a\u554f\u3044\u5408\u308f\u305b\u304f\u3060\u3055\u3044\u3002',
  recheckButton: '\u53cb\u3060\u3061\u8ffd\u52a0\u6e08\u307f\u3092\u78ba\u8a8d\u3059\u308b',
  note1: '\u53cb\u3060\u3061\u8ffd\u52a0\u5f8c\u306b\u30d6\u30e9\u30a6\u30b6\u30fc\u3092\u623b\u308a\u3001\u300c\u78ba\u8a8d\u3059\u308b\u300d\u30dc\u30bf\u30f3\u3067\u518d\u30c1\u30a7\u30c3\u30af\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
  note2: '\u3046\u307e\u304f\u9077\u79fb\u3057\u306a\u3044\u5834\u5408\u306f\u30d6\u30e9\u30a6\u30b6\u3092\u518d\u8aad\u307f\u8fbc\u307f\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
}

export default function NeedAddFriendPage() {
  const [returnTo, setReturnTo] = useState<string>(DEFAULT_RETURN_TO)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const next = params.get('returnTo')

    if (next && next.startsWith('/')) {
      setReturnTo(next)
    }
  }, [])

  const handleOpenFriendPage = () => {
    if (!FRIEND_URL) {
      alert(TEXT.friendMissing)
      return
    }
    window.open(FRIEND_URL, '_blank', 'noreferrer')
  }

  const handleRecheck = () => {
    signInWithLine(returnTo)
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-2xl">
              {TEXT.icon}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{TEXT.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed">{TEXT.description}</p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenFriendPage}
              className="w-full rounded-xl bg-[#06C755] px-4 py-3 text-white font-semibold shadow hover:bg-[#05b04f] transition disabled:opacity-60"
              disabled={!FRIEND_URL}
            >
              {TEXT.friendButton}
            </button>
            {!FRIEND_URL && <p className="text-xs text-red-500">{TEXT.friendMissing}</p>}
            <button
              type="button"
              onClick={handleRecheck}
              className="w-full rounded-xl border border-pink-500 px-4 py-3 text-pink-500 font-semibold hover:bg-pink-50 transition"
            >
              {TEXT.recheckButton}
            </button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
            <p>{TEXT.note1}</p>
            <p>{TEXT.note2}</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
