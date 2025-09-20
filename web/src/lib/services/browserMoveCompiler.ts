import { Transaction } from '@mysten/sui/transactions'

/**
 * 브라우저 기반 Move 컴파일러
 * 서버 API를 통해 실제 Move 코드를 컴파일
 */
export class BrowserMoveCompiler {
  private static initialized = false
  
  /**
   * 컴파일러 초기화 (서버 API 사용이므로 실제 초기화 불필요)
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return
    
    console.log('Initializing Move compiler (server-based)...')
    this.initialized = true
    console.log('Move compiler ready')
  }
  
  /**
   * Move 소스 코드를 컴파일하여 바이트코드 생성 (서버 API 사용)
   */
  static async compileMove(
    moduleName: string,
    sourceCode: string
  ): Promise<{ bytecode: string, dependencies: string[] }> {
    try {
      console.log('Compiling Move code via server API...')
      
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moveCode: sourceCode,
          moduleName: moduleName,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`)
      }
      
      if (!result.success) {
        const errorMsg = result.logs || result.error || 'Compilation failed'
        console.error('Compilation error details:', errorMsg)
        throw new Error(errorMsg)
      }
      
      console.log('✅ Move code compiled successfully')
      if (result.logs) {
        console.log('Compilation output:', result.logs)
      }
      
      return {
        bytecode: result.bytecode,
        dependencies: result.dependencies || [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000002'
        ]
      }
    } catch (error) {
      console.error('Move compilation failed:', error)
      throw new Error(`Failed to compile Move code: ${(error as Error).message}`)
    }
  }
  
  /**
   * 배포 트랜잭션 생성 (실제 컴파일된 바이트코드 사용)
   */
  static async createDeployTransaction(
    moduleName: string,
    sourceCode: string
  ): Promise<Transaction> {
    // Move 코드를 서버에서 컴파일
    const { bytecode, dependencies } = await this.compileMove(moduleName, sourceCode)
    
    // Transaction 생성
    const tx = new Transaction()
    
    // 바이트코드를 Uint8Array로 변환
    const bytecodeBytes = Uint8Array.from(atob(bytecode), c => c.charCodeAt(0))
    
    console.log('Creating deploy transaction:', {
      bytecodeSize: bytecodeBytes.length,
      dependencies: dependencies
    })
    
    // 패키지 배포
    const result = tx.publish({
      modules: [bytecodeBytes],
      dependencies: dependencies,
    })
    
    // UpgradeCap 전송
    if (result) {
      const upgradeCap = Array.isArray(result) ? result[0] : result
      tx.transferObjects([upgradeCap], tx.gas)
    }
    
    return tx
  }
  
  /**
   * swimmer.move 소스 코드 템플릿
   */
  static getSwimmerMoveTemplate(): string {
    return `module swimming::swimmer {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    const BASE_DISTANCE_PER_HOUR: u64 = 100;
    const TUNA_DISTANCE_BONUS: u64 = 10;

    public struct Swimmer has key, store {
        id: UID,
        owner: address,
        name: String,
        species: String,
        distance_traveled: u64,
        base_speed_per_hour: u64,
        last_update_timestamp_ms: u64,
    }

    public struct TunaCan has key, store {
        id: UID,
        energy: u64,
    }

    public struct SwimmerMinted has copy, drop {
        swimmer_id: address,
        owner: address,
        name: String,
        species: String,
    }

    public struct ProgressUpdated has copy, drop {
        swimmer_id: address,
        new_distance: u64,
    }

    public struct TunaEaten has copy, drop {
        swimmer_id: address,
        total_distance: u64,
        bonus_applied: u64,
    }

    public entry fun mint_swimmer(
        name: vector<u8>,
        species: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let swimmer = Swimmer {
            id: object::new(ctx),
            owner,
            name: string::utf8(name),
            species: string::utf8(species),
            distance_traveled: 0,
            base_speed_per_hour: BASE_DISTANCE_PER_HOUR,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        event::emit(SwimmerMinted {
            swimmer_id: object::uid_to_address(&swimmer.id),
            owner,
            name: swimmer.name,
            species: swimmer.species,
        });

        transfer::public_transfer(swimmer, owner);
    }

    public entry fun update_progress(
        swimmer: &mut Swimmer,
        clock: &Clock
    ) {
        let current_time = clock::timestamp_ms(clock);
        let last_time = swimmer.last_update_timestamp_ms;

        if (current_time > last_time) {
            let elapsed_time_ms = current_time - last_time;
            let distance_to_add = (elapsed_time_ms * swimmer.base_speed_per_hour) / 3_600_000;

            if (distance_to_add > 0) {
                swimmer.distance_traveled = swimmer.distance_traveled + distance_to_add;
                swimmer.last_update_timestamp_ms = current_time;

                event::emit(ProgressUpdated {
                    swimmer_id: object::uid_to_address(&swimmer.id),
                    new_distance: swimmer.distance_traveled,
                });
            }
        }
    }

    public entry fun mint_tuna(
        ctx: &mut TxContext
    ) {
        let tuna = TunaCan {
            id: object::new(ctx),
            energy: TUNA_DISTANCE_BONUS,
        };

        transfer::public_transfer(tuna, tx_context::sender(ctx));
    }

    public entry fun eat_tuna(
        swimmer: &mut Swimmer,
        tuna: TunaCan,
        clock: &Clock
    ) {
        update_progress(swimmer, clock);

        let TunaCan { id, energy } = tuna;
        swimmer.distance_traveled = swimmer.distance_traveled + energy;
        object::delete(id);

        event::emit(TunaEaten {
            swimmer_id: object::uid_to_address(&swimmer.id),
            total_distance: swimmer.distance_traveled,
            bonus_applied: energy,
        });
    }
}`
  }
  
  /**
   * 정리 작업 (서버 API 사용이므로 특별한 정리 불필요)
   */
  static async cleanup(): Promise<void> {
    // No cleanup needed for server-based compilation
  }
}
