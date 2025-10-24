'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import GridDateTimeSelector from '@/components/GridDateTimeSelector'
import ParticipationSelector, { ParticipationType } from '@/components/ParticipationSelector'
import AreaSelector from '@/components/AreaSelector'
import BottomNavigation from '@/components/BottomNavigation'
import { TIME_SLOTS, AREA_IDS, MAX_PARTICIPANTS } from '@/constants/timeSlots'
import { signInWithLine } from '@/lib/auth'

type LineStatus = {
  loading: boolean
  lineUserId: string | null
  friendFlag: boolean
}

const TEXT = {
  areaName: '\u540d\u53e4\u5c4b\u6804\u30a8\u30ea\u30a2',
  prefecture: '\u611b\u77e5\u770c',
  city: '\u540d\u53e4\u5c4b\u5e02',
  lineLoading: 'LINE\u9023\u643a\u306e\u78ba\u8a8d\u4e2d\u3067\u3059\u3002\u3059\u3053\u3057\u5f85\u3063\u3066\u304b\u3089\u518d\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002',
  selectSchedule: '\u65e5\u7a0b\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044',
  selectArea: '\u30a8\u30ea\u30a2\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044',
  registerFailed: '\u65e5\u7a0b\u306e\u767b\u9332\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
  genericError: '\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f',
  needLineLinkTitle: 'LINE\u9023\u643a\u304c\u5fc5\u8981\u3067\u3059',
  needLineLinkDescription: '\u65e5\u7a0b\u3092\u4fdd\u5b58\u3059\u308b\u524d\u306b\u3001LINE\u30ed\u30b0\u30a4\u30f3\u3067\u516c\u5f0f\u30a2\u30ab\u30a6\u30f3\u30c8\u3068\u9023\u643a\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
  linkWithLine: 'LINE\u3067\u9023\u643a\u3059\u308b',
  needFriendTitle: '\u53cb\u3060\u3061\u8ffd\u52a0\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044',
  needFriendDescription: '\u516c\u5f0f\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u53cb\u3060\u3061\u8ffd\u52a0\u3059\u308b\u3068\u3001\u30de\u30c3\u30c1\u901a\u77e5\u3092LINE\u3067\u3082\u53d7\u3051\u53d6\u308c\u307e\u3059\u3002\u8ffd\u52a0\u5f8c\u306b\u518d\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
  friendAddButton: '\u53cb\u3060\u3061\u8ffd\u52a0\u30da\u30fc\u30b8\u3092\u958b\u304f',
  friendCheckButton: '\u53cb\u3060\u3061\u8ffd\u52a0\u6e08\u307f\u3092\u78ba\u8a8d\u3059\u308b',
  close: '\u9589\u3058\u308b',
  friendUrlMissing: 'LINE\u53cb\u3060\u3061\u8ffd\u52a0URL\u304c\u8a2d\u5b9a\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002\u7ba1\u7406\u8005\u306b\u304a\u554f\u3044\u5408\u308f\u305b\u304f\u3060\u3055\u3044\u3002',
  registering: '\u767b\u9332\u4e2d...',
  registerButton: '\u65e5\u7a0b\u3092\u767b\u9332\u3059\u308b',
  selectedSchedulesPrefix: '\u2728 ',
  selectedSchedulesSuffix: '\u4ef6\u306e\u65e5\u7a0b\u3092\u9078\u629e\u4e2d',
  headerTitle: '\ud83d\udcc5 \u65e5\u7a0b\u767b\u9332'
}

const AVAILABLE_AREAS = [
  {
    id: AREA_IDS.NAGOYA_SAKAE,
    name: TEXT.areaName,
    prefecture: TEXT.prefecture,
    city: TEXT.city
  }
]

const sanitizeFriendUrl = (value: string | undefined) => {
  if (!value) return null
  if (value.includes('YOUR_OFFICIAL_ACCOUNT_ID')) return null
  return value
}

