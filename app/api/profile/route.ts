import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { validateProfile, calculateAge } from '@/lib/validations/profile'
import { NextRequest, NextResponse } from 'next/server'

// プロフィール取得
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プロフィール取得
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found以外のエラー
      throw error
    }

    return NextResponse.json({
      success: true,
      data: profile || null
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 })
  }
}

// プロフィール作成・更新
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', { id: user.id, email: user.email })

    // public.usersテーブルにユーザーが存在するか確認
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (publicUserError) {
      console.error('Public user check error:', publicUserError)
      // usersテーブルにレコードがない場合は作成
      if (publicUserError.code === 'PGRST116') { // Not found
        console.log('Creating user record in public.users table')
        const serviceSupabase = createServiceSupabaseClient()
        const { data: newUser, error: createUserError } = await serviceSupabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email
          })
          .select()
          .single()

        if (createUserError) {
          console.error('Failed to create user record:', createUserError)
          return NextResponse.json({
            success: false,
            error: `Failed to create user record: ${createUserError.message}`
          }, { status: 500 })
        }
        console.log('User record created:', newUser)
      }
    } else {
      console.log('Public user found:', publicUser)
    }

    // リクエストボディを取得
    const body = await request.json()

    // バリデーション（birthDateまたはageフィールドをサポート）
    if (!body.nickname || !body.gender || !body.bio) {
      return NextResponse.json({
        success: false,
        error: 'nickname, gender, bio fields are required'
      }, { status: 400 })
    }

    let age: number
    if (body.birthDate) {
      // birthDateから年齢を計算
      age = calculateAge(body.birthDate)
    } else if (body.age) {
      // 既存のageフィールドをそのまま使用
      age = body.age
    } else {
      return NextResponse.json({
        success: false,
        error: 'birthDate or age field is required'
      }, { status: 400 })
    }

    const validatedData = { ...body, age }

    const { nickname, gender, bio } = validatedData

    // ニックネームの重複チェックを削除（重複可能に変更）

    // プロフィールのupsert（存在しない場合は作成、存在する場合は更新）
    const profileData: any = {
      id: user.id,
      nickname,
      age,
      gender,
      bio,
      is_complete: true,
      updated_at: new Date().toISOString()
    }

    // 生年月日がある場合は追加（一時的に無効化 - データベースにbirth_dateカラムがないため）
    // if (validatedData.birthDate) {
    //   profileData.birth_date = validatedData.birthDate
    // }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'プロフィールを保存しました'
    })
  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save profile'
    }, { status: 500 })
  }
}