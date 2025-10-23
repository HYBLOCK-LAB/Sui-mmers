'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { StoredDeployment } from '@/components/CodeEditor';
import { LessonDescription } from '@/components/LessonDescription';
import { getLessonRoute } from '@/lib/lessons';
import { Transaction } from '@mysten/sui/transactions';
import Swal from 'sweetalert2';
import { useLessonNavigation } from '@/components/layout/LearningLayout';
import {
  createDefaultMintingConfig,
  type TMintingConfig,
  type TMintSwimmerValues,
} from '@/components/lessons/MintingConfigurator';
import { CodePlaygroundView, DeploymentWorkspaceView, LessonWorkspaceTabs } from '@/components/lessons/lesson-page';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CLOCK_OBJECT_ID } from '@/lib/services/suiService';
import { ApiMoveCompiler } from '@/lib/services/apiMoveCompiler';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

interface TLessonPageClientProps {
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

type TWorkspaceTab = 'code' | 'preview';

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
}: TLessonPageClientProps) {
  const { setActive } = useLessonNavigation();
  const [workspaceTab, setWorkspaceTab] = useState<TWorkspaceTab>('code');
  const [mintingConfig, setMintingConfig] = useState<TMintingConfig>(() => createDefaultMintingConfig());
  const [isDeploying, setIsDeploying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const currentAccount = useCurrentAccount();
  const [packageId, setPackageId] = useState<string | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<StoredDeployment[]>([]);

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
      setMintingConfig(createDefaultMintingConfig());
    }
  }, [lessonSlug, chapterSlug, isDeploymentChapter]);

  const setSelectedPackageId = useCallback((value: string | null) => {
    setPackageId(value);
    if (typeof window === 'undefined') {
      return;
    }

    if (value) {
      window.localStorage.setItem('smr-package-id', value);
    } else {
      window.localStorage.removeItem('smr-package-id');
    }
  }, []);

  const fetchDeploymentHistory = useCallback(
    async (address: string) => {
      try {
        console.log('[LessonPageClient] attempting to fetch deployment history from Supabase', { address });
        const response = await fetch(`/api/deployments?walletAddress=${address}`);
        if (!response.ok) {
          const message = await response.text();
          console.warn('[LessonPageClient] failed to fetch deployment history', message);
          setDeploymentHistory([]);
          return;
        }

        const { packageId: storedPackageId, records } = await response.json();
        const history: StoredDeployment[] = Array.isArray(records) ? records : [];
        setDeploymentHistory(history);

        let nextPackageId: string | null = null;

        if (typeof window !== 'undefined') {
          const cachedPackageId = window.localStorage.getItem('smr-package-id');
          if (cachedPackageId) {
            nextPackageId = cachedPackageId;
          }
        }

        if (!nextPackageId && storedPackageId) {
          nextPackageId = storedPackageId;
        }

        if (!nextPackageId && history.length > 0) {
          nextPackageId = history[0].package_id;
        }

        setSelectedPackageId(nextPackageId ?? null);

        console.log('[LessonPageClient] deployment history synced', {
          count: history.length,
          selected: nextPackageId,
        });
      } catch (error) {
        console.error('[LessonPageClient] error fetching package info from Supabase', error);
        setDeploymentHistory([]);
      }
    },
    [setSelectedPackageId]
  );

  useEffect(() => {
    if (!currentAccount?.address) {
      setDeploymentHistory([]);
      return;
    }

    fetchDeploymentHistory(currentAccount.address);
  }, [currentAccount?.address, fetchDeploymentHistory]);

  const handleConfigChange = (updates: Partial<TMintingConfig>) => {
    setMintingConfig((prev) => ({ ...prev, ...updates }));
  };

  const nextHref = nextLessonSlug && nextChapterSlug ? getLessonRoute(nextLessonSlug, nextChapterSlug) : null;
  const previousHref =
    previousLessonSlug && previousChapterSlug ? getLessonRoute(previousLessonSlug, previousChapterSlug) : null;

  const effectiveCodeSkeletone = isDeploymentChapter ? undefined : codeSkeletone;
  const effectiveReadOnly = isDeploymentChapter ? true : readOnly;

  const tabClassName = (tab: TWorkspaceTab) =>
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

  const fetchPackageIdByDigest = useCallback(async (digest: string | undefined | null) => {
    if (!digest) return null;
    const network = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as 'mainnet' | 'testnet' | 'devnet' | 'localnet';
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
  }, []);

  const handleCompileAndDeploy = async (transaction: any) => {
    if (!currentAccount) {
      Swal.fire({
        icon: 'warning',
        title: 'Connect your wallet',
        text: 'Please connect your wallet first.',
      });
      return;
    }

    setIsDeploying(true);
    try {
      signAndExecute(
        {
          transaction,
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
              Swal.fire({
                icon: 'success',
                title: 'Package deployed',
                html: `<p>🚀 Package deployed successfully!</p><p><code>${deployedPackageId}</code></p>`,
                confirmButtonText: 'Nice!',
              });
            } else {
              console.log('[LessonPageClient] could not determine package id');
              Swal.fire({
                icon: 'info',
                title: 'Transaction succeeded',
                text: 'However, the package ID could not be determined.',
              });
            }
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            Swal.fire({
              icon: 'error',
              title: 'Transaction failed',
              text: (error as Error)?.message ?? String(error),
            });
          },
        }
      );
    } catch (error) {
      console.error('Failed to execute transaction:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to execute transaction',
        text: (error as Error)?.message ?? 'Unknown error occurred.',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePackageDeployed = useCallback(
    (id: string) => {
      setSelectedPackageId(id);
      if (currentAccount?.address) {
        fetchDeploymentHistory(currentAccount.address);
      }
    },
    [currentAccount?.address, fetchDeploymentHistory, setSelectedPackageId]
  );

  const handleSelectStoredPackage = useCallback(
    (selectedPackageId: string | null) => {
      console.log('[LessonPageClient] package selection updated', { selectedPackageId });
      setSelectedPackageId(selectedPackageId);
    },
    [setSelectedPackageId]
  );

  const handleMintSwimmer = async (values: TMintSwimmerValues) => {
    if (!packageId) {
      Swal.fire({
        icon: 'warning',
        title: 'Deployment required',
        text: 'Please deploy the smart contract first.',
      });
      return;
    }

    const sanitizedName = values.name.trim();
    const sanitizedColorInput = values.color.trim();
    const sanitizedColor = sanitizedColorInput || mintingConfig.swimmerColor || '#00cc63';

    if (!sanitizedName) {
      Swal.fire({
        icon: 'warning',
        title: 'Swimmer name required',
        text: 'Please enter a swimmer name first.',
      });
      return;
    }

    const normalizeStat = (stat: number) => {
      const parsed = Number(stat);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
      }
      return Math.floor(parsed);
    };

    const speed = normalizeStat(values.speed);
    const hunger = normalizeStat(values.hunger);
    const boost = normalizeStat(values.boost);
    const distanceTraveled = normalizeStat(values.distanceTraveled);

    setIsMinting(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::mint_swimmer`,
        arguments: [
          tx.pure.string(sanitizedName),
          tx.pure.string(sanitizedColor),
          tx.pure.u64(speed),
          tx.pure.u64(hunger),
          tx.pure.u64(boost),
          tx.pure.u64(distanceTraveled),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Swimmer minted',
              text: 'A new Swimmer NFT has arrived!',
            });
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            Swal.fire({
              icon: 'error',
              title: 'Transaction failed',
              text: (error as Error)?.message ?? String(error),
            });
          },
        }
      );
    } catch (error) {
      console.error('Failed to create swimmer:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to create swimmer',
        text: 'Please try again in a moment.',
      });
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
          <div className="space-y-6">
            <LessonWorkspaceTabs activeTab={workspaceTab} onSelect={setWorkspaceTab} />
            {workspaceTab === 'code' ? (
              <CodePlaygroundView
                markdown={markdown}
                codeTemplate={codeTemplate}
                codeSkeletone={effectiveCodeSkeletone}
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
                deploymentHistory={deploymentHistory}
                selectedDeploymentPackageId={packageId}
                onSelectDeployment={handleSelectStoredPackage}
              />
            ) : (
              <DeploymentWorkspaceView
                config={mintingConfig}
                onConfigChange={handleConfigChange}
                lessonSlug={lessonSlug}
                chapterSlug={chapterSlug}
                onMint={handleMintSwimmer}
                isMinting={isMinting}
                mintDisabled={!currentAccount || !packageId || isDeploying}
                packageId={packageId}
              />
            )}
          </div>
        ) : (
          <CodePlaygroundView
            markdown={markdown}
            codeTemplate={codeTemplate}
            codeSkeletone={effectiveCodeSkeletone}
            readOnly={effectiveReadOnly}
          />
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
