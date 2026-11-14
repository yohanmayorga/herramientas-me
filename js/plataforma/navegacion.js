/* Herramientas M&E · Navegación: menú lateral, rutas (#/...) y portada */
const NAV_KEY='herramientas-me-menu';
const NAV={ ruta:'inicio', manual:null };

function navSide(){
  const item=(id,nombre,ic,extra='')=>`<a class="side-i${NAV.ruta===id?' on':''}" href="#/${id}" data-tip="${esc(nombre)}"${NAV.ruta===id?' aria-current="page"':''}>${icono(ic)}<span class="side-t">${esc(nombre)}</span>${extra}</a>`;
  return `<div class="side-sec">${item('inicio','Inicio','inicio')}</div>
    ${[...new Set(HERRAMIENTAS.map(h=>h.grupo))].map(g=>`<div class="side-sec"><div class="side-h">${esc(g)}</div>
      ${HERRAMIENTAS.filter(h=>h.grupo===g).map(h=>item(h.id,h.nombre,h.icono,h.estado==='disponible'?'':'<span class="side-b">Pronto</span>')).join('')}</div>`).join('')}
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
    </article>`).join('')}</div>
    <div class="p-row">
      <section class="p-box"><h2 class="p-title">Novedades</h2>
        <ol class="p-news">${NOVEDADES.map(([f,t])=>`<li><span>${esc(f)}</span>${esc(t)}</li>`).join('')}</ol></section>
      <section class="p-box"><h2 class="p-title">Cómo funcionan</h2>
        <ul class="p-facts">
          <li>${icono('candado')}<div><b>Tus datos no salen de tu equipo</b>Los archivos se procesan en el navegador; no se envían a ningún servidor.</div></li>
          <li>${icono('rayo')}<div><b>Sin instalación</b>Funcionan desde el navegador, en computadora, tableta o teléfono.</div></li>
          <li>${icono('archivo')}<div><b>Resultados listos para usar</b>Excel, Power BI, PDF y tableros con el estilo de la OIM.</div></li>
        </ul></section>
    </div></div>`;
}

function viewProximamente(h){
  return `<div class="portal"><a class="p-back" href="#/inicio">${icono('contraer',16)} Inicio</a>
    <section class="p-hero p-soon"><span class="p-ic">${icono(h.icono,28)}</span><div><div class="p-soonh"><h1>${esc(h.nombre)}</h1>${estadoChip(h.estado)}</div><p>${esc(h.resumen)}</p></div></section>
    <section class="p-box"><h2 class="p-title">Lo que incluirá</h2><ul class="p-list">${h.puntos.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <p class="muted" style="margin:14px 0 0">Esta herramienta está en preparación. Para sugerencias, escribe a <a href="mailto:ymayorga@iom.int">ymayorga@iom.int</a>.</p></section></div>`;
}

function navCollapsed(){ return NAV.manual!=null?NAV.manual:NAV.ruta!=='inicio'; }

function navApply(){
  const side=$('#side'), home=$('#home'), wrap=document.querySelector('.wrap'), h=HERRAMIENTAS.find(x=>x.id===NAV.ruta);
  document.body.classList.toggle('side-mini',navCollapsed());
  side.innerHTML=navSide();
  $('#sideTog').onclick=()=>{ NAV.manual=!navCollapsed(); try{ localStorage.setItem(NAV_KEY,NAV.manual?'1':'0'); }catch(e){} navApply(); };
  side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navDrawer(false)));
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
  if(ruta!==NAV.ruta){ NAV.ruta=ruta; let m=null; try{ m=localStorage.getItem(NAV_KEY); }catch(e){} NAV.manual=m==null?null:m==='1'; if(ruta==='inicio') NAV.manual=null; }
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
