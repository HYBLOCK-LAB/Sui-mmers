import { useMemo, useState, useRef, useEffect } from 'react'
import { SwimmerSummary, TunaCanItem } from '@/lib/types/swimmer'

interface SwimmingPoolProps {
  swimmers: SwimmerSummary[]
  tunaCans?: TunaCanItem[]
  selectedSwimmerId?: string
  selectedTunaId?: string
  onSwimmerSelect?: (id: string) => void
  onTunaSelect?: (id: string) => void
  onUpdateProgress?: () => void
  onMintTuna?: () => void
  onEatTuna?: () => void
  actionLoading?: string | null
  packageId?: string | null
  currentAccount?: any
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
  currentAccount
}: SwimmingPoolProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState({ r: 255, g: 0, b: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)
  const [recoloredImages, setRecoloredImages] = useState<Map<string, string>>(new Map())
  
  // 애니메이션 상태
  const [animationFrame, setAnimationFrame] = useState(0)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  
  // 애니메이션 프레임 시퀀스: 1-2-3-2-1-2-3-2-...
  const animationSequence = [1, 2, 3, 2]
  
  // 현재 애니메이션 프레임 가져오기
  const getCurrentFrame = () => {
    return animationSequence[animationFrame % animationSequence.length]
  }
  
  // // 방향에 따른 이미지 경로 생성
  // const getSwimmerImagePath = (frame: number, direction: 'right' | 'left' = 'right') => {
  //   if (direction === 'left') {
  //     return `/images/mint_water_flipped(${frame}).png`
  //   }
  //   return `/images/mint_water(${frame}).png`
  // }
  const getSwimmerImagePath = (frame:number) => `/images/mint_water(${frame}).png`
  
  // // 수영 선수의 이동 방향 감지 (단순화된 버전)
  // const getSwimmerDirection = (swimmer: SwimmerSummary, index: number): 'right' | 'left' => {
  //   // 실제로는 이전 위치와 현재 위치를 비교해서 방향을 결정해야 하지만
  //   // 간단하게 인덱스에 따라 방향을 번갈아 설정
  //   return index % 2 === 0 ? 'right' : 'left'
  // }

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

  const recolorImageByHue = (image: HTMLImageElement, newHue: number) => {
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
    const sourceHueMin = 180; // 하늘색
    const sourceHueMax = 220; // 파란색

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
  }

  // 애니메이션 타이머 설정
  useEffect(() => {
    // 200ms 간격으로 애니메이션 프레임 변경
    animationRef.current = setInterval(() => {
      setAnimationFrame(prev => prev + 1)
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
      const hue = rgbToHue(selectedColor.r, selectedColor.g, selectedColor.b)
      const newImages = new Map(recoloredImages)
      
      // 각 애니메이션 프레임에 대해 색상 재적용
      for (const frame of animationSequence) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const recoloredDataUrl = recolorImageByHue(img, hue)
          if (recoloredDataUrl) {
            newImages.set(`swimmer-frame-${frame}`, recoloredDataUrl)
            setRecoloredImages(new Map(newImages))
          }
        }
        img.src = getSwimmerImagePath(frame)
      }
    }

    loadAndRecolorAllFrames()
  }, [selectedColor])

  const maxDistance = useMemo(() => {
    if (swimmers.length === 0) return 0
    return swimmers.reduce((max, swimmer) => Math.max(max, swimmer.distanceTraveled), 0)
  }, [swimmers])

  const getPosition = (distance: number) => {
    if (maxDistance === 0) {
      return '10%'
    }

    const normalized = Math.min(distance / Math.max(maxDistance, 1), 1)
    const offset = 10 + normalized * 78
    return `${offset}%`
  }

  const selectedSwimmer = swimmers.find(swimmer => swimmer.id === selectedSwimmerId)
  const selectedTuna = tunaCans.find(tuna => tuna.id === selectedTunaId)

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'Not updated'
    const date = new Date(Number(timestamp))
    if (Number.isNaN(date.getTime())) {
      return 'Not updated'
    }
    return date.toLocaleString()
  }

  if (swimmers.length === 0) {
    return (
      <div className="relative">
        {/* 수영장 영역 */}
        <div className="bg-cover bg-center bg-no-repeat rounded-xl p-8 aspect-video relative overflow-hidden mb-6" style={{ backgroundImage: 'url(/images/ocean_16-9.png)' }}>
          {/* 물결 애니메이션 */}
          <div className="absolute inset-0">
            <div className="wave-animation"></div>
          </div>
          
          {/* 수영장 레인 */}
          <div className="absolute inset-0 flex">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 border-l-2 border-blue-400 opacity-30"></div>
            ))}
          </div>
          
          <div className="relative flex items-center justify-center h-full">
            <div className="text-center bg-white/80 rounded-lg p-6">
              <img 
                src={recoloredImages.get(`swimmer-frame-${getCurrentFrame()}`) || `/images/mint_water(${getCurrentFrame()}).png`} 
                alt="Swimmer" 
                className="w-16 h-16 mx-auto mb-4" 
              />
              <p className="text-gray-700 font-medium">
                Mint a swimmer to see them here!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Connect your wallet and deploy the code.
              </p>
            </div>
          </div>
        </div>

        {/* 게임 콘솔 컨트롤 패널 */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🎮 Game Console</h3>
            <span className="text-xs text-gray-500">Inventory {tunaCans.length}</span>
          </div>

          <div className="text-center text-gray-500 py-4">
            <p>Mint a swimmer first and then start playing.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={onMintTuna}
              disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'mintTuna' ? 'Minting...' : '🍣 Mint Tuna'}
            </button>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            💡 Mint a swimmer first and then start the game.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 수영장 영역 */}
      <div className="bg-cover bg-center bg-no-repeat rounded-xl p-8 h-[28rem] relative overflow-hidden mb-6" style={{ backgroundImage: 'url(/images/ocean_16-9.png)' }}>
        {/* 물결 애니메이션 */}
        <div className="absolute inset-0">
          <div className="wave-animation"></div>
        </div>
        
        {/* 수영장 레인 */}
        <div className="absolute inset-0 flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 border-l-2 border-blue-400 opacity-30"></div>
          ))}
        </div>
        
        {/* 아이템 표시 */}
        <div className="absolute top-4 left-4">
          <img src="/images/tuna_can.png" alt="Tuna Can" className="w-8 h-8" />
          {/* <img src="/images/tuna_floating.png" alt="Tuna Floating" className="w-8 h-8 ml-2" /> */}
        </div>
        
        {/* 수영 선수들 */}
        <div className="relative h-full">
          {swimmers.map((swimmer, index) => {
            const currentFrame = getCurrentFrame()
            // const direction = getSwimmerDirection(swimmer, index)
            // const frameImage = recoloredImages.get(`swimmer-${direction}-frame-${currentFrame}`) || getSwimmerImagePath(currentFrame, direction)
            const frameImage = recoloredImages.get(`swimmer-frame-${currentFrame}`) || getSwimmerImagePath(currentFrame)
            
            return (
              <div
                key={swimmer.id}
                className="absolute flex items-center"
                style={{
                  top: `${(index * 60) + 20}px`,
                  left: getPosition(swimmer.distanceTraveled),
                  transition: 'left 1.5s ease-out',
                }}
              >
                <img 
                  src={frameImage} 
                  alt="Swimmer" 
                  className="w-12 h-12" 
                />
                <div className="ml-3 bg-white/70 rounded-lg px-3 py-1 shadow">
                  <div className="font-bold text-sm">{swimmer.name}</div>
                  <div className="text-xs text-gray-600">
                    {swimmer.species}
                  </div>
                  <div className="text-xs text-blue-600">
                    Total distance {swimmer.distanceTraveled}m
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 능력치 표시 */}
        <div className="absolute top-4 right-4 bg-white/70 rounded-lg p-3 shadow">
          <h4 className="font-semibold text-sm mb-2">Swimmer Status</h4>
          {swimmers.map(swimmer => (
            <div key={swimmer.id} className="text-xs mb-1">
              <span className="font-medium">{swimmer.name}</span>
              <div className="flex gap-3 text-gray-600">
                <span>Base speed: {swimmer.baseSpeedPerHour}m/h</span>
                <span>Last update: {formatTimestamp(swimmer.lastUpdateTimestampMs)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 게임 콘솔 컨트롤 패널 */}
      <div className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🎮 Game Console</h3>
          <span className="text-xs text-gray-500">Inventory {tunaCans.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Swimmer</label>
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
                    {swimmer.name} · {swimmer.distanceTraveled}m
                  </option>
                ))
              )}
            </select>
            {selectedSwimmer && (
              <p className="mt-1 text-xs text-gray-500">
                Base speed {selectedSwimmer.baseSpeedPerHour}m/h
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">TunaCan Inventory</label>
            <select
              value={selectedTunaId}
              onChange={(event) => onTunaSelect?.(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={tunaCans.length === 0}
            >
              {tunaCans.length === 0 ? (
                <option>Mint a TunaCan to see it here</option>
              ) : (
                tunaCans.map((tuna) => (
                  <option key={tuna.id} value={tuna.id}>
                    {tuna.id.slice(0, 6)}...{tuna.id.slice(-4)} · +{tuna.energy}m
                  </option>
                ))
              )}
            </select>
            {selectedTuna && (
              <p className="mt-1 text-xs text-gray-500">Bonus distance +{selectedTuna.energy}m</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Swim Cap Color (RGB)</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs w-4">R</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={selectedColor.r}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(prev => ({ ...prev, r: Number(e.target.value) }))}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(prev => ({ ...prev, g: Number(e.target.value) }))}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(prev => ({ ...prev, b: Number(e.target.value) }))}
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
            disabled={!packageId || !currentAccount || !selectedSwimmerId || actionLoading === 'update'}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'update' ? 'Updating...' : '⏱ Auto Progress'}
          </button>
          <button
            onClick={onMintTuna}
            disabled={!packageId || !currentAccount || actionLoading === 'mintTuna'}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'mintTuna' ? 'Minting...' : '🍣 Mint Tuna'}
          </button>
          <button
            onClick={onEatTuna}
            disabled={!packageId || !currentAccount || !selectedSwimmerId || !selectedTunaId || actionLoading === 'eatTuna'}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'eatTuna' ? 'Processing...' : '🍽 Feed'}
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          💡 Try running update_progress → mint_tuna → eat_tuna in order.
        </div>
      </div>
    </div>
  )
}
