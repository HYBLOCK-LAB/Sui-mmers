# Swimmer Game Interface Documentation

## 📋 개요

Swimmer Game Interface는 게임 콘솔 개발자가 블록체인과 쉽게 상호작용할 수 있도록 설계된 TypeScript 인터페이스입니다. 이 문서는 인터페이스 사용법, API 레퍼런스, 그리고 실제 사용 예제를 제공합니다.

## 🚀 빠른 시작

### 설치 및 초기화

```typescript
import { SwimmerGameInterface } from '@/lib/services/swimmerGameInterface';

// 인터페이스 초기화
const gameInterface = new SwimmerGameInterface({
  network: 'testnet',           // 'testnet' | 'mainnet' | 'devnet'
  packageId: '0x...',           // 배포된 Move 패키지 ID
  autoRefresh: true,            // 자동 새로고침 활성화
  refreshInterval: 5000         // 5초마다 새로고침
});

// 사용자 설정 (지갑 연결 후)
gameInterface.setCurrentUser('0xUserAddress');
```

### 기본 사용법

```typescript
// 게임 상태 가져오기
const gameState = await gameInterface.getGameState();
console.log(`사용자의 Swimmer: ${gameState.swimmerCount}개`);
console.log(`총 이동 거리: ${gameState.totalDistance}m`);

// 새로운 Swimmer 민팅
const mintTx = gameInterface.buildMintSwimmerTx('Speedy', 'Blue Whale');
// 트랜잭션 실행 (지갑 SDK 사용)

// Swimmer를 앞으로 이동
const swimTx = gameInterface.buildSwimForwardTx('0xSwimmerId', 100);
// 트랜잭션 실행
```

## 📚 API Reference

### 클래스: `SwimmerGameInterface`

#### Constructor

```typescript
new SwimmerGameInterface(config: GameInterfaceConfig)
```

**Parameters:**
- `config.network`: 블록체인 네트워크 ('testnet' | 'mainnet' | 'devnet')
- `config.packageId?`: 배포된 Move 패키지 ID
- `config.autoRefresh?`: 자동 새로고침 활성화 (기본값: true)
- `config.refreshInterval?`: 새로고침 간격 ms (기본값: 5000)

#### 주요 메서드

##### `setPackageId(packageId: string): void`
컨트랙트 배포 후 패키지 ID 설정

##### `setCurrentUser(address: string): void`
현재 사용자 주소 설정 (지갑 연결 후)

##### `getGameState(userAddress?: string): Promise<GameState>`
전체 게임 상태 조회

**Returns:**
```typescript
interface GameState {
  userAddress: string
  packageId: string | null
  swimmers: SwimmerData[]
  tunaCans: TunaCanData[]
  totalDistance: number
  swimmerCount: number
  tunaCount: number
  lastUpdated: number
}
```

##### `getUserSwimmers(userAddress?: string): Promise<SwimmerData[]>`
사용자의 모든 Swimmer NFT 조회

##### `getSwimmerDetails(swimmerId: string): Promise<SwimmerData | null>`
특정 Swimmer의 상세 정보 조회

##### `buildMintSwimmerTx(name: string, species: string): Transaction`
Swimmer NFT 민팅 트랜잭션 생성

##### `buildSwimForwardTx(swimmerId: string, distance: number): Transaction`
Swimmer 이동 트랜잭션 생성

##### `getLeaderboard(limit?: number): Promise<SwimmerData[]>`
리더보드 데이터 조회

## 🎮 이벤트 시스템

### 이벤트 구독

```typescript
// 게임 상태 업데이트 이벤트
gameInterface.on('gameStateUpdated', (gameState: GameState) => {
  console.log('게임 상태 업데이트:', gameState);
  updateUI(gameState);
});

// Swimmer 업데이트 이벤트
gameInterface.on('swimmerUpdated', (event: SwimmerEvent) => {
  console.log(`Swimmer ${event.swimmerId} 업데이트:`, event);
});

// 사용자 변경 이벤트
gameInterface.on('userChanged', (address: string) => {
  console.log('새로운 사용자:', address);
});

// 에러 이벤트
gameInterface.on('error', (error: GameError) => {
  console.error('에러 발생:', error);
});
```

### 이벤트 타입

- `gameStateUpdated`: 게임 상태가 업데이트될 때
- `swimmerUpdated`: Swimmer가 업데이트될 때
- `userChanged`: 사용자가 변경될 때
- `error`: 에러가 발생할 때

## 💡 실제 사용 예제

### 예제 1: 게임 콘솔 초기화

```typescript
import { SwimmerGameInterface } from '@/lib/services/swimmerGameInterface';
import { useCurrentAccount } from '@mysten/dapp-kit';

function GameConsole() {
  const [gameInterface] = useState(() => new SwimmerGameInterface({
    network: 'testnet',
    autoRefresh: true
  }));
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const currentAccount = useCurrentAccount();
  
  useEffect(() => {
    if (currentAccount?.address) {
      // 사용자 설정
      gameInterface.setCurrentUser(currentAccount.address);
      
      // 초기 데이터 로드
      gameInterface.getGameState().then(setGameState);
      
      // 이벤트 구독
      gameInterface.on('gameStateUpdated', setGameState);
    }
    
    return () => {
      gameInterface.destroy();
    };
  }, [currentAccount]);
  
  return (
    <div>
      {gameState && (
        <div>
          <h2>My Swimmers: {gameState.swimmerCount}</h2>
          <h3>Total Distance: {gameState.totalDistance}m</h3>
        </div>
      )}
    </div>
  );
}
```

