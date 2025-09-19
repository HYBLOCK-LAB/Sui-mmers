import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { WalletConnect } from './components/WalletConnect'
import { CodeEditor } from './components/CodeEditor'
import { SwimmingPool } from './components/SwimmingPool'
import { Lesson } from './components/Lesson'
import { DeployContract } from './components/DeployContract'
import { SuiService } from './services/suiService'
import { Transaction } from '@mysten/sui/transactions'

interface Swimmer {
  id: string
  name: string
  speed: number
  style: number
  stamina: number
  medals: number
}

function App() {
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
    // 5초마다 업데이트
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
      // 트랜잭션 생성
      const tx = new Transaction()
      
      // Move call - 배포된 패키지 ID 사용
      tx.moveCall({
        target: `${packageId}::swimmer::create_swimmer`,
        arguments: [
          tx.pure.string(name),
          tx.pure.u8(style),
        ],
      })

      // 트랜잭션 실행
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result)
            alert('🎉 수영 선수가 성공적으로 생성되었습니다!')
            
            // 임시로 로컬 상태 업데이트
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
      console.error('Deploy failed:', error)
      alert('배포 실패: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏊</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sui Swimming</h1>
                <p className="text-xs text-gray-500">Learn Move by Gaming</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 컨트랙트 배포 섹션 */}
        {currentAccount && (
          <div className="mb-8">
            <DeployContract onPackageDeployed={setPackageId} />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 레슨 설명 */}
          <div className="lg:col-span-1">
            <Lesson
              lessonNumber={1}
              title="첫 번째 수영 선수 만들기"
              description="Move 언어로 NFT 수영 선수를 만들어봅시다! 선수의 이름과 능력치를 설정하고, Sui 블록체인에 배포해보세요."
              objectives={[
                "스마트 컨트랙트 배포하기",
                "Move 구조체(struct) 이해하기",
                "NFT 생성 함수 작성하기",
                "트랜잭션 실행 및 결과 확인"
              ]}
              tips={[
                "먼저 스마트 컨트랙트를 배포해야 NFT를 만들 수 있습니다",
                "속도는 10-100 사이의 값으로 설정하세요",
                "각 수영 스타일은 다른 애니메이션을 보여줍니다"
              ]}
            />
          </div>
          
          {/* 코드 에디터 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
              <CodeEditor 
                onDeploy={handleDeploy}
                disabled={!currentAccount || !packageId || isLoading}
              />
            </div>
          </div>
          
          {/* 수영장 시각화 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 h-full">
              <h2 className="text-xl font-bold mb-4">수영장 🏊‍♀️</h2>
              <SwimmingPool swimmers={swimmers} />
              
              {currentAccount && swimmers.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 팁: 코드 에디터에서 선수 이름과 능력치를 설정하고 
                    "Testnet에 배포하기" 버튼을 클릭하세요!
                  </p>
                </div>
              )}
              
              {!currentAccount && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔗 먼저 상단의 "Connect Wallet" 버튼으로 지갑을 연결해주세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 하단 정보 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">📚 Move 언어란?</h3>
            <p className="text-sm text-gray-600">
              Move는 디지털 자산을 안전하게 관리하기 위해 설계된 프로그래밍 언어입니다.
              Sui 블록체인에서 스마트 컨트랙트 작성에 사용됩니다.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">🔗 Testnet Faucet</h3>
            <p className="text-sm text-gray-600 mb-2">
              테스트 SUI 토큰이 필요하신가요?
            </p>
            <a 
              href="https://faucet.testnet.sui.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Faucet에서 받기 →
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">🎯 다음 레슨</h3>
            <p className="text-sm text-gray-600">
              레슨 2: 수영 훈련하기 - train 함수를 통해 선수의 능력치를 향상시켜보세요!
            </p>
          </div>
        </div>
      </main>
      
      {/* 푸터 */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>Made with ❤️ for Sui Blockchain Education</p>
            <p className="mt-1">
              <a 
                href="https://docs.sui.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Sui Docs
              </a>
              {' • '}
              <a 
                href="https://move-language.github.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Move Language
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App