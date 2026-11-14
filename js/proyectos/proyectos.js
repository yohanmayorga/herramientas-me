/* Herramientas M&E · Sección Proyectos: filtros, resumen y vista en tarjetas o en lista con avance del plazo */
const PRJ_VISTA_KEY='herramientas-me-proyectos-vista';
const PRJ={ q:'', tipo:'', moneda:'', estado:'', orden:'fin', vista:(()=>{ try{ return localStorage.getItem(PRJ_VISTA_KEY)==='lista'?'lista':'tarjetas'; }catch(e){ return 'tarjetas'; } })() };
const PRJ_DIAS_ALERTA=90;
const PRJ_ICON={
  prima:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>',
  matriz:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  carpeta:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tarjetas:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
const prjIco=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PRJ_ICON[n]}</svg>`;

const prjDate=s=>{ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const prjFmt=s=>{ const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };
const prjMoney=(n,cur)=>`${cur} ${n.toLocaleString('es-VE',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})}`;
const prjMoneyShort=n=>n>=1e6?`${(n/1e6).toLocaleString('es-VE',{maximumFractionDigits:1})} M`:n>=1e3?`${(n/1e3).toLocaleString('es-VE',{maximumFractionDigits:0})} mil`:n.toLocaleString('es-VE');
const prjNorm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

function prjCalc(p){
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const ini=prjDate(p.inicio), fin=prjDate(p.fin), DAY=864e5;
  const total=Math.max(1,Math.round((fin-ini)/DAY)), trans=Math.round((hoy-ini)/DAY), resta=Math.round((fin-hoy)/DAY);
  const pct=Math.max(0,Math.min(100,trans/total*100));
  let estado='ejecucion';
  if(hoy<ini) estado='porIniciar'; else if(hoy>fin) estado='finalizado'; else if(resta<=PRJ_DIAS_ALERTA) estado='porFinalizar';
  return {pct,resta,trans,total,estado};
}
/* Cada proyecto tiene un solo estado, según la fecha del día */
const PRJ_ESTADOS={ejecucion:['En ejecución','ok',`Quedan más de ${PRJ_DIAS_ALERTA} días`],porFinalizar:['Por finalizar','warn',`Quedan ${PRJ_DIAS_ALERTA} días o menos`],finalizado:['Finalizado','off','Ya pasó la fecha de fin'],porIniciar:['Por iniciar','info','Aún no llega la fecha de inicio']};

function prjFiltrados(){
  const q=prjNorm(PRJ.q.trim());
  let L=PROYECTOS.map(p=>({...p,c:prjCalc(p)})).filter(p=>
    (!q||prjNorm(`${p.nombre} ${p.codigo}`).includes(q))&&(!PRJ.tipo||p.tipo===PRJ.tipo)&&(!PRJ.moneda||p.moneda===PRJ.moneda)&&
    (!PRJ.estado||p.c.estado===PRJ.estado));
  const by={fin:(a,b)=>(a.c.estado==='finalizado')-(b.c.estado==='finalizado')||a.fin.localeCompare(b.fin),
    inicio:(a,b)=>b.inicio.localeCompare(a.inicio), avance:(a,b)=>b.c.pct-a.c.pct,
    monto:(a,b)=>a.moneda.localeCompare(b.moneda)||b.monto-a.monto, nombre:(a,b)=>a.nombre.localeCompare(b.nombre,'es')||a.codigo.localeCompare(b.codigo)};
  return L.sort(by[PRJ.orden]);
}

const prjPlazo=c=>c.estado==='finalizado'?`Finalizó hace ${-c.resta} ${-c.resta===1?'día':'días'}`:c.estado==='porIniciar'?`Inicia en ${-c.trans} ${-c.trans===1?'día':'días'}`:c.resta===0?'Finaliza hoy':`Faltan ${c.resta} ${c.resta===1?'día':'días'}`;
const prjLink=(url,ic,txt)=>url?`<a class="pj-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Abrir ${txt.toLowerCase()} en una pestaña nueva">${prjIco(ic)}<span>${txt}</span></a>`:`<span class="pj-link off" title="No hay ${txt.toLowerCase()} registrada">${prjIco(ic)}<span>Sin ${txt.toLowerCase()}</span></span>`;
const prjBar=(p,cls='pj-bar')=>`<div class="${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p.c.pct)}" aria-label="Plazo transcurrido de ${esc(p.nombre)}"><i style="width:${p.c.pct}%;background-size:${p.c.pct>0?10000/p.c.pct:100}% 100%"></i></div>`;
const prjChip=c=>{ const [el,ec,ed]=PRJ_ESTADOS[c.estado]; return `<span class="pj-st ${ec}" title="${ed}">${el}</span>`; };

function prjCard(p){
  const c=p.c, plazo=prjPlazo(c), link=prjLink;
  const pct=Math.round(c.pct);
  return `<article class="pj-card t-${p.tipo==='Emergencia'?'em':'re'}${c.estado==='finalizado'?' done':''}">
    <div class="pj-top"><span class="pj-tipo">${esc(p.tipo)}</span>${prjChip(c)}</div>
    <h3>${esc(p.nombre)}</h3>
    <div class="pj-code">${esc(p.codigo)}</div>
    <div class="pj-amt"><span>Presupuesto</span><b>${prjMoney(p.monto,p.moneda)}</b></div>
    <div class="pj-dates">${prjIco('cal',15)}<span><b>${prjFmt(p.inicio)}</b> al <b>${prjFmt(p.fin)}</b></span></div>
    <div class="pj-prog">
      <div class="pj-ph"><span>Plazo transcurrido</span><b>${pct} %</b></div>
      ${prjBar(p)}
      <div class="pj-pf"><span>${c.trans>0?Math.min(c.trans,c.total):0} de ${c.total} días</span><span class="${c.estado==='porFinalizar'?'warn':''}">${plazo}</span></div>
    </div>
    <div class="pj-links">${link(p.prima,'prima','PRIMA')}${link(p.matriz,'matriz','Matriz')}${link(p.carpeta,'carpeta','Carpeta')}</div>
  </article>`;
}

function prjTabla(L){
  return `<div class="pj-tablewrap"><table class="pj-table">
    <thead><tr><th>Proyecto</th><th>Tipo</th><th>Inicio</th><th>Fin</th><th class="pj-colp">Plazo transcurrido</th><th class="num">Presupuesto</th><th>Estado</th><th>Enlaces</th></tr></thead>
    <tbody>${L.map(p=>`<tr class="t-${p.tipo==='Emergencia'?'em':'re'}${p.c.estado==='finalizado'?' done':''}">
      <td data-label="Proyecto"><b>${esc(p.nombre)}</b><span class="pj-code">${esc(p.codigo)}</span></td>
      <td data-label="Tipo"><span class="pj-tipo">${esc(p.tipo)}</span></td>
      <td data-label="Inicio" class="nowrap">${prjFmt(p.inicio)}</td>
      <td data-label="Fin" class="nowrap">${prjFmt(p.fin)}</td>
      <td data-label="Plazo transcurrido" class="pj-colp"><div class="pj-tprog"><b>${Math.round(p.c.pct)} %</b>${prjBar(p)}</div><small class="${p.c.estado==='porFinalizar'?'warn':''}">${prjPlazo(p.c)}</small></td>
      <td data-label="Presupuesto" class="num nowrap">${prjMoney(p.monto,p.moneda)}</td>
      <td data-label="Estado">${prjChip(p.c)}</td>
      <td data-label="Enlaces"><div class="pj-tlinks">${prjLink(p.prima,'prima','PRIMA')}${prjLink(p.matriz,'matriz','Matriz')}${prjLink(p.carpeta,'carpeta','Carpeta')}</div></td>
    </tr>`).join('')}</tbody></table></div>`;
}

function prjResumen(L){
  const n=s=>L.filter(p=>p.c.estado===s).length, sum=cur=>L.filter(p=>p.moneda===cur).reduce((a,p)=>a+p.monto,0);
  const usd=sum('USD'), eur=sum('EUR'), pl=(k,a,b)=>`${k} ${k===1?a:b}`;
  return `<div class="pj-kpis">
    <div class="pj-kpi main"><span>Proyectos</span><b>${L.length}</b><small>${pl(n('finalizado'),'finalizado','finalizados')}${n('porIniciar')?` · ${n('porIniciar')} por iniciar`:''}</small></div>
    <div class="pj-kpi"><span>En ejecución</span><b>${n('ejecucion')}</b><small>Quedan más de ${PRJ_DIAS_ALERTA} días</small></div>
    <div class="pj-kpi"><span>Por finalizar</span><b>${n('porFinalizar')}</b><small>Quedan ${PRJ_DIAS_ALERTA} días o menos</small></div>
    <div class="pj-kpi"><span>Presupuesto en USD</span><b>${usd?prjMoneyShort(usd):'—'}</b><small>${pl(L.filter(p=>p.moneda==='USD').length,'proyecto','proyectos')}</small></div>
    <div class="pj-kpi"><span>Presupuesto en EUR</span><b>${eur?prjMoneyShort(eur):'—'}</b><small>${pl(L.filter(p=>p.moneda==='EUR').length,'proyecto','proyectos')}</small></div>
  </div>`;
}

function viewProyectos(){
  const opt=(v,l,cur)=>`<option value="${v}"${cur===v?' selected':''}>${l}</option>`;
  const seg=(k,vals)=>`<div class="pj-seg" role="group">${vals.map(([v,l])=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${PRJ[k]===v}">${l}</button>`).join('')}</div>`;
  return `<div class="portal pj">
    <section class="p-hero pj-hero"><div><h1>Proyectos</h1><p>Proyectos de la oficina, con su plazo, presupuesto y enlaces a PRIMA, la matriz de monitoreo y la carpeta en SharePoint.</p></div>
      <div class="pj-today">${prjIco('cal',15)} Avance calculado al ${new Date().toLocaleDateString('es-VE',{day:'2-digit',month:'2-digit',year:'numeric'})}</div></section>
    <div class="pj-filters" role="search">
      <label class="pj-search">${prjIco('buscar',18)}<input class="in" id="pjQ" type="search" placeholder="Buscar por proyecto o código" value="${esc(PRJ.q)}" aria-label="Buscar por proyecto o código"></label>
      <div class="pj-fg"><span class="pj-fl">Tipo</span>${seg('tipo',[['','Todos'],['Emergencia','Emergencia'],['Regular','Regular']])}</div>
      <div class="pj-fg"><span class="pj-fl">Moneda</span>${seg('moneda',[['','Todas'],['USD','USD'],['EUR','EUR']])}</div>
      <label class="pj-fg"><span class="pj-fl">Estado</span><select class="in" id="pjEstado">${opt('','Todos',PRJ.estado)}${opt('ejecucion','En ejecución',PRJ.estado)}${opt('porFinalizar','Por finalizar',PRJ.estado)}${opt('porIniciar','Por iniciar',PRJ.estado)}${opt('finalizado','Finalizados',PRJ.estado)}</select></label>
      <label class="pj-fg"><span class="pj-fl">Ordenar por</span><select class="in" id="pjOrden">${opt('fin','Fecha de fin más próxima',PRJ.orden)}${opt('inicio','Inicio más reciente',PRJ.orden)}${opt('avance','Mayor avance del plazo',PRJ.orden)}${opt('monto','Mayor presupuesto',PRJ.orden)}${opt('nombre','Nombre (A–Z)',PRJ.orden)}</select></label>
      <div class="pj-fg pj-view"><span class="pj-fl">Vista</span><div class="pj-seg" role="group">${[['tarjetas','Tarjetas'],['lista','Lista']].map(([v,l])=>`<button type="button" data-k="vista" data-v="${v}" aria-pressed="${PRJ.vista===v}">${prjIco(v,15)}<span>${l}</span></button>`).join('')}</div></div>
      <button class="btn sm pj-clear" type="button" id="pjClear"${PRJ.q||PRJ.tipo||PRJ.moneda||PRJ.estado?'':' hidden'}>Limpiar filtros</button>
    </div>
    <div id="pjOut"></div></div>`;
}

function prjPaint(){
  const L=prjFiltrados();
  $('#pjOut').innerHTML=prjResumen(L)+(L.length?(PRJ.vista==='lista'?prjTabla(L):`<div class="pj-grid">${L.map(prjCard).join('')}</div>`):'<div class="p-box pj-empty">No hay proyectos que coincidan con los filtros seleccionados.</div>');
  $('#pjClear').hidden=!(PRJ.q||PRJ.tipo||PRJ.moneda||PRJ.estado);
}

function bindProyectos(){
  $('#pjQ').addEventListener('input',e=>{ PRJ.q=e.target.value; prjPaint(); });
  document.querySelectorAll('.pj-seg button').forEach(b=>b.onclick=()=>{ PRJ[b.dataset.k]=b.dataset.v; document.querySelectorAll(`.pj-seg button[data-k="${b.dataset.k}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b)); if(b.dataset.k==='vista'){ try{ localStorage.setItem(PRJ_VISTA_KEY,b.dataset.v); }catch(e){} } prjPaint(); });
  $('#pjEstado').onchange=e=>{ PRJ.estado=e.target.value; prjPaint(); };
  $('#pjOrden').onchange=e=>{ PRJ.orden=e.target.value; prjPaint(); };
  $('#pjClear').onclick=()=>{ Object.assign(PRJ,{q:'',tipo:'',moneda:'',estado:''}); $('#home').innerHTML=viewProyectos(); bindProyectos(); };
  prjPaint();
}
