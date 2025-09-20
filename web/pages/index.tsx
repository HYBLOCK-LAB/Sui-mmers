import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { WalletConnect } from '@/components/WalletConnect'
import { CodeEditor } from '@/components/CodeEditor'
import { Lesson } from '@/components/Lesson'
import { DeployContract } from '@/components/DeployContract'
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService'
import { Transaction } from '@mysten/sui/transactions'
import { Button } from '@/components/ui/button'
import { SwimmerSummary } from '@/lib/types/swimmer'

const SESSION_DATA = [
  {
    id: 'session-1',
    title: 'Session 1 · Sui와 Move의 첫 만남',
    summary: 'NFT를 설계하고 자동으로 전진하는 Swimmer를 민팅해요.',
    lessons: [
      {
        lessonNumber: 1,
        title: 'Lesson 1 · 나만의 수영선수 struct',
        description: 'UID와 핵심 상태를 담은 Swimmer 객체 설계도를 작성합니다.',
        objectives: [
          'Sui 객체는 UID 필드를 필수로 가진다는 사실 이해',
          'distance_traveled와 last_update_timestamp_ms로 진행 상황 저장',
          'Move 모듈과 struct 선언 패턴 익히기',
        ],
        tips: [
          'has key 능력이 있어야 온체인에 저장됩니다.',
          '필드 이름은 스네이크 케이스로 작성하세요.',
        ],
      },
      {
        lessonNumber: 2,
        title: 'Lesson 2 · mint_swimmer 함수',
        description: 'public entry fun으로 누구나 새로운 Swimmer NFT를 받을 수 있게 합니다.',
        objectives: [
          'TxContext에서 object::new로 UID 생성하기',
          'transfer::public_transfer로 민팅한 NFT 전달',
          'Clock 객체를 이용해 초기 업데이트 타임스탬프 설정',
        ],
        tips: [
          'Clock shared object ID는 0x6입니다.',
          'string::utf8으로 vector<u8>를 안전하게 변환하세요.',
        ],
      },
      {
        lessonNumber: 3,
        title: 'Lesson 3 · 게으른 업데이트 패턴',
        description: '자동 전진을 계산해주는 update_progress 함수를 구현합니다.',
        objectives: [
          'clock::timestamp_ms로 현재 블록 시간 읽기',
          '경과 시간과 기본 속도로 distance_traveled 증가',
          '이벤트를 emit해 온체인에서 진행 상황 로깅',
        ],
        tips: [
          '현재 시간이 last_update보다 클 때만 계산하세요.',
          'division 전에 overflow가 나지 않도록 u64 범위를 확인하세요.',
        ],
      },
    ],
  },
  {
    id: 'session-2',
    title: 'Session 2 · PTB와 객체 상호작용',
    summary: '아이템 객체를 만들고 Programmable Transaction Blocks로 함께 다룹니다.',
    lessons: [
      {
        lessonNumber: 4,
        title: 'Lesson 4 · TunaCan struct & mint_tuna',
        description: '기력 회복 아이템을 별도의 객체로 발행해봅니다.',
        objectives: [
          '아이템도 Swimmer처럼 has key 능력이 필요함 이해',
          'mint_tuna 함수에서 object::new와 transfer 사용',
          'energy 필드로 보너스 거리를 보관',
        ],
        tips: [
          '아이템은 소모되면 object::delete로 제거합니다.',
          '필요하다면 energy 값을 조정해 게임 밸런스를 맞춰보세요.',
        ],
      },
      {
        lessonNumber: 5,
        title: 'Lesson 5 · eat_tuna PTB 구성',
        description: 'Swimmer와 TunaCan을 한 트랜잭션에서 처리해 밸런스를 유지합니다.',
        objectives: [
          'Programmable Transaction Block으로 두 객체를 동시에 전달',
          'update_progress를 먼저 호출해 자동 전진 적용',
          'object::delete로 소비된 TunaCan 정리',
        ],
        tips: [
          '트랜잭션 중 하나라도 실패하면 전체가 롤백됩니다.',
          'Sui Explorer에서 이벤트 로그를 확인해보세요.',
        ],
      },
    ],
  },
]

