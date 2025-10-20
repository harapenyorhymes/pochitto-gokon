'use client'

import { useState } from 'react'

interface TimeSlot {
  id: string
  label: string
  startTime: string
  endTime: string
}

interface DateOption {
  date: string
  dayOfWeek: string
  dayNumber: number
  isHot?: boolean
}

const timeSlots: TimeSlot[] = [
  { id: 'slot1', label: '18:00-20:00', startTime: '18:00', endTime: '20:00' },
  { id: 'slot2', label: '20:00-22:00', startTime: '20:00', endTime: '22:00' }
]

interface GridDateTimeSelectorProps {
  value: { date: string; timeSlotId: string }[]
  onChange: (selections: { date: string; timeSlotId: string }[]) => void
}

export default function GridDateTimeSelector({ value, onChange }: GridDateTimeSelectorProps) {
  console.log('GridDateTimeSelector rendered with NEW STYLES! 🎨')
  const [dateOptions] = useState<DateOption[]>(() => {
    const today = new Date()
    const options: DateOption[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      const dayNames = ['日', '月', '火', '水', '木', '金', '土']
      const dayOfWeek = dayNames[date.getDay()]
      const isWeekend = date.getDay() === 0 || date.getDay() === 6

      options.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        dayNumber: date.getDate(),
        isHot: isWeekend
      })
    }

    return options
  })

  const isSelected = (date: string, timeSlotId: string) => {
    return value.some(selection =>
      selection.date === date && selection.timeSlotId === timeSlotId
    )
  }

  const toggleSelection = (date: string, timeSlotId: string) => {
    const newSelections = [...value]
    const existingIndex = newSelections.findIndex(
      selection => selection.date === date && selection.timeSlotId === timeSlotId
    )

    if (existingIndex >= 0) {
      newSelections.splice(existingIndex, 1)
    } else {
      newSelections.push({ date, timeSlotId })
    }

    onChange(newSelections)
  }

  return (
    <div className="w-full" style={{background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', padding: '0'}}>
      <div className="text-center mb-6" style={{padding: '16px'}}>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px'}}>
          📅 参加希望日程を選択
        </h2>
        <p style={{color: '#4b5563', fontSize: '14px'}}>
          複数日程の選択が可能です ✨
        </p>
      </div>

      <div style={{background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '16px', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '24px', margin: '0 16px'}}>
        {/* Header */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px'}}>
          <div></div>
          {timeSlots.map((slot) => (
            <div key={slot.id} style={{textAlign: 'center'}}>
              <span style={{fontSize: '12px', fontWeight: 'bold', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', color: 'white', padding: '8px 12px', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'inline-block'}}>
                {slot.label}
              </span>
            </div>
          ))}
        </div>

        {/* Date rows */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {dateOptions.map((dateOption, index) => (
            <div key={dateOption.date} style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center', borderTop: index > 0 ? '1px solid rgba(156, 163, 175, 0.2)' : 'none', paddingTop: index > 0 ? '16px' : '0'}}>
              {/* Date label */}
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  {dateOption.isHot && (
                    <div style={{display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(to right, #f97316, #ef4444)', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '9999px', marginRight: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', animation: 'pulse 2s infinite'}}>
                      🔥 HOT
                    </div>
                  )}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}}>
                    <span style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937'}}>
                      {dateOption.dayNumber}
                    </span>
                    <span style={{fontSize: '12px', color: '#4b5563', fontWeight: '500'}}>
                      ({dateOption.dayOfWeek})
                    </span>
                  </div>
                </div>
              </div>

              {/* Time slot buttons */}
              {timeSlots.map((slot) => (
                <button
                  key={`${dateOption.date}-${slot.id}`}
                  onClick={() => toggleSelection(dateOption.date, slot.id)}
                  style={{
                    height: '56px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)',
                    ...(isSelected(dateOption.date, slot.id)
                      ? {
                          background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                          border: 'none',
                          boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.3)'
                        }
                      : {
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(16px)',
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }
                    )
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected(dateOption.date, slot.id)) {
                      e.currentTarget.style.borderColor = '#f9a8d4'
                      e.currentTarget.style.background = 'rgba(253, 242, 248, 0.8)'
                    }
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected(dateOption.date, slot.id)) {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                    }
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                    {isSelected(dateOption.date, slot.id) ? (
                      <svg style={{width: '24px', height: '24px', color: 'white'}} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div style={{width: '16px', height: '16px', border: '2px solid #9ca3af', borderRadius: '50%'}}></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}