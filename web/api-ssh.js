/**
 * api-ssh.js - SSH 远程连接前端 API
 */

/**
 * 连接 SSH 主机
 * @param {string} host - 主机地址
 * @param {number} port - 端口
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} 连接结果
 */
export async function sshConnect(host, port, username, password) {
    const response = await fetch("/dm/ssh/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            host,
            port: parseInt(port) || 22,
            username,
            password
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "连接失败" }));
        throw new Error(error.error || error.message || "SSH 连接失败");
    }

    return await response.json();
}

/**
 * 断开 SSH 连接
 * @param {string} connectionId - 连接 ID
 * @returns {Promise<object>} 断开结果
 */
export async function sshDisconnect(connectionId) {
    const response = await fetch("/dm/ssh/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "断开失败" }));
        throw new Error(error.error || error.message);
    }

    return await response.json();
}

/**
 * 列出远程目录内容
 * @param {string} connectionId - 连接 ID
 * @param {string} path - 远程路径
 * @returns {Promise<object>} 目录内容
 */
export async function sshList(connectionId, path = ".") {
    const response = await fetch("/dm/ssh/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            connection_id: connectionId,
            path
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "列出目录失败" }));
        throw new Error(error.error || error.message);
    }

    return await response.json();
}
