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
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    
    /// Swimmer NFT
    public struct Swimmer has key, store {
        id: UID,
        name: String,
        speed: u64,
        style: u8,  // 0: 자유형, 1: 배영, 2: 평영, 3: 접영
        stamina: u64,
        medals: u64,
    }
    
    /// Event emitted when a new swimmer is created
    public struct SwimmerCreated has copy, drop {
        swimmer_id: address,
        name: String,
        creator: address,
    }
    
    /// Event emitted when a swimmer is trained
    public struct SwimmerTrained has copy, drop {
        swimmer_id: address,
        new_speed: u64,
        new_stamina: u64,
    }
    
    /// 에러 코드
    const EInvalidStyle: u64 = 0;
    const ENotEnoughStamina: u64 = 1;
    const EInvalidLength: u64 = 2;
    const EMaxSpeedReached: u64 = 3;
    const EMaxStaminaReached: u64 = 4;
    
    /// Swimmer NFT 생성
    public entry fun create_swimmer(
        name: vector<u8>, 
        style: u8,
        ctx: &mut TxContext
    ) {
        assert!(style < 4, EInvalidStyle);
        
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            speed: 10,
            style,
            stamina: 100,
            medals: 0,
        };
        
        let swimmer_id = object::uid_to_address(&swimmer.id);
        let creator = tx_context::sender(ctx);
        
        // 이벤트 발생
        event::emit(SwimmerCreated {
            swimmer_id,
            name: swimmer.name,
            creator,
        });
        
        transfer::public_transfer(swimmer, creator);
    }
    
    /// 훈련하여 능력치 향상
    public entry fun train(swimmer: &mut Swimmer) {
        swimmer.speed = swimmer.speed + 5;
        swimmer.stamina = swimmer.stamina + 10;
        
        let swimmer_id = object::uid_to_address(&swimmer.id);
        
        // 이벤트 발생
        event::emit(SwimmerTrained {
            swimmer_id,
            new_speed: swimmer.speed,
            new_stamina: swimmer.stamina,
        });
    }
    
    /// 메달 획득
    public entry fun award_medal(swimmer: &mut Swimmer) {
        swimmer.medals = swimmer.medals + 1;
    }
    
    /// 수영 스타일 변경
    public entry fun change_style(swimmer: &mut Swimmer, new_style: u8) {
        assert!(new_style < 4, EInvalidStyle);
        swimmer.style = new_style;
    }
    
    /// Getter 함수들
    public fun get_name(swimmer: &Swimmer): &String {
        &swimmer.name
    }
    
    public fun get_speed(swimmer: &Swimmer): u64 {
        swimmer.speed
    }
    
    public fun get_stamina(swimmer: &Swimmer): u64 {
        swimmer.stamina
    }
    
    public fun get_style(swimmer: &Swimmer): u8 {
        swimmer.style
    }
    
    public fun get_medals(swimmer: &Swimmer): u64 {
        swimmer.medals
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