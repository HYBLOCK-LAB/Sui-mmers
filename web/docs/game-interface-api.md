# Swimmer Game Interface Documentation

## Overview

The Swimmer Game Interface provides a clean abstraction layer between your game console and the Sui blockchain. This interface handles all blockchain interactions, allowing game developers to focus on creating engaging gameplay experiences.

## Quick Start

```typescript
import { SwimmerGameInterface } from '@/lib/services/swimmerGameInterface'

// 1. Initialize the interface
const gameInterface = new SwimmerGameInterface({
  network: 'testnet',
  packageId: '0x...', // Your deployed package ID
  autoRefresh: true,
  refreshInterval: 5000
})

// 2. Connect wallet
await gameInterface.connect(walletAddress)

// 3. Start using the interface
const gameState = await gameInterface.getGameState()
console.log(`You have ${gameState.swimmerCount} swimmers!`)
```

## Core Concepts

### 1. SwimmerData
Represents a swimmer NFT with its current state:
- `id`: Unique blockchain identifier
- `name`: Swimmer's name
- `species`: Type of swimmer (e.g., "Pacific Orca")
- `distanceTraveled`: Total distance in meters
- `baseSpeedPerHour`: Speed for time-based progress
- `owner`: Wallet address of the owner

### 2. TunaCanData
Represents consumable items that boost swimmers:
- `id`: Unique blockchain identifier
- `energy`: Boost value when consumed
- `owner`: Wallet address of the owner

### 3. GameState
Complete snapshot of the current game state:
- `swimmers`: Array of all user's swimmers
- `tunaCans`: Array of all user's tuna cans
- `totalDistance`: Combined distance of all swimmers
- `packageId`: Deployed contract address

## API Reference

### Initialization

```typescript
const gameInterface = new SwimmerGameInterface({
  network: 'testnet',      // or 'mainnet', 'devnet'
  packageId: '0x...',       // Optional if setting later
  autoRefresh: true,        // Enable automatic state updates
  refreshInterval: 5000,    // Update interval in ms
  cacheExpiry: 30000       // Cache expiration in ms
})
```

### Connection Management

#### connect(address: string)
Connect a wallet to the interface.
```typescript
await gameInterface.connect('0x1234...')
```

#### disconnect()
Disconnect and clean up resources.
```typescript
gameInterface.disconnect()
```

### Data Fetching

#### getGameState()
Get complete game state for the connected user.
```typescript
const state = await gameInterface.getGameState()
// Returns: GameState object
```

#### getUserSwimmers(address?: string)
Get all swimmers owned by a user.
```typescript
const swimmers = await gameInterface.getUserSwimmers()
// Or for a specific address:
const swimmers = await gameInterface.getUserSwimmers('0x5678...')
```

#### getSwimmer(swimmerId: string)
Get details of a specific swimmer.
```typescript
const swimmer = await gameInterface.getSwimmer('0xabc...')
```

#### getUserTunaCans(address?: string)
Get all tuna cans owned by a user.
```typescript
const tunaCans = await gameInterface.getUserTunaCans()
```

### Game Actions

#### mintSwimmer(params: MintParams)
Create a new swimmer NFT.
```typescript
const result = await gameInterface.mintSwimmer({
  name: 'Speedy',
  species: 'Dolphin'
})
```

#### swimForward(params: SwimParams)
Move a swimmer forward by a specified distance.
```typescript
const result = await gameInterface.swimForward({
  swimmerId: '0xabc...',
  distance: 100
})
```

#### updateProgress(swimmerId: string)
Update swimmer's progress based on elapsed time (advanced contracts only).
```typescript
await gameInterface.updateProgress('0xabc...')
```

#### mintTuna()
Create a new tuna can item.
```typescript
const result = await gameInterface.mintTuna()
```

#### feedTuna(swimmerId: string, tunaId: string)
Feed tuna to a swimmer for an instant boost.
```typescript
await gameInterface.feedTuna('0xswimmer...', '0xtuna...')
```

### Event Handling

#### on(event: string, callback: Function)
Subscribe to game events.
```typescript
gameInterface.on('swimmer_updated', (swimmers) => {
  console.log('Swimmers updated:', swimmers)
})

gameInterface.on('error', (error) => {
  console.error('Game error:', error)
})
```

Available events:
- `swimmer_updated`: Swimmer data changed
- `tuna_updated`: Tuna inventory changed
- `package_deployed`: New package deployed
- `error`: An error occurred

#### off(event: string, callback: Function)
Unsubscribe from events.
```typescript
gameInterface.off('swimmer_updated', myCallback)
```

### Auto-Refresh

#### startAutoRefresh()
Start automatic state updates.
```typescript
gameInterface.startAutoRefresh()
```

#### stopAutoRefresh()
Stop automatic updates.
```typescript
gameInterface.stopAutoRefresh()
```

## Integration Examples

### Example 1: Basic Game Loop

