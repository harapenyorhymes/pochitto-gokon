'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'

interface MatchingStatus {
  events: any[]
  groups: any[]
  stats: {
    totalEvents: number
    pendingEvents: number
    matchedEvents: number
    completedEvents: number
    totalGroups: number
    upcomingGroups: number
  }
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
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

    if (user) {
      fetchMatchingStatus()
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">ポチッと合コン</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  ようこそ、{user?.email}さん
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ダッシュボード
                </h2>
                <p className="text-gray-600 mb-8">
                  ようこそ、ポチッと合コンへ！
                </p>

                {/* マッチング状況統計 */}
                {!isLoading && matchingStatus && (
                  <div className="bg-blue-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたのマッチング状況</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{matchingStatus.stats.pendingEvents}</div>
                        <div className="text-sm text-gray-600">希望登録中</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{matchingStatus.stats.matchedEvents}</div>
                        <div className="text-sm text-gray-600">マッチング済み</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{matchingStatus.stats.upcomingGroups}</div>
                        <div className="text-sm text-gray-600">参加予定</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">{matchingStatus.stats.completedEvents}</div>
                        <div className="text-sm text-gray-600">参加完了</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 参加予定のグループ表示 */}
                {!isLoading && matchingStatus && matchingStatus.groups.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">参加予定の合コン</h3>
                    <div className="space-y-4">
                      {matchingStatus.groups.slice(0, 3).map((group) => (
                        <div key={group.id} className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{group.event_date} {group.event_time}</div>
                              <div className="text-sm text-gray-600">参加者: {group.members?.length || 0}名</div>
                            </div>
                            <Link
                              href={`/groups/${group.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              詳細を見る
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      📅 日程登録
                    </h3>
                    <p className="text-gray-600 text-sm">
                      参加希望日程を登録してマッチングを開始
                    </p>
                    <Link href="/events" className="mt-4 w-full inline-block text-center bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md text-sm font-medium">
                      日程を登録
                    </Link>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      👤 プロフィール
                    </h3>
                    <p className="text-gray-600 text-sm">
                      あなたのプロフィールを設定・編集できます
                    </p>
                    <Link href="/profile" className="mt-4 w-full inline-block text-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium">
                      プロフィール設定
                    </Link>
                  </div>


                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      マッチング状況
                    </h3>
                    <p className="text-gray-600 text-sm">
                      現在のマッチング状況とグループチャット
                    </p>
                    <Link href="/groups" className="mt-4 w-full inline-block text-center bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md text-sm font-medium">
                      状況を確認
                    </Link>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      通知設定
                    </h3>
                    <p className="text-gray-600 text-sm">
                      LINE通知やその他の通知設定を管理
                    </p>
                    <Link href="/settings/notifications" className="mt-4 w-full inline-block text-center bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md text-sm font-medium">
                      設定を変更
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}