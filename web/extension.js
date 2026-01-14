import{app as S}from"../../scripts/app.js";const Oe="modulepreload",ke=function(e){return"/"+e},Q={},$=function(t,n,o){let i=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),r=s?.nonce||s?.getAttribute("nonce");i=Promise.allSettled(n.map(c=>{if(c=ke(c),c in Q)return;Q[c]=!0;const l=c.endsWith(".css"),d=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${d}`))return;const g=document.createElement("link");if(g.rel=l?"stylesheet":Oe,l||(g.as="script"),g.crossOrigin="",g.href=c,r&&g.setAttribute("nonce",r),document.head.appendChild(g),l)return new Promise((m,u)=>{g.addEventListener("load",m),g.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${c}`)))})}))}function a(s){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=s,window.dispatchEvent(r),!r.defaultPrevented)throw s}return i.then(s=>{for(const r of s||[])r.status==="rejected"&&a(r.reason);return t().catch(a)})},M={LAST_PATH:"comfyui_datamanager_last_path",VIEW_MODE:"comfyui_datamanager_view_mode",SORT_BY:"comfyui_datamanager_sort_by",REMOTE_CONNECTIONS:"comfyui_datamanager_remote_connections",LAST_CONNECTION:"comfyui_datamanager_last_connection"},p={currentPath:"",selectedFiles:[],currentPreviewFile:null,viewMode:"list",sortBy:"name",sortOrder:"asc",files:[],history:[],historyIndex:-1};function Y(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch(n){console.warn("[DataManager] Failed to save state:",n)}}function J(e,t){try{const n=localStorage.getItem(e);return n?JSON.parse(n):t}catch(n){return console.warn("[DataManager] Failed to load state:",n),t}}function ce(e){Y(M.LAST_PATH,e)}function le(){return J(M.LAST_PATH,".")}function Le(e){Y(M.VIEW_MODE,e)}function Ne(){return J(M.VIEW_MODE,"list")}let ze=null,Ae=null,I=[];const Fe=M.REMOTE_CONNECTIONS,Be=M.LAST_CONNECTION;let D={active:null,saved:[]};function je(){try{const e=localStorage.getItem(Fe);e&&(D.saved=JSON.parse(e));const t=localStorage.getItem(Be);t&&(D.active=JSON.parse(t)),window._remoteConnectionsState?(window._remoteConnectionsState.active=D.active,window._remoteConnectionsState.saved=D.saved):window._remoteConnectionsState=D}catch(e){console.warn("[DataManager] Failed to init remote connections:",e)}}je();const Ve=D,Bt=Object.freeze(Object.defineProperty({__proto__:null,FileManagerState:p,STORAGE_KEYS:M,fileManagerWindow:ze,getLastPath:le,getViewMode:Ne,loadState:J,previewFloatingWindows:I,previewModal:Ae,remoteConnectionsState:Ve,saveLastPath:ce,saveState:Y,saveViewMode:Le},Symbol.toStringTag,{value:"Module"})),de=[];function pe(e){de.push(e)}function ee(){const e=L();de.forEach(t=>{try{t(e)}catch(n){console.error("[DataManager] Theme listener error:",n)}})}function He(){const e=new MutationObserver(o=>{let i=!1;for(const a of o)if(a.type==="attributes"){i=!0;break}i&&(z(),ee())});e.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme"]});let t=te();const n=window.setInterval(()=>{const o=te();JSON.stringify(t)!==JSON.stringify(o)&&(t=o,z(),ee())},2e3);return{observer:e,checkInterval:n}}function te(){const e=window.getComputedStyle(document.documentElement);return{bg:e.getPropertyValue("--comfy-menu-bg"),bg2:e.getPropertyValue("--comfy-menu-bg-2"),inputText:e.getPropertyValue("--input-text"),borderColor:e.getPropertyValue("--border-color")}}let ne=null;function Re(){ne||setTimeout(()=>{try{ne=He()}catch(e){console.error("[DataManager] Theme watcher init failed:",e)}},1e3)}function Ue(e){const t=e.replace("#","");if(t.length===3){const n=parseInt(t[0]+t[0],16),o=parseInt(t[1]+t[1],16),i=parseInt(t[2]+t[2],16);return(n*299+o*587+i*114)/1e3>128}if(t.length===6){const n=parseInt(t.substring(0,2),16),o=parseInt(t.substring(2,4),16),i=parseInt(t.substring(4,6),16);return(n*299+o*587+i*114)/1e3>128}return!1}function L(){try{const e=window.getComputedStyle(document.documentElement),t=window.getComputedStyle(document.body),n=e.getPropertyValue("--comfy-menu-bg")?.trim()||"#1a1a1a",o=e.getPropertyValue("--comfy-menu-bg-2")?.trim()||e.getPropertyValue("--comfy-menu-secondary-bg")?.trim()||"#252525",i=e.getPropertyValue("--comfy-input-bg")?.trim()||"#2a2a2a",a=Ue(n),s=e.getPropertyValue("--input-text")?.trim()||e.getPropertyValue("--input-text-text")?.trim()||(a?"#222":"#ddd"),r=e.getPropertyValue("--descrip-text")?.trim()||(a?"#666":"#999");return{bgPrimary:n,bgSecondary:o,bgTertiary:e.getPropertyValue("--comfy-menu-bg-3")?.trim()||"#2a2a2a",inputBg:i,inputText:s,borderColor:e.getPropertyValue("--border-color")?.trim()||(a?"#ddd":"#3a3a3a"),textPrimary:s,textSecondary:r,accentColor:e.getPropertyValue("--comfy-accent")?.trim()||"#9b59b6",errorColor:"#e74c3c",successColor:"#27ae60",isLight:a}}catch(e){return console.warn("[DataManager] Failed to get ComfyUI theme:",e),{bgPrimary:"#1a1a1a",bgSecondary:"#252525",bgTertiary:"#2a2a2a",inputBg:"#2a2a2a",inputText:"#ddd",borderColor:"#3a3a3a",textPrimary:"#ddd",textSecondary:"#999",accentColor:"#9b59b6",errorColor:"#e74c3c",successColor:"#27ae60",isLight:!1}}}function z(){const e=L(),t=document.documentElement;t.style.setProperty("--dm-bg-primary",e.bgPrimary),t.style.setProperty("--dm-bg-secondary",e.bgSecondary),t.style.setProperty("--dm-bg-tertiary",e.bgTertiary),t.style.setProperty("--dm-input-bg",e.inputBg),t.style.setProperty("--dm-input-text",e.inputText),t.style.setProperty("--dm-border-color",e.borderColor),t.style.setProperty("--dm-text-primary",e.textPrimary),t.style.setProperty("--dm-text-secondary",e.textSecondary),t.style.setProperty("--dm-accent-color",e.accentColor),t.style.setProperty("--dm-error-color",e.errorColor),t.style.setProperty("--dm-success-color",e.successColor)}function oe(e,t){e&&(e.style.background=`linear-gradient(135deg, ${t.bgSecondary} 0%, ${t.bgPrimary} 100%)`,e.style.borderColor=t.borderColor)}function We(e={}){const{title:t="Data Manager",icon:n="pi-folder-open",onClose:o=null,onMinimize:i=null,onFullscreen:a=null,onRefresh:s=null}=e,r=document.createElement("div");r.className="dm-header dm-preview-header",r.setAttribute("draggable","false");const c=L();r.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: linear-gradient(135deg, ${c.bgSecondary} 0%, ${c.bgPrimary} 100%);
    border-bottom: 1px solid ${c.borderColor};
    cursor: move;
    user-select: none;
  `;const l=document.createElement("div");l.className="dm-traffic-lights",l.style.cssText="display: flex; gap: 8px;";const d=j("pi-times","关闭",o),g=j("pi-minus","最小化",i),m=j("pi-window-maximize","全屏",a);l.appendChild(d),l.appendChild(g),l.appendChild(m);const u=document.createElement("div");u.className="dm-header-title-area",u.style.cssText=`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    flex: 1 1 0%;
    justify-content: center;
  `;const f=document.createElement("i");f.className=`pi ${n}`;const w=document.createElement("span");w.style.cssText=`
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,w.textContent=t,u.appendChild(f),u.appendChild(w);const h=document.createElement("div");if(h.style.cssText="display: flex; gap: 8px;",s){const v=qe("pi-refresh","刷新",s);v.style.background="transparent",h.appendChild(v)}return r.appendChild(l),r.appendChild(u),r.appendChild(h),r._updateTheme=()=>{const v=L();oe(r,v)},pe(v=>{oe(r,v)}),r}function j(e,t,n){const o=document.createElement("button");return o.className="comfy-btn dm-traffic-btn",o.innerHTML=`<i class="pi ${e}" style="font-size: 10px;"></i>`,o.style.cssText=`
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
  `,o.title=t,n&&(o.onclick=i=>{i.stopPropagation(),n()}),o}function qe(e,t,n){const o=document.createElement("button");return o.className="comfy-btn dm-header-btn",o.innerHTML=`<i class="pi ${e}"></i>`,o.style.cssText=`
    padding: 6px 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 4px;
  `,o.title=t,o.onmouseover=()=>o.style.background="",o.onmouseout=()=>o.style.background="transparent",o.onclick=n,o}function Ge(e){const{onSshConnect:t,onSshDisconnect:n}=e,o=document.createElement("div");o.style.cssText="display: flex; align-items: center; gap: 5px;";const i=document.createElement("select");return i.id="dm-remote-select",i.style.cssText=`
    padding: 8px 12px;
    border: 1px solid #444;
    border-radius: 6px;
    font-size: 13px;
    min-width: 150px;
    cursor: pointer;
  `,V(i),i.onchange=async a=>{const s=a.target.value,r=window._remoteConnectionsState;if(s==="__local__"){r.active=null;try{localStorage.removeItem("comfyui_datamanager_last_connection")}catch{}V(i),A(),n&&n()}else if(s.startsWith("conn_")){const c=s.substring(5),l=r.saved.find(d=>d.id===c);if(l)try{i.disabled=!0;const d=document.createElement("option");d.textContent="连接中...",i.innerHTML="",i.appendChild(d),t&&t({connection_id:c,host:l.host,port:l.port,username:l.username,password:atob(l.password||"")})}catch(d){alert("连接失败: "+d.message),V(i)}}a.target.value=""},o.appendChild(i),o}function V(e,t,n){const o=window._remoteConnectionsState,i=o.active;e.innerHTML="";const a=document.createElement("option");a.value="__local__",a.textContent="本地",e.appendChild(a),o.saved.forEach(s=>{const r=document.createElement("option");r.value=`conn_${s.id}`,r.textContent=s.name||`${s.username}@${s.host}`,i&&i.connection_id===s.id&&(r.style.color="#27ae60"),e.appendChild(r)})}function A(){const e=document.getElementById("dm-connection-indicator"),t=document.getElementById("dm-connection-status"),o=window._remoteConnectionsState.active;e&&(e.style.background=o?"#27ae60":"#666"),t&&(o?t.textContent=`SSH: ${o.username}@${o.host}`:t.textContent="")}function Ye(e){const{onSshConnect:t,onSshDisconnect:n}=e,o=document.createElement("button");return o.className="comfy-btn",o.id="dm-settings-btn",o.innerHTML='<i class="pi pi-cog"></i>',o.style.cssText=`
    padding: 8px 12px;
    border: 1px solid #444;
    border-radius: 6px;
    cursor: pointer;
    background: transparent;
    color: #ccc;
  `,o.title="连接管理",o.onclick=async()=>{const{openSettingsPanel:i}=await $(async()=>{const{openSettingsPanel:a}=await import("./settings.js");return{openSettingsPanel:a}},[]);i({onConnect:a=>{const s=window._remoteConnectionsState;s.active=a;try{localStorage.setItem("comfyui_datamanager_last_connection",JSON.stringify(a))}catch{}A(),t&&t(a)},onDisconnect:async()=>{const a=window._remoteConnectionsState,s=a.active;if(s&&s.connection_id)try{const{sshDisconnect:r}=await $(async()=>{const{sshDisconnect:c}=await import("./ssh.js");return{sshDisconnect:c}},[]);await r(s.connection_id)}catch(r){console.log("[DataManager] SSH disconnect error:",r)}a.active=null;try{localStorage.removeItem("comfyui_datamanager_last_connection")}catch{}A(),n&&n()}})},o}function Je(e={}){const t=document.createElement("div");t.className="dm-toolbar",t.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    border-bottom: 1px solid;
    gap: 15px;
  `;const n=document.createElement("div");n.style.cssText="display: flex; align-items: center; gap: 10px;";const o=document.createElement("input");o.id="dm-path-input",o.type="text",o.className="dm-input",o.style.cssText=`
    flex: 1;
    min-width: 300px;
    padding: 8px 12px;
    border: 1px solid #444;
    border-radius: 6px;
    font-size: 13px;
    background: #2a2a2a;
    color: #fff;
  `,o.value=p.currentPath||".",o.onkeypress=a=>{if(a.key==="Enter"){const{loadDirectory:s}=require("./actions.js");s(a.target.value)}},n.appendChild(o),t.appendChild(n);const i=document.createElement("div");return i.style.cssText="display: flex; align-items: center; gap: 10px;",i.appendChild(Ge(e)),i.appendChild(Ye(e)),t.appendChild(i),setTimeout(()=>A(),100),t}const F={LIST:"/dm/list",PREVIEW:"/dm/preview",INFO:"/dm/info",DELETE:"/dm/delete"},E={MAX_PREVIEW_ROWS:100,DEFAULT_ZOOM_STEP:25,MIN_ZOOM_DISPLAY:25,MAX_ZOOM_DISPLAY:300,FLOATING_Z_INDEX:10001},x={image:{exts:[".jpg",".jpeg",".png",".gif",".bmp",".webp",".svg",".ico",".tiff",".tif",".avif",".heic",".heif",".tga"],icon:"pi-image",color:"#e74c3c"},video:{exts:[".mp4",".webm",".mov",".mkv"],icon:"pi-video",color:"#9b59b6"},videoExternal:{exts:[".avi"],icon:"pi-video",color:"#8e44ad"},audio:{exts:[".mp3",".wav",".flac",".aac",".ogg",".wma",".m4a"],icon:"pi-volume-up",color:"#3498db"},document:{exts:[".pdf",".doc",".docx",".txt",".rtf",".md"],icon:"pi-file",color:"#95a5a6"},spreadsheet:{exts:[".xls",".xlsx",".csv",".ods"],icon:"pi-table",color:"#27ae60"},archive:{exts:[".zip",".rar",".7z",".tar",".gz"],icon:"pi-box",color:"#f39c12"},code:{exts:[".py",".js",".html",".css",".json",".xml",".yaml",".yml",".cpp",".c",".h"],icon:"pi-code",color:"#1abc9c"},folder:{exts:[],icon:"pi-folder",color:"#f1c40f"},unknown:{exts:[],icon:"pi-file",color:"#7f8c8d"}};function B(e){if(e.is_dir)return"folder";const t="."+((e.name||e.path||"").split(".").pop()?.toLowerCase()||"");for(const[n,o]of Object.entries(x))if(o.exts&&o.exts.includes(t))return n;return"unknown"}function jt(e){for(const[t,n]of Object.entries(x))if(n.exts&&n.exts.includes(e))return t;return"unknown"}function Ze(e){if(!e)return"";for(const t of["B","KB","MB","GB"]){if(e<1024)return e.toFixed(1)+" "+t;e/=1024}return e.toFixed(1)+" TB"}function Xe(e){return e?new Date(e).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):""}function b(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Ke(e="list"){const t=document.createElement("div");t.id="dm-browser-panel",t.className="dm-browser-panel",t.style.cssText=`
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid;
    overflow: hidden;
  `,e==="list"&&t.appendChild(Qe());const n=document.createElement("div");return n.id="dm-file-list",e==="grid"?n.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      align-content: start;
    `:n.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 5px 0;
    `,n.innerHTML=`
    <div class="dm-browser-loading" style="text-align: center; padding: 40px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
    </div>
  `,t.appendChild(n),t}function Qe(){const e=document.createElement("div");e.className="dm-list-header",e.style.cssText=`
    display: flex;
    padding: 10px 15px;
    border-bottom: 1px solid;
    font-size: 12px;
    font-weight: 600;
  `;const t=(n,o,i)=>{const a=document.createElement("div");return a.className="dm-header-cell",a.dataset.sort=n,a.style.cssText=`${i}; cursor: pointer; display: flex; align-items: center; gap: 5px; user-select: none;`,a.innerHTML=`<span>${o}</span><i class="pi pi-sort" style="font-size: 10px; opacity: 0.5;"></i>`,a.onclick=async()=>{const{toggleSort:s}=await $(async()=>{const{toggleSort:r}=await Promise.resolve().then(()=>wt);return{toggleSort:r}},void 0);s(n)},a};return e.appendChild(t("name","名称","flex: 1;")),e.appendChild(t("size","大小","flex: 0 0 100px;")),e.appendChild(t("modified","修改日期","flex: 0 0 150px;")),e}function ie(e,t){const n=B(e),o=x[n]?.icon||x.unknown.icon,i=x[n]?.color||x.unknown.color,a=e.is_dir?"":Ze(e.size??0)||"",s=e.modified?Xe(String(e.modified)):"";return`
    <div class="dm-file-item" data-path="${b(e.path||e.name)}" data-is-dir="${e.is_dir||!1}"
         style="display: flex; align-items: center; padding: 10px 15px;
                border-bottom: 1px solid; cursor: pointer;
                transition: background 0.2s;">
      <div style="flex: 1; display: flex; align-items: center; gap: 10px; overflow: hidden;">
        <i class="pi ${o} dm-file-icon" style="color: ${i}; font-size: 16px;"></i>
        <span class="dm-file-name" style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b(e.name)}</span>
      </div>
      <div class="dm-file-size" style="flex: 0 0 100px; font-size: 12px;">${a}</div>
      <div class="dm-file-modified" style="flex: 0 0 150px; font-size: 12px;">${s}</div>
    </div>
  `}function ae(e,t){if(t)return`
      <div class="dm-grid-item dm-grid-item-parent" data-path="${e.path}" data-is-dir="true"
           data-name=".."
           style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                  padding: 12px 8px; height: 90px;
                  border-radius: 8px; cursor: pointer;
                  transition: all 0.2s; border: 2px dashed; box-sizing: border-box;">
        <i class="pi pi-folder-open dm-parent-icon" style="font-size: 40px;"></i>
        <span class="dm-parent-text" style="font-size: 11px; text-align: center;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                      width: 100%; margin-top: 8px;">返回上级</span>
      </div>
    `;const n=B(e),o=x[n]?.icon||x.unknown.icon,i=x[n]?.color||x.unknown.color;return`
    <div class="dm-grid-item" data-path="${b(e.path||e.name)}" data-is-dir="${e.is_dir||!1}"
         data-name="${b(e.name)}"
         style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: 12px 8px; height: 90px;
                border-radius: 8px; cursor: pointer;
                transition: all 0.2s; border: 2px solid; box-sizing: border-box;">
      <i class="pi ${o} dm-grid-icon" style="color: ${i}; font-size: 40px;"></i>
      <span class="dm-grid-filename" style="font-size: 11px; text-align: center;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    width: 100%; margin-top: 8px;">${b(e.name)}</span>
    </div>
  `}const q={png:{type:"IMAGE",label:"PNG 图像",description:"无损压缩，支持透明"},jpg:{type:"IMAGE",label:"JPEG 图像",description:"有损压缩，文件较小"},webp:{type:"IMAGE",label:"WebP 图像",description:"现代格式，高压缩比"},mp4:{type:"VIDEO",label:"MP4 视频",description:"通用视频格式"},webm:{type:"VIDEO",label:"WebM 视频",description:"优化的网络视频"},avi:{type:"VIDEO",label:"AVI 视频",description:"经典视频格式"},mp3:{type:"AUDIO",label:"MP3 音频",description:"通用音频格式"},wav:{type:"AUDIO",label:"WAV 音频",description:"无损音频"},flac:{type:"AUDIO",label:"FLAC 音频",description:"无损压缩音频"},ogg:{type:"AUDIO",label:"OGG 音频",description:"开源音频格式"},latent:{type:"LATENT",label:"Latent",description:"ComfyUI Latent 数据"},json:{type:"DATA",label:"JSON",description:"通用数据格式"},txt:{type:"DATA",label:"文本",description:"纯文本格式"}},et={IMAGE:["png","jpg","webp"],VIDEO:["mp4","webm","avi"],AUDIO:["mp3","wav","flac","ogg"],LATENT:["latent"],MASK:["png"],CONDITIONING:["json"],STRING:["txt","json"]};function tt(e){const t=e.toUpperCase();return et[t]||["json"]}function H(e){return{IMAGE:"#e74c3c",VIDEO:"#9b59b6",AUDIO:"#3498db",LATENT:"#27ae60",MASK:"#f39c12",DATA:"#95a5a6"}[e]||"#95a5a6"}function nt(e){return{IMAGE:"pi-image",VIDEO:"pi-video",AUDIO:"pi-volume-up",LATENT:"pi-cube",MASK:"pi-mask",DATA:"pi-file"}[e]||"pi-file"}function ot(e={}){const{detectedType:t=null,selectedFormat:n=null,onFormatChange:o=null,showTypeIndicator:i=!0,compact:a=!1}=e,s=document.createElement("div");if(s.className="dm-format-selector",s.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: #252525;
    border-radius: 8px;
    border: 1px solid #3a3a3a;
  `,i&&t){const m=document.createElement("div");m.className="dm-type-indicator",m.style.cssText=`
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: ${H(t)}20;
      border-left: 3px solid ${H(t)};
      border-radius: 4px;
      font-size: 12px;
      color: ${H(t)};
    `,m.innerHTML=`
      <i class="pi ${nt(t)}"></i>
      <span style="font-weight: 600;">${t}</span>
      <span style="color: #888;">检测到</span>
    `,s.appendChild(m)}const r=document.createElement("div");r.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;const c=document.createElement("label");c.style.cssText=`
    font-size: 12px;
    color: #aaa;
    font-weight: 500;
  `,c.textContent="输出格式:",r.appendChild(c);const l=t?tt(t):Object.keys(q),d=n||(t?l[0]:"png");if(a){const m=document.createElement("select");m.id="dm-format-select",m.className="comfy-combo",m.style.cssText=`
      width: 100%;
      padding: 8px 12px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
    `,l.forEach(u=>{const f=document.createElement("option");f.value=u,f.textContent=u.toUpperCase(),u===d&&(f.selected=!0),m.appendChild(f)}),m.onchange=u=>{o&&o(u.target.value),R(u.target.value)},r.appendChild(m)}else{const m=document.createElement("div");m.style.cssText=`
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    `,m.id="dm-format-buttons",l.forEach(u=>{const f=document.createElement("button");f.className="comfy-btn dm-format-btn",f.dataset.format=u,f.style.cssText=`
        padding: 8px 16px;
        background: ${u===d?"#3a3a3a":"#2a2a2a"};
        border: 1px solid ${u===d?"#9b59b6":"#3a3a3a"};
        border-radius: 6px;
        color: ${u===d?"#9b59b6":"#fff"};
        font-size: 12px;
        font-weight: ${u===d?"600":"400"};
        cursor: pointer;
        transition: all 0.2s;
      `,f.textContent=u.toUpperCase(),f.onclick=()=>{m.querySelectorAll(".dm-format-btn").forEach(w=>{const h=w;h.style.background="#2a2a2a",h.style.borderColor="#3a3a3a",h.style.color="#fff",h.style.fontWeight="400"}),f.style.background="#3a3a3a",f.style.borderColor="#9b59b6",f.style.color="#9b59b6",f.style.fontWeight="600",o&&o(u),R(u)},m.appendChild(f)}),r.appendChild(m)}s.appendChild(r);const g=document.createElement("div");return g.id="dm-format-description",g.style.cssText=`
    font-size: 11px;
    color: #888;
    padding: 8px 12px;
    background: #1a1a1a;
    border-radius: 4px;
  `,g.textContent=q[d]?.description||"",s.appendChild(g),R(d),s}function R(e){const t=document.getElementById("dm-format-description");t&&(t.textContent=q[e]?.description||"")}const it="IMAGE";function at(){try{const e=window.app,n=(e?.graph?._nodes||[]).filter(s=>s.comfyClass==="InputPathConfig");if(n.length===0)return;const a=(n[0].inputs||[]).find(s=>s.name==="file_input");if(a&&a.link){const s=a.link.origin_id,r=s!==void 0?e?.graph?.getNodeById?.(s):void 0;if(r){const c=st(r);ct(c,null,null)}}}catch(e){console.log("[DataManager] Error checking node connection:",e)}}function st(e){const t=e.type||e.comfyClass||"",n={LoadImage:"IMAGE",LoadVideo:"VIDEO",LoadAudio:"AUDIO",EmptyLatentImage:"LATENT",VAEDecode:"IMAGE",CheckpointLoaderSimple:"MODEL"};if(e.outputs&&e.outputs.length>0)for(const o of e.outputs){if(o.type==="IMAGE")return"IMAGE";if(o.type==="LATENT")return"LATENT";if(o.type==="MASK")return"MASK";if(o.type==="VIDEO")return"VIDEO";if(o.type==="AUDIO")return"AUDIO";if(o.type==="MODEL")return"MODEL";if(o.type==="VAE")return"VAE";if(o.type==="CLIP")return"CLIP"}for(const[o,i]of Object.entries(n))if(t.includes(o))return i;return it}function rt(e={}){const{onOpenFloating:t,onCopyPath:n,onDelete:o}=e,i=document.createElement("div");i.id="dm-preview-panel",i.style.cssText=`
    flex: 0 0 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;const a=document.createElement("div");a.className="dm-preview-header",a.style.cssText=`
    padding: 15px;
    border-bottom: 1px solid;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  `,a.innerHTML=`
    <h3 class="dm-title" style="margin: 0; font-size: 14px;">
      <i class="pi pi-eye"></i> 预览
    </h3>
    <div style="display: flex; gap: 5px;">
      <button id="dm-copy-path-btn" class="comfy-btn dm-icon-btn" style="padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-copy"></i>
      </button>
      <button id="dm-delete-file-btn" class="comfy-btn dm-icon-btn" style="padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-trash"></i>
      </button>
      <button id="dm-open-floating-preview-btn" class="comfy-btn dm-icon-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-window-maximize"></i>
      </button>
    </div>
  `,i.appendChild(a);const s=document.createElement("div");s.id="dm-preview-content",s.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  `,s.innerHTML=`
    <div style="text-align: center; padding: 40px; color: #666;">
      <i class="pi pi-file" style="font-size: 48px; opacity: 0.5;"></i>
      <div style="margin-top: 15px; font-size: 13px;">选择文件以预览</div>
    </div>
  `,i.appendChild(s);const r=document.createElement("div");r.id="dm-format-section",r.style.cssText=`
    padding: 15px;
    background: #1f1f1f;
    border-top: 1px solid #2a2a2a;
    display: none;
  `,r.innerHTML=`
    <div style="text-align: center; padding: 20px; color: #666;">
      <i class="pi pi-cog" style="font-size: 32px; opacity: 0.5;"></i>
      <div style="margin-top: 10px; font-size: 12px;">连接节点以启用格式选择</div>
    </div>
  `,i.appendChild(r);const c=document.createElement("div");c.id="dm-file-info",c.style.cssText=`
    padding: 15px;
    background: #252525;
    border-top: 1px solid #2a2a2a;
    font-size: 12px;
    color: #888;
  `,c.innerHTML='<div style="text-align: center;">No file selected</div>',i.appendChild(c);const l=a.querySelector("#dm-open-floating-preview-btn"),d=a.querySelector("#dm-copy-path-btn"),g=a.querySelector("#dm-delete-file-btn");return l&&t&&(l.onclick=t),d&&n&&(d.onclick=n),g&&o&&(g.onclick=o),i}function ct(e,t=null,n=null){const o=document.getElementById("dm-format-section");if(!o)return;if(o.innerHTML="",!e){o.style.display="none";return}o.style.display="block";const i=ot({detectedType:e,selectedFormat:t,onFormatChange:n,compact:!0});o.appendChild(i)}function lt(){const e=document.createElement("div");e.className="dm-bottom-area",e.style.cssText=`
    display: flex;
    flex-direction: column;
  `;const t=document.createElement("div");t.id="dm-preview-dock",t.className="dm-preview-dock",t.style.cssText=`
    min-height: 0;
    max-height: 0;
    padding: 0 15px;
    background: linear-gradient(to bottom, #252525, #1a1a1a);
    border-top: 1px solid #2a2a2a;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    transition: min-height 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
  `;const n=document.createElement("div");return n.id="dm-status-bar",n.innerHTML=`
    <div id="dm-connection-status" style="color: #27ae60;"></div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span id="dm-status-ready">就绪</span>
      <div id="dm-connection-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: #666; transition: background 0.3s ease;"></div>
    </div>
  `,e.appendChild(t),e.appendChild(n),setTimeout(()=>{const o=document.getElementById("dm-connection-indicator"),i=document.getElementById("dm-connection-status"),s=window._remoteConnectionsState?.active;if(o&&(o.style.background=s?"#27ae60":"#666"),i&&s){const r=s;i.textContent=`SSH: ${r.username}@${r.host}`}},100),e}function me(e,t){e.draggable=!1,t.draggable=!1,e.addEventListener("dragstart",n=>(n.preventDefault(),n.stopPropagation(),!1)),t.addEventListener("mousedown",n=>{if(n.target&&n.target.tagName==="BUTTON"||n.target.tagName==="I"||e.dataset.fullscreen==="true")return;n.preventDefault();const o=e.getBoundingClientRect(),i=n.clientX-o.left,a=n.clientY-o.top;e.style.transition="none",e.style.transform="none",e.style.left=o.left+"px",e.style.top=o.top+"px",e._isDragging=!0;const s=c=>{if(!e._isDragging)return;const l=c.clientX-i,d=c.clientY-a;e.style.left=Math.max(0,l)+"px",e.style.top=Math.max(0,d)+"px"},r=()=>{e.style.transition="",e._isDragging=!1,document.removeEventListener("mousemove",s),document.removeEventListener("mouseup",r)};document.addEventListener("mousemove",s),document.addEventListener("mouseup",r)})}let k=null;function dt(e={}){const t=document.createElement("div");t.id="dm-file-manager",t.style.cssText=`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1200px;
    height: 700px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,t.appendChild(We({title:"Data Manager",icon:"pi-folder-open",onClose:e.onClose,onRefresh:e.onRefresh})),t.appendChild(Je(e)),t.appendChild(pt(e)),t.appendChild(lt()),document.body.appendChild(t);const n=t.querySelector(".dm-header");return me(t,n),k=o=>{o.key==="Escape"&&(o.preventDefault(),o.stopPropagation(),e.onClose&&e.onClose())},document.addEventListener("keydown",k,{capture:!0}),t}function se(){k&&(document.removeEventListener("keydown",k,{capture:!0}),k=null);const e=document.getElementById("dm-file-manager");e&&e.remove()}function pt(e){const t=document.createElement("div");t.style.cssText="flex: 1; display: flex; overflow: hidden;";const n=Ke(p.viewMode);t.appendChild(n);const o=rt({onOpenFloating:e.onOpenFloating,onCopyPath:e.onCopyPath,onDelete:e.onDelete});return t.appendChild(o),t}async function mt(e){const t=await fetch(F.LIST,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})});if(t?.ok)return await t.json();const n=await t.json().catch(()=>({})),o=n.error||n.message||`HTTP ${t.status}`;throw new Error(`Failed to list directory: ${o}`)}function Vt(e){return`${F.PREVIEW}?path=${encodeURIComponent(e)}`}async function Ht(e){const t=await fetch(F.INFO,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})});if(t?.ok)return(await t.json()).info;const n=await t.json().catch(()=>({})),o=n.error||n.message||`HTTP ${t.status}`;throw new Error(`Failed to get file info: ${o}`)}async function ut(e,t=!0){const n=await fetch(F.DELETE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,use_trash:t})});if(n?.ok)return await n.json();const o=await n.json().catch(()=>({error:"Unknown error"}));throw new Error(o.error||"Failed to delete file")}function _(e){const t=document.getElementById("dm-status-bar");t&&(t.textContent=e)}function C(e,t,n){typeof app<"u"&&app.extensionManager?.toast?app.extensionManager.toast.add({severity:e,summary:t,detail:n,life:3e3}):console.log(`[${e.toUpperCase()}] ${t}: ${n}`)}function re(e){const t=e.replace(/\\/g,"/"),n=t.lastIndexOf("/");return n<=0?".":t.substring(0,n)}function ue(e){return e.split(/[/\\]/).pop()||""}function ft(e){return"."+(e.split(".").pop()?.toLowerCase()||"")}async function T(e){const t=window._remoteConnectionsState?.active;if(t){await gt(e,t);return}_(`正在加载: ${e}...`);try{const n=await mt(e);p.files=n.files||[],p.currentPath=n.path,ce(n.path),(p.historyIndex===-1||p.history[p.historyIndex]!==n.path)&&(p.history=p.history.slice(0,p.historyIndex+1),p.history.push(n.path),p.historyIndex=p.history.length-1);const o=document.getElementById("dm-path-input");o&&(o.value=n.path),Z(),_(`${p.files.length} 个项目`)}catch(n){console.error("Load directory error:",n),_("加载错误"),C("error","错误","网络请求失败")}}async function gt(e,t){_(`正在加载远程: ${e}...`);try{const{sshList:n}=await $(async()=>{const{sshList:a}=await import("./ssh.js");return{sshList:a}},[]),o=await n(t.connection_id,e||t.root_path||"/");p.files=o.files||[],p.currentPath=o.path||e;const i=document.getElementById("dm-path-input");i&&(i.value=`[SSH] ${o.path}`),Z(),_(`${p.files.length} 个项目 (远程)`)}catch(n){console.error("Load remote directory error:",n),_("加载错误"),C("error","错误",`远程加载失败: ${n.message}`)}}function Z(){const e=document.getElementById("dm-file-list");if(!e)return;p.selectedFiles=[];const t=[...p.files].sort((o,i)=>{const a=o.is_dir||o.isDir||!1,s=i.is_dir||i.isDir||!1;if(a&&!s)return-1;if(!a&&s)return 1;let r=0;switch(p.sortBy){case"name":r=o.name.localeCompare(i.name);break;case"size":r=(o.size||0)-(i.size||0);break;case"modified":r=new Date(o.modified||0).getTime()-new Date(i.modified||0).getTime();break}return p.sortOrder==="asc"?r:-r});let n="";p.currentPath!=="."&&p.currentPath!=="/"&&(p.viewMode==="list"?n+=ie({name:"..",path:re(p.currentPath),size:0,modified:void 0}):n+=ae({name:"..",path:re(p.currentPath)},!0)),t.forEach(o=>{n+=p.viewMode==="list"?ie(o):ae(o,!1)}),e.innerHTML=n,e.scrollTop=0,e.querySelectorAll(".dm-file-item").forEach(o=>{o.onclick=()=>yt(o),o.ondblclick=()=>ht(o)}),e.querySelectorAll(".dm-grid-item").forEach(o=>{o.onclick=()=>xt(o),o.ondblclick=async()=>{const i=o.dataset.path;if(o.dataset.isDir==="true"&&i)await T(i);else if(i){const{previewFile:s}=await $(async()=>{const{previewFile:r}=await import("./preview-actions.js");return{previewFile:r}},[]);await s(i)}}})}function yt(e){document.querySelectorAll(".dm-file-item").forEach(o=>{o.style.background="transparent"}),e.style.background="#3a3a3a";const t=e.dataset.path||"",n=e.dataset.isDir==="true";p.selectedFiles=[t],!n&&t?(async()=>{const{previewFile:o}=await $(async()=>{const{previewFile:i}=await import("./preview-actions.js");return{previewFile:i}},[]);await o(t)})():bt()}function xt(e){document.querySelectorAll(".dm-grid-item").forEach(o=>{o.style.borderColor="transparent"}),e.style.borderColor="#9b59b6",p.selectedFiles=[e.dataset.path||""];const t=e.dataset.path;!(e.dataset.isDir==="true")&&t&&(async()=>{const{previewFile:o}=await $(async()=>{const{previewFile:i}=await import("./preview-actions.js");return{previewFile:i}},[]);await o(t)})()}function ht(e){const t=e.dataset.path;e.dataset.isDir==="true"&&t?T(t):t&&(async()=>{const{previewFile:o}=await $(async()=>{const{previewFile:i}=await import("./preview-actions.js");return{previewFile:i}},[]);await o(t)})()}function bt(){const e=document.getElementById("dm-preview-content");e&&(e.innerHTML=`
      <div style="text-align: center; padding: 40px; color: #666;">
        <i class="pi pi-folder" style="font-size: 48px; opacity: 0.5;"></i>
        <div style="margin-top: 15px; font-size: 13px;">双击打开目录</div>
      </div>
    `)}function vt(e){p.sortBy===e?p.sortOrder=p.sortOrder==="asc"?"desc":"asc":(p.sortBy=e,p.sortOrder="asc");const t=document.getElementById("dm-sort-select");t&&(t.value=p.sortBy),Z(),fe()}function fe(){document.querySelectorAll(".dm-header-cell").forEach(t=>{const n=t.querySelector("i");n&&(t.dataset.sort===p.sortBy?(n.className=p.sortOrder==="asc"?"pi pi-sort-amount-up":"pi pi-sort-amount-down",n.style.opacity="1"):(n.className="pi pi-sort",n.style.opacity="0.5"))})}const wt=Object.freeze(Object.defineProperty({__proto__:null,loadDirectory:T,toggleSort:vt,updateHeaderSortIndicators:fe},Symbol.toStringTag,{value:"Module"})),y={keyword:"#569cd6",string:"#ce9178",number:"#b5cea8",boolean:"#569cd6",comment:"#6a9955",function:"#dcdcaa",tag:"#569cd6",attrName:"#9cdcfe",attrValue:"#ce9178"};function ge(e,t){let n=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");switch(t){case".json":n=ye(n);break;case".py":n=xe(n);break;case".js":case".ts":case".jsx":case".tsx":n=he(n);break;case".html":case".htm":n=be(n);break;case".css":n=ve(n);break;case".yaml":case".yml":n=we(n);break;case".xml":n=Ee(n);break;default:n=Ce(n)}return n}function ye(e){return e.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,function(t){let n=y.number;return/^"/.test(t)?n=/:$/.test(t)?y.attrName:y.string:/true|false|null/.test(t)&&(n=y.boolean),`<span style="color: ${n};">${t}</span>`})}function xe(e){const t=/\b(def|class|import|from|if|elif|else|while|for|in|try|except|finally|with|as|return|yield|raise|pass|break|continue|and|or|not|is|lambda|True|False|None|async|await)\b/g,n=/@[\w.]+/g,o=/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,i=/#.*$/gm,a=/\b(\d+\.?\d*)\b/g,s=/\b([a-zA-Z_]\w*)\s*(?=\()/g;return e.replace(i,`<span style="color: ${y.comment};">$&</span>`).replace(o,`<span style="color: ${y.string};">$&</span>`).replace(t,`<span style="color: ${y.keyword};">$&</span>`).replace(n,`<span style="color: ${y.function};">$&</span>`).replace(s,`<span style="color: ${y.function};">$1</span>(`).replace(a,`<span style="color: ${y.number};">$1</span>`)}function he(e){const t=/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|null|undefined|true|false|in|instanceof|typeof|void)\b/g,n=/`(?:[^`\\]|\\.)*`/g,o=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,i=/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,a=/\b(\d+\.?\d*)\b/g,s=/\b([a-zA-Z_]\w*)\s*(?=\()/g,r=/(&gt;|=>)/g;return e.replace(i,`<span style="color: ${y.comment};">$&</span>`).replace(n,`<span style="color: ${y.string};">$&</span>`).replace(o,`<span style="color: ${y.string};">$&</span>`).replace(t,`<span style="color: ${y.keyword};">$&</span>`).replace(s,`<span style="color: ${y.function};">$1</span>(`).replace(r,`<span style="color: ${y.keyword};">$&</span>`).replace(a,`<span style="color: ${y.number};">$1</span>`)}function be(e){return e=e.replace(/(&lt;\/?)([\w-]+)/g,`$1<span style="color: ${y.tag};">$2</span>`),e=e.replace(/([\w-]+)(=)/g,`<span style="color: ${y.attrName};">$1</span>$2`),e=e.replace(/(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`$1<span style="color: ${y.attrValue};">$2</span>`),e}function ve(e){return e=e.replace(/(\/\*[\s\S]*?\*\/)/g,`<span style="color: ${y.comment};">$1</span>`),e=e.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`<span style="color: ${y.string};">$1</span>`),e=e.replace(/([\w-]+)(\s*:)/g,`<span style="color: ${y.attrName};">$1</span>$2`),e=e.replace(/(:\s*)([\d.#\w-]+)/g,`$1<span style="color: ${y.attrValue};">$2</span>`),e=e.replace(/([.#]?[\w-]+)(\s*\{)/g,`<span style="color: ${y.tag};">$1</span>$2`),e}function we(e){return e=e.replace(/(#.*$)/gm,`<span style="color: ${y.comment};">$1</span>`),e=e.replace(/^([\w-]+):/gm,`<span style="color: ${y.attrName};">$1</span>:`),e=e.replace(/(:\s*)([\w./-]+)/g,`$1<span style="color: ${y.string};">$2</span>`),e=e.replace(/\b(true|false|null)\b/g,`<span style="color: ${y.boolean};">$1</span>`),e=e.replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${y.number};">$1</span>`),e}function Ee(e){return e=e.replace(/(&lt;\/?)([\w:]+)/g,`$1<span style="color: ${y.tag};">$2</span>`),e=e.replace(/([\w:]+)(=)/g,`<span style="color: ${y.attrName};">$1</span>$2`),e=e.replace(/(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`$1<span style="color: ${y.attrValue};">$2</span>`),e}function Ce(e){e=e.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,`<span style="color: ${y.string};">$1</span>`),e=e.replace(/(\/\/.*$)/gm,`<span style="color: ${y.comment};">$1</span>`),e=e.replace(/(\/\*[\s\S]*?\*\/)/g,`<span style="color: ${y.comment};">$1</span>`);const t=/\b(function|return|if|else|for|while|var|let|const|true|false|null|undefined)\b/g;return e=e.replace(t,`<span style="color: ${y.keyword};">$1</span>`),e=e.replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${y.number};">$1</span>`),e}const Rt=Object.freeze(Object.defineProperty({__proto__:null,highlightCSS:ve,highlightCode:ge,highlightGeneric:Ce,highlightHTML:be,highlightJSON:ye,highlightJavaScript:he,highlightPython:xe,highlightXML:Ee,highlightYAML:we},Symbol.toStringTag,{value:"Module"}));function Et(e){const t=[];let n=[],o="",i=!1;for(let a=0;a<e.length;a++){const s=e[a],r=e[a+1];i?s==='"'?r==='"'?(o+='"',a++):i=!1:o+=s:s==='"'?i=!0:s===","?(n.push(o),o=""):s==="\r"&&r===`
`?(n.push(o),t.push(n),n=[],o="",a++):s===`
`?(n.push(o),t.push(n),n=[],o=""):s!=="\r"&&(o+=s)}return n.push(o),(n.length>0||t.length>0)&&t.push(n),t}const Ct={type:"floating",maxRows:E.MAX_PREVIEW_ROWS,height:null},G={floating:{containerClass:"dm-table-container",controlsClass:"dm-table-controls",height:null,hasFullscreen:!1,prefix:"dm-floating-table"},panel:{containerClass:"dm-panel-table-container",controlsClass:"dm-table-controls-panel",height:"400px",hasFullscreen:!0,prefix:"dm-table"}};function $e(e,t={}){const n={...Ct,...t},o=G[n.type||"floating"],i=e.slice(0,n.maxRows||E.MAX_PREVIEW_ROWS),a=e.length>(n.maxRows||E.MAX_PREVIEW_ROWS),s=`${o.prefix}-${Date.now()}`,r=o.height!==null?`height: ${o.height};`:"height: 100%;",c=`position: relative; flex: 1; overflow: hidden; ${r}`;let l=`
    <div style="display: flex; flex-direction: column; gap: 0; ${n.type==="floating"?"height: 100%;":""}">
      <div class="${o.containerClass}" style="${c}">
        <div id="${s}-wrapper" class="dm-table-wrapper"
             style="width: 100%; overflow: auto; padding: 15px; ${r}">
          <table id="${s}" class="dm-data-table"
                 style="width: 100%; border-collapse: collapse; font-size: 12px; transform-origin: top left;">
  `;if(i.forEach((d,g)=>{const m=g===0;l+="<tr>",d.forEach(u=>{const f=b(String(u??""));m?l+=`<th class="dm-table-header">${f}</th>`:l+=`<td class="dm-table-cell">${f}</td>`}),l+="</tr>"}),l+=`
          </table>
        </div>
      </div>
      ${$t(s,o)}
    </div>
  `,a){const d=n.maxRows||E.MAX_PREVIEW_ROWS;l=l.replace("</div>",`<div class="dm-table-truncated" style="text-align: center; padding: 10px; font-size: 11px;">... (仅显示前 ${d} 行，共 ${e.length} 行)</div></div>`)}return setTimeout(()=>Te(s,n.type||"floating"),0),l}function $t(e,t){let n=`
    <div id="${e}-controls" class="${t.controlsClass}" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; flex-shrink: 0;">
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
  `;return t.hasFullscreen&&(n+=`
      <button class="comfy-btn dm-table-fullscreen-btn" data-table-id="${e}" title="全屏">
        <i class="pi pi-window-maximize"></i>
      </button>
    `),n+="</div>",n}function Te(e,t="floating"){const n=document.getElementById(e);if(!n)return;const o=G[t]||G.floating;let i=100,a=!1;const s=n,r=document.getElementById(`${e}-wrapper`),c=document.getElementById(`${e}-zoom`),l=document.querySelector(`.dm-table-zoom-in-btn[data-table-id="${e}"]`),d=document.querySelector(`.dm-table-zoom-out-btn[data-table-id="${e}"]`),g=document.querySelector(`.dm-table-fit-btn[data-table-id="${e}"]`),m=o.hasFullscreen?document.querySelector(`.dm-table-fullscreen-btn[data-table-id="${e}"]`):null;function u(){s.style.transform=`scale(${i/100})`,c&&(c.textContent=`${i}%`),r&&(r.style.width=i>100?`${i}%`:"100%")}l&&l.addEventListener("click",()=>{i=Math.min(i+E.DEFAULT_ZOOM_STEP,E.MAX_ZOOM_DISPLAY),u()}),d&&d.addEventListener("click",()=>{i=Math.max(i-E.DEFAULT_ZOOM_STEP,E.MIN_ZOOM_DISPLAY),u()}),g&&g.addEventListener("click",()=>{const f=r?.clientWidth||400,w=s.scrollWidth,h=Math.min(Math.floor(f/w*100),100);i=Math.max(h,E.MIN_ZOOM_DISPLAY),u()}),m&&m.addEventListener("click",()=>{a=!a,a?n.parentElement?.requestFullscreen():document.exitFullscreen()})}function Se(e){return`
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
      <div style="margin-top: 15px; font-size: 13px;">表格解析失败</div>
      <div style="margin-top: 5px; font-size: 11px;">${b(e)}</div>
    </div>
  `}async function _e(e,t){const n=await fetch(`/dm/preview?path=${encodeURIComponent(e)}`);if(!n.ok)throw new Error("Failed to load file");if(t===".csv"){const o=await n.text();return Et(o)}throw new Error("Excel format requires SheetJS library")}const Ut=Object.freeze(Object.defineProperty({__proto__:null,createTableErrorHTML:Se,createTableHTML:$e,parseSpreadsheet:_e,setupTableControls:Te},Symbol.toStringTag,{value:"Module"}));function Tt(e){return new Promise((t,n)=>{if(document.querySelector(`script[src="${e}"]`)){t();return}const o=document.createElement("script");o.src=e,o.onload=()=>t(),o.onerror=n,document.head.appendChild(o)})}async function Ie(e,t,n,o=1){e.innerHTML=`
    <div class="dm-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
      <div style="margin-top: 10px;">正在加载...</div>
    </div>
  `;try{let i="";if(x.image.exts.includes(n))i=`
        <img src="${`/dm/preview?path=${encodeURIComponent(t)}`}"
             class="dm-zoomable-image dm-preview-image"
             style="max-width: 100%; max-height: 400px;
                    border-radius: 8px; border: 1px solid;
                    transform-origin: center center;
                    will-change: transform;"
             onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'"
             onload="this.style.opacity=1; this.style.display='block';">
      `;else if(x.audio.exts.includes(n)){const a=`/dm/preview?path=${encodeURIComponent(t)}`,s=`dm-preview-audio-${Date.now()}`;i=`
        <div class="dm-audio-preview" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 14px;">${b(t.split(/[/\\]/).pop()||"")}</div>
          <audio id="${s}" preload="metadata" style="width: 100%; max-width: 400px;">
            <source src="${a}">
            您的浏览器不支持音频播放
          </audio>
        </div>
      `}else if(x.video.exts.includes(n)){const a=`/dm/preview?path=${encodeURIComponent(t)}`;i=`
        <div class="dm-video-preview" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          <video id="${`dm-preview-video-${Date.now()}`}"
                 preload="metadata"
                 style="width: 100%; height: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
            <source src="${a}">
            您的浏览器不支持视频播放
          </video>
        </div>
      `}else if(x.videoExternal&&x.videoExternal.exts.includes(n)){const a=n.toUpperCase().replace(".","");i=`
        <div class="dm-external-video" style="text-align: center; padding: 40px;">
          <i class="pi pi-video dm-external-video-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="font-size: 16px; margin-bottom: 8px;">${b(t.split(/[\\/]/).pop()||"")}</div>
          <div class="dm-external-video-type" style="font-size: 14px; font-weight: 600; margin-bottom: 15px;">${a} 格式</div>
          <div class="dm-external-video-desc" style="margin-top: 10px; font-size: 12px; max-width: 300px; margin-left: auto; margin-right: auto;">
            此格式需要使用外部播放器打开<br>
            <span class="dm-external-video-sub">（VLC、Windows Media Player 等）</span>
          </div>
          <div class="dm-external-video-tip" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 11px;">
            提示：点击下方"打开"按钮可用外部播放器播放
          </div>
        </div>
      `}else if(x.code.exts.includes(n)){const a=await fetch(`/dm/preview?path=${encodeURIComponent(t)}`);if(a.ok){const s=await a.text();i=`
          <div class="dm-code-preview" style="width: 100%; padding: 15px;
                      font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                      overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
            <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${ge(s,n)}</pre>
          </div>
        `}else throw new Error("Failed to load file")}else if(x.document.exts.includes(n)){const a=`/dm/preview?path=${encodeURIComponent(t)}`,s=n===".pdf",r=n===".md",c=n===".docx";if(n===".doc")i=`
          <div class="dm-doc-unsupported" style="text-align: center; padding: 40px;">
            <i class="pi pi-file-word dm-doc-unsupported-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${b(t.split(/[/\\]/).pop()||"")}</div>
            <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">.doc 格式暂不支持预览</div>
            <div class="dm-unsupported-sub" style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
          </div>
        `;else if(c)try{const d=await fetch(a);if(d.ok){const g=await d.arrayBuffer();typeof window.mammoth>"u"&&await Tt("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");const m=window.mammoth;if(typeof m<"u"){const u=m.convertToHtml({arrayBuffer:g}),f=`dm-doc-content-${Date.now()}`;i=`
                <div id="${f}" class="dm-document-content dm-docx-content"
                     style="width: 100%; height: 100%;
                            font-family: 'Segoe UI', Arial, sans-serif;
                            font-size: 13px;
                            line-height: 1.6;
                            overflow: auto;
                            box-sizing: border-box;
                            padding: 20px;">
                  <style>
                    #${f} img { max-width: 100%; height: auto; display: inline-block; margin: 10px 0; }
                    #${f} p { word-wrap: break-word; overflow-wrap: break-word; margin: 0.5em 0; }
                    #${f} table { max-width: 100%; overflow: auto; display: block; margin: 10px 0; }
                  </style>
                  ${u.value}
                </div>
              `}else throw new Error("mammoth.js not available")}else throw new Error("Failed to load file")}catch(d){console.error("[DataManager] DOCX preview error:",d),i=`
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
              <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
              <div class="dm-preview-filename" style="margin-top: 15px;">${b(t.split(/[/\\]/).pop()||"")}</div>
              <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
              <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${b(d.message)}</div>
            </div>
          `}else if(s)i=`
          <div style="width: 100%; height: 100%; overflow: hidden;">
            <embed id="dm-floating-pdf-embed" src="${a}" type="application/pdf"
                   style="width: 100%; height: 100%; border: none; display: block;" />
          </div>
        `;else if(r){const g=await(await fetch(a)).text();i=`
          <div class="dm-markdown-preview" style="padding: 20px; font-size: 13px; line-height: 1.6; overflow-y: auto; max-height: 100%;">
            <pre style="white-space: pre-wrap; word-wrap: break-word;">${b(g)}</pre>
          </div>
        `}else i=`
          <div style="text-align: center; padding: 40px;">
            <i class="pi pi-file" style="font-size: 64px; color: #888;"></i>
            <div style="margin-top: 15px; font-size: 14px;">${b(t.split(/[/\\]/).pop()||"")}</div>
            <div style="margin-top: 8px; font-size: 12px; color: #888;">点击"打开"按钮查看文档</div>
          </div>
        `}else if(x.spreadsheet.exts.includes(n))try{const a=await _e(t,n);i=$e(a,{type:"floating"})}catch(a){i=Se(a.message)}else{const a=t.split(/[/\\]/).pop()||"",s=B({name:t}),r=x[s]?.icon||x.unknown.icon,c=x[s]?.color||x.unknown.color;i=`
        <div style="text-align: center; padding: 30px;">
          <i class="pi ${r}" style="font-size: 64px; color: ${c};"></i>
          <div style="margin-top: 15px; color: #fff; font-size: 14px;">${b(a)}</div>
          <div style="margin-top: 8px; color: #888; font-size: 12px;">此文件类型不支持预览</div>
        </div>
      `}e.innerHTML=i}catch(i){e.innerHTML=`
      <div class="dm-preview-error" style="text-align: center; padding: 40px;">
        <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
        <div class="dm-error-title" style="margin-top: 15px; font-size: 14px;">加载失败</div>
        <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${b(i.message)}</div>
      </div>
    `}}function X(){const e=document.getElementById("dm-preview-dock");if(!e)return;e.innerHTML="";const t=I.filter(n=>n.minimized);if(t.length===0){e.style.minHeight="0",e.style.maxHeight="0",e.style.padding="0 15px";return}e.style.minHeight="60px",e.style.maxHeight="60px",e.style.padding="10px 15px",t.forEach(n=>{const o=document.createElement("div");o.className="dm-dock-thumbnail",o.style.cssText=`
      width: 80px;
      height: 50px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s;
    `,o.title=`${n.fileName} - 点击恢复`,o.innerHTML=`
      <i class="pi ${n.fileConfig.icon}" style="color: ${n.fileConfig.color}; font-size: 16px;"></i>
      <span style="color: #aaa; font-size: 9px; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${n.fileName}</span>
    `,o.onmouseover=()=>{o.style.background="#3a3a3a",o.style.borderColor=n.fileConfig.color},o.onmouseout=()=>{o.style.background="#2a2a2a",o.style.borderColor="#3a3a3a"},o.onclick=()=>St(n.window),e.appendChild(o)})}function St(e){e.minimized=!1,e.style.display="flex",X()}const _t=1;function P(e,t,n){const o=document.createElement("button");return o.className="comfy-btn",o.innerHTML=`<i class="pi ${e}"></i>`,o.style.cssText="padding: 6px 10px; background: transparent; border: none; color: #888; cursor: pointer; border-radius: 4px;",o.title=t,o.onmouseover=()=>o.style.background="#3a3a3a",o.onmouseout=()=>o.style.background="transparent",o.onclick=n,o}function Me(e,t){const n=I.find(K=>K.path===e);if(n){n.window.focus();return}const o=ft(e),i=B({name:e}),a=x[i]||x.unknown,s=x.image.exts.includes(o),r=x.video.exts.includes(o),c=x.audio.exts.includes(o),l=o===".pdf",d=o===".md",g=l||d||x.document.exts.includes(o),m=x.code.exts.includes(o),u=x.spreadsheet.exts.includes(o),f=document.createElement("div");f.id=`dm-preview-${Date.now()}`,f.className="dm-floating-preview",f.style.cssText=`
    position: fixed;
    top: 100px;
    right: 50px;
    width: 500px;
    height: 600px;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: ${E.FLOATING_Z_INDEX};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;const w=It(t,a,s,r,c,g,m,u,f);f.appendChild(w);const h=document.createElement("div");h.id=`dm-preview-content-${Date.now()}`,h.style.cssText=`
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  `,f.appendChild(h);const v=Mt(e,o,s,r,c,l,d,m,u,h);f.appendChild(v),document.body.appendChild(f),z(),me(f,w);const N={path:e,fileName:t,fileConfig:a,window:f,minimized:!1};I.push(N),Ie(h,e,o,_t),_(`已打开预览: ${t}`)}function It(e,t,n,o,i,a,s,r,c,l){const d=L(),g=d.isLight?"#222":"#fff",m=document.createElement("div");m.className="dm-preview-header",m.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: linear-gradient(135deg, ${d.bgSecondary} 0%, ${d.bgPrimary} 100%);
    border-bottom: 1px solid ${d.borderColor};
    cursor: move;
    user-select: none;
  `;const u=document.createElement("div");u.className="dm-traffic-lights",u.style.cssText="display: flex; gap: 8px;";const f=U("pi-times",g,"关闭",()=>Dt(c));u.appendChild(f);const w=U("pi-minus",g,"最小化",()=>Pt(c));if(u.appendChild(w),n||o||i||a||s||r){const v=U("pi-window-maximize",g,"全屏",()=>Ot(c));u.appendChild(v)}m.appendChild(u);const h=document.createElement("div");return h.className="dm-header-title-area",h.style.cssText="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; flex: 1; justify-content: center;",h.innerHTML=`
    <i class="pi ${t.icon}" style="color: ${t.color};"></i>
    <span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e}</span>
  `,m.appendChild(h),pe(v=>{const N=v.isLight?"#222":"#fff";m.style.background=`linear-gradient(135deg, ${v.bgSecondary} 0%, ${v.bgPrimary} 100%)`,m.style.borderColor=v.borderColor,h.style.color=N,m.querySelectorAll(".dm-traffic-btn").forEach(Pe=>{Pe.style.color=N})}),m}function U(e,t,n,o){const i=document.createElement("button");return i.className="comfy-btn dm-traffic-btn",i.innerHTML=`<i class="pi ${e}" style="font-size: 10px; color: ${t};"></i>`,i.style.cssText=`
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
  `,i.title=n,i.onclick=a=>{a.stopPropagation(),o()},i}function Mt(e,t,n,o,i,a,s,r,c,l,d){const g=document.createElement("div");g.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    border-top: 1px solid #2a2a2a;
    background: #1f1f1f;
  `;const m=P("pi-external-link","打开",()=>{window.open(`/dm/preview?path=${encodeURIComponent(e)}`,"_blank")});if(g.appendChild(m),n){const f=P("pi-search-plus","放大",()=>{}),w=P("pi-search-minus","缩小",()=>{}),h=P("pi-arrows-alt","适应",()=>{});g.appendChild(f),g.appendChild(w),g.appendChild(h)}const u=P("pi-refresh","刷新",()=>{Ie(l,e,t)});return g.appendChild(u),g}function Dt(e){const t=I.findIndex(n=>n.window===e);t>-1&&I.splice(t,1),e.remove(),X()}function Pt(e,t,n,o){const i=I.find(a=>a.window===e);i&&(i.minimized=!0),e.style.display="none",X()}function Ot(e){e.dataset.fullscreen==="true"?(e.dataset.fullscreen="false",e.style.top="100px",e.style.right="50px",e.style.width="500px",e.style.height="600px"):(e.dataset.fullscreen="true",e.style.top="0",e.style.right="0",e.style.width="100vw",e.style.height="100vh",e.style.borderRadius="0")}const Wt=Object.freeze(Object.defineProperty({__proto__:null,openFloatingPreview:Me},Symbol.toStringTag,{value:"Module"})),kt=2,De=typeof S.ui<"u"&&S.ui!==null&&S.ui?.version&&typeof S.ui.version=="object"&&S.ui.version.major&&S.ui.version.major>=kt;console.log(`[DataManager] Extension loading, Node V${De?"3":"1"} detected`);let W=null;const Lt={name:"ComfyUI.DataManager",commands:[{id:"data-manager.open",label:"Open Data Manager",icon:"pi pi-folder-open",function:()=>O()}],keybindings:[{combo:{key:"d",ctrl:!0,shift:!0},commandId:"data-manager.open"}],actionBarButtons:[{icon:"pi pi-folder",tooltip:"文件管理器 (Ctrl+Shift+D)",class:"dm-actionbar-btn",onClick:()=>O()}],async setup(){const e=document.createElement("style");e.textContent=`
      .dm-actionbar-btn {
        width: 32px !important;
        height: 32px !important;
        border: none !important;
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        color: rgba(255, 255, 255, 0.9) !important;
        margin-right: 0.5rem !important;
        transition: all 0.2s ease !important;
      }
      .dm-actionbar-btn:hover {
        background: rgba(255, 255, 255, 0.15) !important;
      }
      .dm-actionbar-btn i {
        color: rgba(255, 255, 255, 0.9) !important;
      }
    `,document.head.appendChild(e);const t=()=>{const i=document.querySelector(".dm-actionbar-btn"),a=Array.from(document.querySelectorAll("button")).find(c=>c.getAttribute("aria-label")==="Expand job queue");if(!i||!a)return!1;const s=a.parentElement;return a.previousElementSibling!==i||i.parentElement!==s?(s.insertBefore(i,a),console.log("[DataManager] Button position fixed"),!0):!1};let n=0;new MutationObserver(i=>{const a=Date.now();if(a-n<100)return;n=a,i.some(r=>{if(r.type==="childList"){for(const c of r.addedNodes)if(c.nodeType===1){const l=c;if(l.classList?.contains("actionbar-container")||l.classList?.contains("dm-actionbar-btn")||l.querySelector?.(".dm-actionbar-btn")||l.querySelector?.('[aria-label="Expand job queue"]'))return!0}}return!!r.target.closest?.(".actionbar-container")})&&requestAnimationFrame(t)}).observe(document.body,{childList:!0,subtree:!0}),setInterval(()=>{t()},2e3),console.log("[DataManager] Extension setup completed"),Re()},async nodeCreated(e){const t=e;if(t.comfyClass==="DataManagerCore"){if(console.log("[DataManager] DataManagerCore node created, IS_NODE_V3:",De),t.addDOMWidget){const n=document.createElement("div");n.style.cssText=`
          display: flex;
          justify-content: center;
          padding: 10px;
        `;const o=document.createElement("button");o.className="comfy-btn",o.innerHTML='<i class="pi pi-folder-open"></i> 打开文件管理器',o.style.cssText=`
          padding: 12px 24px;
          font-size: 14px;
          background: #6c757d;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `,o.onmouseover=()=>{o.style.background="#5a6268",o.style.transform="translateY(-1px)",o.style.boxShadow="0 4px 8px rgba(0,0,0,0.15)"},o.onmouseout=()=>{o.style.background="#6c757d",o.style.transform="translateY(0)",o.style.boxShadow="0 2px 4px rgba(0,0,0,0.1)"},o.onclick=i=>{i.stopPropagation(),O()},n.appendChild(o),t.addDOMWidget("dm_open_btn","dm_open_btn",n,{minWidth:200,minHeight:50})}}else if(t.comfyClass==="InputPathConfig")console.log("[DataManager] InputPathConfig node created"),t._dmFormatSelectorEnabled=!1;else if(t.comfyClass==="OutputPathConfig"){console.log("[DataManager] OutputPathConfig node created");const n=t;n._dmOutputType="STRING",n._dmFilePath=""}},getNodeMenuItems(e){return e.comfyClass==="DataManagerCore"?[{content:"打开文件管理器",callback:()=>O()}]:[]},getCanvasMenuItems(){return[null,{content:"Data Manager",callback:()=>O()}]}};function O(){W&&se();const e=le();e&&e!=="."?(p.currentPath=e,console.log("[DataManager] Restored last path:",e)):p.currentPath=".",W=dt({onRefresh:()=>T(p.currentPath),onClose:()=>{se(),W=null},onOpenFloating:()=>{const n=p.selectedFiles[0];n&&Me(n,ue(n))},onCopyPath:()=>zt(),onDelete:()=>At(),onSshConnect:async n=>{const o=n,i=window._remoteConnectionsState;i.active=n;try{localStorage.setItem("comfyui_datamanager_last_connection",JSON.stringify(n))}catch{}await T(o.root_path||"/"),C("success","已连接",`SSH: ${o.username}@${o.host}`)},onSshDisconnect:async()=>{const n=window._remoteConnectionsState,o=n.active;if(o&&o.connection_id)try{const{sshDisconnect:i}=await $(async()=>{const{sshDisconnect:a}=await import("./ssh.js");return{sshDisconnect:a}},[]);await i(o.connection_id)}catch(i){console.log("[DataManager] SSH disconnect error:",i)}n.active=null;try{localStorage.removeItem("comfyui_datamanager_last_connection")}catch{}await T("."),C("info","已断开","SSH 连接已断开")}}),z(),T(p.currentPath),setTimeout(()=>{Nt()},500)}function Nt(){try{at()}catch(e){console.log("[DataManager] Error in checkAndUpdateFormatSelector:",e)}}function zt(){const e=p.selectedFiles;if(e.length===0){C("warn","未选择","请先选择文件");return}const t=e.join(`
`);navigator.clipboard.writeText(t).then(()=>{C("success","已复制",`已复制 ${e.length} 个文件路径`)}).catch(()=>{C("error","复制失败","无法访问剪贴板")})}async function At(){const e=p.selectedFiles;if(e.length===0){C("warn","未选择","请先选择文件");return}const t=e.length===1?`确定删除 "${ue(e[0])}"?`:`确定删除 ${e.length} 个项目?`;if(confirm(t))try{for(const n of e)await ut(n,!0);C("success","已删除",`已删除 ${e.length} 个项目`),T(p.currentPath)}catch(n){C("error","删除失败",n.message)}}S.registerExtension(Lt);export{x as F,$ as _,jt as a,Vt as b,ue as c,Ht as d,b as e,Ze as f,ft as g,ge as h,ye as i,xe as j,he as k,be as l,ve as m,we as n,Ee as o,Ce as p,$e as q,Se as r,Te as s,_e as t,_ as u,Bt as v,Rt as w,Ut as x,Wt as y};
//# sourceMappingURL=extension.js.map
