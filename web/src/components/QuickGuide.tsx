export function QuickGuide() {
  return (
    <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="bg-white/80 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Quick links</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>
            <a
              className="text-blue-600 hover:text-blue-800"
              href="https://docs.sui.io/learn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Study the Sui docs
            </a>
          </li>
          <li>
            <a
              className="text-blue-600 hover:text-blue-800"
              href="https://move-language.github.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the Move language book
            </a>
          </li>
          <li>
            <a
              className="text-blue-600 hover:text-blue-800"
              href="https://faucet.testnet.sui.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              Request testnet SUI
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
