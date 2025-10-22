'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import GridDateTimeSelector from '@/components/GridDateTimeSelector'
import ParticipationSelector, { ParticipationType } from '@/components/ParticipationSelector'
import AreaSelector from '@/components/AreaSelector'
import BottomNavigation from '@/components/BottomNavigation'
import { TIME_SLOTS, AREA_IDS, MAX_PARTICIPANTS } from '@/constants/timeSlots'

// エリアの定義（現在は名古屋栄のみ）
const AVAILABLE_AREAS = [
  {
    id: AREA_IDS.NAGOYA_SAKAE,
    name: '名古屋栄エリア',
    prefecture: '愛知県',
    city: '名古屋市'
  }
]

export interface EventData {
  date: string
  timeSlot: string
  participationType: ParticipationType
}

export default function EventsPage() {
  const router = useRouter()
  const [selections, setSelections] = useState<{ date: string; timeSlotId: string }[]>([])
  const [participationType, setParticipationType] = useState<ParticipationType>('solo')
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(AREA_IDS.NAGOYA_SAKAE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectionsChange = useCallback((newSelections: { date: string; timeSlotId: string }[]) => {
    setSelections(newSelections)
    setError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (selections.length === 0) {
      setError('日程を選択してください')
      return
    }

    if (!selectedAreaId) {
      setError('エリアを選択してください')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // APIに送信するデータを準備
      const events: any[] = selections.map(selection => {
        const timeSlot = selection.timeSlotId === 'slot1' ? '18:00:00' : '20:00:00'

        return {
          event_date: selection.date,
          event_time: timeSlot,
          area_id: selectedAreaId,
          participation_type: participationType,
          max_participants: MAX_PARTICIPANTS[participationType]
        }
      })

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '日程の登録に失敗しました')
      }

      // 成功時はプロフィール（ホーム）にリダイレクト
      router.push('/?success=events-registered')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }, [selections, participationType, selectedAreaId, router])


  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-32">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-40">
          <div className="max-w-sm mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                📅 日程選択
              </h1>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <div className="max-w-sm mx-auto px-4 py-6 pb-8">
          {/* エラー表示 */}
          {error && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* エリア選択 */}
            <AreaSelector
              value={selectedAreaId}
              onChange={setSelectedAreaId}
              areas={AVAILABLE_AREAS}
            />

            {/* 日程選択 */}
            <GridDateTimeSelector
              value={selections}
              onChange={handleSelectionsChange}
            />

            {/* 参加方式選択 */}
            <ParticipationSelector
              value={participationType}
              onChange={setParticipationType}
            />

            {/* 登録ボタン */}
            <div style={{paddingTop: '36px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '48px', marginBottom: '96px'}}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selections.length === 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isSubmitting || selections.length === 0
                    ? 'linear-gradient(to right, #d1d5db, #9ca3af)'
                    : 'linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)',
                  color: 'white',
                  borderRadius: '16px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  border: 'none',
                  cursor: isSubmitting || selections.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: isSubmitting || selections.length === 0
                    ? 'none'
                    : '0 10px 25px -3px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.05)',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)',
                  opacity: isSubmitting || selections.length === 0 ? 0.5 : 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!(isSubmitting || selections.length === 0)) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 20px 40px -3px rgba(236, 72, 153, 0.4), 0 4px 6px -2px rgba(236, 72, 153, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isSubmitting || selections.length === 0)) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.05)'
                  }
                }}
                onMouseDown={(e) => {
                  if (!(isSubmitting || selections.length === 0)) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onMouseUp={(e) => {
                  if (!(isSubmitting || selections.length === 0)) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
              >
                {isSubmitting ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg style={{animation: 'spin 1s linear infinite', marginLeft: '-4px', marginRight: '12px', height: '20px', width: '20px', color: 'white'}} fill="none" viewBox="0 0 24 24">
                      <circle style={{opacity: 0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{opacity: 0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登録中...
                  </div>
                ) : (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <span>🚀</span>
                    <span>日程登録</span>
                  </div>
                )}
              </button>

              {/* 選択状況の表示 */}
              {selections.length > 0 && (
                <div style={{marginTop: '16px', textAlign: 'center'}}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'linear-gradient(to right, rgba(220, 252, 231, 0.8), rgba(167, 243, 208, 0.8))',
                    backdropFilter: 'blur(16px)',
                    color: '#065f46',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%',
                      marginRight: '8px',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    ✨ {selections.length}つの日程を選択中
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ボトムナビゲーション */}
        <BottomNavigation />
      </div>
    </AuthGuard>
  )
}

