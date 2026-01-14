import{_ as f,g as $,a as T,F as p,b as g,e as d,c as u,u as L,L as _,d as E,l as M,f as z,h as S}from"./extension.js";import{v as q,s as N,o as R,i as U,r as G,n as J,j as X,m as Y,k as W,q as K,p as Q,w as Z,t as ee}from"./extension.js";import"../../scripts/app.js";async function B(e){const{FileManagerState:t}=await f(async()=>{const{FileManagerState:l}=await import("./extension.js").then(m=>m.x);return{FileManagerState:l}},[]),n=(await f(()=>import("./extension.js").then(l=>l.x),[])).FileManagerState;n.currentPreviewFile=e;const a=document.getElementById("dm-preview-content"),s=document.getElementById("dm-open-floating-preview-btn");if(!a)return;a.innerHTML=`
    <div class="dm-panel-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
  `;const o=$(e),c=e.split(/[/\\]/).pop()||"",y=T(o);try{let l="",m=!1;if(p.image.exts.includes(o)){const r=g(e),v=`dm-panel-image-${Date.now()}`;l=`
        <div style="display: flex; flex-direction: column; gap: 0;">
          <div class="dm-image-preview-container" style="position: relative; overflow: hidden; flex: 1; display: flex; align-items: center; justify-content: center;">
            <img id="${v}" src="${r}"
                 class="dm-panel-preview-image dm-zoomable-image"
                 style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid;
                        transform-origin: center center; will-change: transform;"
                 onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'">
          </div>
        </div>
      `,m=!0,a._imageId=v}else if(p.audio.exts.includes(o)){const r=g(e);l=`
        <div class="dm-panel-audio-preview" style="text-align: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px;"></i>
          <div class="dm-preview-filename" style="margin-top: 15px;">${d(c)}</div>
          <audio controls style="width: 100%; margin-top: 15px;">
            <source src="${r}" type="audio/mpeg">
          </audio>
        </div>
      `,m=!0}else if(p.video.exts.includes(o)){const r=g(e),v=`dm-panel-video-${Date.now()}`;l=H(v,r),m=!0}else if(p.videoExternal?.exts.includes(o)){const r=o.toUpperCase().replace(".","");l=`
        <div class="dm-external-video" style="text-align: center; padding: 40px;">
          <i class="pi pi-video dm-external-video-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 16px;">${d(c)}</div>
          <div class="dm-external-video-type" style="font-size: 14px; font-weight: 600; margin-bottom: 15px;">${r} 格式</div>
          <div class="dm-external-video-desc" style="margin-top: 10px; font-size: 12px; max-width: 300px; margin-left: auto; margin-right: auto;">
            此格式需要使用外部播放器打开<br>
            <span class="dm-external-video-sub">（VLC、Windows Media Player 等）</span>
          </div>
          <div class="dm-external-video-tip" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 11px;">
            提示：点击下方"打开"按钮可用外部播放器播放
          </div>
        </div>
      `,m=!0}else if(p.code.exts.includes(o)){const r=await fetch(g(e));if(r.ok){const v=await r.text(),{highlightCode:x}=await f(async()=>{const{highlightCode:w}=await import("./extension.js").then(b=>b.y);return{highlightCode:w}},[]);l=C(v,o,x),m=!0}else throw new Error("Failed to load file")}else if(p.document.exts.includes(o)){const r=g(e);l=await k(e,o,r),m=!0}else if(p.spreadsheet.exts.includes(o))l=await F(e,o),m=!0;else{const r=u(),v=p[y]?.icon||p.unknown.icon,x=p[y]?.color||p.unknown.color;l=`
        <div style="text-align: center; padding: 30px;">
          <i class="pi ${v}" style="font-size: 64px; color: ${x};"></i>
          <div style="margin-top: 15px; color: ${r.textPrimary}; font-size: 14px;">${d(c)}</div>
          <div style="margin-top: 8px; color: ${r.textSecondary}; font-size: 12px;">此文件类型不支持预览</div>
        </div>
      `}a.innerHTML=l,p.video.exts.includes(o)&&P(a),p.document.exts.includes(o)&&I(a),s&&(s.style.display="block",s.onclick=async()=>{const{openFloatingPreview:r}=await f(async()=>{const{openFloatingPreview:v}=await import("./extension.js").then(x=>x.A);return{openFloatingPreview:v}},[]);r(e,c)}),L(`预览: ${c}`),D(e)}catch{const m=u();a.innerHTML=`
      <div style="text-align: center; padding: 20px; color: ${m.errorColor};">
        <i class="pi pi-exclamation-triangle" style="font-size: 32px;"></i>
        <div style="margin-top: 10px;">加载预览失败</div>
      </div>
    `}}function H(e,t){return`
    <div style="display: flex; flex-direction: column; gap: 0;">
      <div class="dm-panel-video-container" style="position: relative; border-radius: 8px; overflow: hidden;">
        <video id="${e}" controls preload="metadata" style="width: 100%; max-height: 300px; display: block; object-fit: contain;">
          <source src="${t}" type="video/mp4">
        </video>
      </div>
      <div id="${e}-controls" class="dm-video-controls-panel" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 0 0 8px 8px; margin-top: -2px;">
        <button class="comfy-btn dm-video-play-btn" data-video-id="${e}" title="播放">
          <i class="pi pi-play"></i> 播放
        </button>
        <span id="${e}-time" class="dm-video-time-display">0:00 / 0:00</span>
        <button class="comfy-btn dm-video-volume-btn" data-video-id="${e}" title="音量">
          <i class="pi pi-volume-up"></i>
        </button>
        <button class="comfy-btn dm-video-fullscreen-btn" data-video-id="${e}" title="视频全屏">
          <i class="pi pi-arrows-alt"></i>
        </button>
      </div>
    </div>
  `}function P(e){const t=e.querySelector("video"),i=e.querySelector(".dm-video-play-btn"),n=e.querySelector(".dm-video-volume-btn"),a=e.querySelector(".dm-video-fullscreen-btn"),s=e.querySelector('[id$="-time"]');!t||!i||(i.addEventListener("click",()=>{t.paused?t.play().then(()=>{i.innerHTML='<i class="pi pi-pause"></i> 暂停'}):(t.pause(),i.innerHTML='<i class="pi pi-play"></i> 播放')}),t.addEventListener("play",()=>{i.innerHTML='<i class="pi pi-pause"></i> 暂停'}),t.addEventListener("pause",()=>{i.innerHTML='<i class="pi pi-play"></i> 播放'}),t.addEventListener("timeupdate",()=>{const o=h(t.currentTime),c=h(t.duration);s.textContent=`${o} / ${c}`}),n&&n.addEventListener("click",()=>{t.muted=!t.muted,n.innerHTML=t.muted?'<i class="pi pi-volume-off"></i>':'<i class="pi pi-volume-up"></i>'}),a&&a.addEventListener("click",()=>{t.requestFullscreen&&t.requestFullscreen()}))}function h(e){const t=Math.floor(e/60),i=Math.floor(e%60);return`${t}:${i.toString().padStart(2,"0")}`}function C(e,t,i){const n=_.MAX_CODE_LENGTH,a=e.length>n?e.substring(0,n)+`

... (文件过大，已截断)`:e;return`
    <div class="dm-code-preview" style="width: 100%; padding: 15px;
                font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
      <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${i(a,t)}</pre>
    </div>
  `}async function k(e,t,i){const n=E(e);if(t===".md")return`
      <div style="display: flex; flex-direction: column; gap: 0;">
        <div style="width: 100%; height: 400px; overflow: hidden; flex: 1;">
          <iframe src="${i}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
        <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
          <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${d(e)}" title="全屏">
            <i class="pi pi-window-maximize"></i> 全屏
          </button>
        </div>
      </div>
    `;if(t===".pdf")return`
      <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
        <div style="width: 100%; flex: 1; min-height: 400px; overflow: hidden;">
          <embed src="${i}" type="application/pdf" style="width: 100%; height: 100%; border: none;" />
        </div>
        <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
          <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${d(e)}" title="全屏">
            <i class="pi pi-window-maximize"></i> 全屏
          </button>
        </div>
      </div>
    `;if(t===".docx")try{const s=await fetch(i);if(!s.ok)throw new Error("Failed to load file");const o=await s.arrayBuffer();await M("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");const c=window.mammoth;if(!c)throw new Error("mammoth.js not available");const y=c.convertToHtml({arrayBuffer:o}),l=`dm-doc-content-${Date.now()}`;return`
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
          <div id="${l}" class="dm-docx-content"
               style="flex: 1; overflow-y: auto; padding: 20px; box-sizing: border-box;">
            <style>
              #${l} img { max-width: 100%; height: auto; display: inline-block; margin: 10px 0; }
              #${l} p { word-wrap: break-word; overflow-wrap: break-word; margin: 0.5em 0; }
              #${l} table { max-width: 100%; overflow: auto; display: block; margin: 10px 0; }
            </style>
            ${y.value}
          </div>
          <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
            <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${d(e)}" title="全屏">
              <i class="pi pi-window-maximize"></i> 全屏
            </button>
          </div>
        </div>
      `}catch(s){return`
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
          <div style="margin-top: 15px;">${d(n)}</div>
          <div style="margin-top: 10px;">预览加载失败</div>
          <div style="margin-top: 5px; font-size: 11px;">${d(s.message)}</div>
        </div>
      `}if(t===".doc")return`
      <div style="text-align: center; padding: 40px;">
        <i class="pi pi-file-word" style="font-size: 64px; color: ${u().textSecondary};"></i>
        <div style="margin-top: 15px;">${d(n)}</div>
        <div style="margin-top: 10px;">.doc 格式暂不支持预览</div>
        <div style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
      </div>
    `;if(t===".txt"||t===".rtf")try{const s=await fetch(i);if(!s.ok)throw new Error("Failed to load file");const o=await s.text();return`
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
          <div id="${`dm-doc-content-${Date.now()}`}" class="dm-text-content"
               style="flex: 1; overflow-y: auto; padding: 15px; box-sizing: border-box;
                      font-family: 'Consolas', 'Monaco', monospace;
                      font-size: 13px; line-height: 1.6;
                      word-break: break-word; white-space: pre-wrap;">${d(o)}</div>
          <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
            <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${d(e)}" title="全屏">
              <i class="pi pi-window-maximize"></i> 全屏
            </button>
          </div>
        </div>
      `}catch(s){return`
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
          <div style="margin-top: 15px;">${d(n)}</div>
          <div style="margin-top: 10px;">预览加载失败</div>
          <div style="margin-top: 5px; font-size: 11px;">${d(s.message)}</div>
        </div>
      `}const a=u();return`
    <div style="text-align: center; padding: 40px;">
      <i class="pi pi-file" style="font-size: 64px; color: ${a.textSecondary};"></i>
      <div style="margin-top: 15px; font-size: 14px;">${d(n)}</div>
      <div style="margin-top: 8px; font-size: 12px; color: ${a.textSecondary};">文档预览</div>
    </div>
  `}async function F(e,t){const{parseSpreadsheet:i}=await f(async()=>{const{parseSpreadsheet:n}=await import("./extension.js").then(a=>a.z);return{parseSpreadsheet:n}},[]);try{const n=await i(e,t),{createTableHTML:a}=await f(async()=>{const{createTableHTML:s}=await import("./extension.js").then(o=>o.z);return{createTableHTML:s}},[]);return a(n,{type:"panel",path:e})}catch(n){return`
      <div style="text-align: center; padding: 40px; color: ${u().errorColor};">
        <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
        <div style="margin-top: 15px;">表格解析失败</div>
        <div style="margin-top: 5px; font-size: 11px;">${d(n.message)}</div>
      </div>
    `}}async function D(e){const t=document.getElementById("dm-file-info");if(t)try{const i=await z(e);t.innerHTML=`
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>文件名:</span>
        <span>${d(i.name)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span><i class="pi pi-database"></i> 大小:</span>
        <span>${S(i.size)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span><i class="pi pi-clock"></i> 修改时间:</span>
        <span>${i.modified?new Date(i.modified).toLocaleString("zh-CN"):"-"}</span>
      </div>
    `}catch{t.innerHTML='<div style="text-align: center;">无法获取文件信息</div>'}}function I(e){e.querySelectorAll(".dm-doc-fullscreen-btn").forEach(i=>{const n=i.getAttribute("data-doc-path");n&&i.addEventListener("click",async()=>{const a=n.split(/[\\/]/).pop()||n,{openFloatingPreview:s}=await f(async()=>{const{openFloatingPreview:o}=await import("./extension.js").then(c=>c.A);return{openFloatingPreview:o}},[]);s(n,a)})})}export{q as createTableErrorHTML,N as createTableHTML,R as highlightCSS,U as highlightCode,G as highlightGeneric,J as highlightHTML,X as highlightJSON,Y as highlightJavaScript,W as highlightPython,K as highlightXML,Q as highlightYAML,Z as parseSpreadsheet,B as previewFile,ee as setupTableControls};
//# sourceMappingURL=preview-actions.js.map
