import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

export class SuiService {
  private client: SuiClient

  constructor(network: 'testnet' | 'mainnet' | 'devnet' = 'testnet') {
    const rpcUrl = network === 'mainnet' 
      ? 'https://fullnode.mainnet.sui.io' 
      : `https://fullnode.${network}.sui.io`
    this.client = new SuiClient({ url: rpcUrl })
  }

  // 수영 선수 NFT 생성 트랜잭션 빌드
  async buildCreateSwimmerTx(
    packageId: string,
    name: string,
    style: number
  ): Promise<Transaction> {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${packageId}::swimmer::create_swimmer`,
      arguments: [
        tx.pure.string(name),
        tx.pure.u8(style),
      ],
    })

    return tx
  }

  // 훈련 트랜잭션 빌드
  async buildTrainSwimmerTx(
    packageId: string,
    swimmerId: string
  ): Promise<Transaction> {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${packageId}::swimmer::train`,
      arguments: [
        tx.object(swimmerId),
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