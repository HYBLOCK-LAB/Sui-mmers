'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { WalletConnect } from '@/components/WalletConnect';
import { SwimmingPool } from '@/components/SwimmingPool';
import { DeployContract } from '@/components/DeployContract';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer';

export default function Gameplay() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [suiService] = useState(() => new SuiService('testnet'));

  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([]);
  const [tunaCans, setTunaCans] = useState<TunaCanItem[]>([]);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('');
  const [selectedTunaId, setSelectedTunaId] = useState('');

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
        lastUpdateTimestampMs: Number(obj.data?.content?.fields?.last_update_timestamp_ms || Date.now()),
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
        arguments: [tx.pure.string(name), tx.pure.string(species)],
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

  const handleCompileAndDeploy = async (transaction: Transaction) => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    setIsLoading(true);
    try {
      signAndExecute(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            console.log('Deployment result:', result);
            // Extract package ID from the transaction result
            const objectChanges = result.objectChanges || [];
            const publishedPackage = objectChanges.find(
              (change: any) => change.type === 'published'
            );
            
            if (publishedPackage && publishedPackage.packageId) {
              setPackageId(publishedPackage.packageId);
              alert('🚀 스마트 컨트랙트가 성공적으로 배포되었습니다!');
              
              // After successful deployment, automatically mint a swimmer
              setTimeout(() => {
                handleMintSwimmer('My First Swimmer', 'Pacific Orca');
              }, 1000);
            } else {
              alert('✅ 트랜잭션이 성공했지만 패키지 ID를 찾을 수 없습니다.');
            }
          },
          onError: (error) => {
            console.error('Deployment failed:', error);
            alert('배포 실패: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to deploy:', error);
      alert('배포 실패: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintFromTemplate = async () => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    setIsLoading(true);
    try {
      // Compile Move code through API
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moveCode: getMoveTemplate(),
          moduleName: 'swimmer',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Compilation failed');
      }

      // Create deployment transaction with compiled bytecode
      const tx = new Transaction();
      const bytecodeBytes = Uint8Array.from(atob(result.bytecode), c => c.charCodeAt(0));
      
      const publishResult = tx.publish({
        modules: [bytecodeBytes],
        dependencies: result.dependencies,
      });

      if (publishResult) {
        const upgradeCap = Array.isArray(publishResult) ? publishResult[0] : publishResult;
        tx.transferObjects([upgradeCap], tx.gas);
      }

      // Deploy the contract
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (deployResult) => {
            console.log('Template deployment result:', deployResult);
            const objectChanges = deployResult.objectChanges || [];
            const publishedPackage = objectChanges.find(
              (change: any) => change.type === 'published'
            );
            
            if (publishedPackage && publishedPackage.packageId) {
              setPackageId(publishedPackage.packageId);
              
              // Auto-mint swimmer after deployment
              setTimeout(() => {
                handleMintSwimmer('Template Swimmer', 'Pacific Dolphin');
              }, 1000);
              
              alert('🎉 Template compiled and deployed! Auto-minting swimmer...');
            }
          },
          onError: (error) => {
            console.error('Template deployment failed:', error);
            alert('Template deployment failed: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('Failed to mint from template:', error);
      alert('Failed to compile and mint: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoveTemplate = () => {
    return `module swimming::swimmer {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    
    /// Level 1 - Basic Swimmer NFT
    public struct Swimmer has key, store {
        id: UID,
        name: String,
        species: String,
        distance_traveled: u64,
    }
    
    /// Create a new swimmer
    public entry fun mint_swimmer(
        name: vector<u8>,
        species: vector<u8>,
        ctx: &mut TxContext
    ) {
        let swimmer = Swimmer {
            id: object::new(ctx),
            name: string::utf8(name),
            species: string::utf8(species),
            distance_traveled: 0,
        };
        
        transfer::public_transfer(swimmer, tx_context::sender(ctx));
    }
    
    /// Move the swimmer forward
    public entry fun swim_forward(
        swimmer: &mut Swimmer,
        distance: u64,
    ) {
        swimmer.distance_traveled = swimmer.distance_traveled + distance;
    }
}`;
  };

  const handleUpdateProgress = async () => {
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
              <Link href="/lessons">← Lessons</Link>
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <p className="text-xs uppercase text-emerald-600 font-semibold">보유한 Swimmer</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
            <p className="text-xs uppercase text-purple-600 font-semibold">패키지 상태</p>
            <p className="mt-2 text-sm text-gray-800">{packageId ? '✅ 준비 완료' : '배포 필요'}</p>
            {packageId && <p className="mt-1 text-xs font-mono text-gray-500 break-all">{packageId}</p>}
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
            <p className="text-xs uppercase text-indigo-600 font-semibold">빠른 시작</p>
            <Button 
              onClick={handleMintFromTemplate}
              disabled={!currentAccount || isLoading}
              size="sm"
              className="mt-2 w-full"
              variant="default"
            >
              {isLoading ? '처리중...' : 'Mint Swimmer from Template'}
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
          <DeployContract onPackageDeployed={setPackageId} />
          <CodeEditor 
            onCompileAndDeploy={handleCompileAndDeploy} 
            disabled={!currentAccount || isLoading} 
          />
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

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          Made with 🌊 for Sui-mmers · Keep experimenting!
        </div>
      </footer>
    </div>
  );
}
