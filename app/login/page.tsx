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
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
        <div style={{maxWidth: '428px', width: '100%'}}>
          <div style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px 32px', boxShadow: '0 20px 60px -3px rgba(0, 0, 0, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)'}}>

            {/* Header */}
            <div style={{textAlign: 'center', marginBottom: '32px'}}>
              <div style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '40px', boxShadow: '0 10px 25px -3px rgba(236, 72, 153, 0.3)'}}>
                💕
              </div>
              <h1 style={{fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px'}}>
                ポチッと合コン
              </h1>
              <p style={{color: '#6b7280', fontSize: '14px'}}>アカウントにログイン</p>
            </div>

            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {error && (
                <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', padding: '12px 16px', borderRadius: '12px', fontSize: '14px'}}>
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{width: '100%', padding: '12px 16px', border: '1px solid rgba(229, 231, 235, 0.5)', borderRadius: '12px', fontSize: '16px', background: 'rgba(255, 255, 255, 0.8)', transition: 'all 0.2s ease'}}
                  placeholder="your@example.com"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ec4899'
                    e.currentTarget.style.outline = '2px solid rgba(236, 72, 153, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.5)'
                    e.currentTarget.style.outline = 'none'
                  }}
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{width: '100%', padding: '12px 16px', border: '1px solid rgba(229, 231, 235, 0.5)', borderRadius: '12px', fontSize: '16px', background: 'rgba(255, 255, 255, 0.8)', transition: 'all 0.2s ease'}}
                  placeholder="パスワード"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ec4899'
                    e.currentTarget.style.outline = '2px solid rgba(236, 72, 153, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.5)'
                    e.currentTarget.style.outline = 'none'
                  }}
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                style={{width: '100%', padding: '14px', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', color: 'white', fontWeight: '600', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.3)', transition: 'all 0.3s ease', opacity: loading ? 0.5 : 1, transform: 'scale(1)'}}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(236, 72, 153, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(236, 72, 153, 0.3)'
                }}
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>

              {/* LINE Login */}
              {lineLoginEnabled && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(209, 213, 219, 0.5), transparent)'}} />
                    <span style={{fontSize: '14px', color: '#9ca3af', fontWeight: '500'}}>または</span>
                    <div style={{flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(209, 213, 219, 0.5), transparent)'}} />
                  </div>

                  <button
                    type="button"
                    onClick={handleLineLogin}
                    disabled={lineLoading}
                    style={{width: '100%', padding: '14px', background: '#06C755', color: 'white', fontWeight: '600', borderRadius: '12px', border: 'none', cursor: lineLoading ? 'not-allowed' : 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px 0 rgba(6, 199, 85, 0.3)', transition: 'all 0.3s ease', opacity: lineLoading ? 0.5 : 1, transform: 'scale(1)'}}
                    onMouseEnter={(e) => {
                      if (!lineLoading) {
                        e.currentTarget.style.transform = 'scale(1.02)'
                        e.currentTarget.style.background = '#05B04A'
                        e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(6, 199, 85, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.background = '#06C755'
                      e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(6, 199, 85, 0.3)'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="currentColor"/>
                    </svg>
                    {lineLoading ? 'LINEで処理中...' : 'LINEでログイン'}
                  </button>
                </div>
              )}

              {/* Sign Up Link */}
              <div style={{textAlign: 'center', marginTop: '8px'}}>
                <p style={{fontSize: '14px', color: '#6b7280'}}>
                  アカウントをお持ちでない方は{' '}
                  <Link
                    href="/signup"
                    style={{color: '#ec4899', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s ease'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#8b5cf6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#ec4899'
                    }}
                  >
                    新規登録
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
