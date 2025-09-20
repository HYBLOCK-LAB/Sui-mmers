import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'

export const CLOCK_OBJECT_ID = '0x0000000000000000000000000000000000000000000000000000000000000006'

export class SuiService {
  private client: SuiClient

  constructor(network: 'testnet' | 'mainnet' | 'devnet' = 'testnet') {
    const rpcUrl = network === 'mainnet' 
      ? 'https://fullnode.mainnet.sui.io' 
      : `https://fullnode.${network}.sui.io`
    this.client = new SuiClient({ url: rpcUrl })
  }

  // 수영 선수 NFT 민팅 트랜잭션 빌드
  async buildMintSwimmerTx(
    packageId: string,
    name: string,
    species: string
  ): Promise<Transaction> {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${packageId}::swimmer::mint_swimmer`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(species),
        tx.object(CLOCK_OBJECT_ID),
      ],
    })

    return tx
  }

  // 자동 전진 업데이트 트랜잭션 빌드
  async buildUpdateProgressTx(
    packageId: string,
    swimmerId: string
  ): Promise<Transaction> {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${packageId}::swimmer::update_progress`,
      arguments: [
        tx.object(swimmerId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    })

    return tx
  }

  // 참치 통조림 민팅 트랜잭션 빌드
  async buildMintTunaTx(packageId: string): Promise<Transaction> {
    const tx = new Transaction()

    tx.moveCall({
      target: `${packageId}::swimmer::mint_tuna`,
      arguments: [],
    })

    return tx
  }

  // 참치 먹이기 트랜잭션 빌드
  async buildEatTunaTx(
    packageId: string,
    swimmerId: string,
    tunaId: string
  ): Promise<Transaction> {
    const tx = new Transaction()

    tx.moveCall({
      target: `${packageId}::swimmer::eat_tuna`,
      arguments: [
        tx.object(swimmerId),
        tx.object(tunaId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    })

    return tx
  }

  // 사용자의 수영 선수 NFT 조회
  async getUserSwimmers(address: string): Promise<any[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: address,
        options: {
          showType: true,
          showContent: true,
          showDisplay: true,
        }
      })

      return objects.data.filter(obj => 
        obj.data?.type?.includes('swimmer::Swimmer')
      )
    } catch (error) {
      console.error('Error fetching swimmers:', error)
      return []
    }
  }

  async getUserTunaCans(address: string): Promise<any[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: address,
        options: {
          showType: true,
          showContent: true,
          showDisplay: true,
        }
      })

      return objects.data.filter(obj => 
        obj.data?.type?.includes('swimmer::TunaCan')
      )
    } catch (error) {
      console.error('Error fetching tuna cans:', error)
      return []
    }
  }

  // 특정 NFT 상세 정보 조회
  async getSwimmerDetails(objectId: string): Promise<any> {
    try {
      const object = await this.client.getObject({
        id: objectId,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
        }
      })
      return object.data
    } catch (error) {
      console.error('Error fetching swimmer details:', error)
      return null
    }
  }

  // Faucet에서 테스트 SUI 받기
  async requestTestTokens(address: string): Promise<void> {
    try {
      const response = await fetch('https://faucet.testnet.sui.io/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: address,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to request tokens from faucet')
      }

      console.log('Test tokens requested successfully')
    } catch (error) {
      console.error('Error requesting test tokens:', error)
      throw error
    }
  }

  // 패키지 배포 시뮬레이션 (실제로는 Move CLI 필요)
  async deployPackage(compiledModules: string[]): Promise<string> {
    // 실제 구현에서는 컴파일된 Move 바이트코드를 배포
    // MVP에서는 미리 배포된 패키지 ID 반환
    console.log('Deploying package...')
    
    // 테스트용 더미 패키지 ID
    return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  }
}
