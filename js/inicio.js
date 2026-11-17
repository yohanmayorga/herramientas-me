/* Herramientas M&E · Novedades, portada interactiva y arranque de la aplicación.
   Agrega cada mejora nueva al inicio de NOVEDADES (la más reciente primero). */
const NOVEDADES=[
  ['Noviembre 2026','Reportes · Matriz de monitoreo: corrección de error al ordenar filas con campos geográficos vacíos o nulos (localeCompare) en Kobo y demás fuentes.'],
  ['Noviembre 2026','Reportes · Matriz de monitoreo: corrección del flujo de avance en Kobo (visibilidad de errores, desplazamiento automático a la confirmación de columnas y cálculo seguro de semilla en imputación de edad/sexo).'],
  ['Noviembre 2026','Reportes · Matriz de monitoreo: optimización de lectura para archivos pesados de Kobo (lectura rápida de encabezados y extracción selectiva de columnas útiles sin metadatos ni estilos).'],
  ['Noviembre 2026','Reportes · Matriz de monitoreo: carga arrastrable del XLSForm de Kobo antes de avanzar al mapeo de columnas, y campos de Proyecto y Sector por defecto en blanco para escritura libre.'],
  ['Noviembre 2026','Reportes · Matriz de monitoreo: soporte para cargar y recordar el XLSForm de Kobo (excluyendo automáticamente cálculos y metadatos), campo _id habilitado para Código de familia/caso, Proyecto y Sector por defecto de escritura libre y eliminación del resumen para correo/reporte.'],
  ['Noviembre 2026','Reportes · Matriz de monitoreo: soporte inteligente para Excel de KoboToolbox con vinculación automática de envíos e individuos (_id ↔ _submission__id), confirmación de columnas con Opción manual (valor fijo), exclusión de metadatos, inferencia geográfica por equipo/punto y ajuste de edad y sexo faltantes con descarga de ajustes.'],
  ['Noviembre 2026','Inicio: diseño minimalista sin bordes, nuevo orden de secciones y encabezado actualizado.'],
  ['Noviembre 2026','Inicio: nueva portada interactiva con buscador universal, KPIs en vivo, tablero interactivo de Proyectos, Tableros y Formularios, radar de próximos cierres y sección de enlaces institucionales (Kobo, ODK XLSForm, PRIMA, IOM SRF e IMS).'],
  ['Noviembre 2026','Reportes · Matriz de monitoreo: imputación jerárquica de Estado, Municipio, Parroquia y Comunidad según mismo socio y fecha más cercana (sombreado en amarillo pastel al rellenar y rojo pastel si queda vacío).'],
  ['Noviembre 2026','Depurador IMS: nueva exportación «Matriz de monitoreo» para entregas de kits NFI, con fecha en la primera columna, selección de Proyecto (ECHO ALERT, DHR Emergencia u Otro) y Tipo (NFI o WASH) por kit, omisión de socios marcados como errados, desagregación geográfica, separación de recurrentes (SI/NO) y cruce por edad, sexo y condiciones específicas.'],
  ['Noviembre 2026','Depurador IMS: optimización de la pestaña «Atenciones» del SITREP (agregación diaria y bloques contiguos sin COUNTIFS acumulativos) para que el Excel abra de forma instantánea con más de 100 000 registros.'],
  ['Noviembre 2026','Depurador IMS: incorporación en el Excel del SITREP de la pestaña consolidada «Kits» (NFI y WASH) y de un cuadro de kits entregados en la pestaña principal con filtros dinámicos por tipo de kit y rango de fechas.'],
  ['Noviembre 2026','Repositorio de tableros: incorporación del tablero DHR - General, nueva columna de tipo de actualización (Automática o Manual) y ajuste de la columna de frecuencia manteniendo las acciones de abrir y copiar.'],
  ['Noviembre 2026','Repositorio de tableros: eliminación de las tarjetas de resumen en la parte superior para mostrar directamente el listado o las tarjetas de tableros.'],
  ['Noviembre 2026','Repositorio de formularios: incorporación de los formularios regulares del proyecto DHR para Salud Mental (SMAPS), PSS (SMAPS) y Orientación legal (Protección).'],
  ['Noviembre 2026','Repositorio de formularios: nueva sección en el bloque de Herramientas con el catálogo de formularios de KoboToolbox clasificados por proyecto, área temática y tipo (regular o emergencia), con filtros laterales, vista limpia sin tarjetas de resumen superior ni columna de enlace crudo, y botones para abrir o copiar cada formulario.'],
  ['Noviembre 2026','Depurador IMS: rediseño de la página de inicio al estilo del resto de la plataforma, con acceso directo al IMS (ims.iom.int) junto al botón «Guía de uso», tarjetas de modo a ancho completo y listado de formularios configurados.'],
  ['Noviembre 2026','Repositorio de tableros: incorporación de los tableros generales de Seguimiento de la emergencia (DHR), Gran Misión Vuelta a la Patria, Retorno Voluntario Asistido y Reintegración (AVR), Encuesta de satisfacción a beneficiarios y JAPÓN - General.'],
  ['Noviembre 2026','Repositorio de tableros: eliminación de la columna de descripción en la tabla y de los botones de vista previa.'],
  ['Noviembre 2026','Proyectos y Repositorio de tableros: filtros ubicados en el panel lateral derecho en versión web (al estilo de Novedades), panel deslizable oculto por defecto bajo el botón «Filtros» en pantallas pequeñas y teléfonos, y menú lateral izquierdo oculto por defecto en teléfonos en orientación horizontal.'],
  ['Noviembre 2026','Repositorio de tableros: nueva sección con el catálogo de tableros de Power BI del proyecto ECHO (general y por socio implementador), con filtros por proyecto, tipo, alcance, estado y frecuencia de actualización, vista en tarjetas o lista, y vista previa integrada.'],
  ['Noviembre 2026','Proyectos: cambio automático de vista Lista a Tarjetas cuando el ancho de pantalla requeriría desplazamiento lateral (manteniendo siempre el selector manual de vista), columna de Días restantes junto a Plazo transcurrido, estado unificado «Vigente» y sombreado gris en proyectos finalizados (excluidos de las tarjetas de resumen activo).'],
  ['Noviembre 2026','Nueva sección Proyectos: plazo, presupuesto, avance y enlaces de cada proyecto, con filtros.'],
  ['Noviembre 2026','Nueva portada de Herramientas M&E con menú lateral para reunir todas las herramientas del área.'],
  ['Noviembre 2026','Depurador IMS: limpieza avanzada del Registro de Familias, con duplicados entre familias, nivel de severidad y filas alineadas con el archivo del IMS.'],
  ['Noviembre 2026','Depurador IMS: mapa de Venezuela en los informes y el tablero, y exportación del SITREP.']
];

