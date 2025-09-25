import { z } from 'zod'

// 年齢計算関数
export const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export const profileSchema = z.object({
  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上で入力してください')
    .max(20, 'ニックネームは20文字以下で入力してください')
    .regex(/^[a-zA-Z0-9あ-んア-ン一-龯ー\s]+$/, '特殊文字は使用できません'),

  birthDate: z
    .string()
    .min(1, '生年月日を入力してください')
    .refine((date) => {
      const birthDate = new Date(date)
      const age = calculateAge(date)
      return age >= 18 && age < 70
    }, '18歳以上70歳未満である必要があります')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      return birthDate <= today
    }, '未来の日付は入力できません'),

  gender: z.enum(['male', 'female']),

  bio: z
    .string()
    .min(10, '自己紹介は10文字以上で入力してください')
    .max(500, '自己紹介は500文字以下で入力してください')
    .refine(
      (val) => {
        // 不適切な言葉のフィルタリング（基本的なもの）
        const inappropriateWords = ['セックス', '援助', 'お金', '売買']
        return !inappropriateWords.some(word => val.includes(word))
      },
      { message: '不適切な内容が含まれています' }
    )
})

// サインアップ時のプロフィール統合スキーマ
export const signupWithProfileSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください'),

  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, 'パスワードは英数字と記号のみ使用できます'),

  passwordConfirm: z
    .string(),

  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上で入力してください')
    .max(20, 'ニックネームは20文字以下で入力してください')
    .regex(/^[a-zA-Z0-9あ-んア-ン一-龯ー\s]+$/, '特殊文字は使用できません'),

  birthDate: z
    .string()
    .min(1, '生年月日を入力してください')
    .refine((date) => {
      const age = calculateAge(date)
      return age >= 18 && age < 70
    }, '18歳以上70歳未満である必要があります')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      return birthDate <= today
    }, '未来の日付は入力できません'),

  gender: z.enum(['male', 'female']),

  bio: z
    .string()
    .min(10, '自己紹介は10文字以上で入力してください')
    .max(500, '自己紹介は500文字以下で入力してください')
    .refine(
      (val) => {
        const inappropriateWords = ['セックス', '援助', 'お金', '売買']
        return !inappropriateWords.some(word => val.includes(word))
      },
      { message: '不適切な内容が含まれています' }
    )
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'パスワードが一致しません',
  path: ['passwordConfirm']
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type SignupWithProfileFormData = z.infer<typeof signupWithProfileSchema>

export const validateProfile = (data: unknown) => {
  return profileSchema.safeParse(data)
}

export const validateSignupWithProfile = (data: unknown) => {
  return signupWithProfileSchema.safeParse(data)
}