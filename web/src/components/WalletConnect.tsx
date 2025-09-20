'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletConnect() {
  const currentAccount = useCurrentAccount();

  return (
    <div className="flex items-center gap-4">
      <ConnectButton className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800" />
      {currentAccount ? (
        <div className="rounded-lg border border-gray-200 bg-gray-100 px-4 py-2">
          <span className="text-sm font-mono text-gray-700">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
