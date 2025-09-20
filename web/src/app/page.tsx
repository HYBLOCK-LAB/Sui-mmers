'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { LearningLayout, useSidebar } from '@/components/layout/LearningLayout';
import { LessonDescription } from '@/components/LessonDescription';
import { WalletConnect } from '@/components/WalletConnect';
import { CodeEditor } from '@/components/CodeEditor';
import { SuiService, CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { Button } from '@/components/ui/button';
import { SwimmerSummary } from '@/lib/types/swimmer';
import { QuickGuide } from '@/components/QuickGuide';
import { LearningState } from '@/components/LearningState';
import { LESSON } from '@/lib/lession';

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
  const [swimmers, setSwimmers] = useState<SwimmerSummary[]>([]);
  const [suiService] = useState(() => new SuiService('testnet'));
  const [isLoading, setIsLoading] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const { openSidebar } = useSidebar();

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

  useEffect(() => {
    fetchSwimmers();
    const interval = setInterval(fetchSwimmers, 6000);
    return () => clearInterval(interval);
  }, [fetchSwimmers]);

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
        arguments: [tx.pure.string(name), tx.pure.string(species), tx.object(CLOCK_OBJECT_ID)],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
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

  return (
    <div className="space-y-12">
      <header className="bg-white border-b border-gray-200">
        <div className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">🌊 Sui-mmers</p>
            <h1 className="text-3xl font-bold text-gray-900">Move & Sui를 게임처럼 배우기</h1>
            <p className="mt-1 text-sm text-gray-600">
              Swimmer NFT를 설계하고, 자동 전진과 아이템 시스템을 통해 Move의 핵심 개념을 익혀보세요.
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
        <QuickGuide />
        <LearningState currentAccount={currentAccount} swimmers={swimmers} packageId={packageId} />

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">🏊 Gameplay Console 미리보기</h2>
          <p className="text-sm text-gray-600">
            수영장 상황, 자동 전진, 참치 아이템 등 핵심 상호작용은 Gameplay Console에서 진행됩니다. 버튼을 눌러 전체
            콘솔 화면으로 이동해보세요.
          </p>
          <div className="mt-4">
            <Button asChild size="sm" variant="outline">
              <Link href="/gameplay">콘솔 열기 →</Link>
            </Button>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">코드 실습</h2>
          <p className="text-sm text-gray-600">배포된 패키지를 활용해 Swimmer를 민팅하며 Move 코드를 연습해보세요.</p>
          <div className="flex flex-col lg:flex-row gap-2 mt-4 w-full">
            <LessonDescription title="학습 가이드" lesson={0} chapter={0} />
            <CodeEditor
              onMint={handleMintSwimmer}
              disabled={!packageId || !currentAccount || isLoading}
              lesson={0}
              chapter={0}
            />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">왜 Move인가요?</h2>
          <p className="text-sm text-gray-600">
            Move는 자산 안전성과 동시 실행을 고려한 스마트 컨트랙트 언어입니다. Swimmer 프로젝트를 따라가며 객체 모델,
            공유 객체, Programmable Transaction Block 등을 자연스럽게 경험할 수 있습니다.
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
