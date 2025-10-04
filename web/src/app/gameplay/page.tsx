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
import { MintSwimmerPanel } from '@/components/lessons/MintSwimmerPanel';
import { Button } from '@/components/ui/button';
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer';
import { ApiMoveCompiler } from '@/lib/services/apiMoveCompiler';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

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
  const [isDeploying, setIsDeploying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('');
  const [selectedTunaId, setSelectedTunaId] = useState('');

  const extractPackageIdFromObjectChanges = (objectChanges: any[] | undefined | null): string | null => {
    if (!objectChanges) return null;
    for (const change of objectChanges) {
      if (change?.type === 'published' && change?.packageId) {
        return change.packageId;
      }
    }
    return null;
  };

  const fetchPackageIdByDigest = useCallback(
    async (digest: string | undefined | null) => {
      if (!digest) return null;
      const network = process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet';
      const client = new SuiClient({ url: getFullnodeUrl(network) });
      const maxAttempts = 5;
      const retryDelayMs = 1000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const txResult = await client.getTransactionBlock({
            digest,
            options: {
              showObjectChanges: true,
              showEffects: true,
            },
          });

          const fromObjectChanges = extractPackageIdFromObjectChanges(txResult.objectChanges as any[]);
          if (fromObjectChanges) {
            return fromObjectChanges;
          }

          const created = txResult.effects?.created ?? [];
          for (const item of created as any[]) {
            if (item?.owner && typeof item.owner === 'object' && 'Immutable' in item.owner) {
              return item.reference?.objectId ?? null;
            }
          }
        } catch (error) {
          const message = (error as Error)?.message ?? String(error);
          if (!message.includes('Could not find the referenced transaction')) {
            console.error('[Gameplay] failed to fetch package id by digest', error);
            return null;
          }
          console.warn(
            `[Gameplay] transaction not yet available, retrying... (attempt ${attempt + 1}/${maxAttempts})`
          );
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }

      console.warn('[Gameplay] package id not found after all retries');
      return null;
    },
    []
  );

  // Mock 데이터
  const mockSwimmers: SwimmerSummary[] = [
    {
      id: 'mock-swimmer-1',
      name: 'Blue Dolphin',
      species: 'Dolphin',
      distanceTraveled: 1250,
      baseSpeedPerHour: 50,
      lastUpdateTimestampMs: Date.now() - 300000, // 5 minutes ago
    },
    {
      id: 'mock-swimmer-2',
      name: 'Red Shark',
      species: 'Shark',
      distanceTraveled: 980,
      baseSpeedPerHour: 45,
      lastUpdateTimestampMs: Date.now() - 600000, // 10 minutes ago
    },
    {
      id: 'mock-swimmer-3',
      name: 'Yellow Turtle',
      species: 'Turtle',
      distanceTraveled: 750,
      baseSpeedPerHour: 30,
      lastUpdateTimestampMs: Date.now() - 900000, // 15 minutes ago
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

  const handlePackageDeployed = useCallback(
    (id: string) => {
      setPackageId(id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('smr-package-id', id);
      }

      if (!isMockMode && currentAccount?.address) {
        persistPackageToSupabase(currentAccount.address, id).catch((error) => {
          console.error('[Gameplay] async package persist error', error);
        });
      }
    },
    [currentAccount?.address, isMockMode, persistPackageToSupabase]
  );

  // 실제 모드 데이터 로드
  const fetchSwimmers = useCallback(async () => {
    if (isMockMode) {
      console.log('🎭 Mock mode: loading swimmers');
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
      console.log('🎭 Mock mode: loading tuna cans');
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
      console.log('🎭 Mock mode: auto-updating data');
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

  // Load package ID from localStorage on mount
  useEffect(() => {
    if (!isMockMode && typeof window !== 'undefined') {
      const savedPackageId = window.localStorage.getItem('smr-package-id');
      if (savedPackageId) {
        console.log('Loaded package ID from localStorage:', savedPackageId);
        setPackageId(savedPackageId);
      }
    }
  }, [isMockMode]);

  const persistPackageToSupabase = useCallback(async (address: string, packageIdValue: string) => {
    try {
      console.log('[Gameplay] attempting to persist package', { address, packageId: packageIdValue });
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          packageId: packageIdValue,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        console.warn('[Gameplay] failed to persist package', message);
      } else {
        console.log('[Gameplay] package persisted successfully');
      }
    } catch (error) {
      console.error('[Gameplay] package persist request failed', error);
    }
  }, []);

  const fetchPersistedPackage = useCallback(async (address: string) => {
    try {
      console.log('[Gameplay] attempting to fetch package from Supabase', { address });
      const response = await fetch(`/api/deployments?walletAddress=${address}`);
      if (!response.ok) {
        const message = await response.text();
        console.warn('[Gameplay] failed to fetch package info', message);
        return;
      }

      const { packageId: storedPackageId } = await response.json();
      if (storedPackageId) {
        setPackageId(storedPackageId);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('smr-package-id', storedPackageId);
        }
        console.log('[Gameplay] package fetched from Supabase', { storedPackageId });
      }
    } catch (error) {
      console.error('[Gameplay] error fetching package info from Supabase', error);
    }
  }, []);

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    const address = currentAccount?.address;
    if (!address) {
      return;
    }

    fetchPersistedPackage(address);
  }, [currentAccount?.address, fetchPersistedPackage, isMockMode]);

  const handleCompileAndDeploy = async (transaction: any) => {
    if (isMockMode) {
      console.log('🎭 Mock mode: compile and deploy not supported');
      alert('Compile and deploy are unavailable in mock mode.');
      return;
    }

    if (!currentAccount) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsDeploying(true);
    try {
      signAndExecute(
        { 
          transaction,
          options: {
            showObjectChanges: true,  // Enable object changes to get package details
            showEffects: true,
          }
        },
        {
          onSuccess: async (result) => {
            console.log('[Gameplay] transaction succeeded', result);

            let deployedPackageId = extractPackageIdFromObjectChanges((result as any).objectChanges);

            if (!deployedPackageId) {
              deployedPackageId = await fetchPackageIdByDigest((result as any).digest);
            }

            if (deployedPackageId) {
              handlePackageDeployed(deployedPackageId);
              ApiMoveCompiler.persistDeploymentResult(transaction, deployedPackageId).catch((error) => {
                console.error('[Gameplay] async Supabase persist error', error);
              });
            alert(`🚀 Package deployed successfully!\n\nPackage ID: ${deployedPackageId}`);
            } else {
              console.log('[Gameplay] could not determine package id');
              alert('🎉 Transaction succeeded! However, package ID could not be determined.');
            }
            fetchSwimmers();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to execute transaction:', error);
      alert('Failed to execute transaction: ' + (error as Error).message);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleMintSwimmer = async (name: string, species: string) => {
    if (isMockMode) {
      console.log('🎭 Mock mode: simulating swimmer mint');
      setIsMinting(true);

      setTimeout(() => {
        const newSwimmer: SwimmerSummary = {
          id: `mock-swimmer-${Date.now()}`,
          name,
          species,
          distanceTraveled: 0,
          baseSpeedPerHour: Math.floor(Math.random() * 20) + 30, // 30-50 range
          lastUpdateTimestampMs: Date.now(),
        };

        setSwimmers(prev => [...prev, newSwimmer]);
        setSelectedSwimmerId(newSwimmer.id);
        alert('🎉 A new Swimmer NFT has arrived! (Mock mode)');
        setIsMinting(false);
      }, 1000);
      return;
    }

    if (!packageId) {
      alert('Please deploy the smart contract first!');
      return;
    }

    setIsMinting(true);
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
            alert('🎉 A new Swimmer NFT has arrived!');
            fetchSwimmers();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to create swimmer:', error);
      alert('Failed to create swimmer!');
    } finally {
      setIsMinting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (isMockMode) {
      console.log('🎭 Mock mode: simulating progress update');
      if (!selectedSwimmerId) return;

      setActionLoading('update');

      setTimeout(() => {
        const selectedSwimmer = mockSwimmers.find(s => s.id === selectedSwimmerId);
        if (!selectedSwimmer) return;

        // Calculate distance based on elapsed time (5 minutes = 300 seconds)
        const timeDiff = 300; // 5 minutes
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

        alert('⏱ The swimmer advanced automatically! (Mock mode)');
        setActionLoading(null);
      }, 600);
      return;
    }

    if (!currentAccount) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!packageId) {
      alert('Please deploy the smart contract first!');
      return;
    }

    if (!selectedSwimmerId) {
      alert('Please select a swimmer to update!');
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
            alert('⏱ The swimmer advanced automatically!');
            fetchSwimmers();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Update progress failed:', error);
            alert('Update failed: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Update failed: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const handleMintTuna = async () => {
    if (isMockMode) {
      console.log('🎭 Mock mode: simulating TunaCan mint');
      setActionLoading('mintTuna');

      setTimeout(() => {
        const newTuna: TunaCanItem = {
          id: `mock-tuna-${Date.now()}`,
          energy: Math.floor(Math.random() * 15) + 15, // 15-30 사이 랜덤
        };

        setTunaCans(prev => [...prev, newTuna]);
        setSelectedTunaId(newTuna.id);
        alert('🍣 A new TunaCan has been added to your inventory! (Mock mode)');
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
            alert('🍣 A TunaCan has been added to your inventory!');
            fetchTunaCans();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Mint tuna failed:', error);
            alert('Tuna mint failed: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to mint tuna:', error);
      alert('Tuna mint failed: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const handleEatTuna = async () => {
    if (isMockMode) {
      console.log('🎭 Mock mode: simulating TunaCan feeding');
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

        alert('🍽 The swimmer ate a TunaCan and gained energy! (Mock mode)');
        setActionLoading(null);
      }, 1200);
      return;
    }

    if (!currentAccount) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!packageId) {
      alert('Please deploy the smart contract first!');
      return;
    }

    if (!selectedSwimmerId) {
      alert('Please select a swimmer to feed!');
      return;
    }

    if (!selectedTunaId) {
      alert('Please mint a TunaCan first!');
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
            alert('💪 Distance increased thanks to the TunaCan bonus!');
            fetchSwimmers();
            fetchTunaCans();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Eat tuna failed:', error);
            alert('Feeding failed: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to eat tuna:', error);
      alert('Feeding failed: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const selectedSwimmer = swimmers.find((swimmer) => swimmer.id === selectedSwimmerId);
  const selectedTuna = tunaCans.find((tuna) => tuna.id === selectedTunaId);

  return (
    <div className="space-y-12">
      {/* 모드 토글 */}
      <div className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Select Test Mode</h3>
            <p className="text-sm text-gray-600 mt-1">
              In mock mode you can test gameplay features without connecting to the blockchain.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${isMockMode ? 'text-purple-600' : 'text-gray-400'}`}>
              🎭 Mock Mode
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
              🔗 Live Blockchain
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
              <h3 className="font-bold text-lg">Mock Test Mode</h3>
              <p className="text-sm opacity-90">Test gameplay features without connecting to the blockchain.</p>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 border-b border-gray-200">
        <div className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-purple-600">🎮 Gameplay Console</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {isMockMode ? 'Mock Mode: Manage Swimmers' : 'Interact with Swimmers'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isMockMode
                ? 'Try every gameplay feature without touching the blockchain.'
                : 'Combine auto-progress and item usage safely with programmable transaction blocks.'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="lg:hidden">
              📘 View Course
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
                    {isMockMode ? 'Mock wallet connected' : (currentAccount ? 'Wallet connected' : 'Wallet not connected')}
                  </div>
                  <div className={`font-mono ${currentAccount ? 'text-green-600' : 'text-gray-600'}`}>
                    {currentAccount?.address
                      ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                      : 'Connection required'
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
          <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-5 py-4">
            <p className="text-xs uppercase text-blue-600 font-semibold">
              {isMockMode ? 'Mock Wallet' : 'Connected Wallet'}
            </p>
            <p className="mt-2 text-sm font-mono text-gray-800">
              {currentAccount?.address
                ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                : 'Wallet not connected'}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-5 py-4">
            <p className="text-xs uppercase text-emerald-600 font-semibold">Swimmers Owned</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/80 px-5 py-4">
            <p className="text-xs uppercase text-purple-600 font-semibold">Package Status</p>
            <p className="mt-2 text-sm text-gray-800">
              {isMockMode ? '✅ Mock mode: ready' : (packageId ? '✅ Ready' : 'Deployment required')}
            </p>
            {packageId && <p className="mt-1 text-xs font-mono text-gray-500 break-all">{packageId}</p>}
          </div>
        </section>

        {/* 컨트랙트 배포 / 코드 에디터 */}
        {!isMockMode && (
          <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
            <DeployContract onPackageDeployed={setPackageId} />
            <div className="space-y-4">
              <CodeEditor
                onCompileAndDeploy={handleCompileAndDeploy}
                disabled={!currentAccount || isDeploying || isMinting}
                codeTemplate={ApiMoveCompiler.getAdvancedSwimmerTemplate()}
                senderAddress={currentAccount?.address}
                deploymentMetadata={
                  currentAccount?.address
                    ? {
                        walletAddress: currentAccount.address,
                      }
                    : undefined
                }
              />
              <MintSwimmerPanel
                onMint={handleMintSwimmer}
                isMinting={isMinting}
                disabled={!currentAccount || isDeploying}
                packageId={packageId}
                defaultName="Template Swimmer"
                defaultSpecies="Template Species"
                resetKey={packageId ?? 'no-package'}
              />
            </div>
          </section>
        )}

        {isMockMode && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="bg-green-50/80 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Contract Deployment</h3>
                  <p className="text-sm text-green-600">Already deployed in mock mode.</p>
                </div>
              </div>
              <div className="bg-green-100/80 border border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <div>
                    <div className="font-medium text-green-800">Deployment complete</div>
                    <div className="text-sm text-green-600">Package ID: {packageId ?? 'mock-package'}</div>
                  </div>
                </div>
              </div>
            </div>
            <MintSwimmerPanel
              onMint={handleMintSwimmer}
              isMinting={isMinting}
              disabled={false}
              packageId={packageId ?? 'mock-package'}
              defaultName="Mock Swimmer"
              defaultSpecies="Mock Species"
              resetKey="mock-mode"
            />
          </section>
        )}

        {/* 수영장 & 게임 콘솔 */}
        <section className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏊 Swimming Pool & Game Console</h2>
            <span className="text-xs text-gray-500">
              {isMockMode ? 'Control swimmers in mock mode.' : 'Control swimmers live on-chain.'}
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
