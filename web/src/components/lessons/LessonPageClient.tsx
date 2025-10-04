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
        console.log('[LessonPageClient] attempting to fetch package from Supabase', { address });
        const response = await fetch(`/api/deployments?walletAddress=${address}`);
        if (!response.ok) {
          const message = await response.text();
          console.warn('[LessonPageClient] failed to fetch package info', message);
          return;
        }

        const { packageId: storedPackageId } = await response.json();
        if (storedPackageId) {
          setPackageId(storedPackageId);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('smr-package-id', storedPackageId);
          }
          console.log('[LessonPageClient] package fetched from Supabase', { storedPackageId });
        }
      } catch (error) {
        console.error('[LessonPageClient] error fetching package info from Supabase', error);
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
            console.error('[LessonPageClient] failed to fetch package id by digest', error);
            return null;
          }
          console.warn(
            `[LessonPageClient] transaction not yet available, retrying... (attempt ${attempt + 1}/${maxAttempts})`
          );
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }

      console.warn('[LessonPageClient] package id not found after all retries');
      return null;
    },
    []
  );

  const handleCompileAndDeploy = async (transaction: any) => {
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
            showObjectChanges: true, // Enable object changes to get package details
            showEffects: true,
          },
        },
        {
          onSuccess: async (result) => {
            console.log('[LessonPageClient] transaction succeeded', result);

            // Extract package ID from objectChanges for published packages
            let deployedPackageId = extractPackageIdFromObjectChanges((result as any).objectChanges);

            if (!deployedPackageId) {
              deployedPackageId = await fetchPackageIdByDigest((result as any).digest);
            }

            if (deployedPackageId) {
              handlePackageDeployed(deployedPackageId);
              ApiMoveCompiler.persistDeploymentResult(transaction, deployedPackageId).catch((error) => {
                console.error('[LessonPageClient] async Supabase persist error', error);
              });
              alert(`🚀 Package deployed successfully!\n\nPackage ID: ${deployedPackageId}`);
            } else {
              console.log('[LessonPageClient] could not determine package id');
              alert('🎉 Transaction succeeded! However, package ID could not be determined.');
            }
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
