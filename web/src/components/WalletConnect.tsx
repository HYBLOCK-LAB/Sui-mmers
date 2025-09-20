import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

export function WalletConnect() {
  const currentAccount = useCurrentAccount()

  return (
    <div className="flex items-center gap-4">
      <ConnectButton 
        connectText="지갑 연결"
        connectedText="연결됨"
        className="px-4 py-2 rounded-md font-medium bg-gray-900 text-white hover:bg-gray-800"
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