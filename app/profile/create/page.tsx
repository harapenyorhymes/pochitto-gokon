'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { ProfileForm } from '@/components/ProfileForm'
import { ProfileFormData } from '@/lib/validations/profile'
import { useAuth } from '@/contexts/AuthContext'

export default function CreateProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [fromLine, setFromLine] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setFromLine(params.get('source') === 'line')
  }, [])

  const initialProfileData = useMemo<Partial<ProfileFormData> | undefined>(() => {
    if (!user) return undefined

    const metadata = user.user_metadata as Record<string, unknown> | undefined
    if (!metadata) return undefined

    // LINEログインの場合は display_name を使用
    const nickname =
      typeof metadata.display_name === 'string' ? metadata.display_name :
      typeof metadata.name === 'string' ? metadata.name :
      undefined

    const bio = typeof metadata.statusMessage === 'string' ? metadata.statusMessage : undefined

    console.log('Initial profile data from metadata:', { nickname, bio, metadata })

    if (!nickname && !bio) return undefined

    return {
      ...(nickname ? { nickname } : {}),
      ...(bio ? { bio } : {})
    }
  }, [user])

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)

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
        throw new Error(result.error || 'プロフィールの保存に失敗しました')
      }

      router.push('/?success=profile-created')
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">プロフィール作成</h1>
                <p className="mt-2 text-gray-600">
                  素敵な出会いのために、あなたのことを教えてください
                </p>
              </div>

              {fromLine && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  LINEで取得した表示名などを初期入力しています。内容を確認し、プロフィールを完成させてください。
                </div>
              )}
            </div>

            <ProfileForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              initialData={initialProfileData}
            />

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                プロフィールは後から編集もできます
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
