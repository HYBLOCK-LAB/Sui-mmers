'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { LearningLayout } from '@/components/layout/LearningLayout';
import { WalletConnect } from '@/components/WalletConnect';
import { SwimmingPool } from '@/components/SwimmingPool';
import { DeployContract } from '@/components/DeployContract';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer';
import { ApiMoveCompiler } from '@/lib/services/apiMoveCompiler';

export default function Gameplay() {
  return (
    <LearningLayout>
      <GameplayContent />
    </LearningLayout>
  );
}

function GameplayContent() {
  // Mock 모드 토글
  const [isMockMode, setIsMockMode] = useState(true); // 기본적으로 Mock 모드 활성화

  // Mock 지갑 상태
  const mockCurrentAccount = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chains: ['sui:testnet'],
  };

  // 항상 모든 Hook을 호출 (React Hook 규칙)
  const realAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // 실제 지갑 또는 Mock 지갑 선택
  const currentAccount = isMockMode ? mockCurrentAccount : realAccount;
  const [suiService] = useState(() => new SuiService('testnet'));

  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([]);
  const [tunaCans, setTunaCans] = useState<TunaCanItem[]>([]);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('');
  const [selectedTunaId, setSelectedTunaId] = useState('');

  // Mock 데이터
  const mockSwimmers: SwimmerSummary[] = [
    {
      id: 'mock-swimmer-1',
      name: '파란돌고래',
      species: 'Dolphin',
      distanceTraveled: 1250,
      baseSpeedPerHour: 50,
      lastUpdateTimestampMs: Date.now() - 300000, // 5분 전
    },
    {
      id: 'mock-swimmer-2',
      name: '빨간상어',
      species: 'Shark',
      distanceTraveled: 980,
      baseSpeedPerHour: 45,
      lastUpdateTimestampMs: Date.now() - 600000, // 10분 전
    },
    {
      id: 'mock-swimmer-3',
      name: '노란거북이',
      species: 'Turtle',
      distanceTraveled: 750,
      baseSpeedPerHour: 30,
      lastUpdateTimestampMs: Date.now() - 900000, // 15분 전
    },
  ];

  const mockTunaCans: TunaCanItem[] = [
    {
      id: 'mock-tuna-1',
      energy: 25,
    },
    {
      id: 'mock-tuna-2',
      energy: 30,
    },
    {
      id: 'mock-tuna-3',
      energy: 20,
    },
  ];

  // Mock 모드 초기화
  useEffect(() => {
    if (isMockMode) {
      // Mock 모드에서는 항상 패키지가 배포된 상태로 설정
      setPackageId('mock-package-id-12345');

      // Mock 데이터 로드
      setSwimmers(mockSwimmers);
      setTunaCans(mockTunaCans);

      // 첫 번째 아이템 선택
      if (mockSwimmers.length > 0) {
        setSelectedSwimmerId(mockSwimmers[0].id);
      }
      if (mockTunaCans.length > 0) {
        setSelectedTunaId(mockTunaCans[0].id);
      }
    }
  }, [isMockMode]);

  const handlePackageDeployed = useCallback((id: string) => {
    setPackageId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('smr-package-id', id);
    }
  }, []);

  // 실제 모드 데이터 로드
  const fetchSwimmers = useCallback(async () => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: Swimmers 데이터 로드');
      setSwimmers(mockSwimmers);
      return;
    }

    if (!currentAccount?.address) return;

    try {
      const userSwimmers = await suiService.getUserSwimmers(currentAccount.address);
      const formattedSwimmers: SwimmerSummary[] = userSwimmers.map((obj: any) => ({
        id: obj.data?.objectId || '',
        name: obj.data?.content?.fields?.name || 'Unknown Swimmer',
        species: obj.data?.content?.fields?.species || 'Mystery Species',
        distanceTraveled: Number(obj.data?.content?.fields?.distance_traveled || 0),
        baseSpeedPerHour: Number(obj.data?.content?.fields?.base_speed_per_hour || 0),
        lastUpdateTimestampMs: Number(obj.data?.content?.fields?.last_update_timestamp_ms || Date.now()),
      }));
      setSwimmers(formattedSwimmers);
    } catch (error) {
      console.error('Failed to fetch swimmers:', error);
    }
  }, [currentAccount, suiService, isMockMode]);

  const fetchTunaCans = useCallback(async () => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: TunaCans 데이터 로드');
      setTunaCans(mockTunaCans);
      return;
    }

    if (!currentAccount?.address) return;

    try {
      const userTunaCans = await suiService.getUserTunaCans(currentAccount.address);
      const formattedTunaCans: TunaCanItem[] = userTunaCans.map((obj: any) => ({
        id: obj.data?.objectId || '',
        energy: Number(obj.data?.content?.fields?.energy || 0),
      }));
      setTunaCans(formattedTunaCans);
    } catch (error) {
      console.error('Failed to fetch tuna cans:', error);
    }
  }, [currentAccount, suiService, isMockMode]);

  // Mock 모드 자동 업데이트
  useEffect(() => {
    if (!isMockMode) return;

    const interval = setInterval(() => {
      console.log('🎭 Mock 모드: 자동 데이터 업데이트');
      // 실제 게임처럼 시간에 따른 거리 증가 시뮬레이션
      setSwimmers(prev => prev.map(swimmer => ({
        ...swimmer,
        distanceTraveled: swimmer.distanceTraveled + Math.floor(swimmer.baseSpeedPerHour / 12), // 5분당 증가
        lastUpdateTimestampMs: Date.now()
      })));
    }, 6000); // 6초마다 업데이트

    return () => clearInterval(interval);
  }, [isMockMode]);

  // 선택 상태 관리
  useEffect(() => {
    if (swimmers.length === 0) {
      setSelectedSwimmerId('');
      return;
    }

    if (!selectedSwimmerId || !swimmers.some((swimmer) => swimmer.id === selectedSwimmerId)) {
      setSelectedSwimmerId(swimmers[0].id);
    }
  }, [swimmers, selectedSwimmerId]);

  useEffect(() => {
    if (tunaCans.length === 0) {
      setSelectedTunaId('');
      return;
    }

    if (!selectedTunaId || !tunaCans.some((tuna) => tuna.id === selectedTunaId)) {
      setSelectedTunaId(tunaCans[0].id);
    }
  }, [tunaCans, selectedTunaId]);

  // 실제 모드에서 데이터 로드
  useEffect(() => {
    if (!isMockMode) {
      fetchSwimmers();
      fetchTunaCans();
    }
  }, [isMockMode, fetchSwimmers, fetchTunaCans]);

  const handleCompileAndDeploy = async (transaction: any) => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: 컴파일 및 배포는 지원되지 않습니다');
      alert('Mock 모드에서는 컴파일 기능을 사용할 수 없습니다.');
      return;
    }

    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    setIsLoading(true);
    try {
      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            const deployedPackageId = result.effects?.created?.[0]?.reference?.objectId;
            if (deployedPackageId) {
              handlePackageDeployed(deployedPackageId);
              alert(`🚀 패키지가 성공적으로 배포되었습니다!\n\nPackage ID: ${deployedPackageId}`);
            } else {
              alert('🎉 트랜잭션이 성공했습니다!');
            }
            fetchSwimmers();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('트랜잭션 실패: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to execute transaction:', error);
      alert('트랜잭션 실행 실패: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintFromTemplate = async () => {
    if (!currentAccount && !isMockMode) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!');
      return;
    }

    const name = 'Template Swimmer';
    const species = 'Template Species';
    await handleMintSwimmer(name, species);
  };

  const handleMintSwimmer = async (name: string, species: string) => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: Swimmer 민팅 시뮬레이션');
      setIsLoading(true);

      setTimeout(() => {
        const newSwimmer: SwimmerSummary = {
          id: `mock-swimmer-${Date.now()}`,
          name,
          species,
          distanceTraveled: 0,
          baseSpeedPerHour: Math.floor(Math.random() * 20) + 30, // 30-50 사이 랜덤
          lastUpdateTimestampMs: Date.now(),
        };

        setSwimmers(prev => [...prev, newSwimmer]);
        setSelectedSwimmerId(newSwimmer.id);
        alert('🎉 새로운 Swimmer NFT가 도착했어요! (Mock 모드)');
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::mint_swimmer`,
        arguments: [tx.pure.string(name), tx.pure.string(species), tx.object(CLOCK_OBJECT_ID)],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('🎉 새로운 Swimmer NFT가 도착했어요!');
            fetchSwimmers();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('트랜잭션 실패: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to create swimmer:', error);
      alert('수영 선수 생성 실패!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: Progress 업데이트 시뮬레이션');
      if (!selectedSwimmerId) return;

      setActionLoading('update');

      setTimeout(() => {
        const selectedSwimmer = mockSwimmers.find(s => s.id === selectedSwimmerId);
        if (!selectedSwimmer) return;

        // 시간에 따른 거리 증가 계산 (5분 = 300초)
        const timeDiff = 300; // 5분
        const distanceIncrease = (selectedSwimmer.baseSpeedPerHour * timeDiff) / 3600;

        setSwimmers(prev => prev.map(swimmer =>
          swimmer.id === selectedSwimmerId
            ? {
                ...swimmer,
                distanceTraveled: swimmer.distanceTraveled + Math.round(distanceIncrease),
                lastUpdateTimestampMs: Date.now()
              }
            : swimmer
        ));

        alert('⏱ Swimmer가 자동으로 앞으로 나아갔어요! (Mock 모드)');
        setActionLoading(null);
      }, 600);
      return;
    }

    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!');
      return;
    }

    if (!selectedSwimmerId) {
      alert('업데이트할 Swimmer를 선택해주세요!');
      return;
    }

    setActionLoading('update');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::update_progress`,
        arguments: [tx.object(selectedSwimmerId), tx.object(CLOCK_OBJECT_ID)],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('⏱ Swimmer가 자동으로 앞으로 나아갔어요!');
            fetchSwimmers();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Update progress failed:', error);
            alert('업데이트 실패: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('업데이트 실패: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const handleMintTuna = async () => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: TunaCan 민팅 시뮬레이션');
      setActionLoading('mintTuna');

      setTimeout(() => {
        const newTuna: TunaCanItem = {
          id: `mock-tuna-${Date.now()}`,
          energy: Math.floor(Math.random() * 15) + 15, // 15-30 사이 랜덤
        };

        setTunaCans(prev => [...prev, newTuna]);
        setSelectedTunaId(newTuna.id);
        alert('🍣 새로운 TunaCan이 인벤토리에 추가됐어요! (Mock 모드)');
        setActionLoading(null);
      }, 800);
      return;
    }

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::mint_tuna`,
        arguments: [],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('🍣 참치 통조림이 인벤토리에 추가되었어요!');
            fetchTunaCans();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Mint tuna failed:', error);
            alert('참치 민팅 실패: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to mint tuna:', error);
      alert('참치 민팅 실패: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const handleEatTuna = async () => {
    if (isMockMode) {
      console.log('🎭 Mock 모드: TunaCan 먹이기 시뮬레이션');
      if (!selectedSwimmerId || !selectedTunaId) return;

      setActionLoading('eatTuna');

      setTimeout(() => {
        const selectedTuna = mockTunaCans.find(t => t.id === selectedTunaId);
        if (!selectedTuna) return;

        // Swimmer 거리 증가
        setSwimmers(prev => prev.map(swimmer =>
          swimmer.id === selectedSwimmerId
            ? { ...swimmer, distanceTraveled: swimmer.distanceTraveled + selectedTuna.energy }
            : swimmer
        ));

        // TunaCan 제거
        setTunaCans(prev => prev.filter(tuna => tuna.id !== selectedTunaId));

        // 새로운 TunaCan 선택
        const remainingTunas = mockTunaCans.filter(t => t.id !== selectedTunaId);
        if (remainingTunas.length > 0) {
          setSelectedTunaId(remainingTunas[0].id);
        } else {
          setSelectedTunaId('');
        }

        alert('🍽 Swimmer가 TunaCan을 먹고 힘을 냅니다! (Mock 모드)');
        setActionLoading(null);
      }, 1200);
      return;
    }

    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!');
      return;
    }

    if (!selectedSwimmerId) {
      alert('먹이를 줄 Swimmer를 선택해주세요!');
      return;
    }

    if (!selectedTunaId) {
      alert('먼저 참치 통조림을 준비해주세요!');
      return;
    }

    setActionLoading('eatTuna');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::eat_tuna`,
        arguments: [tx.object(selectedSwimmerId), tx.object(selectedTunaId), tx.object(CLOCK_OBJECT_ID)],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('💪 참치 보너스로 거리가 증가했어요!');
            fetchSwimmers();
            fetchTunaCans();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Eat tuna failed:', error);
            alert('먹이 주기 실패: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to eat tuna:', error);
      alert('먹이 주기 실패: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const selectedSwimmer = swimmers.find((swimmer) => swimmer.id === selectedSwimmerId);
  const selectedTuna = tunaCans.find((tuna) => tuna.id === selectedTunaId);

  return (
    <div className="space-y-12">
      {/* 모드 토글 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">테스트 모드 선택</h3>
            <p className="text-sm text-gray-600 mt-1">
              Mock 모드에서는 실제 블록체인 연결 없이 게임 기능을 테스트할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${isMockMode ? 'text-purple-600' : 'text-gray-400'}`}>
              🎭 Mock 모드
            </span>
            <button
              onClick={() => setIsMockMode(!isMockMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isMockMode ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMockMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${!isMockMode ? 'text-blue-600' : 'text-gray-400'}`}>
              🔗 실제 블록체인
            </span>
          </div>
        </div>
      </div>

      {/* Mock 모드 배너 */}
      {isMockMode && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎭</span>
            <div>
              <h3 className="font-bold text-lg">Mock 테스트 모드</h3>
              <p className="text-sm opacity-90">실제 블록체인 연결 없이 게임 기능을 테스트할 수 있습니다</p>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200">
        <div className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-purple-600">🎮 Gameplay Console</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {isMockMode ? 'Mock 모드: Swimmer 관리' : 'Swimmer와 상호작용하기'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isMockMode
                ? '실제 블록체인 연결 없이 모든 게임 기능을 테스트해보세요.'
                : '자동 전진과 아이템 소비를 Programmable Transaction Block으로 안전하게 조합해 보세요.'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="lg:hidden">
              📘 코스 열람
            </Button>
            {/* 지갑 상태 표시 */}
            <div className={`border rounded-lg px-4 py-2 ${
              currentAccount ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className={currentAccount ? 'text-green-600' : 'text-gray-600'}>
                  {currentAccount ? '🟢' : '⚪'}
                </span>
                <div className="text-sm">
                  <div className={`font-medium ${currentAccount ? 'text-green-800' : 'text-gray-800'}`}>
                    {isMockMode ? 'Mock 지갑 연결됨' : (currentAccount ? '지갑 연결됨' : '지갑 미연결')}
                  </div>
                  <div className={`font-mono ${currentAccount ? 'text-green-600' : 'text-gray-600'}`}>
                    {currentAccount?.address
                      ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                      : '연결 필요'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-12">
        {/* 상태 표시 */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-xs uppercase text-blue-600 font-semibold">
              {isMockMode ? 'Mock 지갑' : '연결된 지갑'}
            </p>
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
            <p className="mt-2 text-sm text-gray-800">
              {isMockMode ? '✅ Mock 모드: 준비 완료' : (packageId ? '✅ 준비 완료' : '배포 필요')}
            </p>
            {packageId && <p className="mt-1 text-xs font-mono text-gray-500 break-all">{packageId}</p>}
          </div>
        </section>

        {/* 컨트랙트 배포 / 코드 에디터 */}
        {!isMockMode && (
          <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
            <DeployContract onPackageDeployed={setPackageId} />
            <CodeEditor 
              onCompileAndDeploy={handleCompileAndDeploy}
              onMint={handleMintFromTemplate}
              disabled={!currentAccount || isLoading}
              codeTemplate={ApiMoveCompiler.getSwimmerMoveTemplate()}
            />
          </section>
        )}

        {/* Mock 모드 배포 상태 표시 */}
        {isMockMode && (
          <section className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="text-lg font-semibold text-green-800">컨트랙트 배포</h3>
                <p className="text-sm text-green-600">Mock 모드에서는 이미 배포된 상태입니다</p>
              </div>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <div>
                  <div className="font-medium text-green-800">배포 완료</div>
                  <div className="text-sm text-green-600">Package ID: {packageId}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 수영장 & 게임 콘솔 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏊 수영장 & 게임 콘솔</h2>
            <span className="text-xs text-gray-500">
              {isMockMode ? 'Mock 모드에서' : '실시간으로'} Swimmer를 조작하고 관전하세요
            </span>
          </div>
          <div className="h-auto">
            <SwimmingPool
              swimmers={swimmers}
              tunaCans={tunaCans}
              selectedSwimmerId={selectedSwimmerId}
              selectedTunaId={selectedTunaId}
              onSwimmerSelect={setSelectedSwimmerId}
              onTunaSelect={setSelectedTunaId}
              onUpdateProgress={handleUpdateProgress}
              onMintTuna={handleMintTuna}
              onEatTuna={handleEatTuna}
              actionLoading={actionLoading}
              packageId={packageId}
              currentAccount={currentAccount}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
