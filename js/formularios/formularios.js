/* Herramientas M&E · Sección Repositorio de formularios: filtros, resumen, tarjetas y lista */
const FRM={ q:'', proyecto:'', area:'', tipo:'', vista:'lista', vistaManual:false };

const FRM_ICON={
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  form:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
  area:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  proyecto:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  enlace:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  copiar:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  filtro:'<path d="M3 5h18M6 12h12M10 19h4"/>',
  tarjetas:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const fmIco=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${FRM_ICON[n]||''}</svg>`;
const fmNorm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function fmFiltrados(){
  const q=fmNorm(FRM.q.trim());
  return FORMULARIOS.map((f,idx)=>({...f,_idx:idx})).filter(f=>{
    if(q&&!fmNorm(`${f.formulario} ${f.proyecto||'sin proyecto'} ${f.area||'sin area'} ${f.tipo} ${f.url}`).includes(q)) return false;
    if(FRM.proyecto){
      if(FRM.proyecto==='__sin__'&&f.proyecto) return false;
      if(FRM.proyecto!=='__sin__'&&f.proyecto!==FRM.proyecto) return false;
    }
    if(FRM.area){
      if(FRM.area==='__sin__'&&f.area) return false;
      if(FRM.area!=='__sin__'&&f.area!==FRM.area) return false;
    }
    if(FRM.tipo&&f.tipo!==FRM.tipo) return false;
    return true;
  });
}

function fmCard(f){
  const pTxt=f.proyecto||'Sin proyecto asignado';
  const aTxt=f.area||'Sin área especificada';
  return `<article class="pj-card t-${f.tipo==='Emergencia'?'em':'re'}">
    <div class="pj-top">
      <span class="pj-tipo">${esc(f.proyecto?`${f.proyecto} · ${f.tipo}`:f.tipo)}</span>
      <span class="tb-alc${f.area==='Varias'?' gen':''}">${esc(f.area||'General')}</span>
    </div>
    <h3>${esc(f.formulario)}</h3>
    <div class="tb-sub">${fmIco('enlace',14)}<a class="fm-url" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.url)}</a></div>
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
    <div class="tb-actions">
      <a class="pj-link primary" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer" title="Abrir formulario de Kobo en una pestaña nueva">${fmIco('ext',15)}<span>Abrir formulario</span></a>
      <button class="pj-link icon-only" type="button" data-copy="${esc(f.url)}" title="Copiar enlace del formulario" aria-label="Copiar enlace de ${esc(f.formulario)}">${fmIco('copiar',15)}</button>
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
      <th>Acciones</th>
    </tr></thead>
    <tbody>${L.map(f=>{
      return `<tr class="t-${f.tipo==='Emergencia'?'em':'re'}">
        <td>${f.proyecto?`<b>${esc(f.proyecto)}</b>`:'<span class="muted">—</span>'}</td>
        <td>${f.area?`<span class="tb-alc${f.area==='Varias'?' gen':''}">${esc(f.area)}</span>`:'<span class="muted">—</span>'}</td>
        <td><div class="pj-tn">${esc(f.formulario)}</div></td>
        <td><span class="pj-tipo">${esc(f.tipo)}</span></td>
        <td>
          <div class="pj-tlinks">
            <a class="pj-link primary" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer" title="Abrir formulario en una pestaña nueva">${fmIco('ext',14)}<span>Abrir</span></a>
            <button class="pj-link" type="button" data-copy="${esc(f.url)}" title="Copiar enlace">${fmIco('copiar',14)}<span>Copiar</span></button>
          </div>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function fmActiveCount(){
  return [FRM.q.trim(),FRM.proyecto,FRM.area,FRM.tipo].filter(Boolean).length;
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
      <label class="pj-search">${fmIco('buscar',18)}<input class="in" id="fmQ" type="search" placeholder="Buscar por formulario, proyecto o área" value="${esc(FRM.q)}" aria-label="Buscar formularios"></label>
      <label class="pj-fg"><span class="pj-fl">Proyecto</span><select class="in" id="fmProyecto">${opt('','Todos',FRM.proyecto)}${proys.map(p=>opt(p,p,FRM.proyecto)).join('')}${tieneSinProy?opt('__sin__','Sin proyecto asignado',FRM.proyecto):''}</select></label>
      <label class="pj-fg"><span class="pj-fl">Área</span><select class="in" id="fmArea">${opt('','Todas',FRM.area)}${areas.map(a=>opt(a,a,FRM.area)).join('')}${tieneSinArea?opt('__sin__','Sin área especificada',FRM.area):''}</select></label>
      <div class="pj-fg"><span class="pj-fl">Tipo</span>${seg('tipo',[['','Todos'],['Regular','Regular'],['Emergencia','Emergencia']])}</div>
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
        <h1>Repositorio de formularios</h1>
        <p>Listado de formularios en KoboToolbox utilizados para la recolección y registro de información en los proyectos y áreas de la organización.</p>
      </div>
      <div class="pj-hero-side">
        <div class="pj-today">${fmIco('form',15)} KoboToolbox · Recolección de datos</div>
        <button class="btn pj-fbtn" type="button" data-fopen aria-expanded="${open}" aria-controls="sideFilters">${fmIco('filtro',16)}<span>Filtros</span><span class="fcount" id="fmFCount"${n?'':' hidden'}>${n}</span></button>
      </div>
    </section>
    <div id="fmOut"></div>
  </div>`;
}

function fmSyncVistaBtns(){
  document.querySelectorAll('.fm .pj-seg button[data-k="vista"]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===FRM.vista));
}

function fmCopyUrl(url){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>toast('Enlace del formulario copiado al portapapeles')).catch(()=>tbCopyFallback(url));
  } else if(typeof tbCopyFallback==='function'){
    tbCopyFallback(url);
  }
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
  out.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>fmCopyUrl(b.dataset.copy));
}

let fmResizeObs=null;
function bindFormularios(){
  const sf=$('#sideFilters');
  if(sf) sf.innerHTML=viewFormulariosFiltros();
  document.querySelectorAll('[data-fopen]').forEach(b=>b.onclick=()=>filterDrawer(!document.body.classList.contains('filters-open')));
  document.querySelectorAll('[data-fclose]').forEach(b=>b.onclick=()=>filterDrawer(false));
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
    Object.assign(FRM,{q:'',proyecto:'',area:'',tipo:'',vistaManual:false});
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
