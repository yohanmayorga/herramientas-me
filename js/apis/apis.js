/* Herramientas M&E · Sección Enlaces de API: filtros, tarjetas, lista y verificación en tiempo real */
const API_ST={ q:'', proyecto:'', estado:'', vista:'lista', vistaManual:false };
const API_CHECK={};
let apiCheckingAll=false;
let apiProxyAvailable=null;

const API_ICON={
  api:'<path d="M9 7V3M15 7V3"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  copiar:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  rayo:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  filtro:'<path d="M3 5h18M6 12h12M10 19h4"/>',
  tarjetas:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const apiIco=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${API_ICON[n]||''}</svg>`;
const apiNorm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function apiTiene(a){ return Boolean(a.csv||a.xlsx); }

function apiFiltrados(){
  const q=apiNorm(API_ST.q.trim());
  return APIS.map((a,idx)=>({...a,_idx:idx})).filter(a=>{
    if(q&&!apiNorm(`${a.formulario} ${a.proyecto||'general'} ${a.csv} ${a.xlsx}`).includes(q)) return false;
    if(API_ST.proyecto){
      if(API_ST.proyecto==='__sin__'&&a.proyecto) return false;
      if(API_ST.proyecto!=='__sin__'&&a.proyecto!==API_ST.proyecto) return false;
    }
    if(API_ST.estado==='con'&&!apiTiene(a)) return false;
    if(API_ST.estado==='sin'&&apiTiene(a)) return false;
    return true;
  });
}

function apiAccionesHtml(a){
  if(!apiTiene(a)) return `<span class="tb-alc">Sin API</span>`;
  return `${a.csv?`<button class="pj-link" type="button" data-copy="${esc(a.csv)}" data-fmt="CSV" title="Copiar enlace CSV para Power BI / Power Query">${apiIco('copiar',14)}<span>CSV</span></button>`:''}
    ${a.xlsx?`<button class="pj-link primary" type="button" data-copy="${esc(a.xlsx)}" data-fmt="XLSX" title="Copiar enlace XLSX para Power BI / Power Query">${apiIco('copiar',14)}<span>XLSX</span></button>`:''}`;
}

function apiEstadoHtml(a){
  if(!apiTiene(a)) return `<span class="pj-st off">Sin API</span>`;
  const st=API_CHECK[a._idx];
  if(!st) return `<button class="pj-st info" type="button" data-check="${a._idx}" style="border:0;cursor:pointer;font-family:inherit" title="Verificar en tiempo real si el enlace responde">Verificar</button>`;
  if(st.state==='checking') return `<span class="pj-st off">Verificando…</span>`;
  const stStyle=st.state==='bad'?'background:var(--bad-soft);color:var(--bad);':'';
  const cls=st.state==='ok'?'ok':'warn';
  return `<button class="pj-st ${cls}" type="button" data-check="${a._idx}" style="${stStyle}border:0;cursor:pointer;font-family:inherit" title="${esc(st.title)}">${esc(st.label)}</button>`;
}

function apiCard(a){
  const ok=apiTiene(a);
  return `<article class="pj-card ${ok?'t-re':'t-em'}">
    <div class="pj-top">
      <span class="pj-tipo">${esc(a.proyecto||'General')}</span>
      ${apiEstadoHtml(a)}
    </div>
    <h3>${esc(a.formulario)}</h3>
    ${ok
      ?`<div class="tb-meta" style="margin-top:12px">
          ${a.csv?`<div class="tb-mitem"><span>CSV</span><b title="${esc(a.csv)}">${esc(a.csv)}</b></div>`:''}
          ${a.xlsx?`<div class="tb-mitem"><span>XLSX</span><b title="${esc(a.xlsx)}">${esc(a.xlsx)}</b></div>`:''}
        </div>`
      :`<p class="tb-desc">Este formulario aún no tiene enlaces de exportación API configurados.</p>`}
    <div class="pj-tlinks" style="margin-top:auto">
      ${apiAccionesHtml(a)}
    </div>
  </article>`;
}

function apiTabla(L){
  return `<div class="scroll pj-tbl-wrap"><table class="pj-tbl">
    <thead><tr>
      <th>Proyecto</th>
      <th>Formulario</th>
      <th>Estado</th>
      <th>Enlaces API</th>
    </tr></thead>
    <tbody>${L.map(a=>{
      const ok=apiTiene(a);
      return `<tr class="${ok?'t-re':'t-em'}">
        <td>${a.proyecto?`<b>${esc(a.proyecto)}</b>`:'<span class="muted">General</span>'}</td>
        <td><div class="pj-tn">${esc(a.formulario)}</div></td>
        <td>${apiEstadoHtml(a)}</td>
        <td><div class="pj-tlinks">${apiAccionesHtml(a)}</div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function apiActiveCount(){
  return [API_ST.q.trim(),API_ST.proyecto,API_ST.estado].filter(Boolean).length;
}

function viewApisFiltros(){
  const opt=(v,l,cur)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
  const seg=(k,vals)=>`<div class="pj-seg" role="group">${vals.map(([v,l,ic])=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${API_ST[k]===v}">${ic?apiIco(ic,15):''}<span>${l}</span></button>`).join('')}</div>`;
  const proys=[...new Set(APIS.map(a=>a.proyecto).filter(Boolean))];
  const tieneSinProy=APIS.some(a=>!a.proyecto);
  const n=apiActiveCount();
  return `<div class="sf-wrap pj ap" role="search">
    <div class="side-h sf-head"><span>Filtros</span><button class="btn sm sf-close" type="button" data-fclose aria-label="Cerrar filtros">✕</button></div>
    <div class="sf-body">
      <label class="pj-search">${apiIco('buscar',18)}<input class="in" id="apiQ" type="search" placeholder="Buscar por formulario, proyecto o URL" value="${esc(API_ST.q)}" aria-label="Buscar enlaces API"></label>
      <label class="pj-fg"><span class="pj-fl">Proyecto</span><select class="in" id="apiProyecto">${opt('','Todos',API_ST.proyecto)}${proys.map(p=>opt(p,p,API_ST.proyecto)).join('')}${tieneSinProy?opt('__sin__','General / Sin proyecto',API_ST.proyecto):''}</select></label>
      <div class="pj-fg"><span class="pj-fl">Estado</span>${seg('estado',[['','Todos'],['con','Con API'],['sin','Sin API']])}</div>
      <div class="pj-fg"><span class="pj-fl">Vista</span>${seg('vista',[['lista','Lista','lista'],['tarjetas','Tarjetas','tarjetas']])}</div>
    </div>
    <div class="sf-foot">
      <button class="btn sm pj-clear" type="button" id="apiClear"${n?'':' hidden'}>Limpiar filtros</button>
      <button class="btn sm primary sf-done" type="button" data-fclose>Ver resultados</button>
    </div>
  </div>`;
}

function viewApis(){
  const n=apiActiveCount();
  const open=document.body.classList.contains('filters-open');
  return `<div class="portal pj tb ap">
    <section class="p-hero pj-hero">
      <div>
        <h1>Enlaces de API</h1>
        <p>Directorio de enlaces de exportación (CSV y XLSX) de KoboToolbox para conectar fuentes de datos en Power BI y Power Query.</p>
      </div>
      <div class="pj-hero-side">
        <div class="pj-today">${apiIco('api',15)} KoboToolbox · API v2</div>
        <button class="btn sm" type="button" id="apiCheckAll"${apiCheckingAll?' disabled':''}>${apiIco('rayo',15)}<span>${apiCheckingAll?'Verificando…':'Verificar todos'}</span></button>
        <button class="btn pj-fbtn" type="button" data-fopen aria-expanded="${open}" aria-controls="sideFilters">${apiIco('filtro',16)}<span>Filtros</span><span class="fcount" id="apiFCount"${n?'':' hidden'}>${n}</span></button>
      </div>
    </section>
    <div id="apiOut"></div>
  </div>`;
}

function apiSyncVistaBtns(){
  document.querySelectorAll('.ap .pj-seg button[data-k="vista"]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===API_ST.vista));
}

function apiCopyUrl(url,fmt){
  const msg=`Enlace ${fmt||'API'} copiado al portapapeles`;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>toast(msg)).catch(()=>tbCopyFallback(url));
  } else if(typeof tbCopyFallback==='function'){
    tbCopyFallback(url);
  }
}

function apiFmtBytes(b){
  if(!Number.isFinite(b)||b<=0) return '';
  if(b<1024) return `${b} B`;
  if(b<1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

async function apiProbarDirectoSinCors(url){
  const ctrl=new AbortController();
  let timedOut=false;
  const timer=setTimeout(()=>{ timedOut=true; ctrl.abort(); },15000);
  const t0=performance.now();
  try{
    await fetch(url,{ method:'GET', mode:'no-cors', cache:'no-store', signal:ctrl.signal });
    clearTimeout(timer);
    const secs=((performance.now()-t0)/1000).toFixed(1)+'s';
    return { state:'warn', label:`Responde · ${secs}`, title:`El servidor respondió en ${secs} (en servidor local sin proxy no se puede leer el código HTTP ni el tamaño real). Clic para reintentar.` };
  }catch(_err){
    clearTimeout(timer);
    if(timedOut){
      return { state:'bad', label:'Tiempo agotado', title:'Superó 15s sin responder (archivo muy pesado o servidor saturado). Clic para reintentar.' };
    }
    return { state:'bad', label:'Sin conexión', title:'No se pudo conectar con KoboToolbox. Clic para reintentar.' };
  }
}

async function apiProbarUno(idx){
  const a=APIS[idx];
  if(!a||(!a.xlsx&&!a.csv)) return;
  const url=a.xlsx||a.csv;
  API_CHECK[idx]={ state:'checking', label:'Verificando…', title:'Consultando servidor de KoboToolbox…' };
  apiPaint();
  if(apiProxyAvailable===false){
    API_CHECK[idx]=await apiProbarDirectoSinCors(url);
    apiPaint();
    return;
  }
  try{
    const proxyRes=await fetch(`/api/check?url=${encodeURIComponent(url)}`,{ cache:'no-store' });
    if(proxyRes.status===404||proxyRes.status===405){
      apiProxyAvailable=false;
      API_CHECK[idx]=await apiProbarDirectoSinCors(url);
      apiPaint();
      return;
    }
    apiProxyAvailable=true;
    const data=await proxyRes.json();
    const secs=((data.elapsedMs||0)/1000).toFixed(1)+'s';
    const sizeTxt=apiFmtBytes(data.contentLength);
    if(data.ok){
      API_CHECK[idx]={
        state:'ok',
        label:`Descarga OK · ${secs}${sizeTxt?' · '+sizeTxt:''}`,
        title:`Verificado al 100% vía proxy: HTTP ${data.status} en ${secs}${sizeTxt?', tamaño '+sizeTxt:''} (recibidos ${data.sampleBytes} B iniciales). Clic para volver a probar.`
      };
    } else if(data.timedOut){
      API_CHECK[idx]={
        state:'bad',
        label:'Tiempo agotado',
        title:'El proxy esperó 20s y KoboToolbox no comenzó a descargar el archivo. Clic para reintentar.'
      };
    } else {
      const code=data.status?`Error ${data.status}`:'Error de conexión';
      API_CHECK[idx]={
        state:'bad',
        label:code,
        title:`Fallo al verificar vía proxy: ${data.error||('HTTP '+data.status+' '+data.statusText)}. Clic para reintentar.`
      };
    }
  }catch(_err){
    API_CHECK[idx]=await apiProbarDirectoSinCors(url);
  }
  apiPaint();
}

async function apiProbarTodos(){
  if(apiCheckingAll) return;
  const lista=apiFiltrados().filter(apiTiene).map(a=>a._idx);
  if(!lista.length) return;
  apiCheckingAll=true;
  const btn=$('#apiCheckAll');
  if(btn){ btn.disabled=true; const sp=btn.querySelector('span'); if(sp) sp.textContent='Verificando…'; }
  let pos=0;
  const worker=async()=>{
    while(pos<lista.length){
      const idx=lista[pos++];
      await apiProbarUno(idx);
    }
  };
  await Promise.all(Array.from({length:Math.min(3,lista.length)},worker));
  apiCheckingAll=false;
  const btnEnd=$('#apiCheckAll');
  if(btnEnd){ btnEnd.disabled=false; const sp=btnEnd.querySelector('span'); if(sp) sp.textContent='Verificar todos'; }
}

function apiPaint(){
  const L=apiFiltrados(), out=$('#apiOut');
  if(!out) return;
  if(!API_ST.vistaManual) API_ST.vista=(window.innerWidth<=960||(window.innerHeight<=600&&window.innerWidth>window.innerHeight))?'tarjetas':'lista';
  if(!L.length){
    out.innerHTML='<div class="p-box pj-empty">No hay enlaces de API que coincidan con los filtros seleccionados.</div>';
  } else {
    out.innerHTML=API_ST.vista==='lista'?apiTabla(L):`<div class="pj-grid">${L.map(apiCard).join('')}</div>`;
    if(!API_ST.vistaManual&&API_ST.vista==='lista'){
      const wrap=out.querySelector('.pj-tbl-wrap');
      if(wrap&&wrap.scrollWidth>wrap.clientWidth+2){
        API_ST.vista='tarjetas';
        out.innerHTML=`<div class="pj-grid">${L.map(apiCard).join('')}</div>`;
      }
    }
  }
  apiSyncVistaBtns();
  const n=apiActiveCount();
  const cl=$('#apiClear'); if(cl) cl.hidden=!n;
  const fc=$('#apiFCount'); if(fc){ fc.textContent=n; fc.hidden=!n; }
  out.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>apiCopyUrl(b.dataset.copy,b.dataset.fmt));
  out.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>apiProbarUno(Number(b.dataset.check)));
}

let apiResizeObs=null;
function bindApis(){
  const sf=$('#sideFilters');
  if(sf) sf.innerHTML=viewApisFiltros();
  document.querySelectorAll('[data-fopen]').forEach(b=>b.onclick=()=>filterDrawer(!document.body.classList.contains('filters-open')));
  document.querySelectorAll('[data-fclose]').forEach(b=>b.onclick=()=>filterDrawer(false));
  const chkAll=$('#apiCheckAll');
  if(chkAll) chkAll.onclick=()=>apiProbarTodos();
  $('#apiQ').addEventListener('input',e=>{ API_ST.q=e.target.value; apiPaint(); });
  document.querySelectorAll('.ap .pj-seg button').forEach(b=>b.onclick=()=>{
    if(b.dataset.k==='vista') API_ST.vistaManual=true;
    API_ST[b.dataset.k]=b.dataset.v;
    document.querySelectorAll(`.ap .pj-seg button[data-k="${b.dataset.k}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b));
    apiPaint();
  });
  $('#apiProyecto').onchange=e=>{ API_ST.proyecto=e.target.value; apiPaint(); };
  $('#apiClear').onclick=()=>{
    Object.assign(API_ST,{q:'',proyecto:'',estado:'',vistaManual:false});
    $('#home').innerHTML=viewApis();
    bindApis();
  };
  if(apiResizeObs) apiResizeObs.disconnect();
  if(window.ResizeObserver){
    let lastW=0;
    apiResizeObs=new ResizeObserver(entries=>{
      const w=Math.round(entries[0]?.contentRect?.width||0);
      if(w&&w!==lastW){ lastW=w; if(!API_ST.vistaManual) apiPaint(); }
    });
    apiResizeObs.observe($('#apiOut'));
  }
  apiPaint();
}
