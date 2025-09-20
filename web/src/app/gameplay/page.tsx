'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { LearningLayout, useSidebar } from '@/components/layout/LearningLayout';
import { WalletConnect } from '@/components/WalletConnect';
import { SwimmingPool } from '@/components/SwimmingPool';
import { DeployContract } from '@/components/DeployContract';
import { CodeEditor } from '@/components/CodeEditor';
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
  const currentAccount = useCurrentAccount();
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('smr-package-id');
    if (stored) {
      setPackageId(stored);
    }
  }, []);

  const handlePackageDeployed = useCallback((id: string) => {
    setPackageId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('smr-package-id', id);
    }
  }, []);

  const fetchSwimmers = useCallback(async () => {
    if (!currentAccount?.address) return;

    try {
      const userSwimmers = await suiService.getUserSwimmers(currentAccount.address);
      const formattedSwimmers: SwimmerSummary[] = userSwimmers.map((obj: any) => ({
        id: obj.data?.objectId || '',
        name: obj.data?.content?.fields?.name || 'Unknown Swimmer',
        species: obj.data?.content?.fields?.species || 'Mystery Species',
        distanceTraveled: Number(obj.data?.content?.fields?.distance_traveled || 0),
        baseSpeedPerHour: Number(obj.data?.content?.fields?.base_speed_per_hour || 0),
        lastUpdateTimestampMs: Number(
          obj.data?.content?.fields?.last_update_timestamp_ms || Date.now()
        ),
      }));
      setSwimmers(formattedSwimmers);
    } catch (error) {
      console.error('Failed to fetch swimmers:', error);
    }
  }, [currentAccount, suiService]);

  const fetchTunaCans = useCallback(async () => {
    if (!currentAccount?.address) return;

    try {
      const userTuna = await suiService.getUserTunaCans(currentAccount.address);
      const formattedTuna: TunaCanItem[] = userTuna.map((obj: any) => ({
        id: obj.data?.objectId || '',
        energy: Number(obj.data?.content?.fields?.energy || 0),
      }));
      setTunaCans(formattedTuna);
    } catch (error) {
      console.error('Failed to fetch tuna cans:', error);
    }
  }, [currentAccount, suiService]);

  useEffect(() => {
    const loadAssets = () => {
      fetchSwimmers();
      fetchTunaCans();
    };

    loadAssets();
    const interval = setInterval(loadAssets, 6000);
    return () => clearInterval(interval);
  }, [fetchSwimmers, fetchTunaCans]);

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
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::mint_swimmer`,
        arguments: [
          tx.pure.string(name),
          tx.pure.string(species),
          tx.object(CLOCK_OBJECT_ID),
        ],
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

  const handleMintTuna = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!');
      return;
    }

    setActionLoading('mintTuna');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::tuna::mint_tuna`,
        arguments: [tx.pure.u64(25)],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('🍣 새로운 TunaCan이 인벤토리에 추가됐어요!');
            fetchTunaCans();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('트랜잭션 실패: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to mint tuna:', error);
      alert('TunaCan 생성 실패!');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEatTuna = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId || !selectedSwimmerId || !selectedTunaId) {
      alert('Swimmer와 TunaCan을 모두 선택해주세요!');
      return;
    }

    setActionLoading('eatTuna');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::tuna::eat_tuna`,
        arguments: [
          tx.object(selectedSwimmerId),
          tx.object(selectedTunaId),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            alert('🍽 Swimmer가 TunaCan을 먹고 힘을 냅니다!');
            fetchSwimmers();
            fetchTunaCans();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('트랜잭션 실패: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to eat tuna:', error);
      alert('TunaCan 사용 실패!');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProgress = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    if (!packageId || !selectedSwimmerId) {
      alert('Swimmer를 선택하고 패키지를 배포해주세요!');
      return;
    }

    setActionLoading('update');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::update_progress`,
        arguments: [
          tx.object(selectedSwimmerId),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            fetchSwimmers();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('트랜잭션 실패: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('자동 전진 실패!');
    } finally {
      setActionLoading(null);
    }
  };

  const selectedSwimmer = swimmers.find((swimmer) => swimmer.id === selectedSwimmerId);
  const selectedTuna = tunaCans.find((tuna) => tuna.id === selectedTunaId);

  return (
    <div className="space-y-12">
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
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">배포 상태</h2>
              <p className="text-sm text-gray-600">
                하나의 패키지로 Swimmer와 TunaCan을 관리합니다. 패키지를 먼저 배포한 후 민팅과 자동 전진을 실행하세요.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 text-sm text-gray-600">
              <span className="font-medium text-gray-900">패키지 상태</span>
              <span>{packageId ? '✅ 준비 완료' : '배포 필요'}</span>
              {packageId && (
                <span className="font-mono text-xs text-gray-500 break-all">{packageId}</span>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <DeployContract onPackageDeployed={handlePackageDeployed} />
          <CodeEditor onMint={handleMintSwimmer} disabled={!packageId || !currentAccount || isLoading} />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏊 수영장</h2>
            <span className="text-xs text-gray-500">자동 전진은 6초마다 갱신됩니다.</span>
          </div>
          <SwimmingPool swimmers={swimmers} />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">🎛 Gameplay Console 액션</h2>
              <p className="text-sm text-gray-600">
                Programmable Transaction Block으로 Swimmer와 TunaCan을 동시에 다뤄보세요.
              </p>
            </div>
            <div className="text-xs text-gray-500">보유한 TunaCan {tunaCans.length}개</div>
          </div>
...
