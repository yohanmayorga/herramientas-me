/* Herramientas M&E · Sección Repositorio de tableros: filtros, resumen, tarjetas y lista */
const TBL={ q:'', proyecto:'', tipo:'', alcance:'', estado:'', actualizacion:'', vista:'lista', vistaManual:false };

const TBL_ICON={
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  socio:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  general:'<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  proyecto:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  copiar:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  filtro:'<path d="M3 5h18M6 12h12M10 19h4"/>',
  tarjetas:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const tbIco=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TBL_ICON[n]||''}</svg>`;
const tbNorm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function tbEstadoClase(est){
  const e=tbNorm(est);
  if(e==='activo'||e==='vigente') return 'ok';
  if(e==='en desarrollo'||e==='pausado') return 'warn';
  return 'off';
}

function tbFiltrados(){
  const q=tbNorm(TBL.q.trim());
  return TABLEROS.map((t,idx)=>({...t,_idx:idx})).filter(t=>{
    if(q&&!tbNorm(`${t.nombre} ${t.proyecto} ${t.tipo} ${t.socio||''} ${t.alcance||''} ${t.descripcion||''} ${t.actualizacion||''} ${t.estado||''}`).includes(q)) return false;
    if(TBL.proyecto&&t.proyecto!==TBL.proyecto) return false;
    if(TBL.tipo&&t.tipo!==TBL.tipo) return false;
    if(TBL.alcance&&t.alcance!==TBL.alcance) return false;
    if(TBL.estado&&t.estado!==TBL.estado) return false;
    if(TBL.actualizacion&&t.actualizacion!==TBL.actualizacion) return false;
    return true;
  });
}

function tbCard(t){
  const ec=tbEstadoClase(t.estado), done=ec==='off';
  const esGen=t.alcance==='General', sinProy=tbNorm(t.proyecto)==='no aplica';
  const pTxt=sinProy?'No Aplica':`Proyecto ${t.proyecto} ${t.tipo.toLowerCase()}`;
  return `<article class="pj-card t-${t.tipo==='Emergencia'?'em':'re'}${done?' done':''}">
    <div class="pj-top">
      <span class="pj-tipo">${esc(t.proyecto)} · ${esc(t.tipo)}</span>
      <span class="pj-st ${ec}">${esc(t.estado)}</span>
    </div>
    <h3>${esc(t.nombre)}</h3>
    <div class="tb-sub">${tbIco(esGen?'general':'socio',14)}<span>${esc(esGen?(sinProy?'Consolidado general':'Consolidado general del proyecto'):`Socio: ${t.socio||t.nombre}`)}</span></div>
    <p class="tb-desc">${esc(t.descripcion)}</p>
    <div class="tb-meta">
      <div class="tb-mitem">
        <span>${tbIco('proyecto',13)} Proyecto</span>
        <b title="${esc(pTxt)}">${esc(pTxt)}</b>
      </div>
      <div class="tb-mitem">
        <span>${tbIco('reloj',13)} Actualizaciones</span>
        <b title="${esc(t.actualizacion)}">${esc(t.actualizacion)}</b>
      </div>
    </div>
    <div class="tb-actions">
      <a class="pj-link primary" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" title="Abrir tablero en una pestaña nueva">${tbIco('ext',15)}<span>Abrir tablero</span></a>
      <button class="pj-link icon-only" type="button" data-copy="${esc(t.url)}" title="Copiar enlace del tablero" aria-label="Copiar enlace de ${esc(t.nombre)}">${tbIco('copiar',15)}</button>
    </div>
  </article>`;
}

function tbTabla(L){
  return `<div class="scroll pj-tbl-wrap"><table class="pj-tbl">
    <thead><tr>
      <th>Tablero</th>
      <th>Proyecto</th>
      <th>Alcance / Socio</th>
      <th>Estado</th>
      <th>Actualización</th>
      <th>Acciones</th>
    </tr></thead>
    <tbody>${L.map(t=>{
      const ec=tbEstadoClase(t.estado), done=ec==='off', esGen=t.alcance==='General';
      return `<tr class="t-${t.tipo==='Emergencia'?'em':'re'}${done?' done':''}">
        <td><div class="pj-tn">${esc(t.nombre)}</div></td>
        <td><span class="pj-tipo">${esc(t.proyecto)} · ${esc(t.tipo)}</span></td>
        <td><span class="tb-alc${esGen?' gen':''}">${esc(esGen?'General':t.socio||'Socio')}</span></td>
        <td><span class="pj-st ${ec}">${esc(t.estado)}</span></td>
        <td><span class="tb-tfreq">${tbIco('reloj',14)}${esc(t.actualizacion)}</span></td>
        <td>
          <div class="pj-tlinks">
            <a class="pj-link primary" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" title="Abrir tablero en una pestaña nueva">${tbIco('ext',14)}<span>Abrir</span></a>
            <button class="pj-link" type="button" data-copy="${esc(t.url)}" title="Copiar enlace">${tbIco('copiar',14)}<span>Copiar</span></button>
          </div>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function tbActiveCount(){
  return [TBL.q.trim(),TBL.proyecto,TBL.tipo,TBL.alcance,TBL.estado,TBL.actualizacion].filter(Boolean).length;
}

function viewTablerosFiltros(){
  const opt=(v,l,cur)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
  const seg=(k,vals)=>`<div class="pj-seg" role="group">${vals.map(([v,l,ic])=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${TBL[k]===v}">${ic?tbIco(ic,15):''}<span>${l}</span></button>`).join('')}</div>`;
  const proys=[...new Set(TABLEROS.map(t=>t.proyecto))];
  const estados=[...new Set(['Activo','Finalizado',...TABLEROS.map(t=>t.estado)])];
  const acts=[...new Set(TABLEROS.map(t=>t.actualizacion))];
  const n=tbActiveCount();
  return `<div class="sf-wrap pj tb" role="search">
    <div class="side-h sf-head"><span>Filtros</span><button class="btn sm sf-close" type="button" data-fclose aria-label="Cerrar filtros">✕</button></div>
    <div class="sf-body">
      <label class="pj-search">${tbIco('buscar',18)}<input class="in" id="tbQ" type="search" placeholder="Buscar por tablero, socio o proyecto" value="${esc(TBL.q)}" aria-label="Buscar tableros"></label>
      <label class="pj-fg"><span class="pj-fl">Proyecto</span><select class="in" id="tbProyecto">${opt('','Todos',TBL.proyecto)}${proys.map(p=>opt(p,p,TBL.proyecto)).join('')}</select></label>
      <div class="pj-fg"><span class="pj-fl">Tipo</span>${seg('tipo',[['','Todos'],['Regular','Regular'],['Emergencia','Emergencia']])}</div>
      <div class="pj-fg"><span class="pj-fl">Alcance</span>${seg('alcance',[['','Todos'],['General','General'],['Socio','Por socio']])}</div>
      <label class="pj-fg"><span class="pj-fl">Estado</span><select class="in" id="tbEstado">${opt('','Todos',TBL.estado)}${estados.map(e=>opt(e,e,TBL.estado)).join('')}</select></label>
      <label class="pj-fg"><span class="pj-fl">Actualización</span><select class="in" id="tbAct">${opt('','Todas',TBL.actualizacion)}${acts.map(a=>opt(a,a,TBL.actualizacion)).join('')}</select></label>
      <div class="pj-fg"><span class="pj-fl">Vista</span>${seg('vista',[['lista','Lista','lista'],['tarjetas','Tarjetas','tarjetas']])}</div>
    </div>
    <div class="sf-foot">
      <button class="btn sm pj-clear" type="button" id="tbClear"${n?'':' hidden'}>Limpiar filtros</button>
      <button class="btn sm primary sf-done" type="button" data-fclose>Ver resultados</button>
    </div>
  </div>`;
}

function viewTableros(){
  const n=tbActiveCount();
  const open=document.body.classList.contains('filters-open');
  return `<div class="portal pj tb">
    <section class="p-hero pj-hero">
      <div>
        <h1>Repositorio de tableros</h1>
        <p>Listado de tableros desarrollados en Power BI para el seguimiento de los proyectos de la organización y sus socios implementadores.</p>
      </div>
      <div class="pj-hero-side">
        <div class="pj-today">${tbIco('reloj',15)} Power BI · Seguimiento de proyectos</div>
        <button class="btn pj-fbtn" type="button" data-fopen aria-expanded="${open}" aria-controls="sideFilters">${tbIco('filtro',16)}<span>Filtros</span><span class="fcount" id="tbFCount"${n?'':' hidden'}>${n}</span></button>
      </div>
    </section>
    <div id="tbOut"></div>
  </div>`;
}

function tbSyncVistaBtns(){
  document.querySelectorAll('.tb .pj-seg button[data-k="vista"]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===TBL.vista));
}

function tbCopyUrl(url){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>toast('Enlace del tablero copiado al portapapeles')).catch(()=>tbCopyFallback(url));
  } else {
    tbCopyFallback(url);
  }
}

function tbCopyFallback(url){
  const ta=document.createElement('textarea');
  ta.value=url; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); toast('Enlace del tablero copiado al portapapeles'); }catch(e){}
  ta.remove();
}

function tbPaint(){
  const L=tbFiltrados(), out=$('#tbOut');
  if(!out) return;
  if(!TBL.vistaManual) TBL.vista=(window.innerWidth<=960||(window.innerHeight<=600&&window.innerWidth>window.innerHeight))?'tarjetas':'lista';
  if(!L.length){
    out.innerHTML='<div class="p-box pj-empty">No hay tableros que coincidan con los filtros seleccionados.</div>';
  } else {
    out.innerHTML=TBL.vista==='lista'?tbTabla(L):`<div class="pj-grid">${L.map(tbCard).join('')}</div>`;
    if(!TBL.vistaManual&&TBL.vista==='lista'){
      const wrap=out.querySelector('.pj-tbl-wrap');
      if(wrap&&wrap.scrollWidth>wrap.clientWidth+2){
        TBL.vista='tarjetas';
        out.innerHTML=`<div class="pj-grid">${L.map(tbCard).join('')}</div>`;
      }
    }
  }
  tbSyncVistaBtns();
  const n=tbActiveCount();
  const cl=$('#tbClear'); if(cl) cl.hidden=!n;
  const fc=$('#tbFCount'); if(fc){ fc.textContent=n; fc.hidden=!n; }
  out.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>tbCopyUrl(b.dataset.copy));
}

