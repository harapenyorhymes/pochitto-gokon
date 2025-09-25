'use client'

import { RadioGroup } from '@headlessui/react'

export type TimeSlot = 'lunch' | 'dinner' | 'flexible'

interface TimeSlotSelectorProps {
  value: TimeSlot
  onChange: (timeSlot: TimeSlot) => void
}

const timeSlotOptions = [
  {
    id: 'lunch' as const,
    name: 'ランチタイム',
    time: '12:00 - 15:00',
    description: 'カジュアルなランチで気軽に交流',
    icon: '🌅',
  },
  {
    id: 'dinner' as const,
    name: 'ディナータイム',
    time: '18:00 - 21:00',
    description: 'じっくり話せる本格的な合コン',
    icon: '🌙',
  },
  {
    id: 'flexible' as const,
    name: '終日フレキシブル',
    time: '時間調整可能',
    description: 'マッチング相手に合わせて時間調整',
    icon: '⏰',
  },
]

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">🕐 時間帯を選択</h3>

      <RadioGroup value={value} onChange={onChange}>
        <div className="space-y-3">
          {timeSlotOptions.map((option) => (
            <RadioGroup.Option
              key={option.id}
              value={option.id}
              className={({ active, checked }) =>
                `${active ? 'ring-2 ring-pink-500' : ''}
                ${checked ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-200'}
                relative flex cursor-pointer rounded-lg px-5 py-4 border shadow-sm focus:outline-none`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">
                      {option.icon}
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <RadioGroup.Label
                          as="p"
                          className={`font-medium ${checked ? 'text-pink-900' : 'text-gray-900'}`}
                        >
                          {option.name}
                        </RadioGroup.Label>
                        <span className={`ml-4 text-sm ${checked ? 'text-pink-700' : 'text-gray-500'}`}>
                          {option.time}
                        </span>
                      </div>
                      <RadioGroup.Description
                        as="span"
                        className={`inline ${checked ? 'text-pink-700' : 'text-gray-500'}`}
                      >
                        {option.description}
                      </RadioGroup.Description>
                    </div>
                  </div>
                  {checked && (
                    <div className="shrink-0 text-pink-600">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="#ec4899"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}