import{c as f,_ as E}from"./extension.js";import"../../scripts/app.js";function I(n={}){const{onConnect:i,onDisconnect:c}=n,r=f(),t=document.createElement("div");t.id="dm-settings-panel-overlay",t.className="dm-modal-overlay",t.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002;
  `;const s=document.createElement("div");s.style.cssText=`
    background: ${r.bgPrimary};
    border: 1px solid ${r.borderColor};
    border-radius: 12px;
    padding: 20px;
    width: 400px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  `;const e=document.createElement("div");e.id="dm-settings-title",e.style.cssText=`
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,e.innerHTML=`
    <span>SSH 连接</span>
    <button id="dm-settings-close" class="comfy-btn" style="padding: 4px 8px;">
      <i class="pi pi-times"></i>
    </button>
  `,s.appendChild(e);const o=document.createElement("div");return s.appendChild(o),C(o,i,c),t.appendChild(s),document.body.appendChild(t),document.getElementById("dm-settings-close").onclick=()=>t.remove(),t.onclick=m=>{m.target===t&&t.remove()},t}function C(n,i,c){const r=f();n.innerHTML="";const t=document.createElement("div");t.style.cssText=`
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${r.textPrimary};
  `,t.textContent="已保存的连接",n.appendChild(t);const s=document.createElement("div");s.id="dm-saved-connections-list",s.style.cssText="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;",$(s,i,c,n,i,c),n.appendChild(s);const e=document.createElement("button");e.className="comfy-btn",e.innerHTML='<i class="pi pi-plus"></i> 新建连接',e.style.cssText="width: 100%; padding: 10px;",e.onclick=()=>{w(n,i,c)},n.appendChild(e)}function w(n,i,c){const r=f();n.innerHTML="";const t=document.createElement("button");t.className="comfy-btn",t.innerHTML='<i class="pi pi-arrow-left"></i> 返回',t.style.cssText="padding: 6px 12px; margin-bottom: 15px; font-size: 12px;",t.onclick=()=>{C(n,i,c)},n.appendChild(t);const s=document.createElement("div");s.style.cssText=`
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${r.textPrimary};
  `,s.textContent="新建 SSH 连接",n.appendChild(s);const e=document.createElement("div");e.style.cssText="display: flex; flex-direction: column; gap: 10px;",e.appendChild(b("主机地址","dm-ssh-host","text","192.168.1.100")),e.appendChild(b("端口","dm-ssh-port","number","22")),e.appendChild(b("用户名","dm-ssh-username","text","")),e.appendChild(b("密码","dm-ssh-password","password",""));const o=document.createElement("div");o.style.cssText="display: flex; align-items: center; gap: 12px; margin-top: 5px;";const m=document.createElement("label");m.style.cssText=`display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${r.textSecondary}; cursor: pointer;`,m.innerHTML=`
    <input type="checkbox" id="dm-ssh-save-creds">
    <span>保存凭据</span>
  `,o.appendChild(m);const a=document.createElement("button");a.className="comfy-btn",a.innerHTML="连接",a.style.cssText="padding: 8px 20px; margin-left: auto;",o.appendChild(a),e.appendChild(o),n.appendChild(e),a.onclick=async()=>{const d=document.getElementById("dm-ssh-host").value.trim(),l=document.getElementById("dm-ssh-port").value.trim(),x=document.getElementById("dm-ssh-username").value.trim(),u=document.getElementById("dm-ssh-password").value,g=document.getElementById("dm-ssh-save-creds").checked;if(!d||!x){alert("请填写主机地址和用户名");return}a.disabled=!0,a.textContent="连接中...";try{const{sshConnect:p}=await E(async()=>{const{sshConnect:y}=await import("./ssh.js");return{sshConnect:y}},[]),v=await p(d,parseInt(l)||22,x,u);if(g){const y={id:v.connection_id,name:`${x}@${d}`,host:d,port:parseInt(l)||22,username:x,password:btoa(u),created:new Date().toISOString()},h=window._remoteConnectionsState;h.saved.push(y);try{localStorage.setItem("comfyui_datamanager_remote_connections",JSON.stringify(h.saved))}catch(T){console.warn("[DataManager] Failed to save connections:",T)}}i&&i(v),document.getElementById("dm-settings-panel-overlay")?.remove()}catch(p){alert("连接失败: "+p.message),a.disabled=!1,a.textContent="连接"}}}function $(n,i,c,r,t,s){const e=f(),o=window._remoteConnectionsState,m=o.saved||[],a=o.active;if(n.innerHTML="",m.length===0){n.innerHTML=`<div style="text-align: center; padding: 20px; color: ${e.textSecondary};">暂无保存的连接</div>`;return}m.forEach(d=>{const l=document.createElement("div");l.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: ${e.bgSecondary};
      border: 1px solid ${e.borderColor};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;const x=a&&a.connection_id===d.id,u=document.createElement("div");u.style.cssText="flex: 1;",u.innerHTML=`
      <div style="font-size: 13px; font-weight: 600; color: ${x?e.successColor:e.textPrimary};">${d.name||`${d.username}@${d.host}`}</div>
      <div style="font-size: 11px; color: ${e.textSecondary};">${d.host}:${d.port}</div>
    `;const g=document.createElement("div");g.style.cssText="display: flex; gap: 5px;";const p=document.createElement("button");p.className="comfy-btn",p.innerHTML='<i class="pi pi-trash"></i>',p.style.cssText="padding: 6px 10px; font-size: 12px;",p.onclick=v=>{if(v.stopPropagation(),confirm(`确定删除连接 "${d.name}"?`)){const y=o.saved.findIndex(h=>h.id===d.id);if(y>-1){o.saved.splice(y,1);try{localStorage.setItem("comfyui_datamanager_remote_connections",JSON.stringify(o.saved))}catch{}C(r,i||t,c||s)}}},g.appendChild(p),l.appendChild(u),l.appendChild(g),l.onmouseover=()=>l.style.borderColor=e.accentColor,l.onmouseout=()=>l.style.borderColor=e.borderColor,n.appendChild(l)})}function b(n,i,c,r){const t=f(),s=document.createElement("div");s.style.cssText="display: flex; flex-direction: column; gap: 4px;";const e=document.createElement("label");e.style.cssText=`font-size: 12px; color: ${t.textSecondary};`,e.textContent=n;const o=document.createElement("input");return o.id=i,o.type=c,o.className="dm-input",o.placeholder=r,o.style.cssText=`
    padding: 8px 10px;
    border: 1px solid ${t.borderColor};
    border-radius: 4px;
    font-size: 14px;
    background: ${t.inputBg};
    color: ${t.inputText};
  `,s.appendChild(e),s.appendChild(o),s}export{I as openSettingsPanel};
//# sourceMappingURL=settings.js.map
