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

## 🎯 How to Play

### Step 1: Connect Your Wallet
Click the glowing "Connect Wallet" button in the header and select your Sui wallet.

### Step 2: 패키지 1회 배포 (필수)
1. 브라우저 Move 컴파일러가 준비되면
2. "패키지 배포하기" 버튼을 눌러 테스트넷에 Swimmer 패키지를 1회 배포합니다
3. 지갑에서 트랜잭션을 승인합니다

### Step 3: 선수 NFT 민팅
1. Customize your swimmer's attributes:
   - **Name**: Give your swimmer a unique name
   - **Speed**: Set swimming speed (10-100)
   - **Stamina**: Set endurance level (50-100)
   - **Style**: Choose swimming style (자유형, 배영, 평영, 접영)
2. "🚀 NFT 민팅하기" 버튼으로 선수를 생성합니다
3. Approve the transaction in your wallet

### Step 4: Watch Them Swim!
Your swimmers will appear in the animated pool with unique animations based on their style.

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

The Swimmer NFT contract includes:

```move
public struct Swimmer has key, store {
    id: UID,
    name: String,
    speed: u64,      // Swimming speed (10-100)
    style: u8,       // 0: 자유형, 1: 배영, 2: 평영, 3: 접영
    stamina: u64,    // Endurance level (50-100)
    medals: u64,     // Achievement medals
}
```

### Core Functions
- `create_swimmer`: Mint a new swimmer NFT with custom attributes
- `train`: Improve swimmer's speed and stamina
- `award_medal`: Award medals for achievements
- `change_style`: Modify swimming technique

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

### Phase 1: Foundation ✅
- [x] Next.js migration
- [x] Modern web3 design system
- [x] Browser-based Move compiler
- [x] Basic NFT creation

### Phase 2: Enhanced Features 🚧
- [ ] Server-side Move compilation API
- [ ] Swimming competitions (PvP)
- [ ] Training system implementation
- [ ] Achievement system

### Phase 3: Advanced 📋
- [ ] Multiplayer swimming races
- [ ] Leaderboards and rankings
- [ ] Additional lessons (2-10)
- [ ] Mobile responsive optimization

### Phase 4: Community 🌐
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