import { useMemo } from 'react';
import { LessonDescription } from '@/components/LessonDescription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_VALUES } from '@/src/contracts/moveTemplates';

const START_LOCATIONS = [
  { value: 'harbor_launch', label: 'Harbor Launch' },
  { value: 'coral_cove', label: 'Coral Cove Checkpoint' },
  { value: 'deep_trench', label: 'Deep Trench Basecamp' },
  { value: 'open_current', label: 'Open Current Drift' },
];

export type DeploymentConfig = {
  hatColor: string;
  startingLocation: string;
  startingDistance: number;
  baseSpeed: number;
  sprintBonus: number;
};

const BASE_DEPLOYMENT_CONFIG: DeploymentConfig = {
  hatColor: '#0ea5e9',
  startingLocation: 'harbor_launch',
  startingDistance: 0,
  baseSpeed: DEFAULT_VALUES.baseSpeedPerHour,
  sprintBonus: DEFAULT_VALUES.tunaBonus,
};

export const createDefaultDeploymentConfig = (): DeploymentConfig => ({ ...BASE_DEPLOYMENT_CONFIG });

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getLocationLabel = (value: string) =>
  START_LOCATIONS.find((option) => option.value === value)?.label ?? 'Unknown launchpad';

interface DeploymentConfiguratorProps {
  markdown: string;
  config: DeploymentConfig;
  onConfigChange: (updates: Partial<DeploymentConfig>) => void;
}

export function DeploymentConfigurator({ markdown, config, onConfigChange }: DeploymentConfiguratorProps) {
  const currentLocationLabel = useMemo(() => getLocationLabel(config.startingLocation), [config.startingLocation]);

  const updateConfig = (updates: Partial<DeploymentConfig>) => {
    onConfigChange(updates);
  };

  return (
    <div className="space-y-6">
      <LessonDescription markdown={markdown} />

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-lg">Launch Configuration</CardTitle>
          <p className="text-sm text-gray-500">
            Calibrate your swimmer&apos;s look and launch stats before deploying the Move module.
          </p>
          <p className="text-xs text-gray-400">Current launch pad: {currentLocationLabel}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Hat color</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={config.hatColor}
                onChange={(event) => updateConfig({ hatColor: event.target.value })}
                className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white"
                aria-label="Select hat color"
              />
              <input
                type="text"
                value={config.hatColor}
                onChange={(event) => updateConfig({ hatColor: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="#0ea5e9"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Starting location</label>
            <select
              value={config.startingLocation}
              onChange={(event) => updateConfig({ startingLocation: event.target.value })}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {START_LOCATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Starting distance (m)</label>
              <input
                type="number"
                min={0}
                max={500}
                value={config.startingDistance}
                onChange={(event) =>
                  updateConfig({ startingDistance: Math.max(0, toNumber(event.target.value, config.startingDistance)) })
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Base speed (m/hour)</label>
              <input
                type="range"
                min={40}
                max={200}
                step={5}
                value={config.baseSpeed}
                onChange={(event) => updateConfig({ baseSpeed: toNumber(event.target.value, config.baseSpeed) })}
                className="mt-4 w-full"
              />
              <p className="mt-2 text-xs text-gray-500">Current: {config.baseSpeed} m/hour</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Sprint bonus (tuna boost)</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.sprintBonus}
              onChange={(event) => updateConfig({ sprintBonus: toNumber(event.target.value, config.sprintBonus) })}
              className="mt-4 w-full"
            />
            <p className="mt-2 text-xs text-gray-500">Boost: +{config.sprintBonus} meters</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DeploymentPreviewProps {
  config: DeploymentConfig;
}

export function DeploymentPreview({ config }: DeploymentPreviewProps) {
  const locationLabel = useMemo(() => getLocationLabel(config.startingLocation), [config.startingLocation]);

  return (
    <Card className="border-sky-200">
      <CardHeader>
        <CardTitle className="text-lg">Deployment Preview</CardTitle>
        <p className="text-sm text-gray-500">Confirm the configuration you will carry into the blockchain.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="font-medium text-gray-700">Hat color</span>
          <span className="flex items-center gap-2 text-gray-600">
            {config.hatColor}
            <span className="h-5 w-5 rounded-full border border-gray-200" style={{ backgroundColor: config.hatColor }} />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="font-medium text-gray-700">Launch pad</span>
          <span className="text-gray-600">{locationLabel}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="font-medium text-gray-700">Starting distance</span>
          <span className="text-gray-600">{config.startingDistance} m</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="font-medium text-gray-700">Base speed</span>
          <span className="text-gray-600">{config.baseSpeed} m/hour</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="font-medium text-gray-700">Sprint bonus</span>
          <span className="text-gray-600">+{config.sprintBonus} m</span>
        </div>
      </CardContent>
    </Card>
  );
}
