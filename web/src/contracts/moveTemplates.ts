// Move 컨트랙트 템플릿과 바이트코드
export const SWIMMER_MODULE_TEMPLATE = `module swimming::swimmer {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    /// 수영선수의 기본 이동 속도 (1시간 기준, 미터 단위)
    const BASE_DISTANCE_PER_HOUR: u64 = {{BASE_SPEED_PER_HOUR}};

    /// 참치 통조림을 먹었을 때 추가 이동 거리 (미터 단위)
    const TUNA_DISTANCE_BONUS: u64 = {{TUNA_BONUS}};

    /// 수영선수 NFT 구조체입니다.
    public struct Swimmer has key, store {
        id: UID,
        owner: address,
        name: String,
        species: String,
        distance_traveled: u64,
        base_speed_per_hour: u64,
        last_update_timestamp_ms: u64,
    }

    /// 참치 통조림 아이템입니다.
    public struct TunaCan has key, store {
        id: UID,
        energy: u64,
    }

    /// 신규 수영선수가 탄생했을 때 발생하는 이벤트입니다.
    public struct SwimmerMinted has copy, drop {
        swimmer_id: address,
        owner: address,
        name: String,
        species: String,
    }

    /// 자동 전진이 적용되었을 때 발생하는 이벤트입니다.
    public struct ProgressUpdated has copy, drop {
        swimmer_id: address,
        new_distance: u64,
    }

    /// 참치를 먹었을 때 발생하는 이벤트입니다.
    public struct TunaEaten has copy, drop {
        swimmer_id: address,
        total_distance: u64,
        bonus_applied: u64,
    }

    /// 새로운 수영선수 NFT를 민팅합니다.
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

    /// 마지막으로 업데이트된 이후 경과한 시간만큼 자동으로 전진시킵니다.
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

    /// 참치 통조림 NFT를 민팅합니다.
    public entry fun mint_tuna(
        ctx: &mut TxContext
    ) {
        let tuna = TunaCan {
            id: object::new(ctx),
            energy: TUNA_DISTANCE_BONUS,
        };

        transfer::public_transfer(tuna, tx_context::sender(ctx));
    }

    /// 참치를 먹여 추가 거리를 얻고, 사용한 참치 NFT는 소멸시킵니다.
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
}`;

// 수영 스타일 enum
// 기본값
export const DEFAULT_VALUES = {
  baseSpeedPerHour: 100,
  tunaBonus: 10,
};
