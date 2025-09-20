import { SwimmerSummary } from '@/lib/types/swimmer';

const LESSON_GUIDE = `## 준비 단계
- 지갑을 연결하고 테스트넷 네트워크를 선택하세요.
- gameplay 페이지에서 패키지를 배포하면 이곳에서도 동일한 패키지를 사용할 수 있습니다.

## 학습 흐름
- 세션 1에서는 Swimmer 구조체와 자동 전진 로직을 구현합니다.
- 세션 2에서는 TunaCan 아이템과 Programmable Transaction Block을 활용합니다.

## 다음 단계
- gameplay 콘솔에서 PTB 액션을 실행하며 학습 내용을 복습하세요.
- Move 문서를 참고하여 자신만의 기능을 추가해 보세요.`;

interface ILearningStateProps {
  currentAccount: { address: string } | null;
  swimmers: SwimmerSummary[];
  packageId: string | null;
}

export function LearningState({ currentAccount, swimmers, packageId }: ILearningStateProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">학습 상태</h2>
      <p className="mt-3 text-sm text-gray-600">현재 연결 정보와 패키지 준비 상태를 한눈에 확인하세요.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs uppercase text-blue-600 font-semibold">연결된 지갑</p>
          <p className="mt-1 text-sm font-mono text-gray-800">
            {currentAccount?.address
              ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
              : '지갑 미연결'}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs uppercase text-emerald-600 font-semibold">보유한 Swimmer</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{swimmers.length}</p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
          <p className="text-xs uppercase text-purple-600 font-semibold">패키지 상태</p>
          <p className="mt-1 text-sm text-gray-800">{packageId ? '✅ 준비 완료' : '배포 필요'}</p>
        </div>
      </div>
    </section>
  );
}
