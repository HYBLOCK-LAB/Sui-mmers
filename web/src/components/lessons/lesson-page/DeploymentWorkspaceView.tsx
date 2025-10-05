'use client';

import { useEffect, useState } from 'react';
import { DeploymentConfigurator, DeploymentPreview, type TMintingConfig, type TMintSwimmerValues } from '@/components/lessons/DeploymentConfigurator';

interface TDeploymentWorkspaceViewProps {
  config: TMintingConfig;
  onConfigChange: (updates: Partial<TMintingConfig>) => void;
  lessonSlug: string;
  chapterSlug: string;
  onMint: (values: TMintSwimmerValues) => void | Promise<void>;
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
}: TDeploymentWorkspaceViewProps) {
  const createMintValuesFromConfig = () => ({
    name: 'My Swimmer',
    color: config.swimmerColor,
    speed: config.baseSpeed,
    hunger: 0,
    boost: config.sprintBonus,
    distanceTraveled: config.startingDistance,
  });

  const [mintValues, setMintValues] = useState<TMintSwimmerValues>(createMintValuesFromConfig);

  useEffect(() => {
    setMintValues(createMintValuesFromConfig());
  }, [lessonSlug, chapterSlug]);

  useEffect(() => {
    setMintValues((prev) => ({
      ...prev,
      color: config.swimmerColor,
      speed: config.baseSpeed,
      boost: config.sprintBonus,
      distanceTraveled: config.startingDistance,
    }));
  }, [config.swimmerColor, config.baseSpeed, config.sprintBonus, config.startingDistance]);

  const handleMintValuesChange = (updater: (prev: TMintSwimmerValues) => TMintSwimmerValues) => {
    setMintValues((prev) => {
      const next = updater(prev);
      return next === prev ? { ...prev } : next;
    });
  };

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
        mintValues={mintValues}
        onMintValuesChange={handleMintValuesChange}
      />
      <DeploymentPreview
        config={config}
        mintValues={mintValues}
        lessonSlug={lessonSlug}
        chapterSlug={chapterSlug}
        packageId={packageId}
      />
    </div>
  );
}
