/**
 * ComfyUI Data Manager - SSH API
 */

export interface SSHConnectOptions {
  host: string
  port: number
  username: string
  password: string
}

export interface SSHConnectResponse {
  success?: boolean
  connection_id: string
  host?: string
  port?: number
  username?: string
  root_path?: string
  message?: string
  error?: string
}

export interface SSHListResponse {
  files: unknown[]
  path: string
  connection_id: string
}

/**
 * SSH 凭证接口
 */
export interface SSHCredential {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  created?: string | null
}

/**
 * 保存凭证响应
 */
export interface SSHSaveCredentialResponse {
  success: boolean
  credential?: SSHCredential
  error?: string
}

/**
 * 列出凭证响应
 */
export interface SSHListCredentialsResponse {
  success: boolean
  credentials: SSHCredential[]
  count: number
  error?: string
}

/**
 * 删除凭证响应
 */
export interface SSHDeleteCredentialResponse {
  success: boolean
  error?: string
}

/**
 * Connect to SSH host
 * @param host - Host address
 * @param port - Port number
 * @param username - Username
 * @param password - Password
 * @returns Connection result
 */
export async function sshConnect(
  host: string,
  port: number,
  username: string,
  password: string
): Promise<SSHConnectResponse> {
  const response = await fetch('/dm/ssh/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host,
      port: port || 22,
      username,
      password,
    }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: '连接失败' }))) as SSHConnectResponse
    throw new Error(error.error || error.message || 'SSH 连接失败')
  }

  return (await response.json()) as SSHConnectResponse
}

/**
 * Disconnect SSH connection
 * @param connectionId - Connection ID
 * @returns Disconnect result
 */
export async function sshDisconnect(
  connectionId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch('/dm/ssh/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connection_id: connectionId }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: '断开失败' }))) as Record<
      string,
      unknown
    >
    throw new Error((error.error as string) || (error.message as string) || 'SSH 断开失败')
  }

  return await response.json()
}

/**
 * List remote directory contents
 * @param connectionId - Connection ID
 * @param path - Remote path
 * @returns Directory contents
 */
export async function sshList(connectionId: string, path = '.'): Promise<SSHListResponse> {
  const response = await fetch('/dm/ssh/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connection_id: connectionId,
      path,
    }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: '列出目录失败' }))) as Record<
      string,
      unknown
    >
    throw new Error((error.error as string) || (error.message as string) || 'SSH 列出目录失败')
  }

  return (await response.json()) as SSHListResponse
}

/**
 * 保存 SSH 连接凭证到服务器
 * @param credential - 凭证信息
 * @returns 保存结果
 */
export async function sshSaveCredential(
  credential: SSHCredential
): Promise<SSHSaveCredentialResponse> {
  const response = await fetch('/dm/ssh/credentials/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: '保存凭证失败' }))) as SSHSaveCredentialResponse
    throw new Error(error.error || '保存 SSH 凭证失败')
  }

  return (await response.json()) as SSHSaveCredentialResponse
}

/**
 * 获取已保存的 SSH 凭证列表
 * @returns 凭证列表
 */
export async function sshListCredentials(): Promise<SSHListCredentialsResponse> {
  const response = await fetch('/dm/ssh/credentials/list', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: '获取凭证列表失败' }))) as SSHListCredentialsResponse
    throw new Error(error.error || '获取 SSH 凭证列表失败')
  }

  return (await response.json()) as SSHListCredentialsResponse
}

/**
 * 删除已保存的 SSH 凭证
 * @param credentialId - 凭证 ID
 * @returns 删除结果
 */
export async function sshDeleteCredential(
  credentialId: string
): Promise<SSHDeleteCredentialResponse> {
  const response = await fetch('/dm/ssh/credentials/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: credentialId }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: '删除凭证失败' }))) as SSHDeleteCredentialResponse
    throw new Error(error.error || '删除 SSH 凭证失败')
  }

  return (await response.json()) as SSHDeleteCredentialResponse
}
