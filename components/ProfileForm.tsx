'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, ProfileFormData } from '@/lib/validations/profile'
import { z } from 'zod'

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData & { age?: number }>
  onSubmit: (data: ProfileFormData) => Promise<void>
  isLoading?: boolean
  isEdit?: boolean
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 編集モード用のスキーマ（birthDateオプション）
  const editSchema = z.object({
    nickname: z
      .string()
      .min(2, 'ニックネームは2文字以上で入力してください')
      .max(20, 'ニックネームは20文字以下で入力してください')
      .regex(/^[a-zA-Z0-9あ-んア-ン一-龯ー\s]+$/, '特殊文字は使用できません'),
    birthDate: z.string().optional(),
    gender: z.enum(['male', 'female']),
    bio: z
      .string()
      .min(10, '自己紹介は10文字以上で入力してください')
      .max(500, '自己紹介は500文字以下で入力してください')
  })

  const validationSchema = isEdit ? editSchema : profileSchema

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<any>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      nickname: initialData?.nickname || '',
      birthDate: initialData?.birthDate || '',
      gender: initialData?.gender || undefined,
      bio: initialData?.bio || ''
    },
    mode: 'onChange'
  })

  const bioLength = watch('bio')?.length || 0

  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      setSubmitError(null)
      await onSubmit(data)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {submitError}
        </div>
      )}

      {/* ニックネーム */}
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
          ニックネーム <span className="text-red-500">*</span>
        </label>
        <input
          {...register('nickname')}
          type="text"
          id="nickname"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          placeholder="例：太郎、花子"
        />
        {errors.nickname && (
          <p className="mt-1 text-sm text-red-600">{errors.nickname?.message as string}</p>
        )}
      </div>

      {/* 生年月日 / 年齢 */}
      {isEdit ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            年齢
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
            {initialData?.age}歳
          </div>
          <p className="mt-1 text-sm text-gray-500">生年月日は変更できません</p>
        </div>
      ) : (
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            生年月日 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('birthDate')}
            type="date"
            id="birthDate"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
          <p className="mt-1 text-sm text-orange-600">
            ⚠️ 生年月日は登録後に変更できませんので、正確に入力してください
          </p>
          {errors.birthDate && (
            <p className="mt-1 text-sm text-red-600">{errors.birthDate?.message as string}</p>
          )}
        </div>
      )}

      {/* 性別 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          性別 <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-6">
          <label className="flex items-center">
            <input
              {...register('gender')}
              type="radio"
              value="male"
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">男性</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('gender')}
              type="radio"
              value="female"
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">女性</span>
          </label>
        </div>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600">{errors.gender?.message as string}</p>
        )}
      </div>

      {/* 自己紹介 */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          自己紹介 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('bio')}
          id="bio"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          placeholder="あなたの魅力や趣味、理想の出会いについて教えてください..."
        />
        <div className="flex justify-between mt-1">
          <div>
            {errors.bio && (
              <p className="text-sm text-red-600">{errors.bio?.message as string}</p>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {bioLength}/500文字
          </p>
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isLoading || !isValid}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '保存中...' : 'プロフィールを保存'}
      </button>
    </form>
  )
}