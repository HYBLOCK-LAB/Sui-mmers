import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { editor as MonacoEditor } from 'monaco-editor';
import { DEFAULT_VALUES } from '@/src/contracts/moveTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50 text-gray-600">Loading editor...</div>
  ),
});

const DiffEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.DiffEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50 text-gray-600">Preparing diff...</div>
  ),
});

interface CodeEditorProps {
  onMint?: (name: string, species: string) => void | Promise<void>;
  disabled?: boolean;
  codeTemplate?: string;
  codeSkeletone?: string;
  readOnly?: boolean;
}

const FALLBACK_TEMPLATE = `module sui_mmers::example {
    use sui::object::{Self, UID};

    public struct Swimmer has key {
        id: UID,
        distance_traveled: u64,
    }
}`;

const normalize = (input: string): string =>
  input
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .trim();

type DiffOp = {
  type: 'equal' | 'add' | 'remove';
  line: string;
};

const computeDiffOps = (current: string, solution: string): DiffOp[] => {
  const currentLines = current.replace(/\r\n/g, '\n').split('\n');
  const solutionLines = solution.replace(/\r\n/g, '\n').split('\n');
  const m = currentLines.length;
  const n = solutionLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (currentLines[i] === solutionLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (currentLines[i] === solutionLines[j]) {
      ops.push({ type: 'equal', line: solutionLines[j] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'remove', line: currentLines[i] });
      i += 1;
    } else {
      ops.push({ type: 'add', line: solutionLines[j] });
      j += 1;
    }
  }

  while (i < m) {
    ops.push({ type: 'remove', line: currentLines[i] });
    i += 1;
  }

  while (j < n) {
    ops.push({ type: 'add', line: solutionLines[j] });
    j += 1;
  }

  return ops;
};

const createHintPlaceholder = (line: string): string => {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';
  return indent + ' ';
};

