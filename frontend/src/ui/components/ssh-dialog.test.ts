// -*- coding: utf-8 -*-
/**
 * Tests for ssh-dialog.ts - SSH 连接对话框组件
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSshDialog } from './ssh-dialog.js'
import { mockTheme, mockSSHConnection, mockSSHCredentials, mockApiResponses, cleanupMockDOM } from '../../../tests/fixtures/ui-fixtures.js'

// Mock window.alert globally
const mockAlert = vi.fn()
global.alert = mockAlert

// Mock theme
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => mockTheme,
}))

// Mock SSH API
vi.mock('../../api/ssh.js', () => ({
  sshConnect: vi.fn(),
  sshSaveCredential: vi.fn(),
  sshListCredentials: vi.fn(),
}))

describe('ssh-dialog', () => {
  beforeEach(() => {
    cleanupMockDOM()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  describe('createSshDialog', () => {
    it('should create dialog with modal overlay', () => {
      const dialog = createSshDialog()

      expect(dialog.className).toBe('dm-modal-overlay')
      expect(dialog.style.position).toBe('fixed')
    })

    it('should create modal container', () => {
      const dialog = createSshDialog()
      const modal = dialog.firstElementChild as HTMLElement

      expect(modal).toBeTruthy()
      expect(modal?.style.background).toBe(mockTheme.bgPrimary)
    })

    it('should create form with required inputs', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      const hostInput = document.getElementById('dm-ssh-host') as HTMLInputElement
      const portInput = document.getElementById('dm-ssh-port') as HTMLInputElement
      const usernameInput = document.getElementById('dm-ssh-username') as HTMLInputElement
      const passwordInput = document.getElementById('dm-ssh-password') as HTMLInputElement

      expect(hostInput).toBeTruthy()
      expect(hostInput?.type).toBe('text')
      expect(portInput).toBeTruthy()
      expect(portInput?.type).toBe('number')
      expect(usernameInput).toBeTruthy()
      expect(passwordInput).toBeTruthy()
      expect(passwordInput?.type).toBe('password')
    })

    it('should create save credentials checkbox', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      const saveCheckbox = document.getElementById('dm-ssh-save-creds') as HTMLInputElement

      expect(saveCheckbox).toBeTruthy()
      expect(saveCheckbox?.type).toBe('checkbox')
    })

    it('should create action buttons', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      const buttons = dialog.querySelectorAll('button')
      const cancelButton = Array.from(buttons).find((b) => b.textContent === '取消')
      const connectButton = Array.from(buttons).find((b) => b.textContent === '连接')

      expect(cancelButton).toBeTruthy()
      expect(connectButton).toBeTruthy()
    })

    it('should close dialog on cancel button click', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      const cancelButton = Array.from(dialog.querySelectorAll('button')).find(
        (b) => b.textContent === '取消'
      ) as HTMLElement

      cancelButton?.click()

      expect(document.body.contains(dialog)).toBe(false)
    })

    it('should close dialog on overlay click', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      dialog.dispatchEvent(new MouseEvent('click', { target: dialog }))

      expect(document.body.contains(dialog)).toBe(false)
    })
  })

  describe('SSH connection', () => {
    it('should call onConnect callback on successful connection', async () => {
      const { sshConnect } = await import('../../api/ssh.js')
      vi.mocked(sshConnect).mockResolvedValue(mockApiResponses.sshConnectSuccess)

      const onConnect = vi.fn()
      const dialog = createSshDialog({ onConnect })
      document.body.appendChild(dialog)

      // Fill form
      ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
      ;(document.getElementById('dm-ssh-port') as HTMLInputElement).value = '22'
      ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'
      ;(document.getElementById('dm-ssh-password') as HTMLInputElement).value = 'password123'

      const connectButton = Array.from(dialog.querySelectorAll('button')).find(
        (b) => b.textContent === '连接'
      ) as HTMLElement

      await connectButton?.click()

      expect(sshConnect).toHaveBeenCalledWith('192.168.1.100', 22, 'admin', 'password123')
      expect(onConnect).toHaveBeenCalledWith(mockApiResponses.sshConnectSuccess)
    })

    it('should save credentials when checkbox is checked', async () => {
      const { sshConnect, sshSaveCredential } = await import('../../api/ssh.js')
      vi.mocked(sshConnect).mockResolvedValue(mockApiResponses.sshConnectSuccess)
      vi.mocked(sshSaveCredential).mockResolvedValue({ success: true })

      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      // Fill form and check save checkbox
      ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
      ;(document.getElementById('dm-ssh-port') as HTMLInputElement).value = '22'
      ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'
      ;(document.getElementById('dm-ssh-password') as HTMLInputElement).value = 'password123'
      ;(document.getElementById('dm-ssh-save-creds') as HTMLInputElement).checked = true

      const connectButton = Array.from(dialog.querySelectorAll('button')).find(
        (b) => b.textContent === '连接'
      ) as HTMLElement

      await connectButton?.click()

      expect(sshSaveCredential).toHaveBeenCalled()
    })

    it('should show alert on connection failure', async () => {
      const { sshConnect } = await import('../../api/ssh.js')
      vi.mocked(sshConnect).mockRejectedValue(new Error('Connection failed'))

      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      // Fill form
      ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
      ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'

      const connectButton = Array.from(dialog.querySelectorAll('button')).find(
        (b) => b.textContent === '连接'
      ) as HTMLElement

      await connectButton?.click()

      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('连接失败'))
    })

    it('should validate form before connecting', async () => {
      const { sshConnect } = await import('../../api/ssh.js')
      mockAlert.mockClear()

      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      // Leave form empty
      const connectButton = Array.from(dialog.querySelectorAll('button')).find(
        (b) => b.textContent === '连接'
      ) as HTMLElement

      await connectButton?.click()

      expect(sshConnect).not.toHaveBeenCalled()
      expect(mockAlert).toHaveBeenCalledWith('请填写主机地址和用户名')
    })
  })

  describe('Saved credentials selector', () => {
    it('should load saved credentials on dialog creation', async () => {
      const { sshListCredentials } = await import('../../api/ssh.js')
      vi.mocked(sshListCredentials).mockResolvedValue({
        success: true,
        credentials: mockSSHCredentials,
      })

      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      // Wait for async load
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(sshListCredentials).toHaveBeenCalled()
    })

    it('should populate form when credential is selected', async () => {
      const { sshListCredentials } = await import('../../api/ssh.js')
      vi.mocked(sshListCredentials).mockResolvedValue({
        success: true,
        credentials: mockSSHCredentials,
      })

      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      // Wait for credentials to load
      await new Promise((resolve) => setTimeout(resolve, 0))

      const select = document.getElementById('dm-ssh-saved-creds') as HTMLSelectElement
      select.value = JSON.stringify(mockSSHCredentials[0])
      select.dispatchEvent(new Event('change'))

      expect((document.getElementById('dm-ssh-host') as HTMLInputElement).value).toBe(
        mockSSHCredentials[0].host
      )
      expect((document.getElementById('dm-ssh-username') as HTMLInputElement).value).toBe(
        mockSSHCredentials[0].username
      )
    })
  })

  describe('Input fields', () => {
    it('should have correct placeholder values', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      const hostInput = document.getElementById('dm-ssh-host') as HTMLInputElement

      expect(hostInput.placeholder).toBe('192.168.1.100')
    })

    it('should have port input with type number', () => {
      const dialog = createSshDialog()
      document.body.appendChild(dialog)

      const portInput = document.getElementById('dm-ssh-port') as HTMLInputElement

      expect(portInput?.type).toBe('number')
    })
  })
})
