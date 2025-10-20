'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import {
  CalendarIcon as CalendarIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'

interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    id: 'profile',
    label: 'ホーム',
    path: '/',
    icon: UserIcon,
    activeIcon: UserIconSolid
  },
  {
    id: 'events',
    label: '日程登録',
    path: '/events',
    icon: CalendarIcon,
    activeIcon: CalendarIconSolid
  },
  {
    id: 'chat',
    label: 'チャット',
    path: '/chat',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatBubbleLeftRightIconSolid
  }
]

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 50,
      boxShadow: '0 -10px 25px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 24px',
        maxWidth: '428px',
        margin: '0 auto'
      }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path
          const IconComponent = isActive ? item.activeIcon : item.icon

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                minWidth: 0,
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'none',
                color: isActive ? 'white' : '#9ca3af',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#4b5563'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#9ca3af'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = isActive ? 'scale(1)' : 'scale(1.05)'
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #06b6d4)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)'
                }} />
              )}
              <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}>
                <IconComponent className="w-6 h-6" />
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>{item.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}