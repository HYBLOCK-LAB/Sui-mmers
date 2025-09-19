// Move 컨트랙트 템플릿과 바이트코드
export const SWIMMER_MODULE_TEMPLATE = `module swimming::swimmer {
  struct Swimmer has key {
    id: UID,
    name: String,
    speed: u64,
    style: u8,
    stamina: u64,
    medals: u64
  }
  
  public fun create_swimmer(
    name: String,
    ctx: &mut TxContext
  ) {
    let swimmer = Swimmer {
      id: object::new(ctx),
      name: name,
      speed: {{SPEED}},     // 수정 가능
      style: {{STYLE}},     // 수정 가능
      stamina: {{STAMINA}}, // 수정 가능
      medals: 0
    };
    
    transfer::public_transfer(
      swimmer, 
      tx_context::sender(ctx)
    );
  }
}`;

// 수영 스타일 enum
export enum SwimmingStyle {
  FREESTYLE = 0,
  BACKSTROKE = 1,
  BREASTSTROKE = 2,
  BUTTERFLY = 3,
}

export const STYLE_NAMES = {
  [SwimmingStyle.FREESTYLE]: "자유형",
  [SwimmingStyle.BACKSTROKE]: "배영",
  [SwimmingStyle.BREASTSTROKE]: "평영",
  [SwimmingStyle.BUTTERFLY]: "접영",
};

// 기본값
export const DEFAULT_VALUES = {
  speed: 30,
  stamina: 60,
  style: SwimmingStyle.FREESTYLE,
};