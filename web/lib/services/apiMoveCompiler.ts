import { Transaction } from '@mysten/sui/transactions'
import { fromBase64 } from '@mysten/sui/utils'

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
  ): Promise<{ bytecode: string, dependencies: string[] }> {
    
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
    
    if (!result.success) {
      throw new Error(result.error || 'Compilation failed')
    }
    
    return {
      bytecode: result.bytecode,
      dependencies: result.dependencies,
    }
  }
  
  /**
   * 배포 트랜잭션 생성 (API를 통해 컴파일된 바이트코드 사용)
   */
  static async createDeployTransaction(
    moduleName: string,
    sourceCode: string
  ): Promise<Transaction> {
    // API를 통해 Move 코드 컴파일
    const { bytecode, dependencies } = await this.compileMove(moduleName, sourceCode)
    
    // Transaction 생성
    const tx = new Transaction()
    
    // Base64를 Uint8Array로 변환
    const bytecodeBytes = fromBase64(bytecode)
    
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
}