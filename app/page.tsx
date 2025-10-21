'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import BottomNavigation from '@/components/BottomNavigation'

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

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

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
        <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: '48px', height: '48px', border: '3px solid #ec4899', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        </div>
        <BottomNavigation />
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
          <div style={{textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'}}>
            <p style={{color: '#ef4444', marginBottom: '16px', fontSize: '16px'}}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{background: 'linear-gradient(to right, #ec4899, #8b5cf6)', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}
            >
              再試行
            </button>
          </div>
        </div>
        <BottomNavigation />
      </AuthGuard>
    )
  }

  if (!profile) {
    return (
      <AuthGuard requireAuth={true}>
        <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', paddingTop: '48px', paddingBottom: '80px'}}>
          <div style={{maxWidth: '428px', margin: '0 auto', padding: '0 16px'}}>
            <div style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)', marginTop: '48px'}}>
              <div style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px'}}>👤</div>
              <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>
                プロフィールがまだ作成されていません
              </h1>
              <p style={{color: '#6b7280', marginBottom: '32px', lineHeight: '1.6'}}>
                素敵な出会いのために、まずはプロフィールを作成しましょう ✨
              </p>
              <Link
                href="/profile/create"
                style={{display: 'inline-block', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', color: 'white', fontWeight: '600', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.3)', transition: 'all 0.3s ease', transform: 'scale(1)'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(236, 72, 153, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(236, 72, 153, 0.3)'
                }}
              >
                🚀 プロフィールを作成
              </Link>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', paddingTop: '24px', paddingBottom: '80px'}}>
        {/* Header */}
        <header style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
          <div style={{maxWidth: '428px', margin: '0 auto', padding: '0 16px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{width: '32px', height: '32px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <span style={{color: 'white', fontSize: '16px', fontWeight: 'bold'}}>👤</span>
                </div>
                <h1 style={{fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>プロフィール</h1>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Link
                  href="/profile/edit"
                  style={{background: 'linear-gradient(to right, #ec4899, #8b5cf6)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textDecoration: 'none', boxShadow: '0 2px 4px 0 rgba(236, 72, 153, 0.2)', transition: 'all 0.2s ease'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  ✏️ 編集
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px 0 rgba(239, 68, 68, 0.2)', transition: 'all 0.2s ease'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc2626'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ef4444'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  🚪 ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div style={{maxWidth: '428px', margin: '0 auto', padding: '0 16px'}}>
          <div style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '16px', padding: '24px', marginTop: '24px', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)'}}>

            {/* Profile Avatar */}
            <div style={{textAlign: 'center', marginBottom: '24px'}}>
              <div style={{width: '120px', height: '120px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '48px', boxShadow: '0 10px 25px -3px rgba(236, 72, 153, 0.3)'}}>
                {profile.gender === 'male' ? '👨' : '👩'}
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {/* ニックネーム */}
              <div style={{textAlign: 'center'}}>
                <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px'}}>{profile.nickname}</h2>
                <p style={{color: '#6b7280', fontSize: '16px'}}>{profile.age}歳 • {profile.gender === 'male' ? '男性' : '女性'}</p>
              </div>

              {/* 自己紹介 */}
              <div style={{background: 'rgba(249, 250, 251, 0.5)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(229, 231, 235, 0.3)'}}>
                <h3 style={{fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>💬 自己紹介</h3>
                <p style={{color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{profile.bio}</p>
              </div>

              {/* Stats Cards */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
                <div style={{background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center'}}>
                  <div style={{fontSize: '20px', marginBottom: '4px'}}>🎂</div>
                  <div style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937'}}>{profile.age}歳</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>年齢</div>
                </div>
                <div style={{background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center'}}>
                  <div style={{fontSize: '20px', marginBottom: '4px'}}>📅</div>
                  <div style={{fontSize: '12px', fontWeight: '600', color: '#1f2937'}}>登録日</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>{new Date(profile.created_at).toLocaleDateString('ja-JP')}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px'}}>
                <Link
                  href="/events"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.3)',
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(236, 72, 153, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(236, 72, 153, 0.3)'
                  }}
                >
                  <span>📅</span>
                  <span>日程を登録する</span>
                </Link>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
                  <Link
                    href="/chat"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px)',
                      color: '#374151',
                      padding: '12px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontWeight: '500',
                      border: '1px solid rgba(229, 231, 235, 0.3)',
                      transition: 'all 0.2s ease',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 250, 251, 0.9)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    <span>💬</span>
                    <span>チャット</span>
                  </Link>

                  <Link
                    href="/profile/edit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px)',
                      color: '#374151',
                      padding: '12px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontWeight: '500',
                      border: '1px solid rgba(229, 231, 235, 0.3)',
                      transition: 'all 0.2s ease',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 250, 251, 0.9)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    <span>⚙️</span>
                    <span>設定</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <BottomNavigation />
    </AuthGuard>
  )
}