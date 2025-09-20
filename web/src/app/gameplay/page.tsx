'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { LearningLayout } from '@/components/layout/LearningLayout';
import { SwimmingPool } from '@/components/SwimmingPool';
import { DeployContract } from '@/components/DeployContract';

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
  const isConnected = Boolean(currentAccount?.address);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [suiService] = useState(() => new SuiService('testnet'));

  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([]);
  const [tunaCans, setTunaCans] = useState<TunaCanItem[]>([]);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('');
  const [selectedTunaId, setSelectedTunaId] = useState('');

  const handlePackageDeployed = useCallback((id: string) => {
    setPackageId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('smr-package-id', id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('smr-package-id');
    if (saved) {
      setPackageId(saved);
    }
  }, []);

  const fetchSwimmers = useCallback(async () => {
    if (!isConnected || !currentAccount?.address) return;

    try {
      const userSwimmers = await suiService.getUserSwimmers(currentAccount.address);
      const formatted: SwimmerSummary[] = userSwimmers.map((obj: any) => ({
        id: obj.data?.objectId || '',
        name: obj.data?.content?.fields?.name || 'Unknown Swimmer',
        species: obj.data?.content?.fields?.species || 'Mystery Species',
        distanceTraveled: Number(obj.data?.content?.fields?.distance_traveled || 0),
        baseSpeedPerHour: Number(obj.data?.content?.fields?.base_speed_per_hour || 0),
        lastUpdateTimestampMs: Number(obj.data?.content?.fields?.last_update_timestamp_ms || Date.now()),
      }));
      setSwimmers(formatted);
    } catch (error) {
      console.error('Failed to fetch swimmers:', error);
    }
  }, [isConnected, currentAccount, suiService]);

  const fetchTunaCans = useCallback(async () => {
    if (!isConnected || !currentAccount?.address) return;

    try {
      const userTuna = await suiService.getUserTunaCans(currentAccount.address);
      const formatted: TunaCanItem[] = userTuna.map((obj: any) => ({
        id: obj.data?.objectId || '',
        energy: Number(obj.data?.content?.fields?.energy || 0),
      }));
      setTunaCans(formatted);
    } catch (error) {
      console.error('Failed to fetch tuna cans:', error);
    }
  }, [isConnected, currentAccount, suiService]);

  useEffect(() => {
    if (!isConnected) {
      setSwimmers([]);
      setTunaCans([]);
      setSelectedSwimmerId('');
      setSelectedTunaId('');
      return;
    }

    fetchSwimmers();
    fetchTunaCans();

    const interval = setInterval(() => {
      fetchSwimmers();
      fetchTunaCans();
    }, 6000);

    return () => clearInterval(interval);
  }, [isConnected, fetchSwimmers, fetchTunaCans]);

  useEffect(() => {
    if (!isConnected) return;
    if (swimmers.length === 0) {
      setSelectedSwimmerId('');
      return;
    }
    if (!selectedSwimmerId || !swimmers.some((swimmer) => swimmer.id === selectedSwimmerId)) {
      setSelectedSwimmerId(swimmers[0].id);
    }
  }, [isConnected, swimmers, selectedSwimmerId]);

  useEffect(() => {
    if (!isConnected) return;
    if (tunaCans.length === 0) {
      setSelectedTunaId('');
      return;
    }
    if (!selectedTunaId || !tunaCans.some((tuna) => tuna.id === selectedTunaId)) {
      setSelectedTunaId(tunaCans[0].id);
    }
  }, [isConnected, tunaCans, selectedTunaId]);

  const handleUpdateProgress = async () => {
    if (!currentAccount) {
      alert('Connect your wallet first.');
      return;
    }
    if (!packageId) {
      alert('Deploy the contract before updating progress.');
      return;
    }
    if (!selectedSwimmerId) {
      alert('Select a swimmer to update.');
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
            fetchSwimmers();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Update progress failed:', error);
            alert('Failed to update progress: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const handleMintTuna = async () => {
    if (!currentAccount) {
      alert('Connect your wallet first.');
      return;
    }
    if (!packageId) {
      alert('Deploy the contract before minting tuna.');
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
            fetchTunaCans();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Mint tuna failed:', error);
            alert('Failed to mint tuna: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to mint tuna:', error);
      alert('Failed to mint tuna: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const handleEatTuna = async () => {
    if (!currentAccount) {
      alert('Connect your wallet first.');
      return;
    }
    if (!packageId) {
      alert('Deploy the contract before feeding tuna.');
      return;
    }
    if (!selectedSwimmerId) {
      alert('Select a swimmer first.');
      return;
    }
    if (!selectedTunaId) {
      alert('Select a tuna can first.');
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
            fetchSwimmers();
            fetchTunaCans();
            setActionLoading(null);
          },
          onError: (error) => {
            console.error('Eat tuna failed:', error);
            alert('Failed to feed tuna: ' + error.message);
            setActionLoading(null);
          },
        }
      );
    } catch (error) {
      console.error('Failed to feed tuna:', error);
      alert('Failed to feed tuna: ' + (error as Error).message);
      setActionLoading(null);
    }
  };

  const selectedSwimmer = swimmers.find((swimmer) => swimmer.id === selectedSwimmerId);
  const selectedTuna = tunaCans.find((tuna) => tuna.id === selectedTunaId);
  const actionsDisabled = !isConnected || !packageId;

  return (
    <div className="space-y-8">
      <header className="bg-white border-gray-200 rounded-xl border">
        <div className="flex flex-col gap-4 px-8 py-6 ">
          <div>
            <p className="text-sm font-semibold text-purple-600">Gameplay Console</p>
            <h1 className="text-3xl font-bold text-gray-900">Manage your swimmers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Deploy your contract, mint tuna boosts, and keep swimmers racing across the ocean.
            </p>
          </div>
          {!isConnected ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Connect your wallet to deploy the Move package and control your swimmers.
            </div>
          ) : (
            <section className="grid gap-6 md:grid-cols-3 px-4 py-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                <p className="text-xs uppercase text-blue-600 font-semibold">Wallet</p>
                <p className="mt-2 text-sm font-mono text-gray-800">
                  {isConnected && currentAccount?.address
                    ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                    : 'Not connected'}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                <p className="text-xs uppercase text-emerald-600 font-semibold">Swimmers owned</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
                <p className="text-xs uppercase text-purple-600 font-semibold">Package status</p>
                <p className="mt-2 text-sm text-gray-800">{packageId ? 'Ready to race' : 'Needs deployment'}</p>
                {packageId && <p className="mt-1 text-xs font-mono text-gray-500 break-all">{packageId}</p>}
              </div>
            </section>
          )}
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 mt-4">
        <h3 className="text-lg font-semibold text-gray-900">How to play</h3>
        <ol className="mt-3 space-y-2 list-decimal list-inside">
          <li>Deploy the swimmer package to Testnet.</li>
          <li>Mint tuna boosts and share them with your swimmers.</li>
          <li>Update swimmer progress to sync on-chain stats.</li>
        </ol>
        <p className="mt-4 text-xs text-gray-500">
          Deployment and gameplay actions require an active wallet connection.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Live control</h2>
            <p className="text-xs text-gray-500">Trigger Move entry functions directly from the console.</p>
          </div>
          {actionsDisabled && (
            <span className="text-xs text-red-500">Connect wallet and deploy package to enable controls.</span>
          )}
        </div>
        <div className={''}>
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
        {selectedSwimmer && (
          <div className="mt-4 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Current swimmer:</span> {selectedSwimmer.name} - base speed{' '}
            {selectedSwimmer.baseSpeedPerHour} m/h
          </div>
        )}
        {selectedTuna && (
          <div className="mt-1 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Selected tuna:</span> +{selectedTuna.energy} m boost
          </div>
        )}
      </section>
    </div>
  );
}
