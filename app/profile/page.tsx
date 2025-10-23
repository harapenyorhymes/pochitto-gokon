'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { signInWithLine } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

type Profile = {
  id: string
  nickname: string
  age: number
  gender: 'male' | 'female'
  bio: string
  is_complete: boolean
  created_at: string
  updated_at: string
}

type LineStatus = {
  lineUserId: string | null
  friendFlag: boolean
  lineFriendCheckedAt: string | null
  lineLinkedAt: string | null
  level: number
}

type PenaltyLog = {
  id: string
  penalty_type: string
  points_delta: number
  detail: string | null
  processed_at: string
  match_id: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [lineStatus, setLineStatus] = useState<LineStatus | null>(null)
  const [penaltyLogs, setPenaltyLogs] = useState<PenaltyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' })
        const result = await response.json()

        if (!response.ok || result.success === false) {
          throw new Error(result.error || 'プロフィールの取得に失敗しました')
        }

        setProfile(result.data)
        setLineStatus(result.lineStatus ?? null)
        setPenaltyLogs(Array.isArray(result.penaltyLogs) ? result.penaltyLogs : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '-'
    try {
      return new Date(value).toLocaleString('ja-JP')
    } catch {
      return value
    }
  }

  const handleLineReconnect = () => {
    signInWithLine('/profile')
  }

  const lineStatusDescription = useMemo(() => {
    if (!lineStatus) return '未連携'
    return lineStatus.friendFlag ? '友だち追加済み' : '友だち未追加'
  }, [lineStatus])

  if (loading) {
    return (
      <AuthGuard requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-r-transparent" />
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-sm w-full rounded-2xl bg-white shadow p-6 text-center space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-md bg-pink-600 px-4 py-2 text-white font-medium hover:bg-pink-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!profile) {
    return (
      <AuthGuard requireAuth>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-sm p-10 text-center space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">プロフィールが未作成です</h1>
              <p className="text-sm text-gray-600">
                素敵な出会いのために、まずはプロフィールを登録しましょう。
              </p>
              <Link
                href="/profile/create"
                className="inline-flex items-center justify-center rounded-md bg-pink-600 px-6 py-3 text-white font-medium hover:bg-pink-700"
              >
                プロフィールを作成
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm p-10 space-y-10">
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
                <p className="mt-1 text-sm text-gray-500">
                  最終更新: {formatDateTime(profile.updated_at)}
                </p>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex items-center justify-center rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
              >
                編集する
              </Link>
            </header>

            <section className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-pink-100 bg-pink-50 px-5 py-4">
                <h2 className="text-xs font-semibold text-pink-600 uppercase tracking-wide">
                  現在のレベル
                </h2>
                <p className="mt-2 text-3xl font-bold text-pink-700">
                  {lineStatus?.level ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-1">
                <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  LINE連携
                </h2>
                <p className="text-lg font-medium text-gray-900">{lineStatusDescription}</p>
                <p className="text-sm text-gray-500">
                  LINE ID: {lineStatus?.lineUserId ?? '未連携'}
                </p>
                <p className="text-xs text-gray-400">
                  最終チェック: {formatDateTime(lineStatus?.lineFriendCheckedAt)}
                </p>
                <button
                  type="button"
                  onClick={handleLineReconnect}
                  className="inline-flex items-center justify-center rounded-md border border-pink-400 px-3 py-1.5 text-xs font-medium text-pink-500 hover:bg-pink-50"
                >
                  LINE連携を更新
                </button>
              </div>
            </section>

            <section className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  ニックネーム
                </h3>
                <p className="mt-2 text-lg text-gray-900">{profile.nickname}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    年齢
                  </h3>
                  <p className="mt-2 text-lg text-gray-900">{profile.age}歳</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    性別
                  </h3>
                  <p className="mt-2 text-lg text-gray-900">
                    {profile.gender === 'male' ? '男性' : '女性'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  自己紹介
                </h3>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-900">
                  {profile.bio}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">減点履歴</h2>
              {penaltyLogs.length === 0 ? (
                <p className="text-sm text-gray-500">減点履歴はありません。</p>
              ) : (
                <div className="space-y-3">
                  {penaltyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <p className="text-sm text-gray-500">
                        {formatDateTime(log.processed_at)}
                      </p>
                      <p className="mt-1 text-gray-900">
                        {log.detail || '詳細は設定されていません'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-700">
                        変動: {log.points_delta}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-center">
              <Link
                href="/"
                className="text-pink-600 hover:text-pink-500 text-sm font-medium"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