export default function Home() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([])
  const [suiService] = useState(() => new SuiService('testnet'))
  const [isLoading, setIsLoading] = useState(false)
  const [packageId, setPackageId] = useState<string | null>(null)
  const [isCourseOpen, setIsCourseOpen] = useState(false)

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

  // 사용자의 수영 선수 NFT 조회
  useEffect(() => {
    fetchSwimmers()
    const interval = setInterval(fetchSwimmers, 6000)
    return () => clearInterval(interval)
  }, [fetchSwimmers])

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
          onSuccess: (result) => {
            console.log('Transaction successful:', result)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">🌊 Sui-mmers</p>
            <h1 className="text-3xl font-bold text-gray-900">Move & Sui를 게임처럼 배우기</h1>
            <p className="text-sm text-gray-600 mt-1">
              Swimmer NFT를 설계하고, 자동 전진과 아이템 시스템을 통해 Move의 핵심 개념을 익혀보세요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsCourseOpen(true)}>
              📘 코스 열람
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">시작하기</h2>
            <p className="mt-3 text-sm text-gray-600">
              ① 패키지를 배포하고 ② Swimmer를 한 명 민팅한 뒤 ③ Gameplay Console에서 PTB를 연습하세요.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs uppercase text-blue-600 font-semibold">연결된 지갑</p>
                <p className="mt-1 text-sm font-mono text-gray-800">
                  {currentAccount?.address
                    ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                    : '지갑 미연결'}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs uppercase text-emerald-600 font-semibold">보유한 Swimmer</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
                <p className="text-xs uppercase text-purple-600 font-semibold">패키지 상태</p>
                <p className="mt-1 text-sm text-gray-800">
                  {packageId ? '✅ 준비 완료' : '배포 필요'}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Button asChild size="sm" variant="secondary">
                <Link href="/gameplay">🎮 Gameplay Console로 이동</Link>
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">빠른 링크</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• <a href="https://docs.sui.io/learn" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Sui 학습하기</a></li>
              <li>• <a href="https://move-language.github.io" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Move 언어 문서</a></li>
              <li>• <a href="https://faucet.testnet.sui.io" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Testnet Faucet</a></li>
            </ul>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">🏊 Gameplay Console 미리보기</h2>
          <p className="text-sm text-gray-600">
            수영장 상황, 자동 전진, 참치 아이템 등 핵심 상호작용은 Gameplay Console에서 진행됩니다. 버튼을 눌러 전체 콘솔 화면으로 이동해보세요.
          </p>
          <div className="mt-4">
            <Button asChild size="sm" variant="outline">
              <Link href="/gameplay">콘솔 열기 →</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
          <DeployContract onPackageDeployed={setPackageId} />
          <CodeEditor onMint={handleMintSwimmer} disabled={!packageId || !currentAccount || isLoading} />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">왜 Move인가요?</h2>
          <p className="text-sm text-gray-600">
            Move는 자산 안전성과 동시 실행을 고려한 스마트 컨트랙트 언어입니다. Swimmer 프로젝트를 따라가며 객체 모델, 공유 객체, Programmable Transaction Block 등을 자연스럽게 경험할 수 있습니다.
          </p>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Made with 🌊 for Sui-mmers · Keep swimming forward!</p>
          </div>
        </div>
      </footer>

      {isCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm py-16 px-4">
          <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Sui-mmers 코스 지도</p>
                <h3 className="text-xl font-bold text-gray-900">Session별 학습 여정</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsCourseOpen(false)}>
                닫기
              </Button>
            </div>
            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {SESSION_DATA.map((session) => (
                <div key={session.id} className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">{session.title}</p>
                    <p className="text-sm text-gray-600">{session.summary}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {session.lessons.map((lesson) => (
                      <Lesson key={lesson.lessonNumber} {...lesson} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
