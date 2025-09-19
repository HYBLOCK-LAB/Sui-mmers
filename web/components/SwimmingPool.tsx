import { useEffect, useState } from 'react'
import { STYLE_NAMES, SwimmingStyle } from '@/src/contracts/moveTemplates'

interface Swimmer {
  id: string
  name: string
  speed: number
  style: number
  stamina: number
  medals: number
}

interface SwimmingPoolProps {
  swimmers: Swimmer[]
}

export function SwimmingPool({ swimmers }: SwimmingPoolProps) {
  const [animatingSwimmers, setAnimatingSwimmers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // 새 수영선수가 추가되면 애니메이션 시작
    const newSwimmerIds = swimmers.map(s => s.id)
    setAnimatingSwimmers(new Set(newSwimmerIds))
  }, [swimmers])

  const getSwimmerStyle = (style: number) => {
    switch (style) {
      case SwimmingStyle.FREESTYLE:
        return 'rotate-12' // 자유형 - 약간 기울어진 자세
      case SwimmingStyle.BACKSTROKE:
        return 'rotate-180' // 배영 - 뒤집힌 자세
      case SwimmingStyle.BREASTSTROKE:
        return 'scale-x-110' // 평영 - 넓은 자세
      case SwimmingStyle.BUTTERFLY:
        return 'scale-y-90' // 접영 - 다이나믹한 자세
      default:
        return ''
    }
  }

  const getAnimationDuration = (speed: number) => {
    // 속도가 빠를수록 애니메이션 시간이 짧음
    return `${8 - (speed / 100) * 5}s`
  }

  if (swimmers.length === 0) {
    return (
      <div className="bg-gradient-to-b from-cyan-100 to-cyan-300 rounded-xl p-8 h-96 relative overflow-hidden">
        {/* 물결 애니메이션 */}
        <div className="absolute inset-0">
          <div className="wave-animation"></div>
        </div>
        
        {/* 수영장 레인 */}
        <div className="absolute inset-0 flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 border-l-2 border-blue-400 opacity-30"></div>
          ))}
        </div>
        
        <div className="relative flex items-center justify-center h-full">
          <div className="text-center bg-white/80 rounded-lg p-6">
            <span className="text-6xl mb-4 block">🏊‍♂️</span>
            <p className="text-gray-700 font-medium">
              수영 선수를 생성하면 여기에 표시됩니다!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              지갑 연결 후 코드를 배포해보세요
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-cyan-100 to-cyan-300 rounded-xl p-8 h-96 relative overflow-hidden">
      {/* 물결 애니메이션 */}
      <div className="absolute inset-0">
        <div className="wave-animation"></div>
      </div>
      
      {/* 수영장 레인 */}
      <div className="absolute inset-0 flex">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 border-l-2 border-blue-400 opacity-30"></div>
        ))}
      </div>
      
      {/* 수영 선수들 */}
      <div className="relative h-full">
        {swimmers.map((swimmer, index) => (
          <div
            key={swimmer.id}
            className="absolute flex items-center"
            style={{
              top: `${(index * 60) + 20}px`,
              left: animatingSwimmers.has(swimmer.id) ? '90%' : '10px',
              transition: `left ${getAnimationDuration(swimmer.speed)} ease-in-out`,
            }}
          >
            <div className={`text-4xl ${getSwimmerStyle(swimmer.style)} transition-transform`}>
              🏊
            </div>
            <div className="ml-3 bg-white/90 rounded-lg px-3 py-1">
              <div className="font-bold text-sm">{swimmer.name}</div>
              <div className="text-xs text-gray-600">
                {STYLE_NAMES[swimmer.style as SwimmingStyle]} | 속도: {swimmer.speed}
              </div>
              {swimmer.medals > 0 && (
                <div className="text-xs">
                  {'🥇'.repeat(Math.min(swimmer.medals, 5))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 능력치 표시 */}
      <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3">
        <h4 className="font-semibold text-sm mb-2">선수 현황</h4>
        {swimmers.map(swimmer => (
          <div key={swimmer.id} className="text-xs mb-1">
            <span className="font-medium">{swimmer.name}</span>
            <div className="flex gap-3 text-gray-600">
              <span>속도: {swimmer.speed}</span>
              <span>체력: {swimmer.stamina}</span>
              <span>메달: {swimmer.medals}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}