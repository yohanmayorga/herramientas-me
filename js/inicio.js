/* Herramientas M&E · Portada interactiva y arranque de la aplicación. */
const HOME_ST={ tl:'activos' };

const PORTADA_ENLACES=[
  {
    nombre:'KoboToolbox',
    sub:'Servidor OIM de formularios',
    url:'https://kf.kobo.iom.int/',
    color:'#2095F3',
    logo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M12 2.5 20.5 7.4v9.2L12 21.5 3.5 16.6V7.4z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8v8M9 12l5-4M11.2 10.2 15 16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    nombre:'Kobo ODK · XLSForm',
    sub:'Estándar y sintaxis de formularios',
    url:'https://getodk.org/xlsform/',
    color:'#009ECC',
    logo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2.5" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1.7"/><path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.5" cy="15.5" r="2.2" fill="currentColor"/></svg>'
  },
  {
    nombre:'PRIMA',
    sub:'Gestión de proyectos OIM',
    url:'https://primaforall.iom.int/Pages/Home.aspx',
    color:'#0033A0',
    logo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="2.5" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1.7"/><path d="M8 16V9.5a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 0 5H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="15.8" cy="15.2" r="1.4" fill="currentColor"/></svg>'
  },
  {
    nombre:'IOM SRF',
    sub:'Strategic Results Framework',
    url:'https://www.iom.int/iom-strategic-results-framework-srf',
    color:'#1C4FC4',
    logo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  },
  {
    nombre:'IMS',
    sub:'Information Management System',
    url:'https://ims.iom.int/',
    color:'#1E7A4C',
    logo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><ellipse cx="12" cy="6.5" rx="7.5" ry="3" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 6.5v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-5M4.5 11.5v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-5" stroke="currentColor" stroke-width="1.7"/></svg>'
  }
];

function homeDatos(){
  const proys=(typeof PROYECTOS!=='undefined'?PROYECTOS:[]).map(p=>({...p,c:prjCalc(p)}));
  const activos=proys.filter(p=>p.c.estado!=='finalizado');
  const porFin=proys.filter(p=>p.c.estado==='porFinalizar');
  const usd=activos.filter(p=>p.moneda==='USD').reduce((a,p)=>a+p.monto,0);
  const eur=activos.filter(p=>p.moneda==='EUR').reduce((a,p)=>a+p.monto,0);
  const tabs=typeof TABLEROS!=='undefined'?TABLEROS:[];
  const tabsAct=tabs.filter(t=>t.estado==='Activo');
  const tabsAuto=tabsAct.filter(t=>t.actualizacion==='Automática');
  const forms=typeof FORMULARIOS!=='undefined'?FORMULARIOS:[];
  const formsReg=forms.filter(f=>f.tipo==='Regular');
  const formsEmer=forms.filter(f=>f.tipo==='Emergencia');
  return {proys,activos,porFin,usd,eur,tabs,tabsAct,tabsAuto,forms,formsReg,formsEmer};
}

function homeTimelineTicks(minMs,maxMs){
  const span=maxMs-minMs;
  const minD=new Date(minMs), maxD=new Date(maxMs);
  const stepM=span<=864e5*730?6:12;
  const ticks=[];
  const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  let y=minD.getFullYear(), m=stepM===12?0:Math.floor(minD.getMonth()/6)*6;
  while(true){
    const d=new Date(y,m,1);
    const ms=d.getTime();
    if(ms>maxMs) break;
    if(ms>=minMs){
      const pct=(ms-minMs)/span*100;
      const lbl=stepM===12?String(y):`${meses[m]} ${String(y).slice(2)}`;
      ticks.push({pct,lbl});
    }
    m+=stepM;
    if(m>=12){ y+=Math.floor(m/12); m%=12; }
  }
  return ticks;
}

