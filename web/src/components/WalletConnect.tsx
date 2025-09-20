'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletConnect() {
  const currentAccount = useCurrentAccount();

  return (
    <ConnectButton className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800" />
  );
}
