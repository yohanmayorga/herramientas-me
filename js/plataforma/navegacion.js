/* Herramientas M&E · Navegación: menú lateral, rutas (#/...) y portada */
const NAV_KEY='herramientas-me-menu';
const NAV={ ruta:'inicio', manual:false, gruposCerrados:new Set() };

function navSide(){
  const item=(id,nombre,ic,extra='')=>`<a class="side-i${NAV.ruta===id?' on':''}" href="#/${id}" data-tip="${esc(nombre)}"${NAV.ruta===id?' aria-current="page"':''}>${icono(ic)}<span class="side-t">${esc(nombre)}</span>${extra}</a>`;
  return `<div class="side-sec">${item('inicio','Inicio','inicio')}</div>
    ${[...new Set(HERRAMIENTAS.map(h=>h.grupo))].map(g=>{
      const cerrado=NAV.gruposCerrados.has(g)&&!navCollapsed();
      return `<div class="side-sec${cerrado?' closed':''}">
        <button class="side-h side-gh" type="button" data-grupo="${esc(g)}" aria-expanded="${!cerrado}" title="${cerrado?'Expandir':'Contraer'} ${esc(g)}"><span>${esc(g)}</span>${icono('abajo',14)}</button>
        <div class="side-items"${cerrado?' hidden':''}>${HERRAMIENTAS.filter(h=>h.grupo===g).map(h=>item(h.id,h.nombre,h.icono,h.estado==='disponible'?'':'<span class="side-b">Pronto</span>')).join('')}</div>
      </div>`;
    }).join('')}
    <button class="side-i side-tog" type="button" id="sideTog" aria-label="${navCollapsed()?'Expandir menú':'Contraer menú'}" title="${navCollapsed()?'Expandir menú':'Contraer menú'}">${icono(navCollapsed()?'expandir':'contraer')}<span class="side-t">Contraer menú</span></button>`;
}

function estadoChip(e){ return e==='disponible'?'<span class="chip-st ok">Disponible</span>':'<span class="chip-st dev">En desarrollo</span>'; }

function viewPortada(){
  return `<div class="portal">
    <section class="p-hero">
      <h1>Herramientas de Monitoreo y Evaluación</h1>
      <p>Un solo lugar para las herramientas del área de M&amp;E de la OIM Venezuela: depuración de datos, tableros y conexiones a las fuentes de información.</p>
    </section>
    <h2 class="p-title">Secciones y herramientas</h2>
    <div class="p-grid">${HERRAMIENTAS.map(h=>`<article class="p-card${h.estado==='disponible'?'':' dev'}">
      <div class="p-ch"><span class="p-ic">${icono(h.icono,24)}</span>${estadoChip(h.estado)}</div>
      <h3>${esc(h.nombre)}</h3><p class="muted">${esc(h.resumen)}</p>
      <ul>${h.puntos.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      <div class="p-cf">${h.estado==='disponible'
        ?`<a class="btn primary" href="#/${h.id}">Abrir ${icono('flecha',16)}</a>${(h.accesos||[]).length?`<div class="p-acc">${h.accesos.map(([l,u])=>`<a href="${u}">${esc(l)}</a>`).join('')}</div>`:''}`
        :`<a class="btn" href="#/${h.id}">Ver detalles</a>`}</div>
    </article>`).join('')}</div></div>`;
}

function viewSideNews(){
  return `<div class="side-h">Novedades</div>
    <ol class="p-news">${NOVEDADES.map(([f,t])=>`<li><span>${esc(f)}</span>${esc(t)}</li>`).join('')}</ol>`;
}

function viewProximamente(h){
  return `<div class="portal"><a class="p-back" href="#/inicio">${icono('contraer',16)} Inicio</a>
    <section class="p-hero p-soon"><span class="p-ic">${icono(h.icono,28)}</span><div><div class="p-soonh"><h1>${esc(h.nombre)}</h1>${estadoChip(h.estado)}</div><p>${esc(h.resumen)}</p></div></section>
    <section class="p-box"><h2 class="p-title">Lo que incluirá</h2><ul class="p-list">${h.puntos.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <p class="muted" style="margin:14px 0 0">Esta herramienta está en preparación. Para sugerencias, escribe a <a href="mailto:ymayorga@iom.int">ymayorga@iom.int</a>.</p></section></div>`;
}

function navCollapsed(){ return Boolean(NAV.manual); }

function navApply(){
  const side=$('#side'), sideNews=$('#sideNews'), home=$('#home'), wrap=document.querySelector('.wrap'), h=HERRAMIENTAS.find(x=>x.id===NAV.ruta);
  const enInicio=!h;
  document.body.classList.toggle('side-mini',navCollapsed());
  document.body.classList.toggle('en-inicio',enInicio);
  side.innerHTML=navSide();
  $('#sideTog').onclick=()=>{ NAV.manual=!navCollapsed(); navApply(); };
  side.querySelectorAll('.side-gh').forEach(b=>b.onclick=()=>{
    const g=b.dataset.grupo;
    if(NAV.gruposCerrados.has(g)) NAV.gruposCerrados.delete(g); else NAV.gruposCerrados.add(g);
    navApply();
  });
  side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navDrawer(false)));
  if(sideNews){
    sideNews.hidden=!enInicio;
    if(enInicio) sideNews.innerHTML=viewSideNews();
  }
  const enDep=NAV.ruta==='depurador-ims';
  $('#btnGuide').hidden=!enDep;
  wrap.hidden=!enDep; home.hidden=enDep;
  document.title=h?`${h.nombre} · Herramientas M&E`:'Herramientas M&E';
  if(enDep){ render(); return; }
  home.innerHTML=!h?viewPortada():h.vista?h.vista():viewProximamente(h);
  if(h&&h.enlazar) h.enlazar();
  window.scrollTo(0,0);
}

function navRoute(){
  const parts=(location.hash.replace(/^#\/?/,'')||'inicio').split('/');
  let ruta=parts[0]; if(ruta!=='inicio'&&!HERRAMIENTAS.some(h=>h.id===ruta)) ruta='inicio';
  if(ruta==='depurador-ims'&&parts[1]){ // accesos directos desde la portada
    if(parts[1]==='guia') S.guide=true;
    else { S.guide=false; S.dash=false; if(S.step===1) S.loadMode=parts[1]==='multiple'?'multi':'single'; }
    history.replaceState(null,'','#/depurador-ims');
  }
  NAV.ruta=ruta;
  navApply();
}

function navDrawer(open){ document.body.classList.toggle('side-open',open); $('#btnMenu').setAttribute('aria-expanded',open?'true':'false'); }

function navInit(){
  $('#btnMenu').innerHTML=icono('menu');
  $('#btnMenu').onclick=()=>navDrawer(!document.body.classList.contains('side-open'));
  $('#sideScrim').onclick=()=>navDrawer(false);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&document.body.classList.contains('side-open')) navDrawer(false); });
  const top=document.querySelector('header.top'), setH=()=>document.documentElement.style.setProperty('--toph',top.offsetHeight+'px');
  setH(); if(window.ResizeObserver) new ResizeObserver(setH).observe(top);
  window.addEventListener('hashchange',navRoute);
  navRoute();
}
