import{c as g}from"./extension.js";import{sshListCredentials as T,sshConnect as f,sshDeleteCredential as E,sshSaveCredential as $}from"./ssh.js";import"../../scripts/app.js";function M(n={}){const{onConnect:i,onDisconnect:r}=n,l=g(),t=document.createElement("div");t.id="dm-settings-panel-overlay",t.className="dm-modal-overlay",t.style.cssText=`
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
  `;const o=document.createElement("div");o.style.cssText=`
    background: ${l.bgPrimary};
    border: 1px solid ${l.borderColor};
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
  `,o.appendChild(e);const a=document.createElement("div");return o.appendChild(a),b(a,i,r),t.appendChild(o),document.body.appendChild(t),document.getElementById("dm-settings-close").onclick=()=>t.remove(),t.onclick=m=>{m.target===t&&t.remove()},t}function b(n,i,r){const l=g();n.innerHTML="";const t=document.createElement("div");t.style.cssText=`
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${l.textPrimary};
  `,t.textContent="已保存的凭证",n.appendChild(t);const o=document.createElement("div");o.id="dm-saved-connections-list",o.style.cssText="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;",v(o,i,r,n,i,r),n.appendChild(o);const e=document.createElement("button");e.className="comfy-btn",e.innerHTML='<i class="pi pi-plus"></i> 新建连接',e.style.cssText="width: 100%; padding: 10px;",e.onclick=()=>{w(n,i,r)},n.appendChild(e)}function w(n,i,r){const l=g();n.innerHTML="";const t=document.createElement("button");t.className="comfy-btn",t.innerHTML='<i class="pi pi-arrow-left"></i> 返回',t.style.cssText="padding: 6px 12px; margin-bottom: 15px; font-size: 12px;",t.onclick=()=>{b(n,i,r)},n.appendChild(t);const o=document.createElement("div");o.style.cssText=`
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${l.textPrimary};
  `,o.textContent="新建 SSH 连接",n.appendChild(o);const e=document.createElement("div");e.style.cssText="display: flex; flex-direction: column; gap: 10px;",e.appendChild(h("主机地址","dm-ssh-host","text","192.168.1.100")),e.appendChild(h("端口","dm-ssh-port","number","22")),e.appendChild(h("用户名","dm-ssh-username","text","")),e.appendChild(h("密码","dm-ssh-password","password",""));const a=document.createElement("div");a.style.cssText="display: flex; align-items: center; gap: 12px; margin-top: 5px;";const m=document.createElement("label");m.style.cssText=`display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${l.textSecondary}; cursor: pointer;`,m.innerHTML=`
    <input type="checkbox" id="dm-ssh-save-creds">
    <span>保存凭据</span>
  `,a.appendChild(m);const s=document.createElement("button");s.className="comfy-btn",s.innerHTML="连接",s.style.cssText="padding: 8px 20px; margin-left: auto;",a.appendChild(s),e.appendChild(a),n.appendChild(e),s.onclick=async()=>{const d=document.getElementById("dm-ssh-host").value.trim(),x=document.getElementById("dm-ssh-port").value.trim(),c=document.getElementById("dm-ssh-username").value.trim(),u=document.getElementById("dm-ssh-password").value,y=document.getElementById("dm-ssh-save-creds").checked;if(!d||!c){alert("请填写主机地址和用户名");return}s.disabled=!0,s.textContent="连接中...";try{const p=await f(d,parseInt(x)||22,c,u);if(y)try{await $({id:`${c}@${d}:${parseInt(x)||22}`,name:`${c}@${d}`,host:d,port:parseInt(x)||22,username:c,password:u,created:new Date().toISOString()}),console.log("[DataManager] SSH 凭证已保存到服务器")}catch(C){console.warn("[DataManager] 保存 SSH 凭证失败:",C)}i&&i(p),document.getElementById("dm-settings-panel-overlay")?.remove()}catch(p){alert("连接失败: "+p.message),s.disabled=!1,s.textContent="连接"}}}async function v(n,i,r,l,t,o){const e=g();n.innerHTML='<div style="text-align: center; padding: 20px; color: '+e.textSecondary+';">加载中...</div>';try{const m=(await T()).credentials||[];if(n.innerHTML="",m.length===0){n.innerHTML=`<div style="text-align: center; padding: 20px; color: ${e.textSecondary};">暂无保存的凭证</div>`;return}m.forEach(s=>{const d=document.createElement("div");d.style.cssText=`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: ${e.bgSecondary};
        border: 1px solid ${e.borderColor};
        border-radius: 6px;
        transition: all 0.2s;
      `;const x=document.createElement("div");x.style.cssText="flex: 1; cursor: pointer;",x.innerHTML=`
        <div style="font-size: 13px; font-weight: 600; color: ${e.textPrimary};">${s.name}</div>
        <div style="font-size: 11px; color: ${e.textSecondary};">${s.username}@${s.host}:${s.port}</div>
        ${s.created?`<div style="font-size: 10px; color: ${e.textSecondary};">保存于: ${new Date(s.created).toLocaleString("zh-CN")}</div>`:""}
      `,x.onclick=async()=>{const y=prompt(`请输入 ${s.name} 的密码:`);if(y)try{const p=await f(s.host,s.port,s.username,y);(i||t)&&(i||t)(p),document.getElementById("dm-settings-panel-overlay")?.remove()}catch(p){alert("连接失败: "+p.message)}};const c=document.createElement("div");c.style.cssText="display: flex; gap: 5px;";const u=document.createElement("button");u.className="comfy-btn",u.innerHTML='<i class="pi pi-trash"></i>',u.style.cssText="padding: 6px 10px; font-size: 12px;",u.onclick=y=>{y.stopPropagation(),confirm(`确定删除凭证 "${s.name}"?`)&&E(s.id).then(()=>{console.log("[DataManager] 已删除凭证:",s.name),v(n,i,r,l,t,o)}).catch(p=>{alert("删除失败: "+p.message)})},c.appendChild(u),d.appendChild(x),d.appendChild(c),d.onmouseover=()=>d.style.borderColor=e.accentColor,d.onmouseout=()=>d.style.borderColor=e.borderColor,n.appendChild(d)})}catch(a){n.innerHTML=`<div style="text-align: center; padding: 20px; color: ${e.errorColor||"#ff6b6b"};">加载凭证列表失败: ${a.message}</div>`}}function h(n,i,r,l){const t=g(),o=document.createElement("div");o.style.cssText="display: flex; flex-direction: column; gap: 4px;";const e=document.createElement("label");e.style.cssText=`font-size: 12px; color: ${t.textSecondary};`,e.textContent=n;const a=document.createElement("input");return a.id=i,a.type=r,a.className="dm-input",a.placeholder=l,a.style.cssText=`
    padding: 8px 10px;
    border: 1px solid ${t.borderColor};
    border-radius: 4px;
    font-size: 14px;
    background: ${t.inputBg};
    color: ${t.inputText};
  `,o.appendChild(e),o.appendChild(a),o}export{M as openSettingsPanel};
//# sourceMappingURL=settings.js.map
