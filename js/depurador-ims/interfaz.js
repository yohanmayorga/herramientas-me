/* Herramientas M&E · Interfaz: pasos, vistas y renderizado */
/* ============ Interfaz ============ */
const STEPS=[['Cargar','Excel descargados del IMS'],['Validar','Columnas y perfil'],['Revisar y filtrar','Calidad, fechas y criterios'],['Exportar','Formato según el uso']];
function renderRail(){
  $('#rail').innerHTML=STEPS.map(([t,d],i)=>{ const n=i+1; const cls=n===S.step?'on':(n<S.step?'done':''); return `<li class="${cls}" ${n===S.step?'aria-current="step"':''}><span class="n">${n<S.step?'✓':n}</span><div><b>${t}</b><span class="d">${d}</span></div></li>`; }).join('');
  const first=$('#rail li');
  if(first&&S.step>1){ first.classList.add('rail-reset'); first.tabIndex=0; first.setAttribute('role','button'); first.title='Empezar de nuevo'; first.setAttribute('aria-label','Paso 1, Cargar: empezar de nuevo');
    first.onclick=askRestart; first.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); askRestart(); } }; }
}
function confirmBox(title,msg,okLabel){
  return new Promise(res=>{ const dlg=$('#confirmDlg'); $('#cfTitle').textContent=title; $('#cfMsg').textContent=msg; $('#cfOk').textContent=okLabel;
    const done=v=>{ dlg.close(); res(v); }; $('#cfOk').onclick=()=>done(true); $('#cfCancel').onclick=()=>done(false); dlg.oncancel=e=>{ e.preventDefault(); done(false); };
    dlg.showModal(); $('#cfCancel').focus(); });
}
async function askRestart(){
  const ok=await confirmBox('¿Empezar de nuevo?','Se descartarán los archivos cargados, las selecciones y los filtros de este proceso, y volverás a la pantalla inicial. Los archivos que ya descargaste no se ven afectados.','Sí, empezar de nuevo');
  if(!ok) return;
  Object.assign(S,{famAtt:null,salComp:null,mode:null,step:1,pending:null,loadMode:null,fam:null,sal:null,nfi:null,com:null,mm:null,mmLoad:null,registro:null,salWb:null,nfiWb:null,result:null,dash:null,guide:false});
  render(); toast('Listo: puedes cargar nuevos archivos.');
}
function render(){
  const wrap=document.querySelector('.wrap'), gb=$('#btnGuide');
  if(S.guide){ wrap.classList.add('guide'); gb.querySelector('.blabel').textContent='Volver a la herramienta'; gb.title='Volver a la herramienta'; gb.setAttribute('aria-label','Volver a la herramienta'); gb.setAttribute('aria-pressed','true'); $('#main').innerHTML=viewGuide(); document.querySelectorAll('[data-guide-back]').forEach(b=>b.onclick=()=>{ S.guide=false; render(); }); window.scrollTo(0,0); return; }
  if(S.dash){ wrap.classList.add('guide'); gb.querySelector('.blabel').textContent='Guía de uso'; gb.title='Guía de uso'; gb.setAttribute('aria-label','Guía de uso'); gb.setAttribute('aria-pressed','false'); $('#main').innerHTML=viewDash(); bindDash(); window.scrollTo(0,0); return; }
  wrap.classList.remove('guide'); gb.querySelector('.blabel').textContent='Guía de uso'; gb.title='Guía de uso'; gb.setAttribute('aria-label','Guía de uso'); gb.setAttribute('aria-pressed','false');
  renderRail(); const m=$('#main'); m.innerHTML=(S.mode&&S.step>1?S.mode.views[S.step]:[null,viewLoad,viewValidate,viewReview,viewExport][S.step])(); if(S.mode&&S.step>1) S.mode.bind(); else bindStep(); m.scrollIntoView({block:'start'}); window.scrollTo(0,0);  document.querySelectorAll('[data-opendash]').forEach(b=>b.onclick=openDash); }

