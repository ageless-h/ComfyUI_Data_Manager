/**
 * ComfyUI Data Manager - SSH Dialog Component
 */

import { getComfyTheme, type ComfyTheme } from '../../utils/theme.js'

/**
 * SSH dialog options
 */
export interface SshDialogOptions {
  onConnect?: (result: unknown) => void
}

/**
 * Create SSH connection dialog
 * @param options - Configuration options
 * @returns Dialog element
 */
export function createSshDialog(options: SshDialogOptions = {}): HTMLElement {
  const { onConnect } = options

  const dialog = document.createElement('div')
  dialog.className = 'dm-modal-overlay'
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `

  const theme = getComfyTheme()

  const modal = document.createElement('div')
  modal.style.cssText = `
    background: ${theme.bgPrimary};
    border: 1px solid ${theme.borderColor};
    border-radius: 12px;
    padding: 20px;
    width: 380px;
    max-width: calc(100vw - 40px);
  `

  // Title
  const title = document.createElement('div')
  title.style.cssText = `
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  title.innerHTML = `<span>SSH 连接</span>`
  modal.appendChild(title)

  // Form
  const form = document.createElement('div')
  form.style.cssText = 'display: flex; flex-direction: column; gap: 12px;'

  form.appendChild(createInput('主机地址', 'dm-ssh-host', 'text', '192.168.1.100'))
  form.appendChild(createInput('端口', 'dm-ssh-port', 'number', '22'))
  form.appendChild(createInput('用户名', 'dm-ssh-username', 'text', ''))
  form.appendChild(createInput('密码', 'dm-ssh-password', 'password', ''))

  // Save option
  const saveLabel = document.createElement('label')
  saveLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 12px;'
  saveLabel.innerHTML = `
    <input type="checkbox" id="dm-ssh-save-creds">
    <span>保存凭据</span>
  `
  form.appendChild(saveLabel)

  modal.appendChild(form)

  // Buttons
  const btnGroup = document.createElement('div')
  btnGroup.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'comfy-btn'
  cancelBtn.textContent = '取消'
  cancelBtn.style.cssText = 'padding: 8px 16px;'

  const connectBtn = document.createElement('button')
  connectBtn.className = 'comfy-btn'
  connectBtn.innerHTML = '连接'
  connectBtn.style.cssText = 'padding: 8px 16px;'

  btnGroup.appendChild(cancelBtn)
  btnGroup.appendChild(connectBtn)
  modal.appendChild(btnGroup)

  dialog.appendChild(modal)

  // Events
  cancelBtn.onclick = () => dialog.remove()
  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.remove()
  }

  connectBtn.onclick = async () => {
    const host = (document.getElementById('dm-ssh-host') as HTMLInputElement).value.trim()
    const port = (document.getElementById('dm-ssh-port') as HTMLInputElement).value.trim()
    const username = (document.getElementById('dm-ssh-username') as HTMLInputElement).value.trim()
    const password = (document.getElementById('dm-ssh-password') as HTMLInputElement).value
    const saveCreds = (document.getElementById('dm-ssh-save-creds') as HTMLInputElement).checked

    if (!host || !username) {
      alert('请填写主机地址和用户名')
      return
    }

    connectBtn.disabled = true
    connectBtn.textContent = '连接中...'

    try {
      const { sshConnect } = await import('../../api/ssh.js')
      const result = await sshConnect(host, parseInt(port) || 22, username, password)

      // Save credentials
      if (saveCreds) {
        const connInfo = {
          id: (result as { connection_id: string }).connection_id,
          name: `${username}@${host}`,
          host,
          port: parseInt(port) || 22,
          username,
          password: btoa(password),
          created: new Date().toISOString(),
        }
        const state = (window as unknown as { _remoteConnectionsState: { saved: unknown[] } })
          ._remoteConnectionsState
        state.saved.push(connInfo)
        try {
          localStorage.setItem(
            'comfyui_datamanager_remote_connections',
            JSON.stringify(state.saved)
          )
        } catch (e) {
          console.warn('[DataManager] Failed to save connections:', e)
        }
      }

      if (onConnect) onConnect(result)
      dialog.remove()
    } catch (error) {
      alert('连接失败: ' + (error as Error).message)
      connectBtn.disabled = false
      connectBtn.textContent = '连接'
    }
  }

  return dialog
}

/**
 * Create input field
 */
function createInput(label: string, id: string, type: string, placeholder: string): HTMLElement {
  const theme = getComfyTheme()

  const container = document.createElement('div')
  container.style.cssText = 'display: flex; flex-direction: column; gap: 4px;'

  const labelEl = document.createElement('label')
  labelEl.style.cssText = `font-size: 12px; color: ${theme.textSecondary};`
  labelEl.textContent = label

  const input = document.createElement('input')
  input.id = id
  input.type = type
  input.className = 'dm-input'
  input.placeholder = placeholder
  input.style.cssText = `
    padding: 8px 10px;
    border: 1px solid ${theme.borderColor};
    border-radius: 4px;
    font-size: 14px;
    background: ${theme.inputBg};
    color: ${theme.inputText};
  `

  container.appendChild(labelEl)
  container.appendChild(input)

  return container
}
