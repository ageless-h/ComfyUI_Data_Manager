import{_ as E}from"./extension.js";import"../../scripts/app.js";function v(){return{bgPrimary:"#1e1e1e",bgSecondary:"#2d2d2d",textPrimary:"#e0e0e0",textSecondary:"#999",borderColor:"#444",accentColor:"#3498db",successColor:"#27ae60",errorColor:"#e74c3c"}}function I(t={}){const{onConnect:i,onDisconnect:r}=t,s=document.createElement("div");s.id="dm-settings-panel-overlay",s.className="dm-modal-overlay",s.style.cssText=`
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
  `;const n=v(),o=document.createElement("div");o.style.cssText=`
    background: ${n.bgPrimary};
    border: 1px solid ${n.borderColor};
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
  `,o.appendChild(e);const a=document.createElement("div");return o.appendChild(a),C(a,i,r),s.appendChild(o),document.body.appendChild(s),document.getElementById("dm-settings-close").onclick=()=>s.remove(),s.onclick=m=>{m.target===s&&s.remove()},s}function C(t,i,r){const s=v();t.innerHTML="";const n=document.createElement("div");n.style.cssText=`
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${s.textPrimary};
  `,n.textContent="已保存的连接",t.appendChild(n);const o=document.createElement("div");o.id="dm-saved-connections-list",o.style.cssText="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;",S(o,i,r,t,i,r),t.appendChild(o);const e=document.createElement("button");e.className="comfy-btn",e.innerHTML='<i class="pi pi-plus"></i> 新建连接',e.style.cssText="width: 100%; padding: 10px;",e.onclick=()=>{w(t,i,r)},t.appendChild(e)}function w(t,i,r){const s=v();t.innerHTML="";const n=document.createElement("button");n.className="comfy-btn",n.innerHTML='<i class="pi pi-arrow-left"></i> 返回',n.style.cssText="padding: 6px 12px; margin-bottom: 15px; font-size: 12px;",n.onclick=()=>{C(t,i,r)},t.appendChild(n);const o=document.createElement("div");o.style.cssText=`
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${s.textPrimary};
  `,o.textContent="新建 SSH 连接",t.appendChild(o);const e=document.createElement("div");e.style.cssText="display: flex; flex-direction: column; gap: 10px;",e.appendChild(b("主机地址","dm-ssh-host","text","192.168.1.100")),e.appendChild(b("端口","dm-ssh-port","number","22")),e.appendChild(b("用户名","dm-ssh-username","text","")),e.appendChild(b("密码","dm-ssh-password","password",""));const a=document.createElement("div");a.style.cssText="display: flex; align-items: center; gap: 12px; margin-top: 5px;";const m=document.createElement("label");m.style.cssText="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #aaa; cursor: pointer;",m.innerHTML=`
    <input type="checkbox" id="dm-ssh-save-creds">
    <span>保存凭据</span>
  `,a.appendChild(m);const c=document.createElement("button");c.className="comfy-btn",c.innerHTML="连接",c.style.cssText="padding: 8px 20px; margin-left: auto;",a.appendChild(c),e.appendChild(a),t.appendChild(e),c.onclick=async()=>{const d=document.getElementById("dm-ssh-host").value.trim(),l=document.getElementById("dm-ssh-port").value.trim(),x=document.getElementById("dm-ssh-username").value.trim(),u=document.getElementById("dm-ssh-password").value,g=document.getElementById("dm-ssh-save-creds").checked;if(!d||!x){alert("请填写主机地址和用户名");return}c.disabled=!0,c.textContent="连接中...";try{const{sshConnect:p}=await E(async()=>{const{sshConnect:y}=await import("./ssh.js");return{sshConnect:y}},[]),h=await p(d,parseInt(l)||22,x,u);if(g){const y={id:h.connection_id,name:`${x}@${d}`,host:d,port:parseInt(l)||22,username:x,password:btoa(u),created:new Date().toISOString()},f=window._remoteConnectionsState;f.saved.push(y);try{localStorage.setItem("comfyui_datamanager_remote_connections",JSON.stringify(f.saved))}catch(T){console.warn("[DataManager] Failed to save connections:",T)}}i&&i(h),document.getElementById("dm-settings-panel-overlay")?.remove()}catch(p){alert("连接失败: "+p.message),c.disabled=!1,c.textContent="连接"}}}function S(t,i,r,s,n,o){const e=v(),a=window._remoteConnectionsState,m=a.saved||[],c=a.active;if(t.innerHTML="",m.length===0){t.innerHTML=`<div style="text-align: center; padding: 20px; color: ${e.textSecondary};">暂无保存的连接</div>`;return}m.forEach(d=>{const l=document.createElement("div");l.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: ${e.bgSecondary};
      border: 1px solid ${e.borderColor};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;const x=c&&c.connection_id===d.id,u=document.createElement("div");u.style.cssText="flex: 1;",u.innerHTML=`
      <div style="font-size: 13px; font-weight: 600; color: ${x?e.successColor:e.textPrimary};">${d.name||`${d.username}@${d.host}`}</div>
      <div style="font-size: 11px; color: ${e.textSecondary};">${d.host}:${d.port}</div>
    `;const g=document.createElement("div");g.style.cssText="display: flex; gap: 5px;";const p=document.createElement("button");p.className="comfy-btn",p.innerHTML='<i class="pi pi-trash"></i>',p.style.cssText="padding: 6px 10px; font-size: 12px;",p.onclick=h=>{if(h.stopPropagation(),confirm(`确定删除连接 "${d.name}"?`)){const y=a.saved.findIndex(f=>f.id===d.id);if(y>-1){a.saved.splice(y,1);try{localStorage.setItem("comfyui_datamanager_remote_connections",JSON.stringify(a.saved))}catch{}C(s,i||n,r||o)}}},g.appendChild(p),l.appendChild(u),l.appendChild(g),l.onmouseover=()=>l.style.borderColor=e.accentColor,l.onmouseout=()=>l.style.borderColor=e.borderColor,t.appendChild(l)})}function b(t,i,r,s){const n=document.createElement("div");n.style.cssText="display: flex; flex-direction: column; gap: 4px;";const o=document.createElement("label");o.style.cssText="font-size: 12px; color: #aaa;",o.textContent=t;const e=document.createElement("input");return e.id=i,e.type=r,e.className="dm-input",e.placeholder=s,e.style.cssText=`
    padding: 8px 10px;
    border: 1px solid #444;
    border-radius: 4px;
    font-size: 14px;
    background: #2a2a2a;
    color: #fff;
  `,n.appendChild(o),n.appendChild(e),n}export{I as openSettingsPanel};
//# sourceMappingURL=settings.js.map
