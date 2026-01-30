/**
 * ComfyUI Data Manager - SSH Dialog Component
 */

import { getComfyTheme, type ComfyTheme } from '../../utils/theme.js'
import type { SSHCredential } from '../../api/ssh.js'
import { sshConnect, sshSaveCredential, sshListCredentials, requireElementById } from '../../utils/helpers.js'

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

  // 已保存凭证选择器
  const savedCredsContainer = createSavedCredentialsSelector(theme)
  form.appendChild(savedCredsContainer.container)

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

  // 加载已保存的凭证
  loadSavedCredentials(savedCredsContainer.select)

  connectBtn.onclick = async () => {
    const host = requireElementById<HTMLInputElement>('dm-ssh-host').value.trim()
    const port = requireElementById<HTMLInputElement>('dm-ssh-port').value.trim()
    const username = requireElementById<HTMLInputElement>('dm-ssh-username').value.trim()
    const password = requireElementById<HTMLInputElement>('dm-ssh-password').value
    const saveCreds = requireElementById<HTMLInputElement>('dm-ssh-save-creds').checked

    if (!host || !username) {
      alert('请填写主机地址和用户名')
      return
    }

    connectBtn.disabled = true
    connectBtn.textContent = '连接中...'

    try {
      const result = await sshConnect(host, parseInt(port) || 22, username, password)

      // Save credentials to server
      if (saveCreds) {
        try {
          await sshSaveCredential({
            id: `${username}@${host}:${parseInt(port) || 22}`,
            name: `${username}@${host}`,
            host,
            port: parseInt(port) || 22,
            username,
            password,
            created: new Date().toISOString(),
          })
          console.log('[DataManager] SSH 凭证已保存到服务器')
        } catch (error) {
          console.warn('[DataManager] 保存 SSH 凭证失败:', error)
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

/**
 * 创建已保存凭证选择器
 */
function createSavedCredentialsSelector(theme: ComfyTheme): {
  container: HTMLElement
  select: HTMLSelectElement
} {
  const container = document.createElement('div')
  container.style.cssText = 'display: flex; flex-direction: column; gap: 4px;'

  const labelEl = document.createElement('label')
  labelEl.style.cssText = `font-size: 12px; color: ${theme.textSecondary};`
  labelEl.textContent = '已保存的凭证'

  const select = document.createElement('select')
  select.id = 'dm-ssh-saved-creds'
  select.className = 'dm-select'
  select.style.cssText = `
    padding: 8px 10px;
    border: 1px solid ${theme.borderColor};
    border-radius: 4px;
    font-size: 14px;
    background: ${theme.inputBg};
    color: ${theme.inputText};
    cursor: pointer;
  `
  select.innerHTML = '<option value="">-- 选择已保存的凭证 --</option>'

  // 凭证选择时自动填充表单
  select.onchange = () => {
    const selectedValue = select.value
    if (!selectedValue) return

    try {
      const cred = JSON.parse(selectedValue) as SSHCredential
      requireElementById<HTMLInputElement>('dm-ssh-host').value = cred.host
      requireElementById<HTMLInputElement>('dm-ssh-port').value = String(cred.port)
      requireElementById<HTMLInputElement>('dm-ssh-username').value = cred.username
      // 密码不自动填充，需要用户重新输入
      requireElementById<HTMLInputElement>('dm-ssh-save-creds').checked = true
    } catch (e) {
      console.warn('[DataManager] 解析凭证失败:', e)
    }
  }

  container.appendChild(labelEl)
  container.appendChild(select)

  return { container, select }
}

/**
 * 从服务器加载已保存的凭证
 */
async function loadSavedCredentials(select: HTMLSelectElement): Promise<void> {
  try {
    const response = await sshListCredentials()
    if (response.success && response.credentials.length > 0) {
      // 保留默认选项
      select.innerHTML = '<option value="">-- 选择已保存的凭证 --</option>'
      // 添加凭证选项
      response.credentials.forEach((cred) => {
        const option = document.createElement('option')
        option.value = JSON.stringify(cred)
        option.textContent = `${cred.name} (${cred.host}:${cred.port})`
        select.appendChild(option)
      })
      console.log(`[DataManager] 已加载 ${response.credentials.length} 个 SSH 凭证`)
    } else {
      select.innerHTML = '<option value="">-- 暂无已保存的凭证 --</option>'
    }
  } catch (error) {
    console.warn('[DataManager] 加载 SSH 凭证列表失败:', error)
    select.innerHTML = '<option value="">-- 加载凭证失败 --</option>'
  }
}
