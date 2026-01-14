import{_ as v,g as T,a as b,F as l,b as g,e as m,u as L,c as _,d as M,f as E}from"./extension.js";import{r as I,q as O,m as V,h as A,p as j,l as R,i as N,k as U,j as J,o as Y,n as G,t as X,s as K}from"./extension.js";import"../../scripts/app.js";async function D(e){const{FileManagerState:t}=await v(async()=>{const{FileManagerState:o}=await import("./extension.js").then(p=>p.v);return{FileManagerState:o}},[]),a=(await v(()=>import("./extension.js").then(o=>o.v),[])).FileManagerState;a.currentPreviewFile=e;const s=document.getElementById("dm-preview-content"),d=document.getElementById("dm-open-floating-preview-btn");if(!s)return;s.innerHTML=`
    <div class="dm-panel-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
  `;const n=T(e),u=e.split(/[/\\]/).pop()||"",y=b(n);try{let o="",p=!1;if(l.image.exts.includes(n))o=`
        <div style="text-align: center;">
          <img src="${g(e)}"
               class="dm-panel-preview-image"
               style="max-width: 100%; max-height: 300px;
                      border-radius: 8px; border: 1px solid;"
               onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\'>无法加载图像</div>'">
        </div>
      `,p=!0;else if(l.audio.exts.includes(n)){const r=g(e);o=`
        <div class="dm-panel-audio-preview" style="text-align: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px;"></i>
          <div class="dm-preview-filename" style="margin-top: 15px;">${m(u)}</div>
          <audio controls style="width: 100%; margin-top: 15px;">
            <source src="${r}" type="audio/mpeg">
          </audio>
        </div>
      `,p=!0}else if(l.video.exts.includes(n)){const r=g(e),c=`dm-panel-video-${Date.now()}`;o=$(c,r),p=!0}else if(l.code.exts.includes(n)){const r=await fetch(g(e));if(r.ok){const c=await r.text(),{highlightCode:f}=await v(async()=>{const{highlightCode:x}=await import("./extension.js").then(w=>w.w);return{highlightCode:x}},[]);o=H(c,n,f),p=!0}else throw new Error("Failed to load file")}else if(l.document.exts.includes(n)){const r=g(e);o=await P(e,n,r),p=!0}else if(l.spreadsheet.exts.includes(n))o=await z(e,n),p=!0;else{const r=l[y]?.icon||l.unknown.icon,c=l[y]?.color||l.unknown.color;o=`
        <div style="text-align: center; padding: 30px;">
          <i class="pi ${r}" style="font-size: 64px; color: ${c};"></i>
          <div style="margin-top: 15px; color: #fff; font-size: 14px;">${m(u)}</div>
          <div style="margin-top: 8px; color: #888; font-size: 12px;">此文件类型不支持预览</div>
        </div>
      `}s.innerHTML=o,l.video.exts.includes(n)&&S(s),d&&(d.style.display="block",d.onclick=async()=>{const{openFloatingPreview:r}=await v(async()=>{const{openFloatingPreview:c}=await import("./extension.js").then(f=>f.y);return{openFloatingPreview:c}},[]);r(e,u)}),L(`预览: ${u}`),F(e)}catch{s.innerHTML=`
      <div style="text-align: center; padding: 20px; color: #e74c3c;">
        <i class="pi pi-exclamation-triangle" style="font-size: 32px;"></i>
        <div style="margin-top: 10px;">加载预览失败</div>
      </div>
    `}}function $(e,t){return`
    <div style="display: flex; flex-direction: column; gap: 0;">
      <div class="dm-panel-video-container" style="position: relative; border-radius: 8px; overflow: hidden;">
        <video id="${e}" preload="metadata" style="width: 100%; max-height: 300px; display: block; object-fit: contain;">
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
  `}function S(e){const t=e.querySelector("video"),i=e.querySelector(".dm-video-play-btn"),a=e.querySelector(".dm-video-volume-btn"),s=e.querySelector(".dm-video-fullscreen-btn"),d=e.querySelector('[id$="-time"]');!t||!i||(i.addEventListener("click",()=>{t.paused?t.play().then(()=>{i.innerHTML='<i class="pi pi-pause"></i> 暂停'}):(t.pause(),i.innerHTML='<i class="pi pi-play"></i> 播放')}),t.addEventListener("play",()=>{i.innerHTML='<i class="pi pi-pause"></i> 暂停'}),t.addEventListener("pause",()=>{i.innerHTML='<i class="pi pi-play"></i> 播放'}),t.addEventListener("timeupdate",()=>{const n=h(t.currentTime),u=h(t.duration);d.textContent=`${n} / ${u}`}),a&&a.addEventListener("click",()=>{t.muted=!t.muted,a.innerHTML=t.muted?'<i class="pi pi-volume-off"></i>':'<i class="pi pi-volume-up"></i>'}),s&&s.addEventListener("click",()=>{t.requestFullscreen&&t.requestFullscreen()}))}function h(e){const t=Math.floor(e/60),i=Math.floor(e%60);return`${t}:${i.toString().padStart(2,"0")}`}function H(e,t,i){return`
    <div class="dm-code-preview" style="width: 100%; padding: 15px;
                font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
      <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${i(e,t)}</pre>
    </div>
  `}async function P(e,t,i){const a=_(e);if(t===".md"){const d=await(await fetch(i)).text();return`
      <div class="dm-markdown-preview" style="padding: 15px; font-size: 13px; line-height: 1.6; overflow-y: auto; max-height: 400px;">
        <pre style="white-space: pre-wrap; word-wrap: break-word;">${m(d)}</pre>
      </div>
    `}return t===".pdf"?`
      <div style="width: 100%; height: 400px; overflow: hidden;">
        <embed src="${i}" type="application/pdf" style="width: 100%; height: 100%; border: none;" />
      </div>
    `:`
    <div style="text-align: center; padding: 40px;">
      <i class="pi pi-file" style="font-size: 64px; color: #888;"></i>
      <div style="margin-top: 15px; font-size: 14px;">${m(a)}</div>
      <div style="margin-top: 8px; font-size: 12px; color: #888;">文档预览</div>
    </div>
  `}async function z(e,t){const{parseSpreadsheet:i}=await v(async()=>{const{parseSpreadsheet:a}=await import("./extension.js").then(s=>s.x);return{parseSpreadsheet:a}},[]);try{const a=await i(e,t),{createTableHTML:s}=await v(async()=>{const{createTableHTML:d}=await import("./extension.js").then(n=>n.x);return{createTableHTML:d}},[]);return s(a,{type:"panel"})}catch(a){return`
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
        <div style="margin-top: 15px;">表格解析失败</div>
        <div style="margin-top: 5px; font-size: 11px;">${m(a.message)}</div>
      </div>
    `}}async function F(e){const t=document.getElementById("dm-file-info");if(t)try{const i=await M(e);t.innerHTML=`
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>文件名:</span>
        <span>${m(i.name)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>大小:</span>
        <span>${E(i.size)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>修改时间:</span>
        <span>${i.modified?new Date(i.modified).toLocaleString("zh-CN"):"-"}</span>
      </div>
    `}catch{t.innerHTML='<div style="text-align: center;">无法获取文件信息</div>'}}export{I as createTableErrorHTML,O as createTableHTML,V as highlightCSS,A as highlightCode,j as highlightGeneric,R as highlightHTML,N as highlightJSON,U as highlightJavaScript,J as highlightPython,Y as highlightXML,G as highlightYAML,X as parseSpreadsheet,D as previewFile,K as setupTableControls};
//# sourceMappingURL=preview-actions.js.map
