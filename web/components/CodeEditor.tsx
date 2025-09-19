import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SWIMMER_MODULE_TEMPLATE, DEFAULT_VALUES, SwimmingStyle, STYLE_NAMES } from '@/src/contracts/moveTemplates'
import { Button } from '@/components/ui/button'

const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600">에디터 로딩중...</div>
})

interface CodeEditorProps {
  onDeploy: (name: string, style: number) => void
  disabled?: boolean
}

export function CodeEditor({ onDeploy, disabled }: CodeEditorProps) {
  const [name, setName] = useState('MySwimmer')
  const [speed, setSpeed] = useState(DEFAULT_VALUES.speed)
  const [stamina, setStamina] = useState(DEFAULT_VALUES.stamina)
  const [style, setStyle] = useState(DEFAULT_VALUES.style)
  const [isDeploying, setIsDeploying] = useState(false)

  // 템플릿에 값 적용
  const getProcessedCode = useCallback(() => {
    return SWIMMER_MODULE_TEMPLATE
      .replace('{{SPEED}}', speed.toString())
      .replace('{{STAMINA}}', stamina.toString())
      .replace('{{STYLE}}', style.toString())
  }, [speed, stamina, style])

  const handleDeploy = async () => {
    if (!name.trim()) {
      alert('수영 선수 이름을 입력해주세요!')
      return
    }

    setIsDeploying(true)
    try {
      await onDeploy(name, style)
    } catch (error) {
      console.error('Deploy failed:', error)
      alert('배포 실패: ' + (error as Error).message)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">파라미터 설정</h3>
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
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                속도 (10-100)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                체력 (50-100)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={stamina}
                onChange={(e) => setStamina(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                스타일
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STYLE_NAMES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px]">
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
      </div>
      
      <div className="p-4 border-t bg-muted/50">
        <Button
          onClick={handleDeploy}
          disabled={disabled || isDeploying}
          size="lg"
          className="w-full"
        >
          {isDeploying ? '배포 중...' : '🚀 NFT 생성하기'}
        </Button>
      </div>
    </div>
  )
}