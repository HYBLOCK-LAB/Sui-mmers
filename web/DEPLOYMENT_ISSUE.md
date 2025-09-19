# 컨트랙트 배포 이슈 및 해결 방안

## 현재 문제
- **오류**: `VMVerificationOrDeserializationError in command 0`
- **원인**: 로컬 컴파일된 Move 바이트코드가 Sui 테스트넷과 호환되지 않음

## 문제 상세
1. **버전 불일치**: 로컬 Sui CLI (1.56.1)와 테스트넷 Move 런타임 버전이 다름
2. **바이트코드 형식**: 미리 컴파일된 바이트코드는 특정 Move 버전에 종속적
3. **검증 실패**: 테스트넷이 바이트코드를 검증할 수 없음

## 해결 방안

### 방법 1: Sui CLI를 통한 직접 배포 (권장)
```bash
# 1. Sui CLI 설정
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# 2. 활성 주소 설정
sui client active-address

# 3. 테스트넷 토큰 받기 (Faucet)
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "<YOUR_ADDRESS>"
    }
}'

# 4. 컨트랙트 배포
cd move
sui client publish --gas-budget 100000000
```

### 방법 2: 웹 IDE 사용
1. [Sui Playground](https://playground.sui.io) 방문
2. Move 코드 붙여넣기
3. 테스트넷에 직접 배포

### 방법 3: WebAssembly Move 컴파일러 통합 (향후)
- 브라우저에서 Move 소스 코드를 직접 컴파일
- 테스트넷과 호환되는 바이트코드 생성
- 현재 개발 중

## 임시 해결책
개발/테스트 목적으로는:
1. 미리 배포된 패키지 ID 사용: `0x...` (실제 배포 후 입력)
2. 시뮬레이션 모드로 개발 진행
3. CLI 배포 후 패키지 ID를 앱에 하드코딩

## 기술적 제약사항
- 브라우저에서 직접 Move 컴파일은 현재 불가능
- 바이트코드는 Move 런타임 버전에 강하게 종속적
- 테스트넷은 특정 버전의 Move 바이트코드만 수용

## 권장 워크플로우
1. **개발**: 로컬에서 Move 코드 작성 및 테스트
2. **배포**: Sui CLI를 통한 테스트넷 배포
3. **통합**: 배포된 패키지 ID를 웹앱에 통합
4. **상호작용**: 웹앱에서 배포된 컨트랙트와 상호작용

## 참고 자료
- [Sui Move 문서](https://docs.sui.io/build/move)
- [Sui CLI 가이드](https://docs.sui.io/build/cli-client)
- [Sui 테스트넷 Faucet](https://docs.sui.io/build/faucet)