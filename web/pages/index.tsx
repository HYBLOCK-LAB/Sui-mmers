import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { WalletConnect } from '@/components/WalletConnect'
import { CodeEditor } from '@/components/CodeEditor'
import { SwimmingPool } from '@/components/SwimmingPool'
import { Lesson } from '@/components/Lesson'
import { DeployContract } from '@/components/DeployContract'
import { SuiService } from '@/lib/services/suiService'
import { Transaction } from '@mysten/sui/transactions'
import { Button } from '@/components/ui/button'

interface Swimmer {
  id: string
  name: string
  speed: number
  style: number
  stamina: number
  medals: number
}

export default function Home() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [suiService] = useState(() => new SuiService('testnet'))
  const [isLoading, setIsLoading] = useState(false)
  const [packageId, setPackageId] = useState<string | null>(null)

  // 사용자의 수영 선수 NFT 조회
  useEffect(() => {
    const fetchSwimmers = async () => {
      if (currentAccount?.address) {
        try {
          const userSwimmers = await suiService.getUserSwimmers(currentAccount.address)
          const formattedSwimmers: Swimmer[] = userSwimmers.map((obj: any) => ({
            id: obj.data?.objectId || '',
            name: obj.data?.content?.fields?.name || 'Unknown',
            speed: Number(obj.data?.content?.fields?.speed || 30),
            style: Number(obj.data?.content?.fields?.style || 0),
            stamina: Number(obj.data?.content?.fields?.stamina || 60),
            medals: Number(obj.data?.content?.fields?.medals || 0),
          }))
          setSwimmers(formattedSwimmers)
        } catch (error) {
          console.error('Failed to fetch swimmers:', error)
        }
      }
    }

    fetchSwimmers()
    const interval = setInterval(fetchSwimmers, 5000)
    return () => clearInterval(interval)
  }, [currentAccount, suiService])

  const handleDeploy = async (name: string, style: number) => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!')
      return
    }

    setIsLoading(true)
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${packageId}::swimmer::create_swimmer`,
        arguments: [
          tx.pure.string(name),
          tx.pure.u8(style),
        ],
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result)
            alert('🎉 수영 선수가 성공적으로 생성되었습니다!')
            
            const newSwimmer: Swimmer = {
              id: Date.now().toString(),
              name,
              speed: 30,
              style,
              stamina: 60,
              medals: 0,
            }
            setSwimmers([...swimmers, newSwimmer])
          },
          onError: (error) => {
            console.error('Transaction failed:', error)
            alert('트랜잭션 실패: ' + error.message)
          },
        }
      )
    } catch (error) {
      console.error('Failed to create swimmer:', error)
      alert('수영 선수 생성 실패!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🏊</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sui Swimming</h1>
                <p className="text-sm text-gray-600">Learn Move by Gaming</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 레슨 섹션 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <Lesson 
              lessonNumber={1}
              title="Move로 수영 선수 NFT 만들기"
              description="Move 언어의 기초를 배우며 나만의 수영 선수 NFT를 만들어보세요."
              objectives={[
                "Move 모듈 구조와 기본 문법 이해",
                "NFT 구조체(struct) 정의하기", 
                "파라미터로 속성 커스터마이징",
                "Sui 테스트넷에 실제 배포하기"
              ]}
              tips={[
                "속도와 체력 값을 조정해보세요",
                "수영 스타일을 선택하면 애니메이션이 달라집니다",
                "배포 후에는 수영장에서 선수를 확인할 수 있어요"
              ]}
            />
          </div>
        </div>

        {/* 메인 작업 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 왼쪽: 1단계(패키지 배포) + 2단계(NFT 민팅) */}
          <div className="space-y-6">
            {/* 1단계 */}
            <DeployContract onPackageDeployed={setPackageId} />
            
            {/* 2단계 */}
            <CodeEditor onDeploy={handleDeploy} disabled={!packageId || !currentAccount} />
          </div>
          
          {/* 오른쪽: 수영장 시각화 */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏊 수영장</h2>
            <SwimmingPool swimmers={swimmers} />
          </div>
        </div>
        
        {/* 추가 정보 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
            <h3 className="font-bold text-gray-900 mb-2">📚 Move 언어란?</h3>
            <p className="text-sm text-gray-600">
              Move는 디지털 자산을 안전하게 관리하기 위해 설계된 프로그래밍 언어입니다.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">🔗 Testnet Faucet</h3>
            <p className="text-sm text-gray-600 mb-3">
              테스트 SUI 토큰이 필요하신가요?
            </p>
            <Button asChild variant="secondary" size="sm">
              <a
                href="https://faucet.testnet.sui.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                Faucet에서 받기 →
              </a>
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">🎯 다음 레슨</h3>
            <p className="text-sm text-gray-600">
              레슨 2: train 함수로 선수 능력치 향상시키기
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Made with ❤️ for Sui Blockchain Education</p>
            <div className="mt-2 flex justify-center gap-4">
              <a href="https://docs.sui.io" className="text-sm text-blue-600 hover:text-blue-800" target="_blank">Sui Docs</a>
              <span className="text-gray-400">•</span>
              <a href="https://move-language.github.io" className="text-sm text-blue-600 hover:text-blue-800" target="_blank">Move Language</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}