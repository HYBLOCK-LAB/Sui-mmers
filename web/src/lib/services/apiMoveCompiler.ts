import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

/**
 * API 기반 Move 컴파일러
 * Next.js API Routes를 통해 서버사이드에서 Move 코드를 컴파일
 */
export class ApiMoveCompiler {
  /**
   * Move 소스 코드를 API를 통해 컴파일
   */
  static async compileMove(
    moduleName: string,
    sourceCode: string
  ): Promise<{ bytecode: string; dependencies: string[] }> {
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moveCode: sourceCode,
        moduleName: moduleName,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Compilation failed');
    }

    return {
      bytecode: result.bytecode,
      dependencies: result.dependencies,
    };
  }

  /**
   * 배포 트랜잭션 생성 (API를 통해 컴파일된 바이트코드 사용)
   */
  static async createDeployTransaction(
    moduleName: string,
    sourceCode: string,
    senderAddress: string
  ): Promise<Transaction> {
    // API를 통해 Move 코드 컴파일
    const { bytecode, dependencies } = await this.compileMove(moduleName, sourceCode);

    // Transaction 생성
    const tx = new Transaction();

    // 가스 예산 설정 (디버깅용 큰 값)
    tx.setGasBudget(100000000);

    // sender 주소 검증
    if (!senderAddress) {
      throw new Error('Sender address is required for deployment');
    }
    console.log('Deploying with sender:', senderAddress);

    // Base64를 Uint8Array로 변환
    const bytecodeBytes = fromBase64(bytecode);
    console.log('Bytecode length:', bytecodeBytes.length);
    console.log('Dependencies:', dependencies);

    // 패키지 배포 - SDK 공식 문서에 따라 배열로 반환됨
    const [upgradeCap] = tx.publish({
      modules: [bytecodeBytes],
      dependencies: dependencies,
    });

    // UpgradeCap을 sender에게 명시적으로 전송 (필수)
    // SDK 문서: "you must explicitly transfer the UpgradeCap object"
    // tx.pure.address() 사용하여 주소 타입 명시
    tx.transferObjects([upgradeCap], tx.pure.address(senderAddress));

    // 디버깅: 트랜잭션 상세 정보 출력
    console.log('Transaction built with sender:', senderAddress);
    console.log('Transaction details:', {
      sender: senderAddress,
      upgradeCap: upgradeCap,
      commands: tx.blockData.transactions,
    });

    return tx;
  }

  /**
   * swimmer.move 소스 코드 템플릿 (초보자용 간단한 버전)
   * 단계별로 복잡도를 높여갈 수 있도록 기본 구조만 포함
   */
  static getSwimmerMoveTemplate(): string {
    return `module swimming::swimmer {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    
    /// Swimmer NFT - 우리의 수영 선수!
    public struct Swimmer has key, store {
        id: UID,
        name: String,
        species: String,
        distance_traveled: u64,
    }
    
    /// 새로운 Swimmer NFT 생성하기
    public entry fun mint_swimmer(
        name: vector<u8>,
        species: vector<u8>,
        ctx: &mut TxContext
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            species: string::utf8(species),
            distance_traveled: 0,
        };
        
        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }
    
    /// Swimmer를 앞으로 이동시키기
    public entry fun swim_forward(
        swimmer: &mut Swimmer,
        distance: u64,
    ) {
        swimmer.distance_traveled = swimmer.distance_traveled + distance;
    }
    
    /// Getter 함수들
    public fun get_name(swimmer: &Swimmer): &String {
        &swimmer.name
    }
    
    public fun get_distance(swimmer: &Swimmer): u64 {
        swimmer.distance_traveled
    }
}`;
  }

  /**
   * swimmer.move 고급 템플릿 (시간 기반 진행, 아이템 등 포함)
   * 학습이 진행된 후 사용할 수 있는 복잡한 버전
   */
  static getAdvancedSwimmerTemplate(): string {
    return `module swimming::swimmer_advanced {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    
    /// Constants
    const BASE_SPEED_PER_HOUR: u64 = 100;
    const TUNA_BONUS: u64 = 10;
    
    /// Swimmer NFT with time-based mechanics
    public struct Swimmer has key, store {
        id: UID,
        name: String,
        species: String,
        distance_traveled: u64,
        base_speed_per_hour: u64,
        last_update_timestamp_ms: u64,
    }
    
    /// Tuna Can item for boosting
    public struct TunaCan has key, store {
        id: UID,
        energy: u64,
    }
    
    /// Events
    public struct SwimmerMinted has copy, drop {
        swimmer_id: address,
        owner: address,
        name: String,
        species: String,
    }
    
    /// Mint a new Swimmer NFT with time tracking
    public entry fun mint_swimmer(
        name: vector<u8>,
        species: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            species: string::utf8(species),
            distance_traveled: 0,
            base_speed_per_hour: BASE_SPEED_PER_HOUR,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };
        
        let swimmer_id = object::uid_to_address(&swimmer.id);
        let owner = tx_context::sender(ctx);
        
        event::emit(SwimmerMinted {
            swimmer_id,
            owner,
            name: swimmer.name,
            species: swimmer.species,
        });
        
        transfer::public_transfer(swimmer, owner);
    }
    
    /// Update swimmer's progress based on elapsed time
    public entry fun update_progress(
        swimmer: &mut Swimmer,
        clock: &Clock,
    ) {
        let current_time = clock::timestamp_ms(clock);
        let time_elapsed_ms = current_time - swimmer.last_update_timestamp_ms;
        let hours_elapsed = time_elapsed_ms / (1000 * 60 * 60);
        
        if (hours_elapsed > 0) {
            let distance_gained = swimmer.base_speed_per_hour * hours_elapsed;
            swimmer.distance_traveled = swimmer.distance_traveled + distance_gained;
            swimmer.last_update_timestamp_ms = current_time;
        }
    }
    
    /// Mint a TunaCan item
    public entry fun mint_tuna(ctx: &mut TxContext) {
        let tuna = TunaCan {
            id: object::new(ctx),
            energy: TUNA_BONUS,
        };
        
        transfer::public_transfer(tuna, tx_context::sender(ctx));
    }
    
    /// Feed tuna to swimmer for instant boost
    public entry fun eat_tuna(
        swimmer: &mut Swimmer,
        tuna: TunaCan,
        clock: &Clock,
    ) {
        update_progress(swimmer, clock);
        
        let TunaCan { id, energy } = tuna;
        swimmer.distance_traveled = swimmer.distance_traveled + energy;
        object::delete(id);
    }
}`;
  }
}