export default function EventsPage() {
  const router = useRouter()

  const [selections, setSelections] = useState<{ date: string; timeSlotId: string }[]>([])
  const [participationType, setParticipationType] = useState<ParticipationType>('solo')
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(AREA_IDS.NAGOYA_SAKAE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lineStatus, setLineStatus] = useState<LineStatus>({
    loading: true,
    lineUserId: null,
    friendFlag: false
  })
  const [lineModal, setLineModal] = useState<'link' | 'friend' | null>(null)

  const friendAddUrl = useMemo(
    () => sanitizeFriendUrl(process.env.NEXT_PUBLIC_LINE_FRIEND_ADD_URL),
    []
  )

  const loadLineStatus = useCallback(async () => {
    try {
      setLineStatus(prev => ({ ...prev, loading: true }))
      const response = await fetch('/api/line/status', { cache: 'no-store' })

      if (response.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent('/events')}`)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch LINE status')
      }

      const data = await response.json()
      setLineStatus({
        loading: false,
        lineUserId: data.lineUserId ?? null,
        friendFlag: Boolean(data.friendFlag)
      })
    } catch (err) {
      console.error('Failed to load LINE status', err)
      setLineStatus(prev => ({ ...prev, loading: false }))
    }
  }, [router])

  useEffect(() => {
    loadLineStatus()
  }, [loadLineStatus])

  const handleSelectionsChange = useCallback(
    (newSelections: { date: string; timeSlotId: string }[]) => {
      setSelections(newSelections)
      setError(null)
    },
    []
  )

  const handleLineConnect = useCallback(() => {
    signInWithLine('/events')
  }, [])

  const handleFriendAdd = useCallback(() => {
    if (!friendAddUrl) {
      alert(TEXT.friendUrlMissing)
      return
    }
    window.open(friendAddUrl, '_blank', 'noreferrer')
  }, [friendAddUrl])

  const handleFriendCheck = useCallback(() => {
    signInWithLine('/events')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (lineStatus.loading) {
      setError(TEXT.lineLoading)
      return
    }

    if (!lineStatus.lineUserId) {
      setLineModal('link')
      return
    }

    if (!lineStatus.friendFlag) {
      setLineModal('friend')
      return
    }

    if (selections.length === 0) {
      setError(TEXT.selectSchedule)
      return
    }

    if (!selectedAreaId) {
      setError(TEXT.selectArea)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const events = selections.map(selection => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || TEXT.registerFailed)
      }

      if (participationType === 'group' && result.events && result.events.length > 0) {
        const firstEventId = result.events[0].id
        try {
          const inviteResponse = await fetch('/api/invitations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: firstEventId })
          })

          if (inviteResponse.ok) {
            const inviteResult = await inviteResponse.json()
            router.push(`/events/invitation/${inviteResult.invitationCode.code}`)
            return
          }
        } catch (err) {
          console.error('Failed to create invitation code:', err)
        }
      }

      router.push('/?success=events-registered')
    } catch (err) {
      setError(err instanceof Error ? err.message : TEXT.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }, [lineStatus, participationType, router, selections, selectedAreaId])

  const isSubmitDisabled = isSubmitting || selections.length === 0

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-32">
        {lineModal === 'link' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl space-y-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900">{TEXT.needLineLinkTitle}</h2>
              <p className="text-sm text-gray-600">{TEXT.needLineLinkDescription}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleLineConnect}
                  className="inline-flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-600 transition"
                >
                  {TEXT.linkWithLine}
                </button>
                <button
                  type="button"
                  onClick={() => setLineModal(null)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  {TEXT.close}
                </button>
              </div>
            </div>
          </div>
        )}

        {lineModal === 'friend' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl space-y-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900">{TEXT.needFriendTitle}</h2>
              <p className="text-sm text-gray-600">{TEXT.needFriendDescription}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleFriendAdd}
                  className="inline-flex items-center justify-center rounded-md bg-[#06C755] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#05b04f] transition disabled:opacity-60"
                  disabled={!friendAddUrl}
                >
                {TEXT.friendAddButton}
                </button>
                {!friendAddUrl && (
                  <p className="text-xs text-red-500">{TEXT.friendUrlMissing}</p>
                )}
                <button
                  type="button"
                  onClick={handleFriendCheck}
                  className="inline-flex items-center justify-center rounded-md border border-pink-500 px-4 py-2 text-sm font-medium text-pink-500 hover:bg-pink-50 transition"
                >
                {TEXT.friendCheckButton}
                </button>
                <button
                  type="button"
                  onClick={() => setLineModal(null)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  {TEXT.close}
                </button>
              </div>
            </div>
          </div>
        )}

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
                {TEXT.headerTitle}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <div className="max-w-sm mx-auto px-4 py-6 pb-8">
          {error && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg">
              <div className="flex items-center">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <AreaSelector value={selectedAreaId} onChange={setSelectedAreaId} areas={AVAILABLE_AREAS} />

            <GridDateTimeSelector value={selections} onChange={handleSelectionsChange} />

            <ParticipationSelector value={participationType} onChange={setParticipationType} />

            <div className="pt-9 px-4 pb-12 mb-24">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-white transition-all"
                style={{
                  background: isSubmitDisabled
                    ? 'linear-gradient(to right, #d1d5db, #9ca3af)'
                    : 'linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)',
                  boxShadow: isSubmitDisabled
                    ? 'none'
                    : '0 10px 25px -3px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.05)',
                  cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                  opacity: isSubmitDisabled ? 0.55 : 1,
                  transition: 'all 0.3s ease',
                }}
              >
                {isSubmitting ? TEXT.registering : TEXT.registerButton}
              </button>

              {selections.length > 0 && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    {TEXT.selectedSchedulesPrefix}
                    {selections.length}
                    {TEXT.selectedSchedulesSuffix}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <BottomNavigation />
      </div>
    </AuthGuard>
  )
}
