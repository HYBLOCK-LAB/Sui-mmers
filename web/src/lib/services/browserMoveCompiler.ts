import { setup, openProject, Project } from '@imcoding.online/js-move-playground'
import { Transaction } from '@mysten/sui/transactions'
import { toBase64 } from '@mysten/sui/utils'

/**
 * 브라우저 기반 Move 컴파일러
 * js-move-playground 라이브러리를 사용하여 브라우저에서 직접 Move 코드를 컴파일
 */
export class BrowserMoveCompiler {
  private static initialized = false
  private static currentProject: Project | null = null
  
  /**
   * 컴파일러 초기화
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return
    
    console.log('Initializing browser Move compiler...')
    try {
      await setup()
      this.initialized = true
      console.log('Browser Move compiler initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Move compiler:', error)
      throw error
    }
  }
  
  /**
   * Move 소스 코드를 컴파일하여 바이트코드 생성
   */
  static async compileMove(
    moduleName: string,
    sourceCode: string
  ): Promise<{ bytecode: string, dependencies: string[] }> {
    // 컴파일러 초기화 확인
    if (!this.initialized) {
      await this.initialize()
    }
    
    try {
      // 프로젝트 생성 또는 열기
      const projectName = `swimmer_${Date.now()}`
      this.currentProject = await openProject(projectName)
      
      // Move.toml 파일 생성
      const moveToml = `[package]
name = "swimming"
version = "0.0.1"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet" }

[addresses]
swimming = "0x0"`
      
      await this.currentProject.createFile('Move.toml', moveToml)
      
      // 소스 디렉토리 생성 및 Move 파일 추가
      await this.currentProject.createFile(`sources/${moduleName}.move`, sourceCode)
      
      // 컴파일 실행
      console.log('Compiling Move module in browser...')
      const buildResult = await this.currentProject.build()
      
      if (!buildResult.success) {
        throw new Error(`Compilation failed: ${buildResult.error || 'Unknown error'}`)
      }
      
      console.log('Compilation successful:', buildResult)
      
      // 컴파일된 바이트코드 추출
      // js-move-playground는 컴파일된 바이트코드를 프로젝트 내에 저장합니다
      const bytecodeFile = `build/swimming/bytecode_modules/${moduleName}.mv`
      const bytecodeContent = await this.currentProject.readFile(bytecodeFile)
      
      // Base64 인코딩
      const bytecodeBase64 = toBase64(new Uint8Array(bytecodeContent))
      
      return {
        bytecode: bytecodeBase64,
        dependencies: [
          '0x0000000000000000000000000000000000000000000000000000000000000001', // Sui Framework
          '0x0000000000000000000000000000000000000000000000000000000000000002'  // Move Stdlib
        ]
      }
    } catch (error) {
      console.error('Move compilation failed:', error)
      throw error
    }
  }
  
  /**
   * 배포 트랜잭션 생성 (브라우저에서 컴파일된 바이트코드 사용)
   */
  static async createDeployTransaction(
    moduleName: string,
    sourceCode: string
  ): Promise<Transaction> {
    // Move 코드를 브라우저에서 컴파일
    const { bytecode, dependencies } = await this.compileMove(moduleName, sourceCode)
    
    // Transaction 생성
    const tx = new Transaction()
    
    // 바이트코드를 Uint8Array로 변환
    const bytecodeBytes = Uint8Array.from(atob(bytecode), c => c.charCodeAt(0))
    
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
            name: string::clone(&swimmer.name),
            species: string::clone(&swimmer.species),
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
   * 프로젝트 정리
   */
  static async cleanup(): Promise<void> {
    if (this.currentProject) {
      try {
        await this.currentProject.close()
        this.currentProject = null
      } catch (error) {
        console.error('Failed to close project:', error)
      }
    }
  }
}
