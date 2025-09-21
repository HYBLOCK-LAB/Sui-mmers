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

In this game, you'll become the trainer of a great (perhaps slightly goofy) swimmer crossing the Pacific Ocean.

        **Explanation**

Hello, future conqueror of the seas! Before we swim across the Pacific, we need our gear, right? Our gear is the Sui Wallet and the Sui CLI for development. The wallet is a digital pouch that holds your swimmer NFTs and items, and the CLI is a magical controller that lets you talk to the blockchain. Let’s install them together and get some test “fake” Sui coins so you can practice freely. It’s not real money, so feel free to spend it as you learn!

**The Laws of the Sea: The Move Language**

All the rules for creating swimmers, crafting items, and feeding them are written in a special language called Move. Move was born at Facebook (Meta) to safely handle digital assets. The concept of “ownership” is built right into the language, which fundamentally prevents your precious swimmer NFT from being accidentally duplicated or disappearing. It’s like taking a real-world law—“an object can only be owned by one person at a time”—and writing it directly into code. From here on, we’ll use this safe and powerful Move language to create our very own ocean world!

We'll build the skeleton of our swimmer with Move, attach a progress system that grows by “eating time,” and embark on a quirky adventure where a tuna can gets gulped down in one bite. Ready? **Pull your swim cap tight—splash!**`,
        readonly: false,
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
        markdown: `
        
### Chapter 1: Let's Carve the Swimmer's Skeleton

**One-line Summary**: “A swimmer isn't just data; it's an object. Objects are born into the world with a unique UID.”

**Explanation**

In this lesson, you become the owner of a great (and perhaps a little silly) swimmer. This swimmer isn't just a picture; it's a living NFT (Non-Fungible Token) on the blockchain. In Sui, all NFTs are called 'Objects'. Just as every physical thing is an object in reality, every digital asset on the Sui blockchain exists as a unique object.

Right now, we're going to use the Move language to create the blueprint for our swimmer object. This blueprint is called a \`struct\`. A \`struct\` is like a skeleton that defines what information our swimmer is made of, such as 'name', 'speed', and 'distance traveled'.

And then, we'll add the most important magic words: \`has key\`. This keyword declares that the \`struct\` we've created isn't just a bundle of data, but can become an 'Object' that can exist independently with a unique ID on the blockchain. Now, shall we create the blueprint for our first swimmer?"

**Practice**

In the code editor to your right, create a \`struct\` named Swimmer. It should contain the following fields to represent the swimmer's various attributes:

- \`id\`: Use the UID type, which is Sui's special type for unique object identifiers on the blockchain.

- \`name\`: Use the String type to store the swimmer's name.

- \`color\`: Use the String type to store a hex color code (e.g., "#FFFFFF").

- \`speed\`: Use the u64 type for the speed value. u64 is a 64-bit unsigned integer, perfect for non-negative numbers.

- \`hunger\`: Use the u64 type for the hunger level.

- \`boost\`: Use the u64 type for the boost level.

- \`distance_traveled\`: Use the u64 type to show how far the swimmer has gone.

Please remove the **TODO** comments.`,
        readonly: false,
        codeTemplate: `module sui_mmers::swimmer_struct {
    use sui::object::{Self, UID};
    use std::string::String;

    // has key: This ability indicates that the struct can become an 
    // independent object with a unique ID on-chain.
    public struct Swimmer has key {
        id: UID,
        name: String,
        color: String,
        speed: u64,
        hunger: u64,
        boost: u64,
        distance_traveled: u64,
    }
}
`,
        codeSkeletone: `module sui_mmers::swimmer_struct {
    use sui::object::{Self, UID};
    use std::string::String;

    // has key: This ability indicates that the struct can become an 
    // independent object with a unique ID on-chain.
    public struct Swimmer has key {
        id: UID,
      // TODO: add any additional swimmer fields needed for later chapters.
    }
}
`,
      },
      {
        slug: 'mint-swimmer',
        title: 'Chapter 2 - Giving Life to the Swimmer',
        summary: 'Mint a swimmer and transfer ownership to the caller.',
        markdown: `
        ### Chapter 2: Bringing the Swimmer to Life!

**Explanation**

"Great! You've created the swimmer's skeleton. But right now, it's just a blueprint; there are no actual swimmers yet. Let's create a function to 'mint' a real swimmer NFT based on this blueprint.

In Move, a special function that can be called by anyone from the outside is marked as a \`public entry fun\`. It's like the 'Start' button of our game. We will create a function called \`mint_swimmer\` so that anyone who calls it can receive a new swimmer NFT.

When the function executes, we'll create a new object according to the \`Swimmer\` blueprint and use the magic of transfer to pass the ownership of this NFT to you—the person who called the function! Thanks to transfer, the blockchain will clearly record that this swimmer is now your property."

**Practice**

Add a public entry fun named \`mint_swimmer\`. This function should create a new \`Swimmer\` object based on user inputs and initial default values, and then transfer it to the person who called the function (the sender).

Function Parameters:
The function should accept the initial attributes that define the swimmer's appearance and base ability. It should take the following parameters:

\`name\` (as \`vector<u8>\`)

\`color\` (as \`vector<u8>\`)

\`speed\` (as \`u64\`)

About Default Values:
Not all attributes need to be passed in by the user. Inside the function, you should initialize some fields with sensible starting values. A new swimmer begins their journey at a fixed state:

Set \`name\` and \`color\` by converting the input byte vectors to Strings using \`string::from_utf8\`.

Set \`distance_traveled\` to 0.

Set \`hunger\` to 0.

Set \`boost\` to 0.

Please remove the **TODO** comments.`,
        readonly: false,
        codeTemplate: `public entry fun mint_swimmer(
        // Since an entry function cannot receive a String directly,
        // we take a byte vector (vector<u8>) as input and then convert it.
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        ctx: &mut TxContext,
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            color: string::utf8(color),
            speed: speed,
            hunger: 0,
            boost: 0,
            distance_traveled: 0,
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }
`,
        codeSkeletone: `public entry fun mint_swimmer(
        // Since an entry function cannot receive a String directly,
        // we take a byte vector (vector<u8>) as input and then convert it.
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        ctx: &mut TxContext,
    ) {
        let swimmer = Swimmer {
            // TODO: build a Swimmer and transfer it to the caller.
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }
`,
      },
      {
        slug: 'lazy-progress',
        title: "Chapter 3 - The 'Lazy Update' Pattern",
        summary: 'Automatically calculate progress based on elapsed time.',
        markdown: `
        Chapter 3: A Voyage with Time

        **Explanation**
        
        Alright, your swimmer is finally floating in the vast ocean! But... it's just sitting there, isn't it? We want this little guy to automatically move forward, even when we're not watching. Something like 'automatically advance 100 meters every hour.'

        **Challenge**
        
        Smart Contracts Can't Wake Themselves Up\n
        A smart contract is in a dormant state until someone calls it by sending a transaction. Therefore, the contract cannot execute a function like 'advance 100 meters every hour' on its own.

        **Solution**
        
        Calculate Using the 'Last Update Time'
        We use the same principle as bank interest calculation. A bank doesn't add interest to your account every second. Instead, when you make a deposit, withdrawal, or check your balance, it thinks, "Ah, this much time has passed since the last transaction, so I'll calculate the accumulated interest now and apply it!" We'll do the exact same thing!

        - Save State: Store the \`last_update_timestamp_ms\` (the last time the distance was updated) in the Swimmer object.

        - Calculate Distance: When someone (you!) calls a function to update the swimmer's state, the function calculates the difference between the current block time and the saved \`last_update_timestamp_ms\`.

        - Update State: Add the distance calculated by (elapsed time) x (base speed) to \`distance_traveled\`, and then update \`last_update_timestamp_ms\` to the current time.

        This clever method of updating the state only when needed is called the 'Lazy Update' pattern."


**Practice:** 

Extend the struct with \`last_update_timestamp_ms\` and implement \`update_progress\`. Remember to set the initial timestamp when minting.`,
        readonly: false,
        codeTemplate: `module swimming::swimmer {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
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

    public entry fun mint_swimmer(
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            color: string::utf8(color),
            speed: speed,
            hunger: 0,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock::timestamp_ms(clock);
        let elapsed_ms = now - swimmer.last_update_timestamp_ms;
        let distance_gained = (elapsed_ms * swimmer.speed) / MS_PER_MIN;

        if (distance_gained > 0) {
            swimmer.distance_traveled += distance_gained;
            swimmer.last_update_timestamp_ms = now;
        }
    }
}`,
        codeSkeletone: `module swimming::swimmer {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
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

    public entry fun mint_swimmer(
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // TODO: initialise last_update_timestamp_ms with the current time.

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock::timestamp_ms(clock);
        let elapsed_ms = now - swimmer.last_update_timestamp_ms;
        let distance_gained = (elapsed_ms * swimmer.speed) / MS_PER_MIN;

        if (distance_gained > 0) {
            // TODO: compute elapsed time and update distance_traveled.
        }
    }
}`,
      },
      {
        slug: 'deploy-swimmer',
        title: 'Chapter 4 - Deploy and test',
        summary: 'Publish the swimmer module and confirm mint and update flows.',
        markdown: `### Deployment mission

It is time to publish your swimmer module. Configure color, speed, and more!

Celebrate! your swimmer is now live!`,
        readonly: false,
        codeTemplate: `module sui_mmers::swimmer {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
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

    public entry fun mint_swimmer(
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            color: string::utf8(color),
            speed: speed,
            hunger: 100,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock::timestamp_ms(clock);
        let elapsed_ms = now - swimmer.last_update_timestamp_ms;
        let effective_speed = swimmer.speed + swimmer.boost;
        let distance_gained = (elapsed_ms * effective_speed) / MS_PER_MIN;

        if (distance_gained > 0) {
            swimmer.distance_traveled = swimmer.distance_traveled + distance_gained;
            swimmer.last_update_timestamp_ms = now;
        }
    }
}
`,
        codeSkeletone: `module sui_mmers::swimmer {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    const MS_PER_MIN: u64 = 60_000;

    public struct Swimmer has key {
        id: UID,
        name: String,
        color: String,
        speed: u64,
        hunger: u64,
        boost: u64,
        distance_traveled: u64,
        last_update_timestamp_ms: u64,
    }

    public entry fun mint_swimmer(
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            color: string::utf8(color),
            speed: speed,
            hunger: 0,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        // TODO: Use clock::timestamp_ms(clock) and update fields without using "+=" or "-="
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
        markdown: `
        ### Chapter 1: Energizing Tuna Can! 
        
        Your swimmer is going to get hungry. A long journey needs fuel. In Sui, items are also objects, so we model a TunaCan just like the swimmer. Of course, items must also be unique in the world, so don't forget \`has key\`!"

**Practice**

In the same file, try adding a \`TunaCan\` struct and a \`mint_tuna\` function to issue tuna cans. It will be very similar to \`mint_swimmer\`!

Each field in the struct must be set as follows:

- id: Generate a new unique ID for the object by calling object::new(ctx).

- boost: Set this to the incoming boost parameter

- size: Set this to the incoming size parameter

- color: Convert the incoming color parameter (which is a vector<u8>) into a String by using string::from_utf8(color).unwrap().
`,

        readonly: false,
        codeTemplate: `module sui_mmers::tuna_items {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    public struct TunaCan has key, store {
        id: UID,
        boost: u64,
        size: u64,
        color: String,
    }

    public entry fun mint_tuna(
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
}
`,
        codeSkeletone: `module sui_mmers::tuna_items {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    public struct TunaCan has key, store {
        id: UID,
        boost: u64,
        size: u64,
        color: String,
    }

    public entry fun mint_tuna(
        boost: u64,
        size: u64,
        color: vector<u8>,
        ctx: &mut TxContext
    ) {
        // TODO: create a TunaCan and transfer it to the caller.
    }
}
`,
      },
      {
        slug: 'eat-tuna',
        title: 'Chapter 2 - Gulp! PTBs and consuming objects',
        summary: 'Use an atomic PTB to feed tuna cans to swimmers.',
        markdown: `
        ### Chapter 2: Gulp!

        **Explanation**

You now have both a swimmer and a tuna can in your wallet! It's finally time to feed the tuna to your swimmer. Here, you will learn about one of Sui's most powerful features: \`PTBs (Programmable Transaction Blocks)\`.

The act of 'eating tuna' actually involves two things that must happen at the same time:

1. The swimmer's travel distance increases.

2. The used tuna can disappears.

If only #1 succeeds and #2 fails, you've created an infinite-energy tuna can, right? On the other hand, if the tuna disappears but the swimmer's stats don't change, you'd feel cheated.

A PTB is a technology that bundles multiple actions like these into a single transaction. The \`eat_tuna\` function we will create will contain both of these actions, and when called via a PTB, both operations will either **'all succeed'** or, if even one fails, **'all be undone'**. This characteristic is called **'Atomicity'**, and it allows us to interact with objects very safely!

**Practice**

Create an \`eat_tuna\` function. \`eat_tuna\` function adds the \`boost\` value from the tuna can directly to the swimmer's \`distance_traveled\`. However, since the \`Swimmer\` struct also has \`boost\` and \`hunger\` fields, it's more logical for the act of 'eating' to affect these stats.

- \`hunger Field Update\`: The most direct result of 'eating' is satisfying hunger. swimmer.hunger is calculated by size * 10.

- \`boost Field Update\`: Instead of adding the tuna can's boost value directly to distance_traveled, it is now added to the swimmer's own boost stat. This allows the boost to be used as a temporary effect or a cumulative power-up.

`,
        readonly: false,
        codeTemplate: `module sui_mmers::tuna_buffet {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    public struct Swimmer has key {
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

    public entry fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        let TunaCan { id, boost } = tuna;
        swimmer.boost = swimmer.boost + boost;
        swimmer.hunger = swimmer.hunger + (size * 10);
        object::delete(id);
    }
}`,
        codeSkeletone: `module sui_mmers::tuna_buffet {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    public struct Swimmer has key {
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

    public entry fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        // TODO: add boost to the swimmer and delete the tuna object.
    }
}`,
      },
      {
        slug: 'deploy-tuna',
        title: 'Chapter 3 - Deploy the tuna flow',
        summary: 'Publish the tuna can module and rehearse the PTB sequence.',
        markdown: `### Deployment mission

Your swimmers need fuel. Package the TunaCan logic and push it on-chain.

1. Publish the module below.
2. Mint a few tuna cans with \`mint_tuna\`.
3. Feed a swimmer by calling \`eat_tuna\` inside a programmable transaction block so the distance increase and tuna deletion happen atomically.`,
        readonly: false,
        codeTemplate: `module sui_mmers::tuna_service {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

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

    public entry fun mint_tuna(
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

    public entry fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        let TunaCan { id, boost, size, color: _ } = tuna;
        swimmer.boost = swimmer.boost + boost;
        swimmer.hunger = swimmer.hunger + (size * 10);
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
        markdown: `
### Chapter 1: Swimming Together!

**Explanation**

So far, your swimmer has been swimming the lonely sea all by itself. Where are all the other cool swimmers? Don't you want to see them?

**Challenge**: The Invisible Neighbors!

In Sui, every object we've created so far is an **'Owned Object'**. As the name implies, it is owned exclusively by you and exists only in your wallet. Therefore, other people can't see your swimmer or even know that it exists. It's like every swimmer is living on their own private island.

**Solution**: Let's Build a Notice Board in the Town Square! (Shared Object)
To solve this problem, we will create something called a 'Shared Object'. A shared object has no specific owner. Like a notice board in the town square, everyone can see it, and anyone can post new information according to set rules.

We are going to create a giant notice board (a shared object) called \`SwimmerRegistry\`. And we will change the rules so that whenever someone creates a new swimmer, their swimmer's 'nametag (ID)' is registered on this board. Now, anyone can come to this board and see a list of all the swimmers that exist in our Sui-mmers world! This is the first step toward a true multiplayer world.

**Practice**

Create \`SwimmerRegistry\` shared object to register all swimmer information, and modify the mint_swimmer function so that new swimmers are automatically registered here when they are born.
        
        Owned objects live on private islands; no one else can see them. To help everyone discover new swimmers we create a shared object called \`SwimmerRegistry\`. Every time a swimmer is minted we record its ID and owner on the registry.`,
        readonly: false,
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
        name: String,
        color: String,
        speed: u64,
        hunger: u64,
        boost: u64,
        distance_traveled: u64,
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
            hunger: 0,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        table::add(&mut registry.swimmers, object::id(&swimmer), owner);
        transfer::public_transfer(swimmer, owner);
    }
}
`,
        codeSkeletone: `module sui_mmers::registry {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID, ID};
    use sui::table::{Self, Table};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};
    use sui::address;

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

    public struct SwimmerRegistry has key {
        id: UID,
        swimmers: Table<ID, address>,
    }

    fun init(ctx: &mut TxContext) {
        // TODO: create and share the registry object.
    }

    public entry fun mint_swimmer(
        registry: &mut SwimmerRegistry,
        name: vector<u8>,
        color: vector<u8>,
        speed: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // TODO: register the swimmer and transfer it to the owner.
    }
}
`,
      },
      {
        slug: 'deploy-registry',
        title: 'Chapter 2 - Deploy the registry',
        summary: 'Publish the shared registry so every swimmer can be discovered.',
        markdown: `### Deployment mission

