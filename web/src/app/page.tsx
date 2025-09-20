'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { LearningLayout, useLessonNavigation, useSidebar } from '@/components/layout/LearningLayout';
import { LessonDescription } from '@/components/LessonDescription';
import { WalletConnect } from '@/components/WalletConnect';
import { CodeEditor } from '@/components/CodeEditor';
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { SwimmerSummary } from '@/lib/types/swimmer';
import { Button } from '@/components/ui/button';
import { LESSONS } from '@/lib/lessons';
import { QuickGuide } from '@/components/QuickGuide';

const FIRST_LESSON = LESSONS[1];
const FIRST_CHAPTER = FIRST_LESSON.chapters[0];

const LESSON_GUIDE = `## Preparation
- Connect your wallet and switch to the Sui testnet.
- Deploy the practice package once inside the gameplay console – you can reuse it here.

## Learning flow
- Lesson 1 builds the Swimmer object and the lazy progress system.
- Lesson 2 introduces TunaCan items and PTBs.
- Lesson 3 shares a global registry so everyone can track swimmers.

## Next steps
- Jump into the gameplay console to rehearse each action inside a PTB.
- Extend the Move modules with your own ideas once you feel comfortable.`;

export default function Home() {
  return (
    <LearningLayout>
      <HomeContent />
    </LearningLayout>
  );
}

function HomeContent() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [suiService] = useState(() => new SuiService('testnet'));
  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const { openSidebar } = useSidebar();
  const { setActive } = useLessonNavigation();

  useEffect(() => {
    setActive(FIRST_LESSON.slug, FIRST_CHAPTER.slug);
  }, [setActive]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('smr-package-id');
    if (stored) {
      setPackageId(stored);
    }
  }, []);

  const fetchSwimmers = useCallback(async () => {
    if (!currentAccount?.address) return;

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
  }, [currentAccount, suiService]);

  useEffect(() => {
    fetchSwimmers();
    const interval = setInterval(fetchSwimmers, 6000);
    return () => clearInterval(interval);
  }, [fetchSwimmers]);

  const handleMintSwimmer = async (name: string, species: string) => {
    if (!currentAccount) {
      alert('Connect your wallet first!');
      return;
    }

    if (!packageId) {
      alert('Deploy the Move package in the gameplay console before minting!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${packageId}::swimmer::mint_swimmer`,
        arguments: [tx.pure.string(name), tx.pure.string(species), tx.object(CLOCK_OBJECT_ID)],
      });

      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => {
              fetchSwimmers();
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      console.error('Failed to mint swimmer:', error);
      alert('Minting failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="bg-white border-b border-gray-200">
        <div className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">🌊 Sui-mmers</p>
            <h1 className="text-3xl font-bold text-gray-900">Learn Move & Sui like a game</h1>
            <p className="mt-1 text-sm text-gray-600">
              Mint swimmers, feed them tuna, and log every splash in the shared registry as you progress through the
              lessons.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="lg:hidden" onClick={openSidebar}>
              📘 View lessons
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <QuickGuide />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <LessonDescription title="Getting started" markdown={LESSON_GUIDE} />
          <CodeEditor
            onMint={handleMintSwimmer}
            disabled={!packageId || !currentAccount || isLoading}
            codeTemplate={FIRST_CHAPTER.codeTemplate}
          />
        </div>
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">🏊 Gameplay console preview</h2>
          <p className="text-sm text-gray-600">
            Monitor progress, feed tuna, and experiment with PTBs inside the dedicated gameplay console.
          </p>
          <div className="mt-4">
            <Button asChild size="sm" variant="outline">
              <Link href="/gameplay">Open the console →</Link>
            </Button>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Why Move?</h2>
          <p className="text-sm text-gray-600">
            Move was designed for asset safety and parallel execution. As you progress through Sui-mmers you will
            experience objects, shared data, and PTBs first-hand.
          </p>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="px-4 py-6 text-center text-sm text-gray-600">
          Made with 🌊 for Sui-mmers · Keep swimming forward!
        </div>
      </footer>
    </div>
  );
}