function homeRenderTimeline(){
  const d=homeDatos();
  let lista=d.proys.slice();
  if(HOME_ST.tl==='activos') lista=lista.filter(p=>p.c.estado!=='finalizado');
  else if(HOME_ST.tl==='Emergencia'||HOME_ST.tl==='Regular') lista=lista.filter(p=>p.tipo===HOME_ST.tl);
  lista.sort((a,b)=>(a.c.estado==='finalizado')-(b.c.estado==='finalizado')||a.fin.localeCompare(b.fin)||a.inicio.localeCompare(b.inicio));
  if(!lista.length) return '<p class="muted" style="margin:0">No hay proyectos para mostrar con este filtro.</p>';

  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const hoyMs=hoy.getTime();
  const minRaw=Math.min(...lista.map(p=>prjDate(p.inicio).getTime()),hoyMs);
  const maxRaw=Math.max(...lista.map(p=>prjDate(p.fin).getTime()),hoyMs);
  const minD=new Date(minRaw); minD.setDate(1);
  const maxD=new Date(maxRaw); maxD.setMonth(maxD.getMonth()+1,1);
  const minMs=minD.getTime(), maxMs=Math.max(minMs+864e5*30,maxD.getTime()), span=maxMs-minMs;
  const hoyPct=((hoyMs-minMs)/span)*100;
  const ticks=homeTimelineTicks(minMs,maxMs);

  const hoyFmt=`${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`;
  const gridHtml=`<div class="tl-gridlines" aria-hidden="true">${ticks.map(t=>`<span class="tl-gline" style="left:${t.pct.toFixed(2)}%"></span>`).join('')}${hoyPct>=0&&hoyPct<=100?`<span class="tl-today" style="left:${hoyPct.toFixed(2)}%"></span>`:''}</div>`;

  return `<div class="tl-wrap">
    <div class="tl-axis-row">
      <div class="tl-col-lbl">Proyecto</div>
      <div class="tl-axis">
        ${ticks.map(t=>`<span class="tl-tick" style="left:${t.pct.toFixed(2)}%">${esc(t.lbl)}</span>`).join('')}
        ${hoyPct>=0&&hoyPct<=100?`<span class="tl-today-tag" style="left:${hoyPct.toFixed(2)}%">Hoy · ${hoyFmt}</span>`:''}
      </div>
      <div class="tl-col-rem">Restante</div>
    </div>
    <div class="tl-rows">${lista.map(p=>{
      const [,stCls]=PRJ_ESTADOS[p.c.estado];
      const iniMs=prjDate(p.inicio).getTime(), finMs=prjDate(p.fin).getTime();
      const leftPct=((iniMs-minMs)/span)*100;
      const widthPct=Math.max(1.2,((finMs-iniMs)/span)*100);
      const pct=Math.round(p.c.pct);
      const restaTxt=p.c.estado==='finalizado'?'Cerrado':p.c.estado==='porIniciar'?`Inicia en ${prjDias(-p.c.trans)}`:p.c.resta===0?'Cierra hoy':`Faltan ${prjDias(p.c.resta)}`;
      const tip=`${p.nombre} (${p.codigo}) · ${p.tipo}\n${prjFmt(p.inicio)} al ${prjFmt(p.fin)}\nAvance: ${pct}% · ${restaTxt}`;
      const nomHtml=p.prima
        ?`<a class="tl-name" href="${esc(p.prima)}" target="_blank" rel="noopener noreferrer" title="Abrir en PRIMA">${esc(p.nombre)}</a>`
        :`<span class="tl-name">${esc(p.nombre)}</span>`;
      return `<div class="tl-row${p.c.estado==='finalizado'?' is-done':''}">
        <div class="tl-info">
          ${nomHtml}
          <span class="tl-meta">${esc(p.codigo)} · ${esc(p.tipo)} · ${prjFmt(p.inicio)} – ${prjFmt(p.fin)}</span>
        </div>
        <div class="tl-track" title="${esc(tip)}">
          ${gridHtml}
          <div class="tl-bar ${stCls}" style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%">
            <span class="tl-elapsed" style="width:${p.c.pct.toFixed(1)}%"></span>
          </div>
        </div>
        <div class="tl-rem ${stCls}">
          <strong>${esc(restaTxt)}</strong>
          <span>${pct}% transcurrido</span>
        </div>
      </div>`;
    }).join('')}</div>
    <div class="tl-legend">
      <span><i class="tl-dot ok"></i>Vigente (transcurrido)</span>
      <span><i class="tl-dot warn"></i>Por finalizar ≤90d</span>
      <span><i class="tl-dot rem"></i>Plazo restante</span>
      <span><i class="tl-dot today"></i>Línea de hoy</span>
      <a class="tl-all" href="#/proyectos">Ver detalle en Proyectos →</a>
    </div>
  </div>`;
}

