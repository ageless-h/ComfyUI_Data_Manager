/**
 * ComfyUI Data Manager - SSH API
 */

export interface SSHConnectOptions {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface SSHConnectResponse {
  connection_id: string;
  message?: string;
  error?: string;
}

export interface SSHListResponse {
  files: unknown[];
  path: string;
  connection_id: string;
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
  const response = await fetch("/dm/ssh/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host,
      port: port || 22,
      username,
      password
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "连接失败" })) as SSHConnectResponse;
    throw new Error(error.error || error.message || "SSH 连接失败");
  }

  return await response.json() as SSHConnectResponse;
}

/**
 * Disconnect SSH connection
 * @param connectionId - Connection ID
 * @returns Disconnect result
 */
export async function sshDisconnect(
  connectionId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch("/dm/ssh/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connection_id: connectionId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "断开失败" })) as Record<string, unknown>;
    throw new Error((error.error as string) || (error.message as string) || "SSH 断开失败");
  }

  return await response.json();
}

/**
 * List remote directory contents
 * @param connectionId - Connection ID
 * @param path - Remote path
 * @returns Directory contents
 */
export async function sshList(
  connectionId: string,
  path = "."
): Promise<SSHListResponse> {
  const response = await fetch("/dm/ssh/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      connection_id: connectionId,
      path
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "列出目录失败" })) as Record<string, unknown>;
    throw new Error((error.error as string) || (error.message as string) || "SSH 列出目录失败");
  }

  return await response.json() as SSHListResponse;
}