Share the SwimmerRegistry so every new swimmer announces itself.

1. Publish the module below.
2. Run \`init\` once to create and share the registry object.
3. Mint swimmers with \`mint_swimmer\`; confirm each ID appears in the registry table.`,
        readonly: false,
        codeTemplate: `module sui_mmers::game {

    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID, ID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
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

    public entry fun mint_swimmer(
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
            hunger: 0,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        table::add(&mut registry.swimmers, object::id(&swimmer), owner);
        transfer::public_transfer(swimmer, owner);
    }

    public entry fun mint_tuna(
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

    public entry fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        let TunaCan { id, boost, size, color: _ } = tuna;
        swimmer.hunger = swimmer.hunger + size;
        swimmer.boost = swimmer.boost + boost;

        object::delete(id);
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock::timestamp_ms(clock);
        let elapsed_ms = now - swimmer.last_update_timestamp_ms;

        if (elapsed_ms == 0) { return; }

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
            swimmer.hunger = 0;
            swimmer.boost = 0;
        }

        swimmer.last_update_timestamp_ms = now;
    }
}
`,
        codeSkeletone: `module sui_mmers::registry {
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID, ID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
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

    public entry fun mint_swimmer(
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
            hunger: 0,
            boost: 0,
            distance_traveled: 0,
            last_update_timestamp_ms: clock::timestamp_ms(clock),
        };

        table::add(&mut registry.swimmers, object::id(&swimmer), owner);
        transfer::public_transfer(swimmer, owner);
    }

    public entry fun mint_tuna(
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

    public entry fun eat_tuna(swimmer: &mut Swimmer, tuna: TunaCan) {
        let TunaCan { id, boost, size, color: _ } = tuna;
        swimmer.hunger = swimmer.hunger + size;
        swimmer.boost = swimmer.boost + boost;

        object::delete(id);
    }

    public entry fun update_progress(swimmer: &mut Swimmer, clock: &Clock) {
        let now = clock::timestamp_ms(clock);
        let elapsed_ms = now - swimmer.last_update_timestamp_ms;

        if (elapsed_ms == 0) { return; }

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
            swimmer.hunger = 0;
            swimmer.boost = 0;
        }

        swimmer.last_update_timestamp_ms = now;
    }
}
`,
      },
    ],
  },
];
