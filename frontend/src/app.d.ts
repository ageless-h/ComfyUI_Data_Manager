/**
 * Type declarations for ComfyUI modules
 * These types are only available at runtime when loaded by ComfyUI
 */

declare module '*/scripts/app.js' {
  export const app: ComfyApp
  export { app as default }
}

declare module '../../scripts/app.js' {
  export const app: ComfyApp
  export { app as default }
}

declare module '*/scripts/*.js' {
  const content: unknown
  export default content
}

interface ComfyExtensionConfig {
  name: string
  version?: string
  setup?: () => void
  cleanup?: () => void
  [key: string]: unknown
}

interface ComfyApp {
  registerExtension: (config: ComfyExtensionConfig) => void
  ui?: {
    version?: {
      major: number
      minor: number
      patch: number
    }
  }
  graph?: {
    _nodes: ComfyNode[]
    add: (node: ComfyNode) => void
    remove: (node: ComfyNode) => void
    serialize: () => unknown
    getNodeById: (id: number) => ComfyNode | undefined
  }
  extensionManager?: {
    toast?: {
      add: (message: { text: string; type?: string }) => void
    }
  }
}

interface ComfyNode {
  id: number
  widgets?: ComfyWidget[]
  [key: string]: unknown
}

interface ComfyWidget {
  name: string
  value: unknown
  [key: string]: unknown
}

// Declare global types
declare global {
  interface Window {
    app?: ComfyApp
    FileManagerState?: unknown
    openFileManager?: () => void
    openFloatingPreview?: (path: string) => void
    toggleFullscreen?: () => void
    restoreFloatingPreview?: () => void
    closeFloatingPreview?: () => void
    updateDock?: () => void
    checkNodeConnectionAndUpdateFormat?: () => void
    _remoteConnectionsState?: {
      active: unknown | null
      saved: unknown[]
    }
  }
}

export {}
