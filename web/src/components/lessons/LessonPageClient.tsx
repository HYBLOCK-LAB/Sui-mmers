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
  const [isLoading, setIsLoading] = useState(false);
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

  const handleCompileAndDeploy = async (transaction: any) => {
    if (!currentAccount) {
      alert('먼저 지갑을 연결해주세요!');
      return;
    }

    setIsLoading(true);
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
          onSuccess: (result) => {
            console.log('Transaction successful with full result:', result);

            console.log('Effects:', result.effects);

            // Extract package ID from objectChanges for published packages
            let deployedPackageId = null;
            if (result.objectChanges) {
              console.log('Checking objectChanges array of length:', result.objectChanges.length);
              for (const change of result.objectChanges) {
                console.log('Change type:', change.type, 'Change:', change);
                if (change.type === 'published') {
                  deployedPackageId = change.packageId;
                  console.log('Found deployed package ID from objectChanges:', deployedPackageId);
                  break;
                }
              }
            }

            // If objectChanges didn't work, try to extract from effects
            if (!deployedPackageId && result.effects) {
              // Check for created objects (package will be in created)
              if (result.effects.created) {
                for (const obj of result.effects.created) {
                  console.log('Created object:', obj);
                  // Package objects have a specific pattern
                  if (obj.owner && typeof obj.owner === 'object' && 'Immutable' in obj.owner) {
                    deployedPackageId = obj.reference.objectId;
                    console.log('Found package ID from effects.created:', deployedPackageId);
                    break;
                  }
                }
              }
            }

            if (deployedPackageId) {
              handlePackageDeployed(deployedPackageId);
              alert(`🚀 패키지가 성공적으로 배포되었습니다!\n\nPackage ID: ${deployedPackageId}`);
            } else {
              // Fallback to old method if objectChanges is not available
              const fallbackId = result.effects?.created?.[0]?.reference?.objectId;
              if (fallbackId) {
                console.log('Using fallback package ID:', fallbackId);
                handlePackageDeployed(fallbackId);
                alert(`🚀 패키지가 성공적으로 배포되었습니다!\n\nPackage ID: ${fallbackId}`);
              } else {
                console.log('Could not extract package ID from transaction result');
                alert('🎉 트랜잭션이 성공했습니다!');
              }
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
      setIsLoading(false);
    }
  };

  const handlePackageDeployed = useCallback((id: string) => {
    setPackageId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('smr-package-id', id);
    }
  }, []);

  const handleMintSwimmer = async (name: string, species: string) => {
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
      setIsLoading(false);
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
                  onMint={handleMintSwimmer}
                  onCompileAndDeploy={handleCompileAndDeploy}
                  disabled={!currentAccount || isLoading}
                  senderAddress={currentAccount?.address}
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

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
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
