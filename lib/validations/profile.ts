import { z } from 'zod'

// 年齢計算
export const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return age
}

const disallowedNicknamePattern = /[<>]/
const inappropriateWords = ['セックス', '援助', 'お金', '売買']

export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, 'ニックネームは2文字以上で入力してください')
    .max(20, 'ニックネームは20文字以下で入力してください')
    .refine(
      (value) => !disallowedNicknamePattern.test(value),
      '使用できない記号（< や >）が含まれています'
    ),

  birthDate: z
    .string()
    .min(1, '生年月日を入力してください')
    .refine((date) => {
      const age = calculateAge(date)
      return age >= 18 && age < 70
    }, '18歳以上70歳未満の方のみご登録いただけます')
    .refine((date) => {
      const birth = new Date(date)
      const today = new Date()
      return birth <= today
    }, '未来の日付は入力できません'),

  gender: z.enum(['male', 'female']),

  bio: z
    .string()
    .trim()
    .min(10, '自己紹介は10文字以上で入力してください')
    .max(500, '自己紹介は500文字以下で入力してください')
    .refine(
      (value) => !inappropriateWords.some((word) => value.includes(word)),
      { message: '自己紹介に不適切な表現が含まれています' }
    )
})

export const signupWithProfileSchema = z
  .object({
    email: z.string().email('有効なメールアドレスを入力してください'),

    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(
        /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/,
        'パスワードは英数字と記号のみ使用できます'
      ),

    passwordConfirm: z.string(),

    nickname: z
      .string()
      .trim()
      .min(2, 'ニックネームは2文字以上で入力してください')
      .max(20, 'ニックネームは20文字以下で入力してください')
      .refine(
        (value) => !disallowedNicknamePattern.test(value),
        '使用できない記号（< や >）が含まれています'
      ),

    birthDate: z
      .string()
      .min(1, '生年月日を入力してください')
      .refine((date) => {
        const age = calculateAge(date)
        return age >= 18 && age < 70
      }, '18歳以上70歳未満の方のみご登録いただけます')
      .refine((date) => {
        const birth = new Date(date)
        const today = new Date()
        return birth <= today
      }, '未来の日付は入力できません'),

    gender: z.enum(['male', 'female']),

    bio: z
      .string()
      .trim()
      .min(10, '自己紹介は10文字以上で入力してください')
      .max(500, '自己紹介は500文字以下で入力してください')
      .refine(
        (value) => !inappropriateWords.some((word) => value.includes(word)),
        { message: '自己紹介に不適切な表現が含まれています' }
      )
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'パスワードが一致しません',
    path: ['passwordConfirm']
  })

export type ProfileFormData = z.infer<typeof profileSchema>
export type SignupWithProfileFormData = z.infer<typeof signupWithProfileSchema>

export const validateProfile = (data: unknown) => profileSchema.safeParse(data)
export const validateSignupWithProfile = (data: unknown) =>
  signupWithProfileSchema.safeParse(data)
