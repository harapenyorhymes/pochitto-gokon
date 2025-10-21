'use client'

export interface Area {
  id: string
  name: string
  prefecture: string
  city: string
}

interface AreaSelectorProps {
  value: string | null
  onChange: (areaId: string) => void
  areas: Area[]
}

export default function AreaSelector({ value, onChange, areas }: AreaSelectorProps) {
  const handleSelect = (areaId: string) => {
    onChange(areaId)
    console.log('選択されたエリアID:', areaId)
    const selectedArea = areas.find(area => area.id === areaId)
    if (selectedArea) {
      console.log('エリア情報:', {
        id: selectedArea.id,
        name: selectedArea.name,
        prefecture: selectedArea.prefecture,
        city: selectedArea.city
      })
    }
  }

  return (
    <div className="w-full" style={{background: 'linear-gradient(135deg, #fdf2f8, #ffffff, #faf5ff)', padding: '0'}}>
      <div className="text-center mb-6" style={{padding: '16px'}}>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px'}}>
          📍 エリア選択
        </h2>
        <p style={{color: '#4b5563', fontSize: '14px'}}>
          合コンを開催するエリアを選択 ✨
        </p>
      </div>

      <div style={{background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '16px', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '24px', margin: '0 16px'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {areas.map((area) => {
            const isSelected = value === area.id

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSelect(area.id)}
                style={{
                  height: '72px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 20px',
                  ...(isSelected
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
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#f9a8d4'
                    e.currentTarget.style.background = 'rgba(253, 242, 248, 0.8)'
                  }
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
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
                <div style={{textAlign: 'left'}}>
                  <div style={{fontSize: '16px', fontWeight: 'bold', color: isSelected ? 'white' : '#1f2937', marginBottom: '4px'}}>
                    {area.name}
                  </div>
                  <div style={{fontSize: '13px', color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'}}>
                    {area.prefecture} {area.city}
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {isSelected ? (
                    <svg style={{width: '24px', height: '24px', color: 'white'}} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div style={{width: '16px', height: '16px', border: '2px solid #9ca3af', borderRadius: '50%'}}></div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{marginTop: '16px', padding: '12px', background: 'rgba(249, 168, 212, 0.1)', borderRadius: '8px', fontSize: '13px', color: '#4b5563', textAlign: 'center'}}>
          💡 現在は名古屋栄エリアのみ対応しています
        </div>
      </div>
    </div>
  )
}
