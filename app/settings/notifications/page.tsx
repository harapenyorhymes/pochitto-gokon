'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface NotificationSettings {
  id?: string
  user_id: string
  match_notifications: boolean
  chat_notifications: boolean
  reminder_notifications: boolean
  line_connected: boolean
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 設定を取得
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (!response.ok) {
        throw new Error('設定の取得に失敗しました')
      }

      const data = await response.json()
      setSettings(data.settings)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // 設定を保存
  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return

    setIsSaving(true)
    setMessage(null)

    try {
      const updatedSettings = { ...settings, ...newSettings }

      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        throw new Error('設定の保存に失敗しました')
      }

      const data = await response.json()
      setSettings(data.settings)
      setMessage({ type: 'success', text: '設定を保存しました' })

      // 3秒後にメッセージを非表示
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  // 設定変更ハンドラー
  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings || isSaving) return

    const newValue = !settings[key]
    saveSettings({ [key]: newValue })
  }

  useEffect(() => {
    fetchSettings()
  }, [])

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
                <h1 className="text-xl font-semibold text-gray-900">通知設定</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Success/Error Message */}
            {message && (
              <div className={`mb-6 rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      message.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <BellIcon className="h-6 w-6 mr-2" />
                  通知設定
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  受け取りたい通知の種類を選択してください
                </p>
              </div>

              <div className="border-t border-gray-200">
                {settings && (
                  <dl>
                    {/* マッチング通知 */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        <div>
                          <div className="font-semibold text-gray-900">マッチング成立通知</div>
                          <div className="text-xs text-gray-500 mt-1">合コンが成立した時にお知らせします</div>
                        </div>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <button
                          onClick={() => handleToggle('match_notifications')}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 ${
                            settings.match_notifications ? 'bg-pink-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.match_notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </dd>
                    </div>

                    {/* チャット通知 */}
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        <div>
                          <div className="font-semibold text-gray-900">チャット通知</div>
                          <div className="text-xs text-gray-500 mt-1">新しいメッセージが届いた時にお知らせします</div>
                        </div>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <button
                          onClick={() => handleToggle('chat_notifications')}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 ${
                            settings.chat_notifications ? 'bg-pink-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.chat_notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </dd>
                    </div>

                    {/* リマインド通知 */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        <div>
                          <div className="font-semibold text-gray-900">リマインド通知</div>
                          <div className="text-xs text-gray-500 mt-1">合コンの前日にリマインドします</div>
                        </div>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <button
                          onClick={() => handleToggle('reminder_notifications')}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 ${
                            settings.reminder_notifications ? 'bg-pink-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.reminder_notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>

            {/* LINE Connection Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  LINE連携
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  LINEと連携すると通知を受け取ることができます
                </p>
              </div>

              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                {settings?.line_connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">LINE連携済み</p>
                        <p className="text-sm text-gray-500">通知を受け取る準備ができています</p>
                      </div>
                    </div>
                    <button
                      onClick={() => saveSettings({ line_connected: false })}
                      disabled={isSaving}
                      className="ml-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      連携解除
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircleIcon className="h-6 w-6 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">LINE未連携</p>
                        <p className="text-sm text-gray-500">LINEで通知を受け取るには連携が必要です</p>
                      </div>
                    </div>
                    <button
                      onClick={() => saveSettings({ line_connected: true })}
                      disabled={isSaving}
                      className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      連携する
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}