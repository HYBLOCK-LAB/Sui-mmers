# Sui 수영 게임 교육 플랫폼 - 프로덕트 사양서

## 1. 프로덕트 개요

### 1.1 비전
크립토좀비의 교육 방식을 차용하여, Move 언어와 Sui 블록체인을 게임으로 학습하는 플랫폼. 
좀비 대신 수영(Swimming) 테마를 사용하여 더 친근하고 스포츠적인 이미지 구축.

### 1.2 핵심 가치
- **Learning by Doing**: 코드 작성 즉시 블록체인에 배포하여 결과 확인
- **Visual Feedback**: 작성한 코드가 수영 캐릭터의 능력치와 동작으로 시각화
- **No Backend**: 서버 비용 없이 완전 탈중앙화 운영

## 2. MVP 범위 정의 (실제 구현)

### 2.1 구현 완료 기능
- ✅ Move 코드 에디터 (Monaco Editor 기반)
- ✅ Sui 지갑 연동 (@mysten/dapp-kit)
- ✅ 템플릿 기반 Move 모듈 배포
- ✅ 수영 캐릭터 NFT 생성 및 조회
- ✅ 수영장 UI (SwimmingPool 컴포넌트)
- ✅ Session 1, 2 (총 5개 레슨)
- ✅ Gameplay Console 페이지
- ✅ 아이템 시스템 (TunaCan)
- ✅ 자동 전진 시스템

### 2.2 미구현 기능
- ❌ 실제 Move 컴파일러 통합 (템플릿 사용 중)
- ❌ 리더보드 시스템
- ❌ 토너먼트 기능
- ❌ 백엔드 서버
- ❌ 사용자 인증 시스템

## 3. 기술 스택 결정

### 3.1 프론트엔드: Next.js + TypeScript (실제 구현)

**구현 내역:**
- Next.js 15로 마이그레이션 완료
- @mysten/dapp-kit 통합
- Monaco Editor 코드 에디터 통합
- Tailwind CSS + Glassmorphism 디자인

### 3.2 블록체인: Sui Testnet

**선택 근거:**
- 무료 테스트 토큰 (Faucet)
- 1-2초 빠른 finality
- 객체 중심 모델이 NFT 구현에 적합

### 3.3 스마트 컨트랙트: Move

**실제 구현:**
- 템플릿 기반 배포 시스템 (moveTemplates.ts)
- 브라우저 컴파일러 시도 (js-move-playground - 미작동)
- 서버 API 컴파일 (/api/compile)
- 수동 CLI 배포 후 패키지 ID 사용

## 4. 아키텍처 설계

### 4.1 데이터 흐름
```
사용자 → 코드 에디터(템플릿) → 파라미터 추출 
→ 지갑 서명 → Sui RPC → 블록체인 배포 
→ 이벤트 구독 → UI 업데이트
```

### 4.2 상태 관리
- **온체인**: 수영 캐릭터 NFT, 게임 진행 상태
- **로컬**: 사용자 설정, 임시 데이터 (LocalStorage)
- **메모리**: 현재 세션 정보 (React State)

## 5. Move 모듈 설계

### 5.1 실제 구현된 구조 (moveTemplates.ts)

#### Swimmer NFT 구조
```move
public struct Swimmer has key, store {
    id: UID,
    owner: address,
    name: String,
    species: String,  // 종류
    distance_traveled: u64,  // 이동 거리
    base_speed_per_hour: u64,  // 시간당 속도
    last_update_timestamp_ms: u64,  // 마지막 업데이트 시간
}
```

#### TunaCan 아이템
```move
public struct TunaCan has key, store {
    id: UID,
    energy: u64,  // 보너스 거리
}
```

### 5.2 구현된 핵심 함수
- `mint_swimmer`: 새 수영 선수 NFT 민팅
- `update_progress`: 자동 전진 (시간 기반)
- `mint_tuna`: 참치 아이템 생성
- `eat_tuna`: 참치 소비로 거리 보너스

