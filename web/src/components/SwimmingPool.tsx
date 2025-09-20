import { useMemo, useState, useRef, useEffect } from 'react';
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer';

interface SwimmingPoolProps {
  swimmers: SwimmerSummary[];
  tunaCans?: TunaCanItem[];
  selectedSwimmerId?: string;
  selectedTunaId?: string;
  onSwimmerSelect?: (id: string) => void;
  onTunaSelect?: (id: string) => void;
  onUpdateProgress?: () => void;
  onMintTuna?: () => void;
  onEatTuna?: () => void;
  actionLoading?: string | null;
  packageId?: string | null;
  currentAccount?: any;
}

export function SwimmingPool({
  swimmers,
  tunaCans = [],
  selectedSwimmerId = '',
  selectedTunaId = '',
  onSwimmerSelect,
  onTunaSelect,
  onUpdateProgress,
  onMintTuna,
  onEatTuna,
  actionLoading,
  packageId,
  currentAccount,
}: SwimmingPoolProps) {
  const [selectedColor, setSelectedColor] = useState({ r: 255, g: 0, b: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [recoloredImages, setRecoloredImages] = useState<Map<string, string>>(new Map());

  const [animationFrame, setAnimationFrame] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const animationSequence = [1, 2, 3, 2];

  const getCurrentFrame = () => {
    return animationSequence[animationFrame % animationSequence.length];
  };

  // // helper for alternative sprite assets based on direction
  // const getSwimmerImagePath = (frame: number, direction: 'right' | 'left' = 'right') => {
  //   if (direction === 'left') {
  //     return `/images/mint_water_flipped(${frame}).png`
  //   }
  //   return `/images/mint_water(${frame}).png`
  // }
  const getSwimmerImagePath = (frame: number) => `/images/mint_water(${frame}).png`;

  // const getSwimmerDirection = (swimmer: SwimmerSummary, index: number): 'right' | 'left' => {
  //   // simple strategy: alternate directions by index
  //   return index % 2 === 0 ? 'right' : 'left'
  // }

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

  const recolorImageByHue = (image: HTMLImageElement, newHue: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = image.width;
    canvas.height = image.height;

    // Define the hue range for the original suit color (example: red hues)
    const sourceHueMin = 340; // adjust as needed for your sprite's original color
    const sourceHueMax = 20; // adjust as needed for your sprite's original color

    // 1. Draw the original sprite onto the canvas
    ctx.drawImage(image, 0, 0);

    // 2. Read the pixel data into memory
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 3. Find pixels whose hue matches the original suit color range

    // 4. Shift those pixel hues to the new value and rebuild the color
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const hsl = rgbToHsl(r, g, b);
      const hue = hsl[0];

      // Handle hue wrap-around (e.g., red at 0/360 degrees)
      const isInRange =
        sourceHueMin > sourceHueMax
          ? hue >= sourceHueMin || hue <= sourceHueMax
          : hue >= sourceHueMin && hue <= sourceHueMax;

      if (isInRange) {
        const newRgb = hslToRgb(newHue, hsl[1], hsl[2]);

        data[i] = newRgb[0]; // Red
        data[i + 1] = newRgb[1]; // Green
        data[i + 2] = newRgb[2]; // Blue
      }
    }

    // 5. Draw the recolored sprite back onto the canvas
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  // Convert RGB values to hue for palette swaps
  const rgbToHue = (r: number, g: number, b: number) => {
    const hsl = rgbToHsl(r, g, b);
    return hsl[0];
  };

  useEffect(() => {
    // Advance the animation frame every 200ms
    animationRef.current = setInterval(() => {
      setAnimationFrame((prev) => prev + 1);
    }, 200);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadAndRecolorAllFrames = async () => {
      const hue = rgbToHue(selectedColor.r, selectedColor.g, selectedColor.b);
      const newImages = new Map(recoloredImages);

      // Update sprite positions smoothly when distances change
      const directions: ('right' | 'left')[] = ['right', 'left'];
      for (const direction of directions) {
        for (const frame of animationSequence) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const recoloredDataUrl = recolorImageByHue(img, hue);
            if (recoloredDataUrl) {
              newImages.set(`swimmer-${direction}-frame-${frame}`, recoloredDataUrl);
              setRecoloredImages(new Map(newImages));
            }
          };
          // img.src = getSwimmerImagePath(frame, direction)
          img.src = getSwimmerImagePath(frame);
        }
      }
    };

    loadAndRecolorAllFrames();
  }, [selectedColor]);

  const maxDistance = useMemo(() => {
    if (swimmers.length === 0) return 0;
    return swimmers.reduce((max, swimmer) => Math.max(max, swimmer.distanceTraveled), 0);
  }, [swimmers]);

  const getPosition = (distance: number) => {
    if (maxDistance === 0) {
      return '10%';
    }

    const normalized = Math.min(distance / Math.max(maxDistance, 1), 1);
    const offset = 10 + normalized * 78;
    return `${offset}%`;
  };

  const selectedSwimmer = swimmers.find((swimmer) => swimmer.id === selectedSwimmerId);
  const selectedTuna = tunaCans.find((tuna) => tuna.id === selectedTunaId);

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp));
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleString();
  };

  if (swimmers.length === 1) {
    return (
      <div className="relative">
        <div
          className="bg-cover bg-center bg-no-repeat p-8 aspect-video relative overflow-hidden mb-6"
          style={{ backgroundImage: 'url(/images/ocean_16-9.png)' }}
        >
          <div className="absolute inset-0">
            <div className="wave-animation"></div>
          </div>

          <div className="absolute inset-0 flex">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 border-l-2 border-blue-400 opacity-30"></div>
            ))}
          </div>

          <div className="relative flex items-center justify-center h-full">
            <div className="text-center bg-white/80 rounded-lg p-6">
              <img
                src={
                  recoloredImages.get(`swimmer-right-frame-${getCurrentFrame()}`) ||
                  `/images/mint_water(${getCurrentFrame()}).png`
                }
                alt="Swimmer"
                className="w-16 h-16 mx-auto mb-4"
              />
              <p className="text-gray-700 font-medium">Coach your first swimmer to see them here</p>
              <p className="text-sm text-gray-500 mt-2">
                Connect your wallet and deploy the Move package to get started
              </p>
            </div>
          </div>
        </div>

        {/* gameplay console container */}
        <div className="bg-white border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gameplay Console</h3>
            <span className="text-xs text-gray-500">Tuna inventory {tunaCans.length}</span>
          </div>

          <div className="text-center text-gray-500 py-4">
            <p>Mint a swimmer first, then jump into the console.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={onMintTuna}
              disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'mintTuna' ? 'Minting...' : 'Mint tuna can'}
            </button>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            Tip: mint a swimmer before using the console controls.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* swimmer track */}
      <div
        className="bg-cover bg-center bg-no-repeat rounded-xl p-8 h-[28rem] relative overflow-hidden mb-6"
        style={{ backgroundImage: 'url(/images/ocean_16-9.png)' }}
      >
        {/* wave animation */}
        <div className="absolute inset-0">
          <div className="wave-animation"></div>
        </div>

        {/* lane markers */}
        <div className="absolute inset-0 flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 border-l-2 border-blue-400 opacity-30"></div>
          ))}
        </div>

        {/* floating items */}
        <div className="absolute top-4 left-4">
          <img src="/images/tuna_can.png" alt="Tuna Can" className="w-8 h-8" />
          {/* <img src="/images/tuna_floating.png" alt="Tuna Floating" className="w-8 h-8 ml-2" /> */}
        </div>

        {/* swimmer avatars */}
        <div className="relative h-full">
          {swimmers.map((swimmer, index) => {
            const currentFrame = getCurrentFrame();
            // const direction = getSwimmerDirection(swimmer, index)
            // const frameImage = recoloredImages.get(`swimmer-${direction}-frame-${currentFrame}`) || getSwimmerImagePath(currentFrame, direction)
            const frameImage = recoloredImages.get(`swimmer-frame-${currentFrame}`);

            return (
              <div
                key={swimmer.id}
                className="absolute flex items-center"
                style={{
                  top: `${index * 60 + 20}px`,
                  left: getPosition(swimmer.distanceTraveled),
                  transition: 'left 1.5s ease-out',
                }}
              >
                <img src={frameImage} alt="Swimmer" className="w-12 h-12" />
                <div className="ml-3 bg-white/90 rounded-lg px-3 py-1 shadow">
                  <div className="font-bold text-sm">{swimmer.name}</div>
                  <div className="text-xs text-gray-600">{swimmer.species}</div>
                  <div className="text-xs text-blue-600">Distance {swimmer.distanceTraveled} m</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* swimmer status panel */}
        <div className="absolute top-4 right-4 bg-white/90 rounded-lg p-3 shadow">
          <h4 className="font-semibold text-sm mb-2">Swimmer stats</h4>
          {swimmers.map((swimmer) => (
            <div key={swimmer.id} className="text-xs mb-1">
              <span className="font-medium">{swimmer.name}</span>
              <div className="flex gap-3 text-gray-600">
                <span>Base speed: {swimmer.baseSpeedPerHour} m/h</span>
                <span>Last update: {formatTimestamp(swimmer.lastUpdateTimestampMs)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* gameplay console container */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gameplay Console</h3>
            <p className="text-xs text-gray-500">
              Manage your swimmers and supplies before triggering on-chain actions.
            </p>
          </div>
          <span className="text-xs text-gray-500">Tuna inventory {tunaCans.length}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Swimmer roster</h4>
              <span className="text-xs text-gray-500">{swimmers.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {swimmers.length ? (
                swimmers.map((swimmer) => {
                  const isSelected = swimmer.id === selectedSwimmerId;
                  return (
                    <button
                      key={swimmer.id}
                      type="button"
                      onClick={() => onSwimmerSelect?.(swimmer.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 shadow-inner'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                        <span>{swimmer.name}</span>
                        <span className="text-xs font-normal text-gray-500">{swimmer.distanceTraveled} m</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{swimmer.species}</div>
                      <div className="mt-1 text-xs text-blue-600">Base speed {swimmer.baseSpeedPerHour} m/h</div>
                      <div className="mt-1 text-[10px] text-gray-400">
                        Last update {formatTimestamp(swimmer.lastUpdateTimestampMs)}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  Mint a swimmer from the lesson flow to populate this roster.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Tuna inventory</h4>
              <span className="text-xs text-gray-500">{tunaCans.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {tunaCans.length ? (
                tunaCans.map((tuna) => {
                  const isSelected = tuna.id === selectedTunaId;
                  return (
                    <button
                      key={tuna.id}
                      type="button"
                      onClick={() => onTunaSelect?.(tuna.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-inner'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                        <span>
                          {tuna.id.slice(0, 6)}...{tuna.id.slice(-4)}
                        </span>
                        <span className="text-xs font-normal text-emerald-600">+{tuna.energy} m</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  Mint a tuna can to feed your swimmers.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Mint & actions</h4>
            <p className="mt-1 text-xs text-gray-500">
              Trigger Move entry functions for swimmers directly from this console.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onUpdateProgress}
                disabled={!packageId || !currentAccount || !selectedSwimmerId || actionLoading === 'update'}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'update' ? 'Updating...' : 'Update progress'}
              </button>
              <button
                onClick={onMintTuna}
                disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'mintTuna' ? 'Minting...' : 'Mint tuna can'}
              </button>
              <button
                onClick={onEatTuna}
                disabled={
                  !packageId || !currentAccount || !selectedSwimmerId || !selectedTunaId || actionLoading === 'eatTuna'
                }
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'eatTuna' ? 'Feeding...' : 'Feed tuna can'}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              These buttons invoke the Move entry functions update_progress, mint_tuna, and eat_tuna.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Swimmer palette</h4>
            <p className="mt-1 text-xs text-gray-500">
              Adjust the suit color and see it applied to the preview sprites.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs w-4">R</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={selectedColor.r}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedColor((prev) => ({ ...prev, r: Number(e.target.value) }))
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-center">{selectedColor.r}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-4">G</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={selectedColor.g}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedColor((prev) => ({ ...prev, g: Number(e.target.value) }))
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-center">{selectedColor.g}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-4">B</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={selectedColor.b}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedColor((prev) => ({ ...prev, b: Number(e.target.value) }))
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-center">{selectedColor.b}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Preview</span>
                <div
                  className="h-6 w-6 rounded border border-gray-300"
                  style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
