import { useMemo, useState, useEffect, useRef } from 'react';
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
  swimmerColor: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  startingLocation: string;
  startingDistance: number;
  baseSpeed: number;
  sprintBonus: number;
};

const BASE_DEPLOYMENT_CONFIG: DeploymentConfig = {
  swimmerColor: '#ffffff',
  startingLocation: 'harbor_launch',
  startingDistance: 0,
  baseSpeed: DEFAULT_VALUES.baseSpeedPerHour,
  sprintBonus: DEFAULT_VALUES.tunaBonus,
  size: 'medium',
};

export const createDefaultDeploymentConfig = (): DeploymentConfig => ({ ...BASE_DEPLOYMENT_CONFIG });

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getLocationLabel = (value: string) =>
  START_LOCATIONS.find((option) => option.value === value)?.label ?? 'Unknown launchpad';

// 이미지 색상 변경 함수들
const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number, s: number, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

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
}

const recolorImageByHue = (image: HTMLImageElement, newHue: number, sourceHueMin: number, sourceHueMax: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  
  canvas.width = image.width;
  canvas.height = image.height;

  // 1. 캔버스에 원본 이미지 그리기
  ctx.drawImage(image, 0, 0);

  // 2. 픽셀 데이터 가져오기
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 3. 사용자가 지정한 원본 색상 Hue 범위 (파란색/하늘색 범위)
  // const sourceHueMin = 180; // 하늘색
  // const sourceHueMax = 220; // 파란색

  // 4. 모든 픽셀을 순회하며 조건 확인 및 변경
  for (let i = 0; i < data.length; i += 4) {
    // 투명 픽셀은 건너뛰기
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const hsl = rgbToHsl(r, g, b);
    const hue = hsl[0];

    // 현재 픽셀의 Hue가 지정한 범위(180~220) 안에 있는지 확인
    if (hue >= sourceHueMin && hue <= sourceHueMax) {
      // 새로운 Hue와 원본의 채도(S), 명도(L)를 사용해 새 RGB 값을 계산
      const newRgb = hslToRgb(newHue, hsl[1], hsl[2]);
      
      // 픽셀 데이터 교체
      data[i] = newRgb[0];     // Red
      data[i + 1] = newRgb[1]; // Green
      data[i + 2] = newRgb[2]; // Blue
    }
  }

  // 5. 수정된 픽셀 데이터를 캔버스에 다시 그리기
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// RGB 색상을 Hue로 변환하는 함수
const rgbToHue = (r: number, g: number, b: number) => {
  const hsl = rgbToHsl(r, g, b);
  return hsl[0];
};

// HEX 색상을 RGB로 변환하는 함수
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// HEX 색상을 Hue로 변환하는 함수
const hexToHue = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return rgbToHue(rgb.r, rgb.g, rgb.b);
};

interface DeploymentConfiguratorProps {
  markdown: string;
  config: DeploymentConfig;
  onConfigChange: (updates: Partial<DeploymentConfig>) => void;
  lessonSlug?: string;
  chapterSlug?: string;
}

export function DeploymentConfigurator({ markdown, config, onConfigChange, lessonSlug, chapterSlug }: DeploymentConfiguratorProps) {
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
          {!(lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna') && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Swimmer color</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={config.swimmerColor}
                  onChange={(event) => updateConfig({ swimmerColor: event.target.value })}
                  className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white"
                  aria-label="Select swimmer color"
                />
                <input
                  type="text"
                  value={config.swimmerColor}
                  onChange={(event) => updateConfig({ swimmerColor: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          )}

          {lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Tuna can color</label>
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
          )}

          {!(lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna') && (
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
          )}

          {!(lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna') && (
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
          )}

          {lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Tuna size</label>
              <select
                value={config.size || 'medium'}
                onChange={(event) => updateConfig({ c: event.target.value as 'small' | 'medium' | 'large' })}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              >
                <option value="small">Small (+5 hunger)</option>
                <option value="medium">Medium (+10 hunger)</option>
                <option value="large">Large (+15 hunger)</option>
              </select>
            </div>
          )}

          {!(lessonSlug === 'swimmer-foundations' && chapterSlug === 'deploy-swimmer') && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DeploymentPreviewProps {
  config: DeploymentConfig;
  lessonSlug?: string;
  chapterSlug?: string;
}

export function DeploymentPreview({ config, lessonSlug, chapterSlug }: DeploymentPreviewProps) {
  const locationLabel = useMemo(() => getLocationLabel(config.startingLocation), [config.startingLocation]);

  const [swimFrame, setSwimFrame] = useState(0);
  const swimImages = ['mint_water(1).png', 'mint_water(2).png', 'mint_water(3).png', 'mint_water(2).png'];
  const [recoloredImages, setRecoloredImages] = useState<Map<string, string>>(new Map());
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 200ms 간격으로 애니메이션 프레임 변경
    animationRef.current = setInterval(() => {
      setSwimFrame(prev => prev + 1)
    }, 200)

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [])

  // 색상 변경 시 모든 애니메이션 프레임 이미지 재생성
  useEffect(() => {
    const loadAndRecolorAllFrames = async () => {
      const hue = hexToHue(config.swimmerColor)
      const tunaHue = config.color ? hexToHue(config.color) : 0
      const newImages = new Map(recoloredImages)
      
      // 각 프레임에 대해 색상 재적용
      for (const frame of [1, 2, 3]) {
        const img = new Image()
        img.onload = () => {
          const recoloredDataUrl = recolorImageByHue(img, hue, 0, 0)
          if (recoloredDataUrl) {
            newImages.set(`swimmer-frame-${frame}`, recoloredDataUrl)
            setRecoloredImages(new Map(newImages))
          }
        }
        img.src = `/images/mint_water(${frame}).png`
      }

      // tuna can 색상 변경
      if (config.color) {
        const tunaImg = new Image()
        tunaImg.onload = () => {
          const recoloredTuna = recolorImageByHue(tunaImg, tunaHue, 196, 199)
          if (recoloredTuna) {
            newImages.set('tuna-can', recoloredTuna)
            setRecoloredImages(new Map(newImages))
          }
        }
        tunaImg.src = '/images/tuna_can.png'
      }
    }

    loadAndRecolorAllFrames()
  }, [config.swimmerColor, config.color])

  const currentSwimImage = recoloredImages.get(`swimmer-frame-${[1, 2, 3, 2][swimFrame % 4]}`) || `/images/mint_water(${[1, 2, 3, 2][swimFrame % 4]}).png`

  const isTunaChapter = lessonSlug === 'ptb-and-items' && chapterSlug === 'deploy-tuna';

  return (
    <Card className="border-sky-200">
      <CardHeader>
        <CardTitle className="text-lg">Deployment Preview</CardTitle>
        <p className="text-sm text-gray-500">Confirm the configuration you will carry into the blockchain.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-center">
          {!isTunaChapter && (
            <div className="relative w-[400px] h-[400px]">
              <img
                src={currentSwimImage}
                alt="Swimmer"
                className="w-[400px] h-[400px] object-contain"
              />
            </div>
          )}
          {isTunaChapter && (
            <div className="relative w-[550px] h-[550px]">
              <img
                src={recoloredImages.get('tuna-can') || '/images/tuna_can.png'}
                alt="Tuna Can"
                className="w-[550px] h-[550px] object-contain"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