### 예제 2: 실시간 수영 경주

```typescript
function SwimmingRace() {
  const [swimmers, setSwimmers] = useState<SwimmerData[]>([]);
  const gameInterface = useGameInterface(); // Custom hook
  
  useEffect(() => {
    // 리더보드 데이터 가져오기
    const loadLeaderboard = async () => {
      const leaders = await gameInterface.getLeaderboard(10);
      setSwimmers(leaders);
    };
    
    loadLeaderboard();
    
    // 실시간 업데이트
    gameInterface.on('swimmerUpdated', async (event) => {
      if (event.type === 'progress') {
        const updatedSwimmer = await gameInterface.getSwimmerDetails(event.swimmerId);
        if (updatedSwimmer) {
          setSwimmers(prev => {
            const index = prev.findIndex(s => s.id === event.swimmerId);
            if (index >= 0) {
              const newSwimmers = [...prev];
              newSwimmers[index] = updatedSwimmer;
              return newSwimmers.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
            }
            return prev;
          });
        }
      }
    });
  }, []);
  
  return (
    <div className="race-track">
      {swimmers.map((swimmer, index) => (
        <SwimmerLane 
          key={swimmer.id}
          swimmer={swimmer}
          position={index + 1}
        />
      ))}
    </div>
  );
}
```

### 예제 3: 트랜잭션 실행 플로우

```typescript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

function MintSwimmerButton() {
  const gameInterface = useGameInterface();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const handleMint = () => {
    // 1. 트랜잭션 생성
    const tx = gameInterface.buildMintSwimmerTx('Nemo', 'Clownfish');
    
    // 2. 트랜잭션 실행
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          console.log('Swimmer minted!', result);
          
          // 3. 게임 상태 새로고침
          const newState = await gameInterface.getGameState();
          console.log('Updated state:', newState);
        },
        onError: (error) => {
          console.error('Minting failed:', error);
        }
      }
    );
  };
  
  return <button onClick={handleMint}>Mint New Swimmer</button>;
}
```

## 🔧 고급 기능

### 캐싱 시스템

인터페이스는 자동으로 데이터를 캐싱하여 성능을 최적화합니다:

- 캐시 유효 시간: 10초 (기본값)
- 사용자 변경 시 캐시 자동 클리어
- 강제 새로고침 가능

### 에러 처리

```typescript
gameInterface.on('error', (error) => {
  switch (error.type) {
    case 'fetch_swimmers':
      console.error('Swimmer 데이터 로드 실패');
      break;
    case 'fetch_tuna':
      console.error('TunaCan 데이터 로드 실패');
      break;
    default:
      console.error('알 수 없는 에러:', error);
  }
});
```

### 성능 최적화

1. **배치 요청**: 여러 데이터를 한 번에 가져오기
2. **자동 캐싱**: 반복 요청 최소화
3. **이벤트 기반 업데이트**: 폴링 대신 이벤트 구독
4. **선택적 새로고침**: 필요한 경우만 데이터 업데이트

## 📝 타입 정의

### SwimmerData

```typescript
interface SwimmerData {
  id: string                    // 블록체인 오브젝트 ID
  name: string                  // Swimmer 이름
  species: string               // 종족
  distanceTraveled: number      // 총 이동 거리
  baseSpeedPerHour?: number     // 시간당 속도 (고급)
  lastUpdateTimestampMs?: number // 마지막 업데이트 (고급)
  owner: string                 // 소유자 주소
  type: 'swimmer'              // 오브젝트 타입
}
```

### GameState

```typescript
interface GameState {
  userAddress: string           // 사용자 주소
  packageId: string | null      // Move 패키지 ID
  swimmers: SwimmerData[]       // 모든 Swimmer
  tunaCans: TunaCanData[]      // 모든 TunaCan
  totalDistance: number         // 총 거리
  swimmerCount: number          // Swimmer 개수
  tunaCount: number            // TunaCan 개수
  lastUpdated: number          // 업데이트 시간
}
```

## 🚧 주의사항

1. **네트워크 지연**: 블록체인 트랜잭션은 몇 초가 걸릴 수 있습니다
2. **가스 비용**: 모든 트랜잭션은 가스(SUI)가 필요합니다
3. **상태 동기화**: 트랜잭션 후 상태 업데이트까지 약간의 지연이 있을 수 있습니다
4. **에러 처리**: 네트워크 오류에 대비한 재시도 로직을 구현하세요

## 📞 지원

문제가 발생하거나 질문이 있으신가요?

- GitHub Issues: [프로젝트 저장소]
- Discord: [커뮤니티 채널]
- 문서: [추가 문서 링크]

---

*이 문서는 게임 콘솔 개발자를 위해 작성되었습니다. Move 스마트 컨트랙트 개발에 대한 내용은 별도 문서를 참조하세요.*