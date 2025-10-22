import { createBrowserClient } from '@supabase/ssr'
import { User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type AuthUser = User | null
export type AuthSession = Session | null

// メール認証でのサインアップ
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  })
  return { data, error }
}

// メール認証でのサインイン
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// LINEログイン（OAuth）を開始
export const signInWithLine = async () => {
  const redirectTo = `${window.location.origin}/auth/callback?provider=line`
  const { data, error } = await supabase.auth.signInWithOAuth({
    // Supabaseの型定義にはLINEが含まれていないためキャストを使用
    provider: 'line' as any,
    options: {
      scopes: 'profile openid email',
      redirectTo
    }
  })
  return { data, error }
}

// サインアウト
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 現在のユーザー取得
export const getCurrentUser = async (): Promise<AuthUser> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 現在のセッション取得
export const getCurrentSession = async (): Promise<AuthSession> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 認証状態の変更を監視
export const onAuthStateChange = (callback: (user: AuthUser) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

// パスワードリセット
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}