function pendingPanel(){
  const P=S.pending, main=P.find(x=>x.type!=='registro'), needReg=main&&NEEDS_REG.has(main.type)&&!P.some(x=>x.type==='registro')&&!S.registro;
  return `<h2>Confirma el tipo de archivo</h2><div class="panel" id="pendPanel">
    <p class="muted" style="margin:0 0 10px;font-size:14px">Revisa que el tipo detectado sea el correcto. Si no lo es, elige el tipo adecuado en la lista.</p>
    ${P.map((x,i)=>`<div class="pendrow"><div class="pendfile"><b>${esc(x.f.name)}</b><span class="muted">${x.det==='generic'?'No se reconoció el formulario':`Detectado: ${esc(FORM_TYPES.find(t=>t[0]===x.det)[1])}`}</span></div>
      <select class="in" data-ptype="${i}" aria-label="Tipo de archivo de ${esc(x.f.name)}">${FORM_TYPES.map(([v,l])=>`<option value="${v}" ${v===x.type?'selected':''}>${l}</option>`).join('')}</select></div>`).join('')}
    ${needReg?'<p class="muted" style="margin:10px 0 0;font-size:14px">Este formulario requiere el Registro de Familias; te lo pediremos en el siguiente paso, o puedes cargarlo ahora junto con este archivo.</p>':''}
    <div class="actions" style="margin-top:14px"><button class="btn" type="button" id="pendCancel">Cancelar</button><button class="btn primary" type="button" id="pendOk">Confirmar y continuar</button></div></div>`;
}
function viewGuide(){
  const forms=[['Registro de Familias','No','Familias e integrantes; base para vincular las atenciones y las entregas.'],
    ['Atenciones en salud','Sí','Diagnóstico unificado; sexo y edad desde el Registro.'],
    ['Atenciones en salud mental','Sí','Tipo de atención psicosocial, motivo y número de sesión.'],
    ['Atenciones en protección','Sí','Tipos de asistencia, orientaciones, acciones, kits de dignidad y bloque psicosocial. Se recomienda cargar también Atención psicosocial.'],
    ['Atenciones psicosociales (Protección)','Sí','Tipo de atención, sesiones, motivo de ingreso y acompañamiento. Se recomienda cargar también Protección para detectar atenciones registradas en ambos.'],
    ['Actividades comunitarias','No','Actividades grupales; se elige qué tipos revisar (protección, salud y SMAPS, WASH).'],
    ['Entrega de kits NFI','Sí','Se confirma la categoría de cada kit (NFI, WASH u Otro).'],
    ['Entrega de kits y servicios WASH','Sí','Kits y servicios (baños, duchas, lavandería, agua) por separado.']];
  return `<div class="guide-doc">
  <h1>Guía de uso</h1>
  <p class="lead">El Depurador IMS revisa la calidad de los Excel que se descargan del IMS y genera tres salidas: un reporte de limpieza de datos, tablas ordenadas para Power BI y un informe en PDF. No modifica los archivos originales y todo el procesamiento ocurre en tu navegador: los datos no salen de tu equipo.</p>
  <h2>Antes de empezar</h2>
  <div class="note">Descarga los Excel completos desde el IMS, sin modificarlos. Para las atenciones (salud, salud mental, protección) y las entregas de kits necesitas también el <b>Registro de Familias completo</b>, sin filtro de fechas: de ahí salen el sexo, la edad y los integrantes de cada familia.</div>
  <h2>Pasos</h2>
  <ol class="gsteps">
    <li><b>Elegir el modo</b>En la pantalla inicial elige <b>Depurador de archivo único</b> para trabajar un formulario a la vez, o <b>Depurador múltiple</b> para cargar el Registro de Familias y varios formularios juntos y obtener una tabla para Power BI y un informe PDF globales. En el modo múltiple, cada formulario se verifica en orden en un acordeón (botón «Siguiente»), la limpieza de datos se descarga por archivo y, además, puedes descargar el <b>SITREP</b> en Excel con personas por sector y estado.</li>
    <li><b>Cargar y confirmar el archivo</b>En el modo de archivo único, arrastra el Excel a la zona de carga o haz clic para buscarlo. La herramienta detecta de qué formulario se trata; confirma el tipo en la lista (o corrígelo) y pulsa «Confirmar y continuar». Puedes cargar el Registro de Familias junto con el archivo de atenciones o de kits.</li>
    <li><b>Verificar</b>Revisa lo que la herramienta preparó antes de procesar:
      <ul><li>Las columnas encontradas: si falta alguna obligatoria, el archivo no es el correcto o está incompleto.</li>
      <li>El Registro de Familias, cuando el formulario lo requiere, y el porcentaje de registros vinculados.</li>
      <li>Los socios implementadores válidos: todos vienen marcados; desmarca los que no correspondan. Sus registros se reportan en la limpieza, pero se siguen incluyendo en las demás salidas.</li>
      <li>Según el formulario: los tipos de actividad a revisar (actividades comunitarias) o la categoría de cada kit (NFI y WASH).</li></ul></li>
    <li><b>Revisar y filtrar</b>Consulta el resumen de incidencias y acota los datos con el periodo (haz clic en las fechas para abrir el calendario) y los criterios: socio, ubicación y otros. Los totales se actualizan al instante.</li>
    <li><b>Exportar</b>Elige la salida que necesitas:
      <ul><li><b>Limpieza de datos:</b> Excel con el resumen y el detalle de cada incidencia (código, fila del Excel y quién lo cargó), para corregir en el IMS.</li>
      <li><b>Power BI:</b> Excel con las columnas ordenadas y las respuestas múltiples separadas en columnas 1/0. En kits incluye tablas relacionadas por «ID entrega».</li>
      <li><b>Informe:</b> abre una pantalla con sus propios filtros, título, observaciones y logo opcional, y genera un PDF con el análisis.</li>
      <li><b>Tablero interactivo:</b> muestra indicadores, un mapa de personas por estado, matrices y gráficos. El botón «Filtros» abre un panel lateral con el periodo (fechas o un mes), formulario, estado, municipio, parroquia, alojamiento, comunidad y socio. Con «Exportar tablero en PDF» se descarga tal como se ve, con los filtros aplicados.</li></ul></li>
  </ol>
  <h2>Formularios disponibles</h2>
  <div class="scroll"><table><thead><tr><th>Formulario</th><th>Requiere Registro</th><th>Particularidad</th></tr></thead><tbody>
    ${forms.map(f=>`<tr><td>${f[0]}</td><td>${f[1]}</td><td style="white-space:normal">${f[2]}</td></tr>`).join('')}</tbody></table></div>
  <p class="muted" style="font-size:14px">Cualquier otro Excel puede procesarse en modo genérico, con limpieza básica y exportación.</p>
  <h2>Recomendaciones</h2>
  <ul>
    <li>Si muchos registros aparecen como «Sin datos» o «no existe en el Registro», casi siempre el Registro de Familias cargado está incompleto.</li>
    <li>Los filtros del informe son independientes de los del paso «Revisar y filtrar»: verifica ambos si comparas cifras entre el PDF y Power BI.</li>
    <li>En Power BI, para contar personas únicas usa un recuento distinto; las tablas de beneficiarios pueden repetir personas que recibieron más de una entrega.</li>
    <li>Para procesar otro archivo, usa «Procesar otro archivo» en el paso Exportar o «Cargar otro archivo» en Verificar.</li>
  </ul>
  <div class="actions"><span></span><button class="btn primary" type="button" data-guide-back>Volver a la herramienta</button></div>
  </div>`;
}
function viewLoad(){
  if(!S.loadMode) return viewModeChoice();
  if(S.loadMode==='multi') return viewMultiLoad();
  return `<h1>Depurador de archivo único</h1>
  <p class="lead">Carga el Excel tal como se descarga del IMS. El sistema identifica el formulario por sus pestañas y columnas y te pide confirmarlo antes de procesar. Los datos se procesan en tu navegador y no salen de tu equipo.</p>
  <p class="muted" style="margin:-10px 0 18px">Formularios configurados: Registro de Familias; Atenciones en salud, salud mental y protección (requieren también el Registro de Familias; puedes cargar ambos a la vez); Actividades comunitarias; y Entrega de kits NFI y Entrega de kits y servicios WASH (requieren el Registro de Familias). Los demás se procesan en modo genérico mientras se configuran.</p>
  <div class="drop" id="drop" tabindex="0" role="button" aria-label="Seleccionar archivos"><strong>Arrastra aquí los Excel o haz clic para buscarlos</strong><span>.xlsx, .xls o .csv</span></div>
  ${S.pending&&S.pending.length?pendingPanel():''}
  <div class="row" style="margin-top:12px"><button class="btn sm" type="button" id="toMode">Cambiar de modo</button></div>
  <h2>Qué hace cada paso</h2>
  <div class="grid2">
    <div class="panel"><b>Validar</b><p class="muted" style="margin:4px 0 0">Identifica el formulario, empareja las columnas aunque el IMS las haya renombrado y avisa de columnas nuevas o faltantes.</p></div>
    <div class="panel"><b>Revisar y filtrar</b><p class="muted" style="margin:4px 0 0">Corrige fechas, números, espacios y variantes de escritura; marca duplicados y errores; filtra por fechas y criterios.</p></div>
    <div class="panel"><b>Exportar</b><p class="muted" style="margin:4px 0 0">Base limpia, tabla detallada para Power BI o matriz agregada 345W.</p></div>
  </div>`;
}
function viewValidate(){
  const p=S.profile, det=S.detection, nRows=S.rows.length;
  const req=S.fields.filter(f=>f.required); const missingReq=req.filter(f=>!S.mapping[f.key]);
  const matched=S.fields.filter(f=>S.mapping[f.key]).length;
  const opts=allProfiles().map(x=>`<option value="${esc(x.id)}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('');
  const files=S.files.map(f=>`<tr><td>${esc(f.name)}</td><td>${esc(f.sheet)}${f.sheets>1?` <span class="muted">(de ${f.sheets} hojas)</span>`:''}</td><td class="num">${f.headerRow}</td><td class="num">${fmt(f.rows.length)}</td><td class="num">${f.headers.length}</td></tr>`).join('');
  const hdrOpts=sel=>`<option value="">— sin asignar —</option>`+S.headers.map(h=>`<option ${h===sel?'selected':''}>${esc(h)}</option>`).join('');
  const ledger=S.fields.map(f=>{
    const st=S.mapping[f.key]?(S.matchInfo[f.key]==='exacta'?'<span class="status ok">Encontrada</span>':S.matchInfo[f.key]==='manual'?'<span class="status ok">Asignada</span>':'<span class="status warn">Aproximada</span>'):(f.required?'<span class="status bad">Falta</span>':'<span class="status mute">No está</span>');
    return `<tr class="${f.required?'req':''}"><td>${esc(f.label||f.key)}</td>
      <td data-label="Columna en el Excel"><select class="in" data-map="${esc(f.key)}">${hdrOpts(S.mapping[f.key])}</select></td>
      <td data-label="Tipo"><select class="in" data-type="${esc(f.key)}">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${k===f.type?'selected':''}>${v}</option>`).join('')}</select></td>
      <td data-label="Rol"><select class="in" data-role="${esc(f.key)}">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${k===(f.role||'')?'selected':''}>${v}</option>`).join('')}</select></td>
      <td data-label="Estado">${st}</td></tr>`;
  }).join('');
  const multi=S.files.length>1; const diffs=multi?S.files.filter(f=>f.headers.length!==S.files[0].headers.length||f.headers.some((h,i)=>h!==S.files[0].headers[i])):[];
  return `<h1>Validación del archivo</h1>
  <p class="lead">${fmt(nRows)} registros y ${S.headers.length} columnas con datos. Revisa el emparejamiento antes de continuar; los cambios aplican solo a esta sesión salvo que los guardes como perfil.</p>
  ${S.fileErrors&&S.fileErrors.length?`<div class="note bad">No se pudieron leer: ${esc(S.fileErrors.join(' · '))}</div>`:''}
  ${p.id==='auto'?`<div class="note warn">Ningún perfil coincidió con este archivo, así que se usa el modo automático. Si es un formulario recurrente, ajusta tipos y roles y guárdalo como perfil para la próxima vez.</div>`:`<div class="note">Formulario identificado como <b>${esc(p.name)}</b> (coincidencia ${Math.round(det.score*100)} %). ${matched} de ${S.fields.length} campos encontrados.</div>`}
  ${missingReq.length?`<div class="note bad">Faltan campos obligatorios: ${missingReq.map(f=>esc(f.label)).join(', ')}. Asígnalos a una columna o el archivo no podrá procesarse.</div>`:''}
  ${diffs.length?`<div class="note warn">Los archivos no tienen exactamente las mismas columnas (${diffs.map(f=>esc(f.name)).join(', ')}). Se combinaron por nombre de columna; las que solo existen en algunos archivos quedarán vacías en los demás.</div>`:''}
  <div class="row" style="margin-bottom:14px"><label class="field" style="flex:1;min-width:240px"><label for="pfPick">Perfil aplicado</label><select class="in" id="pfPick" style="width:100%">${opts}</select></label></div>
  <h2>Archivos leídos</h2>
  <div class="scroll"><table><thead><tr><th>Archivo</th><th>Hoja</th><th class="num">Fila de encabezados</th><th class="num">Registros</th><th class="num">Columnas</th></tr></thead><tbody>${files}</tbody></table></div>
  <h2>Campos del formulario</h2>
  <div class="scroll"><table class="ledger"><thead><tr><th>Campo</th><th>Columna en el Excel</th><th>Tipo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>${ledger}</tbody></table></div>
  <p class="muted" style="font-size:13px;margin:8px 0 0">* Obligatorio. Los roles activan cálculos: la fecha principal permite filtrar y derivar mes y trimestre; sexo y edad permiten la desagregación; el ID de persona permite contar personas únicas.</p>
  ${p.id!=='auto'?`<h2>Columnas del Excel que no están en el perfil (${S.extraHeaders.length})</h2>
  ${S.extraHeaders.length?`<p class="muted" style="margin:0 0 8px">Pueden ser columnas nuevas del IMS. Asígnalas arriba si corresponden a un campo renombrado.</p><div class="chips">${S.extraHeaders.map(h=>`<span class="chip" style="cursor:default">${esc(h)}</span>`).join('')}</div>
  <label class="check"><input type="checkbox" id="optExtra" ${S.opts.includeExtra?'checked':''}> Incluir estas columnas en las exportaciones</label>`:'<p class="muted">Ninguna. Todas las columnas del archivo están cubiertas por el perfil.</p>'}`:''}
  ${S.emptyCols.length?`<p class="muted" style="font-size:13px">Se ignoraron ${S.emptyCols.length} columnas completamente vacías.</p>`:''}
  <div class="actions"><div class="row"><button class="btn" type="button" id="back">Cargar otros archivos</button><input class="in" id="pfName" placeholder="Nombre del perfil" value="${p.id==='auto'?'':esc(p.name)}" aria-label="Nombre del perfil"><button class="btn" type="button" id="saveAsProfile">Guardar como perfil</button></div>
  <button class="btn primary" type="button" id="next" ${missingReq.length?'disabled':''}>Procesar y revisar</button></div>`;
}
function catFields(){ return S.result.fields.filter(f=>f.type==='category'||f.role==='sexo'); }
function viewReview(){
  const R=S.result, rows=filteredRows();
  const withIssues=R.rows.filter(r=>Object.keys(r.bad).length).length;
  const crit=R.rows.filter(r=>r.critical).length;
  const summary={}; R.issues.forEach(i=>{ const k=`${i[2]}|${i[4]}`; summary[k]=(summary[k]||0)+1; });
  const sumRows=Object.entries(summary).sort((a,b)=>b[1]-a[1]).map(([k,n])=>{ const [c,p]=k.split('|'); return `<tr><td>${esc(c)}</td><td>${esc(p)}</td><td class="num">${fmt(n)}</td></tr>`; }).join('');
  const dateFields=R.fields.filter(f=>f.type==='date');
  const cats=catFields().map(f=>{
    const cnt={}; R.rows.forEach(r=>{ if(S.opts.dedupe&&r.dup) return; const x=r.v[f.key]??'(vacío)'; cnt[x]=(cnt[x]||0)+1; });
    const vals=Object.entries(cnt).sort((a,b)=>b[1]-a[1]); const sel=S.filters.cats[f.key];
    return `<details class="cat" ${sel&&sel.size?'open':''}><summary><span>${esc(f.label)}</span><span class="cnt">${sel&&sel.size?`${sel.size} de ${vals.length} seleccionados`:`${vals.length} valores · todos`}</span></summary><div class="body">
      <div class="row" style="margin:4px 0 6px"><button class="btn sm" type="button" data-catall="${esc(f.key)}">Todos</button><button class="btn sm" type="button" data-catnone="${esc(f.key)}">Ninguno</button></div>
      ${vals.map(([v,n])=>`<label><input type="checkbox" data-cat="${esc(f.key)}" value="${esc(v)}" ${!sel||!sel.size||sel.has(v)?'checked':''}> ${esc(v)} <span class="cnt">${fmt(n)}</span></label>`).join('')}</div></details>`;
  }).join('');
  const F=R.fields.slice(0,14);
  const prev=rows.slice(0,100).map(r=>`<tr><td class="num muted">${r.row}</td>${F.map(f=>{ const x=r.v[f.key]; return `<td class="${r.bad[f.key]?'issue':''}${f.type==='number'?' num':''}">${esc(x??'')}</td>`; }).join('')}</tr>`).join('');
  return `<h1>Revisión y filtros</h1>
  <p class="lead">La limpieza ya se aplicó: espacios, fechas, números, variantes de escritura en categorías y normalización de sexo. Ajusta los filtros; los totales se actualizan al instante.</p>
  <div class="facts">
    <div><b>${fmt(R.rows.length)}</b><span>Registros leídos</span></div>
    <div class="${R.dups?'warn':'ok'}"><b>${fmt(R.dups)}</b><span>Duplicados</span></div>
    <div class="${withIssues?'warn':'ok'}"><b>${fmt(withIssues)}</b><span>Con alguna incidencia</span></div>
    <div class="${crit?'bad':'ok'}"><b>${fmt(crit)}</b><span>Con incidencia crítica</span></div>
    <div class="ok"><b id="nOut">${fmt(rows.length)}</b><span>Se exportarán</span></div>
  </div>
  <div class="grid2">
    <div>
      <h2 style="margin-top:0">Periodo</h2>
      ${dateFields.length?`<div class="panel">
        <div class="field" style="margin-bottom:10px"><label for="dateKey">Campo de fecha</label><select class="in" id="dateKey" style="width:100%">${dateFields.map(f=>`<option value="${esc(f.key)}" ${f.key===S.filters.dateKey?'selected':''}>${esc(f.label)}</option>`).join('')}</select></div>
        <div class="row"><div class="field"><label for="dFrom">Desde</label><input type="hidden" id="dFrom" data-dp data-label="Desde" data-pair="dTo" data-min="${esc(R.minDate)}" data-max="${esc(R.maxDate)}" value="${esc(S.filters.from)}"></div><div class="field"><label for="dTo">Hasta</label><input type="hidden" id="dTo" data-dp data-label="Hasta" data-pair="dFrom" data-min="${esc(R.minDate)}" data-max="${esc(R.maxDate)}" value="${esc(S.filters.to)}"></div></div>
        <div class="row" style="margin-top:10px">${quickRanges()}</div>
        <p class="muted" style="font-size:13px;margin:8px 0 0">Datos disponibles del ${esc(R.minDate||'—')} al ${esc(R.maxDate||'—')}. Los registros sin fecha válida quedan fuera cuando hay un periodo definido.</p>
      </div>`:'<p class="muted">El archivo no tiene campos de fecha. Asigna el tipo Fecha en el paso de validación si corresponde.</p>'}
      <h2>Opciones de limpieza</h2>
      <div class="panel">
        <label class="check"><input type="checkbox" id="optDedupe" ${S.opts.dedupe?'checked':''}> Excluir duplicados <span class="muted">(por ${R.dedupeKeys.length===R.fields.length?'fila completa':esc(R.dedupeKeys.map(k=>(R.fields.find(f=>f.key===k)||{}).label).join(', '))})</span></label>
        <label class="check"><input type="checkbox" id="optCrit" ${S.opts.excludeCritical?'checked':''}> Excluir registros con incidencias críticas (fecha principal inválida u obligatorios vacíos)</label>
        <div class="field" style="margin-top:10px"><label for="bands">Grupos etarios (mín-máx:etiqueta)</label><input class="in" id="bands" style="width:100%" value="${esc(S.bands)}"></div>
      </div>
    </div>
    <div>
      <h2 style="margin-top:0">Criterios</h2>
      ${cats||'<p class="muted">No hay campos de categoría para filtrar.</p>'}
    </div>
  </div>
  <h2>Incidencias detectadas</h2>
  ${sumRows?`<div class="scroll"><table><thead><tr><th>Campo</th><th>Problema</th><th class="num">Casos</th></tr></thead><tbody>${sumRows}</tbody></table></div><p class="muted" style="font-size:13px">El detalle fila por fila se incluye en la hoja Incidencias de las exportaciones, para corregirlo en el IMS.</p>`:'<p class="muted">No se detectaron incidencias.</p>'}
  <h2>Vista previa <span class="muted" style="font-weight:400;font-size:14px">(primeros 100 registros filtrados${R.fields.length>14?`, 14 de ${R.fields.length} campos`:''})</span></h2>
  <div class="scroll" style="max-height:420px"><table><thead><tr><th class="num">Fila</th>${F.map(f=>`<th>${esc(f.label)}</th>`).join('')}</tr></thead><tbody>${prev||`<tr><td colspan="${F.length+1}" class="muted">Ningún registro cumple los filtros.</td></tr>`}</tbody></table></div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a validación</button><button class="btn primary" type="button" id="next">Continuar a exportar</button></div>`;
}
function quickRanges(){
  const R=S.result; if(!R.maxDate) return '';
  const [y,m]=R.maxDate.split('-').map(Number);
  const last=(yy,mm)=>ymd(yy,mm,new Date(Date.UTC(yy,mm,0)).getUTCDate());
  const q=Math.ceil(m/3), qs=(q-1)*3+1;
  const opts=[['Todo',R.minDate,R.maxDate],['Último mes con datos',ymd(y,m,1),last(y,m)],[`T${q} ${y}`,ymd(y,qs,1),last(y,qs+2)],[`Año ${y}`,ymd(y,1,1),ymd(y,12,31)]];
  return opts.map(([l,a,b])=>`<button class="btn sm" type="button" data-range="${a}|${b}">${esc(l)}</button>`).join('');
}
function viewExport(){
  const R=S.result, n=filteredRows().length;
  const hasDim=catFields();
  const {fFecha,fSexo,fId,fEdad,fNac}=R.roles;
  const dims=hasDim.map(f=>`<button class="chip" type="button" data-dim="${esc(f.key)}" aria-pressed="${S.w345.dims.includes(f.key)}">${esc(f.label)}</button>`).join('');
  return `<h1>Exportar</h1>
  <p class="lead">${fmt(n)} registros${S.filters.from?` entre el ${esc(S.filters.from)} y el ${esc(S.filters.to)}`:''}. Cada exportación respeta los filtros y opciones del paso anterior.</p>
  ${n?'':'<div class="note bad">No hay registros que exportar con los filtros actuales.</div>'}
  <div class="exports">
    <div class="exp"><h3>Base limpia</h3><p>Las mismas columnas del formulario con los datos corregidos y fechas reales. Incluye la hoja Incidencias para devolver correcciones al IMS.</p><button class="btn primary" type="button" id="exClean" ${n?'':'disabled'}>Descargar Excel</button></div>
    <div class="exp"><h3>Detallado para Power BI</h3><p>Nombres de columna estables (no cambian aunque el IMS renombre), más año, mes, trimestre, grupo etario, origen de cada fila y diccionario de campos. Ideal para reemplazar el archivo fuente del tablero.</p><div class="row"><button class="btn primary" type="button" id="exPbi" ${n?'':'disabled'}>Descargar Excel</button><button class="btn" type="button" id="exCsv" ${n?'':'disabled'}>Descargar CSV</button></div></div>
  </div>
  <h2>Matriz agregada 345W</h2>
  <div class="panel">
    <p class="muted" style="margin-top:0">Agrupa las atenciones por las dimensiones que elijas${fFecha?' y por mes':''}, con ${fId?'personas únicas, ':''}${fSexo?(fEdad||fNac?'desagregación por sexo y grupo etario':'desagregación por sexo'):'conteo de registros'}.${!fSexo?' Asigna el rol Sexo a un campo para obtener la desagregación.':''}</p>
    <div class="field"><label>Dimensiones (en este orden)</label><div class="chips">${dims||'<span class="muted">No hay campos de categoría.</span>'}</div></div>
    ${fFecha?`<label class="check"><input type="checkbox" id="w345Month" ${S.w345.byMonth?'checked':''}> Separar por mes</label>`:''}
    <div class="row" style="margin-top:12px"><button class="btn primary" type="button" id="ex345" ${n?'':'disabled'}>Descargar matriz</button><span class="muted" id="w345Info"></span></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a filtros</button><button class="btn" type="button" id="restart">Procesar otro formulario</button></div>`;
}

