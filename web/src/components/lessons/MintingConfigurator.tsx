import type { ChangeEvent } from 'react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DEFAULT_VALUES } from '@/src/contracts/moveTemplates';

const START_LOCATIONS = [
  { value: 'harbor_launch', label: 'Harbor Launch' },
  { value: 'coral_cove', label: 'Coral Cove Checkpoint' },
  { value: 'deep_trench', label: 'Deep Trench Basecamp' },
  { value: 'open_current', label: 'Open Current Drift' },
];

export type TMintingConfig = {
  swimmerColor: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  startingLocation: string;
  startingDistance: number;
  baseSpeed: number;
  sprintBonus: number;
};

export type TMintSwimmerValues = {
  name: string;
  color: string;
  speed: number;
  hunger: number;
  boost: number;
  distanceTraveled: number;
};

const BASE_MINTING_CONFIG: TMintingConfig = {
  swimmerColor: '#00cc63',
  startingLocation: 'harbor_launch',
  startingDistance: 0,
  baseSpeed: DEFAULT_VALUES.baseSpeedPerHour,
  sprintBonus: DEFAULT_VALUES.tunaBonus,
  size: 'medium',
};

export const createDefaultMintingConfig = (): TMintingConfig => ({ ...BASE_MINTING_CONFIG });

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getLocationLabel = (value: string) =>
  START_LOCATIONS.find((option) => option.value === value)?.label ?? 'Unknown launchpad';

