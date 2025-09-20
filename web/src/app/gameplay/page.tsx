'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { LearningLayout, useSidebar } from '@/components/layout/LearningLayout';
import { WalletConnect } from '@/components/WalletConnect';
import { SwimmingPool } from '@/components/SwimmingPool';
import { DeployContract } from '@/components/DeployContract';
import { Button } from '@/components/ui/button';
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer';

export default function Gameplay() {
  return (
    <LearningLayout>
      <GameplayContent />
    </LearningLayout>
  );
}

function GameplayContent() {
  // Mock 지갑 상태
  const mockCurrentAccount = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chains: ['sui:testnet'],
  };
  
  const currentAccount = mockCurrentAccount; // 실제 currentAccount 대신 mock 사용
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [suiService] = useState(() => new SuiService('testnet'));
  const { openSidebar } = useSidebar();

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

  useEffect(() => {
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
  }, []);

  const handlePackageDeployed = useCallback((id: string) => {
    setPackageId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('smr-package-id', id);
    }
  }, []);

  const fetchSwimmers = useCallback(async () => {
    // Mock 모드에서는 실제 네트워크 호출 대신 mock 데이터 사용
    console.log('🎭 Mock 모드: Swimmers 데이터 로드');
    setSwimmers(mockSwimmers);
  }, []);

  const fetchTunaCans = useCallback(async () => {
    // Mock 모드에서는 실제 네트워크 호출 대신 mock 데이터 사용
    console.log('🎭 Mock 모드: TunaCans 데이터 로드');
    setTunaCans(mockTunaCans);
  }, []);

  useEffect(() => {
    // Mock 모드에서는 주기적인 데이터 업데이트 (실제 네트워크 호출 대신)
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
  }, []);

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

  const handleMintSwimmer = async (name: string, species: string) => {
    console.log('🎭 Mock 모드: Swimmer 민팅 시뮬레이션');
    setIsLoading(true);
    
    // Mock 딜레이
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
  };

  const handleMintTuna = async () => {
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
  };

  const handleEatTuna = async () => {
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
  };

  const handleUpdateProgress = async () => {
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
  };

  const selectedSwimmer = swimmers.find((swimmer) => swimmer.id === selectedSwimmerId);
  const selectedTuna = tunaCans.find((tuna) => tuna.id === selectedTunaId);

  return (
    <div className="space-y-12">
      {/* Mock 모드 배너 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🎭</span>
          <div>
            <h3 className="font-bold text-lg">Mock 테스트 모드</h3>
            <p className="text-sm opacity-90">실제 블록체인 연결 없이 게임 기능을 테스트할 수 있습니다</p>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-gray-200">
        <div className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-purple-600">🎮 Gameplay Console</p>
            <h1 className="text-3xl font-bold text-gray-900">Swimmer를 실시간으로 관리하세요</h1>
            <p className="mt-1 text-sm text-gray-600">
              자동 전진과 아이템 소비를 Programmable Transaction Block으로 안전하게 조합해 보세요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="lg:hidden" onClick={openSidebar}>
              📘 코스 열람
            </Button>
            {/* Mock 지갑 상태 표시 */}
            <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">🟢</span>
                <div className="text-sm">
                  <div className="font-medium text-green-800">Mock 지갑 연결됨</div>
                  <div className="text-green-600 font-mono">
                    {mockCurrentAccount.address.slice(0, 6)}...{mockCurrentAccount.address.slice(-4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">배포 상태</h2>
              <p className="text-sm text-gray-600">
                하나의 패키지로 Swimmer와 TunaCan을 관리합니다. <span className="text-purple-600 font-medium">Mock 모드에서는 이미 배포된 상태입니다.</span>
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 text-sm text-gray-600">
              <span className="font-medium text-gray-900">패키지 상태</span>
              <span className="text-green-600 font-medium">✅ Mock 모드: 준비 완료</span>
              <span className="font-mono text-xs text-gray-500 break-all">{packageId}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Mock 배포 상태 표시 */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
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
          </div>
          
          {/* CodeEditor 대신 Mock 코드 표시 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💻</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">코드 에디터</h3>
                <p className="text-sm text-gray-600">Mock 모드에서는 코드 편집이 불필요합니다</p>
              </div>
            </div>
            <div className="bg-white border border-gray-300 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-600">
                // Mock 모드에서는 실제 코드 편집 없이</div>
              <div className="text-gray-600">
                // 게임 기능을 테스트할 수 있습니다</div>
              <div className="text-green-600">
                console.log('🎭 Mock 테스트 모드 활성화');</div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏊 수영장 & 게임 콘솔</h2>
            <span className="text-xs text-gray-500">실시간으로 Swimmer를 조작하고 관전하세요</span>
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
