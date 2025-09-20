/**
 * Game Interface Type Definitions
 * 게임 콘솔 개발자를 위한 타입 정의
 */

// ============= 기본 데이터 타입 =============

/**
 * Swimmer NFT 데이터
 */
export interface SwimmerData {
  /** 블록체인 상의 고유 ID */
  id: string
  /** Swimmer 이름 */
  name: string
  /** 종족 (예: "Pacific Orca", "Blue Whale") */
  species: string
  /** 총 이동 거리 */
  distanceTraveled: number
  /** 시간당 기본 속도 (고급 버전에서 사용) */
  baseSpeedPerHour?: number
  /** 마지막 업데이트 시간 (고급 버전에서 사용) */
  lastUpdateTimestampMs?: number
  /** 소유자 주소 */
  owner: string
  /** 오브젝트 타입 */
  type: 'swimmer'
}

/**
 * TunaCan 아이템 데이터
 */
export interface TunaCanData {
  /** 블록체인 상의 고유 ID */
  id: string
  /** 에너지 값 (거리 부스트) */
  energy: number
  /** 소유자 주소 */
  owner: string
  /** 오브젝트 타입 */
  type: 'tuna'
}

// ============= 게임 상태 =============

/**
 * 전체 게임 상태
 */
export interface GameState {
  /** 사용자 주소 */
  userAddress: string
  /** 배포된 패키지 ID */
  packageId: string | null
  /** 사용자가 보유한 모든 Swimmer */
  swimmers: SwimmerData[]
  /** 사용자가 보유한 모든 TunaCan */
  tunaCans: TunaCanData[]
  /** 모든 Swimmer의 총 이동 거리 */
  totalDistance: number
  /** Swimmer 개수 */
  swimmerCount: number
  /** TunaCan 개수 */
  tunaCount: number
  /** 마지막 업데이트 시간 */
  lastUpdated: number
}

// ============= 이벤트 타입 =============

/**
 * Swimmer 관련 이벤트
 */
export interface SwimmerEvent {
  /** 이벤트 타입 */
  type: 'minted' | 'progress' | 'tuna_consumed' | 'transferred'
  /** 관련 Swimmer ID */
  swimmerId: string
  /** 이벤트 데이터 */
  data?: any
  /** 타임스탬프 */
  timestamp: number
}

/**
 * 게임 이벤트
 */
export interface GameEvent {
  /** 이벤트 타입 */
  type: 'swimmer_updated' | 'tuna_updated' | 'package_deployed' | 'error'
  /** 이벤트 페이로드 */
  payload: any
  /** 타임스탬프 */
  timestamp: number
}

// ============= 설정 타입 =============

/**
 * 게임 인터페이스 설정
 */
export interface GameInterfaceConfig {
  /** 네트워크 (testnet, mainnet, devnet) */
  network: 'testnet' | 'mainnet' | 'devnet'
  /** 배포된 패키지 ID */
  packageId?: string
  /** 자동 새로고침 활성화 */
  autoRefresh?: boolean
  /** 새로고침 간격 (ms) */
  refreshInterval?: number
  /** 캐시 만료 시간 (ms) */
  cacheExpiry?: number
}

// ============= 트랜잭션 관련 =============

/**
 * 트랜잭션 결과
 */
export interface TransactionResult {
  /** 성공 여부 */
  success: boolean
  /** 트랜잭션 해시 */
  digest?: string
  /** 생성/변경된 오브젝트 */
  objectChanges?: any[]
  /** 에러 메시지 */
  error?: string
}

/**
 * 민팅 파라미터
 */
export interface MintParams {
  name: string
  species: string
}

/**
 * 이동 파라미터
 */
export interface SwimParams {
  swimmerId: string
  distance: number
}

// ============= 리더보드 =============

/**
 * 리더보드 엔트리
 */
export interface LeaderboardEntry {
  rank: number
  swimmer: SwimmerData
  ownerAddress: string
  ownerName?: string
}

// ============= 게임 통계 =============

/**
 * 게임 통계
 */
export interface GameStats {
  /** 총 Swimmer 수 */
  totalSwimmers: number
  /** 총 이동 거리 */
  totalDistanceTraveled: number
  /** 활성 사용자 수 */
  activeUsers: number
  /** 가장 빠른 Swimmer */
  fastestSwimmer?: SwimmerData
  /** 가장 멀리 간 Swimmer */
  furthestSwimmer?: SwimmerData
  /** 최근 활동 */
  recentActivity: GameEvent[]
}

// ============= 유틸리티 타입 =============

/**
 * 정렬 옵션
 */
export type SortOption = 'distance' | 'speed' | 'name' | 'created'

/**
 * 필터 옵션
 */
export interface FilterOptions {
  species?: string[]
  minDistance?: number
  maxDistance?: number
  owner?: string
}

/**
 * 페이지네이션
 */
export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: SortOption
  sortOrder?: 'asc' | 'desc'
}

// ============= 에러 타입 =============

/**
 * 게임 에러
 */
export interface GameError {
  code: string
  message: string
  details?: any
}