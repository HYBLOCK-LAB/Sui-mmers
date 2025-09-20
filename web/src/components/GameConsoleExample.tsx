/**
 * 게임 콘솔 예제 컴포넌트
 * SwimmerGameInterface를 사용하는 방법을 보여주는 예제입니다.
 * 
 * 이 코드는 게임 콘솔 개발자가 참고할 수 있는 템플릿입니다.
 */

'use client'

import { useEffect, useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { SwimmerGameInterface } from '@/lib/services/swimmerGameInterface'
import type { GameState, SwimmerData } from '@/lib/types/gameInterface'

export function GameConsoleExample() {
  // 게임 인터페이스 초기화
  const [gameInterface] = useState(() => new SwimmerGameInterface({
    network: 'testnet',
    autoRefresh: true,
    refreshInterval: 5000
  }))
  
  // 게임 상태
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedSwimmer, setSelectedSwimmer] = useState<SwimmerData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 지갑 연결 상태
  const currentAccount = useCurrentAccount()
  
  // 사용자가 변경되면 게임 인터페이스 업데이트
  useEffect(() => {
    if (!currentAccount?.address) {
      setGameState(null)
      return
    }
    
    // 사용자 설정
    gameInterface.setCurrentUser(currentAccount.address)
    
    // 초기 데이터 로드
    loadGameState()
    
    // 이벤트 구독
    const handleGameStateUpdate = (state: GameState) => {
      console.log('게임 상태 업데이트:', state)
      setGameState(state)
    }
    
    const handleError = (error: any) => {
      console.error('게임 에러:', error)
    }
    
    gameInterface.on('gameStateUpdated', handleGameStateUpdate)
    gameInterface.on('error', handleError)
    
    // 클린업
    return () => {
      gameInterface.off('gameStateUpdated', handleGameStateUpdate)
      gameInterface.off('error', handleError)
    }
  }, [currentAccount?.address])
  
  // 게임 상태 로드
  const loadGameState = async () => {
    setIsLoading(true)
    try {
      const state = await gameInterface.getGameState()
      setGameState(state)
      
      // 첫 번째 Swimmer 선택
      if (state.swimmers.length > 0) {
        setSelectedSwimmer(state.swimmers[0])
      }
    } catch (error) {
      console.error('게임 상태 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Swimmer 상세 정보 가져오기
  const loadSwimmerDetails = async (swimmerId: string) => {
    try {
      const details = await gameInterface.getSwimmerDetails(swimmerId)
      if (details) {
        setSelectedSwimmer(details)
      }
    } catch (error) {
      console.error('Swimmer 상세 정보 로드 실패:', error)
    }
  }
  
  // 패키지 ID 설정 (컨트랙트 배포 후)
  const handlePackageDeployed = (packageId: string) => {
    gameInterface.setPackageId(packageId)
    console.log('패키지 배포 완료:', packageId)
  }
  
  // UI 렌더링
  if (!currentAccount) {
    return (
      <div className="p-4 text-center">
        <p>지갑을 연결해주세요</p>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>게임 데이터 로딩중...</p>
      </div>
    )
  }
  
  if (!gameState) {
    return (
      <div className="p-4 text-center">
        <p>게임 데이터를 불러올 수 없습니다</p>
        <button onClick={loadGameState} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          다시 시도
        </button>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* 게임 상태 요약 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-2">게임 상태</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Swimmer 수:</span>
            <span className="ml-2 font-semibold">{gameState.swimmerCount}</span>
          </div>
          <div>
            <span className="text-gray-600">총 거리:</span>
            <span className="ml-2 font-semibold">{gameState.totalDistance}m</span>
          </div>
          <div>
            <span className="text-gray-600">TunaCan 수:</span>
            <span className="ml-2 font-semibold">{gameState.tunaCount}</span>
          </div>
          <div>
            <span className="text-gray-600">마지막 업데이트:</span>
            <span className="ml-2 font-semibold">
              {new Date(gameState.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Swimmer 목록 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-2">내 Swimmer들</h2>
        {gameState.swimmers.length === 0 ? (
          <p className="text-gray-500">아직 Swimmer가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {gameState.swimmers.map((swimmer) => (
              <div
                key={swimmer.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedSwimmer?.id === swimmer.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => loadSwimmerDetails(swimmer.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{swimmer.name}</p>
                    <p className="text-sm text-gray-600">{swimmer.species}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{swimmer.distanceTraveled}m</p>
                    <p className="text-xs text-gray-500">거리</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 선택된 Swimmer 상세 정보 */}
      {selectedSwimmer && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-2">Swimmer 상세 정보</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="ml-2 font-mono text-xs">{selectedSwimmer.id}</span>
            </div>
            <div>
              <span className="text-gray-600">이름:</span>
              <span className="ml-2 font-semibold">{selectedSwimmer.name}</span>
            </div>
            <div>
              <span className="text-gray-600">종족:</span>
              <span className="ml-2">{selectedSwimmer.species}</span>
            </div>
            <div>
              <span className="text-gray-600">이동 거리:</span>
              <span className="ml-2 font-semibold">{selectedSwimmer.distanceTraveled}m</span>
            </div>
            {selectedSwimmer.baseSpeedPerHour && (
              <div>
                <span className="text-gray-600">속도:</span>
                <span className="ml-2">{selectedSwimmer.baseSpeedPerHour}m/h</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 액션 버튼들 */}
      <div className="flex gap-2">
        <button
          onClick={loadGameState}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          새로고침
        </button>
      </div>
    </div>
  )
}