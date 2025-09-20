import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { WalletConnect } from '@/components/WalletConnect'
import { SwimmingPool } from '@/components/SwimmingPool'
import { DeployContract } from '@/components/DeployContract'
import { CodeEditor } from '@/components/CodeEditor'
import { Button } from '@/components/ui/button'
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService'
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer'

export default function Gameplay() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [suiService] = useState(() => new SuiService('testnet'))

  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([])
  const [tunaCans, setTunaCans] = useState<TunaCanItem[]>([])
  const [packageId, setPackageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('')
  const [selectedTunaId, setSelectedTunaId] = useState('')

  const fetchSwimmers = useCallback(async () => {
    if (!currentAccount?.address) return

    try {
      const userSwimmers = await suiService.getUserSwimmers(currentAccount.address)
      const formattedSwimmers: SwimmerSummary[] = userSwimmers.map((obj: any) => ({
        id: obj.data?.objectId || '',
        name: obj.data?.content?.fields?.name || 'Unknown Swimmer',
        species: obj.data?.content?.fields?.species || 'Mystery Species',
        distanceTraveled: Number(obj.data?.content?.fields?.distance_traveled || 0),
        baseSpeedPerHour: Number(obj.data?.content?.fields?.base_speed_per_hour || 0),
        lastUpdateTimestampMs: Number(obj.data?.content?.fields?.last_update_timestamp_ms || Date.now()),
      }))
      setSwimmers(formattedSwimmers)
    } catch (error) {
      console.error('Failed to fetch swimmers:', error)
    }
  }, [currentAccount, suiService])

  const fetchTunaCans = useCallback(async () => {
    if (!currentAccount?.address) return

    try {
      const userTuna = await suiService.getUserTunaCans(currentAccount.address)
      const formattedTuna: TunaCanItem[] = userTuna.map((obj: any) => ({
        id: obj.data?.objectId || '',
        energy: Number(obj.data?.content?.fields?.energy || 0),
      }))
      setTunaCans(formattedTuna)
    } catch (error) {
      console.error('Failed to fetch tuna cans:', error)
    }
  }, [currentAccount, suiService])

  useEffect(() => {
    const loadAssets = () => {
      fetchSwimmers()
      fetchTunaCans()
    }

    loadAssets()
    const interval = setInterval(loadAssets, 6000)
    return () => clearInterval(interval)
  }, [fetchSwimmers, fetchTunaCans])

  useEffect(() => {
    if (swimmers.length === 0) {
      setSelectedSwimmerId('')
      return
    }

    if (!selectedSwimmerId || !swimmers.some(swimmer => swimmer.id === selectedSwimmerId)) {
      setSelectedSwimmerId(swimmers[0].id)
    }
  }, [swimmers, selectedSwimmerId])

  useEffect(() => {
    if (tunaCans.length === 0) {
      setSelectedTunaId('')
      return
    }

    if (!selectedTunaId || !tunaCans.some(tuna => tuna.id === selectedTunaId)) {
      setSelectedTunaId(tunaCans[0].id)
    }
  }, [tunaCans, selectedTunaId])

  const handleMintSwimmer = async (name: string, species: string) => {
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
        target: `${packageId}::swimmer::mint_swimmer`,
        arguments: [
          tx.pure.string(name),
          tx.pure.string(species),
          tx.object(CLOCK_OBJECT_ID),
        ],
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('🎉 새로운 Swimmer NFT가 도착했어요!')
            fetchSwimmers()
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

  const handleUpdateProgress = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!')
      return
    }

    if (!selectedSwimmerId) {
      alert('업데이트할 Swimmer를 선택해주세요!')
      return
    }

    setActionLoading('update')
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${packageId}::swimmer::update_progress`,
        arguments: [
          tx.object(selectedSwimmerId),
          tx.object(CLOCK_OBJECT_ID),
        ],
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('⏱ Swimmer가 자동으로 앞으로 나아갔어요!')
            fetchSwimmers()
            setActionLoading(null)
          },
          onError: (error) => {
            console.error('Update progress failed:', error)
            alert('업데이트 실패: ' + error.message)
            setActionLoading(null)
          },
        }
      )
    } catch (error) {
      console.error('Failed to update progress:', error)
      alert('업데이트 실패: ' + (error as Error).message)
      setActionLoading(null)
    }
  }

  const handleMintTuna = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!')
      return
    }

    setActionLoading('mintTuna')
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${packageId}::swimmer::mint_tuna`,
        arguments: [],
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('🍣 참치 통조림이 인벤토리에 추가되었어요!')
            fetchTunaCans()
            setActionLoading(null)
          },
          onError: (error) => {
            console.error('Mint tuna failed:', error)
            alert('참치 민팅 실패: ' + error.message)
            setActionLoading(null)
          },
        }
      )
    } catch (error) {
      console.error('Failed to mint tuna:', error)
      alert('참치 민팅 실패: ' + (error as Error).message)
      setActionLoading(null)
    }
  }

  const handleEatTuna = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!')
      return
    }

    if (!selectedSwimmerId) {
      alert('먹이를 줄 Swimmer를 선택해주세요!')
      return
    }

    if (!selectedTunaId) {
      alert('먼저 참치 통조림을 준비해주세요!')
      return
    }

    setActionLoading('eatTuna')
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${packageId}::swimmer::eat_tuna`,
        arguments: [
          tx.object(selectedSwimmerId),
          tx.object(selectedTunaId),
          tx.object(CLOCK_OBJECT_ID),
        ],
      })

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('💪 참치 보너스로 거리가 증가했어요!')
            fetchSwimmers()
            fetchTunaCans()
            setActionLoading(null)
          },
          onError: (error) => {
            console.error('Eat tuna failed:', error)
            alert('먹이 주기 실패: ' + error.message)
            setActionLoading(null)
          },
        }
      )
    } catch (error) {
      console.error('Failed to eat tuna:', error)
      alert('먹이 주기 실패: ' + (error as Error).message)
      setActionLoading(null)
    }
  }

  const selectedSwimmer = swimmers.find(swimmer => swimmer.id === selectedSwimmerId)
  const selectedTuna = tunaCans.find(tuna => tuna.id === selectedTunaId)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-purple-600">🎮 Gameplay Console</p>
            <h1 className="text-3xl font-bold text-gray-900">Swimmer와 상호작용하기</h1>
            <p className="text-sm text-gray-600 mt-1">자동 전진, 아이템 사용, PTB 실습을 이 화면에서 진행하세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/">← 메인으로</Link>
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-xs uppercase text-blue-600 font-semibold">연결된 지갑</p>
            <p className="mt-2 text-sm font-mono text-gray-800">
              {currentAccount?.address
                ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                : '지갑 미연결'}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <p className="text-xs uppercase text-emerald-600 font-semibold">보유한 Swimmer</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
            <p className="text-xs uppercase text-purple-600 font-semibold">패키지 상태</p>
            <p className="mt-2 text-sm text-gray-800">{packageId ? '✅ 준비 완료' : '배포 필요'}</p>
            {packageId && (
              <p className="mt-1 text-xs font-mono text-gray-500 break-all">{packageId}</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
          <DeployContract onPackageDeployed={setPackageId} />
          <CodeEditor onMint={handleMintSwimmer} disabled={!packageId || !currentAccount || isLoading} />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏊 수영장</h2>
            <span className="text-xs text-gray-500">Swimmer 위치는 자동 전진에 따라 갱신됩니다.</span>
          </div>
          <SwimmingPool swimmers={swimmers} />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">🎮 Gameplay Console</h2>
              <p className="text-sm text-gray-600">Programmable Transaction Block으로 Swimmer와 TunaCan을 동시에 다뤄보세요.</p>
            </div>
            <div className="text-xs text-gray-500">인벤토리 {tunaCans.length}개</div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Swimmer 선택</label>
              <select
                value={selectedSwimmerId}
                onChange={(event) => setSelectedSwimmerId(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={swimmers.length === 0}
              >
                {swimmers.length === 0 ? (
                  <option>먼저 Swimmer를 민팅하세요</option>
                ) : (
                  swimmers.map((swimmer) => (
                    <option key={swimmer.id} value={swimmer.id}>
                      {swimmer.name} · {swimmer.distanceTraveled}m
                    </option>
                  ))
                )}
              </select>
              {selectedSwimmer && (
                <p className="mt-1 text-xs text-gray-500">
                  기본 속도 {selectedSwimmer.baseSpeedPerHour}m/h · 마지막 업데이트 {new Date(selectedSwimmer.lastUpdateTimestampMs).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleUpdateProgress}
                disabled={!packageId || !currentAccount || !selectedSwimmerId || actionLoading === 'update'}
                size="sm"
              >
                {actionLoading === 'update' ? '업데이트 중...' : '⏱ 자동 전진'}
              </Button>
              <Button
                onClick={handleMintTuna}
                disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
                variant="secondary"
                size="sm"
              >
                {actionLoading === 'mintTuna' ? '민팅 중...' : '🍣 참치 민팅'}
              </Button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">TunaCan 인벤토리</label>
              <select
                value={selectedTunaId}
                onChange={(event) => setSelectedTunaId(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={tunaCans.length === 0}
              >
                {tunaCans.length === 0 ? (
                  <option>참치를 민팅하면 여기에 표시됩니다</option>
                ) : (
                  tunaCans.map((tuna) => (
                    <option key={tuna.id} value={tuna.id}>
                      {tuna.id.slice(0, 6)}...{tuna.id.slice(-4)} · +{tuna.energy}m
                    </option>
                  ))
                )}
              </select>
              {selectedTuna && (
                <p className="mt-1 text-xs text-gray-500">보너스 거리 +{selectedTuna.energy}m</p>
              )}
            </div>

            <Button
              onClick={handleEatTuna}
              disabled={!packageId || !currentAccount || !selectedSwimmerId || !selectedTunaId || actionLoading === 'eatTuna'}
              size="sm"
              className="w-full md:w-auto"
            >
              {actionLoading === 'eatTuna' ? '처리 중...' : '🍽 Swimmer에게 먹이기'}
            </Button>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
              <p>✅ 순서 팁: <span className="font-semibold text-gray-800">update_progress → mint_tuna → eat_tuna</span> 흐름으로 PTB를 구성하면 안전하게 자동 전진과 아이템 소비를 결합할 수 있습니다.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          Made with 🌊 for Sui-mmers · Keep experimenting!
        </div>
      </footer>
    </div>
  )
}
