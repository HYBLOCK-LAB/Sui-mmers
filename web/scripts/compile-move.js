#!/usr/bin/env node

/**
 * Move 모듈 컴파일 스크립트
 * 
 * 사용법: node scripts/compile-move.js
 * 
 * 참고: Sui CLI가 설치되어 있어야 함
 * cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const MOVE_PROJECT_PATH = path.join(__dirname, '../move')
const OUTPUT_PATH = path.join(__dirname, '../src/contracts/compiled')

// 출력 디렉토리 생성
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true })
}

console.log('🔨 Compiling Move modules...')

try {
  // Move 프로젝트 빌드
  execSync(`sui move build --path ${MOVE_PROJECT_PATH} --skip-fetch-latest-git-deps`, {
    stdio: 'inherit'
  })
  
  console.log('✅ Move modules compiled successfully!')
  
  // 컴파일된 바이트코드 읽기
  const buildPath = path.join(MOVE_PROJECT_PATH, 'build/swimming/bytecode_modules')
  
  if (fs.existsSync(buildPath)) {
    const modules = {}
    
    // 모든 .mv 파일 읽기
    const files = fs.readdirSync(buildPath)
    files.forEach(file => {
      if (file.endsWith('.mv')) {
        const moduleName = file.replace('.mv', '')
        const filePath = path.join(buildPath, file)
        const bytecode = fs.readFileSync(filePath)
        const base64 = bytecode.toString('base64')
        
        modules[moduleName] = {
          name: moduleName,
          bytecode: base64,
          hex: bytecode.toString('hex')
        }
        
        console.log(`📦 Module ${moduleName}: ${base64.length} bytes (base64)`)
      }
    })
    
    // TypeScript 파일로 저장
    const tsContent = `// Auto-generated Move bytecode
// Generated at: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

export const COMPILED_MODULES = ${JSON.stringify(modules, null, 2)} as const

export type ModuleName = keyof typeof COMPILED_MODULES
`
    
    fs.writeFileSync(
      path.join(OUTPUT_PATH, 'moveModules.ts'),
      tsContent
    )
    
    console.log('✅ Bytecode saved to src/contracts/compiled/moveModules.ts')
    
    // 배포 정보 파일 생성
    const deployInfo = {
      compiledAt: new Date().toISOString(),
      modules: Object.keys(modules),
      network: 'testnet',
      suiVersion: getSuiVersion()
    }
    
    fs.writeFileSync(
      path.join(OUTPUT_PATH, 'deploy-info.json'),
      JSON.stringify(deployInfo, null, 2)
    )
    
  } else {
    console.error('❌ Build directory not found:', buildPath)
    process.exit(1)
  }
  
} catch (error) {
  console.error('❌ Compilation failed:', error.message)
  
  // Sui CLI 설치 확인
  try {
    execSync('sui --version', { stdio: 'ignore' })
  } catch {
    console.error('\n⚠️  Sui CLI not found!')
    console.error('Please install Sui CLI first:')
    console.error('cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui')
  }
  
  process.exit(1)
}

function getSuiVersion() {
  try {
    const version = execSync('sui --version', { encoding: 'utf8' })
    return version.trim()
  } catch {
    return 'unknown'
  }
}

console.log('\n📝 Next steps:')
console.log('1. Use the compiled bytecode in your application')
console.log('2. Deploy using MoveCompiler.createPublishTransaction()')
console.log('3. Update PACKAGE_ID with the deployed address')