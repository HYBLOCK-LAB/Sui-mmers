import { Transaction } from '@mysten/sui/transactions'

/**
 * Server-based Move compiler that uses the API endpoint
 */
export class ServerMoveCompiler {
  /**
   * Compile Move code using the server API
   */
  static async compileMove(
    moduleName: string,
    sourceCode: string
  ): Promise<{ bytecode: string; dependencies: string[] }> {
    try {
      console.log('Compiling Move code via server API...')
      
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moveCode: sourceCode,
          moduleName: moduleName,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Compilation failed')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Compilation failed')
      }
      
      console.log('✅ Move code compiled successfully via server')
      console.log('Compilation logs:', result.logs)
      
      return {
        bytecode: result.bytecode,
        dependencies: result.dependencies || [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000002'
        ]
      }
    } catch (error) {
      console.error('Server compilation failed:', error)
      throw new Error(`Failed to compile Move code: ${(error as Error).message}`)
    }
  }
  
  /**
   * Create deploy transaction with compiled bytecode
   */
  static async createDeployTransaction(
    moduleName: string,
    sourceCode: string
  ): Promise<Transaction> {
    // Compile the Move code via server
    const { bytecode, dependencies } = await this.compileMove(moduleName, sourceCode)
    
    // Create transaction
    const tx = new Transaction()
    
    // Convert base64 bytecode to Uint8Array
    const bytecodeBytes = Uint8Array.from(atob(bytecode), c => c.charCodeAt(0))
    
    console.log('Creating deploy transaction with:', {
      bytecodeSize: bytecodeBytes.length,
      dependencies: dependencies
    })
    
    // Publish the package
    const result = tx.publish({
      modules: [bytecodeBytes],
      dependencies: dependencies,
    })
    
    // Transfer UpgradeCap to sender
    if (result) {
      const upgradeCap = Array.isArray(result) ? result[0] : result
      tx.transferObjects([upgradeCap], tx.gas)
    }
    
    return tx
  }
}