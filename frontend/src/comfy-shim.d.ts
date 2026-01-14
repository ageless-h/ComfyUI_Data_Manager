/**
 * ComfyUI Shim Module Declaration
 * This file declares the ComfyUI modules that are available at runtime
 */

// Shim for scripts/app.js
declare module '../../../scripts/app.js' {
  export const app: ComfyApp
  export { app as default }
}

// Shim for scripts/*.js generic pattern
declare module '*scripts*.js' {
  const content: unknown
  export default content
}
