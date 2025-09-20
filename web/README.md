# 🏊 Sui Swimming - Learn Move by Gaming

<p align="center">
  <img src="https://img.shields.io/badge/Sui-4A90E2?style=for-the-badge&logo=sui&logoColor=white" alt="Sui"/>
  <img src="https://img.shields.io/badge/Move-FF6B6B?style=for-the-badge&logo=move&logoColor=white" alt="Move"/>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
</p>

<p align="center">
  <strong>A gamified educational platform for learning Move programming language through creating and managing swimming athlete NFTs on the Sui blockchain.</strong>
</p>

## ✨ Features

### 🎮 Gamified Learning Experience
- **Interactive Lessons**: Learn Move programming through hands-on coding exercises
- **Visual Feedback**: See your code come to life with animated swimming pool visualization
- **Progressive Difficulty**: Start with basic NFT creation and advance to complex smart contracts
- **Real-time NFT Updates**: Watch your swimmers appear and move in the pool

### 🛠️ Technical Highlights
- **Browser-based Move Compiler**: Compile Move code directly in your browser using js-move-playground
- **Server-side Compilation**: Next.js API routes for robust Move compilation
- **Real-time Code Editor**: Monaco editor with Move syntax highlighting
- **Live Deployment**: Deploy smart contracts to Sui testnet with one click
- **Wallet Integration**: Seamless connection with Sui wallets (@mysten/dapp-kit)