const HOME_ST={ tab:'proyectos', filtro:'' };

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

function homeBarRow(label,count,total,key,cls=''){
  const pct=total?Math.round(count/total*100):0;
  const on=HOME_ST.filtro===key;
  return `<button type="button" class="hd-bar${on?' on':''}" data-hfilter="${esc(key)}" aria-pressed="${on}">
    <span class="hd-blabel">${esc(label)}</span>
    <span class="hd-track"><span class="hd-fill ${cls}" style="width:${pct}%"></span></span>
    <span class="hd-bval">${count}</span>
  </button>`;
}

function homeGroupCounts(arr,fn){
  const m=new Map();
  arr.forEach(x=>{ const k=fn(x)||'General'; m.set(k,(m.get(k)||0)+1); });
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}

function homeRenderDash(){
  const d=homeDatos();
  const f=HOME_ST.filtro;
  if(HOME_ST.tab==='proyectos'){
    const tot=d.proys.length;
    const est=[
      ['Vigentes',d.proys.filter(p=>p.c.estado==='vigente').length,'est:vigente','ok'],
      ['Por finalizar (≤90d)',d.porFin.length,'est:porFinalizar','warn'],
      ['Finalizados',d.proys.filter(p=>p.c.estado==='finalizado').length,'est:finalizado','off']
    ];
    const tipos=[
      ['Emergencia',d.proys.filter(p=>p.tipo==='Emergencia').length,'tipo:Emergencia','warn'],
      ['Regular',d.proys.filter(p=>p.tipo==='Regular').length,'tipo:Regular','']
    ];
    let lista=d.proys.slice();
    if(f.startsWith('est:')) lista=lista.filter(p=>p.c.estado===f.slice(4));
    else if(f.startsWith('tipo:')) lista=lista.filter(p=>p.tipo===f.slice(5));
    lista.sort((a,b)=>(a.c.estado==='finalizado')-(b.c.estado==='finalizado')||a.fin.localeCompare(b.fin));
    return `<div class="hd-split">
      <div class="hd-charts">
        <div class="hd-cgroup">
          <div class="hd-ctitle">Por estado <span class="muted">(clic para filtrar)</span></div>
          ${est.map(([l,c,k,cl])=>homeBarRow(l,c,tot,k,cl)).join('')}
        </div>
        <div class="hd-cgroup">
          <div class="hd-ctitle">Por modalidad</div>
          ${tipos.map(([l,c,k,cl])=>homeBarRow(l,c,tot,k,cl)).join('')}
        </div>
      </div>
      <div class="hd-listwrap">
        <div class="hd-lhead">
          <span>${lista.length} ${lista.length===1?'proyecto':'proyectos'}${f?' (filtrado)':''}</span>
          ${f?'<button type="button" class="hd-clear" id="hdClear">Limpiar filtro</button>':'<a href="#/proyectos">Ver todos →</a>'}
        </div>
        <div class="hd-list">${lista.slice(0,6).map(p=>{
          const [stTxt,stCls]=PRJ_ESTADOS[p.c.estado];
          const resta=p.c.estado==='finalizado'?'Cerrado':p.c.resta===0?'Hoy':`${p.c.resta}d`;
          return `<div class="hd-item">
            <div class="hd-imain">
              <div class="hd-itop"><strong>${esc(p.nombre)}</strong><span class="hd-code">${esc(p.codigo)}</span><span class="hd-pill ${stCls}">${stTxt}</span></div>
              <div class="hd-iprog"><span class="hd-ptrack"><span class="hd-pfill ${stCls}" style="width:${p.c.pct.toFixed(1)}%"></span></span><span class="hd-pmeta">${Math.round(p.c.pct)}% · ${resta}</span></div>
            </div>
            <div class="hd-iacts">${p.prima?`<a class="hd-act" href="${esc(p.prima)}" target="_blank" rel="noopener noreferrer" title="Abrir en PRIMA">PRIMA</a>`:''}</div>
          </div>`;
        }).join('')}</div>
      </div>
    </div>`;
  }

  if(HOME_ST.tab==='tableros'){
    const tot=d.tabs.length;
    const porProy=homeGroupCounts(d.tabs,t=>t.proyecto).slice(0,5);
    const porAct=[
      ['Actualización automática',d.tabs.filter(t=>t.actualizacion==='Automática').length,'act:Automática','ok'],
      ['Actualización manual',d.tabs.filter(t=>t.actualizacion==='Manual').length,'act:Manual','warn']
    ];
    let lista=d.tabs.slice();
    if(f.startsWith('proy:')) lista=lista.filter(t=>(t.proyecto||'General')===f.slice(5));
    else if(f.startsWith('act:')) lista=lista.filter(t=>t.actualizacion===f.slice(4));
    return `<div class="hd-split">
      <div class="hd-charts">
        <div class="hd-cgroup">
          <div class="hd-ctitle">Por proyecto <span class="muted">(clic para filtrar)</span></div>
          ${porProy.map(([l,c])=>homeBarRow(l,c,tot,`proy:${l}`)).join('')}
        </div>
        <div class="hd-cgroup">
          <div class="hd-ctitle">Por tipo de actualización</div>
          ${porAct.map(([l,c,k,cl])=>homeBarRow(l,c,tot,k,cl)).join('')}
        </div>
      </div>
      <div class="hd-listwrap">
        <div class="hd-lhead">
          <span>${lista.length} ${lista.length===1?'tablero':'tableros'}${f?' (filtrado)':''}</span>
          ${f?'<button type="button" class="hd-clear" id="hdClear">Limpiar filtro</button>':'<a href="#/tableros">Ver catálogo →</a>'}
        </div>
        <div class="hd-list">${lista.slice(0,6).map(t=>`<div class="hd-item">
          <div class="hd-imain">
            <div class="hd-itop"><strong>${esc(t.nombre)}</strong><span class="hd-pill ${t.estado==='Activo'?'ok':'off'}">${esc(t.estado)}</span></div>
            <div class="hd-isub">${esc(t.proyecto)} · ${esc(t.alcance)} · ${esc(t.frecuencia)}</div>
          </div>
          <div class="hd-iacts"><a class="hd-act" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a></div>
        </div>`).join('')}</div>
      </div>
    </div>`;
  }

  const tot=d.forms.length;
  const porArea=homeGroupCounts(d.forms,x=>x.area||'General').slice(0,5);
  const porTipo=[
    ['Regular',d.formsReg.length,'ftipo:Regular',''],
    ['Emergencia',d.formsEmer.length,'ftipo:Emergencia','warn']
  ];
  let lista=d.forms.slice();
  if(f.startsWith('area:')) lista=lista.filter(x=>(x.area||'General')===f.slice(5));
  else if(f.startsWith('ftipo:')) lista=lista.filter(x=>x.tipo===f.slice(6));
  return `<div class="hd-split">
    <div class="hd-charts">
      <div class="hd-cgroup">
        <div class="hd-ctitle">Por área temática <span class="muted">(clic para filtrar)</span></div>
        ${porArea.map(([l,c])=>homeBarRow(l,c,tot,`area:${l}`)).join('')}
      </div>
      <div class="hd-cgroup">
        <div class="hd-ctitle">Por modalidad</div>
        ${porTipo.map(([l,c,k,cl])=>homeBarRow(l,c,tot,k,cl)).join('')}
      </div>
    </div>
    <div class="hd-listwrap">
      <div class="hd-lhead">
        <span>${lista.length} ${lista.length===1?'formulario':'formularios'}${f?' (filtrado)':''}</span>
        ${f?'<button type="button" class="hd-clear" id="hdClear">Limpiar filtro</button>':'<a href="#/formularios">Ver todos →</a>'}
      </div>
      <div class="hd-list">${lista.slice(0,6).map(x=>`<div class="hd-item">
        <div class="hd-imain">
          <div class="hd-itop"><strong>${esc(x.formulario)}</strong><span class="hd-pill ${x.tipo==='Emergencia'?'warn':'info'}">${esc(x.tipo)}</span></div>
          <div class="hd-isub">${esc(x.proyecto||'General')} · ${esc(x.area||'Sin área')}</div>
        </div>
        <div class="hd-iacts"><a class="hd-act" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a></div>
      </div>`).join('')}</div>
    </div>
  </div>`;
}