function homeBuscar(raw){
  const q=prjNorm(raw.trim());
  if(!q) return '';
  const res=[];
  (typeof HERRAMIENTAS!=='undefined'?HERRAMIENTAS:[]).forEach(h=>{
    if(prjNorm(`${h.nombre} ${h.resumen}`).includes(q))
      res.push({cat:'Herramienta',titulo:h.nombre,sub:h.resumen,href:`#/${h.id}`,ext:false});
  });
  (typeof PROYECTOS!=='undefined'?PROYECTOS:[]).forEach(p=>{
    if(prjNorm(`${p.nombre} ${p.codigo} ${p.tipo}`).includes(q))
      res.push({cat:'Proyecto',titulo:`${p.nombre} (${p.codigo})`,sub:`${p.tipo} · Cierre ${prjFmt(p.fin)}`,href:p.prima||'#/proyectos',ext:Boolean(p.prima)});
  });
  (typeof TABLEROS!=='undefined'?TABLEROS:[]).forEach(t=>{
    if(prjNorm(`${t.nombre} ${t.proyecto} ${t.socio}`).includes(q))
      res.push({cat:'Tablero',titulo:t.nombre,sub:`${t.proyecto} · ${t.frecuencia}`,href:t.url,ext:true});
  });
  (typeof FORMULARIOS!=='undefined'?FORMULARIOS:[]).forEach(f=>{
    if(prjNorm(`${f.formulario} ${f.proyecto} ${f.area}`).includes(q))
      res.push({cat:'Formulario',titulo:f.formulario,sub:`${f.proyecto||'General'} · ${f.area||'Kobo'}`,href:f.url,ext:true});
  });
  if(!res.length) return `<div class="hs-empty">Sin coincidencias para «${esc(raw.trim())}».</div>`;
  return res.slice(0,9).map(r=>`<a class="hs-row" href="${esc(r.href)}"${r.ext?' target="_blank" rel="noopener noreferrer"':''}>
    <span class="hs-cat">${esc(r.cat)}</span>
    <span class="hs-txt"><strong>${esc(r.titulo)}</strong><small>${esc(r.sub)}</small></span>
    <span class="hs-go">${r.ext?'↗':'→'}</span>
  </a>`).join('');
}

