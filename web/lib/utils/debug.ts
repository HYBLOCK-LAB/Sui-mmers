// 디버깅 유틸리티

export function debugTransaction(tx: any) {
  console.log('=== Transaction Debug Info ===')
  console.log('Transaction type:', typeof tx)
  console.log('Transaction constructor:', tx.constructor.name)
  console.log('Transaction methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(tx)))
  console.log('Transaction properties:', Object.keys(tx))
  console.log('==============================')
}

export function debugModuleData(modules: any, dependencies: any) {
  console.log('=== Module Data Debug Info ===')
  console.log('Modules:', modules)
  console.log('Modules type:', typeof modules)
  console.log('Is array?', Array.isArray(modules))
  if (Array.isArray(modules) && modules.length > 0) {
    console.log('First module type:', typeof modules[0])
    console.log('First module constructor:', modules[0]?.constructor?.name)
    console.log('First module length:', modules[0]?.length)
    console.log('First 20 bytes:', modules[0]?.slice(0, 20))
  }
  console.log('Dependencies:', dependencies)
  console.log('Dependencies type:', typeof dependencies)
  console.log('Is array?', Array.isArray(dependencies))
  console.log('==============================')
}