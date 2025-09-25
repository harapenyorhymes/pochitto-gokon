export interface MatchingEvent {
  id: string
  user_id: string
  event_date: string
  event_time: string
  area_id: number
  participation_type: 'solo' | 'group'
  status: 'pending' | 'matched' | 'completed'
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  nickname: string
  age: number
  gender: 'male' | 'female'
  bio: string
}

export interface MatchingCandidate {
  event: MatchingEvent
  profile: UserProfile
}

export interface MatchingGroup {
  id?: string
  event_date: string
  event_time: string
  area_id: number
  members: MatchingCandidate[]
  status: 'formed' | 'active' | 'completed' | 'cancelled'
}

export interface MatchingConfig {
  minGroupSize: number
  maxGroupSize: number
  preferredMaleCount: number
  preferredFemaleCount: number
  maxAgeDifference: number
}

// デフォルトマッチング設定
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  minGroupSize: 4,
  maxGroupSize: 8,
  preferredMaleCount: 4,
  preferredFemaleCount: 4,
  maxAgeDifference: 10, // 年齢差最大10歳
}

/**
 * 候補者を日程・エリア・時間でグループ化
 */
export function groupCandidatesBySlot(candidates: MatchingCandidate[]): Map<string, MatchingCandidate[]> {
  const groups = new Map<string, MatchingCandidate[]>()

  for (const candidate of candidates) {
    const { event_date, event_time, area_id } = candidate.event
    const key = `${event_date}_${event_time}_${area_id}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(candidate)
  }

  return groups
}

/**
 * 性別でグループ分け
 */
export function separateByGender(candidates: MatchingCandidate[]): {
  males: MatchingCandidate[]
  females: MatchingCandidate[]
} {
  const males = candidates.filter(c => c.profile.gender === 'male')
  const females = candidates.filter(c => c.profile.gender === 'female')

  return { males, females }
}

/**
 * 年齢でソート（若い順）
 */
export function sortByAge(candidates: MatchingCandidate[]): MatchingCandidate[] {
  return [...candidates].sort((a, b) => a.profile.age - b.profile.age)
}

/**
 * 参加タイプでグループ分け
 */
export function separateByParticipationType(candidates: MatchingCandidate[]): {
  solo: MatchingCandidate[]
  group: MatchingCandidate[]
} {
  const solo = candidates.filter(c => c.event.participation_type === 'solo')
  const group = candidates.filter(c => c.event.participation_type === 'group')

  return { solo, group }
}

/**
 * 基本マッチングアルゴリズム
 */
export function createBasicMatching(
  candidates: MatchingCandidate[],
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): MatchingGroup[] {
  const matchedGroups: MatchingGroup[] = []

  // 日程・エリア・時間でグループ化
  const slotGroups = groupCandidatesBySlot(candidates)

  for (const slotKey of slotGroups.keys()) {
    const slotCandidates = slotGroups.get(slotKey)!
    const [eventDate, eventTime, areaId] = slotKey.split('_')

    // 参加タイプで分離
    const { solo, group: groupParticipants } = separateByParticipationType(slotCandidates)

    // まずソロ参加者同士でマッチング
    const soloGroups = matchSoloCandidates(solo, config, eventDate, eventTime, parseInt(areaId))
    matchedGroups.push(...soloGroups)

    // 友達グループ参加者のマッチング（将来実装）
    // const groupGroups = matchGroupCandidates(groupParticipants, config, eventDate, eventTime, parseInt(areaId))
    // matchedGroups.push(...groupGroups)
  }

  return matchedGroups
}

/**
 * ソロ参加者同士のマッチング
 */
function matchSoloCandidates(
  candidates: MatchingCandidate[],
  config: MatchingConfig,
  eventDate: string,
  eventTime: string,
  areaId: number
): MatchingGroup[] {
  const groups: MatchingGroup[] = []

  if (candidates.length < config.minGroupSize) {
    return groups // 最小人数に満たない場合はマッチングしない
  }

  // 性別でグループ分け
  const { males, females } = separateByGender(candidates)

  // 年齢でソート
  const sortedMales = sortByAge(males)
  const sortedFemales = sortByAge(females)

  // グループ作成
  let maleIndex = 0
  let femaleIndex = 0

  while (
    maleIndex + config.preferredMaleCount <= sortedMales.length &&
    femaleIndex + config.preferredFemaleCount <= sortedFemales.length
  ) {
    const groupMales = sortedMales.slice(maleIndex, maleIndex + config.preferredMaleCount)
    const groupFemales = sortedFemales.slice(femaleIndex, femaleIndex + config.preferredFemaleCount)

    // 年齢差チェック
    if (isAgeCompatible([...groupMales, ...groupFemales], config.maxAgeDifference)) {
      const group: MatchingGroup = {
        event_date: eventDate,
        event_time: eventTime,
        area_id: areaId,
        members: [...groupMales, ...groupFemales],
        status: 'formed'
      }

      groups.push(group)
    }

    maleIndex += config.preferredMaleCount
    femaleIndex += config.preferredFemaleCount
  }

  return groups
}

/**
 * 年齢の互換性チェック
 */
function isAgeCompatible(candidates: MatchingCandidate[], maxAgeDifference: number): boolean {
  if (candidates.length === 0) return true

  const ages = candidates.map(c => c.profile.age)
  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)

  return (maxAge - minAge) <= maxAgeDifference
}

/**
 * マッチング統計情報
 */
export interface MatchingStats {
  totalCandidates: number
  totalGroups: number
  matchedCandidates: number
  unmatchedCandidates: number
  maleCount: number
  femaleCount: number
  averageAge: number
}

export function calculateMatchingStats(
  candidates: MatchingCandidate[],
  groups: MatchingGroup[]
): MatchingStats {
  const matchedCandidates = groups.reduce((sum, group) => sum + group.members.length, 0)
  const { males, females } = separateByGender(candidates)
  const averageAge = candidates.length > 0
    ? candidates.reduce((sum, c) => sum + c.profile.age, 0) / candidates.length
    : 0

  return {
    totalCandidates: candidates.length,
    totalGroups: groups.length,
    matchedCandidates,
    unmatchedCandidates: candidates.length - matchedCandidates,
    maleCount: males.length,
    femaleCount: females.length,
    averageAge: Math.round(averageAge * 10) / 10
  }
}