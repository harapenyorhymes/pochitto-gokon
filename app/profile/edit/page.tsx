'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { ProfileForm } from '@/components/ProfileForm'
import { ProfileFormData } from '@/lib/validations/profile'
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

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'プロフィールの更新に失敗しました')
      }

      // 成功時はプロフィール表示ページにリダイレクト
      router.push('/profile?success=profile-updated')
    } catch (error) {
      throw error // ProfileFormのエラーハンドリングに任せる
    } finally {
      setIsSubmitting(false)
    }
  }

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
                編集するプロフィールがありません。まずはプロフィールを作成しましょう。
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
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">プロフィール編集</h1>
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-500 font-medium"
              >
                キャンセル
              </Link>
            </div>

            <ProfileForm
              initialData={profile}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              isEdit={true}
            />

            <div className="mt-8 text-center">
              <Link
                href="/profile"
                className="text-pink-600 hover:text-pink-500 font-medium"
              >
                ← プロフィールを見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}