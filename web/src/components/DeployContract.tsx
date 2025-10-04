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
        setErrorMessage('Failed to initialize compiler')
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
      console.error('Please connect your wallet first!')
      setErrorMessage('Please connect your wallet first!')
      return
    }

    if (!compilerReady) {
      console.error('Compiler is not ready yet. Please try again shortly.')
      setErrorMessage('Compiler is not ready yet')
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
              
              console.log(`✅ Smart contract deployed successfully! Package ID: ${newPackageId}`)
            } else {
              throw new Error('Unable to extract package ID')
            }
          },
          onError: (error) => {
            console.error('Deploy transaction failed:', error)
            setDeployStatus('error')
            setErrorMessage(error.message || 'Deployment failed')
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

  // 새로 추가: 사전 컴파일된 바이트코드로 배포
  const handleDeployPrecompiled = async () => {
    if (!currentAccount) {
      setErrorMessage('Please connect your wallet first!')
      return
    }

    setIsDeploying(true)
    setDeployStatus('deploying')
    setErrorMessage('')

    try {
      console.log('🚀 Deploying precompiled modules from moveModules.ts ...')

      // 사전 컴파일된 swimmer 모듈로 트랜잭션 생성 (+ 업그레이드캡을 발신자에게 전송)
      const tx: Transaction = MoveCompiler.createPublishTransactionFromCompiled(['swimmer'], currentAccount.address)

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
            console.log('Precompiled deploy success:', result)
            let newPackageId = MoveCompiler.extractPackageId(result)

            if (!newPackageId && result.digest) {
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
                  const published = rpcResult.result.objectChanges.find((c: any) => c.type === 'published')
                  if (published?.packageId) {
                    newPackageId = published.packageId
                  }
                }
              } catch (e) {
                console.error('RPC fallback failed:', e)
              }
            }

            if (newPackageId) {
              setPackageId(newPackageId)
              setDeployStatus('success')
              localStorage.setItem('smr-package-id', newPackageId)
              onPackageDeployed(newPackageId)
            } else {
              setDeployStatus('error')
              setErrorMessage('Unable to extract package ID')
            }
          },
          onError: (error) => {
            console.error('Precompiled deploy failed:', error)
            setDeployStatus('error')
            setErrorMessage(error.message || 'Deployment failed')
          },
        }
      )
    } catch (error) {
      console.error('Deploy (precompiled) failed:', error)
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
        <CardTitle>Step 1. Deploy package</CardTitle>
        <CardDescription>
          Deploy the Swimmer package to testnet once; afterwards you can mint without redeploying.
        </CardDescription>
      </CardHeader>
      <CardContent>
      
      {!compilerReady && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-700">
              {isInitializing ? 'Initializing browser Move compiler...' : 'Waiting for compiler to be ready...'}
            </span>
          </div>
        </div>
      )}
      
      {compilerReady && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-sm text-green-700">
            ✅ Browser-based Move compiler is ready! 
            You can compile and deploy source code directly.
          </span>
        </div>
      )}
      
      {packageId ? (
        <div>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-green-700 font-semibold">✅ Package deployment complete (only needed once)</p>
            <p className="text-xs text-gray-600 mt-2">
              Package ID: <span className="font-mono">{packageId}</span>
            </p>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
          >
            Reset and deploy again
          </Button>
        </div>
      ) : (
        <div>
          {deployStatus === 'deploying' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">
                Compiling and deploying Move code in the browser...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Choose one of two methods:
                <br/>- Compile and deploy the source code in the browser
                <br/>- Deploy precompiled bytecode (recommended)
              </p>
              
              {errorMessage && (
                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleDeployPrecompiled}
                  disabled={isDeploying || !currentAccount}
                  className="w-full"
                >
                  {isDeploying ? 'Deploying...' : 'Deploy precompiled bytecode'}
                </Button>

                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || !currentAccount || !compilerReady}
                  variant="outline"
                  className="w-full"
                >
                  {isDeploying ? 'Deploying...' : 'Compile in browser and deploy'}
                </Button>
              </div>
              
              {!currentAccount && (
                <p className="text-xs text-red-500 mt-2">Please connect your wallet first!</p>
              )}
            </>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
