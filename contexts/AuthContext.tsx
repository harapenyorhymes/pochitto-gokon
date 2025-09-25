'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, getCurrentUser, onAuthStateChange } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期ユーザー状態取得
    const getInitialUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to get current user:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // 認証状態変更の監視
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user)
      setLoading(false)

      // ユーザーがログインし、保留中のプロフィールがある場合に処理
      if (user && typeof window !== 'undefined') {
        const pendingProfile = localStorage.getItem('pendingProfile')
        if (pendingProfile) {
          try {
            const profileData = JSON.parse(pendingProfile)
            console.log('AuthContext: Found pending profile, saving:', profileData)

            const profileResponse = await fetch('/api/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(profileData),
            })

            if (profileResponse.ok) {
              console.log('AuthContext: Pending profile saved successfully')
              localStorage.removeItem('pendingProfile')
            } else {
              console.error('AuthContext: Failed to save pending profile')
            }
          } catch (err) {
            console.error('AuthContext: Error saving pending profile:', err)
          }
        }
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/auth')
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    loading,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}