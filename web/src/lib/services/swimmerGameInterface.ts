/**
 * Swimmer Game Interface
 * 게임 콘솔 개발자를 위한 블록체인 데이터 인터페이스
 * 
 * @module swimmerGameInterface
 * @description 이 인터페이스는 Sui 블록체인과 게임 콘솔 간의 상호작용을 추상화합니다.
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import type {
  SwimmerData,
  TunaCanData,
  GameState,
  GameEvent,
  GameInterfaceConfig,
  TransactionResult,
  MintParams,
  SwimParams,
  LeaderboardEntry,
  GameStats,
  FilterOptions,
  PaginationOptions,
  GameError
} from '../types/gameInterface'

/**
 * SwimmerGameInterface - 메인 게임 인터페이스 클래스
 * 
 * @example
 * ```typescript
 * // 인터페이스 초기화
 * const gameInterface = new SwimmerGameInterface({
 *   network: 'testnet',
 *   packageId: '0x...',
 *   autoRefresh: true,
 *   refreshInterval: 5000
 * })
 * 
 * // 지갑 연결
 * await gameInterface.connect(walletAddress)
 * 
 * // 게임 상태 가져오기
 * const state = await gameInterface.getGameState()
 * 
 * // Swimmer 민팅
 * await gameInterface.mintSwimmer({ name: 'Speedy', species: 'Dolphin' })
 * ```
 */
export class SwimmerGameInterface {
  private client: SuiClient
  private config: GameInterfaceConfig
  private packageId: string | null = null
  private userAddress: string | null = null
  private eventListeners: Map<string, Set<(event: GameEvent) => void>> = new Map()
  private refreshTimer: NodeJS.Timer | null = null
  private cache: Map<string, { data: any, timestamp: number }> = new Map()
  private readonly CLOCK_OBJECT_ID = '0x6'
  
  constructor(config: GameInterfaceConfig) {
    this.config = {
      autoRefresh: false,
      refreshInterval: 5000,
      cacheExpiry: 30000,
      ...config
    }
    
    const rpcUrl = getFullnodeUrl(config.network)
    this.client = new SuiClient({ url: rpcUrl })
    this.packageId = config.packageId || null
    
    if (this.config.autoRefresh) {
      this.startAutoRefresh()
    }
  }
  
  /**
   * 사용자 지갑 연결
   * @param address - 지갑 주소
   */
  async connect(address: string): Promise<void> {
    this.userAddress = address
    await this.refreshGameState()
  }
  