let tbResizeObs=null;
function bindTableros(){
  const sf=$('#sideFilters');
  if(sf) sf.innerHTML=viewTablerosFiltros();
  document.querySelectorAll('[data-fopen]').forEach(b=>b.onclick=()=>filterDrawer(!document.body.classList.contains('filters-open')));
  document.querySelectorAll('[data-fclose]').forEach(b=>b.onclick=()=>filterDrawer(false));
  $('#tbQ').addEventListener('input',e=>{ TBL.q=e.target.value; tbPaint(); });
  document.querySelectorAll('.tb .pj-seg button').forEach(b=>b.onclick=()=>{
    if(b.dataset.k==='vista') TBL.vistaManual=true;
    TBL[b.dataset.k]=b.dataset.v;
    document.querySelectorAll(`.tb .pj-seg button[data-k="${b.dataset.k}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b));
    tbPaint();
  });
  $('#tbProyecto').onchange=e=>{ TBL.proyecto=e.target.value; tbPaint(); };
  $('#tbEstado').onchange=e=>{ TBL.estado=e.target.value; tbPaint(); };
  $('#tbAct').onchange=e=>{ TBL.actualizacion=e.target.value; tbPaint(); };
  $('#tbClear').onclick=()=>{
    Object.assign(TBL,{q:'',proyecto:'',tipo:'',alcance:'',estado:'',actualizacion:'',vistaManual:false});
    $('#home').innerHTML=viewTableros();
    bindTableros();
  };
  if(tbResizeObs) tbResizeObs.disconnect();
  if(window.ResizeObserver){
    let lastW=0;
    tbResizeObs=new ResizeObserver(entries=>{
      const w=Math.round(entries[0]?.contentRect?.width||0);
      if(w&&w!==lastW){ lastW=w; if(!TBL.vistaManual) tbPaint(); }
    });
    tbResizeObs.observe($('#tbOut'));
  }
  tbPaint();
}
