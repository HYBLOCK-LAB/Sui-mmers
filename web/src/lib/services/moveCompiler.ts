import { Transaction } from '@mysten/sui/transactions'
import { fromBase64, toBase64 } from '@mysten/sui/utils'
import { SWIMMER_BYTECODE } from '@/src/contracts/compiled/swimmerBytecode'
import { debugTransaction, debugModuleData } from '@/lib/utils/debug'

// Move 모듈 메타데이터
export interface MoveModule {
  name: string
  bytecode: string // Base64 인코딩된 바이트코드
  dependencies: string[]
}

// Sui 표준 라이브러리 주소 (정규화된 형식)
const SUI_STDLIB_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000001'
const SUI_FRAMEWORK_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000002'

// 실제 컴파일된 Move 바이트코드
const PRECOMPILED_SWIMMER_MODULE = {
  name: 'swimmer',
  bytecode: SWIMMER_BYTECODE,
  dependencies: [SUI_STDLIB_ADDRESS, SUI_FRAMEWORK_ADDRESS]
}

export class MoveCompiler {
  /**
   * Move 모듈을 배포하는 트랜잭션 생성
   */
  static createPublishTransaction(modules: MoveModule[]): Transaction {
    const tx = new Transaction()
    
    try {
      // 모듈 바이트코드 배열 준비 - Uint8Array 형태로 변환
      const moduleBytes = modules.map(module => {
        // Base64 디코딩하여 Uint8Array 반환
        const decoded = fromBase64(module.bytecode)
        console.log(`Module ${module.name} decoded:`, decoded.length, 'bytes')
        return decoded // fromBase64는 이미 Uint8Array를 반환
      })
      
      // 의존성 준비 - string[] 형태
      const dependencies = [...new Set(modules.flatMap(m => m.dependencies || []))]
      
      console.log('Publishing package with:', {
        modulesCount: moduleBytes.length,
        dependencies,
        firstModuleSize: moduleBytes[0]?.length
      })
      
      // 디버깅 정보 출력
      debugTransaction(tx)
      debugModuleData(moduleBytes, dependencies)
      
      // 패키지 배포 트랜잭션
      const result = tx.publish({
        modules: moduleBytes,
        dependencies: dependencies,
      })
      
      console.log('Publish result:', result)
      
      // UpgradeCap을 트랜잭션 발신자에게 전송
      // 배포 결과가 배열인 경우 첫 번째 요소를 사용, 아니면 result 자체를 사용
      const upgradeCap = Array.isArray(result) ? result[0] : result
      if (upgradeCap) {
        tx.transferObjects([upgradeCap], tx.gas)
      }
    } catch (error) {
      console.error('Failed to create publish transaction:', error)
      throw error
    }
    
    return tx
  }
  
  /**
   * 템플릿 코드를 Move 소스 코드로 변환
   */
  static templateToMoveSource(
    template: string,
    params: Record<string, any>
  ): string {
    let source = template
    
    // 파라미터 치환
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      source = source.replace(new RegExp(placeholder, 'g'), String(value))
    })
    
    return source
  }
  
  /**
   * 미리 컴파일된 모듈 가져오기
   */
  static getPrecompiledModule(): MoveModule {
    return PRECOMPILED_SWIMMER_MODULE
  }
  
  /**
   * Move 소스 코드를 바이트코드로 "컴파일" (시뮬레이션)
   * 실제로는 미리 컴파일된 바이트코드를 반환
   */
  static async compile(
    source: string,
    moduleName: string
  ): Promise<MoveModule> {
    // 실제 컴파일 대신 미리 컴파일된 모듈 반환
    // TODO: WebAssembly Move 컴파일러 통합 시 실제 컴파일 구현
    console.log('Simulating compilation of:', moduleName)
    console.log('Source code:', source.substring(0, 100) + '...')
    
    return PRECOMPILED_SWIMMER_MODULE
  }
  
  /**
   * 배포 결과에서 패키지 ID 추출
   */
  static extractPackageId(result: any): string | null {
    try {
      console.log('Extracting package ID from result:', result)
      
      // 트랜잭션 결과에서 생성된 객체들 확인
      const objectChanges = result?.objectChanges || result?.effects?.created || []
      console.log('Object changes:', objectChanges)
      
      // published 타입 찾기 (새로운 형식)
      const publishedPackage = objectChanges.find(
        (change: any) => change.type === 'published'
      )
      
      if (publishedPackage?.packageId) {
        console.log('Found package ID from published:', publishedPackage.packageId)
        return publishedPackage.packageId
      }
      
      // created 타입에서 package 찾기 (이전 형식)
      const createdObjects = objectChanges.filter(
        (change: any) => change.type === 'created'
      )
      
      const packageObject = createdObjects.find(
        (obj: any) => obj.objectType === 'package' || obj.packageId
      )
      
      if (packageObject?.packageId) {
        console.log('Found package ID from created:', packageObject.packageId)
        return packageObject.packageId
      }
      
      // 다른 위치에서도 찾기
      if (result?.effects?.created) {
        const firstCreated = result.effects.created[0]
        if (firstCreated?.owner?.ObjectOwner) {
          console.log('Found potential package ID:', firstCreated.owner.ObjectOwner)
          return firstCreated.owner.ObjectOwner
        }
      }
      
      console.warn('Could not find package ID in result')
      return null
    } catch (error) {
      console.error('Failed to extract package ID:', error)
      return null
    }
  }
  
  /**
   * 패키지 주소 검증
   */
  static isValidPackageAddress(address: string): boolean {
    // Sui 주소는 0x로 시작하고 64자의 16진수
    const addressRegex = /^0x[a-fA-F0-9]{64}$/
    return addressRegex.test(address)
  }
}