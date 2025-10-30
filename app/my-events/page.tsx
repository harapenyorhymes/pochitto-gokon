'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/AuthGuard'
import BottomNavigation from '@/components/BottomNavigation'

interface Event {
  id: string
  event_date: string
  event_time: string
  participation_type: 'solo' | 'group'
  status: string
  area_id: string
  created_at: string
}

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMyEvents()
    }
  }, [user])

  const fetchMyEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events/my-events')

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching my events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM形式
  }

  const getParticipationTypeLabel = (type: string) => {
    return type === 'solo' ? 'ソロ参加' : '友達と参加'
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'マッチング待ち'
      case 'matched':
        return 'マッチング成立'
      case 'confirmed':
        return '確定'
      case 'cancelled':
        return 'キャンセル'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(252, 211, 77, 0.2)', text: '#92400e' }
      case 'matched':
        return { bg: 'rgba(34, 197, 94, 0.2)', text: '#14532d' }
      case 'confirmed':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#1e3a8a' }
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#7f1d1d' }
      default:
        return { bg: 'rgba(156, 163, 175, 0.2)', text: '#374151' }
    }
  }

  if (authLoading || loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: '48px', height: '48px', border: '3px solid #ec4899', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        </div>
        <BottomNavigation />
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', paddingTop: '24px', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'}}>
        {/* Header */}
        <header style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
          <div style={{maxWidth: '428px', margin: '0 auto', padding: '0 16px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{width: '32px', height: '32px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <span style={{color: 'white', fontSize: '16px', fontWeight: 'bold'}}>📋</span>
                </div>
                <h1 style={{fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>日程登録情報</h1>
              </div>
              {events.length > 0 && (
                <div style={{
                  background: 'rgba(236, 72, 153, 0.1)',
                  color: '#ec4899',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {events.length}件
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{maxWidth: '428px', margin: '0 auto', padding: '0 16px'}}>
          {events.length === 0 ? (
            /* 日程未登録時の表示 */
            <div style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)', marginTop: '24px', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
              <div style={{width: '120px', height: '120px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px dashed rgba(236, 72, 153, 0.3)'}}>
                <span style={{fontSize: '48px'}}>📅</span>
              </div>

              <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px'}}>
                まだ日程登録をしていません
              </h2>

              <p style={{color: '#6b7280', marginBottom: '32px', lineHeight: '1.6'}}>
                合コンに参加するには、まず日程を登録しましょう！
              </p>

              <Link
                href="/events"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.3)',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
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
            </div>
          ) : (
            /* 日程登録済み時の表示 */
            <div style={{marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {events.map((event) => {
                const statusColor = getStatusColor(event.status)
                return (
                  <div
                    key={event.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* ステータスと参加タイプ */}
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                      <div style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getStatusLabel(event.status)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {getParticipationTypeLabel(event.participation_type)}
                      </div>
                    </div>

                    {/* 日程情報 */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px'}}>
                      <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(236, 72, 153, 0.1)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{fontSize: '20px'}}>📅</span>
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '2px'}}>日時</div>
                          <div style={{fontWeight: 'bold', color: '#1f2937', fontSize: '15px'}}>
                            {formatDate(event.event_date)}
                          </div>
                          <div style={{color: '#374151', fontSize: '14px'}}>
                            {formatTime(event.event_time)}
                          </div>
                        </div>
                      </div>

                      <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{fontSize: '20px'}}>📍</span>
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '2px'}}>場所</div>
                          <div style={{fontWeight: 'bold', color: '#1f2937', fontSize: '15px'}}>
                            名古屋栄エリア
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 詳細ボタン */}
                    <Link
                      href={`/events/${event.id}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        background: 'rgba(236, 72, 153, 0.05)',
                        color: '#ec4899',
                        padding: '12px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid rgba(236, 72, 153, 0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)'
                      }}
                    >
                      詳細を見る →
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
    </AuthGuard>
  )
}