function viewPortada(){
  const d=homeDatos();
  const ppto=`USD ${prjMoneyShort(d.usd)} · EUR ${prjMoneyShort(d.eur)}`;
  return `<div class="portal portal-v2">
    <section class="p-hero-v2">
      <div class="p-hero-copy">
        <h1>Herramientas de Monitoreo y Evaluación</h1>
        <p>Resumen operativo de proyectos, tableros de seguimiento, formularios de captura y accesos institucionales.</p>
      </div>
      <div class="hs-wrap">
        <label class="hs-box" aria-label="Buscador universal">
          ${prjIco('buscar',18)}
          <input id="homeSearch" type="search" placeholder="Buscar proyecto, código, tablero Power BI o formulario Kobo…" autocomplete="off">
          <button type="button" class="hs-clr" id="homeSearchClr" hidden aria-label="Limpiar búsqueda">×</button>
        </label>
        <div class="hs-drop" id="homeSearchDrop" hidden></div>
      </div>
    </section>

    <section class="p-kpis" aria-label="Indicadores generales">
      <a class="pk-card" href="#/proyectos">
        <span class="pk-lbl">Proyectos activos</span>
        <strong class="pk-val">${d.activos.length}</strong>
        <span class="pk-sub">${d.porFin.length} por finalizar en ≤90 días</span>
      </a>
      <a class="pk-card" href="#/proyectos">
        <span class="pk-lbl">Presupuesto vigente</span>
        <strong class="pk-val pk-val-sm">${esc(ppto)}</strong>
        <span class="pk-sub">Sobre ${d.activos.length} proyectos activos</span>
      </a>
      <a class="pk-card" href="#/tableros">
        <span class="pk-lbl">Tableros Power BI</span>
        <strong class="pk-val">${d.tabsAct.length}</strong>
        <span class="pk-sub">${d.tabsAuto.length} con actualización automática</span>
      </a>
      <a class="pk-card" href="#/formularios">
        <span class="pk-lbl">Formularios Kobo</span>
        <strong class="pk-val">${d.forms.length}</strong>
        <span class="pk-sub">${d.formsReg.length} regulares · ${d.formsEmer.length} emergencia</span>
      </a>
    </section>

    <section class="tl-panel" aria-label="Línea temporal de proyectos">
      <div class="tl-head">
        <div>
          <h2 class="p-title" style="margin:0">Línea temporal de proyectos</h2>
          <p class="muted" style="margin:2px 0 0;font-size:13.5px">Visualización del plazo transcurrido y el tiempo restante hasta el cierre de cada proyecto.</p>
        </div>
        <div class="tl-tabs" role="tablist" aria-label="Filtrar línea temporal">
          <button type="button" class="tl-tab${HOME_ST.tl==='activos'?' on':''}" data-tl="activos" role="tab" aria-selected="${HOME_ST.tl==='activos'}">Activos</button>
          <button type="button" class="tl-tab${HOME_ST.tl==='Emergencia'?' on':''}" data-tl="Emergencia" role="tab" aria-selected="${HOME_ST.tl==='Emergencia'}">Emergencia</button>
          <button type="button" class="tl-tab${HOME_ST.tl==='Regular'?' on':''}" data-tl="Regular" role="tab" aria-selected="${HOME_ST.tl==='Regular'}">Regular</button>
          <button type="button" class="tl-tab${HOME_ST.tl==='todos'?' on':''}" data-tl="todos" role="tab" aria-selected="${HOME_ST.tl==='todos'}">Todos</button>
        </div>
      </div>
      <div id="homeTimelineBody">${homeRenderTimeline()}</div>
    </section>

    <section class="pe-panel" aria-label="Enlaces institucionales importantes">
      <div class="pe-head">
        <h2 class="p-title" style="margin:0">Enlaces importantes</h2>
        <span class="muted" style="font-size:13px">Plataformas y marcos de referencia</span>
      </div>
      <div class="pe-grid">${PORTADA_ENLACES.map(e=>`<a class="pe-card" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" style="--pe-c:${e.color}">
        <span class="pe-logo">${e.logo}</span>
        <span class="pe-info"><strong>${esc(e.nombre)}</strong><small>${esc(e.sub)}</small></span>
        <span class="pe-ext" aria-hidden="true">↗</span>
      </a>`).join('')}</div>
    </section>
  </div>`;
}

function bindPortada(){
  const body=$('#homeTimelineBody');
  document.querySelectorAll('[data-tl]').forEach(t=>t.onclick=()=>{
    const tl=t.dataset.tl;
    if(HOME_ST.tl===tl) return;
    HOME_ST.tl=tl;
    document.querySelectorAll('[data-tl]').forEach(x=>{
      const on=x.dataset.tl===tl;
      x.classList.toggle('on',on);
      x.setAttribute('aria-selected',on?'true':'false');
    });
    if(body) body.innerHTML=homeRenderTimeline();
  });

  const inp=$('#homeSearch'), drop=$('#homeSearchDrop'), clr=$('#homeSearchClr');
  if(inp&&drop){
    const update=()=>{
      const v=inp.value;
      if(clr) clr.hidden=!v;
      if(!v.trim()){ drop.hidden=true; drop.innerHTML=''; return; }
      drop.innerHTML=homeBuscar(v);
      drop.hidden=false;
    };
    inp.addEventListener('input',update);
    inp.addEventListener('focus',()=>{ if(inp.value.trim()) drop.hidden=false; });
    if(clr) clr.onclick=()=>{ inp.value=''; update(); inp.focus(); };
    if(!window._homeDocBound){
      window._homeDocBound=true;
      document.addEventListener('click',e=>{
        const d=$('#homeSearchDrop');
        if(d&&!e.target.closest('.hs-wrap')) d.hidden=true;
      });
    }
  }
}

navInit();
