import { LessonDefinition } from './types';

export const lessonsData: LessonDefinition[] = [
  {
    slug: 'prologue',
    title: 'Lesson 0 - Prologue',
    summary: 'Warm up, install your gear, and learn what Move brings to the table before diving in.',
    chapters: [
      {
        slug: 'welcome-to-the-ocean',
        title: 'Welcome to Sui-mmers',
        summary: 'Install the toolkit, claim testnet coins, and understand why we build with Move.',
        markdown: `### Welcome to Sui-mmers!

In this game, you become the trainer of a great (and perhaps a little silly) swimmer crossing the Pacific Ocean.

Before we can take on the ocean we need our gear. Install the Sui wallet, grab the CLI, and request a faucet allocation so your experiments never cost real SUI. This test SUI is play money, so spend it freely while you learn.

### Why Move matters

Move was designed to keep digital assets safe. Ownership is a first-class concept which means your Swimmer NFT can never be duplicated or lost by mistake. Throughout this course we will rely on Move to build an ever-expanding ocean adventure.

When you are ready, tighten that swim cap and jump in!`,
      },
    ],
  },
  {
    slug: 'swimmer-foundations',
    title: 'Lesson 1 - Swimmer Foundations',
    summary: 'Model a swimmer, mint the NFT, and keep progress up to date.',
    chapters: [
      {
        slug: 'module-and-object',
        title: "Chapter 1 - Let's Carve the Swimmer's Skeleton",
        summary: 'A swimmer is more than data; it is a unique object with a UID.',
        markdown: `### Lesson 1: The Birth of a Swimmer
        
#### Chapter 1: Modules and Objects - "Let's Carve the Swimmer's Skeleton"

 **One-line summary:** A swimmer is not just data; it is an object born with a unique UID.

**Explanation**

In this lesson you become the owner of a swimmer that lives on-chain as an NFT. In Sui every NFT is an object. Just as every physical thing in the real world is an object, every digital asset on Sui exists as an object with a unique identity.

We are going to create the blueprint for our swimmer object using Move. This blueprint is a \`struct\`. A struct is like a skeleton that defines what information our swimmer contains, such as name, species, and distance traveled.

We also add the magic words \`has key\`. This keyword tells Move that the struct can exist independently as an object with a unique ID on the blockchain.

**Practice**
Create a \`struct\` named \`Swimmer\`. Every swimmer must have an \`id\` for its unique identity on-chain and a \`distance_traveled\` value to track how far it has gone.`,
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
        title: 'Chapter 2 - Giving Life to the Swimmer',
        summary: 'Mint a swimmer and transfer ownership to the caller.',
        markdown: `**Explanation**
The skeleton is ready, but we still need to mint an actual swimmer. In Move, a function that anyone can call from outside the module is marked with \`public entry fun\`. Think of it as the Start button of our game.

We will create a function named \`mint_swimmer\`. When the function runs it instantiates the \`Swimmer\` struct and uses \`transfer\` to hand ownership to the caller. The blockchain records that the new swimmer belongs to the sender.

**Practice**

Implement \`mint_swimmer\`. Accept \`name\` and \`species\`, create a new \`Swimmer\`, and transfer it to the caller.
`,
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
        ctx: &mut TxContext,
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
        title: "Chapter 3 - The 'Lazy Update' Pattern",
        summary: 'Automatically calculate progress based on elapsed time.',
        markdown: `**Explanation**
        
Your swimmer is in the water, but it only moves when someone wakes the smart contract. Smart contracts do not schedule themselves, so we calculate distance lazily whenever a transaction touches the swimmer.

1. Store \`last_update_timestamp_ms\` inside the swimmer.
2. When \`update_progress\` runs, compute the elapsed time since the last update.
3. Multiply the elapsed time by the swimmer's base speed, add the result to \`distance_traveled\`, and update the timestamp.

This mirrors how bank interest accrues only when the account is accessed.

**Practice**

Add \`last_update_timestamp_ms\` to the struct and implement \`update_progress\`. Remember to set the initial timestamp when minting.
`,
        codeTemplate: `module sui_mmers::swimmer_progress {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    const BASE_DISTANCE_PER_HOUR: u64 = 100;

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
    title: 'Lesson 2 - PTB and Item Interactions',
    summary: 'Mint TunaCan items and feed your swimmer using atomic PTBs.',
    chapters: [
      {
        slug: 'tuna-items',
        title: 'Chapter 1 - Energising TunaCan',
        summary: 'Create a TunaCan item that can be minted like any other object.',
        markdown: `Your swimmer is going to get hungry. A long journey needs fuel. In Sui, items are also objects, so we model a TunaCan just like the Swimmer and give it \`has key\` so it can live in a wallet.

**Practice**

Add a \`TunaCan\` struct and a \`mint_tuna\` function that issues tuna cans to the caller.
`,
        codeTemplate: `module sui_mmers::tuna_items {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    public struct TunaCan has key, store {
        id: UID,
        energy: u64,
    }

    public entry fun mint_tuna(ctx: &mut TxContext) {
        let tuna = TunaCan { id: object::new(ctx), energy: 10 };
        transfer::public_transfer(tuna, tx_context::sender(ctx));
    }
}
`,
      },
      {
        slug: 'eat-tuna',
        title: 'Chapter 2 - Gulp! PTBs and consuming objects',
        summary: 'Use an atomic PTB to feed tuna cans to swimmers.',
        markdown: `Feeding the swimmer requires two actions: increase distance and delete the consumed tuna. Programmable Transaction Blocks let both steps succeed or fail together, so balances always stay correct.

**Practice**

Create an \`eat_tuna\` function that accepts a mutable \`Swimmer\` reference and a \`TunaCan\`. Add 10 to the swimmer's distance and destroy the tuna with \`object::delete\`.
`,
        codeTemplate: `module sui_mmers::tuna_buffet {
    use sui::object::{Self, UID};

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
    title: 'Lesson 3 - Shared Registry and Leaderboard',
    summary: 'Introduce a shared SwimmerRegistry so everyone can discover swimmers.',
    chapters: [
      {
        slug: 'shared-registry',
        title: 'Chapter 1 - Swimming Together',
        summary: 'Share a SwimmerRegistry that maps swimmer IDs to owners.',
        markdown: `Owned objects live on private islands; no one else can see them. To help everyone discover new swimmers we create a shared object called \`SwimmerRegistry\`. Every time a swimmer is minted we record its ID and owner on the registry.

**Practice**

Define a \`SwimmerRegistry\` shared object and update \`mint_swimmer\` so that each new swimmer registers itself before ownership transfers.
`,
        codeTemplate: `module sui_mmers::registry {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID, ID};
    use sui::table::{Self, Table};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};
    use sui::address;

    public struct Swimmer has key, store {
        id: UID,
        distance_traveled: u64,
        name: String,
        species: String,
        last_update_timestamp_ms: u64,
    }

    public struct SwimmerRegistry has key {
        id: UID,
        swimmers: Table<ID, address>,
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

        table::add(&mut registry.swimmers, object::id(&swimmer), owner);
        transfer::public_transfer(swimmer, owner);
    }
}
`,
      },
    ],
  },
];
