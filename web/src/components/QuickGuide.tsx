export function QuickGuide() {
  return (
    <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">빠른 링크</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>
            •{' '}
            <a
              href="https://docs.sui.io/learn"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sui 학습하기
            </a>
          </li>
          <li>
            •{' '}
            <a
              href="https://move-language.github.io"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Move 언어 문서
            </a>
          </li>
          <li>
            •{' '}
            <a
              href="https://faucet.testnet.sui.io"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Testnet Faucet
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
