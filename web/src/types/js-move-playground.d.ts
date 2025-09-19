declare module '@imcoding.online/js-move-playground' {
  export interface BuildResult {
    success: boolean
    error?: string
    output?: string
    bytecode?: any
  }
  
  export interface Project {
    name: string
    createFile(path: string, content: string): Promise<void>
    readFile(path: string): Promise<string | Uint8Array>
    deleteFile(path: string): Promise<void>
    renameFile(oldPath: string, newPath: string): Promise<void>
    listFiles(): Promise<string[]>
    build(): Promise<BuildResult>
    test(): Promise<any>
    run(scriptPath: string): Promise<any>
    close(): Promise<void>
  }
  
  export function setup(): Promise<void>
  export function openProject(name: string): Promise<Project>
  export function deleteProject(name: string): Promise<void>
  export function listProjects(): Promise<string[]>
}