'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { ProfileForm } from '@/components/ProfileForm'
import { ProfileFormData } from '@/lib/validations/profile'

export default function CreateProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

      // 成功時はダッシュボードにリダイレクト
      router.push('/?success=profile-created')
    } catch (error) {
      throw error // ProfileFormのエラーハンドリングに任せる
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">プロフィール作成</h1>
              <p className="mt-2 text-gray-600">
                素敵な出会いのために、あなたのことを教えてください
              </p>
            </div>

            <ProfileForm onSubmit={handleSubmit} isLoading={isLoading} />

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                プロフィールは後から編集できます
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}