  /**
   * 현재 게임 상태 가져오기
   * @returns 전체 게임 상태
   */
  async getGameState(): Promise<GameState> {
    const cacheKey = `gameState_${this.userAddress}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached
    
    if (!this.userAddress) {
      throw new Error('Wallet not connected')
    }
    
    const [swimmers, tunaCans] = await Promise.all([
      this.getUserSwimmers(),
      this.getUserTunaCans()
    ])
    
    const totalDistance = swimmers.reduce((sum, s) => sum + s.distanceTraveled, 0)
    
    const state: GameState = {
      userAddress: this.userAddress,
      packageId: this.packageId,
      swimmers,
      tunaCans,
      totalDistance,
      swimmerCount: swimmers.length,
      tunaCount: tunaCans.length,
      lastUpdated: Date.now()
    }
    
    this.setCache(cacheKey, state)
    return state
  }
  
  /**
   * 사용자의 모든 Swimmer 가져오기
   * @param address - 지갑 주소 (기본값: 연결된 지갑)
   */
  async getUserSwimmers(address?: string): Promise<SwimmerData[]> {
    const owner = address || this.userAddress
    if (!owner) throw new Error('Address required')
    
    const objects = await this.client.getOwnedObjects({
      owner,
      filter: {
        StructType: `${this.packageId}::swimmer::Swimmer`
      },
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    })
    
    return objects.data
      .map((obj: any) => this.parseSwimmerData(obj))
      .filter(Boolean) as SwimmerData[]
  }
  
  /**
   * 사용자의 모든 TunaCan 가져오기
   * @param address - 지갑 주소 (기본값: 연결된 지갑)
   */
  async getUserTunaCans(address?: string): Promise<TunaCanData[]> {
    const owner = address || this.userAddress
    if (!owner) throw new Error('Address required')
    
    const objects = await this.client.getOwnedObjects({
      owner,
      filter: {
        StructType: `${this.packageId}::swimmer::TunaCan`
      },
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    })
    
    return objects.data
      .map((obj: any) => this.parseTunaData(obj))
      .filter(Boolean) as TunaCanData[]
  }
  
  /**
   * 특정 Swimmer 정보 가져오기
   * @param swimmerId - Swimmer 오브젝트 ID
   */
  async getSwimmer(swimmerId: string): Promise<SwimmerData | null> {
    const obj = await this.client.getObject({
      id: swimmerId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true
      }
    })
    
    return this.parseSwimmerData(obj)
  }
  
  /**
   * 새로운 Swimmer 민팅
   * @param params - 민팅 파라미터 (name, species)
   */
  async mintSwimmer(params: MintParams): Promise<TransactionResult> {
    if (!this.packageId) {
      throw new Error('Package ID not set')
    }
    
    const tx = new Transaction()
    tx.moveCall({
      target: `${this.packageId}::swimmer::mint_swimmer`,
      arguments: [
        tx.pure.string(params.name),
        tx.pure.string(params.species)
      ]
    })
    
    return this.executeTransaction(tx)
  }
  
  /**
   * Swimmer 전진시키기
   * @param params - 이동 파라미터 (swimmerId, distance)
   */
  async swimForward(params: SwimParams): Promise<TransactionResult> {
    if (!this.packageId) {
      throw new Error('Package ID not set')
    }
    
    const tx = new Transaction()
    tx.moveCall({
      target: `${this.packageId}::swimmer::swim_forward`,
      arguments: [
        tx.object(params.swimmerId),
        tx.pure.u64(params.distance)
      ]
    })
    
    return this.executeTransaction(tx)
  }
  
  /**
   * 시간 기반 진행 업데이트 (고급 버전)
   * @param swimmerId - Swimmer 오브젝트 ID
   */
  async updateProgress(swimmerId: string): Promise<TransactionResult> {
    if (!this.packageId) {
      throw new Error('Package ID not set')
    }
    
    const tx = new Transaction()
    tx.moveCall({
      target: `${this.packageId}::swimmer::update_progress`,
      arguments: [
        tx.object(swimmerId),
        tx.object(this.CLOCK_OBJECT_ID)
      ]
    })
    
    return this.executeTransaction(tx)
  }
  
  /**
   * TunaCan 민팅
   */
  async mintTuna(): Promise<TransactionResult> {
    if (!this.packageId) {
      throw new Error('Package ID not set')
    }
    
    const tx = new Transaction()
    tx.moveCall({
      target: `${this.packageId}::swimmer::mint_tuna`,
      arguments: []
    })
    
    return this.executeTransaction(tx)
  }
  
  /**
   * Swimmer에게 TunaCan 먹이기
   * @param swimmerId - Swimmer 오브젝트 ID
   * @param tunaId - TunaCan 오브젝트 ID
   */
  async feedTuna(swimmerId: string, tunaId: string): Promise<TransactionResult> {
    if (!this.packageId) {
      throw new Error('Package ID not set')
    }
    
    const tx = new Transaction()
    tx.moveCall({
      target: `${this.packageId}::swimmer::eat_tuna`,
      arguments: [
        tx.object(swimmerId),
        tx.object(tunaId),
        tx.object(this.CLOCK_OBJECT_ID)
      ]
    })
    
    return this.executeTransaction(tx)
  }
  
  /**
   * 리더보드 가져오기
   * @param limit - 최대 결과 수
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    // 모든 Swimmer 가져오기 (실제로는 인덱싱 서비스 사용 권장)
    const allSwimmers: SwimmerData[] = []
    
    // 거리순 정렬
    allSwimmers.sort((a, b) => b.distanceTraveled - a.distanceTraveled)
    
    return allSwimmers.slice(0, limit).map((swimmer, index) => ({
      rank: index + 1,
      swimmer,
      ownerAddress: swimmer.owner,
      ownerName: undefined // 추가 프로필 서비스와 연동 가능
    }))
  }
  
  /**
   * 게임 통계 가져오기
   */
  async getGameStats(): Promise<GameStats> {
    // 실제로는 인덱싱 서비스나 별도 통계 서비스 사용 권장
    const stats: GameStats = {
      totalSwimmers: 0,
      totalDistanceTraveled: 0,
      activeUsers: 0,
      recentActivity: []
    }
    
    return stats
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event - 이벤트 타입
   * @param callback - 콜백 함수
   */
  on(event: string, callback: (data: GameEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)?.add(callback)
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event - 이벤트 타입
   * @param callback - 콜백 함수
   */
  off(event: string, callback: (data: GameEvent) => void): void {
    this.eventListeners.get(event)?.delete(callback)
  }
  
  /**
   * 패키지 ID 설정
   * @param packageId - 배포된 패키지 ID
   */
  setPackageId(packageId: string): void {
    this.packageId = packageId
    this.emit('package_deployed', { packageId })
  }
  
  /**
   * 자동 새로고침 시작
   */
  startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    
    this.refreshTimer = setInterval(
      () => this.refreshGameState(),
      this.config.refreshInterval || 5000
    )
  }
  
  /**
   * 자동 새로고침 중지
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }
  
  /**
   * 연결 해제
   */
  disconnect(): void {
    this.stopAutoRefresh()
    this.userAddress = null
    this.cache.clear()
    this.eventListeners.clear()
  }
  
  // ============= Private Methods =============
  
  private async executeTransaction(tx: Transaction): Promise<TransactionResult> {
    // 실제 구현에서는 지갑 연결과 서명이 필요
    // 여기서는 인터페이스 정의만 제공
    throw new Error('Transaction execution requires wallet integration')
  }
  
  private parseSwimmerData(obj: any): SwimmerData | null {
    if (!obj?.data?.content?.fields) return null
    
    const fields = obj.data.content.fields
    return {
      id: obj.data.objectId,
      name: fields.name || 'Unknown',
      species: fields.species || 'Unknown',
      distanceTraveled: parseInt(fields.distance_traveled || '0'),
      baseSpeedPerHour: parseInt(fields.base_speed_per_hour || '0'),
      lastUpdateTimestampMs: parseInt(fields.last_update_timestamp_ms || '0'),
      owner: obj.data.owner?.AddressOwner || '',
      type: 'swimmer'
    }
  }
  
  private parseTunaData(obj: any): TunaCanData | null {
    if (!obj?.data?.content?.fields) return null
    
    const fields = obj.data.content.fields
    return {
      id: obj.data.objectId,
      energy: parseInt(fields.energy || '0'),
      owner: obj.data.owner?.AddressOwner || '',
      type: 'tuna'
    }
  }
  
  private async refreshGameState(): Promise<void> {
    if (!this.userAddress) return
    
    try {
      const state = await this.getGameState()
      this.emit('swimmer_updated', state.swimmers)
      this.emit('tuna_updated', state.tunaCans)
    } catch (error) {
      this.emit('error', error)
    }
  }
  
  private emit(event: string, data: any): void {
    const gameEvent: GameEvent = {
      type: event as any,
      payload: data,
      timestamp: Date.now()
    }
    
    this.eventListeners.get(event)?.forEach(callback => {
      callback(gameEvent)
    })
    
    this.eventListeners.get('*')?.forEach(callback => {
      callback(gameEvent)
    })
  }
  
  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > (this.config.cacheExpiry || 30000)) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}

/**
 * 싱글톤 인스턴스 생성 헬퍼
 */
let gameInterfaceInstance: SwimmerGameInterface | null = null

export function getGameInterface(config?: GameInterfaceConfig): SwimmerGameInterface {
  if (!gameInterfaceInstance && config) {
    gameInterfaceInstance = new SwimmerGameInterface(config)
  }
  
  if (!gameInterfaceInstance) {
    throw new Error('Game interface not initialized. Call with config first.')
  }
  
  return gameInterfaceInstance
}

export default SwimmerGameInterface