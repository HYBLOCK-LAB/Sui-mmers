import { useEffect, useMemo, useRef, useState, useId } from 'react';
import type { ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import type { editor as MonacoEditor } from 'monaco-editor';
import { DEFAULT_VALUES } from '@/src/contracts/moveTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiMoveCompiler } from '@/lib/services/apiMoveCompiler';

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

export type StoredDeployment = {
  id: string;
  package_id: string;
  wallet_address?: string | null;
  lesson_slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

interface CodeEditorProps {
  onCompileAndDeploy?: (transaction: any) => void | Promise<void>;
  disabled?: boolean;
  codeTemplate?: string;
  codeSkeletone?: string;
  readOnly?: boolean;
  senderAddress?: string;
  deploymentMetadata?: {
    walletAddress: string;
    lessonSlug?: string;
  };
  deploymentHistory?: StoredDeployment[];
  selectedDeploymentPackageId?: string | null;
  onSelectDeployment?: (packageId: string | null) => void;
}

const FALLBACK_TEMPLATE = `module swimming::example {
    use sui::object::{Self, UID};
    use std::string::{Self, String};

    public struct Swimmer has key, store {
        id: UID,
        name: String,
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

const formatPackageId = (value: string): string =>
  value.length > 16 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;

const buildDeploymentOptionLabel = (deployment: StoredDeployment): string => {
  const segments: string[] = [formatPackageId(deployment.package_id)];
  if (deployment.lesson_slug) {
    segments.push(deployment.lesson_slug);
  }
  if (deployment.updated_at) {
    const parsed = Date.parse(deployment.updated_at);
    if (!Number.isNaN(parsed)) {
      segments.push(new Date(parsed).toLocaleString());
    }
  }
  return segments.join(' - ');
};

export function CodeEditor({
  onCompileAndDeploy,
  disabled,
  codeTemplate,
  codeSkeletone,
  readOnly = false,
  senderAddress,
  deploymentMetadata,
  deploymentHistory,
  selectedDeploymentPackageId,
  onSelectDeployment,
}: CodeEditorProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [baseSpeed] = useState(DEFAULT_VALUES.baseSpeedPerHour);
  const [tunaBonus] = useState(DEFAULT_VALUES.tunaBonus);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const hintDiffDisposablesRef = useRef<Array<{ dispose: () => void }>>([]);

  const deploymentSelectId = useId();
  const deploymentOptions = useMemo(() => {
    const unique = new Map<string, StoredDeployment>();
    (deploymentHistory ?? []).forEach((deployment) => {
      if (deployment?.package_id) {
        unique.set(deployment.package_id, deployment);
      }
    });

    if (selectedDeploymentPackageId && !unique.has(selectedDeploymentPackageId)) {
      unique.set(selectedDeploymentPackageId, {
        id: `selected-${selectedDeploymentPackageId}`,
        package_id: selectedDeploymentPackageId,
      });
    }

    const sorted = Array.from(unique.values()).sort((a, b) => {
      const aTime = a.updated_at ? Date.parse(a.updated_at) : Number.NEGATIVE_INFINITY;
      const bTime = b.updated_at ? Date.parse(b.updated_at) : Number.NEGATIVE_INFINITY;
      return bTime - aTime;
    });

    return sorted;
  }, [deploymentHistory, selectedDeploymentPackageId]);

  const hasDeploymentOptions = deploymentOptions.length > 0;
  const selectedDeploymentValue = selectedDeploymentPackageId ?? '';
  const canSelectDeployment = typeof onSelectDeployment === 'function';
  const showDeploymentPicker = hasDeploymentOptions || Boolean(selectedDeploymentPackageId);

  const handleDeploymentSelectionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!onSelectDeployment) {
      return;
    }

    const { value } = event.target;
    onSelectDeployment(value ? value : null);
  };
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
    if (!onCompileAndDeploy) {
      return;
    }

    setIsDeploying(true);
    try {
      if (!senderAddress) {
        throw new Error('Sender address is required for deployment');
      }

      const currentCode = editorRef.current?.getValue() || solutionCode;
      const transaction = await ApiMoveCompiler.createDeployTransaction('swimmer', currentCode, senderAddress, {
        persist: deploymentMetadata,
      });
      await onCompileAndDeploy(transaction);
    } catch (error) {
      console.error('Deploy failed:', error);
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
        <CardFooter className="flex flex-col gap-3">
          {onCompileAndDeploy && (
            <>
              {showDeploymentPicker && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={deploymentSelectId} className="text-sm font-medium text-gray-700">
                      Saved packages
                    </label>
                    {selectedDeploymentPackageId && (
                      <span className="text-xs text-gray-500">Selected</span>
                    )}
                  </div>
                  {hasDeploymentOptions ? (
                    <select
                      id={deploymentSelectId}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedDeploymentValue}
                      onChange={handleDeploymentSelectionChange}
                      disabled={!canSelectDeployment}
                    >
                      <option value="">Deploy new package</option>
                      {deploymentOptions.map((deployment) => (
                        <option key={deployment.id} value={deployment.package_id}>
                          {buildDeploymentOptionLabel(deployment)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500">
                      No saved deployments yet. Deploy once to keep your package ID handy.
                    </div>
                  )}
                  {selectedDeploymentPackageId && (
                    <p className="font-mono text-xs text-gray-500 break-all">{selectedDeploymentPackageId}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Pick a saved package to reuse it with the minting tools, or deploy a new one.
                  </p>
                </div>
              )}
              <Button onClick={handleDeploy} disabled={disabled || isDeploying} size="lg" className="w-full">
                {isDeploying ? 'Processing...' : 'Compile & Deploy'}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
