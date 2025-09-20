import { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'

const execAsync = promisify(exec)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { moveCode, moduleName: requestedModuleName = 'swimmer' } = req.body

  if (!moveCode) {
    return res.status(400).json({ error: 'Move code is required' })
  }

  // 임시 디렉토리 생성
  const tempDir = path.join(os.tmpdir(), `move-compile-${randomBytes(8).toString('hex')}`)
  
  try {
    // 간단 파서: 모듈 주소 별칭과 모듈 이름 추출
    const modMatch = /module\s+([A-Za-z_][A-Za-z0-9_]*)::([A-Za-z_][A-Za-z0-9_]*)\s*\{/.exec(moveCode)
    const addrAlias = modMatch?.[1] || 'swimming'
    const actualModuleName = modMatch?.[2] || requestedModuleName

    // 프로젝트 구조 생성
    await fs.mkdir(tempDir, { recursive: true })
    await fs.mkdir(path.join(tempDir, 'sources'), { recursive: true })
    
    // Move.toml 생성
    // Move.toml 생성 (동적으로 주소 별칭 포함)
    const moveToml = `[package]
name = "swimming"
version = "0.0.1"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet" }

[addresses]
swimming = "0x0"
${addrAlias !== 'swimming' ? `${addrAlias} = "0x0"` : ''}`
    
    await fs.writeFile(path.join(tempDir, 'Move.toml'), moveToml)
    
    // Move 소스 코드 저장
    await fs.writeFile(
      path.join(tempDir, 'sources', `${actualModuleName}.move`),
      moveCode
    )
    
    // Sui CLI를 사용하여 컴파일
    const { stdout, stderr } = await execAsync(
      'sui move build --skip-fetch-latest-git-deps',
      { cwd: tempDir }
    )
    
    // 컴파일된 바이트코드 읽기
    const bytecodeFile = path.join(
      tempDir,
      'build',
      'swimming',
      'bytecode_modules',
      `${actualModuleName}.mv`
    )
    
    const bytecode = await fs.readFile(bytecodeFile)
    const bytecodeBase64 = bytecode.toString('base64')
    
    // 정리
    await fs.rm(tempDir, { recursive: true, force: true })
    
    return res.status(200).json({
      success: true,
      bytecode: bytecodeBase64,
      dependencies: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002'
      ],
      logs: stdout
    })
    
  } catch (error: any) {
    // 정리
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {}
    
    console.error('Compilation error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Compilation failed',
      logs: error.stderr || error.stdout || ''
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
