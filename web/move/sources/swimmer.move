module swimming::swimmer {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    
    // Swimmer NFT 구조체
    public struct Swimmer has key, store {
        id: UID,
        name: String,
        speed: u64,
        style: u8,  // 0: 자유형, 1: 배영, 2: 평영, 3: 접영
        stamina: u64,
        medals: u64,
    }
    
    // 이벤트 정의
    public struct SwimmerCreated has copy, drop {
        swimmer_id: address,
        name: String,
        creator: address,
    }
    
    public struct SwimmerTrained has copy, drop {
        swimmer_id: address,
        new_speed: u64,
        new_stamina: u64,
    }
    
    // 상수
    const MIN_SPEED: u64 = 10;
    const MAX_SPEED: u64 = 100;
    const MIN_STAMINA: u64 = 50;
    const MAX_STAMINA: u64 = 100;
    const TRAINING_IMPROVEMENT: u64 = 5;
    
    // 에러 코드
    const EInvalidName: u64 = 1;
    const EInvalidStyle: u64 = 2;
    const EMaxSpeedReached: u64 = 3;
    const EMaxStaminaReached: u64 = 4;
    
    // 수영 선수 생성
    public entry fun create_swimmer(
        name: String, 
        style: u8, 
        ctx: &mut TxContext
    ) {
        // 유효성 검사
        assert!(string::length(&name) > 0, EInvalidName);
        assert!(style <= 3, EInvalidStyle);
        
        let swimmer_id = object::new(ctx);
        let swimmer_address = object::uid_to_address(&swimmer_id);
        
        let swimmer = Swimmer {
            id: swimmer_id,
            name: name,
            speed: MIN_SPEED + 20,  // 시작 속도: 30
            style: style,
            stamina: MIN_STAMINA + 10,  // 시작 체력: 60
            medals: 0,
        };
        
        // 이벤트 발행
        event::emit(SwimmerCreated {
            swimmer_id: swimmer_address,
            name: name,
            creator: tx_context::sender(ctx),
        });
        
        // NFT를 생성자에게 전송
        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }
    
    // 훈련 함수 - 속도와 체력 향상
    public entry fun train(swimmer: &mut Swimmer) {
        // 속도 향상 (최대치 체크)
        if (swimmer.speed + TRAINING_IMPROVEMENT <= MAX_SPEED) {
            swimmer.speed = swimmer.speed + TRAINING_IMPROVEMENT;
        } else {
            swimmer.speed = MAX_SPEED;
        };
        
        // 체력 향상 (최대치 체크)
        if (swimmer.stamina + TRAINING_IMPROVEMENT <= MAX_STAMINA) {
            swimmer.stamina = swimmer.stamina + TRAINING_IMPROVEMENT;
        } else {
            swimmer.stamina = MAX_STAMINA;
        };
        
        // 이벤트 발행
        event::emit(SwimmerTrained {
            swimmer_id: object::uid_to_address(&swimmer.id),
            new_speed: swimmer.speed,
            new_stamina: swimmer.stamina,
        });
    }
    
    // 메달 수여
    public entry fun award_medal(swimmer: &mut Swimmer) {
        swimmer.medals = swimmer.medals + 1;
    }
    
    // 수영 스타일 변경
    public entry fun change_style(swimmer: &mut Swimmer, new_style: u8) {
        assert!(new_style <= 3, EInvalidStyle);
        swimmer.style = new_style;
    }
    
    // Getter 함수들
    public fun get_name(swimmer: &Swimmer): String {
        swimmer.name
    }
    
    public fun get_speed(swimmer: &Swimmer): u64 {
        swimmer.speed
    }
    
    public fun get_style(swimmer: &Swimmer): u8 {
        swimmer.style
    }
    
    public fun get_stamina(swimmer: &Swimmer): u64 {
        swimmer.stamina
    }
    
    public fun get_medals(swimmer: &Swimmer): u64 {
        swimmer.medals
    }
    
    // 테스트용 초기화 함수
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // 테스트 환경 설정
    }
}