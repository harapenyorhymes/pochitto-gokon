'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpWithEmail } from '@/lib/auth'
import { AuthGuard } from '@/components/AuthGuard'
import { signupWithProfileSchema, SignupWithProfileFormData, calculateAge } from '@/lib/validations/profile'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [currentAge, setCurrentAge] = useState<number | null>(null)
  const [invitationCode, setInvitationCode] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors
  } = useForm<SignupWithProfileFormData>({
    resolver: zodResolver(signupWithProfileSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      nickname: '',
      birthDate: '',
      gender: undefined,
      bio: ''
    },
    mode: 'onChange'
  })

  const watchedBirthDate = watch('birthDate')
  const watchedBio = watch('bio')

  // URLパラメータから招待コードを取得
  useEffect(() => {
    const inviteCode = searchParams.get('inviteCode') || localStorage.getItem('pendingInvitationCode')
    if (inviteCode) {
      setInvitationCode(inviteCode)
      localStorage.removeItem('pendingInvitationCode')
    }
  }, [searchParams])

  // 生年月日が変更されたときに年齢を計算
  useEffect(() => {
    if (watchedBirthDate) {
      try {
        const age = calculateAge(watchedBirthDate)
        setCurrentAge(age)
        clearErrors('birthDate')
      } catch {
        setCurrentAge(null)
      }
    } else {
      setCurrentAge(null)
    }
  }, [watchedBirthDate, clearErrors])

  const onSubmit = async (data: SignupWithProfileFormData) => {
    setLoading(true)

    try {
      // 1. Supabaseでアカウント作成
      const { data: authData, error: authError } = await signUpWithEmail(data.email, data.password)

      console.log('Auth data:', authData)
      console.log('Auth error:', authError)

      if (authError) {
        setError('root', { message: authError.message })
        return
      }

      if (!authData.user) {
        setError('root', { message: 'アカウントの作成に失敗しました' })
        return
      }

      // メール確認が必要な場合の処理
      if (!authData.session) {
        console.log('No session - email confirmation required')
        // プロフィール情報をローカルストレージに保存（メール確認後に使用）
        const profileData = {
          nickname: data.nickname,
          age: calculateAge(data.birthDate), // birthDateは保存せず、計算された年齢のみ
          gender: data.gender,
          bio: data.bio
        }
        localStorage.setItem('pendingProfile', JSON.stringify(profileData))
        setSuccess(true)
        return
      }

      // 2. プロフィール情報を保存
      const profileData = {
        nickname: data.nickname,
        age: calculateAge(data.birthDate), // birthDateは保存せず、計算された年齢のみ
        gender: data.gender,
        bio: data.bio
      }

      console.log('Attempting to save profile:', profileData)

      const profileResponse = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      console.log('Profile response status:', profileResponse.status)

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json()
        console.error('Profile save error:', errorData)
        setError('root', { message: errorData.error || 'プロフィールの保存に失敗しました' })
        return
      }

      const profileResult = await profileResponse.json()
      console.log('Profile saved successfully:', profileResult)

      // 3. 招待コードがある場合は自動参加
      if (invitationCode) {
        try {
          const joinResponse = await fetch('/api/invitations/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationCode }),
          })

          if (joinResponse.ok) {
            console.log('Successfully joined event with invitation code')
          } else {
            console.error('Failed to join event with invitation code')
          }
        } catch (err) {
          console.error('Error joining with invitation code:', err)
        }
      }

      setSuccess(true)
      // 3秒後にダッシュボードに移動
      setTimeout(() => {
        router.push('/')
      }, 3000)

    } catch (error) {
      setError('root', { message: 'アカウント作成に失敗しました。もう一度お試しください。' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
            <div className="text-green-600">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">アカウント作成完了</h2>
              <p className="mt-2 text-gray-600">
                確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。
              </p>
              <p className="mt-4 text-sm text-gray-500">
                3秒後にログインページに移動します...
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">ポチッと合コン</h1>
              <p className="mt-2 text-gray-600">新規会員登録とプロフィール作成</p>
              {invitationCode && (
                <div className="mt-4 inline-block bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl px-6 py-3 border border-pink-200">
                  <p className="text-xs text-gray-600 mb-1">招待コードで参加</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent tracking-wider">
                    {invitationCode}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.root.message}
                </div>
              )}

              {/* アカウント情報 */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">アカウント情報</h2>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    placeholder="your@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    id="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    placeholder="8文字以上（英数字と記号のみ）"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード確認 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('passwordConfirm')}
                    type="password"
                    id="passwordConfirm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    placeholder="パスワードを再入力"
                  />
                  {errors.passwordConfirm && (
                    <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm.message}</p>
                  )}
                </div>
              </div>

              {/* プロフィール情報 */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">プロフィール情報</h2>

                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                    ニックネーム <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('nickname')}
                    type="text"
                    id="nickname"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    placeholder="例：太郎、花子"
                  />
                  {errors.nickname && (
                    <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('birthDate')}
                    type="date"
                    id="birthDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                  <p className="mt-1 text-sm text-orange-600">
                    ⚠️ 生年月日は登録後に変更できませんので、正確に入力してください
                  </p>
                  {currentAge !== null && (
                    <p className="mt-1 text-sm text-green-600">現在の年齢: {currentAge}歳</p>
                  )}
                  {errors.birthDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    性別 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        {...register('gender')}
                        type="radio"
                        value="male"
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">男性</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('gender')}
                        type="radio"
                        value="female"
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">女性</span>
                    </label>
                  </div>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    自己紹介 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('bio')}
                    id="bio"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    placeholder="あなたの魅力や趣味、理想の出会いについて教えてください..."
                  />
                  <div className="flex justify-between mt-1">
                    <div>
                      {errors.bio && (
                        <p className="text-sm text-red-600">{errors.bio.message}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {watchedBio?.length || 0}/500文字
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'アカウント作成中...' : 'アカウント作成'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                すでにアカウントをお持ちの方は{' '}
                <Link href="/login" className="text-pink-600 hover:text-pink-500 font-medium">
                  ログイン
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}