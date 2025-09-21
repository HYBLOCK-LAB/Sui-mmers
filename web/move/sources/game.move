module swimming::game {

    use sui::clock::{Clock};
    use sui::object::{Self, UID, ID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{TxContext};
    use sui::address;
    use std::string::{Self, String};

    const MS_PER_MIN: u64 = 60_000;

    public struct Swimmer has key, store {
        id: UID,
        name: String,
        color: String,
        speed: u64,
        hunger: u64,
        boost: u64,
        distance_traveled: u64,
        last_update_timestamp_ms: u64,
    }

    public struct TunaCan has key, store {
        id: UID,
        boost: u64,
        size: u64,
        color: String,
    }

    public struct SwimmerRegistry has key {
        id: UID,
        swimmers: Table<ID, address>,
    }

    fun init(ctx: &mut TxContext) {
        let registry = SwimmerRegistry {
            id: object::new(ctx),
            swimmers: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public fun mint_swimmer(
        registry: &mut SwimmerRegistry,
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            color: string::utf8(color),
            speed: speed,
            hunger: 1000,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock.timestamp_ms(),
        };

        table::add(&mut registry.swimmers, object::id(&swimmer), owner);
        transfer::public_transfer(swimmer, owner);
    }

    public fun mint_tuna(
        boost: u64,
        size: u64,
        color: vector<u8>,
        ctx: &mut TxContext
    ) {
        let tuna = TunaCan {
            id: object::new(ctx),
            boost: boost,
            size: size,
            color: string::utf8(color),
        };
        transfer::public_transfer(tuna, tx_context::sender(ctx));
    }

    public fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        let TunaCan { id, boost, size, color: _ } = tuna;
        swimmer.hunger = swimmer.hunger + size;
        swimmer.boost = swimmer.boost + boost;
        object::delete(id);
    }

    public fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock.timestamp_ms();
        let elapsed_ms = now - swimmer.last_update_timestamp_ms;

        // return 뒤의 세미콜론 제거
        if (elapsed_ms == 0) { return };

        let effective_speed = swimmer.speed + swimmer.boost;
        let distance_gained = (elapsed_ms * effective_speed) / MS_PER_MIN;
        let hunger_consumed = distance_gained;

        if (swimmer.hunger > hunger_consumed) {
            swimmer.hunger = swimmer.hunger - hunger_consumed;
            swimmer.distance_traveled = swimmer.distance_traveled + distance_gained;

            if (swimmer.boost > distance_gained) {
                swimmer.boost = swimmer.boost - distance_gained;
            } else {
                swimmer.boost = 0;
            }
        } else {
            swimmer.boost = 0;
        }; // if/else 블록 뒤에 세미콜론 추가

        swimmer.last_update_timestamp_ms = now;
    }
}