```typescript
class SwimmerGame {
  private gameInterface: SwimmerGameInterface
  
  async initialize() {
    // Setup interface
    this.gameInterface = new SwimmerGameInterface({
      network: 'testnet',
      autoRefresh: true,
      refreshInterval: 3000
    })
    
    // Connect wallet
    await this.gameInterface.connect(walletAddress)
    
    // Setup event listeners
    this.gameInterface.on('swimmer_updated', this.onSwimmersUpdate.bind(this))
    
    // Initial render
    await this.render()
  }
  
  async render() {
    const state = await this.gameInterface.getGameState()
    
    // Update UI with swimmer positions
    state.swimmers.forEach(swimmer => {
      this.updateSwimmerPosition(swimmer)
    })
  }
  
  onSwimmersUpdate(swimmers: SwimmerData[]) {
    // Real-time updates
    swimmers.forEach(swimmer => {
      this.animateSwimmer(swimmer)
    })
  }
  
  async handleUserAction() {
    // User clicks "swim forward"
    await this.gameInterface.swimForward({
      swimmerId: selectedSwimmer.id,
      distance: 50
    })
  }
}
```

### Example 2: Unity Integration

```csharp
// Unity C# example (requires JSON bridge)
public class SwimmerGameBridge : MonoBehaviour {
    private string gameInterfaceId;
    
    void Start() {
        // Initialize through JavaScript bridge
        Application.ExternalCall("initGameInterface", "testnet");
    }
    
    public void OnSwimmerData(string jsonData) {
        // Parse swimmer data from JSON
        SwimmerData[] swimmers = JsonUtility.FromJson<SwimmerData[]>(jsonData);
        
        foreach(var swimmer in swimmers) {
            UpdateSwimmerGameObject(swimmer);
        }
    }
    
    public void MoveSwimmerForward(string swimmerId, int distance) {
        Application.ExternalCall("swimForward", swimmerId, distance);
    }
}
```

### Example 3: React Game Component

```tsx
import { useEffect, useState } from 'react'
import { SwimmerGameInterface } from '@/lib/services/swimmerGameInterface'

export function GameConsole() {
  const [gameInterface, setGameInterface] = useState<SwimmerGameInterface>()
  const [swimmers, setSwimmers] = useState<SwimmerData[]>([])
  const [selectedSwimmer, setSelectedSwimmer] = useState<string>()
  
  useEffect(() => {
    const gi = new SwimmerGameInterface({
      network: 'testnet',
      autoRefresh: true
    })
    
    gi.on('swimmer_updated', setSwimmers)
    setGameInterface(gi)
    
    return () => {
      gi.disconnect()
    }
  }, [])
  
  const handleSwim = async () => {
    if (!selectedSwimmer || !gameInterface) return
    
    await gameInterface.swimForward({
      swimmerId: selectedSwimmer,
      distance: 100
    })
  }
  
  return (
    <div className="game-console">
      <div className="swimmer-pool">
        {swimmers.map(swimmer => (
          <SwimmerSprite
            key={swimmer.id}
            swimmer={swimmer}
            onSelect={() => setSelectedSwimmer(swimmer.id)}
          />
        ))}
      </div>
      
      <button onClick={handleSwim}>
        Swim Forward!
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Error Handling

Always wrap async calls in try-catch blocks:

```typescript
try {
  const result = await gameInterface.mintSwimmer({
    name: 'Swimmer',
    species: 'Dolphin'
  })
  console.log('Success!', result)
} catch (error) {
  console.error('Failed to mint:', error)
  // Show user-friendly error message
}
```

### 2. Caching

The interface includes built-in caching. Configure appropriately:

```typescript
const gameInterface = new SwimmerGameInterface({
  network: 'testnet',
  cacheExpiry: 10000  // 10 seconds for frequently changing data
})
```

### 3. Event Subscription

Always clean up event listeners:

```typescript
const handleUpdate = (data) => { /* ... */ }

// Subscribe
gameInterface.on('swimmer_updated', handleUpdate)

// Later: Unsubscribe
gameInterface.off('swimmer_updated', handleUpdate)
```

### 4. Performance

For large-scale games:
- Use pagination when fetching many objects
- Implement local state management
- Batch operations when possible
- Consider using an indexing service for complex queries

## Advanced Topics

### Custom Transaction Building

For complex operations not covered by the interface:

```typescript
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()

// Add your custom Move calls
tx.moveCall({
  target: `${packageId}::your_module::your_function`,
  arguments: [/* ... */]
})

// Execute through wallet (outside interface)
await signAndExecuteTransaction({ transaction: tx })
```

### Real-time Updates with WebSocket

For real-time multiplayer features:

```typescript
// Future feature: WebSocket support
gameInterface.connectWebSocket('wss://your-game-server')
gameInterface.on('multiplayer_update', (data) => {
  // Handle real-time multiplayer events
})
```

## Troubleshooting

### Common Issues

1. **"Package ID not set"**
   - Ensure you've deployed the contract
   - Set packageId in config or call `setPackageId()`

2. **"Wallet not connected"**
   - Call `connect()` with a valid wallet address
   - Ensure wallet is on the correct network

3. **Transaction failures**
   - Check wallet has sufficient SUI for gas
   - Verify contract is deployed on the correct network
   - Ensure function parameters are correct

### Debug Mode

Enable detailed logging:

```typescript
// Set in browser console
localStorage.setItem('DEBUG_GAME_INTERFACE', 'true')
```

## Migration Guide

### From Direct Blockchain Calls

Before:
```typescript
const client = new SuiClient({ url })
const objects = await client.getOwnedObjects({ owner, filter })
// Manual parsing...
```

After:
```typescript
const gameInterface = new SwimmerGameInterface({ network: 'testnet' })
const swimmers = await gameInterface.getUserSwimmers()
// Already parsed and ready to use!
```

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/your-repo/issues)
- Discord: Join our community for help
- Documentation: This guide and inline JSDoc comments

## License

MIT - See LICENSE file for details