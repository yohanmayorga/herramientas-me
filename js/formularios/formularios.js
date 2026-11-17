/* Herramientas M&E · Sección Formularios Kobo: filtros, tarjetas, lista, enlaces API y verificación en tiempo real */
const FRM={ q:'', proyecto:'', area:'', tipo:'', api:'', vista:'lista', vistaManual:false };
const FM_CHECK={};
let fmCheckingAll=false;
let fmProxyAvailable=null;

const FRM_ICON={
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  form:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
  area:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  proyecto:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  enlace:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  copiar:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  rayo:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  filtro:'<path d="M3 5h18M6 12h12M10 19h4"/>',
  tarjetas:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const fmIco=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${FRM_ICON[n]||''}</svg>`;
const fmNorm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const fmTieneApi=f=>Boolean(f.csv||f.xlsx);

function fmFiltrados(){
  const q=fmNorm(FRM.q.trim());
  return FORMULARIOS.map((f,idx)=>({...f,_idx:idx})).filter(f=>{
    if(q&&!fmNorm(`${f.formulario} ${f.proyecto||'sin proyecto'} ${f.area||'sin area'} ${f.tipo} ${f.url||''} ${f.csv||''} ${f.xlsx||''}`).includes(q)) return false;
    if(FRM.proyecto){
      if(FRM.proyecto==='__sin__'&&f.proyecto) return false;
      if(FRM.proyecto!=='__sin__'&&f.proyecto!==FRM.proyecto) return false;
    }
    if(FRM.area){
      if(FRM.area==='__sin__'&&f.area) return false;
      if(FRM.area!=='__sin__'&&f.area!==FRM.area) return false;
    }
    if(FRM.tipo&&f.tipo!==FRM.tipo) return false;
    if(FRM.api==='con'&&!fmTieneApi(f)) return false;
    if(FRM.api==='sin'&&fmTieneApi(f)) return false;
    return true;
  });
}

function fmEstadoApiHtml(f){
  if(!fmTieneApi(f)) return `<span class="pj-st off">Sin API</span>`;
  const st=FM_CHECK[f._idx];
  if(!st) return `<button class="pj-st off" type="button" data-check="${f._idx}" style="border:1px solid var(--line);cursor:pointer;font-family:inherit;color:var(--ink)" title="Verificar en tiempo real si la API responde">Verificar</button>`;
  if(st.state==='checking') return `<span class="pj-st off">Verificando…</span>`;
  const stStyle=st.state==='bad'?'background:var(--bad-soft);color:var(--bad);':'';
  const cls=st.state==='ok'?'ok':'warn';
  return `<button class="pj-st ${cls}" type="button" data-check="${f._idx}" style="${stStyle}border:0;cursor:pointer;font-family:inherit" title="${esc(st.title)}">${esc(st.label)}</button>`;
}

function fmFormAccionesHtml(f){
  if(!f.url) return '<span class="muted">—</span>';
  return `<a class="pj-link" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer" title="Abrir formulario en KoboToolbox">${fmIco('ext',14)}<span>Abrir</span></a>
    <button class="pj-link" type="button" data-copy="${esc(f.url)}" data-fmt="del formulario" title="Copiar enlace del formulario">${fmIco('copiar',14)}<span>Copiar</span></button>`;
}

function fmApiAccionesHtml(f){
  if(!fmTieneApi(f)) return '<span class="muted">—</span>';
  return `${f.xlsx?`<button class="pj-link primary" type="button" data-copy="${esc(f.xlsx)}" data-fmt="API XLSX" title="Copiar enlace API XLSX para Power BI / Power Query">${fmIco('copiar',14)}<span>XLSX</span></button>`:''}
    ${f.csv?`<button class="pj-link" type="button" data-copy="${esc(f.csv)}" data-fmt="API CSV" title="Copiar enlace API CSV para Power BI / Power Query">${fmIco('copiar',14)}<span>CSV</span></button>`:''}`;
}

function fmCard(f){
  const pTxt=f.proyecto||'Sin proyecto asignado';
  const aTxt=f.area||'Sin área especificada';
  return `<article class="pj-card t-${f.tipo==='Emergencia'?'em':'re'}">
    <div class="pj-top">
      <span class="pj-tipo">${esc(f.proyecto?`${f.proyecto} · ${f.tipo}`:f.tipo)}</span>
      ${fmEstadoApiHtml(f)}
    </div>
    <h3>${esc(f.formulario)}</h3>
    ${f.url
      ?`<div class="tb-sub">${fmIco('enlace',14)}<a class="fm-url" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.url)}</a></div>`
      :`<div class="tb-sub muted">Sin enlace de recolección registrado</div>`}
    <div class="tb-meta" style="margin-top:14px">
      <div class="tb-mitem">
        <span>${fmIco('proyecto',13)} Proyecto</span>
        <b title="${esc(pTxt)}">${esc(f.proyecto||'—')}</b>
      </div>
      <div class="tb-mitem">
        <span>${fmIco('area',13)} Área</span>
        <b title="${esc(aTxt)}">${esc(f.area||'—')}</b>
      </div>
    </div>
    <div class="pj-tlinks" style="margin-top:auto">
      ${f.url?fmFormAccionesHtml(f):''}
      ${fmTieneApi(f)?fmApiAccionesHtml(f):''}
    </div>
  </article>`;
}

function fmTabla(L){
  return `<div class="scroll pj-tbl-wrap"><table class="pj-tbl">
    <thead><tr>
      <th>Proyecto</th>
      <th>Área</th>
      <th>Formulario</th>
      <th>Tipo</th>
      <th>Estado API</th>
      <th>Enlace</th>
      <th>Enlaces API</th>
    </tr></thead>
    <tbody>${L.map(f=>{
      return `<tr class="t-${f.tipo==='Emergencia'?'em':'re'}">
        <td>${f.proyecto?`<b>${esc(f.proyecto)}</b>`:'<span class="muted">—</span>'}</td>
        <td>${f.area?`<span class="tb-alc">${esc(f.area)}</span>`:'<span class="muted">—</span>'}</td>
        <td><div class="pj-tn">${esc(f.formulario)}</div></td>
        <td><span class="pj-tipo">${esc(f.tipo)}</span></td>
        <td>${fmEstadoApiHtml(f)}</td>
        <td><div class="pj-tlinks">${fmFormAccionesHtml(f)}</div></td>
        <td><div class="pj-tlinks">${fmApiAccionesHtml(f)}</div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function fmActiveCount(){
  return [FRM.q.trim(),FRM.proyecto,FRM.area,FRM.tipo,FRM.api].filter(Boolean).length;
}

function viewFormulariosFiltros(){
  const opt=(v,l,cur)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
  const seg=(k,vals)=>`<div class="pj-seg" role="group">${vals.map(([v,l,ic])=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${FRM[k]===v}">${ic?fmIco(ic,15):''}<span>${l}</span></button>`).join('')}</div>`;
  const proys=[...new Set(FORMULARIOS.map(f=>f.proyecto).filter(Boolean))];
  const tieneSinProy=FORMULARIOS.some(f=>!f.proyecto);
  const areas=[...new Set(FORMULARIOS.map(f=>f.area).filter(Boolean))];
  const tieneSinArea=FORMULARIOS.some(f=>!f.area);
  const n=fmActiveCount();
  return `<div class="sf-wrap pj fm" role="search">
    <div class="side-h sf-head"><span>Filtros</span><button class="btn sm sf-close" type="button" data-fclose aria-label="Cerrar filtros">✕</button></div>
    <div class="sf-body">
      <label class="pj-search">${fmIco('buscar',18)}<input class="in" id="fmQ" type="search" placeholder="Buscar por formulario, proyecto o URL" value="${esc(FRM.q)}" aria-label="Buscar formularios"></label>
      <label class="pj-fg"><span class="pj-fl">Proyecto</span><select class="in" id="fmProyecto">${opt('','Todos',FRM.proyecto)}${proys.map(p=>opt(p,p,FRM.proyecto)).join('')}${tieneSinProy?opt('__sin__','Sin proyecto asignado',FRM.proyecto):''}</select></label>
      <label class="pj-fg"><span class="pj-fl">Área</span><select class="in" id="fmArea">${opt('','Todas',FRM.area)}${areas.map(a=>opt(a,a,FRM.area)).join('')}${tieneSinArea?opt('__sin__','Sin área especificada',FRM.area):''}</select></label>
      <div class="pj-fg"><span class="pj-fl">Tipo</span>${seg('tipo',[['','Todos'],['Regular','Regular'],['Emergencia','Emergencia']])}</div>
      <div class="pj-fg"><span class="pj-fl">Enlace API</span>${seg('api',[['','Todos'],['con','Con API'],['sin','Sin API']])}</div>
      <div class="pj-fg"><span class="pj-fl">Vista</span>${seg('vista',[['lista','Lista','lista'],['tarjetas','Tarjetas','tarjetas']])}</div>
    </div>
    <div class="sf-foot">
      <button class="btn sm pj-clear" type="button" id="fmClear"${n?'':' hidden'}>Limpiar filtros</button>
      <button class="btn sm primary sf-done" type="button" data-fclose>Ver resultados</button>
    </div>
  </div>`;
}

function viewFormularios(){
  const n=fmActiveCount();
  const open=document.body.classList.contains('filters-open');
  return `<div class="portal pj tb fm">
    <section class="p-hero pj-hero">
      <div>
        <h1>Formularios Kobo</h1>
        <p>Catálogo unificado de formularios en KoboToolbox: acceso al formulario de recolección, enlaces de exportación API (CSV y XLSX) y verificación de disponibilidad.</p>
      </div>
      <div class="pj-hero-side">
        <div class="pj-today">${fmIco('form',15)} KoboToolbox · Formularios y API</div>
        <button class="btn sm" type="button" id="fmCheckAll"${fmCheckingAll?' disabled':''}>${fmIco('rayo',15)}<span>${fmCheckingAll?'Verificando…':'Verificar APIs'}</span></button>
        <button class="btn pj-fbtn" type="button" data-fopen aria-expanded="${open}" aria-controls="sideFilters">${fmIco('filtro',16)}<span>Filtros</span><span class="fcount" id="fmFCount"${n?'':' hidden'}>${n}</span></button>
      </div>
    </section>
    <div id="fmOut"></div>
  </div>`;
}

function fmSyncVistaBtns(){
  document.querySelectorAll('.fm .pj-seg button[data-k="vista"]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===FRM.vista));
}

function fmCopyUrl(url,fmt){
  const msg=fmt?`Enlace ${fmt} copiado al portapapeles`:'Enlace copiado al portapapeles';
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>toast(msg)).catch(()=>tbCopyFallback(url));
  } else if(typeof tbCopyFallback==='function'){
    tbCopyFallback(url);
  }
}

function fmFmtBytes(b){
  if(!Number.isFinite(b)||b<=0) return '';
  if(b<1024) return `${b} B`;
  if(b<1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

async function fmProbarDirectoSinCors(url){
  const ctrl=new AbortController();
  let timedOut=false;
  const timer=setTimeout(()=>{ timedOut=true; ctrl.abort(); },15000);
  const t0=performance.now();
  try{
    await fetch(url,{ method:'GET', mode:'no-cors', cache:'no-store', signal:ctrl.signal });
    clearTimeout(timer);
    const secs=((performance.now()-t0)/1000).toFixed(1)+'s';
    return { state:'warn', label:`Responde · ${secs}`, title:`El servidor respondió en ${secs} (en servidor estático sin proxy no se puede leer el código HTTP ni el tamaño real). Clic para reintentar.` };
  }catch(_err){
    clearTimeout(timer);
    if(timedOut){
      return { state:'bad', label:'Tiempo agotado', title:'Superó 15s sin responder (archivo muy pesado o servidor saturado). Clic para reintentar.' };
    }
    return { state:'bad', label:'Sin conexión', title:'No se pudo conectar con KoboToolbox. Clic para reintentar.' };
  }
}

async function fmProbarUno(idx){
  const f=FORMULARIOS[idx];
  if(!f||!fmTieneApi(f)) return;
  const url=f.xlsx||f.csv;
  FM_CHECK[idx]={ state:'checking', label:'Verificando…', title:'Consultando servidor de KoboToolbox…' };
  fmPaint();
  if(fmProxyAvailable===false){
    FM_CHECK[idx]=await fmProbarDirectoSinCors(url);
    fmPaint();
    return;
  }
  try{
    const proxyRes=await fetch(`/api/check?url=${encodeURIComponent(url)}`,{ cache:'no-store' });
    if(proxyRes.status===404||proxyRes.status===405){
      fmProxyAvailable=false;
      FM_CHECK[idx]=await fmProbarDirectoSinCors(url);
      fmPaint();
      return;
    }
    fmProxyAvailable=true;
    const data=await proxyRes.json();
    const secs=((data.elapsedMs||0)/1000).toFixed(1)+'s';
    const sizeTxt=fmFmtBytes(data.contentLength);
    if(data.ok){
      FM_CHECK[idx]={
        state:'ok',
        label:`Descarga OK · ${secs}${sizeTxt?' · '+sizeTxt:''}`,
        title:`Verificado al 100% vía proxy: HTTP ${data.status} en ${secs}${sizeTxt?', tamaño '+sizeTxt:''} (recibidos ${data.sampleBytes} B iniciales). Clic para volver a probar.`
      };
    } else if(data.timedOut){
      FM_CHECK[idx]={
        state:'bad',
        label:'Tiempo agotado',
        title:'El proxy esperó 20s y KoboToolbox no comenzó a descargar el archivo. Clic para reintentar.'
      };
    } else {
      const code=data.status?`Error ${data.status}`:'Error de conexión';
      FM_CHECK[idx]={
        state:'bad',
        label:code,
        title:`Fallo al verificar vía proxy: ${data.error||('HTTP '+data.status+' '+data.statusText)}. Clic para reintentar.`
      };
    }
  }catch(_err){
    FM_CHECK[idx]=await fmProbarDirectoSinCors(url);
  }
  fmPaint();
}

async function fmProbarTodos(){
  if(fmCheckingAll) return;
  const lista=fmFiltrados().filter(fmTieneApi).map(f=>f._idx);
  if(!lista.length) return;
  fmCheckingAll=true;
  const btn=$('#fmCheckAll');
  if(btn){ btn.disabled=true; const sp=btn.querySelector('span'); if(sp) sp.textContent='Verificando…'; }
  let pos=0;
  const worker=async()=>{
    while(pos<lista.length){
      const idx=lista[pos++];
      await fmProbarUno(idx);
    }
  };
  await Promise.all(Array.from({length:Math.min(3,lista.length)},worker));
  fmCheckingAll=false;
  const btnEnd=$('#fmCheckAll');
  if(btnEnd){ btnEnd.disabled=false; const sp=btnEnd.querySelector('span'); if(sp) sp.textContent='Verificar APIs'; }
}

function fmPaint(){
  const L=fmFiltrados(), out=$('#fmOut');
  if(!out) return;
  if(!FRM.vistaManual) FRM.vista=(window.innerWidth<=960||(window.innerHeight<=600&&window.innerWidth>window.innerHeight))?'tarjetas':'lista';
  if(!L.length){
    out.innerHTML='<div class="p-box pj-empty">No hay formularios que coincidan con los filtros seleccionados.</div>';
  } else {
    out.innerHTML=FRM.vista==='lista'?fmTabla(L):`<div class="pj-grid">${L.map(fmCard).join('')}</div>`;
    if(!FRM.vistaManual&&FRM.vista==='lista'){
      const wrap=out.querySelector('.pj-tbl-wrap');
      if(wrap&&wrap.scrollWidth>wrap.clientWidth+2){
        FRM.vista='tarjetas';
        out.innerHTML=`<div class="pj-grid">${L.map(fmCard).join('')}</div>`;
      }
    }
  }
  fmSyncVistaBtns();
  const n=fmActiveCount();
  const cl=$('#fmClear'); if(cl) cl.hidden=!n;
  const fc=$('#fmFCount'); if(fc){ fc.textContent=n; fc.hidden=!n; }
  out.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>fmCopyUrl(b.dataset.copy,b.dataset.fmt));
  out.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>fmProbarUno(Number(b.dataset.check)));
}

let fmResizeObs=null;
function bindFormularios(){
  const sf=$('#sideFilters');
  if(sf) sf.innerHTML=viewFormulariosFiltros();
  document.querySelectorAll('[data-fopen]').forEach(b=>b.onclick=()=>filterDrawer(!document.body.classList.contains('filters-open')));
  document.querySelectorAll('[data-fclose]').forEach(b=>b.onclick=()=>filterDrawer(false));
  const chkAll=$('#fmCheckAll');
  if(chkAll) chkAll.onclick=()=>fmProbarTodos();
  $('#fmQ').addEventListener('input',e=>{ FRM.q=e.target.value; fmPaint(); });
  document.querySelectorAll('.fm .pj-seg button').forEach(b=>b.onclick=()=>{
    if(b.dataset.k==='vista') FRM.vistaManual=true;
    FRM[b.dataset.k]=b.dataset.v;
    document.querySelectorAll(`.fm .pj-seg button[data-k="${b.dataset.k}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b));
    fmPaint();
  });
  $('#fmProyecto').onchange=e=>{ FRM.proyecto=e.target.value; fmPaint(); };
  $('#fmArea').onchange=e=>{ FRM.area=e.target.value; fmPaint(); };
  $('#fmClear').onclick=()=>{
    Object.assign(FRM,{q:'',proyecto:'',area:'',tipo:'',api:'',vistaManual:false});
    $('#home').innerHTML=viewFormularios();
    bindFormularios();
  };
  if(fmResizeObs) fmResizeObs.disconnect();
  if(window.ResizeObserver){
    let lastW=0;
    fmResizeObs=new ResizeObserver(entries=>{
      const w=Math.round(entries[0]?.contentRect?.width||0);
      if(w&&w!==lastW){ lastW=w; if(!FRM.vistaManual) fmPaint(); }
    });
    fmResizeObs.observe($('#fmOut'));
  }
  fmPaint();
}