### 🎨 Modern Web3 Gaming Design
- **Glassmorphism UI**: Sleek glass-effect cards with backdrop blur
- **Neon Cyberpunk Aesthetics**: Dynamic gradient backgrounds with glow effects
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Responsive Design**: Optimized for all screen sizes
- **Custom Design System**: Tailored for web3 gaming with Orbitron and Space Grotesk fonts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Sui Wallet (Sui Wallet, Suiet, or Ethos)
- Test SUI tokens from [Testnet Faucet](https://faucet.testnet.sui.io)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sui-swimming.git
cd sui-swimming/web
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## ⚠️ Important Notes

### 현재 이슈
- **Move 컴파일러**: 브라우저 컴파일러가 실제로 작동하지 않음 (템플릿 방식 사용 중)
- **코드 불일치**: `swimmer.move`와 `moveTemplates.ts`가 다른 구조 사용
- **수동 배포**: Sui CLI를 통한 수동 배포 후 패키지 ID 입력 필요

### 해결 방법
1. Sui CLI로 직접 배포: `sui client publish --gas-budget 100000000`
2. 배포된 패키지 ID를 복사하여 앱에 입력
3. 자세한 내용은 `DEPLOYMENT_ISSUE.md` 참조

## 🎯 How to Play

### Step 1: Connect Your Wallet
Click the glowing "Connect Wallet" button in the header and select your Sui wallet.

### Step 2: 패키지 1회 배포 (필수)
1. 브라우저 Move 컴파일러가 준비되면
2. "패키지 배포하기" 버튼을 눌러 테스트넷에 Swimmer 패키지를 1회 배포합니다
3. 지갑에서 트랜잭션을 승인합니다
   > 💡 현재 브라우저 컴파일이 작동하지 않으면 CLI 배포를 사용하세요

### Step 3: 선수 NFT 민팅
1. Customize your swimmer's attributes:
   - **Name**: 선수 이름 입력
   - **Species**: 선수 종류 입력 (예: 돌고래, 상어, 인간 등)
2. "🚀 NFT 민팅하기" 버튼으로 선수를 생성합니다
3. 지갑에서 트랜잭션을 승인합니다

### Step 4: Gameplay Console에서 게임하기
1. "🎮 Gameplay Console로 이동" 버튼 클릭
2. 자동 전진: "⏱ 자동 전진" 버튼으로 시간 경과에 따른 거리 증가
3. 아이템 사용: "🍣 참치 민팅" 후 "🍽 Swimmer에게 먹이기"로 보너스 거리 획득
4. 실시간으로 수영장에서 선수들의 위치 확인

## 📁 Project Structure

```
web/
├── components/             # React components with modern design
│   ├── CodeEditor.tsx     # Move code editor with parameters
│   ├── DeployContract.tsx # Smart contract deployment UI
│   ├── Lesson.tsx        # Learning content display
│   ├── SwimmingPool.tsx  # Animated swimmer visualization
│   └── WalletConnect.tsx # Glassmorphic wallet connection
├── lib/                   # Core libraries
│   ├── services/         # Service layer
│   │   ├── apiMoveCompiler.ts      # Server-side Move compilation
│   │   ├── browserMoveCompiler.ts  # Client-side compilation
│   │   ├── moveCompiler.ts         # Move compilation utilities
│   │   └── suiService.ts          # Sui blockchain interactions
│   └── utils/            # Utility functions
│       ├── cn.ts         # Class name merger
│       └── debug.ts      # Debugging utilities
├── pages/                # Next.js pages
│   ├── api/             # API routes
│   │   └── compile.ts   # Move compilation endpoint
│   ├── _app.tsx        # App wrapper with providers
│   └── index.tsx       # Main application page
├── src/                 # Source files
│   ├── contracts/      # Move contracts
│   │   ├── compiled/   # Compiled bytecode
│   │   └── moveTemplates.ts # Move code templates
│   └── utils/          # Additional utilities
├── styles/             # Global styles
│   └── globals.css    # Tailwind CSS and custom web3 design
├── move/              # Move source files
│   └── sources/       # Move modules
│       └── swimmer.move # Swimmer NFT contract
└── public/            # Static assets
```

## 📚 Move Contract Overview

### 실제 구현된 구조 (moveTemplates.ts)

```move
public struct Swimmer has key, store {
    id: UID,
    owner: address,
    name: String,
    species: String,                     // 선수 종류
    distance_traveled: u64,              // 총 이동 거리
    base_speed_per_hour: u64,           // 시간당 기본 속도
    last_update_timestamp_ms: u64,      // 마지막 업데이트 시간
}

public struct TunaCan has key, store {
    id: UID,
    energy: u64,                        // 보너스 거리
}
```

### Core Functions
- `mint_swimmer`: 새 수영 선수 NFT 민팅
- `update_progress`: 시간 경과에 따른 자동 전진
- `mint_tuna`: 참치 아이템 생성
- `eat_tuna`: 참치 소비로 보너스 거리 획득

> ⚠️ **Note**: `move/sources/swimmer.move`와 구조가 다름 (통일 필요)

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS + Custom Web3 Design System
- **Animation**: Framer Motion for smooth transitions
- **Code Editor**: Monaco Editor with Move syntax support
- **State Management**: React Hooks + TanStack Query

### Blockchain
- **Network**: Sui Testnet/Mainnet
- **Smart Contract**: Move Language
- **SDK**: @mysten/sui, @mysten/dapp-kit
- **Wallet Integration**: Sui Wallet Standard

### Build Tools
- **Bundler**: Next.js built-in (Webpack/Turbopack)
- **Package Manager**: npm/yarn/pnpm
- **Type Checking**: TypeScript 5.9+
- **Linting**: ESLint with Next.js config

## 🎨 Design System

### Visual Identity
- **Theme**: Cyberpunk Gaming with Web3 aesthetics
- **Effects**: Glassmorphism, neon glows, holographic gradients
- **Animation**: Floating elements, pulse effects, wave animations

### Color Palette
```css
Primary:   Cyan (#06B6D4) → Purple (#8B5CF6)
Accent:    Pink (#EC4899), Lime (#84CC16)
Gaming:    Purple (#8B5CF6), Cyan (#06B6D4)
Background: Dark gradients with cyber grid overlay
```

### Typography
- **Headings**: Orbitron (futuristic gaming font)
- **Body**: Space Grotesk (clean web3 sans-serif)

### UI Components
- Glass cards with backdrop blur
- Neon glow effects on hover
- Gradient buttons with shine animation
- Animated loading states
- 3D transform on card hover

## 🔧 Configuration

### Environment Variables
```env
# .env.local (optional)
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=your_package_id
```

### Tailwind Configuration
Custom animations and web3 color system are configured in `tailwind.config.js`

## 📈 Roadmap

### Phase 1: Foundation ✅ (완료)
- [x] Next.js migration
- [x] Modern web3 design system  
- [x] Browser-based Move compiler (템플릿 방식)
- [x] Basic NFT creation
- [x] Session 1, 2 레슨 시스템
- [x] Gameplay Console 페이지
- [x] 아이템 시스템 (TunaCan)
- [x] 자동 전진 시스템

### Phase 2: 긴급 수정 🔴 (진행 중)
- [ ] Move 코드 통일 (swimmer.move vs moveTemplates.ts)
- [ ] 브라우저 Move 컴파일러 실제 구현
- [ ] 배포 프로세스 자동화
- [ ] 문서 일관성 확보

### Phase 3: 주요 기능 🚧
- [ ] 리더보드 시스템 (공유 레지스트리)
- [ ] Swimming competitions (PvP)
- [ ] Session 3+ 추가 레슨
- [ ] Achievement system

### Phase 4: Advanced 📋
- [ ] Multiplayer swimming races
- [ ] Mobile responsive optimization
- [ ] WebAssembly Move 컴파일러
- [ ] 실시간 업데이트 (WebSocket)

### Phase 5: Community 🌐
- [ ] User profiles
- [ ] Social features
- [ ] NFT marketplace
- [ ] Tournament system

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sui Foundation** for blockchain infrastructure
- **Move Team** for the programming language
- **Vercel** for Next.js framework
- **Tailwind Labs** for CSS framework
- **Framer** for animation library
- **Community** contributors and testers

## 📞 Support

- **Documentation**: [Sui Docs](https://docs.sui.io)
- **Move Language**: [Move Book](https://move-language.github.io)
- **Issues**: [GitHub Issues](https://github.com/yourusername/sui-swimming/issues)
- **Discord**: Join our community server
- **Twitter**: [@SuiSwimming](https://twitter.com/suiswimming)

---

<p align="center">
  <strong>Made with ❤️ for Sui Blockchain Education</strong>
</p>

<p align="center">
  <sub>Built with cutting-edge web3 technologies and modern design principles</sub>
</p>