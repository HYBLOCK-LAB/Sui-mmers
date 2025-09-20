import { useMemo } from 'react'
import { SwimmerSummary } from '@/lib/types/swimmer'

interface SwimmingPoolProps {
  swimmers: SwimmerSummary[]
}

export function SwimmingPool({ swimmers }: SwimmingPoolProps) {
  const maxDistance = useMemo(() => {
    if (swimmers.length === 0) return 0
    return swimmers.reduce((max, swimmer) => Math.max(max, swimmer.distanceTraveled), 0)
  }, [swimmers])

  const getPosition = (distance: number) => {
    if (maxDistance === 0) {
      return '10%'
    }

    const normalized = Math.min(distance / Math.max(maxDistance, 1), 1)
    const offset = 10 + normalized * 78
    return `${offset}%`
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '미갱신'
    const date = new Date(Number(timestamp))
    if (Number.isNaN(date.getTime())) {
      return '미갱신'
    }
    return date.toLocaleString()
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
              left: getPosition(swimmer.distanceTraveled),
              transition: 'left 1.5s ease-out',
            }}
          >
            <div className="text-4xl">
              🏊‍♂️
            </div>
            <div className="ml-3 bg-white/90 rounded-lg px-3 py-1 shadow">
              <div className="font-bold text-sm">{swimmer.name}</div>
              <div className="text-xs text-gray-600">
                {swimmer.species}
              </div>
              <div className="text-xs text-blue-600">
                총 이동 {swimmer.distanceTraveled}m
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 능력치 표시 */}
      <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 shadow">
        <h4 className="font-semibold text-sm mb-2">선수 현황</h4>
        {swimmers.map(swimmer => (
          <div key={swimmer.id} className="text-xs mb-1">
            <span className="font-medium">{swimmer.name}</span>
            <div className="flex gap-3 text-gray-600">
              <span>기본 속도: {swimmer.baseSpeedPerHour}m/h</span>
              <span>마지막 업데이트: {formatTimestamp(swimmer.lastUpdateTimestampMs)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