### 5.3 문제점
- **구버전 코드** (`swimmer.move`): speed, style, stamina 구조
- **신버전 코드** (`moveTemplates.ts`): distance_traveled 구조
- **불일치 해결 필요**

## 6. UI/UX 설계

### 6.1 화면 구성
```
+------------------+------------------+
|     설명 영역     |    코드 에디터    |
|                  |                  |
| Move 개념 설명    |  템플릿 코드      |
| 현재 레슨 목표    |  사용자 수정 가능  |
+------------------+------------------+
|           수영장 시각화               |
|                                     |
|     [수영 캐릭터 애니메이션]          |
|     속도: 75  체력: 80  메달: 3      |
+-------------------------------------+
```

### 6.2 인터랙션 플로우
1. 설명 읽기 → 2. 코드 수정 → 3. 지갑 연결 → 4. 배포 
→ 5. 트랜잭션 대기 → 6. 결과 시각화

## 7. 개발 타임라인 (3시간)

### Phase 1: 환경 설정 (30분)
- 프로젝트 초기화
- 의존성 설치
- Move 모듈 컴파일

### Phase 2: 핵심 기능 (90분)
- 지갑 연동 구현
- 코드 에디터 통합
- 배포 로직 구현

### Phase 3: UI 구현 (60분)
- 수영장 UI 컴포넌트
- CSS 애니메이션
- 반응형 레이아웃

### Phase 4: 통합 테스트 (30분)
- Testnet 배포 테스트
- 버그 수정
- 최종 확인

## 8. 리스크 및 대응 방안

### 8.1 기술적 리스크
| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|-----------|
| RPC 노드 불안정 | 중 | 높음 | 여러 RPC 엔드포인트 준비 |
| 지갑 연동 실패 | 낮음 | 높음 | 다중 지갑 지원 |
| 가스비 부족 | 중 | 중간 | Faucet 링크 제공 |

### 8.2 시간 리스크
- Move 컴파일 이슈: 미리 테스트된 바이트코드 사용
- UI 구현 지연: 최소 기능 UI로 단순화
- 디버깅 시간 초과: 에러 처리 최소화, 로깅 강화

## 9. 성공 지표 (달성 현황)

### 9.1 MVP 성공 기준
- [x] 사용자가 지갑을 연결할 수 있음 ✅
- [x] 템플릿 코드를 수정할 수 있음 ✅
- [x] 수정한 코드로 NFT를 배포할 수 있음 ✅
- [x] 배포된 NFT가 UI에 표시됨 ✅
- [x] 레슨 시스템 구현 ✅
- [x] 아이템 시스템 구현 ✅

### 9.2 사용자 경험 지표
- 지갑 연결부터 NFT 생성까지: 2분 이내 ✅
- 첫 페이지 로드: 3초 이내 ✅
- 자동 전진 시스템 작동 ✅
- Gameplay Console 구현 ✅

## 10. 향후 확장 계획

### 10.1 단기 (1주)
- 추가 레슨 5개 (함수, 구조체, 제네릭 등)
- 수영 대회 기능 (PvP)
- 리더보드

### 10.2 중기 (1개월)
- Move 컴파일러 통합 (서버 또는 WASM)
- 커뮤니티 제작 레슨
- 토큰 이코노미 설계

### 10.3 장기 (3개월)
- Sui 생태계 프로젝트 연동
- 실제 DeFi 프로토콜 학습
- 자격증/인증서 발급

## 11. 필요 리소스

### 11.1 개발 환경
- Node.js 18+
- Sui CLI
- 코드 에디터 (VS Code 권장)
- Sui Testnet 계정

### 11.2 외부 서비스
- Sui Testnet RPC: https://fullnode.testnet.sui.io
- Faucet: https://faucet.testnet.sui.io
- 블록 익스플로러: https://suiexplorer.com

## 12. 참고 자료
- Sui 공식 문서: https://docs.sui.io
- Move 언어 가이드: https://move-language.github.io
- 크립토좀비: https://cryptozombies.io (참고용)