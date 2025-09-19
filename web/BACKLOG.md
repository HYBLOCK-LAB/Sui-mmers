# 🏊 Sui Swimming Game - Task Management

## 프로젝트 개요
Sui 블록체인 기반 수영 게임 교육 플랫폼 - Move 언어를 게임으로 학습

## Task Organization

### ✅ DONE
- [x] **BACKLOG-001**: BACKLOG.md 태스크 관리 시스템 구축
- [x] **ENV-001**: React + TypeScript 프로젝트 초기화
- [x] **ENV-002**: 필수 라이브러리 설치
- [x] **ENV-003**: 프로젝트 구조 설정
- [x] **MOVE-001**: Swimmer NFT 모듈 작성
- [x] **CORE-001**: Sui 지갑 연동 구현
- [x] **CORE-002**: 코드 에디터 컴포넌트
- [x] **UI-001**: 레이아웃 컴포넌트
- [x] **UI-002**: 수영장 시각화 컴포넌트
- [x] **UI-003**: 수영 캐릭터 컴포넌트
- [x] **UI-004**: 상태 표시 UI
- [x] **LESSON-001**: 레슨 1 - "첫 번째 수영 선수 만들기"

### 🚧 IN_PROGRESS

### 📋 TODO

#### Phase 1: 환경 설정 (30분)
- [ ] **ENV-001**: React + TypeScript 프로젝트 초기화
  - Vite 사용하여 빠른 개발 환경 구축
  - TypeScript 설정
  - ESLint/Prettier 설정
  
- [ ] **ENV-002**: 필수 라이브러리 설치
  - @mysten/sui.js (Sui SDK)
  - @mysten/wallet-standard
  - @suiet/wallet-kit (지갑 연동)
  - @monaco-editor/react (코드 에디터)
  - tailwindcss (스타일링)
  
- [ ] **ENV-003**: 프로젝트 구조 설정
  ```
  src/
    components/     # UI 컴포넌트
    contracts/      # Move 바이트코드
    hooks/          # React 커스텀 훅
    services/       # Sui 블록체인 서비스
    utils/          # 유틸리티 함수
    types/          # TypeScript 타입 정의
  ```

#### Phase 2: Move 스마트 컨트랙트 (30분)
- [ ] **MOVE-001**: Swimmer NFT 모듈 작성
  - NFT 구조체 정의 (id, name, speed, style, stamina, medals)
  - create_swimmer 함수
  - train 함수
  - get_stats 함수
  
- [ ] **MOVE-002**: Move 모듈 컴파일 및 바이트코드 추출
  - Sui CLI로 testnet 용 컴파일
  - Base64 인코딩
  - 프론트엔드에 임베딩

#### Phase 3: 핵심 기능 구현 (90분)
- [ ] **CORE-001**: Sui 지갑 연동 구현
  - WalletProvider 설정
  - 연결/해제 UI
  - 지갑 상태 관리
  - 멀티 지갑 지원 (Sui Wallet, Suiet)
  
- [ ] **CORE-002**: 코드 에디터 컴포넌트
  - Monaco Editor 통합
  - Move 문법 하이라이팅
  - 템플릿 코드 로딩
  - 파라미터 추출 로직
  
- [ ] **CORE-003**: 블록체인 배포 서비스
  - 바이트코드 배포 함수
  - 트랜잭션 빌더
  - 가스 추정
  - 에러 처리
  
- [ ] **CORE-004**: NFT 조회 서비스
  - 사용자 NFT 목록 조회
  - NFT 상태 읽기
  - 실시간 업데이트 (이벤트 구독)

#### Phase 4: UI/UX 구현 (60분)
- [ ] **UI-001**: 레이아웃 컴포넌트
  - 3-column 레이아웃 (설명/에디터/수영장)
  - 반응형 디자인
  - 다크/라이트 모드
  
- [ ] **UI-002**: 수영장 시각화 컴포넌트
  - 수영장 배경 CSS
  - 레인 표시
  - 물결 애니메이션
  
- [ ] **UI-003**: 수영 캐릭터 컴포넌트
  - SVG/CSS 캐릭터
  - 수영 스타일별 애니메이션 (자유형/배영/평영/접영)
  - 속도에 따른 애니메이션 속도 조절
  
- [ ] **UI-004**: 상태 표시 UI
  - 능력치 바 (speed, stamina)
  - 메달 카운트
  - 트랜잭션 상태 토스트

#### Phase 5: 레슨 시스템 (30분)
- [ ] **LESSON-001**: 레슨 1 - "첫 번째 수영 선수 만들기"
  - 설명 콘텐츠 작성
  - 템플릿 코드 준비
  - 성공 조건 검증
  - 완료 시 축하 메시지

#### Phase 6: 테스트 및 배포 (30분)
- [ ] **TEST-001**: 단위 테스트
  - 유틸리티 함수 테스트
  - 컴포넌트 테스트
  
- [ ] **TEST-002**: 통합 테스트
  - 지갑 연동 플로우
  - NFT 생성 플로우
  - 에러 시나리오
  
- [ ] **TEST-003**: Testnet 배포 테스트
  - 실제 testnet 배포
  - 가스비 확인
  - 성능 측정
  
- [ ] **DEPLOY-001**: 프로덕션 빌드
  - 최적화 빌드
  - 환경 변수 설정
  - Vercel/Netlify 배포 설정

### 📦 BACKLOG (향후 기능)

#### 추가 레슨 시스템
- [ ] **LESSON-002**: "수영 훈련하기" - train 함수 학습
- [ ] **LESSON-003**: "수영 스타일 변경" - 구조체 수정 학습
- [ ] **LESSON-004**: "팀 만들기" - 컬렉션 학습
- [ ] **LESSON-005**: "수영 대회" - 함수 호출 학습

#### 게임 기능 확장
- [ ] **GAME-001**: PvP 수영 경주 기능
- [ ] **GAME-002**: 리더보드 시스템
- [ ] **GAME-003**: 토너먼트 모드
- [ ] **GAME-004**: 훈련 미니게임

#### 기술적 개선
- [ ] **TECH-001**: Move 컴파일러 WASM 통합
- [ ] **TECH-002**: 코드 자동 완성 기능
- [ ] **TECH-003**: 오프라인 모드 지원
- [ ] **TECH-004**: 다국어 지원

#### 커뮤니티 기능
- [ ] **COMMUNITY-001**: 사용자 제작 레슨
- [ ] **COMMUNITY-002**: 코드 공유 기능
- [ ] **COMMUNITY-003**: 포럼/디스코드 연동

## 작업 원칙
1. 각 태스크는 독립적으로 테스트 가능해야 함
2. 커밋 전 사용자 승인 필수
3. 테스트 커버리지 80% 이상 유지
4. 문서화 동시 진행

## 진행 상황 추적
- 전체 태스크: 37개
- 완료: 12개
- 진행중: 0개
- 대기: 25개
- 진행률: 32%

## 리스크 및 이슈
- RPC 노드 불안정성 → 멀티 엔드포인트 준비
- 지갑 호환성 → 다중 지갑 라이브러리 사용
- Move 컴파일 복잡성 → 사전 컴파일된 바이트코드 사용

## 참고 링크
- [Sui 공식 문서](https://docs.sui.io)
- [Move 언어 가이드](https://move-language.github.io)
- [Sui TypeScript SDK](https://github.com/MystenLabs/sui/tree/main/sdk/typescript)