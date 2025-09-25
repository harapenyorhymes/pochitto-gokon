'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface GroupMember {
  user_id: string
  joined_at: string
  profiles: {
    nickname: string
    age: number
    gender: 'male' | 'female'
    bio: string
  }
}

interface Group {
  id: string
  event_date: string
  event_time: string
  area_id: number
  status: 'formed' | 'active' | 'completed' | 'cancelled'
  created_at: string
  all_members: GroupMember[]
}

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}`)
        if (!response.ok) {
          throw new Error('グループ情報の取得に失敗しました')
        }

        const data = await response.json()
        setGroup(data.group)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId) {
      fetchGroup()
    }
  }, [groupId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

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

  const getUserIcon = (gender: 'male' | 'female') => {
    return gender === 'male' ? '👤' : '👤'
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

  if (error || !group) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'グループが見つかりません'}</p>
            <Link
              href="/groups"
              className="text-blue-600 hover:text-blue-800"
            >
              ← グループ一覧に戻る
            </Link>
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
                <Link href="/groups" className="text-pink-600 hover:text-pink-700 mr-4">
                  ← グループ一覧
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">グループ詳細</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Group Info Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {formatDate(group.event_date)}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      合コンの詳細情報
                    </p>
                  </div>
                  {getStatusBadge(group.status)}
                </div>
              </div>

              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      日時
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDate(group.event_date)} {group.event_time}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2" />
                      場所
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      名古屋栄エリア
                    </dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      参加者
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {group.all_members?.length || 0}名
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  アクション
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Link
                    href={`/chat/${group.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    グループチャット
                  </Link>

                  {group.status === 'formed' && (
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <ClockIcon className="h-5 w-5 mr-2" />
                      開催待ち
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  参加メンバー
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  このグループに参加しているメンバーです
                </p>
              </div>

              <ul className="divide-y divide-gray-200">
                {group.all_members?.map((member) => (
                  <li key={member.user_id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg">
                            {getUserIcon(member.profiles.gender)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.profiles.nickname}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.profiles.age}歳 • {member.profiles.gender === 'male' ? '男性' : '女性'}
                        </p>
                        {member.profiles.bio && (
                          <p className="text-sm text-gray-500 mt-1">
                            {member.profiles.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}