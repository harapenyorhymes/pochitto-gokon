export const TIME_SLOTS = [
  {
    id: 'evening' as const,
    label: '18:00-20:00',
    color: 'bg-blue-500',
    startHour: 18,
    endHour: 20,
    apiTime: '18:00:00'
  },
  {
    id: 'night' as const,
    label: '20:00-22:00',
    color: 'bg-purple-500',
    startHour: 20,
    endHour: 22,
    apiTime: '20:00:00'
  }
] as const

export type TimeSlotId = typeof TIME_SLOTS[number]['id']

export const CONTINUOUS_TIME_LABEL = '18:00-22:00'

export const PARTICIPATION_TYPES = {
  SOLO: 'solo' as const,
  GROUP: 'group' as const
} as const

export const MAX_PARTICIPANTS = {
  [PARTICIPATION_TYPES.SOLO]: 4,
  [PARTICIPATION_TYPES.GROUP]: 6
} as const

export const AREA_IDS = {
  NAGOYA_SAKAE: '00000000-0000-0000-0000-000000000001'
} as const