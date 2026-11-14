/* Herramientas M&E · Sección Proyectos: filtros, resumen, vista en lista y en tarjetas */
const PRJ={ q:'', tipo:'', moneda:'', estado:'', orden:'fin', vista:'lista', vistaManual:false };
const PRJ_DIAS_ALERTA=90;
const PRJ_ICON={
  prima:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>',
  matriz:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  carpeta:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  filtro:'<path d="M3 5h18M6 12h12M10 19h4"/>',
  tarjetas:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const prjIco=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PRJ_ICON[n]}</svg>`;

const prjDate=s=>{ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const prjFmt=s=>{ const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };
const prjMoney=(n,cur)=>`${cur} ${n.toLocaleString('es-VE',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})}`;
const prjMoneyShort=n=>n>=1e6?`${(n/1e6).toLocaleString('es-VE',{maximumFractionDigits:1})} M`:n>=1e3?`${(n/1e3).toLocaleString('es-VE',{maximumFractionDigits:0})} mil`:n.toLocaleString('es-VE');
const prjNorm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const prjDias=(n,s='día',pl='días')=>`${n} ${n===1?s:pl}`;

function prjCalc(p){
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const ini=prjDate(p.inicio), fin=prjDate(p.fin), DAY=864e5;
  const total=Math.max(1,Math.round((fin-ini)/DAY)), trans=Math.round((hoy-ini)/DAY), resta=Math.round((fin-hoy)/DAY);
  const pct=Math.max(0,Math.min(100,trans/total*100));
  let estado='vigente';
  if(hoy<ini) estado='porIniciar'; else if(hoy>fin) estado='finalizado'; else if(resta<=PRJ_DIAS_ALERTA) estado='porFinalizar';
  return {pct,resta,trans,total,estado};
}
const PRJ_ESTADOS={vigente:['Vigente','ok'],porFinalizar:['Por finalizar','warn'],finalizado:['Finalizado','off'],porIniciar:['Por iniciar','info']};

function prjTextosPlazo(c){
  const trans=c.trans>0?Math.min(c.trans,c.total):0;
  const transTxt=c.estado==='porIniciar'?'Aún sin iniciar':c.estado==='finalizado'?'Plazo completado':`Han transcurrido ${prjDias(trans)}`;
  const transTot=c.estado==='porIniciar'?`${prjDias(c.total)} totales`:`de ${prjDias(c.total)}`;
  const restaVal=c.estado==='finalizado'?'0 días':c.estado==='porIniciar'?prjDias(c.total):c.resta===0?'Hoy':`Faltan ${prjDias(c.resta)}`;
  const restaSub=c.estado==='finalizado'?`Cerró hace ${prjDias(-c.resta)}`:c.estado==='porIniciar'?`Inicia en ${prjDias(-c.trans)}`:c.resta===0?'Cierra hoy':'Para el cierre';
  return {trans,transTxt,transTot,restaVal,restaSub};
}

function prjLink(url,ic,txt){
  return url
    ?`<a class="pj-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Abrir ${txt.toLowerCase()} en una pestaña nueva">${prjIco(ic)}<span>${txt}</span></a>`
    :`<span class="pj-link off" title="No hay ${txt.toLowerCase()} registrada">${prjIco(ic)}<span>Sin ${txt.toLowerCase()}</span></span>`;
}

function prjFiltrados(){
  const q=prjNorm(PRJ.q.trim());
  let L=PROYECTOS.map(p=>({...p,c:prjCalc(p)})).filter(p=>
    (!q||prjNorm(`${p.nombre} ${p.codigo}`).includes(q))&&(!PRJ.tipo||p.tipo===PRJ.tipo)&&(!PRJ.moneda||p.moneda===PRJ.moneda)&&
    (!PRJ.estado||(PRJ.estado==='vigente'?p.c.estado==='vigente'||p.c.estado==='porFinalizar':p.c.estado===PRJ.estado)));
  const by={fin:(a,b)=>(a.c.estado==='finalizado')-(b.c.estado==='finalizado')||a.fin.localeCompare(b.fin),
    inicio:(a,b)=>b.inicio.localeCompare(a.inicio), avance:(a,b)=>b.c.pct-a.c.pct,
    monto:(a,b)=>a.moneda.localeCompare(b.moneda)||b.monto-a.monto, nombre:(a,b)=>a.nombre.localeCompare(b.nombre,'es')||a.codigo.localeCompare(b.codigo)};
  return L.sort(by[PRJ.orden]);
}

function prjCard(p){
  const c=p.c, [el,ec]=PRJ_ESTADOS[c.estado], pct=Math.round(c.pct), t=prjTextosPlazo(c);
  return `<article class="pj-card t-${p.tipo==='Emergencia'?'em':'re'}${c.estado==='finalizado'?' done':''}">
    <div class="pj-top"><span class="pj-tipo">${esc(p.tipo)}</span><span class="pj-st ${ec}">${el}</span></div>
    <h3>${esc(p.nombre)}</h3>
    <div class="pj-code">${esc(p.codigo)}</div>
    <div class="pj-amt"><span>Presupuesto</span><b>${prjMoney(p.monto,p.moneda)}</b></div>
    <div class="pj-dates">${prjIco('cal',15)}<span><b>${prjFmt(p.inicio)}</b> al <b>${prjFmt(p.fin)}</b></span></div>
    <div class="pj-prog">
      <div class="pj-pcol">
        <div class="pj-ph"><span>Plazo transcurrido</span><b>${pct} %</b></div>
        <div class="pj-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Plazo transcurrido de ${esc(p.nombre)}"><i style="width:${c.pct}%;background-size:${c.pct>0?10000/c.pct:100}% 100%"></i></div>
        <div class="pj-pf"><span>${t.transTxt}</span><span>${t.transTot}</span></div>
      </div>
      <div class="pj-pcol pj-rem${c.estado==='porFinalizar'?' warn':c.estado==='finalizado'?' off':''}">
        <span class="pj-rl">Días restantes</span>
        <b class="pj-rv">${t.restaVal}</b>
        <small class="pj-rs">${t.restaSub}</small>
      </div>
    </div>
    <div class="pj-links">${prjLink(p.prima,'prima','PRIMA')}${prjLink(p.matriz,'matriz','Matriz')}${prjLink(p.carpeta,'carpeta','Carpeta')}</div>
  </article>`;
}

function prjTabla(L){
  return `<div class="scroll pj-tbl-wrap"><table class="pj-tbl">
    <thead><tr>
      <th>Proyecto</th>
      <th>Tipo</th>
      <th>Estado</th>
      <th class="num">Presupuesto</th>
      <th>Periodo</th>
      <th>Plazo transcurrido</th>
      <th>Días restantes</th>
      <th>Enlaces</th>
    </tr></thead>
    <tbody>${L.map(p=>{
      const c=p.c, [el,ec]=PRJ_ESTADOS[c.estado], pct=Math.round(c.pct), t=prjTextosPlazo(c);
      return `<tr class="t-${p.tipo==='Emergencia'?'em':'re'}${c.estado==='finalizado'?' done':''}">
        <td><div class="pj-tn">${esc(p.nombre)}</div><div class="pj-code">${esc(p.codigo)}</div></td>
        <td><span class="pj-tipo">${esc(p.tipo)}</span></td>
        <td><span class="pj-st ${ec}">${el}</span></td>
        <td class="num"><b>${prjMoney(p.monto,p.moneda)}</b></td>
        <td class="pj-tdates"><div><b>${prjFmt(p.inicio)}</b></div><small>al ${prjFmt(p.fin)}</small></td>
        <td class="pj-tprog">
          <div class="pj-ph"><b>${pct} %</b><span>${t.trans}/${c.total} días</span></div>
          <div class="pj-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Plazo transcurrido de ${esc(p.nombre)}"><i style="width:${c.pct}%;background-size:${c.pct>0?10000/c.pct:100}% 100%"></i></div>
          <div class="pj-pf"><span>${t.transTxt}</span></div>
        </td>
        <td class="pj-trem${c.estado==='porFinalizar'?' warn':c.estado==='finalizado'?' off':''}">
          <b class="pj-rv">${t.restaVal}</b>
          <small class="pj-rs">${t.restaSub}</small>
        </td>
        <td><div class="pj-tlinks">${prjLink(p.prima,'prima','PRIMA')}${prjLink(p.matriz,'matriz','Matriz')}${prjLink(p.carpeta,'carpeta','Carpeta')}</div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function prjResumen(L){
  const act=PRJ.estado==='finalizado'?L:L.filter(p=>p.c.estado!=='finalizado');
  const vig=L.filter(p=>p.c.estado==='vigente'||p.c.estado==='porFinalizar');
  const porFin=L.filter(p=>p.c.estado==='porFinalizar');
  const sum=cur=>act.filter(p=>p.moneda===cur).reduce((a,p)=>a+p.monto,0);
  const usd=sum('USD'), eur=sum('EUR'), pl=(k,a,b)=>`${k} ${k===1?a:b}`;
  const em=act.filter(p=>p.tipo==='Emergencia').length, re=act.filter(p=>p.tipo==='Regular').length;
  return `<div class="pj-kpis">
    <div class="pj-kpi main"><span>Proyectos</span><b>${act.length}</b><small>${em} emergencia · ${re} regular</small></div>
    <div class="pj-kpi"><span>Vigentes</span><b>${vig.length}</b><small>${pl(vig.filter(p=>p.c.estado==='vigente').length,'con holgura','con holgura')}</small></div>
    <div class="pj-kpi"><span>Por finalizar</span><b>${porFin.length}</b><small>Cierran en ≤ ${PRJ_DIAS_ALERTA} días</small></div>
    <div class="pj-kpi"><span>Presupuesto en USD</span><b>${usd?prjMoneyShort(usd):'—'}</b><small>${pl(act.filter(p=>p.moneda==='USD').length,'proyecto','proyectos')}</small></div>
    <div class="pj-kpi"><span>Presupuesto en EUR</span><b>${eur?prjMoneyShort(eur):'—'}</b><small>${pl(act.filter(p=>p.moneda==='EUR').length,'proyecto','proyectos')}</small></div>
  </div>`;
}

function prjActiveCount(){
  return [PRJ.q.trim(),PRJ.tipo,PRJ.moneda,PRJ.estado].filter(Boolean).length;
}

function viewProyectosFiltros(){
  const opt=(v,l,cur)=>`<option value="${v}"${cur===v?' selected':''}>${l}</option>`;
  const seg=(k,vals)=>`<div class="pj-seg" role="group">${vals.map(([v,l,ic])=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${PRJ[k]===v}">${ic?prjIco(ic,15):''}<span>${l}</span></button>`).join('')}</div>`;
  const n=prjActiveCount();
  return `<div class="sf-wrap pj" role="search">
    <div class="side-h sf-head"><span>Filtros</span><button class="btn sm sf-close" type="button" data-fclose aria-label="Cerrar filtros">✕</button></div>
    <div class="sf-body">
      <label class="pj-search">${prjIco('buscar',18)}<input class="in" id="pjQ" type="search" placeholder="Buscar por proyecto o código" value="${esc(PRJ.q)}" aria-label="Buscar por proyecto o código"></label>
      <div class="pj-fg"><span class="pj-fl">Tipo</span>${seg('tipo',[['','Todos'],['Emergencia','Emergencia'],['Regular','Regular']])}</div>
      <div class="pj-fg"><span class="pj-fl">Moneda</span>${seg('moneda',[['','Todas'],['USD','USD'],['EUR','EUR']])}</div>
      <label class="pj-fg"><span class="pj-fl">Estado</span><select class="in" id="pjEstado">${opt('','Todos',PRJ.estado)}${opt('vigente','Vigentes',PRJ.estado)}${opt('porFinalizar','Por finalizar',PRJ.estado)}${opt('porIniciar','Por iniciar',PRJ.estado)}${opt('finalizado','Finalizados',PRJ.estado)}</select></label>
      <label class="pj-fg"><span class="pj-fl">Ordenar por</span><select class="in" id="pjOrden">${opt('fin','Fecha de fin más próxima',PRJ.orden)}${opt('inicio','Inicio más reciente',PRJ.orden)}${opt('avance','Mayor avance del plazo',PRJ.orden)}${opt('monto','Mayor presupuesto',PRJ.orden)}${opt('nombre','Nombre (A–Z)',PRJ.orden)}</select></label>
      <div class="pj-fg"><span class="pj-fl">Vista</span>${seg('vista',[['lista','Lista','lista'],['tarjetas','Tarjetas','tarjetas']])}</div>
    </div>
    <div class="sf-foot">
      <button class="btn sm pj-clear" type="button" id="pjClear"${n?'':' hidden'}>Limpiar filtros</button>
      <button class="btn sm primary sf-done" type="button" data-fclose>Ver resultados</button>
    </div>
  </div>`;
}

function viewProyectos(){
  const n=prjActiveCount();
  const open=document.body.classList.contains('filters-open');
  return `<div class="portal pj">
    <section class="p-hero pj-hero"><div><h1>Proyectos</h1><p>Proyectos de la oficina, con su plazo, presupuesto y enlaces a PRIMA, la matriz de monitoreo y la carpeta en SharePoint.</p></div>
      <div class="pj-hero-side">
        <div class="pj-today">${prjIco('cal',15)} Avance calculado al ${new Date().toLocaleDateString('es-VE',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>
        <button class="btn pj-fbtn" type="button" data-fopen aria-expanded="${open}" aria-controls="sideFilters">${prjIco('filtro',16)}<span>Filtros</span><span class="fcount" id="pjFCount"${n?'':' hidden'}>${n}</span></button>
      </div></section>
    <div id="pjOut"></div></div>`;
}

function prjSyncVistaBtns(){
  document.querySelectorAll('.pj-seg button[data-k="vista"]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===PRJ.vista));
}

function prjPaint(){
  const L=prjFiltrados(), out=$('#pjOut');
  if(!out) return;
  if(!PRJ.vistaManual) PRJ.vista=(window.innerWidth<=960||(window.innerHeight<=600&&window.innerWidth>window.innerHeight))?'tarjetas':'lista';
  const resumen=prjResumen(L);
  if(!L.length){
    out.innerHTML=resumen+'<div class="p-box pj-empty">No hay proyectos que coincidan con los filtros seleccionados.</div>';
  } else {
    out.innerHTML=resumen+(PRJ.vista==='lista'?prjTabla(L):`<div class="pj-grid">${L.map(prjCard).join('')}</div>`);
    if(!PRJ.vistaManual&&PRJ.vista==='lista'){
      const wrap=out.querySelector('.pj-tbl-wrap');
      if(wrap&&wrap.scrollWidth>wrap.clientWidth+2){
        PRJ.vista='tarjetas';
        out.innerHTML=resumen+`<div class="pj-grid">${L.map(prjCard).join('')}</div>`;
      }
    }
  }
  prjSyncVistaBtns();
  const n=prjActiveCount();
  const cl=$('#pjClear'); if(cl) cl.hidden=!n;
  const fc=$('#pjFCount'); if(fc){ fc.textContent=n; fc.hidden=!n; }
}

let prjResizeObs=null;
function bindProyectos(){
  const sf=$('#sideFilters');
  if(sf) sf.innerHTML=viewProyectosFiltros();
  document.querySelectorAll('[data-fopen]').forEach(b=>b.onclick=()=>filterDrawer(!document.body.classList.contains('filters-open')));
  document.querySelectorAll('[data-fclose]').forEach(b=>b.onclick=()=>filterDrawer(false));
  $('#pjQ').addEventListener('input',e=>{ PRJ.q=e.target.value; prjPaint(); });
  document.querySelectorAll('.pj-seg button').forEach(b=>b.onclick=()=>{
    if(b.dataset.k==='vista') PRJ.vistaManual=true;
    PRJ[b.dataset.k]=b.dataset.v;
    document.querySelectorAll(`.pj-seg button[data-k="${b.dataset.k}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b));
    prjPaint();
  });
  $('#pjEstado').onchange=e=>{ PRJ.estado=e.target.value; prjPaint(); };
  $('#pjOrden').onchange=e=>{ PRJ.orden=e.target.value; prjPaint(); };
  $('#pjClear').onclick=()=>{ Object.assign(PRJ,{q:'',tipo:'',moneda:'',estado:'',vistaManual:false}); $('#home').innerHTML=viewProyectos(); bindProyectos(); };
  if(prjResizeObs) prjResizeObs.disconnect();
  if(window.ResizeObserver){
    let lastW=0;
    prjResizeObs=new ResizeObserver(entries=>{
      const w=Math.round(entries[0]?.contentRect?.width||0);
      if(w&&w!==lastW){ lastW=w; if(!PRJ.vistaManual) prjPaint(); }
    });
    prjResizeObs.observe($('#pjOut'));
  }
  prjPaint();
}