export function CodeEditor({ onMint, disabled, codeTemplate, codeSkeletone, readOnly = false }: CodeEditorProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [name] = useState('My Swimmer');
  const [species] = useState('Pacific Orca');
  const [baseSpeed] = useState(DEFAULT_VALUES.baseSpeedPerHour);
  const [tunaBonus] = useState(DEFAULT_VALUES.tunaBonus);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const hintDiffDisposablesRef = useRef<Array<{ dispose: () => void }>>([]);

  const processCode = (code?: string) =>
    (code ?? FALLBACK_TEMPLATE)
      .replace(/{{BASE_SPEED_PER_HOUR}}/g, baseSpeed.toString())
      .replace(/{{TUNA_BONUS}}/g, tunaBonus.toString());

  const solutionCode = useMemo(() => processCode(codeTemplate), [codeTemplate, baseSpeed, tunaBonus]);
  const skeletonCode = useMemo(
    () => processCode(codeSkeletone ?? codeTemplate),
    [codeSkeletone, codeTemplate, baseSpeed, tunaBonus]
  );

  const hasChecker = Boolean(codeTemplate && codeSkeletone);

  const [code, setCode] = useState(() => (hasChecker ? skeletonCode : solutionCode));
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(!hasChecker);
  const [isDiffReady, setIsDiffReady] = useState(false);

  const hintMaskedSolution = useMemo(() => {
    if (!showHint) {
      return solutionCode;
    }

    const ops = computeDiffOps(code, solutionCode);
    const maskedLines: string[] = [];

    ops.forEach((op) => {
      if (op.type === 'add') {
        maskedLines.push(createHintPlaceholder(op.line));
      } else if (op.type === 'equal') {
        maskedLines.push(op.line);
      }
    });

    return maskedLines.join('\n');
  }, [showHint, code, solutionCode]);

  useEffect(() => {
    if (hasChecker) {
      setCode(skeletonCode);
      setStatus('idle');
      setShowSolution(false);
      setShowHint(false);
      setIsEditorReady(false);
      setIsDiffReady(false);
    }
  }, [hasChecker, skeletonCode]);

  useEffect(() => {
    if (showSolution) {
      setShowHint(false);
      setIsDiffReady(false);
    } else if (hasChecker) {
      setIsEditorReady(false);
    }
  }, [showSolution, hasChecker]);

  useEffect(() => {
    if (!showHint) {
      hintDiffDisposablesRef.current.forEach((disposable) => disposable.dispose());
      hintDiffDisposablesRef.current = [];
    }
  }, [showHint]);

  useEffect(
    () => () => {
      hintDiffDisposablesRef.current.forEach((disposable) => disposable.dispose());
      hintDiffDisposablesRef.current = [];
    },
    []
  );

  const handleEditorMount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  const handleHintDiffEditorMount = (diffEditor: any) => {
    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();

    hintDiffDisposablesRef.current.forEach((disposable) => disposable.dispose());
    hintDiffDisposablesRef.current = [];

    modifiedEditor.updateOptions({ readOnly: true, lineNumbers: 'off' });
    originalEditor.updateOptions({ readOnly: false, lineNumbers: 'on' });

    const listener = originalEditor.onDidChangeModelContent(() => {
      const value = originalEditor.getValue();
      setCode(value);
    });

    hintDiffDisposablesRef.current.push(listener);
    editorRef.current = originalEditor;
    setIsEditorReady(true);
  };

  const handleDiffEditorMount = (editor: any) => {
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();
    originalEditor.updateOptions({ lineNumbers: 'off' });
    modifiedEditor.updateOptions({ lineNumbers: 'on' });
    setIsDiffReady(true);
  };

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

  const handleCodeChange = (value?: string) => {
    setCode(value ?? '');
    if (status !== 'idle') {
      setStatus('idle');
      setShowHint(false);
    }
  };

  const handleCheckAnswer = () => {
    if (normalize(code) === normalize(solutionCode)) {
      setStatus('success');
      setShowSolution(false);
      setShowHint(false);
    } else {
      setStatus('error');
    }
  };

  const handleToggleHint = () => {
    if (!showHint) {
      setShowSolution(false);
      setIsEditorReady(false);
    }
    setShowHint((prev) => !prev);
  };

  const handleShowSolution = () => {
    setShowHint(false);
    setShowSolution(true);
  };

  const handleDiffEditorBeforeMount = () => {
    setIsDiffReady(false);
  };

  const editorHeightClass = showHint || showSolution ? 'min-h-[440px]' : 'min-h-[320px]';

  return (
    <Card className="flex h-full flex-1 flex-col">
      <CardHeader>
        <CardTitle>Code Editer</CardTitle>
      </CardHeader>
      <CardContent className={`flex-1 ${editorHeightClass}`}>
        {hasChecker ? (
          showSolution ? (
            <DiffEditor
              original={code}
              modified={solutionCode}
              language="rust"
              beforeMount={handleDiffEditorBeforeMount}
              onMount={handleDiffEditorMount}
              options={{
                readOnly: true,
                renderIndicators: true,
                minimap: { enabled: false },
                renderSideBySide: false,
                originalEditable: false,
                enableSplitViewResizing: false,
              }}
            />
          ) : showHint ? (
            <DiffEditor
              original={code}
              modified={hintMaskedSolution}
              language="rust"
              beforeMount={() => setIsEditorReady(false)}
              onMount={handleHintDiffEditorMount}
              options={{
                readOnly: false,
                renderIndicators: true,
                minimap: { enabled: false },
                renderSideBySide: false,
                originalEditable: true,
                enableSplitViewResizing: false,
              }}
            />
          ) : (
            <Editor
              defaultLanguage="rust"
              value={code}
              theme="vs-light"
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                readOnly,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          )
        ) : (
          <Editor
            defaultLanguage="rust"
            defaultValue={solutionCode}
            theme="vs-light"
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              readOnly,
              wordWrap: 'on',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        )}
      </CardContent>
      {hasChecker ? (
        <CardFooter className="flex flex-col gap-3">
          <div className="text-sm">
            {status === 'success' ? (
              <span className="text-emerald-600">Great job! Your solution matches the reference implementation.</span>
            ) : status === 'error' ? (
              <span className="text-red-600 font-semibold">
                Not quite there yet. Compare with the reference or keep iterating.
              </span>
            ) : (
              <span className="text-gray-600">
                Fill in the missing pieces, then check your answer when you are ready.
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {status !== 'success' && !showSolution && (
              <Button onClick={handleCheckAnswer} disabled={!isEditorReady}>
                Check answer
              </Button>
            )}
            {status === 'error' && !showSolution && (
              <>
                <Button variant="outline" onClick={handleToggleHint} disabled={!isEditorReady}>
                  {showHint ? 'Hide hint' : 'Show hint'}
                </Button>
                <Button variant="secondary" onClick={handleShowSolution} disabled={!isEditorReady}>
                  Show solution
                </Button>
              </>
            )}
            {showSolution && (
              <Button variant="outline" onClick={() => setShowSolution(false)}>
                Back to editor
              </Button>
            )}
          </div>
        </CardFooter>
      ) : (
        onMint && (
          <CardFooter className="justify-end">
            <Button onClick={handleDeploy} disabled={disabled || isDeploying} size="lg" className="w-full">
              {isDeploying ? 'Processing...' : 'Mint Swimmer from Template'}
            </Button>
          </CardFooter>
        )
      )}
    </Card>
  );
}
