import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

export function WalletConnect() {
  const currentAccount = useCurrentAccount()

  return (
    <div className="flex items-center gap-4">
      <ConnectButton 
        connectText="Connect Wallet"
        connectedText="Connected"
        className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
      />
      {currentAccount && (
        <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
          <span className="text-sm font-mono text-gray-700">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
        </div>
      )}
    </div>
  )
}