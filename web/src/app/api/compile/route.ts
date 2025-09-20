import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let tempDir: string | null = null
  try {
    const { moveCode, moduleName = 'swimmer' } = await request.json()

    if (!moveCode) {
      return NextResponse.json({ error: 'Move code is required' }, { status: 400 })
    }

    tempDir = path.join(os.tmpdir(), `move-compile-${randomBytes(8).toString('hex')}`)

    await fs.mkdir(tempDir, { recursive: true })
    await fs.mkdir(path.join(tempDir, 'sources'), { recursive: true })

    const moveToml = `[package]
name = "swimming"
version = "0.0.1"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

[addresses]
swimming = "0x0"`

    await fs.writeFile(path.join(tempDir, 'Move.toml'), moveToml)
    await fs.writeFile(path.join(tempDir, 'sources', `${moduleName}.move`), moveCode)

    console.log('Compiling Move code in directory:', tempDir)
    console.log('Module name:', moduleName)
    
    const { stdout, stderr } = await execAsync('sui move build --skip-fetch-latest-git-deps', { cwd: tempDir })
    
    console.log('Compilation stdout:', stdout)
    if (stderr) {
      console.log('Compilation stderr:', stderr)
    }

    const bytecodeFile = path.join(tempDir, 'build', 'swimming', 'bytecode_modules', `${moduleName}.mv`)
    const bytecode = await fs.readFile(bytecodeFile)
    const bytecodeBase64 = bytecode.toString('base64')

    await fs.rm(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      bytecode: bytecodeBase64,
      dependencies: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      ],
      logs: stdout,
    })
  } catch (error: any) {
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.error('Failed to cleanup temp directory:', cleanupError)
      }
    }

    console.error('Compilation error:', error)
    
    // Extract more detailed error information
    let errorMessage = 'Compilation failed'
    let errorLogs = ''
    
    if (error?.message) {
      errorMessage = error.message
    }
    if (error?.stderr) {
      errorLogs = error.stderr
      errorMessage = `${errorMessage}\n${error.stderr}`
    }
    if (error?.stdout && !errorLogs) {
      errorLogs = error.stdout
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        logs: errorLogs,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
