# Sui-mmers 🏊‍♂️

Prototype project for the **Sui Hackathon in Seoul**, built by HYBLOCK-LAB.

---

## Overview

**Sui-mmers** is a playful blockchain-based game prototype on the **Sui network**.  
Players mint and train swimmer NFTs, feed them tuna cans, and watch them progress over time in their great (and slightly silly) journey across the Pacific Ocean.

Core mechanics include:
- Minting unique **Swimmer NFTs** with attributes (name, color, speed, etc.)
- Minting and consuming **TunaCan items** to boost energy and stats
- A **lazy update system** that advances progress based on elapsed time
- A global **Swimmer Registry** (shared object) to record all swimmers and their owners

---

## Features

- **Swimmer NFT**  
  Each swimmer is an on-chain object with speed, hunger, boost, and travel distance.
  
- **TunaCan Item**  
  Independent on-chain object that, once consumed, increases the swimmer’s hunger and boost.
  
- **Eat Tuna (Atomic Interaction)**  
  Consumes a tuna can and simultaneously updates the swimmer’s attributes.
  
- **Progress Updates**  
  Uses the lazy update pattern: distance is calculated only when triggered by a call, based on the last update timestamp.
  
- **Global Registry**  
  A shared object `SwimmerRegistry` that records all swimmers by ID and their owners, enabling a multiplayer environment.

---

## Project Structure
├── sources/
│ └── swimmer.move # Move modules implementing the game logic
├── web/
│ └── ... # Frontend code (React/TypeScript)
├── README.md
└── Move.toml # Package configuration


---

## Getting Started

### Prerequisites
- [Sui CLI](https://docs.sui.io) installed and connected to either testnet or a local Sui node
- Node.js (for the web frontend)
- Git

### Build and Publish
```bash
cd sources
sui move build
sui client publish --gas-budget 40000000```

Save the returned PACKAGE_ID.

Initialize the Registry

On first deployment, the init function creates and shares a SwimmerRegistry.
Verify the registry object is shared and note its ID.

### Mint a Swimmer
## Project Structure

Mint a Swimmer
```sh
sui client call \
  --package <PACKAGE_ID> \
  --module game \
  --function mint_swimmer \
  --args <REGISTRY_ID> 'vector<u8>:0x6e656d6f' 'vector<u8>:0x626c7565' 5 0x6 \
  --gas-budget 20000000
  ```

Mint a TunaCan
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module game \
  --function mint_tuna \
  --args 12 30 'vector<u8>:0x73696c766572' \
  --gas-budget 10000000
```

Feed a TunaCan
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module game \
  --function eat_tuna \
  --args <SWIMMER_ID> <TUNACAN_ID> \
  --gas-budget 10000000
```

Update Progress
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module game \
  --function update_progress \
  --args <SWIMMER_ID> 0x6 \
  --gas-budget 10000000
```

Roadmap

 - Add a richer frontend UI to visualize swimmers and progress
 - Expand item system with rarities and special effects
 - Introduce competitive leaderboards and multiplayer races
 - Enable social mechanics: trading, gifting, and public interactions
