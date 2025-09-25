'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'

interface Profile {
  id: string
  nickname: string
  age: number
  gender: 'male' | 'female'
  bio: string
  is_complete: boolean
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'プロフィールの取得に失敗しました')
        }

        setProfile(result.data)
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

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md"
            >
              再試行
            </button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!profile) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                プロフィールがまだ作成されていません
              </h1>
              <p className="text-gray-600 mb-8">
                素敵な出会いのために、まずはプロフィールを作成しましょう
              </p>
              <Link
                href="/profile/create"
                className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-6 rounded-md"
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
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-between items-start mb-8">
              <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
              <Link
                href="/profile/edit"
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                編集
              </Link>
            </div>

            <div className="space-y-6">
              {/* ニックネーム */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  ニックネーム
                </h3>
                <p className="mt-1 text-lg text-gray-900">{profile.nickname}</p>
              </div>

              {/* 年齢・性別 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    年齢
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">{profile.age}歳</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    性別
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {profile.gender === 'male' ? '男性' : '女性'}
                  </p>
                </div>
              </div>

              {/* 自己紹介 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  自己紹介
                </h3>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
              </div>

              {/* 更新日時 */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  最終更新: {new Date(profile.updated_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard"
                className="text-pink-600 hover:text-pink-500 font-medium"
              >
                ← ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}