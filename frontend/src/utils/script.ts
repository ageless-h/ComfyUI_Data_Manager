/**
 * ComfyUI Data Manager - Script Loading Utilities
 */

/**
 * Dynamically load external script
 * @param src - Script URL
 * @returns Promise that resolves when script is loaded
 */
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
