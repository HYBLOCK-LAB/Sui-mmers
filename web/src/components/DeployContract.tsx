import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { MoveCompiler } from '@/lib/services/moveCompiler'
import { BrowserMoveCompiler } from '@/lib/services/browserMoveCompiler'
import { Transaction } from '@mysten/sui/transactions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DeployContractProps {
  onPackageDeployed: (packageId: string) => void
}

export function DeployContract({ onPackageDeployed }: DeployContractProps) {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [isDeploying, setIsDeploying] = useState(false)
  const [packageId, setPackageId] = useState<string | null>(null)
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [compilerReady, setCompilerReady] = useState(false)

  // localStorage에서 패키지 ID 로드
  useEffect(() => {
    const savedPackageId = localStorage.getItem('smr-package-id')
    if (savedPackageId && MoveCompiler.isValidPackageAddress(savedPackageId)) {
      setPackageId(savedPackageId)
      onPackageDeployed(savedPackageId)
    }
  }, [onPackageDeployed])

  // 브라우저 Move 컴파일러 초기화
  useEffect(() => {
    const initCompiler = async () => {
      setIsInitializing(true)
      try {
        await BrowserMoveCompiler.initialize()
        setCompilerReady(true)
        console.log('✅ Browser Move compiler ready')
      } catch (error) {
        console.error('Failed to initialize Move compiler:', error)
        setErrorMessage('컴파일러 초기화 실패')
      } finally {
        setIsInitializing(false)
      }
    }
    
    initCompiler()
    
    return () => {
      BrowserMoveCompiler.cleanup()
    }
  }, [])

  const handleDeploy = async () => {
    if (!currentAccount) {
      console.error('먼저 지갑을 연결해주세요!')
      setErrorMessage('먼저 지갑을 연결해주세요!')
      return
    }

    if (!compilerReady) {
      console.error('컴파일러가 아직 준비중입니다. 잠시 후 다시 시도해주세요.')
      setErrorMessage('컴파일러가 아직 준비중입니다')
      return
    }

    setIsDeploying(true)
    setDeployStatus('deploying')
    setErrorMessage('')

    try {
      console.log('🚀 Starting browser-based Move compilation and deployment')
      
      // Move 소스 코드 가져오기
      const moveSource = BrowserMoveCompiler.getSwimmerMoveTemplate()
      
      // 브라우저에서 Move 코드 컴파일 및 배포 트랜잭션 생성
      console.log('📝 Compiling Move code in browser...')
      const tx = await BrowserMoveCompiler.createDeployTransaction('swimmer', moveSource, currentAccount.address)
      
      console.log('✅ Move code compiled successfully in browser!')
      console.log('📤 Submitting deployment transaction...')

      // 트랜잭션 실행
      signAndExecute(
        {
          transaction: tx,
          options: {
            showObjectChanges: true,
            showEffects: true,
            showEvents: true,
          },
        },
        {
          onSuccess: async (result) => {
            console.log('Deploy transaction successful:', result)
            
            // 패키지 ID 추출 시도
            let newPackageId = MoveCompiler.extractPackageId(result)
            
            // 만약 패키지 ID를 찾지 못했다면 RPC로 직접 조회
            if (!newPackageId && result.digest) {
              console.log('Fetching transaction details from RPC...')
              try {
                const response = await fetch('https://sui-testnet-rpc.publicnode.com', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'sui_getTransactionBlock',
                    params: [result.digest, { showObjectChanges: true }]
                  })
                })
                const rpcResult = await response.json()
                if (rpcResult.result?.objectChanges) {
                  const published = rpcResult.result.objectChanges.find(
                    (change: any) => change.type === 'published'
                  )
                  if (published?.packageId) {
                    newPackageId = published.packageId
                    console.log('Found package ID from RPC:', newPackageId)
                  }
                }
              } catch (error) {
                console.error('Failed to fetch transaction from RPC:', error)
              }
            }
            
            if (newPackageId) {
              setPackageId(newPackageId)
              setDeployStatus('success')
              
              // localStorage에 저장
              localStorage.setItem('smr-package-id', newPackageId)
              
              // 부모 컴포넌트에 알림
              onPackageDeployed(newPackageId)
              
              console.log(`✅ 스마트 컨트랙트가 성공적으로 배포되었습니다! 패키지 ID: ${newPackageId}`)
            } else {
              throw new Error('패키지 ID를 추출할 수 없습니다')
            }
          },
          onError: (error) => {
            console.error('Deploy transaction failed:', error)
            setDeployStatus('error')
            setErrorMessage(error.message || '배포 실패')
          },
        }
      )
    } catch (error) {
      console.error('Deploy failed:', error)
      setDeployStatus('error')
      setErrorMessage((error as Error).message)
    } finally {
      setIsDeploying(false)
    }
  }

  const handleReset = () => {
    localStorage.removeItem('smr-package-id')
    setPackageId(null)
    setDeployStatus('idle')
    setErrorMessage('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>1단계. 패키지 배포</CardTitle>
        <CardDescription>
          테스트넷에 Swimmer 패키지를 1회 배포하면, 이후에는 배포 없이 민팅만 진행합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
      
      {!compilerReady && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-700">
              {isInitializing ? '브라우저 Move 컴파일러 초기화 중...' : '컴파일러 준비 대기중...'}
            </span>
          </div>
        </div>
      )}
      
      {compilerReady && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-sm text-green-700">
            ✅ 브라우저 기반 Move 컴파일러 준비 완료! 
            소스 코드를 직접 컴파일하여 배포할 수 있습니다.
          </span>
        </div>
      )}
      
      {packageId ? (
        <div>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-green-700 font-semibold">✅ 패키지 배포 완료 (한 번만 필요) </p>
            <p className="text-xs text-gray-600 mt-2">
              패키지 ID: <span className="font-mono">{packageId}</span>
            </p>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
          >
            초기화하고 다시 배포하기
          </Button>
        </div>
      ) : (
        <div>
          {deployStatus === 'deploying' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">
                브라우저에서 Move 코드를 컴파일하고 배포중입니다...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                브라우저에서 Move 코드를 컴파일하여 테스트넷에 패키지를 배포합니다. 이후 NFT 민팅은 2단계에서 진행합니다.
              </p>
              
              {errorMessage && (
                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}
              
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !currentAccount || !compilerReady}
                className="w-full"
              >
                {isDeploying ? '배포 중...' : '패키지 배포하기'}
              </Button>
              
              {!currentAccount && (
                <p className="text-xs text-red-500 mt-2">지갑을 먼저 연결해주세요!</p>
              )}
            </>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )
}