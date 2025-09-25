'use client'

import { UserIcon, UsersIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

export type ParticipationType = 'solo' | 'group'

interface ParticipationSelectorProps {
  value: ParticipationType
  onChange: (type: ParticipationType) => void
}

export default function ParticipationSelector({ value, onChange }: ParticipationSelectorProps) {
  return (
    <div style={{width: '100%', padding: '0 16px'}}>
      <div style={{marginBottom: '24px', textAlign: 'center'}}>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px'}}>
          👥 参加方式を選択
        </h2>
        <p style={{color: '#4b5563', fontSize: '14px'}}>
          あなたに合った参加スタイルを選んでください ✨
        </p>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px'}}>
        {/* Solo participation */}
        <button
          onClick={() => onChange('solo')}
          style={{
            position: 'relative',
            padding: '24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            transform: 'scale(1)',
            cursor: 'pointer',
            border: 'none',
            ...(value === 'solo'
              ? {
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  boxShadow: '0 10px 25px -3px rgba(139, 92, 246, 0.3), 0 4px 6px -2px rgba(139, 92, 246, 0.05)'
                }
              : {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(16px)',
                  border: '2px solid #e5e7eb',
                  color: '#1f2937'
                }
            )
          }}
          onMouseEnter={(e) => {
            if (value !== 'solo') {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            if (value !== 'solo') {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.boxShadow = 'none'
            }
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
        >
          {value === 'solo' && (
            <div style={{position: 'absolute', top: '-8px', right: '-8px', width: '32px', height: '32px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
              <CheckIcon style={{width: '20px', height: '20px', color: '#8b5cf6'}} />
            </div>
          )}

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
            <div style={{
              padding: '12px',
              borderRadius: '50%',
              ...(value === 'solo'
                ? { background: 'rgba(255, 255, 255, 0.2)' }
                : { background: '#f9fafb' }
              )
            }}>
              <UserIcon style={{
                width: '32px',
                height: '32px',
                ...(value === 'solo' ? { color: 'white' } : { color: '#4b5563' })
              }} />
            </div>
            <div style={{textAlign: 'center'}}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '4px',
                ...(value === 'solo' ? { color: 'white' } : { color: '#1f2937' })
              }}>
                ソロで参加
              </h3>
              <p style={{
                fontSize: '12px',
                lineHeight: '1.4',
                ...(value === 'solo'
                  ? { color: 'rgba(255, 255, 255, 0.8)' }
                  : { color: '#6b7280' }
                )
              }}>
                一人で参加して、<br />
                他のソロ参加者とマッチング
              </p>
            </div>
          </div>
        </button>

        {/* Group participation */}
        <button
          onClick={() => onChange('group')}
          style={{
            position: 'relative',
            padding: '24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            transform: 'scale(1)',
            cursor: 'pointer',
            border: 'none',
            ...(value === 'group'
              ? {
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  color: 'white',
                  boxShadow: '0 10px 25px -3px rgba(6, 182, 212, 0.3), 0 4px 6px -2px rgba(6, 182, 212, 0.05)'
                }
              : {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(16px)',
                  border: '2px solid #e5e7eb',
                  color: '#1f2937'
                }
            )
          }}
          onMouseEnter={(e) => {
            if (value !== 'group') {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            if (value !== 'group') {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.boxShadow = 'none'
            }
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
        >
          {value === 'group' && (
            <div style={{position: 'absolute', top: '-8px', right: '-8px', width: '32px', height: '32px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
              <CheckIcon style={{width: '20px', height: '20px', color: '#06b6d4'}} />
            </div>
          )}

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
            <div style={{
              padding: '12px',
              borderRadius: '50%',
              position: 'relative',
              ...(value === 'group'
                ? { background: 'rgba(255, 255, 255, 0.2)' }
                : { background: '#f9fafb' }
              )
            }}>
              <UsersIcon style={{
                width: '32px',
                height: '32px',
                ...(value === 'group' ? { color: 'white' } : { color: '#4b5563' })
              }} />
            </div>
            <div style={{textAlign: 'center'}}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '4px',
                ...(value === 'group' ? { color: 'white' } : { color: '#1f2937' })
              }}>
                友達と参加
              </h3>
              <p style={{
                fontSize: '12px',
                lineHeight: '1.4',
                marginBottom: value === 'group' ? '12px' : '0',
                ...(value === 'group'
                  ? { color: 'rgba(255, 255, 255, 0.8)' }
                  : { color: '#6b7280' }
                )
              }}>
                友達を誘って一緒に参加
              </p>
              {value === 'group' && (
                <button style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: '500',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}>
                  友達を選ぶ
                </button>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}