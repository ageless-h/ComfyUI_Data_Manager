import{app as L}from"../../scripts/app.js";const qe="modulepreload",We=function(e){return"/"+e},ae={},I=function(n,t,o){let i=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),s=r?.nonce||r?.getAttribute("nonce");i=Promise.allSettled(t.map(c=>{if(c=We(c),c in ae)return;ae[c]=!0;const l=c.endsWith(".css"),u=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${u}`))return;const d=document.createElement("link");if(d.rel=l?"stylesheet":qe,l||(d.as="script"),d.crossOrigin="",d.href=c,s&&d.setAttribute("nonce",s),document.head.appendChild(d),l)return new Promise((m,y)=>{d.addEventListener("load",m),d.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${c}`)))})}))}function a(r){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=r,window.dispatchEvent(s),!s.defaultPrevented)throw r}return i.then(r=>{for(const s of r||[])s.status==="rejected"&&a(s.reason);return n().catch(a)})},z={LAST_PATH:"comfyui_datamanager_last_path",VIEW_MODE:"comfyui_datamanager_view_mode",SORT_BY:"comfyui_datamanager_sort_by",REMOTE_CONNECTIONS:"comfyui_datamanager_remote_connections",LAST_CONNECTION:"comfyui_datamanager_last_connection"},p={currentPath:"",selectedFiles:[],currentPreviewFile:null,viewMode:"list",sortBy:"name",sortOrder:"asc",files:[],history:[],historyIndex:-1};function ee(e,n){try{localStorage.setItem(e,JSON.stringify(n))}catch(t){console.warn("[DataManager] Failed to save state:",t)}}function te(e,n){try{const t=localStorage.getItem(e);return t?JSON.parse(t):n}catch(t){return console.warn("[DataManager] Failed to load state:",t),n}}function ne(e){ee(z.LAST_PATH,e)}function he(){return te(z.LAST_PATH,".")}function Ge(e){ee(z.VIEW_MODE,e)}function Ye(){return te(z.VIEW_MODE,"list")}let Xe=null,Ze=null,O=[];const Je=z.REMOTE_CONNECTIONS,Ke=z.LAST_CONNECTION;let N={active:null,saved:[]};function Qe(){try{const e=localStorage.getItem(Je);e&&(N.saved=JSON.parse(e));const n=localStorage.getItem(Ke);n&&(N.active=JSON.parse(n)),window._remoteConnectionsState?(window._remoteConnectionsState.active=N.active,window._remoteConnectionsState.saved=N.saved):window._remoteConnectionsState=N}catch(e){console.warn("[DataManager] Failed to init remote connections:",e)}}Qe();const et=N,tt=Object.freeze(Object.defineProperty({__proto__:null,FileManagerState:p,STORAGE_KEYS:z,fileManagerWindow:Xe,getLastPath:he,getViewMode:Ye,loadState:te,previewFloatingWindows:O,previewModal:Ze,remoteConnectionsState:et,saveLastPath:ne,saveState:ee,saveViewMode:Ge},Symbol.toStringTag,{value:"Module"})),be=[];function oe(e){be.push(e)}function ce(){const e=b();be.forEach(n=>{try{n(e)}catch(t){console.error("[DataManager] Theme listener error:",t)}})}function nt(){const e=new MutationObserver(o=>{let i=!1;for(const a of o)if(a.type==="attributes"){i=!0;break}i&&(k(),ce())});e.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme"]});let n=le();const t=window.setInterval(()=>{const o=le();JSON.stringify(n)!==JSON.stringify(o)&&(n=o,k(),ce())},2e3);return{observer:e,checkInterval:t}}function le(){const e=window.getComputedStyle(document.documentElement);return{bg:e.getPropertyValue("--comfy-menu-bg"),bg2:e.getPropertyValue("--comfy-menu-bg-2"),inputText:e.getPropertyValue("--input-text"),borderColor:e.getPropertyValue("--border-color")}}let de=null;function ot(){de||setTimeout(()=>{try{de=nt()}catch(e){console.error("[DataManager] Theme watcher init failed:",e)}},1e3)}function it(e){if(e.includes("rgb")){const t=e.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(t){const o=parseInt(t[1]),i=parseInt(t[2]),a=parseInt(t[3]);return(o*299+i*587+a*114)/1e3>128}}const n=e.replace("#","");if(n.length===3){const t=parseInt(n[0]+n[0],16),o=parseInt(n[1]+n[1],16),i=parseInt(n[2]+n[2],16);return(t*299+o*587+i*114)/1e3>128}if(n.length===6){const t=parseInt(n.substring(0,2),16),o=parseInt(n.substring(2,4),16),i=parseInt(n.substring(4,6),16);return(t*299+o*587+i*114)/1e3>128}return!1}function b(){try{const e=window.getComputedStyle(document.documentElement),n=window.getComputedStyle(document.body),t=e.getPropertyValue("--comfy-menu-bg")?.trim()||"#1a1a1a",o=e.getPropertyValue("--comfy-menu-bg-2")?.trim()||e.getPropertyValue("--comfy-menu-secondary-bg")?.trim()||"#252525",i=it(t),a=e.getPropertyValue("--comfy-menu-bg-3")?.trim();let r,s;i?(r="#f0f0f0",s=e.getPropertyValue("--comfy-input-bg")?.trim()||"#ffffff"):(r=a||"#2a2a2a",s=e.getPropertyValue("--comfy-input-bg")?.trim()||r);const c=e.getPropertyValue("--input-text")?.trim()||"",l=i?"#222222":"#dddddd",u=i?"#666666":"#999999";return{bgPrimary:t,bgSecondary:o,bgTertiary:r,inputBg:s,inputText:l,borderColor:e.getPropertyValue("--border-color")?.trim()||(i?"#dddddd":"#444444"),textPrimary:l,textSecondary:u,accentColor:e.getPropertyValue("--comfy-accent")?.trim()||"#9b59b6",errorColor:"#e74c3c",successColor:"#27ae60",isLight:i}}catch(e){return console.warn("[DataManager] Failed to get ComfyUI theme:",e),{bgPrimary:"#1a1a1a",bgSecondary:"#252525",bgTertiary:"#2a2a2a",inputBg:"#2a2a2a",inputText:"#dddddd",borderColor:"#444444",textPrimary:"#dddddd",textSecondary:"#999999",accentColor:"#9b59b6",errorColor:"#e74c3c",successColor:"#27ae60",isLight:!1}}}function k(){const e=b(),n=e.isLight?"#e0e0e0":"#3a3a3a",t=document.documentElement;t.style.setProperty("--dm-bg-primary",e.bgPrimary),t.style.setProperty("--dm-bg-secondary",e.bgSecondary),t.style.setProperty("--dm-bg-tertiary",e.bgTertiary),t.style.setProperty("--dm-bg-hover",n),t.style.setProperty("--dm-input-bg",e.inputBg),t.style.setProperty("--dm-input-text",e.inputText),t.style.setProperty("--dm-border-color",e.borderColor),t.style.setProperty("--dm-text-primary",e.textPrimary),t.style.setProperty("--dm-text-secondary",e.textSecondary),t.style.setProperty("--dm-accent-color",e.accentColor),t.style.setProperty("--dm-error-color",e.errorColor),t.style.setProperty("--dm-success-color",e.successColor)}function pe(e,n){e&&(e.style.background=`linear-gradient(135deg, ${n.bgSecondary} 0%, ${n.bgPrimary} 100%)`,e.style.borderColor=n.borderColor)}function rt(e={}){const{title:n="Data Manager",icon:t="pi-folder-open",onClose:o=null,onMinimize:i=null,onFullscreen:a=null,onRefresh:r=null}=e,s=b(),c=document.createElement("div");c.className="dm-header dm-preview-header",c.setAttribute("draggable","false"),c.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: transparent;
    border-bottom: 0.8px solid ${s.borderColor};
    cursor: move;
    user-select: none;
    gap: 12px;
  `;const l=document.createElement("div");l.className="dm-traffic-lights",l.style.cssText="display: flex; gap: 8px;";const u=W("pi-times","关闭",o),d=W("pi-minus","最小化",i),m=W("pi-window-maximize","全屏",a);l.appendChild(u),l.appendChild(d),l.appendChild(m);const y=document.createElement("div");y.className="dm-header-title-area",y.style.cssText=`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    flex: 1 1 0%;
    color: ${s.textPrimary};
  `;const x=document.createElement("i");x.className=`pi ${t}`,x.style.color=s.textSecondary;const f=document.createElement("span");f.style.cssText=`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,f.textContent=n,y.appendChild(x),y.appendChild(f);const g=document.createElement("div");if(g.style.cssText="display: flex; gap: 8px; align-items: center;",r){const v=st("pi-refresh","刷新",r);g.appendChild(v)}return c.appendChild(l),c.appendChild(y),c.appendChild(g),c._updateTheme=()=>{const v=b();pe(c,v)},oe(v=>{pe(c,v)}),c}function W(e,n,t){const o=b(),i=document.createElement("button");return i.className="comfy-btn dm-traffic-btn",i.innerHTML=`<i class="pi ${e}" style="font-size: 12px;"></i>`,i.style.cssText=`
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: 0.8px solid ${o.borderColor};
    border-radius: 6px;
    color: ${o.textSecondary};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  `,i.title=n,i.onmouseenter=()=>{i.style.background=o.bgTertiary,i.style.color=o.textPrimary},i.onmouseleave=()=>{i.style.background="transparent",i.style.color=o.textSecondary},t&&(i.onclick=a=>{a.stopPropagation(),t()}),i}function st(e,n,t){const o=b(),i=document.createElement("button");return i.className="comfy-btn dm-header-btn",i.innerHTML=`<i class="pi ${e}" style="font-size: 14px;"></i>`,i.style.cssText=`
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: 0.8px solid ${o.borderColor};
    border-radius: 6px;
    color: ${o.textSecondary};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  `,i.title=n,i.onmouseenter=()=>{i.style.background=o.bgTertiary,i.style.color=o.textPrimary},i.onmouseleave=()=>{i.style.background="transparent",i.style.color=o.textSecondary},i.onmouseout=()=>i.style.background="transparent",i.onclick=t,i}function at(e){const{onSshConnect:n,onSshDisconnect:t}=e,o=b(),i=document.createElement("div");i.style.cssText="display: flex; align-items: center; gap: 5px;";const a=document.createElement("select");return a.id="dm-remote-select",a.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${o.borderColor} !important;
    border-radius: 6px;
    font-size: 13px;
    min-width: 150px;
    cursor: pointer;
    background: ${o.bgTertiary} !important;
    color: ${o.inputText} !important;
  `,G(a),a.onchange=async r=>{const s=r.target.value,c=window._remoteConnectionsState;if(s==="__local__"){c.active=null;try{localStorage.removeItem("comfyui_datamanager_last_connection")}catch{}G(a),U(),t&&t()}else if(s.startsWith("conn_")){const l=s.substring(5),u=c.saved.find(d=>d.id===l);if(u)try{a.disabled=!0;const d=document.createElement("option");d.textContent="连接中...",a.innerHTML="",a.appendChild(d),n&&n({connection_id:l,host:u.host,port:u.port,username:u.username,password:atob(u.password||"")})}catch(d){alert("连接失败: "+d.message),G(a)}}r.target.value=""},i.appendChild(a),i}function G(e,n,t){const o=b(),i=window._remoteConnectionsState,a=i.active;e.innerHTML="";const r=document.createElement("option");r.value="__local__",r.textContent="本地",e.appendChild(r),i.saved.forEach(s=>{const c=document.createElement("option");c.value=`conn_${s.id}`,c.textContent=s.name||`${s.username}@${s.host}`,a&&a.connection_id===s.id&&(c.style.color=o.successColor),e.appendChild(c)})}function U(){const e=b(),n=document.getElementById("dm-connection-indicator"),t=document.getElementById("dm-connection-status"),i=window._remoteConnectionsState.active;n&&(n.style.background=i?e.successColor:e.textSecondary),t&&(i?t.textContent=`SSH: ${i.username}@${i.host}`:t.textContent="")}function ct(e){const n=b(),t=document.createElement("button");return t.className="comfy-btn",t.id="dm-new-btn",t.innerHTML='<i class="pi pi-plus"></i>',t.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${n.borderColor} !important;
    border-radius: 6px;
    cursor: pointer;
    background: ${n.bgTertiary} !important;
    color: ${n.textPrimary} !important;
  `,t.title="新建",t.onclick=()=>{e.onNewFile&&e.onNewFile()},t}function lt(e){const n=b(),t=document.createElement("select");return t.id="dm-sort-select",t.className="dm-select comfy-btn",t.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${n.borderColor} !important;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: ${n.bgTertiary} !important;
    color: ${n.inputText} !important;
  `,[{value:"name",label:"按名称"},{value:"size",label:"按大小"},{value:"modified",label:"按日期"}].forEach(i=>{const a=document.createElement("option");a.value=i.value,a.textContent=i.label,t.appendChild(a)}),t.onchange=i=>{const a=i.target.value;e.onSortChange&&e.onSortChange(a)},t}function dt(e){const{onSshConnect:n,onSshDisconnect:t}=e,o=b(),i=document.createElement("button");return i.className="comfy-btn",i.id="dm-settings-btn",i.innerHTML='<i class="pi pi-cog"></i>',i.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${o.borderColor} !important;
    border-radius: 6px;
    cursor: pointer;
    background: ${o.bgTertiary} !important;
    color: ${o.textPrimary} !important;
  `,i.title="连接管理",i.onclick=async()=>{const{openSettingsPanel:a}=await I(async()=>{const{openSettingsPanel:r}=await import("./settings.js");return{openSettingsPanel:r}},[]);a({onConnect:r=>{const s=window._remoteConnectionsState;s.active=r;try{localStorage.setItem("comfyui_datamanager_last_connection",JSON.stringify(r))}catch{}U(),n&&n(r)},onDisconnect:async()=>{const r=window._remoteConnectionsState,s=r.active;if(s&&s.connection_id)try{const{sshDisconnect:c}=await I(async()=>{const{sshDisconnect:l}=await import("./ssh.js");return{sshDisconnect:l}},[]);await c(s.connection_id)}catch(c){console.log("[DataManager] SSH disconnect error:",c)}r.active=null;try{localStorage.removeItem("comfyui_datamanager_last_connection")}catch{}U(),t&&t()}})},i}function pt(e={}){const n=b(),t=document.createElement("div");t.className="dm-toolbar",t.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    border-bottom: 1px solid ${n.borderColor};
    gap: 15px;
  `;const o=document.createElement("div");o.style.cssText="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;";const i=document.createElement("div");i.style.cssText=`
    display: flex;
    gap: 5px;
  `;const a=document.createElement("button");a.id="dm-nav-up-btn",a.className="comfy-btn",a.innerHTML='<i class="pi pi-arrow-up"></i>',a.title="返回上级",a.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${n.borderColor} !important;
    border-radius: 6px;
    background: ${n.bgTertiary} !important;
    color: ${n.textPrimary} !important;
    cursor: pointer;
  `,a.onclick=()=>I(()=>Promise.resolve().then(()=>V),void 0).then(d=>d.navigateUp());const r=document.createElement("button");r.id="dm-nav-home-btn",r.className="comfy-btn",r.innerHTML='<i class="pi pi-home"></i>',r.title="返回首页",r.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${n.borderColor} !important;
    border-radius: 6px;
    background: ${n.bgTertiary} !important;
    color: ${n.textPrimary} !important;
    cursor: pointer;
  `,r.onclick=()=>I(()=>Promise.resolve().then(()=>V),void 0).then(d=>d.navigateHome()),i.appendChild(a),i.appendChild(r),o.appendChild(i);const s=document.createElement("input");s.id="dm-path-input",s.type="text",s.className="dm-input",s.style.cssText=`
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid ${n.borderColor} !important;
    border-radius: 6px;
    font-size: 13px;
    background: ${n.bgTertiary} !important;
    color: ${n.inputText} !important;
  `,s.value=p.currentPath||".",s.onkeypress=d=>{if(d.key==="Enter"){const{loadDirectory:m}=require("./actions.js");m(d.target.value)}},o.appendChild(s),o.appendChild(lt(e)),t.appendChild(o);const c=document.createElement("div");c.style.cssText="display: flex; align-items: center; gap: 10px;";const l=document.createElement("button");l.id="dm-view-toggle-btn",l.className="comfy-btn",l.title="切换视图",l.style.cssText=`
    padding: 8px 12px;
    border: 1px solid ${n.borderColor} !important;
    border-radius: 6px;
    background: ${n.bgTertiary} !important;
    color: ${n.textPrimary} !important;
    cursor: pointer;
  `;function u(){const d=p.viewMode;l.innerHTML=d==="list"?'<i class="pi pi-th-large"></i>':'<i class="pi pi-list"></i>'}return l.onclick=async()=>{const d=p.viewMode==="list"?"grid":"list";p.viewMode=d;const{saveViewMode:m}=await I(async()=>{const{saveViewMode:g}=await Promise.resolve().then(()=>tt);return{saveViewMode:g}},void 0);m(d),u();const y=document.getElementById("dm-file-list"),x=document.getElementById("dm-browser-panel");if(y)if(d==="grid"){y.style.cssText=`
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 10px;
          align-content: start;
          justify-content: start;
        `;const g=x?.querySelector(".dm-list-header");g&&(g.style.display="none")}else{y.style.cssText=`
          flex: 1;
          overflow-y: auto;
          padding: 5px 0;
        `;const g=x?.querySelector(".dm-list-header");g&&(g.style.display="flex")}const{loadDirectory:f}=await I(async()=>{const{loadDirectory:g}=await Promise.resolve().then(()=>V);return{loadDirectory:g}},void 0);await f(p.currentPath)},u(),c.appendChild(l),c.appendChild(at(e)),c.appendChild(dt(e)),c.appendChild(ct(e)),t.appendChild(c),setTimeout(()=>U(),100),t}const A={LIST:"/dm/list",PREVIEW:"/dm/preview",INFO:"/dm/info",CREATE_FILE:"/dm/create/file",CREATE_DIRECTORY:"/dm/create/directory",DELETE:"/dm/delete"},_={MAX_PREVIEW_ROWS:100,MAX_CODE_LENGTH:5e4,DEFAULT_ZOOM_STEP:25,MIN_ZOOM_DISPLAY:25,MAX_ZOOM_DISPLAY:300,FLOATING_Z_INDEX:10001},w={image:{exts:[".jpg",".jpeg",".png",".gif",".bmp",".webp",".svg",".ico",".tiff",".tif",".avif",".heic",".heif",".tga"],icon:"pi-image",color:"#e74c3c"},video:{exts:[".mp4",".webm",".mov",".mkv"],icon:"pi-video",color:"#9b59b6"},videoExternal:{exts:[".avi"],icon:"pi-video",color:"#8e44ad"},audio:{exts:[".mp3",".wav",".flac",".aac",".ogg",".wma",".m4a"],icon:"pi-volume-up",color:"#3498db"},document:{exts:[".pdf",".doc",".docx",".txt",".rtf",".md"],icon:"pi-file",color:"#95a5a6"},spreadsheet:{exts:[".xls",".xlsx",".csv",".ods"],icon:"pi-table",color:"#27ae60"},archive:{exts:[".zip",".rar",".7z",".tar",".gz"],icon:"pi-box",color:"#f39c12"},code:{exts:[".py",".js",".html",".css",".json",".xml",".yaml",".yml",".cpp",".c",".h"],icon:"pi-code",color:"#1abc9c"},folder:{exts:[],icon:"pi-folder",color:"#f1c40f"},unknown:{exts:[],icon:"pi-file",color:"#7f8c8d"}};function q(e){if(e.is_dir)return"folder";const n="."+((e.name||e.path||"").split(".").pop()?.toLowerCase()||"");for(const[t,o]of Object.entries(w))if(o.exts&&o.exts.includes(n))return t;return"unknown"}function yn(e){for(const[n,t]of Object.entries(w))if(t.exts&&t.exts.includes(e))return n;return"unknown"}function ve(e){if(!e)return"";for(const n of["B","KB","MB","GB"]){if(e<1024)return e.toFixed(1)+" "+n;e/=1024}return e.toFixed(1)+" TB"}function mt(e){return e?new Date(e).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):""}function E(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function ut(e="list"){const n=b(),t=document.createElement("div");t.id="dm-browser-panel",t.className="dm-browser-panel",t.style.cssText=`
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${n.borderColor};
    overflow: hidden;
  `,e==="list"&&t.appendChild(ft());const o=document.createElement("div");return o.id="dm-file-list",e==="grid"?o.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 10px;
      align-content: start;
      justify-content: start;
    `:o.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 5px 0;
    `,o.innerHTML=`
    <div class="dm-browser-loading" style="text-align: center; padding: 40px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
    </div>
  `,t.appendChild(o),t}function ft(){const e=b(),n=document.createElement("div");n.className="dm-list-header",n.style.cssText=`
    display: flex;
    padding: 10px 15px;
    border-bottom: 1px solid ${e.borderColor};
    font-size: 12px;
    font-weight: 600;
  `;const t=(o,i,a)=>{const r=document.createElement("div");return r.className="dm-header-cell",r.dataset.sort=o,r.style.cssText=`${a}; cursor: pointer; display: flex; align-items: center; gap: 5px; user-select: none;`,r.innerHTML=`<span>${i}</span><i class="pi pi-sort" style="font-size: 10px; opacity: 0.5;"></i>`,r.onclick=async()=>{const{toggleSort:s}=await I(async()=>{const{toggleSort:c}=await Promise.resolve().then(()=>V);return{toggleSort:c}},void 0);s(o)},r};return n.appendChild(t("name","名称","flex: 1;")),n.appendChild(t("size","大小","flex: 0 0 100px;")),n.appendChild(t("modified","修改日期","flex: 0 0 150px;")),n}function me(e,n){const t=b(),o=q(e),i=w[o]?.icon||w.unknown.icon,a=w[o]?.color||w.unknown.color,r=e.is_dir?"":ve(e.size??0)||"",s=e.modified?mt(String(e.modified)):"";return`
    <div class="dm-file-item" data-path="${E(e.path||e.name)}" data-is-dir="${e.is_dir||!1}"
         style="display: flex; align-items: center; padding: 10px 15px;
                border-bottom: 1px solid ${t.borderColor}; cursor: pointer;
                transition: background 0.2s;">
      <div style="flex: 1; display: flex; align-items: center; gap: 10px; overflow: hidden;">
        <i class="pi ${i} dm-file-icon" style="color: ${a}; font-size: 16px;"></i>
        <span class="dm-file-name" style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${E(e.name)}</span>
      </div>
      <div class="dm-file-size" style="flex: 0 0 100px; font-size: 12px;">${r}</div>
      <div class="dm-file-modified" style="flex: 0 0 150px; font-size: 12px;">${s}</div>
    </div>
  `}function ue(e,n){const t=b();if(n)return`
      <div class="dm-grid-item dm-grid-item-parent" data-path="${e.path}" data-is-dir="true"
           data-name=".."
           style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                  padding: 10px; min-height: 100px;
                  border-radius: 8px; cursor: pointer;
                  transition: all 0.2s; border: 2px dashed ${t.borderColor}; box-sizing: border-box;">
        <i class="pi pi-folder-open dm-parent-icon" style="font-size: 36px;"></i>
        <span class="dm-parent-text" style="font-size: 11px; text-align: center;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                      width: 100%; margin-top: 6px; line-height: 1.3;">返回上级</span>
      </div>
    `;const o=q(e),i=w[o]?.icon||w.unknown.icon,a=w[o]?.color||w.unknown.color,r=e.path||e.name;if(o==="image"&&!e.is_dir&&r){const s=`/dm/preview?path=${encodeURIComponent(r)}`;return`
      <div class="dm-grid-item dm-grid-item-image" data-path="${E(r)}" data-is-dir="false"
           data-name="${E(e.name)}"
           style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                  padding: 8px; min-height: 100px;
                  border-radius: 8px; cursor: pointer;
                  transition: all 0.2s; border: 2px solid ${t.borderColor}; box-sizing: border-box;">
        <div style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: ${t.bgTertiary};">
          <img src="${s}" class="dm-grid-thumbnail" alt="${E(e.name)}"
               style="width: 100%; height: 100%; object-fit: cover;"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <i class="pi ${i} dm-grid-icon" style="display: none; color: ${a}; font-size: 32px;"></i>
        </div>
        <span class="dm-grid-filename" style="font-size: 10px; text-align: center;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                      width: 100%; margin-top: 6px; line-height: 1.3;">${E(e.name)}</span>
      </div>
    `}return`
    <div class="dm-grid-item" data-path="${E(r)}" data-is-dir="${e.is_dir||!1}"
         data-name="${E(e.name)}"
         style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                padding: 8px; min-height: 100px;
                border-radius: 8px; cursor: pointer;
                transition: all 0.2s; border: 2px solid ${t.borderColor}; box-sizing: border-box;">
      <div style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;">
        <i class="pi ${i} dm-grid-icon" style="color: ${a}; font-size: 32px;"></i>
      </div>
      <span class="dm-grid-filename" style="font-size: 10px; text-align: center;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    width: 100%; margin-top: 6px; line-height: 1.3;">${E(e.name)}</span>
    </div>
  `}const J={png:{type:"IMAGE",label:"PNG 图像",description:"无损压缩，支持透明"},jpg:{type:"IMAGE",label:"JPEG 图像",description:"有损压缩，文件较小"},webp:{type:"IMAGE",label:"WebP 图像",description:"现代格式，高压缩比"},mp4:{type:"VIDEO",label:"MP4 视频",description:"通用视频格式"},webm:{type:"VIDEO",label:"WebM 视频",description:"优化的网络视频"},avi:{type:"VIDEO",label:"AVI 视频",description:"经典视频格式"},mp3:{type:"AUDIO",label:"MP3 音频",description:"通用音频格式"},wav:{type:"AUDIO",label:"WAV 音频",description:"无损音频"},flac:{type:"AUDIO",label:"FLAC 音频",description:"无损压缩音频"},ogg:{type:"AUDIO",label:"OGG 音频",description:"开源音频格式"},latent:{type:"LATENT",label:"Latent",description:"ComfyUI Latent 数据"},json:{type:"DATA",label:"JSON",description:"通用数据格式"},txt:{type:"DATA",label:"文本",description:"纯文本格式"}},yt={IMAGE:["png","jpg","webp"],VIDEO:["mp4","webm","avi"],AUDIO:["mp3","wav","flac","ogg"],LATENT:["latent"],MASK:["png"],CONDITIONING:["json"],STRING:["txt","json"]};function gt(e){const n=e.toUpperCase();return yt[n]||["json"]}function xt(e){return{IMAGE:"#e74c3c",VIDEO:"#9b59b6",AUDIO:"#3498db",LATENT:"#27ae60",MASK:"#f39c12",DATA:"#95a5a6"}[e]||"#95a5a6"}function ht(e){return{IMAGE:"pi-image",VIDEO:"pi-video",AUDIO:"pi-volume-up",LATENT:"pi-cube",MASK:"pi-mask",DATA:"pi-file"}[e]||"pi-file"}function bt(e={}){const{detectedType:n=null,selectedFormat:t=null,onFormatChange:o=null,showTypeIndicator:i=!0,compact:a=!1}=e,r=b(),s=document.createElement("div");if(s.className="dm-format-selector",s.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: ${r.bgSecondary};
    border-radius: 8px;
    border: 1px solid ${r.borderColor};
  `,i&&n){const y=document.createElement("div");y.className="dm-type-indicator";const x=xt(n);y.style.cssText=`
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: ${x}20;
      border-left: 3px solid ${x};
      border-radius: 4px;
      font-size: 12px;
      color: ${x};
    `,y.innerHTML=`
      <i class="pi ${ht(n)}"></i>
      <span style="font-weight: 600;">${n}</span>
      <span style="color: ${r.textSecondary};">检测到</span>
    `,s.appendChild(y)}const c=document.createElement("div");c.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;const l=document.createElement("label");l.style.cssText=`
    font-size: 12px;
    color: ${r.textSecondary};
    font-weight: 500;
  `,l.textContent="输出格式:",c.appendChild(l);const u=n?gt(n):Object.keys(J),d=t||(n?u[0]:"png");if(a){const y=document.createElement("select");y.id="dm-format-select",y.className="comfy-combo",y.style.cssText=`
      width: 100%;
      padding: 8px 12px;
      background: ${r.bgTertiary};
      border: 1px solid ${r.borderColor};
      border-radius: 6px;
      color: ${r.inputText};
      font-size: 13px;
      cursor: pointer;
    `,u.forEach(x=>{const f=document.createElement("option");f.value=x,f.textContent=x.toUpperCase(),x===d&&(f.selected=!0),y.appendChild(f)}),y.onchange=x=>{o&&o(x.target.value),Y(x.target.value)},c.appendChild(y)}else{const y=document.createElement("div");y.style.cssText=`
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    `,y.id="dm-format-buttons",u.forEach(x=>{const f=document.createElement("button");f.className="comfy-btn dm-format-btn",f.dataset.format=x;const g=x===d;f.style.cssText=`
        padding: 8px 16px;
        background: ${r.bgTertiary};
        border: 1px solid ${g?r.accentColor:r.borderColor};
        border-radius: 6px;
        color: ${g?r.accentColor:r.textPrimary};
        font-size: 12px;
        font-weight: ${g?"600":"400"};
        cursor: pointer;
        transition: all 0.2s;
      `,f.textContent=x.toUpperCase(),f.onclick=()=>{y.querySelectorAll(".dm-format-btn").forEach(v=>{const C=v;C.style.background=r.bgTertiary,C.style.borderColor=r.borderColor,C.style.color=r.textPrimary,C.style.fontWeight="400"}),f.style.background=r.bgTertiary,f.style.borderColor=r.accentColor,f.style.color=r.accentColor,f.style.fontWeight="600",o&&o(x),Y(x)},y.appendChild(f)}),c.appendChild(y)}s.appendChild(c);const m=document.createElement("div");return m.id="dm-format-description",m.style.cssText=`
    font-size: 11px;
    color: ${r.textSecondary};
    padding: 8px 12px;
    background: ${r.bgPrimary};
    border-radius: 4px;
  `,m.textContent=J[d]?.description||"",s.appendChild(m),Y(d),s}function Y(e){const n=document.getElementById("dm-format-description");n&&(n.textContent=J[e]?.description||"")}const vt="IMAGE";function wt(){try{const e=window.app,t=(e?.graph?._nodes||[]).filter(r=>r.comfyClass==="InputPathConfig");if(t.length===0)return;const a=(t[0].inputs||[]).find(r=>r.name==="file_input");if(a&&a.link){const r=a.link.origin_id,s=r!==void 0?e?.graph?.getNodeById?.(r):void 0;if(s){const c=$t(s);Et(c,null,null)}}}catch(e){console.log("[DataManager] Error checking node connection:",e)}}function $t(e){const n=e.type||e.comfyClass||"",t={LoadImage:"IMAGE",LoadVideo:"VIDEO",LoadAudio:"AUDIO",EmptyLatentImage:"LATENT",VAEDecode:"IMAGE",CheckpointLoaderSimple:"MODEL"};if(e.outputs&&e.outputs.length>0)for(const o of e.outputs){if(o.type==="IMAGE")return"IMAGE";if(o.type==="LATENT")return"LATENT";if(o.type==="MASK")return"MASK";if(o.type==="VIDEO")return"VIDEO";if(o.type==="AUDIO")return"AUDIO";if(o.type==="MODEL")return"MODEL";if(o.type==="VAE")return"VAE";if(o.type==="CLIP")return"CLIP"}for(const[o,i]of Object.entries(t))if(n.includes(o))return i;return vt}function Ct(e={}){const{onOpenFloating:n,onCopyPath:t,onDelete:o}=e,i=b(),a=document.createElement("div");a.id="dm-preview-panel",a.style.cssText=`
    flex: 0 0 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;const r=document.createElement("div");r.className="dm-preview-header",r.style.cssText=`
    padding: 15px;
    border-bottom: 1px solid ${i.borderColor};
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  `,r.innerHTML=`
    <h3 class="dm-title" style="margin: 0; font-size: 14px;">
      <i class="pi pi-eye"></i> 预览
    </h3>
    <div style="display: flex; gap: 5px;">
      <button id="dm-copy-path-btn" class="comfy-btn dm-icon-btn" disabled style="padding: 6px 12px; font-size: 12px; opacity: 0.5; cursor: not-allowed;" title="复制路径">
        <i class="pi pi-copy"></i>
      </button>
      <button id="dm-delete-file-btn" class="comfy-btn dm-icon-btn" style="padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-trash"></i>
      </button>
      <button id="dm-open-floating-preview-btn" class="comfy-btn dm-icon-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-window-maximize"></i>
      </button>
    </div>
  `,a.appendChild(r);const s=document.createElement("div");s.id="dm-preview-content",s.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  `,s.innerHTML=`
    <div style="text-align: center; padding: 40px; color: ${i.textSecondary};">
      <i class="pi pi-file" style="font-size: 48px; opacity: 0.5;"></i>
      <div style="margin-top: 15px; font-size: 13px;">选择文件以预览</div>
    </div>
  `,a.appendChild(s);const c=document.createElement("div");c.id="dm-format-section",c.style.cssText=`
    padding: 15px;
    background: ${i.bgTertiary};
    border-top: 1px solid ${i.borderColor};
    display: none;
  `,c.innerHTML=`
    <div style="text-align: center; padding: 20px; color: ${i.textSecondary};">
      <i class="pi pi-cog" style="font-size: 32px; opacity: 0.5;"></i>
      <div style="margin-top: 10px; font-size: 12px;">连接节点以启用格式选择</div>
    </div>
  `,a.appendChild(c);const l=document.createElement("div");l.id="dm-file-info",l.style.cssText=`
    padding: 15px;
    background: ${i.bgSecondary};
    border-top: 1px solid ${i.borderColor};
    font-size: 12px;
    color: ${i.textSecondary};
  `,l.innerHTML='<div style="text-align: center;">No file selected</div>',a.appendChild(l);const u=r.querySelector("#dm-open-floating-preview-btn"),d=r.querySelector("#dm-copy-path-btn"),m=r.querySelector("#dm-delete-file-btn");return u&&n&&(u.onclick=n),d&&t&&(d.onclick=t),m&&o&&(m.onclick=o),a}function Et(e,n=null,t=null){const o=document.getElementById("dm-format-section");if(!o)return;if(o.innerHTML="",!e){o.style.display="none";return}o.style.display="block";const i=bt({detectedType:e,selectedFormat:n,onFormatChange:t,compact:!0});o.appendChild(i)}function Tt(){const e=b(),n=document.createElement("div");n.className="dm-bottom-area",n.style.cssText=`
    display: flex;
    flex-direction: column;
  `;const t=document.createElement("div");t.id="dm-preview-dock",t.className="dm-preview-dock",t.style.cssText=`
    min-height: 0;
    max-height: 0;
    padding: 0 15px;
    background: ${e.bgPrimary};
    border-top: 0.8px solid ${e.borderColor};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    transition: min-height 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
  `;const o=document.createElement("div");return o.id="dm-status-bar",o.style.cssText=`
    padding: 8px 16px;
    font-size: 12px;
    color: ${e.textSecondary};
    background: transparent;
    border-top: 0.8px solid ${e.borderColor};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,o.innerHTML=`
    <div id="dm-connection-status" style="color: ${e.successColor};"></div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span id="dm-status-ready">就绪</span>
      <div id="dm-connection-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: ${e.textSecondary}; transition: background 0.3s ease;"></div>
    </div>
  `,n.appendChild(t),n.appendChild(o),setTimeout(()=>{const i=b(),a=document.getElementById("dm-connection-indicator"),r=document.getElementById("dm-connection-status"),c=window._remoteConnectionsState?.active;if(a&&(a.style.background=c?i.successColor:i.textSecondary),r&&c){const l=c;r.textContent=`SSH: ${l.username}@${l.host}`}},100),n}function we(e,n){e.draggable=!1,n.draggable=!1,e.addEventListener("dragstart",t=>(t.preventDefault(),t.stopPropagation(),!1)),n.addEventListener("mousedown",t=>{if(t.target&&t.target.tagName==="BUTTON"||t.target.tagName==="I"||e.dataset.fullscreen==="true")return;t.preventDefault();const o=e.getBoundingClientRect(),i=t.clientX-o.left,a=t.clientY-o.top;e.style.transition="none",e.style.transform="none",e.style.left=o.left+"px",e.style.top=o.top+"px",e._isDragging=!0;const r=c=>{if(!e._isDragging)return;const l=c.clientX-i,u=c.clientY-a;e.style.left=Math.max(0,l)+"px",e.style.top=Math.max(0,u)+"px"},s=()=>{e.style.transition="",e._isDragging=!1,document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",s)};document.addEventListener("mousemove",r),document.addEventListener("mouseup",s)})}let j=null;function St(e={}){const n=b(),t=document.createElement("div");t.id="dm-file-manager",t.style.cssText=`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1200px;
    height: 700px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
    background: ${n.bgPrimary};
    border: 0.8px solid ${n.borderColor};
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.4) 1px 1px 8px 0px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Inter, Arial, sans-serif;
  `;const o=document.createElement("div");o.id="dm-toast-container",o.style.cssText=`
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `,t.appendChild(o),t.appendChild(rt({title:"Data Manager",icon:"pi-folder-open",onClose:e.onClose,onRefresh:e.onRefresh})),t.appendChild(pt(e)),t.appendChild(_t(e)),t.appendChild(Tt()),document.body.appendChild(t);const i=t.querySelector(".dm-header");return we(t,i),j=a=>{a.key==="Escape"&&(a.preventDefault(),a.stopPropagation(),e.onClose&&e.onClose())},document.addEventListener("keydown",j,{capture:!0}),t}function fe(){j&&(document.removeEventListener("keydown",j,{capture:!0}),j=null);const e=document.getElementById("dm-file-manager");e&&e.remove()}function _t(e){const n=document.createElement("div");n.style.cssText="flex: 1; display: flex; overflow: hidden;";const t=ut(p.viewMode);n.appendChild(t);const o=Ct({onOpenFloating:e.onOpenFloating,onCopyPath:e.onCopyPath,onDelete:e.onDelete});return n.appendChild(o),n}async function $e(e){const n=await fetch(A.LIST,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})});if(n?.ok)return await n.json();const t=await n.json().catch(()=>({})),o=t.error||t.message||`HTTP ${n.status}`;throw new Error(`Failed to list directory: ${o}`)}function gn(e){return`${A.PREVIEW}?path=${encodeURIComponent(e)}`}async function It(e){const n=await fetch(A.INFO,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})});if(n?.ok)return(await n.json()).info;const t=await n.json().catch(()=>({})),o=t.error||t.message||`HTTP ${n.status}`;throw new Error(`Failed to get file info: ${o}`)}async function Pt(e,n,t=""){const o=await fetch(A.CREATE_FILE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({directory:e,filename:n,content:t})});if(o?.ok)return await o.json();const i=await o.json().catch(()=>({error:"Unknown error"}));throw new Error(i.error||i.message||"Failed to create file")}async function Mt(e,n){const t=await fetch(A.CREATE_DIRECTORY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({directory:e,dirname:n})});if(t?.ok)return await t.json();const o=await t.json().catch(()=>({error:"Unknown error"}));throw new Error(o.error||o.message||"Failed to create directory")}async function Dt(e,n=!0){const t=await fetch(A.DELETE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,use_trash:n})});if(t?.ok)return await t.json();const o=await t.json().catch(()=>({error:"Unknown error"}));throw new Error(o.error||"Failed to delete file")}function P(e){const n=document.getElementById("dm-status-bar");n&&(n.textContent=e)}function S(e,n,t){if(document.getElementById("dm-toast-container")){kt(e,n,t);return}typeof app<"u"&&app.extensionManager?.toast?app.extensionManager.toast.add({severity:e,summary:n,detail:t,life:3e3}):console.log(`[${e.toUpperCase()}] ${n}: ${t}`)}function kt(e,n,t){const o=document.getElementById("dm-toast-container");if(!o)return;const i=b(),a={success:{bg:i.successColor,icon:"pi-check-circle"},error:{bg:i.errorColor,icon:"pi-exclamation-circle"},warn:{bg:"#f39c12",icon:"pi-exclamation-triangle"},info:{bg:i.bgTertiary,icon:"pi-info-circle"}},r=a[e]||a.info,s=document.createElement("div");s.style.cssText=`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: ${r.bg};
    color: ${i.textPrimary};
    border: 1px solid ${i.borderColor};
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.3) 0 4px 12px 0;
    font-size: 13px;
    min-width: 280px;
    max-width: 400px;
    animation: dmSlideIn 0.3s ease-out;
    pointer-events: auto;
  `,s.innerHTML=`
    <i class="pi ${r.icon}" style="font-size: 18px;"></i>
    <div style="flex: 1;">
      <div style="font-weight: 600; margin-bottom: 2px;">${n}</div>
      <div style="opacity: 0.9; font-size: 12px;">${t}</div>
    </div>
  `,o.appendChild(s),setTimeout(()=>{s.style.opacity="0",s.style.transform="translateY(-10px)",s.style.transition="all 0.3s ease-in",setTimeout(()=>s.remove(),300)},3e3)}function K(e){const n=e.replace(/\\/g,"/"),t=n.lastIndexOf("/");return t<=0?".":n.substring(0,t)}function Ce(e){return e.split(/[/\\]/).pop()||""}function Ot(e){return"."+(e.split(".").pop()?.toLowerCase()||"")}async function M(e){const n=window._remoteConnectionsState?.active;if(n){await Lt(e,n);return}P(`正在加载: ${e}...`);try{const t=await $e(e);p.files=t.files||[],p.currentPath=t.path,ne(t.path),(p.historyIndex===-1||p.history[p.historyIndex]!==t.path)&&(p.history=p.history.slice(0,p.historyIndex+1),p.history.push(t.path),p.historyIndex=p.history.length-1);const o=document.getElementById("dm-path-input");o&&(o.value=t.path),R(),P(`${p.files.length} 个项目`)}catch(t){console.error("Load directory error:",t),P("加载错误"),S("error","错误","网络请求失败")}}async function Lt(e,n){P(`正在加载远程: ${e}...`);try{const{sshList:t}=await I(async()=>{const{sshList:a}=await import("./ssh.js");return{sshList:a}},[]),o=await t(n.connection_id,e||n.root_path||"/");p.files=o.files||[],p.currentPath=o.path||e;const i=document.getElementById("dm-path-input");i&&(i.value=`[SSH] ${o.path}`),R(),P(`${p.files.length} 个项目 (远程)`)}catch(t){console.error("Load remote directory error:",t),P("加载错误"),S("error","错误",`远程加载失败: ${t.message}`)}}function R(){const e=document.getElementById("dm-file-list");if(!e)return;p.selectedFiles=[];const n=[...p.files].sort((o,i)=>{const a=o.is_dir||o.isDir||!1,r=i.is_dir||i.isDir||!1;if(a&&!r)return-1;if(!a&&r)return 1;let s=0;switch(p.sortBy){case"name":s=o.name.localeCompare(i.name);break;case"size":s=(o.size||0)-(i.size||0);break;case"modified":s=new Date(o.modified||0).getTime()-new Date(i.modified||0).getTime();break}return p.sortOrder==="asc"?s:-s});let t="";p.currentPath!=="."&&p.currentPath!=="/"&&(p.viewMode==="list"?t+=me({name:"..",path:K(p.currentPath),size:0,modified:void 0}):t+=ue({name:"..",path:K(p.currentPath)},!0)),n.forEach(o=>{t+=p.viewMode==="list"?me(o):ue(o,!1)}),e.innerHTML=t,e.scrollTop=0,e.querySelectorAll(".dm-file-item").forEach(o=>{o.onclick=()=>zt(o),o.ondblclick=()=>At(o)}),e.querySelectorAll(".dm-grid-item").forEach(o=>{o.onclick=()=>Nt(o),o.ondblclick=async()=>{const i=o.dataset.path;if(o.dataset.isDir==="true"&&i)await M(i);else if(i){const{previewFile:r}=await I(async()=>{const{previewFile:s}=await import("./preview-actions.js");return{previewFile:s}},[]);await r(i)}}})}function Ee(){const e=document.getElementById("dm-copy-path-btn");if(!e)return;const n=p.selectedFiles.length>0;e.disabled=!n,e.style.opacity=n?"1":"0.5",e.style.cursor=n?"pointer":"not-allowed"}function zt(e){const n=b();document.querySelectorAll(".dm-file-item").forEach(i=>{i.style.background="transparent"}),e.style.background=`${n.bgTertiary} !important`;const t=e.dataset.path||"",o=e.dataset.isDir==="true";p.selectedFiles=[t],Ee(),!o&&t?(async()=>{const{previewFile:i}=await I(async()=>{const{previewFile:a}=await import("./preview-actions.js");return{previewFile:a}},[]);await i(t)})():Ft()}function Nt(e){const n=b();document.querySelectorAll(".dm-grid-item").forEach(i=>{i.style.borderColor="transparent"}),e.style.borderColor=`${n.accentColor} !important`,p.selectedFiles=[e.dataset.path||""],Ee();const t=e.dataset.path;!(e.dataset.isDir==="true")&&t&&(async()=>{const{previewFile:i}=await I(async()=>{const{previewFile:a}=await import("./preview-actions.js");return{previewFile:a}},[]);await i(t)})()}function At(e){const n=e.dataset.path;e.dataset.isDir==="true"&&n?M(n):n&&(async()=>{const{previewFile:o}=await I(async()=>{const{previewFile:i}=await import("./preview-actions.js");return{previewFile:i}},[]);await o(n)})()}function Ft(){const e=document.getElementById("dm-preview-content");if(e){const n=b();e.innerHTML=`
      <div style="text-align: center; padding: 40px; color: ${n.textSecondary};">
        <i class="pi pi-folder" style="font-size: 48px; opacity: 0.5;"></i>
        <div style="margin-top: 15px; font-size: 13px;">双击打开目录</div>
      </div>
    `}}function Te(e){p.sortBy===e?p.sortOrder=p.sortOrder==="asc"?"desc":"asc":(p.sortBy=e,p.sortOrder="asc");const n=document.getElementById("dm-sort-select");n&&(n.value=p.sortBy),R(),Se()}function Se(){document.querySelectorAll(".dm-header-cell").forEach(n=>{const t=n.querySelector("i");t&&(n.dataset.sort===p.sortBy?(t.className=p.sortOrder==="asc"?"pi pi-sort-amount-up":"pi pi-sort-amount-down",t.style.opacity="1"):(t.className="pi pi-sort",t.style.opacity="0.5"))})}function Bt(){if(p.currentPath==="."||p.currentPath==="/")return;const e=K(p.currentPath);e!==p.currentPath&&M(e)}function jt(){M(".")}async function Ht(){if(p.historyIndex<=0)return;p.historyIndex--;const e=p.history[p.historyIndex];await _e(e),ie()}async function Rt(){if(p.historyIndex>=p.history.length-1)return;p.historyIndex++;const e=p.history[p.historyIndex];await _e(e),ie()}async function _e(e){const n=window._remoteConnectionsState?.active;if(n){await Vt(e,n);return}P(`正在加载: ${e}...`);try{const t=await $e(e);p.files=t.files||[],p.currentPath=t.path,ne(t.path);const o=document.getElementById("dm-path-input");o&&(o.value=t.path),R(),P(`${p.files.length} 个项目`)}catch(t){console.error("Load directory error:",t),P("加载错误"),S("error","错误","网络请求失败")}}async function Vt(e,n){P(`正在加载远程: ${e}...`);try{const{sshList:t}=await I(async()=>{const{sshList:a}=await import("./ssh.js");return{sshList:a}},[]),o=await t(n.connection_id,e||n.root_path||"/");p.files=o.files||[],p.currentPath=o.path||e;const i=document.getElementById("dm-path-input");i&&(i.value=`[SSH] ${o.path}`),R(),P(`${p.files.length} 个项目 (远程)`)}catch(t){console.error("Load remote directory error:",t),P("加载错误"),S("error","错误",`远程加载失败: ${t.message}`)}}function ie(){const e=document.getElementById("dm-nav-back-btn"),n=document.getElementById("dm-nav-forward-btn");e&&(e.disabled=p.historyIndex<=0,e.style.opacity=p.historyIndex<=0?"0.3":"1"),n&&(n.disabled=p.historyIndex>=p.history.length-1,n.style.opacity=p.historyIndex>=p.history.length-1?"0.3":"1")}const V=Object.freeze(Object.defineProperty({__proto__:null,loadDirectory:M,navigateBack:Ht,navigateForward:Rt,navigateHome:jt,navigateUp:Bt,toggleSort:Te,updateHeaderSortIndicators:Se,updateNavButtons:ie},Symbol.toStringTag,{value:"Module"})),h={keyword:"#569cd6",string:"#ce9178",number:"#b5cea8",boolean:"#569cd6",comment:"#6a9955",function:"#dcdcaa",tag:"#569cd6",attrName:"#9cdcfe",attrValue:"#ce9178"};function Ie(e,n){let t=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");switch(n){case".json":t=Pe(t);break;case".py":t=Me(t);break;case".js":case".ts":case".jsx":case".tsx":t=De(t);break;case".html":case".htm":t=ke(t);break;case".css":t=Oe(t);break;case".yaml":case".yml":t=Le(t);break;case".xml":t=ze(t);break;default:t=Ne(t)}return t}function Pe(e){return e.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,function(n){let t=h.number;return/^"/.test(n)?t=/:$/.test(n)?h.attrName:h.string:/true|false|null/.test(n)&&(t=h.boolean),`<span style="color: ${t};">${n}</span>`})}function Me(e){const n=/\b(def|class|import|from|if|elif|else|while|for|in|try|except|finally|with|as|return|yield|raise|pass|break|continue|and|or|not|is|lambda|True|False|None|async|await)\b/g,t=/@[\w.]+/g,o=/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,i=/#.*$/gm,a=/\b(\d+\.?\d*)\b/g,r=/\b([a-zA-Z_]\w*)\s*(?=\()/g;return e.replace(i,`<span style="color: ${h.comment};">$&</span>`).replace(o,`<span style="color: ${h.string};">$&</span>`).replace(n,`<span style="color: ${h.keyword};">$&</span>`).replace(t,`<span style="color: ${h.function};">$&</span>`).replace(r,`<span style="color: ${h.function};">$1</span>(`).replace(a,`<span style="color: ${h.number};">$1</span>`)}function De(e){const n=/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|null|undefined|true|false|in|instanceof|typeof|void)\b/g,t=/`(?:[^`\\]|\\.)*`/g,o=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,i=/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,a=/\b(\d+\.?\d*)\b/g,r=/\b([a-zA-Z_]\w*)\s*(?=\()/g,s=/(&gt;|=>)/g;return e.replace(i,`<span style="color: ${h.comment};">$&</span>`).replace(t,`<span style="color: ${h.string};">$&</span>`).replace(o,`<span style="color: ${h.string};">$&</span>`).replace(n,`<span style="color: ${h.keyword};">$&</span>`).replace(r,`<span style="color: ${h.function};">$1</span>(`).replace(s,`<span style="color: ${h.keyword};">$&</span>`).replace(a,`<span style="color: ${h.number};">$1</span>`)}function ke(e){return e=e.replace(/(&lt;\/?)([\w-]+)/g,`$1<span style="color: ${h.tag};">$2</span>`),e=e.replace(/([\w-]+)(=)/g,`<span style="color: ${h.attrName};">$1</span>$2`),e=e.replace(/(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`$1<span style="color: ${h.attrValue};">$2</span>`),e}function Oe(e){return e=e.replace(/(\/\*[\s\S]*?\*\/)/g,`<span style="color: ${h.comment};">$1</span>`),e=e.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`<span style="color: ${h.string};">$1</span>`),e=e.replace(/([\w-]+)(\s*:)/g,`<span style="color: ${h.attrName};">$1</span>$2`),e=e.replace(/(:\s*)([\d.#\w-]+)/g,`$1<span style="color: ${h.attrValue};">$2</span>`),e=e.replace(/([.#]?[\w-]+)(\s*\{)/g,`<span style="color: ${h.tag};">$1</span>$2`),e}function Le(e){return e=e.replace(/(#.*$)/gm,`<span style="color: ${h.comment};">$1</span>`),e=e.replace(/^([\w-]+):/gm,`<span style="color: ${h.attrName};">$1</span>:`),e=e.replace(/(:\s*)([\w./-]+)/g,`$1<span style="color: ${h.string};">$2</span>`),e=e.replace(/\b(true|false|null)\b/g,`<span style="color: ${h.boolean};">$1</span>`),e=e.replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${h.number};">$1</span>`),e}function ze(e){return e=e.replace(/(&lt;\/?)([\w:]+)/g,`$1<span style="color: ${h.tag};">$2</span>`),e=e.replace(/([\w:]+)(=)/g,`<span style="color: ${h.attrName};">$1</span>$2`),e=e.replace(/(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`$1<span style="color: ${h.attrValue};">$2</span>`),e}function Ne(e){e=e.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`<span style="color: ${h.string};">$1</span>`),e=e.replace(/(\/\/.*$)/gm,`<span style="color: ${h.comment};">$1</span>`),e=e.replace(/(\/\*[\s\S]*?\*\/)/g,`<span style="color: ${h.comment};">$1</span>`);const n=/\b(function|return|if|else|for|while|var|let|const|true|false|null|undefined)\b/g;return e=e.replace(n,`<span style="color: ${h.keyword};">$1</span>`),e=e.replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${h.number};">$1</span>`),e}const xn=Object.freeze(Object.defineProperty({__proto__:null,highlightCSS:Oe,highlightCode:Ie,highlightGeneric:Ne,highlightHTML:ke,highlightJSON:Pe,highlightJavaScript:De,highlightPython:Me,highlightXML:ze,highlightYAML:Le},Symbol.toStringTag,{value:"Module"}));function Ae(e){return new Promise((n,t)=>{if(document.querySelector(`script[src="${e}"]`)){n();return}const o=document.createElement("script");o.src=e,o.onload=()=>n(),o.onerror=t,document.head.appendChild(o)})}function Ut(e){const n=[];let t=[],o="",i=!1;for(let a=0;a<e.length;a++){const r=e[a],s=e[a+1];i?r==='"'?s==='"'?(o+='"',a++):i=!1:o+=r:r==='"'?i=!0:r===","?(t.push(o),o=""):r==="\r"&&s===`
`?(t.push(o),n.push(t),t=[],o="",a++):r===`
`?(t.push(o),n.push(t),t=[],o=""):r!=="\r"&&(o+=r)}return t.push(o),(t.length>0||n.length>0)&&n.push(t),n}const qt={type:"floating",maxRows:_.MAX_PREVIEW_ROWS,height:null},Q={floating:{containerClass:"dm-table-container",controlsClass:"dm-table-controls",height:null,hasFullscreen:!1,prefix:"dm-floating-table"},panel:{containerClass:"dm-panel-table-container",controlsClass:"dm-table-controls-panel",height:null,hasFullscreen:!0,prefix:"dm-table"}};function Fe(e,n={}){const t={...qt,...n},o=Q[t.type||"floating"],i=t.hasFullscreen!==void 0?t.hasFullscreen:o.hasFullscreen,a=e.slice(0,t.maxRows||_.MAX_PREVIEW_ROWS),r=e.length>(t.maxRows||_.MAX_PREVIEW_ROWS),s=`${o.prefix}-${Date.now()}`,c=t.path||"",l=o.height!==null?`height: ${o.height};`:"height: 100%;",u=`position: relative; flex: 1; overflow: hidden; ${l}`;let d=`
    <div style="display: flex; flex-direction: column; gap: 0; ${t.type==="floating"?"height: 100%;":""}">
      <div class="${o.containerClass}" style="${u}">
        <div id="${s}-wrapper" class="dm-table-wrapper"
             style="width: 100%; overflow: auto; padding: 15px; ${l}">
          <table id="${s}" class="dm-data-table" ${c?`data-table-path="${E(c)}"`:""}
                 style="width: 100%; border-collapse: collapse; font-size: 12px; transform-origin: top left;">
  `;if(a.forEach((m,y)=>{const x=y===0;d+="<tr>",m.forEach(f=>{const g=E(String(f??""));x?d+=`<th class="dm-table-header">${g}</th>`:d+=`<td class="dm-table-cell">${g}</td>`}),d+="</tr>"}),d+=`
          </table>
        </div>
      </div>
      ${Wt(s,o)}
    </div>
  `,r){const m=t.maxRows||_.MAX_PREVIEW_ROWS;d=d.replace("</div>",`<div class="dm-table-truncated" style="text-align: center; padding: 10px; font-size: 11px;">... (仅显示前 ${m} 行，共 ${e.length} 行)</div></div>`)}return setTimeout(()=>Be(s,t.type||"floating",i,c),0),d}function Wt(e,n){let t=`
    <div id="${e}-controls" class="${n.controlsClass}" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; flex-shrink: 0;">
      <button class="comfy-btn dm-table-zoom-out-btn" data-table-id="${e}" title="缩小">
        <i class="pi pi-search-minus"></i>
      </button>
      <span id="${e}-zoom" class="dm-table-zoom-display">100%</span>
      <button class="comfy-btn dm-table-zoom-in-btn" data-table-id="${e}" title="放大">
        <i class="pi pi-search-plus"></i>
      </button>
      <button class="comfy-btn dm-table-fit-btn" data-table-id="${e}" title="自动缩放">
        <i class="pi pi-arrows-alt"></i>
      </button>
  `;return n.hasFullscreen&&(t+=`
      <button class="comfy-btn dm-table-fullscreen-btn" data-table-id="${e}" title="全屏">
        <i class="pi pi-window-maximize"></i>
      </button>
    `),t+="</div>",t}function Be(e,n="floating",t,o){const i=document.getElementById(e);if(!i)return;const a=Q[n]||Q.floating,r=t!==void 0?t:a.hasFullscreen;let s=100;const c=i,l=document.getElementById(`${e}-wrapper`),u=document.getElementById(`${e}-zoom`),d=document.querySelector(`.dm-table-zoom-in-btn[data-table-id="${e}"]`),m=document.querySelector(`.dm-table-zoom-out-btn[data-table-id="${e}"]`),y=document.querySelector(`.dm-table-fit-btn[data-table-id="${e}"]`),x=r?document.querySelector(`.dm-table-fullscreen-btn[data-table-id="${e}"]`):null;function f(){c.style.transform=`scale(${s/100})`,u&&(u.textContent=`${s}%`),l&&(l.style.width=s>100?`${s}%`:"100%")}d&&d.addEventListener("click",()=>{s=Math.min(s+_.DEFAULT_ZOOM_STEP,_.MAX_ZOOM_DISPLAY),f()}),m&&m.addEventListener("click",()=>{s=Math.max(s-_.DEFAULT_ZOOM_STEP,_.MIN_ZOOM_DISPLAY),f()}),y&&y.addEventListener("click",()=>{const g=l?.clientWidth||400,v=c.scrollWidth,C=Math.min(Math.floor(g/v*100),100);s=Math.max(C,_.MIN_ZOOM_DISPLAY),f()}),x&&x.addEventListener("click",async()=>{const g=o||c.getAttribute("data-table-path");if(g){const v=g.split(/[\\/]/).pop()||g,{openFloatingPreview:C}=await I(async()=>{const{openFloatingPreview:T}=await Promise.resolve().then(()=>on);return{openFloatingPreview:T}},void 0);C(g,v)}})}function je(e){return`
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
      <div style="margin-top: 15px; font-size: 13px;">表格解析失败</div>
      <div style="margin-top: 5px; font-size: 11px;">${E(e)}</div>
    </div>
  `}async function He(e,n){const t=await fetch(`/dm/preview?path=${encodeURIComponent(e)}`);if(!t.ok)throw new Error("Failed to load file");if(n===".csv"){const o=await t.text();return Ut(o)}if(n===".xls"||n===".xlsx"){const o=window;typeof o.XLSX>"u"&&await Ae("https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js");const i=await t.arrayBuffer(),a=o.XLSX,r=a.read(i,{type:"array"}),s=r.SheetNames[0],c=r.Sheets[s];return a.utils.sheet_to_json(c,{header:1})}throw new Error("Unsupported spreadsheet format")}const hn=Object.freeze(Object.defineProperty({__proto__:null,createTableErrorHTML:je,createTableHTML:Fe,parseSpreadsheet:He,setupTableControls:Be},Symbol.toStringTag,{value:"Module"}));async function Gt(e,n,t,o=1,i){const a=b();e.innerHTML=`
    <div class="dm-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
      <div style="margin-top: 10px;">正在加载...</div>
    </div>
  `;try{let r="";if(w.image.exts.includes(t)){const s=`/dm/preview?path=${encodeURIComponent(n)}`;r=`
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
          <div class="dm-floating-image-container" style="position: relative; overflow: hidden; flex: 1; display: flex; align-items: center; justify-content: center;">
            <img id="${i||`dm-floating-image-${Date.now()}`}" src="${s}"
                 class="dm-zoomable-image dm-preview-image"
                 style="width: auto; height: auto; max-width: 100%; max-height: 100%;
                        border-radius: 8px; border: 1px solid;
                        transform-origin: center center;
                        will-change: transform; cursor: grab;"
                 onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'"
                 onload="this.style.opacity=1; this.style.display='block';">
          </div>
        </div>
      `}else if(w.audio.exts.includes(t)){const s=`/dm/preview?path=${encodeURIComponent(n)}`,c=i||`dm-preview-audio-${Date.now()}`,l=E(n.split(/[/\\]/).pop()||""),u=t.toLowerCase();r=`
        <div class="dm-audio-preview" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 14px;">${l}</div>
          <audio id="${c}" data-audio-id="${c}" preload="metadata" style="width: 100%; max-width: 400px; display: none;">
            <source src="${s}" type="${u===".mp3"?"audio/mpeg":u===".wav"?"audio/wav":u===".flac"?"audio/flac":u===".aac"?"audio/aac":u===".ogg"?"audio/ogg":u===".m4a"?"audio/mp4":"audio/mpeg"}">
            您的浏览器不支持音频播放
          </audio>
        </div>
      `}else if(w.video.exts.includes(t)){const s=`/dm/preview?path=${encodeURIComponent(n)}`,c=i||`dm-preview-video-${Date.now()}`;r=`
        <div class="dm-video-preview-container" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${a.bgPrimary};">
          <video id="${c}" data-video-id="${c}" preload="metadata" style="width: 100%; height: 100%; display: block; object-fit: contain;">
            <source src="${s}" type="video/mp4">
          </video>
        </div>
      `}else if(w.videoExternal&&w.videoExternal.exts.includes(t)){const s=t.toUpperCase().replace(".","");r=`
        <div class="dm-external-video" style="text-align: center; padding: 40px;">
          <i class="pi pi-video dm-external-video-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="font-size: 16px; margin-bottom: 8px;">${E(n.split(/[\\/]/).pop()||"")}</div>
          <div class="dm-external-video-type" style="font-size: 14px; font-weight: 600; margin-bottom: 15px;">${s} 格式</div>
          <div class="dm-external-video-desc" style="margin-top: 10px; font-size: 12px; max-width: 300px; margin-left: auto; margin-right: auto;">
            此格式需要使用外部播放器打开<br>
            <span class="dm-external-video-sub">（VLC、Windows Media Player 等）</span>
          </div>
          <div class="dm-external-video-tip" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 11px;">
            提示：点击下方"打开"按钮可用外部播放器播放
          </div>
        </div>
      `}else if(w.code.exts.includes(t)){const s=await fetch(`/dm/preview?path=${encodeURIComponent(n)}`);if(s.ok){const c=await s.text();r=`
          <div class="dm-code-preview" style="width: 100%; padding: 15px;
                      font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                      overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
            <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${Ie(c,t)}</pre>
          </div>
        `}else throw new Error("Failed to load file")}else if(w.document.exts.includes(t)){const s=`/dm/preview?path=${encodeURIComponent(n)}`,c=t===".pdf",l=t===".md",u=t===".docx";if(t===".doc")r=`
          <div class="dm-doc-unsupported" style="text-align: center; padding: 40px;">
            <i class="pi pi-file-word dm-doc-unsupported-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${E(n.split(/[/\\]/).pop()||"")}</div>
            <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">.doc 格式暂不支持预览</div>
            <div class="dm-unsupported-sub" style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
          </div>
        `;else if(u)try{const m=await fetch(s);if(m.ok){const y=await m.arrayBuffer();if(typeof window.mammoth>"u"){console.log("[DataManager] Loading mammoth.js...");try{await Ae("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"),console.log("[DataManager] mammoth.js loaded successfully")}catch(f){throw console.error("[DataManager] Failed to load mammoth.js:",f),new Error("无法加载 mammoth.js，请检查网络连接")}}const x=window.mammoth;if(x){const f=x.convertToHtml({arrayBuffer:y}),g=`dm-doc-content-${Date.now()}`;r=`
                <div id="${g}" class="dm-document-content dm-docx-content"
                     style="width: 100%; height: 100%;
                            font-family: 'Segoe UI', Arial, sans-serif;
                            font-size: 13px;
                            line-height: 1.6;
                            overflow: auto;
                            box-sizing: border-box;
                            padding: 20px;">
                  <style>
                    #${g} img { max-width: 100%; height: auto; display: inline-block; margin: 10px 0; }
                    #${g} p { word-wrap: break-word; overflow-wrap: break-word; margin: 0.5em 0; }
                    #${g} table { max-width: 100%; overflow: auto; display: block; margin: 10px 0; }
                  </style>
                  ${f.value}
                </div>
              `}else throw new Error("mammoth.js 加载后未找到全局变量")}else throw new Error("Failed to load file")}catch(m){console.error("[DataManager] DOCX preview error:",m),r=`
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
              <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
              <div class="dm-preview-filename" style="margin-top: 15px;">${E(n.split(/[/\\]/).pop()||"")}</div>
              <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
              <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${E(m.message)}</div>
            </div>
          `}else if(c)r=`
          <div style="width: 100%; height: 100%; overflow: hidden;">
            <embed id="dm-floating-pdf-embed" src="${s}" type="application/pdf"
                   style="width: 100%; height: 100%; border: none; display: block;" />
          </div>
        `;else if(l)r=`
          <div style="width: 100%; height: 100%; border: 1px solid ${a.borderColor}; overflow: hidden;">
            <iframe src="${s}" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
        `;else if(t===".txt"||t===".rtf")try{const m=await fetch(s);if(m.ok){const y=await m.text();r=`
              <div id="${`dm-doc-content-${Date.now()}`}" class="dm-document-content dm-text-content"
                   style="width: 100%; height: 100%;
                          font-family: 'Consolas', 'Monaco', monospace;
                          font-size: 13px;
                          line-height: 1.6;
                          overflow: auto;
                          word-break: break-word;
                          white-space: pre-wrap;
                          padding: 15px;">${E(y)}</div>
            `}else throw new Error("Failed to load file")}catch(m){console.error("[DataManager] Text preview error:",m),r=`
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
              <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
              <div class="dm-preview-filename" style="margin-top: 15px;">${E(n.split(/[/\\]/).pop()||"")}</div>
              <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
              <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${E(m.message)}</div>
            </div>
          `}else{const m=E(n.split(/[/\\]/).pop()||"");r=`
          <div style="text-align: center; padding: 40px;">
            <i class="pi pi-file" style="font-size: 64px; color: ${a.textSecondary};"></i>
            <div style="margin-top: 15px; font-size: 14px;">${m}</div>
            <div style="margin-top: 8px; font-size: 12px; color: ${a.textSecondary};">点击"打开"按钮查看文档</div>
          </div>
        `}}else if(w.spreadsheet.exts.includes(t))try{const s=await He(n,t);r=Fe(s,{type:"floating",hasFullscreen:!0,path:n})}catch(s){r=je(s.message)}else{const s=n.split(/[/\\]/).pop()||"",c=q({name:n}),l=w[c]?.icon||w.unknown.icon,u=w[c]?.color||w.unknown.color;r=`
        <div style="text-align: center; padding: 30px;">
          <i class="pi ${l}" style="font-size: 64px; color: ${u};"></i>
          <div style="margin-top: 15px; color: ${a.textPrimary}; font-size: 14px;">${E(s)}</div>
          <div style="margin-top: 8px; color: ${a.textSecondary}; font-size: 12px;">此文件类型不支持预览</div>
        </div>
      `}e.innerHTML=r,Yt(e,n)}catch(r){e.innerHTML=`
      <div class="dm-preview-error" style="text-align: center; padding: 40px;">
        <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
        <div class="dm-error-title" style="margin-top: 15px; font-size: 14px;">加载失败</div>
        <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${E(r.message)}</div>
      </div>
    `}}async function Yt(e,n){const t=e.parentElement?.querySelector(".dm-floating-file-info");if(t)try{const o=await It(n);t.innerHTML=`
      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <span>${E(o.name)}</span>
        <span>${ve(o.size)}</span>
      </div>
    `}catch{t.innerHTML='<span style="opacity: 0.5;">无法获取文件信息</span>'}}function re(){const e=document.getElementById("dm-preview-dock");if(!e)return;const n=b();e.innerHTML="";const t=O.filter(o=>o.minimized);if(t.length===0){e.style.minHeight="0",e.style.maxHeight="0",e.style.padding="0 15px";return}e.style.minHeight="60px",e.style.maxHeight="60px",e.style.padding="10px 15px",t.forEach(o=>{const i=document.createElement("div");i.className="dm-dock-thumbnail",i.style.cssText=`
      width: 80px;
      height: 50px;
      background: ${n.bgSecondary};
      border: 1px solid ${n.borderColor};
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s;
    `,i.title=`${o.fileName} - 点击恢复`,i.innerHTML=`
      <i class="pi ${o.fileConfig.icon}" style="color: ${o.fileConfig.color}; font-size: 16px;"></i>
      <span style="color: ${n.textSecondary}; font-size: 9px; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${o.fileName}</span>
    `,i.onmouseover=()=>{i.style.background=n.bgTertiary,i.style.borderColor=o.fileConfig.color},i.onmouseout=()=>{i.style.background=n.bgSecondary,i.style.borderColor=n.borderColor},i.onclick=()=>Xt(o.window),e.appendChild(i)})}function Xt(e){e.style.display="flex";const n=O.find(t=>t.window===e);n&&(n.minimized=!1),re()}const Zt=1,ye=13,ge=12;function D(e,n,t){const o=b(),i=document.createElement("button");return i.className="comfy-btn",i.innerHTML=`<i class="pi ${e}"></i>`,i.style.cssText=`padding: 6px 10px; background: transparent; border: none; color: ${o.textSecondary}; cursor: pointer; border-radius: 4px;`,i.title=n,i.onmouseover=()=>i.style.background=o.bgTertiary,i.onmouseout=()=>i.style.background="transparent",i.onclick=t,i}function Re(e,n){const t=O.find(Ue=>Ue.path===e);if(t){t.window.focus();return}const o=b(),i=Ot(e),a=q({name:e}),r=w[a]||w.unknown,s=w.image.exts.includes(i),c=w.video.exts.includes(i),l=w.audio.exts.includes(i),u=i===".pdf",d=i===".md",m=u||d||w.document.exts.includes(i),y=w.code.exts.includes(i),x=w.spreadsheet.exts.includes(i),f=document.createElement("div");f.id=`dm-preview-${Date.now()}`,f.className="dm-floating-preview",f.style.cssText=`
    position: fixed;
    top: 100px;
    right: 50px;
    width: 500px;
    height: 600px;
    background: ${o.bgPrimary};
    border: 1px solid ${o.borderColor};
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: ${_.FLOATING_Z_INDEX};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;const g=Jt(n,r,s,c,l,m,y,x,f);f.appendChild(g);const v=document.createElement("div");v.id=`dm-preview-content-${Date.now()}`,v.style.cssText=`
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${o.bgPrimary};
  `,f.appendChild(v);const{toolbar:C,mediaId:T}=en(e,i,s,c,l,u,d,y,x,v,f);f.appendChild(C);const $=document.createElement("div");$.id=`dm-fileinfo-${Date.now()}`,$.className="dm-floating-file-info",$.style.cssText=`
    padding: 10px 15px;
    background: ${o.bgSecondary};
    border-top: 1px solid ${o.borderColor};
    font-size: 12px;
    color: ${o.textSecondary};
    text-align: center;
  `,$.innerHTML='<span style="opacity: 0.5;">正在加载...</span>',f.appendChild($),document.body.appendChild(f),k(),we(f,g);const F={path:e,fileName:n,fileConfig:r,window:f,minimized:!1};O.push(F),Gt(v,e,i,Zt,T),P(`已打开预览: ${n}`)}function Jt(e,n,t,o,i,a,r,s,c,l){const u=b(),d=u.isLight?"#222":"#fff",m=document.createElement("div");m.className="dm-preview-header",m.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: linear-gradient(135deg, ${u.bgSecondary} 0%, ${u.bgPrimary} 100%);
    border-bottom: 1px solid ${u.borderColor};
    cursor: move;
    user-select: none;
  `;const y=document.createElement("div");y.className="dm-traffic-lights",y.style.cssText="display: flex; gap: 8px;";const x=X("pi-times",d,"关闭",()=>tn(c));y.appendChild(x);const f=X("pi-minus",d,"最小化",()=>nn(c));if(y.appendChild(f),t||o||i||a||r||s){const v=X("pi-window-maximize",d,"全屏",()=>H(c));y.appendChild(v)}m.appendChild(y);const g=document.createElement("div");return g.className="dm-header-title-area",g.style.cssText="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; flex: 1; justify-content: center;",g.innerHTML=`
    <i class="pi ${n.icon}" style="color: ${n.color};"></i>
    <span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e}</span>
  `,m.appendChild(g),oe(v=>{const C=v.isLight?"#222":"#fff";m.style.background=`linear-gradient(135deg, ${v.bgSecondary} 0%, ${v.bgPrimary} 100%)`,m.style.borderColor=v.borderColor,g.style.color=C,m.querySelectorAll(".dm-traffic-btn").forEach($=>{$.style.color=C})}),m}function X(e,n,t,o){const i=document.createElement("button");return i.className="comfy-btn dm-traffic-btn",i.innerHTML=`<i class="pi ${e}" style="font-size: 10px; color: ${n};"></i>`,i.style.cssText=`
    width: 14px;
    height: 14px;
    padding: 0px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  `,i.title=t,i.onclick=a=>{a.stopPropagation(),o()},i}function Kt(e,n,t,o,i){const a=b();let r=ye;e.appendChild(i());const s=o("pi-minus","减小字号",()=>{r=Math.max(8,r-1),d()});e.appendChild(s);const c=document.createElement("span");c.style.cssText=`min-width: 30px; text-align: center; color: ${a.textSecondary};`,c.textContent=r.toString(),e.appendChild(c);const l=o("pi-plus","增大字号",()=>{r=Math.min(32,r+1),d()});e.appendChild(l);const u=o("pi-undo","重置字号",()=>{r=ye,d()});e.appendChild(u);function d(){c.textContent=r.toString();const m=n.querySelector(".dm-document-content, .dm-docx-content");m&&(m.style.fontSize=`${r}px`)}}function Qt(e,n,t,o,i){const a=b();let r=ge;e.appendChild(i());const s=o("pi-minus","减小字号",()=>{r=Math.max(8,r-1),d()});e.appendChild(s);const c=document.createElement("span");c.style.cssText=`min-width: 30px; text-align: center; color: ${a.textSecondary};`,c.textContent=r.toString(),e.appendChild(c);const l=o("pi-plus","增大字号",()=>{r=Math.min(32,r+1),d()});e.appendChild(l);const u=o("pi-undo","重置字号",()=>{r=ge,d()});e.appendChild(u);function d(){c.textContent=r.toString();const m=n.querySelector(".dm-code-content");m&&(m.style.fontSize=`${r}px`)}}function Ve(e,n,t,o,i,a,r,s){const c=b(),l=n.querySelector(`#${s}`);if(!l){setTimeout(()=>Ve(e,n,t,o,i,a,r,s),50);return}const u=document.createElement("span");u.className="dm-media-time",u.style.cssText=`min-width: 80px; text-align: center; color: ${c.textSecondary}; font-size: 11px; font-family: monospace;`,u.textContent="0:00 / 0:00",u.id=`${s}-time`,e.appendChild(u),e.appendChild(a());const d=i("pi-volume-up","音量",()=>{l.muted?(l.muted=!1,d.innerHTML='<i class="pi pi-volume-up"></i>',d.title="音量"):(l.muted=!0,d.innerHTML='<i class="pi pi-volume-off"></i>',d.title="静音")});e.appendChild(d),l.addEventListener("volumechange",()=>{l.muted||l.volume===0?d.innerHTML='<i class="pi pi-volume-off"></i>':l.volume<.5?d.innerHTML='<i class="pi pi-volume-down"></i>':d.innerHTML='<i class="pi pi-volume-up"></i>'}),e.appendChild(a());const m=i("pi-play","播放",()=>{l.paused?l.play().then(()=>{m.innerHTML='<i class="pi pi-pause"></i>',m.title="暂停"}).catch(f=>console.error("[DataManager] 播放失败:",f)):(l.pause(),m.innerHTML='<i class="pi pi-play"></i>',m.title="播放")});e.appendChild(m),l.addEventListener("play",()=>{m.innerHTML='<i class="pi pi-pause"></i>',m.title="暂停"}),l.addEventListener("pause",()=>{m.innerHTML='<i class="pi pi-play"></i>',m.title="播放"});function y(f){if(isNaN(f))return"0:00";const g=Math.floor(f/60),v=Math.floor(f%60);return`${g}:${v.toString().padStart(2,"0")}`}if(l.addEventListener("loadedmetadata",()=>{u.textContent=`0:00 / ${y(l.duration)}`}),l.addEventListener("timeupdate",()=>{u.textContent=`${y(l.currentTime)} / ${y(l.duration||0)}`}),o){e.appendChild(a());const f=i("pi-arrows-alt","全屏",()=>{H(r)});e.appendChild(f)}e.appendChild(a());const x=i("pi-external-link","打开",()=>{window.open(`/dm/preview?path=${encodeURIComponent(t)}`,"_blank")});e.appendChild(x)}function en(e,n,t,o,i,a,r,s,c,l,u){const d=b(),m=document.createElement("div");m.className="dm-preview-toolbar",m.style.cssText=`
    padding: 12px 16px;
    background: linear-gradient(to bottom, ${d.bgTertiary}, ${d.bgSecondary});
    border-top: 1px solid ${d.borderColor};
    display: flex;
    align-items: center;
    font-size: 12px;
    color: ${d.textSecondary};
  `;const y=document.createElement("div");y.style.cssText="display: flex; gap: 8px; align-items: center; flex-shrink: 0;";const x=document.createElement("div");x.style.cssText="flex: 1; text-align: center; overflow: hidden; padding: 0 20px;";const f=document.createElement("div");f.style.cssText="display: flex; gap: 8px; align-items: center; flex-shrink: 0;";function g(){const T=document.createElement("div");return T.style.cssText=`width: 1px; height: 16px; background: ${d.borderColor}; margin: 0 4px;`,T}t&&y.appendChild(g()),(n===".txt"||n===".rtf"||n===".md"||n===".docx")&&Kt(y,l,n,D,g),s&&Qt(y,l,n,D,g);const v=document.createElement("div");v.className="dm-file-path",v.style.cssText=`overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${d.textSecondary};`,v.textContent=e,v.title=e,x.appendChild(v),f.appendChild(g());let C;if(t)C=`dm-floating-image-${Date.now()}`,se(f,C,l,e,D,g);else if(o||i)C=o?`dm-preview-video-${Date.now()}`:`dm-preview-audio-${Date.now()}`,Ve(f,l,e,o,D,g,u,C);else{const T=D("pi-external-link","打开",()=>{window.open(`/dm/preview?path=${encodeURIComponent(e)}`,"_blank")});f.appendChild(T)}if(a){f.appendChild(g());const T=D("pi-arrows-alt","PDF 全屏",()=>{const $=document.getElementById("dm-floating-pdf-embed");$&&$.requestFullscreen?$.requestFullscreen().catch(F=>console.error("[DataManager] PDF 全屏失败:",F)):$&&$.webkitRequestFullscreen&&$.webkitRequestFullscreen()});f.appendChild(T)}if(n===".md"||n===".txt"||n===".rtf"){f.appendChild(g());const T=D("pi-arrows-alt","全屏预览",()=>H(u));f.appendChild(T)}if(s){f.appendChild(g());const T=D("pi-arrows-alt","全屏预览",()=>H(u));f.appendChild(T)}if(c){f.appendChild(g());const T=D("pi-arrows-alt","全屏预览",()=>H(u));f.appendChild(T)}return m.appendChild(y),m.appendChild(x),m.appendChild(f),{toolbar:m,mediaId:C}}function se(e,n,t,o,i,a){const r=b(),s=t.querySelector(`#${n}`);if(!s){setTimeout(()=>se(e,n,t,o,i,a),50);return}let c=100,l=0,u=0;const d=document.createElement("span");d.id=`${n}-zoom`,d.className="dm-zoom-level",d.style.cssText=`min-width: 45px; text-align: center; font-size: 13px; color: ${r.textSecondary};`,d.textContent="100%",e.appendChild(d);function m(){const $=c/100;s.style.transform=`translate(${l}px, ${u}px) scale(${$})`,d.textContent=`${c}%`,c>100?(s.style.maxWidth="none",s.style.maxHeight="none"):(s.style.maxWidth="100%",s.style.maxHeight="100%")}const y=i("pi-search-minus","缩小",()=>{c=Math.max(c-_.DEFAULT_ZOOM_STEP,_.MIN_ZOOM_DISPLAY),m()});e.appendChild(y);const x=i("pi-search-plus","放大",()=>{c=Math.min(c+_.DEFAULT_ZOOM_STEP,_.MAX_ZOOM_DISPLAY),m()});e.appendChild(x);const f=i("pi-undo","重置",()=>{c=100,l=0,u=0,m()});e.appendChild(f),e.appendChild(a());const g=i("pi-external-link","打开",()=>{window.open(`/dm/preview?path=${encodeURIComponent(o)}`,"_blank")});e.appendChild(g);const v=s.parentElement;v&&v.addEventListener("wheel",$=>{$.preventDefault();const F=$.deltaY>0?-25:_.DEFAULT_ZOOM_STEP;c=Math.max(_.MIN_ZOOM_DISPLAY,Math.min(_.MAX_ZOOM_DISPLAY,c+F)),m()},{passive:!1});let C=!1,T={x:0,y:0};s.addEventListener("mousedown",$=>{c<=100||(C=!0,T={x:$.clientX-l,y:$.clientY-u},s.style.cursor="grabbing")}),document.addEventListener("mousemove",$=>{C&&(l=$.clientX-T.x,u=$.clientY-T.y,m())}),document.addEventListener("mouseup",()=>{C&&(C=!1,s.style.cursor="grab")})}function tn(e){const n=O.findIndex(t=>t.window===e);n>-1&&O.splice(n,1),e.remove(),re()}function nn(e,n,t,o){const i=O.find(a=>a.window===e);i&&(i.minimized=!0),e.style.display="none",re()}function H(e){e.dataset.fullscreen==="true"?(e.dataset.fullscreen="false",e.style.top="100px",e.style.right="50px",e.style.width="500px",e.style.height="600px"):(e.dataset.fullscreen="true",e.style.top="0",e.style.right="0",e.style.width="100vw",e.style.height="100vh",e.style.borderRadius="0")}const on=Object.freeze(Object.defineProperty({__proto__:null,openFloatingPreview:Re,setupImageToolbarControls:se},Symbol.toStringTag,{value:"Module"})),rn=2,sn=typeof L.ui<"u"&&L.ui!==null&&L.ui?.version&&typeof L.ui.version=="object"&&L.ui.version.major&&L.ui.version.major>=rn;console.log(`[DataManager] Extension loading, Node V${sn?"3":"1"} detected`);let Z=null;const an={name:"ComfyUI.DataManager",commands:[{id:"data-manager.open",label:"Open Data Manager",icon:"pi pi-folder-open",function:()=>B()}],keybindings:[{combo:{key:"d",ctrl:!0,shift:!0},commandId:"data-manager.open"}],actionBarButtons:[{icon:"pi pi-folder",tooltip:"文件管理器 (Ctrl+Shift+D)",class:"dm-actionbar-btn",onClick:()=>B()}],async setup(){window.FileManagerState=p,k();const e=document.createElement("style");e.textContent=`
      .dm-actionbar-btn {
        width: 32px !important;
        height: 32px !important;
        border: none !important;
        border-radius: 6px !important;
        background: var(--dm-bg-tertiary, #f0f0f0) !important;
        color: var(--dm-text-primary, #222222) !important;
        margin-right: 0.5rem !important;
        transition: all 0.2s ease !important;
      }
      .dm-actionbar-btn:hover {
        background: var(--dm-bg-hover, #e0e0e0) !important;
      }
      .dm-actionbar-btn i {
        color: var(--dm-text-primary, #222222) !important;
      }
    `,document.head.appendChild(e);const n=()=>{try{k();const r=document.documentElement.style.getPropertyValue("--dm-bg-tertiary")}catch(a){console.warn("[DataManager] Theme apply error:",a)}};n(),setTimeout(n,0),setTimeout(n,100),setTimeout(n,500);const t=()=>{const a=document.querySelector(".dm-actionbar-btn"),r=Array.from(document.querySelectorAll("button")).find(l=>l.getAttribute("aria-label")==="Expand job queue");if(!a||!r)return!1;k();const s=r.parentElement;return r.previousElementSibling!==a||a.parentElement!==s?(s.insertBefore(a,r),!0):!1};let o=0;new MutationObserver(a=>{const r=Date.now();if(r-o<100)return;o=r,a.some(c=>{if(c.type==="childList"){for(const l of c.addedNodes)if(l.nodeType===1){const u=l;if(u.classList?.contains("actionbar-container")||u.classList?.contains("dm-actionbar-btn")||u.querySelector?.(".dm-actionbar-btn")||u.querySelector?.('[aria-label="Expand job queue"]'))return!0}}return!!c.target.closest?.(".actionbar-container")})&&requestAnimationFrame(t)}).observe(document.body,{childList:!0,subtree:!0}),setInterval(()=>{t()},2e3),console.log("[DataManager] Extension setup completed"),ot(),oe(a=>{document.querySelectorAll(".dm-node-open-btn").forEach(r=>{const s=r;s.style.background=a.bgTertiary,s.style.borderColor=a.borderColor,s.style.color=a.textPrimary})})},async nodeCreated(e){const n=e;if(n.comfyClass==="DataManagerCore"){if(n.addDOMWidget){k();const t=b(),o=document.createElement("div");o.style.cssText=`
          display: flex;
          justify-content: center;
          padding: 10px;
        `;const i=document.createElement("button");i.className="comfy-btn dm-node-open-btn",i.innerHTML='<i class="pi pi-folder-open"></i> 打开文件管理器',i.style.cssText=`
          padding: 12px 24px;
          font-size: 14px;
          background: ${t.bgTertiary};
          border: 1px solid ${t.borderColor};
          border-radius: 8px;
          color: ${t.textPrimary};
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `,i.onmouseover=()=>{i.style.background=t.bgSecondary,i.style.transform="translateY(-1px)",i.style.borderColor=t.accentColor,i.style.boxShadow="0 4px 8px rgba(0, 0, 0, 0.3)"},i.onmouseout=()=>{i.style.background=t.bgTertiary,i.style.transform="translateY(0)",i.style.borderColor=t.borderColor,i.style.boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)"},i.onclick=a=>{a.stopPropagation(),B()},o.appendChild(i),n.addDOMWidget("dm_open_btn","dm_open_btn",o,{minWidth:200,minHeight:50})}}else if(n.comfyClass==="InputPathConfig")n._dmFormatSelectorEnabled=!1;else if(n.comfyClass==="OutputPathConfig"){const t=n;t._dmOutputType="STRING",t._dmFilePath=""}},getNodeMenuItems(e){return e.comfyClass==="DataManagerCore"?[{content:"打开文件管理器",callback:()=>B()}]:[]},getCanvasMenuItems(){return[null,{content:"Data Manager",callback:()=>B()}]}};function B(){Z&&fe();const e=he();e&&e!=="."?p.currentPath=e:p.currentPath=".",Z=St({onRefresh:()=>M(p.currentPath),onClose:()=>{fe(),Z=null},onOpenFloating:()=>{const t=p.selectedFiles[0];t&&Re(t,Ce(t))},onCopyPath:()=>ln(),onDelete:()=>dn(),onSortChange:t=>{Te(t)},onNewFile:()=>pn(),onSshConnect:async t=>{const o=t,i=window._remoteConnectionsState;i.active=t;try{localStorage.setItem("comfyui_datamanager_last_connection",JSON.stringify(t))}catch{}await M(o.root_path||"/"),S("success","已连接",`SSH: ${o.username}@${o.host}`)},onSshDisconnect:async()=>{const t=window._remoteConnectionsState,o=t.active;if(o&&o.connection_id)try{const{sshDisconnect:i}=await I(async()=>{const{sshDisconnect:a}=await import("./ssh.js");return{sshDisconnect:a}},[]);await i(o.connection_id)}catch(i){console.log("[DataManager] SSH disconnect error:",i)}t.active=null;try{localStorage.removeItem("comfyui_datamanager_last_connection")}catch{}await M("."),S("info","已断开","SSH 连接已断开")}}),k(),M(p.currentPath),setTimeout(()=>{cn()},500)}function cn(){try{wt()}catch(e){console.log("[DataManager] Error in checkAndUpdateFormatSelector:",e)}}function ln(){const e=p.selectedFiles;if(e.length===0){S("warn","未选择","请先选择文件");return}const n=e.join(`
`);navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(n).then(()=>{S("success","已复制",`已复制 ${e.length} 个文件路径`)}).catch(()=>{xe(n)}):xe(n)}function xe(e){const n=document.createElement("textarea");n.value=e,n.style.position="fixed",n.style.left="-999999px",n.style.top="-999999px",document.body.appendChild(n),n.focus(),n.select();try{document.execCommand("copy")?S("success","已复制",`已复制 ${p.selectedFiles.length} 个文件路径`):S("error","复制失败","无法复制到剪贴板")}catch(t){console.error("[DataManager] Fallback copy failed:",t),S("error","复制失败","无法访问剪贴板")}document.body.removeChild(n)}async function dn(){const e=p.selectedFiles;if(e.length===0){S("warn","未选择","请先选择文件");return}const n=e.length===1?`确定删除 "${Ce(e[0])}"?`:`确定删除 ${e.length} 个项目?`;if(confirm(n))try{for(const t of e)await Dt(t,!0);S("success","已删除",`已删除 ${e.length} 个项目`),M(p.currentPath)}catch(t){S("error","删除失败",t.message)}}function pn(){const{getComfyTheme:e}=require("../utils/theme.js"),n=e(),t=document.createElement("div");t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7); z-index: 10001;
    display: flex; align-items: center; justify-content: center;
  `;const o=document.createElement("div");o.style.cssText=`
    background: ${n.bgSecondary}; border-radius: 12px; padding: 24px;
    width: 400px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  `,o.innerHTML=`
    <h3 style="margin: 0 0 20px 0; color: ${n.textPrimary};">新建</h3>
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button id="dm-new-file-btn" class="comfy-btn"
              style="flex: 1; padding: 15px; background: ${n.bgTertiary}; border: 1px solid ${n.borderColor};
                     border-radius: 8px; color: ${n.textPrimary}; cursor: pointer;">
        <i class="pi pi-file" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
        文件
      </button>
      <button id="dm-new-folder-btn" class="comfy-btn"
              style="flex: 1; padding: 15px; background: ${n.bgTertiary}; border: 1px solid ${n.borderColor};
                     border-radius: 8px; color: ${n.textPrimary}; cursor: pointer;">
        <i class="pi pi-folder" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
        文件夹
      </button>
    </div>
    <button class="comfy-btn" id="dm-cancel-new-btn"
            style="width: 100%; padding: 10px; background: transparent;
                   border: 1px solid ${n.borderColor}; border-radius: 6px; color: ${n.textSecondary}; cursor: pointer;">
      取消
    </button>
  `,t.appendChild(o),document.body.appendChild(t);const i=o.querySelector("#dm-new-file-btn"),a=o.querySelector("#dm-new-folder-btn"),r=o.querySelector("#dm-cancel-new-btn");i.onclick=()=>{t.remove(),mn()},a.onclick=()=>{t.remove(),un()},r.onclick=()=>t.remove(),t.onclick=s=>{s.target===t&&t.remove()}}async function mn(){const e=prompt("输入文件名:","new_file.txt");if(e)try{await Pt(p.currentPath,e,""),await M(p.currentPath),S("success","成功",`文件已创建: ${e}`)}catch(n){console.error("创建文件失败:",n),S("error","错误",`创建文件失败: ${n.message}`)}}async function un(){const e=prompt("输入文件夹名称:","新建文件夹");if(e)try{await Mt(p.currentPath,e),await M(p.currentPath),S("success","成功",`文件夹已创建: ${e}`)}catch(n){console.error("创建文件夹失败:",n),S("error","错误",`创建文件夹失败: ${n.message}`)}}L.registerExtension(an);export{on as A,w as F,_ as L,I as _,yn as a,gn as b,b as c,Ce as d,E as e,It as f,Ot as g,ve as h,Ie as i,Pe as j,Me as k,Ae as l,De as m,ke as n,Oe as o,Le as p,ze as q,Ne as r,Fe as s,Be as t,P as u,je as v,He as w,tt as x,xn as y,hn as z};
//# sourceMappingURL=extension.js.map