function homeRenderRadar(){
  const d=homeDatos();
  const prox=d.activos.slice().sort((a,b)=>a.fin.localeCompare(b.fin)).slice(0,4);
  if(!prox.length) return '<p class="muted" style="margin:0">No hay proyectos activos registrados.</p>';
  return `<div class="hr-grid">${prox.map(p=>{
    const [stTxt,stCls]=PRJ_ESTADOS[p.c.estado];
    const faltan=p.c.resta===0?'Cierra hoy':`Faltan ${prjDias(p.c.resta)}`;
    return `<article class="hr-card">
      <div class="hr-top">
        <span class="hr-code">${esc(p.codigo)} · ${esc(p.tipo)}</span>
        <span class="hd-pill ${stCls}">${faltan}</span>
      </div>
      <h3>${esc(p.nombre)}</h3>
      <div class="hr-bar"><span style="width:${p.c.pct.toFixed(1)}%" class="${stCls}"></span></div>
      <div class="hr-meta">
        <span>Cierre: <strong>${prjFmt(p.fin)}</strong></span>
        <span>${Math.round(p.c.pct)}% transcurrido</span>
      </div>
    </article>`;
  }).join('')}</div>`;
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

    <section class="hr-panel" aria-label="Próximos cierres de proyectos">
      <div class="hr-head">
        <div>
          <h2 class="p-title" style="margin:0">Próximos cierres de proyectos</h2>
          <p class="muted" style="margin:2px 0 0;font-size:13.5px">Seguimiento de plazos activos ordenados por fecha de finalización más cercana.</p>
        </div>
        <a class="hr-more" href="#/proyectos">Ver todos en Proyectos →</a>
      </div>
      ${homeRenderRadar()}
    </section>

    <section class="hd-panel" aria-label="Tablero interactivo">
      <div class="hd-head">
        <div>
          <h2 class="p-title" style="margin:0">Tablero interactivo</h2>
          <p class="muted" style="margin:2px 0 0;font-size:13.5px">Explora la distribución actual y filtra haciendo clic en cualquier barra.</p>
        </div>
        <div class="hd-tabs" role="tablist" aria-label="Vista del tablero">
          <button type="button" class="hd-tab${HOME_ST.tab==='proyectos'?' on':''}" data-htab="proyectos" role="tab" aria-selected="${HOME_ST.tab==='proyectos'}">Proyectos</button>
          <button type="button" class="hd-tab${HOME_ST.tab==='tableros'?' on':''}" data-htab="tableros" role="tab" aria-selected="${HOME_ST.tab==='tableros'}">Tableros</button>
          <button type="button" class="hd-tab${HOME_ST.tab==='formularios'?' on':''}" data-htab="formularios" role="tab" aria-selected="${HOME_ST.tab==='formularios'}">Formularios</button>
        </div>
      </div>
      <div id="homeDashBody">${homeRenderDash()}</div>
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
  const body=$('#homeDashBody');
  const bindDash=()=>{
    if(!body) return;
    body.querySelectorAll('[data-hfilter]').forEach(b=>b.onclick=()=>{
      const k=b.dataset.hfilter;
      HOME_ST.filtro=HOME_ST.filtro===k?'':k;
      body.innerHTML=homeRenderDash();
      bindDash();
    });
    const clr=$('#hdClear');
    if(clr) clr.onclick=()=>{ HOME_ST.filtro=''; body.innerHTML=homeRenderDash(); bindDash(); };
  };
  bindDash();

  document.querySelectorAll('[data-htab]').forEach(t=>t.onclick=()=>{
    const tab=t.dataset.htab;
    if(HOME_ST.tab===tab) return;
    HOME_ST.tab=tab;
    HOME_ST.filtro='';
    document.querySelectorAll('[data-htab]').forEach(x=>{
      const on=x.dataset.htab===tab;
      x.classList.toggle('on',on);
      x.setAttribute('aria-selected',on?'true':'false');
    });
    if(body){ body.innerHTML=homeRenderDash(); bindDash(); }
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
