import { LessonDefinition } from './types'

export const lessonsData: LessonDefinition[] = [
  {
    slug: 'prologue',
    title: 'Lesson 0 · Prologue',
    summary: 'Warm up, install your gear, and learn what Move brings to the table before diving in.',
    chapters: [
      {
        slug: 'welcome-to-the-ocean',
        title: 'Welcome to Sui-mmers',
        summary: 'Install the toolkit, claim testnet coins, and understand why we build with Move.',
        markdown: `### Welcome aboard!

Before we swim across the Pacific we need our gear. Install the Sui wallet, grab the CLI, and request a faucet allocation so your experiments never cost real SUI.

### Why Move matters

Move was born to keep digital assets safe. Ownership is a first-class concept which means your Swimmer NFT can never be duplicated or lost by mistake. Throughout this course we will rely on Move to build an ever-expanding ocean adventure.

When you are ready, tighten that swim cap and jump in.`,
      },
    ],
  },
  {
    slug: 'swimmer-foundations',
    title: 'Lesson 1 · Swimmer Foundations',
    summary: 'Model a swimmer, mint the NFT, and keep progress up to date.',
    chapters: [
      {
        slug: 'module-and-object',
        title: 'Chapter 1 · Structure the Swimmer',
        summary: 'Define a Swimmer struct with a UID and distance counter.',
        markdown: `A Swimmer is not just a document – it is an on-chain object. Every object needs a \`UID\`, a name, a species, and the distance it has travelled.

Your task: create the \`Swimmer\` struct with the \`has key\` ability so it can live on-chain.`,
        codeTemplate: `module sui_mmers::swimmer_struct {
    use sui::object::{Self, UID};

    public struct Swimmer has key {
        id: UID,
        distance_traveled: u64,
    }
}
`,
      },
      {
        slug: 'mint-swimmer',
        title: 'Chapter 2 · Bring the Swimmer to life',
        summary: 'Add a public entry function that creates a swimmer and transfers ownership.',
        markdown: `Objects become real when we mint them. Expose a \`public entry fun mint_swimmer\` that receives \`name\` and \`species\`, creates a \`Swimmer\`, and transfers it to the caller.`,
        codeTemplate: `module sui_mmers::swimmer_mint {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    public struct Swimmer has key, store {
        id: UID,
        distance_traveled: u64,
        name: String,
        species: String,
    }

    public entry fun mint_swimmer(
        name: vector<u8>,
        species: vector<u8>,
        ctx: &mut TxContext
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            distance_traveled: 0,
            name: string::from_utf8(name).unwrap(),
            species: string::from_utf8(species).unwrap(),
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }
}
`,
      },
      {
        slug: 'lazy-progress',
        title: 'Chapter 3 · Lazy progress updates',
        summary: 'Track elapsed time and update distance only when needed.',
        markdown: `Smart contracts nap until someone wakes them up. Store \`last_update_timestamp_ms\` and when \`update_progress\` runs calculate how much time has passed. Multiply the elapsed time by the swimmer\'s base speed to increase \`distance_traveled\` and update the timestamp.`,
        codeTemplate: `module sui_mmers::swimmer_progress {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    const BASE_DISTANCE_PER_HOUR: u64 = {{BASE_SPEED_PER_HOUR}};

    public struct Swimmer has key, store {
        id: UID,
        distance_traveled: u64,
        name: String,
        species: String,
        last_update_timestamp_ms: u64,
    }

    public entry fun mint_swimmer(
        name: vector<u8>,
        species: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            distance_traveled: 0,
            name: string::from_utf8(name).unwrap(),
            species: string::from_utf8(species).unwrap(),
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock::timestamp_ms(clock);
        let elapsed = now - swimmer.last_update_timestamp_ms;
        let gained = (elapsed * BASE_DISTANCE_PER_HOUR) / 3_600_000;

        if (gained > 0) {
            swimmer.distance_traveled = swimmer.distance_traveled + gained;
            swimmer.last_update_timestamp_ms = now;
        }
    }
}
`,
      },
    ],
  },
  {
    slug: 'ptb-and-items',
    title: 'Lesson 2 · PTB & Item Interactions',
    summary: 'Mint TunaCan items and feed your swimmer using atomic PTBs.',
    chapters: [
      {
        slug: 'tuna-items',
        title: 'Chapter 1 · Energising TunaCan',
        summary: 'Create a TunaCan item that can be minted like any other object.',
        markdown: `Swimmers get hungry! Define a \`TunaCan\` struct with \`has key, store\` and mint it with \`mint_tuna\`.`,
        codeTemplate: `module sui_mmers::tuna_items {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    public struct TunaCan has key, store {
        id: UID,
        energy: u64,
    }

    public entry fun mint_tuna(ctx: &mut TxContext) {
        let tuna = TunaCan { id: object::new(ctx), energy: {{TUNA_BONUS}} };
        transfer::public_transfer(tuna, tx_context::sender(ctx));
    }
}
`,
      },
      {
        slug: 'eat-tuna',
        title: 'Chapter 2 · Atomic tuna buffet',
        summary: 'Use a PTB to update distance and consume the TunaCan in one go.',
        markdown: `The \`eat_tuna\` entry function takes a mutable swimmer reference and a TunaCan. Increase \`distance_traveled\` and destroy the consumed tuna object so balances stay consistent.`,
        codeTemplate: `module sui_mmers::tuna_buffet {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    public struct Swimmer has key, store {
        id: UID,
        distance_traveled: u64,
    }

    public struct TunaCan has key, store {
        id: UID,
        energy: u64,
    }

    public entry fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        let TunaCan { id, energy } = tuna;
        swimmer.distance_traveled = swimmer.distance_traveled + energy;
        object::delete(id);
    }
}
`,
      },
    ],
  },
  {
    slug: 'shared-registry',
    title: 'Lesson 3 · Shared Registry & Leaderboard',
    summary: 'Introduce a shared SwimmerRegistry so everyone can discover swimmers.',
    chapters: [
      {
        slug: 'shared-registry',
        title: 'Chapter 1 · Build the registry',
        summary: 'Share a SwimmerRegistry that maps swimmer IDs to owners.',
        markdown: `Owned objects live in private islands. A shared \`SwimmerRegistry\` lets everyone discover new competitors.

Update \`mint_swimmer\` so every minted swimmer adds an entry to the registry table before transferring ownership.`,
        codeTemplate: `module sui_mmers::registry {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    public struct Swimmer has key, store {
        id: UID,
        distance_traveled: u64,
        name: String,
        species: String,
        last_update_timestamp_ms: u64,
    }

    public struct SwimmerRegistry has key {
        id: UID,
        swimmers: Table<address, address>,
    }

    fun init(ctx: &mut TxContext) {
        let registry = SwimmerRegistry { id: object::new(ctx), swimmers: table::new(ctx) };
        transfer::share_object(registry);
    }

    public entry fun mint_swimmer(
        registry: &mut SwimmerRegistry,
        name: vector<u8>,
        species: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        let swimmer = Swimmer {
            id: object::new(ctx),
            distance_traveled: 0,
            name: string::from_utf8(name).unwrap(),
            species: string::from_utf8(species).unwrap(),
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        table::add(&mut registry.swimmers, object::uid_to_address(&swimmer.id), owner);
        transfer::public_transfer(swimmer, owner);
    }
}
`,
      },
    ],
  },
]
