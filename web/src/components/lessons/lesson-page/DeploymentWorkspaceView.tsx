'use client';

import { DeploymentConfigurator, DeploymentPreview } from '@/components/lessons/DeploymentConfigurator';
import type { DeploymentConfig } from '@/components/lessons/DeploymentConfigurator';

interface DeploymentWorkspaceViewProps {
  config: DeploymentConfig;
  onConfigChange: (updates: Partial<DeploymentConfig>) => void;
  lessonSlug: string;
  chapterSlug: string;
  onMint: (name: string, species: string) => void | Promise<void>;
  isMinting: boolean;
  mintDisabled: boolean;
  packageId: string | null;
}

export function DeploymentWorkspaceView({
  config,
  onConfigChange,
  lessonSlug,
  chapterSlug,
  onMint,
  isMinting,
  mintDisabled,
  packageId,
}: DeploymentWorkspaceViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
      <DeploymentConfigurator
        config={config}
        onConfigChange={onConfigChange}
        lessonSlug={lessonSlug}
        chapterSlug={chapterSlug}
        onMint={onMint}
        isMinting={isMinting}
        mintDisabled={mintDisabled}
        packageId={packageId}
      />
      <DeploymentPreview config={config} lessonSlug={lessonSlug} chapterSlug={chapterSlug} />
    </div>
  );
}
