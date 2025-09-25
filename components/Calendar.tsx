'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, parseISO } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CalendarProps {
  selectedDates: string[]
  onDateSelect: (date: string) => void
  onDateDeselect: (date: string) => void
  minDate?: Date
}

export default function Calendar({ selectedDates, onDateSelect, onDateDeselect, minDate = new Date() }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 日曜日開始
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')

    // 過去の日付は選択不可
    if (!isAfter(date, minDate) && !isSameDay(date, minDate)) {
      return
    }

    // 1週間後まで選択可能
    const oneWeekLater = new Date()
    oneWeekLater.setDate(oneWeekLater.getDate() + 7)
    if (isAfter(date, oneWeekLater)) {
      return
    }

    if (selectedDates.includes(dateString)) {
      onDateDeselect(dateString)
    } else {
      onDateSelect(dateString)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const isDateSelectable = (date: Date) => {
    const oneWeekLater = new Date()
    oneWeekLater.setDate(oneWeekLater.getDate() + 7)
    return (isAfter(date, minDate) || isSameDay(date, minDate)) && !isAfter(date, oneWeekLater)
  }

  const isDateSelected = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return selectedDates.includes(dateString)
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={goToPreviousMonth}
          className="p-1 rounded-md hover:bg-gray-100"
          type="button"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'yyyy年M月')}
        </h2>

        <button
          onClick={goToNextMonth}
          className="p-1 rounded-md hover:bg-gray-100"
          type="button"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 p-2 bg-gray-50">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentDate)
          const isSelectable = isDateSelectable(date)
          const isSelected = isDateSelected(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={!isSelectable}
              className={`
                h-10 w-full rounded-md text-sm transition-colors
                ${!isCurrentMonth
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelectable
                    ? isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-900 hover:bg-blue-50'
                    : 'text-gray-300 cursor-not-allowed'
                }
              `}
              type="button"
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>

      {/* Selected Dates Info */}
      {selectedDates.length > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            選択した日程: {selectedDates.length}日
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedDates.map((dateString) => {
              const date = parseISO(dateString)
              return (
                <span
                  key={dateString}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {format(date, 'M/d')}
                  <button
                    onClick={() => onDateDeselect(dateString)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}