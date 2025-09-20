import { SwimmerSummary } from '@/lib/types/swimmer';

interface ILearningStateProps {
  currentAccount: { address: string } | null;
  swimmers: SwimmerSummary[];
  packageId: string | null;
}

export function AssetsState({ currentAccount, swimmers, packageId }: ILearningStateProps) {
  return (
    <section className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Progress snapshot</h2>
      <p className="mt-3 text-sm text-gray-600">
        Check your current wallet, swimmer count, and package status at a glance.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs uppercase text-blue-600 font-semibold">Wallet</p>
          <p className="mt-1 text-sm font-mono text-gray-800">
            {currentAccount?.address
              ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
              : 'Not connected'}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs uppercase text-emerald-600 font-semibold">Swimmers owned</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
          <p className="text-xs uppercase text-purple-600 font-semibold">Package status</p>
          <p className="mt-1 text-sm text-gray-800">{packageId ? '✅ Ready' : 'Needs deploy'}</p>
        </div>
      </div>
    </section>
  );
}
