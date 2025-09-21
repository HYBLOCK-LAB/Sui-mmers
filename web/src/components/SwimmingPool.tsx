import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer';
import { Transaction } from '@mysten/sui/transactions';

interface SwimmingPoolProps {
  swimmers: SwimmerSummary[];
  tunaCans?: TunaCanItem[];
  selectedSwimmerId?: string;
  selectedTunaId?: string;
  onSwimmerSelect?: (id: string) => void;
  onTunaSelect?: (id: string) => void;
  onUpdateProgress?: () => void;
  onMintTuna?: (packageId: string) => void;
  onMintSwimmer?: (packageId: string) => void;
  onEatTuna?: () => void;
  actionLoading?: string | null;
  packageId?: string | null;
  currentAccount?: any;
}

type PackageMintedSwimmer = {
  id: string;
  name: string;
  owner: string | null;
  distance: number;
  baseSpeed: number;
  trait: string | null;
  lastUpdated: number;
};

type PackageMintedTuna = {
  id: string;
  owner: string | null;
  boost: number;
  size: number;
  color: string | null;
};

export function SwimmingPool({
  swimmers,
  tunaCans = [],
  selectedSwimmerId = '',
  selectedTunaId = '',
  onSwimmerSelect,
  onTunaSelect,
  onUpdateProgress,
  onMintTuna,
  onMintSwimmer,
  onEatTuna,
  actionLoading,
  packageId: providedPackageId,
  currentAccount,
}: SwimmingPoolProps) {
  const FALLBACK_PACKAGE_ID = '0xba7746d022c635f503a93799e638c0521f903e049db9157882b454307fd0a792';
  const packageId = providedPackageId ?? FALLBACK_PACKAGE_ID;
  const [selectedColor, setSelectedColor] = useState({ r: 255, g: 0, b: 0 });
  const [recoloredImages, setRecoloredImages] = useState<Map<string, string>>(new Map());
  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl('testnet') }), []);
  const [packageSwimmers, setPackageSwimmers] = useState<PackageMintedSwimmer[]>([]);
  const [packageTunas, setPackageTunas] = useState<PackageMintedTuna[]>([]);
  const [isLoadingPackageAssets, setIsLoadingPackageAssets] = useState(false);
  const [packageAssetsError, setPackageAssetsError] = useState<string | null>(null);
  const [packageRefreshToken, setPackageRefreshToken] = useState(0);
  const [packageAction, setPackageAction] = useState<'mint-swimmer' | 'mint-tuna' | null>(null);
  const PACKAGE_LIST_LIMIT = 10;
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [animationFrame, setAnimationFrame] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const animationSequence = [1, 2, 3, 2];

  const getCurrentFrame = () => {
    return animationSequence[animationFrame % animationSequence.length];
  };

  // const getSwimmerImagePath = (frame: number, direction: 'right' | 'left' = 'right') => {
  //   if (direction === 'left') {
  //     return `/images/mint_water_flipped(${frame}).png`
  //   }
  //   return `/images/mint_water(${frame}).png`
  // }
  const getSwimmerImagePath = (frame: number) => `/images/mint_water(${frame}).png`;

  // const getSwimmerDirection = (swimmer: SwimmerSummary, index: number): 'right' | 'left' => {
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

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const sourceHueMin = 180; // Hue lower bound for the original swimmer cap colour
    const sourceHueMax = 220; // Hue upper bound for the original swimmer cap colour

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

  useEffect(() => {
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
    if (!timestamp || Number.isNaN(timestamp)) return '-';
    const date = new Date(Number(timestamp));
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
      2,
      '0'
    )} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const resolveOwnerAddress = useCallback((owner: any): string | null => {
    if (!owner) return null;
    if ('AddressOwner' in owner) return owner.AddressOwner;
    if ('ObjectOwner' in owner) return owner.ObjectOwner;
    if ('Shared' in owner) return 'Shared';
    if ('Immutable' in owner) return 'Immutable';
    return null;
  }, []);

  const formatOwnerLabel = (address: string | null) => {
    if (!address) return 'Unknown';
    if (address === 'Shared' || address === 'Immutable') {
      return address;
    }
    return address.length <= 10 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      if (!packageId) {
        if (!cancelled) {
          setPackageSwimmers([]);
          setPackageTunas([]);
          setIsLoadingPackageAssets(false);
        }
        return;
      }

      setIsLoadingPackageAssets(true);
      setPackageAssetsError(null);

      try {
        const collect = async (moduleName: string, functionName: string, expectedTypeSuffix: string) => {
          const collectedIds = new Set<string>();
          let cursor: string | null = null;
          const maxPages = 5;

          for (let page = 0; page < maxPages; page += 1) {
            const response = await suiClient.queryTransactionBlocks({
              filter: { MoveFunction: { package: packageId, module: moduleName, function: functionName } },
              cursor: cursor ?? undefined,
              limit: 50,
              order: 'descending',
              options: { showEffects: true },
            });

            response.data?.forEach((tx: any) => {
              tx.effects?.created?.forEach((created: any) => {
                const id = created.reference?.objectId;
                if (id) {
                  collectedIds.add(id);
                }
              });
            });

            if (collectedIds.size >= 200 || !response.hasNextPage || !response.nextCursor) {
              break;
            }
            cursor = response.nextCursor;
          }

          if (collectedIds.size === 0) {
            return [] as any[];
          }

          const ids = Array.from(collectedIds);
          const responses: any[] = [];
          for (let i = 0; i < ids.length; i += 50) {
            const chunk = ids.slice(i, i + 50);
            const chunkResult = await suiClient.multiGetObjects({
              ids: chunk,
              options: { showContent: true, showOwner: true, showType: true },
            });
            responses.push(...chunkResult);
          }

          return responses.filter((obj) => obj?.data?.type?.endsWith(`::${expectedTypeSuffix}`));
        };

        const [swimmerResponses, tunaResponses] = await Promise.all([
          collect('swimmer', 'mint_swimmer', 'Swimmer'),
          collect('swimmer', 'mint_tuna', 'TunaCan'),
        ]);

        if (cancelled) {
          return;
        }

        const swimmersFromPackage = swimmerResponses
          .map((obj: any) => {
            if (!obj || obj.error || !obj.data || obj.data.content?.dataType !== 'moveObject') {
              return null;
            }
            const fields: any = obj.data.content.fields ?? {};
            return {
              id: obj.data.objectId,
              name: typeof fields.name === 'string' ? fields.name : 'Unnamed Swimmer',
              owner: resolveOwnerAddress(obj.data.owner),
              distance: Number(fields.distance_traveled ?? fields.distance ?? 0),
              baseSpeed: Number(fields.base_speed_per_hour ?? fields.base_speed ?? fields.speed ?? 0),
              trait:
                typeof fields.species === 'string'
                  ? fields.species
                  : typeof fields.color === 'string'
                  ? fields.color
                  : null,
              lastUpdated: Number(fields.last_update_timestamp_ms ?? fields.last_update_timestamp ?? 0),
            } as PackageMintedSwimmer;
          })
          .filter(Boolean) as PackageMintedSwimmer[];

        swimmersFromPackage.sort((a, b) => b.lastUpdated - a.lastUpdated);

        const tunaFromPackage = tunaResponses
          .map((obj: any) => {
            if (!obj || obj.error || !obj.data || obj.data.content?.dataType !== 'moveObject') {
              return null;
            }
            const fields: any = obj.data.content.fields ?? {};
            return {
              id: obj.data.objectId,
              owner: resolveOwnerAddress(obj.data.owner),
              boost: Number(fields.boost ?? fields.energy ?? 0),
              size: Number(fields.size ?? 0),
              color: typeof fields.color === 'string' ? fields.color : null,
            } as PackageMintedTuna;
          })
          .filter(Boolean) as PackageMintedTuna[];

        if (!cancelled) {
          setPackageSwimmers(swimmersFromPackage);
          setPackageTunas(tunaFromPackage);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch package assets:', error);
          setPackageAssetsError(error instanceof Error ? error.message : 'Failed to load package mint data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPackageAssets(false);
        }
      }
    };

    loadAssets();
    const interval = setInterval(loadAssets, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [packageId, resolveOwnerAddress, suiClient, packageRefreshToken]);

  const isActionDisabled = !packageId || !currentAccount;
  const packageSwimmerItems = packageSwimmers.slice(0, PACKAGE_LIST_LIMIT);
  const packageTunaItems = packageTunas.slice(0, PACKAGE_LIST_LIMIT);
  const packageLabel = `${packageId.slice(0, 10)}...${packageId.slice(-6)}`;

  const handlePackageMintSwimmer = useCallback(() => {
    if (!currentAccount) {
      alert('Connect your wallet to mint a swimmer.');
      return;
    }

    if (!packageId) {
      alert('Package ID is not available.');
      return;
    }

    const name = `Demo Swimmer ${Math.floor(Math.random() * 1000)}`;
    const species = 'Open Water Orca';

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::mint_swimmer`,
        arguments: [tx.pure.string(name), tx.pure.string(species)],
      });

      setPackageAction('mint-swimmer');
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            setPackageAction(null);
            setPackageRefreshToken((token) => token + 1);
          },
          onError: (error) => {
            console.error('Mint swimmer failed:', error);
            alert('Failed to mint swimmer: ' + error.message);
            setPackageAction(null);
          },
        }
      );
    } catch (error) {
      console.error('Mint swimmer failed:', error);
      alert('Failed to mint swimmer: ' + (error as Error).message);
      setPackageAction(null);
    }
  }, [currentAccount, packageId, signAndExecuteTransaction]);

  const handlePackageMintTuna = useCallback(() => {
    if (!currentAccount) {
      alert('Connect your wallet to mint a tuna can.');
      return;
    }

    if (!packageId) {
      alert('Package ID is not available.');
      return;
    }

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::swimmer::mint_tuna`,
        arguments: [],
      });

      setPackageAction('mint-tuna');
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => {
            setPackageAction(null);
            setPackageRefreshToken((token) => token + 1);
          },
          onError: (error) => {
            console.error('Mint tuna failed:', error);
            alert('Failed to mint tuna: ' + error.message);
            setPackageAction(null);
          },
        }
      );
    } catch (error) {
      console.error('Mint tuna failed:', error);
      alert('Failed to mint tuna: ' + (error as Error).message);
      setPackageAction(null);
    }
  }, [currentAccount, packageId, signAndExecuteTransaction]);

  const renderEmptyState = () => (
    <div className="relative">
      <div
        className="bg-cover bg-center bg-no-repeat rounded-xl p-8 aspect-video relative overflow-hidden mb-6"
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
            <p className="text-gray-700 font-medium">Mint a swimmer to dive into the pool.</p>
            <p className="text-sm text-gray-500 mt-2">
              You also need at least one tuna can to unlock every control in the console.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gameplay Console</h3>
          <span className="text-xs text-gray-500">Tuna in inventory: {tunaCans.length}</span>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>Deploy the contract, mint a swimmer, then mint a tuna can to feed them.</p>
          <p className="text-xs text-gray-500">Tip: run update_progress - mint_tuna - eat_tuna to see the full flow.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onMintSwimmer?.(packageId)}
            disabled={isActionDisabled || actionLoading === 'mintSwimmer'}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'mintSwimmer' ? 'Minting swimmer...' : 'Mint Swimmer'}
          </button>
          <button
            onClick={() => onMintTuna?.(packageId)}
            disabled={isActionDisabled || actionLoading === 'mintTuna'}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'mintTuna' ? 'Minting tuna...' : 'Mint Tuna'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveState = () => (
    <div className="relative">
      <div
        className="bg-cover bg-center bg-no-repeat rounded-xl p-8 h-[28rem] relative overflow-hidden mb-6"
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

        <div className="absolute top-4 left-4">
          <img src="/images/tuna_can.png" alt="Tuna Can" className="w-8 h-8" />
        </div>

        <div className="relative h-full">
          {swimmers.map((swimmer, index) => {
            const currentFrame = getCurrentFrame();
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
                <img src={frameImage ?? getSwimmerImagePath(currentFrame)} alt="Swimmer" className="w-12 h-12" />
                <div className="ml-3 bg-white/70 rounded-lg px-3 py-1 shadow">
                  <div className="font-bold text-sm text-gray-900">{swimmer.name}</div>
                  <div className="text-xs text-gray-600">{swimmer.species}</div>
                  <div className="text-xs text-blue-600">Distance {swimmer.distanceTraveled.toLocaleString()} m</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute top-4 right-4 bg-white/70 rounded-lg p-3 shadow">
          <h4 className="font-semibold text-sm mb-2">Swimmer Stats</h4>
          {swimmers.map((swimmer) => (
            <div key={swimmer.id} className="text-xs mb-1 text-gray-700">
              <span className="font-medium">{swimmer.name}</span>
              <div className="flex flex-wrap gap-3 text-gray-600">
                <span>Base speed: {swimmer.baseSpeedPerHour} m/h</span>
                <span>Last update: {formatTimestamp(swimmer.lastUpdateTimestampMs)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gameplay Console</h3>
          <span className="text-xs text-gray-500">Tuna in inventory: {tunaCans.length}</span>
          <span className="text-xs text-gray-500">Swimmer in inventory: {swimmers.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select swimmer</label>
            <select
              value={selectedSwimmerId}
              onChange={(event) => onSwimmerSelect?.(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={swimmers.length === 0}
            >
              {swimmers.length === 0 ? (
                <option>Mint a swimmer first</option>
              ) : (
                swimmers.map((swimmer) => (
                  <option key={swimmer.id} value={swimmer.id}>
                    {swimmer.name} - {swimmer.distanceTraveled.toLocaleString()} m
                  </option>
                ))
              )}
            </select>
            {selectedSwimmer && (
              <p className="mt-1 text-xs text-gray-500">Base speed {selectedSwimmer.baseSpeedPerHour} m/h</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select tuna can</label>
            <select
              value={selectedTunaId}
              onChange={(event) => onTunaSelect?.(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={tunaCans.length === 0}
            >
              {tunaCans.length === 0 ? (
                <option>Mint a tuna can to get started</option>
              ) : (
                tunaCans.map((tuna) => (
                  <option key={tuna.id} value={tuna.id}>
                    {tuna.id.slice(0, 6)}...{tuna.id.slice(-4)} - +{tuna.energy} m
                  </option>
                ))
              )}
            </select>
            {selectedTuna && <p className="mt-1 text-xs text-gray-500">Boost distance +{selectedTuna.energy} m</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cap colour (RGB)</label>
            <div className="space-y-2">
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
                <span className="text-xs">Preview:</span>
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={onUpdateProgress}
            disabled={isActionDisabled || !selectedSwimmerId || actionLoading === 'update'}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'update' ? 'Updating...' : 'Update Progress'}
          </button>
          <button
            onClick={() => onMintTuna?.(packageId)}
            disabled={isActionDisabled || actionLoading === 'mintTuna'}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'mintTuna' ? 'Minting tuna...' : 'Mint Tuna'}
          </button>
          <button
            onClick={onEatTuna}
            disabled={isActionDisabled || !selectedSwimmerId || !selectedTunaId || actionLoading === 'eatTuna'}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'eatTuna' ? 'Feeding...' : 'Feed Tuna'}
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          Tip: run update_progress - mint_tuna - eat_tuna to simulate a full training cycle.
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Owned swimmers</h4>
              <span className="text-xs text-gray-400">{swimmers.length}</span>
            </div>
            {swimmers.length === 0 ? (
              <p className="mt-3 text-xs text-gray-500">No swimmers in your wallet yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {swimmers.map((swimmer) => (
                  <li
                    key={swimmer.id}
                    className="rounded-md border border-gray-100 bg-white/80 px-3 py-2 text-xs text-gray-600"
                  >
                    <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                      <span>{swimmer.name}</span>
                      <span>{swimmer.distanceTraveled.toLocaleString()} m</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {swimmer.species} - Base speed {swimmer.baseSpeedPerHour} m/h
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400">
                      Last update {formatTimestamp(swimmer.lastUpdateTimestampMs)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Owned tuna cans</h4>
              <span className="text-xs text-gray-400">{tunaCans.length}</span>
            </div>
            {tunaCans.length === 0 ? (
              <p className="mt-3 text-xs text-gray-500">No tuna cans minted yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {tunaCans.map((tuna) => (
                  <li
                    key={tuna.id}
                    className="rounded-md border border-gray-100 bg-white/80 px-3 py-2 text-xs text-gray-600"
                  >
                    <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                      <span>
                        {tuna.id.slice(0, 6)}...{tuna.id.slice(-4)}
                      </span>
                      <span>+{tuna.energy} m</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPackageInventory = () => (
    <section className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Objects minted from this package</h3>
          <p className="text-xs text-gray-500">Tracking calls to mint_swimmer and mint_tuna on {packageLabel}</p>
        </div>
        <span className="text-xs text-gray-500">
          {isLoadingPackageAssets ? 'Refreshing...' : `${packageSwimmers.length + packageTunas.length} objects`}
        </span>
      </div>

      {packageAssetsError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {packageAssetsError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Minted swimmers</h4>
            <span className="text-xs text-gray-400">{packageSwimmers.length}</span>
          </div>
          {packageSwimmerItems.length === 0 ? (
            <p className="mt-3 text-xs text-gray-500">No swimmers minted from this package yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {packageSwimmerItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-gray-100 bg-white/80 px-3 py-2 text-xs text-gray-600"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                    <span>{item.name}</span>
                    <span>{item.distance.toLocaleString()} m</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Owner {formatOwnerLabel(item.owner)} - Base speed {item.baseSpeed} m/h
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    {item.trait ? `Trait: ${item.trait} - ` : ''}Last update {formatTimestamp(item.lastUpdated)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Minted tuna cans</h4>
            <span className="text-xs text-gray-400">{packageTunas.length}</span>
          </div>
          {packageTunaItems.length === 0 ? (
            <p className="mt-3 text-xs text-gray-500">No tuna cans minted from this package yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {packageTunaItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-gray-100 bg-white/80 px-3 py-2 text-xs text-gray-600"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                    <span>
                      {item.id.slice(0, 6)}...{item.id.slice(-4)}
                    </span>
                    <span>+{item.boost} m</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Owner {formatOwnerLabel(item.owner)} - Size {item.size}
                  </div>
                  {item.color && <div className="mt-1 text-[11px] text-gray-400">Colour: {item.color}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handlePackageMintSwimmer}
          disabled={isActionDisabled || packageAction === 'mint-swimmer'}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {packageAction === 'mint-swimmer' ? 'Minting swimmer...' : 'Mint demo swimmer'}
        </button>
        <button
          onClick={handlePackageMintTuna}
          disabled={isActionDisabled || packageAction === 'mint-tuna'}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {packageAction === 'mint-tuna' ? 'Minting tuna...' : 'Mint demo tuna'}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">Showing the most recent {PACKAGE_LIST_LIMIT} items per list.</p>
    </section>
  );

  return (
    <div className="space-y-8">
      {swimmers.length === 0 || tunaCans.length === 0 ? renderEmptyState() : renderActiveState()}
      {renderPackageInventory()}
    </div>
  );
}