const rgbToHsl = (r: number, g: number, b: number) => {
  (r /= 255), (g /= 255), (b /= 255);
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h: number,
    s: number,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }
  return [h * 360, s, l];
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r: number, g: number, b: number;
  h /= 360;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const recolorImageByHue = (image: HTMLImageElement, newHue: number, sourceHueMin: number, sourceHueMax: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const hsl = rgbToHsl(r, g, b);
    const hue = hsl[0];

    if (hue >= sourceHueMin && hue <= sourceHueMax) {
      const newRgb = hslToRgb(newHue, hsl[1], hsl[2]);

      data[i] = newRgb[0]; // Red
      data[i + 1] = newRgb[1]; // Green
      data[i + 2] = newRgb[2]; // Blue
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};

const rgbToHue = (r: number, g: number, b: number) => {
  const hsl = rgbToHsl(r, g, b);
  return hsl[0];
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const hexToHue = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return rgbToHue(rgb.r, rgb.g, rgb.b);
};

interface TMintingConfiguratorProps {
  config: TMintingConfig;
  onConfigChange: (updates: Partial<TMintingConfig>) => void;
  lessonSlug?: string;
  chapterSlug?: string;
  onMint?: (values: TMintSwimmerValues) => void | Promise<void>;
  isMinting?: boolean;
  mintDisabled?: boolean;
  packageId?: string | null;
  mintValues: TMintSwimmerValues;
  onMintValuesChange: (updater: (prev: TMintSwimmerValues) => TMintSwimmerValues) => void;
}

export function MintingConfigurator({
  config,

  onConfigChange,

  lessonSlug,

  chapterSlug,

  onMint,

  isMinting,

  mintDisabled,

  packageId,

  mintValues,

  onMintValuesChange,
}: TMintingConfiguratorProps) {
  const isTunaChapter = lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna';

  const updateConfig = (updates: Partial<TMintingConfig>) => {
    onConfigChange(updates);

    const { swimmerColor, baseSpeed, sprintBonus, startingDistance } = updates;

    if (
      swimmerColor === undefined &&
      baseSpeed === undefined &&
      sprintBonus === undefined &&
      startingDistance === undefined
    ) {
      return;
    }

    onMintValuesChange((prev) => {
      const next = { ...prev };

      if (swimmerColor !== undefined) {
        next.color = swimmerColor;
      }

      if (baseSpeed !== undefined) {
        next.speed = baseSpeed;
      }

      if (sprintBonus !== undefined) {
        next.boost = sprintBonus;
      }

      if (startingDistance !== undefined) {
        next.distanceTraveled = startingDistance;
      }

      return next;
    });
  };

  const handleMintTextFieldChange = (field: 'name' | 'color') => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    if (field === 'color') {
      updateConfig({ swimmerColor: value });

      return;
    }

    onMintValuesChange((prev) => (prev.name === value ? prev : { ...prev, name: value }));
  };

  const handleMintNumberFieldChange =
    (field: 'speed' | 'hunger' | 'boost' | 'distanceTraveled') => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      const numericValue = Math.max(0, toNumber(value, mintValues[field] as number));

      if (field === 'hunger') {
        onMintValuesChange((prev) => (prev.hunger === numericValue ? prev : { ...prev, hunger: numericValue }));

        return;
      }

      if (field === 'speed') {
        updateConfig({ baseSpeed: numericValue });
      } else if (field === 'boost') {
        updateConfig({ sprintBonus: numericValue });
      } else if (field === 'distanceTraveled') {
        updateConfig({ startingDistance: numericValue });
      }
    };

  const packageReady = Boolean(packageId);

  const mintButtonDisabled =
    !packageReady || mintDisabled || isMinting || (!isTunaChapter && mintValues.name.trim().length === 0);

  const handleMintAction = () => {
    if (!onMint) return;

    if (isTunaChapter) {
      onMint({
        name: 'Tuna Can',

        color: config.color ?? '#3194be',

        speed: Math.max(0, Math.floor(config.baseSpeed)),

        hunger: 0,

        boost: Math.max(0, Math.floor(config.sprintBonus)),

        distanceTraveled: Math.max(0, Math.floor(config.startingDistance)),
      });

      return;
    }

    const payload: TMintSwimmerValues = {
      name: mintValues.name.trim(),

      color: (mintValues.color || config.swimmerColor || '#00cc63').trim(),

      speed: Math.max(0, Math.floor(mintValues.speed)),

      hunger: Math.max(0, Math.floor(mintValues.hunger)),

      boost: Math.max(0, Math.floor(mintValues.boost)),

      distanceTraveled: Math.max(0, Math.floor(mintValues.distanceTraveled)),
    };

    if (!payload.name) {
      alert('Please enter a swimmer name first!');

      return;
    }

    onMint(payload);
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200">
        <CardContent className="space-y-5">
          {onMint && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div>
                <CardTitle className="text-lg"> {isTunaChapter ? 'Mint Tuna' : 'Mint Swimmer'}</CardTitle>
                <p className="text-sm text-gray-500">
                  {isTunaChapter
                    ? 'Mint a tuna can to boost your swimmer during races.'
                    : 'Mint a swimmer with your custom looks and launch stats.'}
                </p>
                {!packageReady ? (
                  <p className="text-xs text-amber-600">Deploy your Move package before minting.</p>
                ) : (
                  packageId && <p className="text-xs font-mono text-gray-400 break-all">Package ID: {packageId}</p>
                )}
              </div>
              {isTunaChapter ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Tuna can color
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="color"
                          value={config.color || '#3194be'}
                          onChange={(event) => updateConfig({ color: event.target.value })}
                          className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white"
                          aria-label="Select tuna can color"
                        />
                        <input
                          type="text"
                          value={config.color || '#3194be'}
                          onChange={(event) => updateConfig({ color: event.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="#3194be"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Tuna size</label>
                      <select
                        value={config.size || 'medium'}
                        onChange={(event) => updateConfig({ size: event.target.value as 'small' | 'medium' | 'large' })}
                        className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      >
                        <option value="small">Small (+5 hunger)</option>
                        <option value="medium">Medium (+10 hunger)</option>
                        <option value="large">Large (+15 hunger)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Sprint bonus (tuna boost)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={config.sprintBonus}
                        onChange={(event) =>
                          updateConfig({ sprintBonus: toNumber(event.target.value, config.sprintBonus) })
                        }
                        className="mt-4 w-full"
                      />
                      <p className="mt-2 text-xs text-gray-500">Boost: +{config.sprintBonus} meters</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleMintAction} disabled={mintButtonDisabled} size="lg" className="flex-1">
                      {isMinting ? 'Minting...' : 'Mint Tuna'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Swimmer name
                      </label>
                      <input
                        type="text"
                        value={mintValues.name}
                        onChange={handleMintTextFieldChange('name')}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="My Swimmer"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Swimmer color (hex)
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="color"
                          value={mintValues.color}
                          onChange={handleMintTextFieldChange('color')}
                          className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white"
                          aria-label="Select swimmer color"
                        />
                        <input
                          type="text"
                          value={mintValues.color}
                          onChange={handleMintTextFieldChange('color')}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="#00cc63"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Base speed (m/hour)
                      </label>
                      <input
                        type="range"
                        min={40}
                        max={200}
                        step={5}
                        value={mintValues.speed}
                        onChange={handleMintNumberFieldChange('speed')}
                        className="mt-4 w-full"
                      />
                      <p className="mt-2 text-xs text-gray-500">Current: {config.baseSpeed} m/hour</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Hunger</label>
                      <input
                        type="number"
                        min={0}
                        value={mintValues.hunger}
                        onChange={handleMintNumberFieldChange('hunger')}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Boost</label>
                      <input
                        type="number"
                        min={0}
                        value={mintValues.boost}
                        onChange={handleMintNumberFieldChange('boost')}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Starting distance (m)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={mintValues.distanceTraveled}
                        onChange={handleMintNumberFieldChange('distanceTraveled')}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleMintAction} disabled={mintButtonDisabled} size="lg" className="flex-1">
                      {isMinting ? 'Minting...' : 'Mint Swimmer'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TMintingPreviewProps {
  config: TMintingConfig;

  mintValues: TMintSwimmerValues;

  lessonSlug?: string;

  chapterSlug?: string;

  packageId?: string | null;
}

export function MintingPreview({ config, mintValues, lessonSlug, chapterSlug, packageId }: TMintingPreviewProps) {
  const locationLabel = useMemo(() => getLocationLabel(config.startingLocation), [config.startingLocation]);

  const normalizeHexColor = (value: string | undefined): string | null => {
    if (!value) {
      return null;
    }

    const normalized = value.startsWith('#') ? value : `#${value}`;

    return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : null;
  };

  const swimmerColor = normalizeHexColor(mintValues.color) ?? normalizeHexColor(config.swimmerColor) ?? '#00cc63';

  const tunaColor = normalizeHexColor(config.color);

  const [swimFrame, setSwimFrame] = useState(0);

  const [recoloredImages, setRecoloredImages] = useState<Map<string, string>>(new Map());

  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    animationRef.current = setInterval(() => {
      setSwimFrame((prev) => prev + 1);
    }, 200);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hue = hexToHue(swimmerColor);

    const tunaHue = tunaColor ? hexToHue(tunaColor) : undefined;

    const updateImage = (key: string, src: string, sourceHueRange: [number, number], targetHue: number) => {
      const img = new Image();

      img.onload = () => {
        if (cancelled) return;

        const recolored = recolorImageByHue(img, targetHue, sourceHueRange[0], sourceHueRange[1]);

        if (recolored) {
          setRecoloredImages((prev) => {
            const next = new Map(prev);

            next.set(key, recolored);

            return next;
          });
        }

        img.src = src;
      };
    };

    [1, 2, 3].forEach((frame) => {
      updateImage(`swimmer-frame-${frame}`, `/images/mint_water(${frame}).png`, [148, 151], hue);
    });

    if (tunaHue !== undefined) {
      updateImage('tuna-can', '/images/tuna_can.png', [196, 199], tunaHue);
    } else {
      setRecoloredImages((prev) => {
        if (!prev.has('tuna-can')) {
          return prev;
        }

        const next = new Map(prev);

        next.delete('tuna-can');

        return next;
      });
    }

    return () => {
      cancelled = true;
    };
  }, [swimmerColor, tunaColor]);

  const isTunaChapter = lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna';

  const frameSequence = [1, 2, 3, 2];

  const frameIndex = frameSequence[swimFrame % frameSequence.length];

  const currentSwimImage =
    recoloredImages.get(`swimmer-frame-${frameIndex}`) || `/images/mint_water(${frameIndex}).png`;

  const displayName = mintValues.name.trim() || 'Unnamed Swimmer';

  const displaySpeed = Math.max(0, Math.floor(mintValues.speed));

  const displayBoost = Math.max(0, Math.floor(mintValues.boost));

  const displayDistance = Math.max(0, Math.floor(mintValues.distanceTraveled));

  const displayHunger = Math.max(0, Math.floor(mintValues.hunger));

  return (
    <Card className="border-sky-200">
      <CardHeader>
        <CardTitle className="text-lg">Minting Preview</CardTitle>

        <p className="text-sm text-gray-500">Confirm the configuration you will carry into the blockchain.</p>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-center">
          {!isTunaChapter ? (
            <div className="relative h-[320px] w-[320px] sm:h-[360px] sm:w-[360px]">
              <img src={currentSwimImage} alt="Swimmer" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="relative w-[550px] h-[550px]">
              <img
                src={recoloredImages.get('tuna-can') || '/images/tuna_can.png'}
                alt="Tuna Can"
                className="w-[550px] h-[550px] object-contain"
              />
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 text-gray-600">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Swimmer</p>
            <p className="font-medium text-gray-900">{displayName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Swimmer Color</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: swimmerColor }} />
              <span className="font-mono text-sm text-gray-900">{swimmerColor}</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Base Speed</p>
            <p className="font-medium text-gray-900">{displaySpeed} m/hour</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Boost</p>
            <p className="font-medium text-gray-900">+{displayBoost} m</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Starting Distance</p>
            <p className="font-medium text-gray-900">{displayDistance} m</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Hunger</p>
            <p className="font-medium text-gray-900">{displayHunger}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Package ID</p>
            {packageId ? (
              <p className="font-mono text-sm text-gray-900 break-all">{packageId}</p>
            ) : (
              <p className="text-sm text-gray-500">Not deployed yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
