import { useMemo } from 'react'
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer'

interface SwimmingPoolProps {
  swimmers: SwimmerSummary[]
  tunaCans?: TunaCanItem[]
  selectedSwimmerId?: string
  selectedTunaId?: string
  onSwimmerSelect?: (id: string) => void
  onTunaSelect?: (id: string) => void
  onUpdateProgress?: () => void
  onMintTuna?: () => void
  onEatTuna?: () => void
  actionLoading?: string | null
  packageId?: string | null
  currentAccount?: any
}

export function SwimmingPool({ 
  swimmers, 
  tunaCans = [], 
  selectedSwimmerId = '', 
  selectedTunaId = '',
  onSwimmerSelect,
  onTunaSelect,
  onUpdateProgress,
  onMintTuna,
  onEatTuna,
  actionLoading,
  packageId,
  currentAccount
}: SwimmingPoolProps) {
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

  const selectedSwimmer = swimmers.find(swimmer => swimmer.id === selectedSwimmerId)
  const selectedTuna = tunaCans.find(tuna => tuna.id === selectedTunaId)

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
      <div className="relative">
        {/* 수영장 영역 */}
        <div className="bg-cover bg-center bg-no-repeat rounded-xl p-8 aspect-video relative overflow-hidden mb-6" style={{ backgroundImage: 'url(/images/ocean_16-9.png)' }}>
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
              <img src="/images/mint.png" alt="Swimmer" className="w-16 h-16 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">
                수영 선수를 생성하면 여기에 표시됩니다!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                지갑 연결 후 코드를 배포해보세요
              </p>
            </div>
          </div>
        </div>

        {/* 게임 콘솔 컨트롤 패널 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🎮 게임 콘솔</h3>
            <span className="text-xs text-gray-500">인벤토리 {tunaCans.length}개</span>
          </div>

          <div className="text-center text-gray-500 py-4">
            <p>먼저 Swimmer를 민팅한 후 게임을 시작하세요</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={onMintTuna}
              disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'mintTuna' ? '민팅 중...' : '🍣 참치 민팅'}
            </button>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            💡 먼저 Swimmer를 민팅하고 게임을 시작해보세요
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 수영장 영역 */}
      <div className="bg-cover bg-center bg-no-repeat rounded-xl p-8 h-[28rem] relative overflow-hidden mb-6" style={{ backgroundImage: 'url(/images/ocean_16-9.png)' }}>
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
        
        {/* 아이템 표시 */}
        <div className="absolute top-4 left-4">
          <img src="/images/tuna_can.png" alt="Tuna Can" className="w-8 h-8" />
          <img src="/images/tuna_floating.png" alt="Tuna Floating" className="w-8 h-8 ml-2" />
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
              <img src="/images/mint.png" alt="Swimmer" className="w-12 h-12" />
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
        <div className="absolute top-4 right-4 bg-white/90 rounded-lg p-3 shadow">
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
      
      {/* 게임 콘솔 컨트롤 패널 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🎮 게임 콘솔</h3>
          <span className="text-xs text-gray-500">인벤토리 {tunaCans.length}개</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Swimmer 선택</label>
            <select
              value={selectedSwimmerId}
              onChange={(event) => onSwimmerSelect?.(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={swimmers.length === 0}
            >
              {swimmers.length === 0 ? (
                <option>먼저 Swimmer를 민팅하세요</option>
              ) : (
                swimmers.map((swimmer) => (
                  <option key={swimmer.id} value={swimmer.id}>
                    {swimmer.name} · {swimmer.distanceTraveled}m
                  </option>
                ))
              )}
            </select>
            {selectedSwimmer && (
              <p className="mt-1 text-xs text-gray-500">
                기본 속도 {selectedSwimmer.baseSpeedPerHour}m/h
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">TunaCan 인벤토리</label>
            <select
              value={selectedTunaId}
              onChange={(event) => onTunaSelect?.(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={tunaCans.length === 0}
            >
              {tunaCans.length === 0 ? (
                <option>참치를 민팅하면 여기에 표시됩니다</option>
              ) : (
                tunaCans.map((tuna) => (
                  <option key={tuna.id} value={tuna.id}>
                    {tuna.id.slice(0, 6)}...{tuna.id.slice(-4)} · +{tuna.energy}m
                  </option>
                ))
              )}
            </select>
            {selectedTuna && (
              <p className="mt-1 text-xs text-gray-500">보너스 거리 +{selectedTuna.energy}m</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={onUpdateProgress}
            disabled={!packageId || !currentAccount || !selectedSwimmerId || actionLoading === 'update'}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'update' ? '업데이트 중...' : '⏱ 자동 전진'}
          </button>
          <button
            onClick={onMintTuna}
            disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'mintTuna' ? '민팅 중...' : '🍣 참치 민팅'}
          </button>
          <button
            onClick={onEatTuna}
            disabled={!packageId || !currentAccount || !selectedSwimmerId || !selectedTunaId || actionLoading === 'eatTuna'}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'eatTuna' ? '처리 중...' : '🍽 먹이기'}
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          💡 update_progress → mint_tuna → eat_tuna 순서로 진행해보세요
        </div>
      </div>
    </div>
  )
}
