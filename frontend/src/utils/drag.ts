/**
 * ComfyUI Data Manager - Drag Utilities
 */

/**
 * Setup window drag functionality
 * Adds event listeners dynamically on drag start, removes on drag end
 * @param windowEl - Window element
 * @param header - Header element (drag handle area)
 */
export function setupWindowDrag(windowEl: HTMLElement, header: HTMLElement): void {
  // Disable native drag to prevent ghost image
  windowEl.draggable = false;
  header.draggable = false;

  // Prevent native drag events
  windowEl.addEventListener("dragstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  header.addEventListener("mousedown", (e) => {
    // Exclude buttons and icons
    if (e.target && (e.target as HTMLElement).tagName === "BUTTON" || (e.target as HTMLElement).tagName === "I") return;

    // Don't allow dragging when fullscreen
    if (windowEl.dataset.fullscreen === "true") return;

    // Prevent default behavior (including native drag)
    e.preventDefault();

    const rect = windowEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Remove transition for performance
    windowEl.style.transition = "none";

    // Clear transform, use left/top positioning
    windowEl.style.transform = "none";
    windowEl.style.left = rect.left + "px";
    windowEl.style.top = rect.top + "px";

    // Mark as dragging
    (windowEl as unknown as { _isDragging: boolean })._isDragging = true;

    // Define mousemove handler
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!(windowEl as unknown as { _isDragging: boolean })._isDragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      windowEl.style.left = Math.max(0, x) + "px";
      windowEl.style.top = Math.max(0, y) + "px";
    };

    // Define mouseup handler
    const mouseUpHandler = () => {
      // Restore transition
      windowEl.style.transition = "";

      // Clear dragging flag
      (windowEl as unknown as { _isDragging: boolean })._isDragging = false;

      // Immediately remove listeners
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    // Add listeners to document (ensure response even when mouse leaves window)
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  });
}

/**
 * Cleanup window drag state
 * @param windowEl - Window element
 */
export function cleanupWindowDrag(windowEl: HTMLElement): void {
  if ((windowEl as unknown as { _isDragging?: boolean })._isDragging) {
    (windowEl as unknown as { _isDragging: boolean })._isDragging = false;
    windowEl.style.transition = "";
  }
}
