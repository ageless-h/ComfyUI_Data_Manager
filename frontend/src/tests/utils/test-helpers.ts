/**
 * Test Helper Utilities
 *
 * Common helper functions and utilities for writing tests.
 * Provides DOM element creators, mock data generators, and test setup utilities.
 */

/**
 * Creates a mock file info object
 * @param overrides - Partial file info to override defaults
 * @returns A mock file info object
 */
export function createMockFileInfo(
  overrides: Partial<{
    name: string
    path: string
    type: string
    size: number
    modified: string
  }> = {}
): {
  name: string
  path: string
  type: string
  size: number
  modified: string
} {
  return {
    name: overrides.name ?? 'test_file.jpg',
    path: overrides.path ?? '/path/to/test_file.jpg',
    type: overrides.type ?? 'file',
    size: overrides.size ?? 1024000,
    modified: overrides.modified ?? new Date().toISOString(),
  }
}

/**
 * Creates multiple mock file info objects
 * @param count - Number of mock files to create
 * @param prefix - Optional prefix for file names
 * @returns An array of mock file info objects
 */
export function createMockFileList(
  count: number,
  prefix: string = 'file'
): Array<{
  name: string
  path: string
  type: string
  size: number
  modified: string
}> {
  return Array.from({ length: count }, (_, i) => ({
    name: `${prefix}_${i + 1}.jpg`,
    path: `/path/to/${prefix}_${i + 1}.jpg`,
    type: 'file',
    size: 1024000 * (i + 1),
    modified: new Date().toISOString(),
  }))
}

/**
 * Creates a mock DOM element with specified attributes
 * @param tagName - HTML tag name
 * @param attributes - Object containing element attributes
 * @returns A DOM element with specified attributes
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string> = {},
  children: HTMLElement[] = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value
    } else if (key === 'id') {
      element.id = value
    } else if (key === 'textContent') {
      element.textContent = value
    } else if (key === 'innerHTML') {
      element.innerHTML = value
    } else {
      element.setAttribute(key, value)
    }
  })

  children.forEach((child) => element.appendChild(child))

  return element
}

/**
 * Creates a mock file input element
 * @param files - Array of mock File objects
 * @returns An HTMLInputElement configured as a file input
 */
export function createFileInput(files: File[] = []): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = files.length > 1

  // Mock the files property (readonly)
  Object.defineProperty(input, 'files', {
    value: files,
    writable: false,
  })

  return input
}

/**
 * Creates a mock File object
 * @param name - File name
 * @param size - File size in bytes
 * @param type - MIME type
 * @returns A mock File object
 */
export function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File {
  const file = new File(['test content'], name, { type })
  // Mock the size property
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Creates a mock MouseEvent
 * @param type - Event type (e.g., 'click', 'mousedown')
 * @param options - Event options
 * @returns A MouseEvent object
 */
export function createMouseEvent(type: string, options: MouseEventInit = {}): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    ...options,
  })
}

/**
 * Creates a mock keyboard event
 * @param type - Event type (e.g., 'keydown', 'keyup')
 * @param key - Key value
 * @param options - Additional event options
 * @returns A KeyboardEvent object
 */
export function createKeyboardEvent(
  type: string,
  key: string,
  options: KeyboardEventInit = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

/**
 * Waits for the next animation frame
 * @returns Promise that resolves on next animation frame
 */
export function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/**
 * Waits for a specified amount of time
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Flushes all pending promises
 * @returns Promise that resolves when microtask queue is empty
 */
export function flushPromises(): Promise<void> {
  return Promise.resolve()
}

/**
 * Creates a mock fetch response
 * @param data - Response data
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @returns A mock Response object
 */
export function createMockResponse<T>(
  data: T,
  status: number = 200,
  statusText: string = 'OK'
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(data)).buffer,
    headers: new Headers(),
    type: 'basic' as ResponseType,
    url: '',
    body: null as Response['body'],
    bodyUsed: false,
    clone: function () {
      return this
    },
  } as unknown as Response
}

/**
 * Creates a mock error response
 * @param message - Error message
 * @param status - HTTP status code
 * @returns A mock error Response object
 */
export function createMockErrorResponse(message: string, status: number = 500): Response {
  return createMockResponse({ error: message }, status, 'Error')
}

/**
 * Mock data generators for common file types
 */
export const mockFileData = {
  image: {
    name: 'test_image.jpg',
    path: '/images/test_image.jpg',
    type: 'image',
    size: 2048000,
    modified: new Date().toISOString(),
    ext: '.jpg',
  },
  video: {
    name: 'test_video.mp4',
    path: '/videos/test_video.mp4',
    type: 'video',
    size: 10240000,
    modified: new Date().toISOString(),
    ext: '.mp4',
  },
  audio: {
    name: 'test_audio.mp3',
    path: '/audio/test_audio.mp3',
    type: 'audio',
    size: 5120000,
    modified: new Date().toISOString(),
    ext: '.mp3',
  },
  document: {
    name: 'test_doc.pdf',
    path: '/docs/test_doc.pdf',
    type: 'document',
    size: 256000,
    modified: new Date().toISOString(),
    ext: '.pdf',
  },
  csv: {
    name: 'test_data.csv',
    path: '/data/test_data.csv',
    type: 'spreadsheet',
    size: 1024,
    modified: new Date().toISOString(),
    ext: '.csv',
  },
} as const

/**
 * Creates a mock directory listing response
 * @param files - Optional array of files to include
 * @returns A mock directory listing response
 */
export function createMockDirectoryListing(files: ReturnType<typeof createMockFileInfo>[] = []): {
  files: Array<{
    name: string
    path: string
    type: string
    size: number
    modified: string
  }>
  path: string
} {
  return {
    files: files.length > 0 ? files : [createMockFileInfo()],
    path: '/test/path',
  }
}

/**
 * Clears document body between tests
 */
export function clearDocumentBody(): void {
  document.body.innerHTML = ''
}

/**
 * Sets up a basic test environment
 * @returns Cleanup function to restore environment
 */
export function setupTestEnvironment(): () => void {
  clearDocumentBody()

  return () => {
    clearDocumentBody()
  }
}
