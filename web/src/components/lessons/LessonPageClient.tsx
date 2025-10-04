'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { LessonDescription } from '@/components/LessonDescription';
import { getLessonRoute } from '@/lib/lessons';
import { Transaction } from '@mysten/sui/transactions';
import { useLessonNavigation } from '@/components/layout/LearningLayout';
import {
  DeploymentConfigurator,
  DeploymentPreview,
  createDefaultDeploymentConfig,
} from '@/components/lessons/DeploymentConfigurator';
import type { DeploymentConfig } from '@/components/lessons/DeploymentConfigurator';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { ApiMoveCompiler } from '@/lib/services/apiMoveCompiler';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

interface LessonPageClientProps {
  lessonSlug: string;
  lessonTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  chapterSummary: string;
  markdown: string;
  codeTemplate?: string;
  codeSkeletone?: string;
  readOnly?: boolean;
  isFinalChapter?: boolean;
  nextLessonSlug?: string;
  nextChapterSlug?: string;
  nextChapterTitle?: string;
  previousLessonSlug?: string;
  previousChapterSlug?: string;
  previousChapterTitle?: string;
}

type WorkspaceTab = 'code' | 'preview';

export function LessonPageClient({
  lessonSlug,
  lessonTitle,
  chapterSlug,
  chapterTitle,
  chapterSummary,
  markdown,
  codeTemplate,
  codeSkeletone,
  readOnly,
  isFinalChapter = false,
  nextLessonSlug,
  nextChapterSlug,
  nextChapterTitle,
  previousLessonSlug,
  previousChapterSlug,
  previousChapterTitle,
}: LessonPageClientProps) {
  const { setActive } = useLessonNavigation();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('code');
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>(() => createDefaultDeploymentConfig());
  const [isDeploying, setIsDeploying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const currentAccount = useCurrentAccount();
  const [packageId, setPackageId] = useState<string | null>(null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    setActive(lessonSlug, chapterSlug);
    return () => setActive(undefined, undefined);
  }, [lessonSlug, chapterSlug, setActive]);

  const showEditor = Boolean(codeTemplate);
  const isDeploymentChapter = isFinalChapter && showEditor;

  useEffect(() => {
    setWorkspaceTab('code');
    if (isDeploymentChapter) {
      setDeploymentConfig(createDefaultDeploymentConfig());
    }
  }, [lessonSlug, chapterSlug, isDeploymentChapter]);

  const fetchPersistedPackage = useCallback(
    async (address: string) => {
      try {
        console.log('[LessonPageClient] Supabase 패키지 조회 시도', { address });
        const response = await fetch(`/api/deployments?walletAddress=${address}`);
        if (!response.ok) {
          const message = await response.text();
          console.warn('[LessonPageClient] 패키지 정보를 불러오지 못했습니다.', message);
          return;
        }

        const { packageId: storedPackageId } = await response.json();
        if (storedPackageId) {
          setPackageId(storedPackageId);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('smr-package-id', storedPackageId);
          }
          console.log('[LessonPageClient] Supabase 패키지 조회 성공', { storedPackageId });
        }
      } catch (error) {
        console.error('[LessonPageClient] Supabase 패키지 조회 실패', error);
      }
    },
    []
  );

  useEffect(() => {
    if (!currentAccount?.address) {
      return;
    }

    fetchPersistedPackage(currentAccount.address);
  }, [currentAccount?.address, fetchPersistedPackage]);

  const handleConfigChange = (updates: Partial<DeploymentConfig>) => {
    setDeploymentConfig((prev) => ({ ...prev, ...updates }));
  };

  const nextHref = nextLessonSlug && nextChapterSlug ? getLessonRoute(nextLessonSlug, nextChapterSlug) : null;
  const previousHref =
    previousLessonSlug && previousChapterSlug ? getLessonRoute(previousLessonSlug, previousChapterSlug) : null;

  const effectiveCodeSkeletone = isDeploymentChapter ? undefined : codeSkeletone;
  const effectiveReadOnly = isDeploymentChapter ? true : readOnly;

  const tabClassName = (tab: WorkspaceTab) =>
    `flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
      workspaceTab === tab
        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
        : 'border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700'
    }`;

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
            console.error('[LessonPageClient] digest 기반 패키지 조회 실패', error);
            return null;
          }
          console.warn(
            `[LessonPageClient] 트랜잭션 정보를 아직 찾지 못했습니다. 재시도합니다... (시도 ${attempt + 1}/${maxAttempts})`
          );
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }

      console.warn('[LessonPageClient] 모든 재시도 후에도 패키지 ID를 찾지 못했습니다.');
      return null;
    },
    []
  );

  const handleCompileAndDeploy = async (transaction: any) => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    setIsDeploying(true);
    try {
      signAndExecute(
        {
          transaction,
          options: {
            showObjectChanges: true, // Enable object changes to get package details
            showEffects: true,
          },
        },
        {
          onSuccess: async (result) => {
            console.log('Transaction successful with full result:', result);

            console.log('Effects:', result.effects);

            // Extract package ID from objectChanges for published packages
            let deployedPackageId = extractPackageIdFromObjectChanges((result as any).objectChanges);

            if (!deployedPackageId) {
              deployedPackageId = await fetchPackageIdByDigest((result as any).digest);
            }

            if (deployedPackageId) {
              handlePackageDeployed(deployedPackageId);
              ApiMoveCompiler.persistDeploymentResult(transaction, deployedPackageId).catch((error) => {
                console.error('[LessonPageClient] Supabase 저장 비동기 오류', error);
              });
              alert(`🚀 패키지가 성공적으로 배포되었습니다!\n\nPackage ID: ${deployedPackageId}`);
            } else {
              console.log('Could not extract package ID from transaction result');
              alert('🎉 트랜잭션이 성공했습니다! 하지만 패키지 ID 확인에 실패했습니다.');
            }
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
      setIsDeploying(false);
    }
  };

  const handlePackageDeployed = useCallback(
    (id: string) => {
      setPackageId(id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('smr-package-id', id);
      }
    },
    []
  );

  const handleMintSwimmer = async (name: string, species: string) => {
    if (!packageId) {
      alert('먼저 스마트 컨트랙트를 배포해주세요!');
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
            alert('🎉 새로운 Swimmer NFT가 도착했어요!');
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
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{lessonTitle}</p>
        <h1 className="text-3xl font-bold text-gray-900">{chapterTitle}</h1>
        <p className="text-sm text-gray-600">{chapterSummary}</p>
      </div>

      {showEditor ? (
        isDeploymentChapter ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
            <DeploymentConfigurator
              markdown={markdown}
              config={deploymentConfig}
              onConfigChange={handleConfigChange}
              lessonSlug={lessonSlug}
              chapterSlug={chapterSlug}
              onMint={handleMintSwimmer}
              isMinting={isMinting}
              mintDisabled={!currentAccount || !packageId || isDeploying}
              packageId={packageId}
            />
            <div className="space-y-4 self-start">
              <div className="flex items-center gap-2">
                <button type="button" className={tabClassName('code')} onClick={() => setWorkspaceTab('code')}>
                  Code Playground
                </button>
                <button type="button" className={tabClassName('preview')} onClick={() => setWorkspaceTab('preview')}>
                  Deployment Preview
                </button>
              </div>
              {workspaceTab === 'code' ? (
                <CodeEditor
                  codeTemplate={codeTemplate}
                  readOnly={effectiveReadOnly}
                  onCompileAndDeploy={handleCompileAndDeploy}
                  disabled={!currentAccount || isDeploying || isMinting}
                  senderAddress={currentAccount?.address}
                  deploymentMetadata={
                    currentAccount?.address
                      ? {
                          walletAddress: currentAccount.address,
                          lessonSlug,
                        }
                      : undefined
                  }
                />
              ) : (
                <DeploymentPreview config={deploymentConfig} lessonSlug={lessonSlug} chapterSlug={chapterSlug} />
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
            <LessonDescription markdown={markdown} className="h-full" />
            <CodeEditor
              codeTemplate={codeTemplate}
              codeSkeletone={effectiveCodeSkeletone}
              readOnly={effectiveReadOnly}
            />
          </div>
        )
      ) : (
        <LessonDescription markdown={markdown} />
      )}

      <div className="flex items-center justify-between pt-6">
        {previousHref ? (
          <Button asChild>
            <Link href={previousHref}>Previous: {previousChapterTitle ?? 'Continue'} </Link>
          </Button>
        ) : (
          <div />
        )}
        {nextHref ? (
          <Button asChild>
            <Link href={nextHref}>Next: {nextChapterTitle ?? 'Continue'} </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
