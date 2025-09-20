import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DEFAULT_VALUES } from '@/src/contracts/moveTemplates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiMoveCompiler } from '@/lib/services/apiMoveCompiler'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600">
      Loading editor...
    </div>
  ),
})

interface CodeEditorProps {
  onMint?: (name: string, species: string) => void | Promise<void>
  onCompileAndDeploy?: (transaction: any) => void | Promise<void>
  disabled?: boolean
  codeTemplate?: string
}

const FALLBACK_TEMPLATE = `module sui_mmers::example {
    use sui::object::{Self, UID};

    public struct Swimmer has key {
        id: UID,
        distance_traveled: u64,
    }
}`

export function CodeEditor({ onMint, onCompileAndDeploy, disabled, codeTemplate }: CodeEditorProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [currentCode, setCurrentCode] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [name] = useState('My Swimmer')
  const [species] = useState('Pacific Orca')
  const [baseSpeed] = useState(DEFAULT_VALUES.baseSpeedPerHour)
  const [tunaBonus] = useState(DEFAULT_VALUES.tunaBonus)

  const processedCode = useMemo(() => {
    const template = codeTemplate ?? ApiMoveCompiler.getSwimmerMoveTemplate()
    return template
      .replace(/{{BASE_SPEED_PER_HOUR}}/g, baseSpeed.toString())
      .replace(/{{TUNA_BONUS}}/g, tunaBonus.toString())
  }, [codeTemplate, baseSpeed, tunaBonus])

  // Initialize currentCode when template changes
  useEffect(() => {
    setCurrentCode(processedCode)
    validateCode(processedCode)
  }, [processedCode])

  // Validate Move code structure with real-time feedback
  const validateCode = (code: string) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check for required module declaration
    if (!code.includes('module swimming::swimmer')) {
      errors.push('Module must be named "swimming::swimmer"')
    }
    
    // Check for required imports
    const requiredImports = [
      'use sui::object',
      'use sui::transfer',
      'use sui::tx_context',
      'use std::string'
    ]
    
    requiredImports.forEach(imp => {
      if (!code.includes(imp)) {
        warnings.push(`Missing recommended import: ${imp}`)
      }
    })
    
    // Check for required structs
    if (!code.includes('public struct Swimmer has key')) {
      errors.push('Missing required "Swimmer" struct with key ability')
    }
    
    // Check for required entry functions
    const requiredFunctions = [
      { pattern: 'public entry fun mint_swimmer', name: 'mint_swimmer' },
    ]
    
    requiredFunctions.forEach(func => {
      if (!code.includes(func.pattern)) {
        errors.push(`Missing required function: ${func.name}`)
      }
    })
    
    // Check for required fields in Swimmer struct
    if (code.includes('struct Swimmer')) {
      const swimmerMatch = code.match(/struct Swimmer[^{]*\{([^}]*)\}/s)
      if (swimmerMatch) {
        const swimmerBody = swimmerMatch[1]
        const requiredFields = [
          { field: 'id: UID', name: 'id' },
          { field: 'name: String', name: 'name' },
          { field: 'distance_traveled: u64', name: 'distance_traveled' }
        ]
        requiredFields.forEach(fieldDef => {
          if (!swimmerBody.includes(fieldDef.field)) {
            errors.push(`Swimmer struct missing required field: ${fieldDef.name}`)
          }
        })
      }
    }
    
    // Check for proper function parameters in mint_swimmer
    const mintFuncMatch = code.match(/public entry fun mint_swimmer\s*\(([^)]*)\)/s)
    if (mintFuncMatch) {
      const params = mintFuncMatch[1]
      if (!params.includes('name:') || !params.includes('vector<u8>')) {
        warnings.push('mint_swimmer should accept name as vector<u8>')
      }
      if (!params.includes('species:') || !params.includes('vector<u8>')) {
        warnings.push('mint_swimmer should accept species as vector<u8>')
      }
      if (!params.includes('ctx:') || !params.includes('&mut TxContext')) {
        errors.push('mint_swimmer must have ctx: &mut TxContext parameter')
      }
    }
    
    setValidationErrors([...errors, ...warnings])
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      // If onCompileAndDeploy is provided, use compilation flow
      if (onCompileAndDeploy) {
        console.log('Compiling Move code...')
        const transaction = await ApiMoveCompiler.createDeployTransaction('swimmer', currentCode)
        await onCompileAndDeploy(transaction)
      } 
      // Fallback to old mint flow
      else if (onMint) {
        await onMint(name, species)
      }
    } catch (error) {
      console.error('Deploy failed:', error)
      alert('Deployment failed: ' + (error as Error).message)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Card className="flex flex-col flex-1 h-full">
      <CardHeader>
        <CardTitle>Code Playground</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[320px] space-y-2">
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm font-medium text-red-800 mb-1">Validation Errors:</p>
            <ul className="text-xs text-red-700 space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        <Editor
          defaultLanguage="rust"
          value={processedCode}
          onChange={(value) => {
            const newValue = value || ''
            setCurrentCode(newValue)
            validateCode(newValue)
          }}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            readOnly: !(onMint || onCompileAndDeploy),
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </CardContent>
      {(onMint || onCompileAndDeploy) && (
        <CardFooter className="justify-end">
          <Button
            onClick={handleDeploy}
            disabled={disabled || isDeploying || validationErrors.length > 0}
            size="lg"
            className="w-full"
          >
            {isDeploying ? 'Compiling & Deploying...' : 
             validationErrors.length > 0 ? 'Fix Validation Errors First' : 
             'Compile & Deploy Swimmer'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
