import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MintSwimmerPanelProps {
  onMint: (name: string, species: string) => void | Promise<void>;
  isMinting?: boolean;
  disabled?: boolean;
  packageId?: string | null;
  defaultName?: string;
  defaultSpecies?: string;
  resetKey?: string;
}

export function MintSwimmerPanel({
  onMint,
  isMinting = false,
  disabled = false,
  packageId,
  defaultName = 'My Swimmer',
  defaultSpecies = 'Pacific Orca',
  resetKey,
}: MintSwimmerPanelProps) {
  const [name, setName] = useState(defaultName);
  const [species, setSpecies] = useState(defaultSpecies);

  useEffect(() => {
    setName(defaultName);
    setSpecies(defaultSpecies);
  }, [defaultName, defaultSpecies, resetKey]);

  const trimmedName = name.trim();
  const trimmedSpecies = species.trim();
  const packageReady = Boolean(packageId);
  const isButtonDisabled =
    disabled || isMinting || !packageReady || trimmedName.length === 0 || trimmedSpecies.length === 0;

  return (
    <Card className="border-sky-200">
      <CardHeader>
        <CardTitle className="text-lg">Mint Swimmer NFT</CardTitle>
        <p className="text-sm text-gray-500">Deploy한 패키지로 새로운 Swimmer를 바로 만들어보세요.</p>
        {!packageReady ? (
          <p className="text-xs text-amber-600">먼저 Move 패키지를 배포해야 민팅할 수 있어요.</p>
        ) : (
          packageId && (
            <p className="text-xs text-gray-400 font-mono break-all">Package ID: {packageId}</p>
          )
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Swimmer name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="My Swimmer"
              disabled={disabled || isMinting}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Species</label>
            <input
              type="text"
              value={species}
              onChange={(event) => setSpecies(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Pacific Orca"
              disabled={disabled || isMinting}
            />
          </div>
        </div>
        <Button onClick={() => onMint(trimmedName, trimmedSpecies)} disabled={isButtonDisabled} size="lg" className="w-full">
          {isMinting ? 'Minting...' : 'Mint Swimmer NFT'}
        </Button>
      </CardContent>
    </Card>
  );
}
