'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmail, signInWithLine } from '@/lib/auth'
import { AuthGuard } from '@/components/AuthGuard'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const lineLoginEnabled = Boolean(process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await signInWithEmail(email, password)

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // 保留中のプロフィール情報があるかチェック
        const pendingProfile = localStorage.getItem('pendingProfile')
        if (pendingProfile) {
          try {
            const profileData = JSON.parse(pendingProfile)
            console.log('Found pending profile, saving:', profileData)

            const profileResponse = await fetch('/api/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(profileData),
            })

            if (profileResponse.ok) {
              console.log('Pending profile saved successfully')
              localStorage.removeItem('pendingProfile')
            } else {
              console.error('Failed to save pending profile')
            }
          } catch (err) {
            console.error('Error saving pending profile:', err)
          }
        }

        router.push('/')
      }
    } catch (err) {
      setError('ログインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleLineLogin = async () => {
    if (!lineLoginEnabled) {
      setError('LINEログインは現在利用できません')
      return
    }

    setError(null)
    setLineLoading(true)

    try {
      const { error } = await signInWithLine()
      if (error) {
        setError(error.message || 'LINEログインに失敗しました')
        setLineLoading(false)
      }
    } catch (err) {
      console.error('LINE login error:', err)
      setError('LINEログインに失敗しました。時間をおいて再度お試しください。')
      setLineLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">ポチッと合コン</h1>
            <p className="mt-2 text-gray-600">アカウントにログイン</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  placeholder="your@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  placeholder="パスワード"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            {lineLoginEnabled && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="px-4 text-sm text-gray-500">または</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleLineLogin}
                  disabled={lineLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lineLoading ? 'LINEで処理中...' : 'LINEでログイン'}
                </button>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちでない方は{' '}
                <Link href="/signup" className="text-pink-600 hover:text-pink-500 font-medium">
                  新規登録
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}
