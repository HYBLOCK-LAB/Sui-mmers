import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_VALUES } from '@/src/contracts/moveTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600">Loading editor...</div>
  ),
});

interface CodeEditorProps {
  onMint?: (name: string, species: string) => void | Promise<void>;
  disabled?: boolean;
  codeTemplate?: string;
  readOnly?: boolean;
}

const FALLBACK_TEMPLATE = `module sui_mmers::example {
    use sui::object::{Self, UID};

    public struct Swimmer has key {
        id: UID,
        distance_traveled: u64,
    }
}`;

export function CodeEditor({ onMint, disabled, codeTemplate, readOnly = false }: CodeEditorProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [name] = useState('My Swimmer');
  const [species] = useState('Pacific Orca');
  const [baseSpeed] = useState(DEFAULT_VALUES.baseSpeedPerHour);
  const [tunaBonus] = useState(DEFAULT_VALUES.tunaBonus);

  const processedCode = useMemo(() => {
    const template = codeTemplate ?? FALLBACK_TEMPLATE;
    return template
      .replace(/{{BASE_SPEED_PER_HOUR}}/g, baseSpeed.toString())
      .replace(/{{TUNA_BONUS}}/g, tunaBonus.toString());
  }, [codeTemplate, baseSpeed, tunaBonus]);

  const handleDeploy = async () => {
    if (!onMint) return;
    setIsDeploying(true);
    try {
      await onMint(name, species);
    } catch (error) {
      console.error('Deploy failed:', error);
      alert('Deployment failed: ' + (error as Error).message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card className="flex flex-col flex-1 h-full">
      <CardHeader>
        <CardTitle>Code Playground</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[320px]">
        <Editor
          defaultLanguage="rust"
          value={processedCode}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            readOnly: readOnly,
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </CardContent>
      {onMint && (
        <CardFooter className="justify-end">
          <Button onClick={handleDeploy} disabled={disabled || isDeploying} size="lg" className="w-full">
            {isDeploying ? 'Processing...' : 'Mint Swimmer from Template'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
