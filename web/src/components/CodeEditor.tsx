import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SWIMMER_MODULE_TEMPLATE, DEFAULT_VALUES } from '@/src/contracts/moveTemplates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600">에디터 로딩중...</div>
})

interface CodeEditorProps {
  onMint: (name: string, species: string) => void
  disabled?: boolean
}

export function CodeEditor({ onMint, disabled }: CodeEditorProps) {
  const [name, setName] = useState('My Swimmer')
  const [species, setSpecies] = useState('Pacific Orca')
  const [baseSpeed, setBaseSpeed] = useState(DEFAULT_VALUES.baseSpeedPerHour)
  const [tunaBonus, setTunaBonus] = useState(DEFAULT_VALUES.tunaBonus)
  const [isDeploying, setIsDeploying] = useState(false)

  // 템플릿에 값 적용
  const getProcessedCode = useCallback(() => {
    return SWIMMER_MODULE_TEMPLATE
      .replace(/{{BASE_SPEED_PER_HOUR}}/g, baseSpeed.toString())
      .replace(/{{TUNA_BONUS}}/g, tunaBonus.toString())
  }, [baseSpeed, tunaBonus])

  const handleDeploy = async () => {
    if (!name.trim()) {
      alert('수영 선수 이름을 입력해주세요!')
      return
    }

    if (!species.trim()) {
      alert('수영 선수가 어떤 종인지 정해주세요!')
      return
    }

    setIsDeploying(true)
    try {
      await onMint(name.trim(), species.trim())
    } catch (error) {
      console.error('Deploy failed:', error)
      alert('배포 실패: ' + (error as Error).message)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>2단계. 첫 Swimmer 민팅</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              선수 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="수영 선수 이름 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종(species)
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: Pacific Orca"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본 속도 (m / h)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={baseSpeed}
                onChange={(e) => setBaseSpeed(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                코드 예시에서 자동 전진 속도를 조정합니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                참치 보너스 (m)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={tunaBonus}
                onChange={(e) => setTunaBonus(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                참치를 먹였을 때 추가 이동할 거리를 설정합니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardContent className="flex-1 min-h-[300px]">
        <Editor
          defaultLanguage="rust"
          value={getProcessedCode()}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            readOnly: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          onClick={handleDeploy}
          disabled={disabled || isDeploying}
          size="lg"
          className="w-full"
        >
          {isDeploying ? '처리 중...' : '🚀 Swimmer 민팅하기'}
        </Button>
      </CardFooter>
    </Card>
  )
}
