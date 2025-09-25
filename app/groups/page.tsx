'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { CalendarIcon, ClockIcon, UserGroupIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface GroupMember {
  user_id: string
  profiles: {
    nickname: string
    age: number
    gender: 'male' | 'female'
  }
}

interface Group {
  id: string
  event_date: string
  event_time: string
  area_id: number
  status: 'formed' | 'active' | 'completed' | 'cancelled'
  created_at: string
  members: GroupMember[]
}

interface MatchingStatus {
  events: any[]
  groups: Group[]
  stats: {
    totalEvents: number
    pendingEvents: number
    matchedEvents: number
    completedEvents: number
    totalGroups: number
    upcomingGroups: number
  }
}

export default function GroupsPage() {
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatchingStatus = async () => {
      try {
        const response = await fetch('/api/matching/status')
        if (response.ok) {
          const data = await response.json()
          setMatchingStatus(data)
        }
      } catch (error) {
        console.error('Error fetching matching status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatchingStatus()
  }, [])

  const getStatusBadge = (status: string) => {
    const badges = {
      formed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    const labels = {
      formed: '成立',
      active: '開催中',
      completed: '完了',
      cancelled: '中止'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
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

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-pink-600 hover:text-pink-700 mr-4">
                  ← ダッシュボード
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">マッチング状況</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* 統計カード */}
            {matchingStatus && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">希望登録中</dt>
                          <dd className="text-lg font-medium text-gray-900">{matchingStatus.stats.pendingEvents}件</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">マッチング済み</dt>
                          <dd className="text-lg font-medium text-gray-900">{matchingStatus.stats.matchedEvents}件</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">参加予定</dt>
                          <dd className="text-lg font-medium text-gray-900">{matchingStatus.stats.upcomingGroups}回</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MapPinIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">参加完了</dt>
                          <dd className="text-lg font-medium text-gray-900">{matchingStatus.stats.completedEvents}回</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* グループ一覧 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">参加グループ</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  あなたが参加している合コンの一覧です
                </p>
              </div>

              {matchingStatus && matchingStatus.groups.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {matchingStatus.groups.map((group) => (
                    <li key={group.id}>
                      <Link href={`/groups/${group.id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  {formatDate(group.event_date)} {group.event_time}
                                </p>
                                <p className="text-sm text-gray-500">
                                  名古屋栄エリア • 参加者 {group.members?.length || 0}名
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(group.status)}
                              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-12 text-center">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">参加グループがありません</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    日程を登録してマッチングを待ちましょう
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/preferences"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
                    >
                      日程を登録する
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}