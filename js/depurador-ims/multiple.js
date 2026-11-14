/* Herramientas M&E · Depurador múltiple: verificación, revisión y exportación global */
/* ============ Depurador múltiple ============ */
const MM_TYPES=FORM_TYPES.filter(([v])=>v!=='registro'&&v!=='generic');
const mmLabel=t=>(FORM_TYPES.find(x=>x[0]===t)||[t,t])[1];
const mmShort={salud:'Salud',mental:'Salud mental',proteccion:'Protección',psicosocial:'Psicosocial',comunitarias:'Comunitarias',nfi:'NFI',wash:'WASH'};
function mmInitLoad(){ if(!S.mmLoad) S.mmLoad=[{type:'registro',f:null,wb:null,det:null,fixed:true},{type:'',f:null,wb:null,det:null}]; return S.mmLoad; }
function withCtx(it,fn){
  const keep={fam:S.fam,sal:S.sal,nfi:S.nfi,com:S.com};
  if(it.type==='registro') S.fam=it.obj; else if(ATT_CFG[it.type]) S.sal=it.obj; else if(it.type==='nfi'||it.type==='wash') S.nfi=it.obj; else if(it.type==='comunitarias') S.com=it.obj;
  const done=()=>{ S.fam=keep.fam; S.sal=keep.sal; S.nfi=keep.nfi; S.com=keep.com; };
  let r; try{ r=fn(); }catch(e){ done(); throw e; }
  if(r&&typeof r.then==='function') return r.finally(done); done(); return r;
}
function viewModeChoice(){
  const forms=[
    ['Registro de Familias','Base de familias e integrantes'],
    ['Atenciones en salud','Consultas y diagnósticos'],
    ['Atenciones en salud mental','Atención psicosocial y sesiones'],
    ['Atenciones en protección','Asistencias, acciones y kits de dignidad'],
    ['Atención psicosocial','Sesiones, ingreso y acompañamiento'],
    ['Actividades comunitarias','Protección, salud/SMAPS y WASH'],
    ['Entrega de kits NFI','Clasificación NFI, WASH u otro'],
    ['Kits y servicios WASH','Kits y servicios de agua y saneamiento']
  ];
  const extSvg='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  return `<div class="ims-home">
    <section class="p-hero pj-hero">
      <div>
        <h1>Depurador IMS</h1>
        <p>Valida y limpia las descargas de Excel del IMS, y genera reportes de errores, tablas para Power BI, informes en PDF, tablero interactivo y SITREP.</p>
      </div>
      <div class="pj-hero-side">
        <div class="pj-today">${icono('candado',15)} Procesamiento local en tu navegador</div>
        <a class="btn ims-gbtn" href="https://ims.iom.int/" target="_blank" rel="noopener noreferrer">${extSvg}<span>Enlace al IMS</span></a>
        ${guideBtnHtml()}
      </div>
    </section>

    <h2 class="p-title">Elige el modo de trabajo</h2>
    <div class="p-grid ims-modes">
      <article class="p-card ims-mcard" data-mode="single" tabindex="0" role="button" aria-label="Abrir Depurador de archivo único">
        <div class="p-ch"><span class="p-ic">${icono('archivo',24)}</span><span class="chip-st ok">Un formulario a la vez</span></div>
        <h3>Depurador de archivo único</h3>
        <p class="muted">Procesa un formulario individual del IMS (o vincúlalo con el Registro de Familias) para auditar su calidad y exportar sus resultados.</p>
        <ul>
          <li>Limpieza avanzada del Registro de Familias con nivel de severidad</li>
          <li>Reporte detallado de errores en Excel para corregir en el IMS</li>
          <li>Tabla estructurada para Power BI, informe PDF y tablero interactivo</li>
        </ul>
        <div class="p-cf"><span class="btn primary">Abrir archivo único ${icono('flecha',16)}</span></div>
      </article>

      <article class="p-card ims-mcard" data-mode="multi" tabindex="0" role="button" aria-label="Abrir Depurador múltiple">
        <div class="p-ch"><span class="p-ic">${icono('depurador',24)}</span><span class="chip-st ok">Consolidado + SITREP</span></div>
        <h3>Depurador múltiple</h3>
        <p class="muted">Carga el Registro de Familias junto con varios formularios para cruzarlos en un solo proceso y obtener salidas consolidadas.</p>
        <ul>
          <li>Verificación guiada paso a paso por formulario en acordeón</li>
          <li>Excel global para Power BI e informe PDF consolidado con mapa</li>
          <li>Exportación del SITREP por sector y estado + tablero global</li>
        </ul>
        <div class="p-cf"><span class="btn primary">Abrir depurador múltiple ${icono('flecha',16)}</span></div>
      </article>
    </div>

    <h2 class="p-title" style="margin-top:28px">Formularios configurados</h2>
    <div class="ims-forms">
      ${forms.map(([n,d])=>`<div class="ims-fitem"><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join('')}
    </div>
  </div>`;
}
function viewMultiLoad(){
  const L=mmInitLoad(), ok=L[0].f&&L.slice(1).some(r=>r.f&&r.type);
  const regMissing=!L[0].f&&L.slice(1).some(r=>r.f);
  const row=(r,i)=>`<div class="mmrow">
    <div class="mmtype">${r.fixed?`<b>Registro de Familias</b><span class="muted">Obligatorio</span>`:`<select class="in" data-mmtype="${i}" aria-label="Tipo de formulario"><option value="">Selecciona el formulario…</option>${MM_TYPES.map(([v,l])=>`<option value="${v}" ${v===r.type?'selected':''}>${l}</option>`).join('')}</select>`}</div>
    <div class="mmfile"><label class="btn sm"><input type="file" accept=".xlsx,.xls,.xlsm" data-mmfile="${i}" hidden>${r.f?'Cambiar archivo':'Seleccionar archivo'}</label>
      <span class="${r.f?'':'muted'}">${r.f?esc(r.f.name):'Ningún archivo seleccionado'}</span>
      ${r.f&&r.det&&r.det!==r.type?`<span class="status warn">El archivo parece ser: ${esc(mmLabel(r.det))}</span>`:''}</div>
    ${r.fixed?'<span></span>':`<button class="btn sm" type="button" data-mmdel="${i}" aria-label="Quitar fila">Quitar</button>`}</div>`;
  return `<section class="p-hero pj-hero ims-subhero">
    <div>
      <h1>Depurador múltiple</h1>
      <p>Arrastra todos los Excel a la vez: cada archivo se identifica automáticamente y aparece en la lista con su tipo. El Registro de Familias es obligatorio porque vincula a las familias y personas de todos los formularios.</p>
    </div>
    <div class="pj-hero-side">
      <button class="btn" type="button" id="mmMode">← Cambiar de modo</button>
      ${guideBtnHtml('btn ims-gbtn')}
    </div>
  </section>
  <div class="drop" id="mmDrop" tabindex="0" role="button" aria-label="Seleccionar archivos" style="margin-bottom:16px"><strong>Arrastra aquí todos los Excel o haz clic para buscarlos</strong><span>Se identifican automáticamente</span></div><input type="file" id="mmMulti" accept=".xlsx,.xls,.xlsm" multiple hidden>
  <div class="panel">${L.map(row).join('')}
    <div class="row" style="margin-top:12px"><button class="btn" type="button" id="mmAdd">Agregar formulario</button></div></div>
  ${regMissing?'<div class="note bad" style="margin-top:14px">Falta el Registro de Familias: cárgalo para poder continuar.</div>':''}
  <div class="actions"><span></span><button class="btn primary" type="button" id="mmGo" ${ok?'':'disabled'}>Verificar archivos</button></div>`;
}
async function mmProcess(){
  const L=S.mmLoad; busy(true); await nextFrame();
  try{
    if(!famDetect(L[0].wb)){ toast('El archivo de la primera línea no es un Registro de Familias.'); return; }
    const D=famLoad(L[0].wb,L[0].f.name); if(D.fatal.length){ toast('Al Registro de Familias le faltan columnas: '+D.fatal.join(', ')); return; }
    S.registro=D;
    const seen=new Set(), items=[{type:'registro',label:'Registro de Familias',file:L[0].f.name,obj:D}];
    for(const r of L.slice(1)){ if(!r.f||!r.type) continue; if(seen.has(r.type)){ toast(`Hay dos archivos de ${mmLabel(r.type)}; se usa el primero.`); continue; } seen.add(r.type);
      let obj; try{
        if(r.type==='comunitarias') obj=comLoad(r.wb,r.f.name);
        else if(r.type==='nfi'||r.type==='wash') obj=nfiLoad(r.wb,r.f.name,D,r.type);
        else obj=salLoad(r.wb,r.f.name,D,r.type);
      }catch(e){ console.error(e); obj={fatal:['No se pudo leer con el tipo elegido']}; }
      items.push({type:r.type,label:mmLabel(r.type),file:r.f.name,obj}); }
    { const pr=items.find(x=>x.type==='proteccion'&&x.obj.rows), ps=items.find(x=>x.type==='psicosocial'&&x.obj.rows); if(pr&&ps){ salAttachComp(pr.obj,ps.obj.rows,ps.file); salAttachComp(ps.obj,pr.obj.rows,pr.file); } }
    const ds=[]; items.forEach(it=>{ const o=it.obj; if(o.fatal&&o.fatal.length) return; if(o.minDate) ds.push(o.minDate); if(o.maxDate) ds.push(o.maxDate); });
    ds.sort(); S.mm={items,open:0,inc:new Set(items.map((_,i)=>i)),filters:{from:ds[0]||'',to:ds[ds.length-1]||'',cats:{}},minDate:ds[0]||'',maxDate:ds[ds.length-1]||'',title:'Informe global de asistencia',notes:''};
    S.mode=MULTI_MODULE; S.step=2;
  }catch(e){ console.error(e); toast('No se pudieron procesar los archivos: '+(e.message||e)); }
  finally{ busy(false); render(); }
}
/* --- Verificación en acordeón --- */
const mmOk=it=>!(it.obj.fatal&&it.obj.fatal.length);
function mmSocios(i,list,valid,unit,key=''){ const id=key?`${i}|${key}`:`${i}`;
  return `<div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" data-mvall="${id}">Seleccionar todos</button><button class="btn sm" type="button" data-mvnone="${id}">Quitar todos</button></div>
  ${list.map(([x,n])=>`<label class="check"><input type="checkbox" data-mv="${id}" value="${esc(fold(x))}" ${valid.has(fold(x))?'checked':''}> ${esc(x)} <span class="muted">(${fmt(n)} ${unit})</span></label>`).join('')}`; }
function mmKitRows(i,N){ const ord=c=>KIT_CATS.indexOf(c);
  return N.kits.map((k,ki)=>({k,ki})).filter(x=>x.k.total>0).sort((a,b)=>ord(N.cat[a.ki])-ord(N.cat[b.ki])||b.k.total-a.k.total)
    .map(({k,ki},j,arr)=>`<tr${j&&N.cat[arr[j-1].ki]!==N.cat[ki]?' class="kitgroup"':''}><td class="kinc"><input type="checkbox" data-mki="${i}|${ki}" ${N.inc[ki]?'checked':''} aria-label="Incluir ${esc(k.name)} en el informe"></td><td style="white-space:normal" class="${N.inc[ki]?'':'muted'}">${esc(k.name)}</td><td class="num">${fmt(k.total)}</td><td>${esc(k.proj||'—')}</td>
      <td><select class="in kitcat kitcat-${N.cat[ki].toLowerCase()}" data-mkc="${i}|${ki}" aria-label="Categoría del kit">${KIT_CATS.map(c=>`<option ${c===N.cat[ki]?'selected':''}>${c}</option>`).join('')}</select></td></tr>`).join(''); }
function mmBody(it,i){
  const o=it.obj;
  if(!mmOk(it)) return `<div class="note bad">Faltan columnas necesarias: ${esc(o.fatal.join(', '))}. Este archivo no se incluirá; revisa que sea el formulario correcto.</div>`;
  if(it.type==='registro') return `<div class="facts"><div><b>${fmt(o.fams.length)}</b><span>Familias</span></div><div><b>${fmt(o.pers.length)}</b><span>Personas</span></div><div><b>${esc(o.minDate?dmy(o.minDate):'—')}</b><span>Primer registro</span></div><div><b>${esc(o.maxDate?dmy(o.maxDate):'—')}</b><span>Último registro</span></div></div><p class="muted" style="margin:0">Es la base que vincula a las familias y personas de los demás formularios. No requiere configuración.</p>`;
  if(it.type==='comunitarias') return `<p class="muted" style="margin:0 0 6px;font-size:14px">Tipos de actividad a incluir</p>${o.types.map(t=>`<label class="check"><input type="checkbox" data-mct="${i}|${t.id}" ${o.sel.has(t.id)?'checked':''}> ${esc(t.label)} <span class="muted">(${fmt(t.count)} actividades)</span></label>`).join('')}
    ${o.types.map(t=>`<div data-mcp="${i}|${t.id}" ${o.sel.has(t.id)?'':'hidden'}><h3 class="mmh3">Socios válidos · ${esc(t.name)}</h3>${mmSocios(i,o.socios[t.id],o.valid[t.id],'actividades',t.id)}</div>`).join('')}`;
  const linked=o.rows.filter(a=>a.p||a.fam).length;
  let html=`<p class="muted" style="margin:0 0 10px;font-size:14px">${fmt(o.rows.length)} registros · ${pct(linked,o.rows.length)} vinculados al Registro de Familias.</p>`;
  if(it.type==='nfi'||it.type==='wash') html+=`<h3 class="mmh3">Clasificación de los kits</h3><p class="muted" style="margin:0 0 8px;font-size:13px">${esc(o.cfg.catNote)} Desmarca «Incluir» para dejar un kit fuera del informe.</p>
    <div class="scroll"><table class="kits"><thead><tr><th>Incluir</th><th>Kit</th><th class="num">Cantidad</th><th>Proyecto según el nombre</th><th>Categoría</th></tr></thead><tbody data-mkrows="${i}">${mmKitRows(i,o)}</tbody></table></div>`;
  const list=it.type==='nfi'||it.type==='wash'?o.socioList:o.socioList;
  html+=`<h3 class="mmh3">Socios implementadores válidos</h3>${mmSocios(i,list,o.valid,'registros')}`;
  return html;
}
function mmViewVerify(){
  const M=S.mm;
  return `<h1>Verificación de los archivos</h1>
  <p class="lead">Revisa cada formulario en orden y pulsa «Siguiente». Cuando termines, procesa todos los archivos juntos.</p>
  <div class="acc">${M.items.map((it,i)=>`<section class="accitem ${M.open===i?'open':''}">
    <button class="acchead" type="button" data-acc="${i}" aria-expanded="${M.open===i}"><span class="accn">${i+1}</span><span class="acct"><b>${esc(it.label)}</b><span class="muted">${esc(it.file)}</span></span>${mmOk(it)?'<span class="status ok">Listo</span>':'<span class="status bad">Con errores</span>'}<span class="accarrow" aria-hidden="true">▾</span></button>
    <div class="accbody" ${M.open===i?'':'hidden'}>${mmBody(it,i)}
      <div class="row" style="justify-content:flex-end;margin-top:14px">${i<M.items.length-1?`<button class="btn primary" type="button" data-accnext="${i}">Siguiente</button>`:'<button class="btn primary" type="button" id="mmDone">Procesar archivos</button>'}</div></div></section>`).join('')}</div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a la carga</button><button class="btn primary" type="button" id="next">Procesar archivos</button></div>`;
}
/* --- Revisión global --- */
function mmApplyPeriod(){ const M=S.mm, F=M.filters;
  M.items.forEach(it=>{ if(!mmOk(it)) return; const o=it.obj; o.filters.from=F.from; o.filters.to=F.to;
    withCtx(it,()=>{ const R=it.type==='registro'?repInit():it.type==='comunitarias'?comRepInit():(it.type==='nfi'||it.type==='wash')?nfiRepInit():salRepInit(); R.from=F.from; R.to=F.to; }); }); }
function mmStats(it){
  return withCtx(it,()=>{ const o=it.obj;
    if(it.type==='registro'){ const f=o.fams.filter(x=>famPass(x)); return {n:f.length,unit:'familias',p:f.reduce((t,x)=>t+((o.famByNum.get(x.num)===x&&o.byFam.get(x.num))||[]).length,0),punit:'personas',obs:null}; }
    if(it.type==='comunitarias'){ const r=comSelRows(); return {n:r.length,unit:'actividades',p:r.reduce((t,a)=>t+a.total,0),punit:'participantes',obs:r.filter(a=>a.issues.length).length}; }
    if(it.type==='nfi'||it.type==='wash'){ const r=nfiRows(); const fam=new Set(r.map(a=>fold(a.caso))); return {n:r.length,unit:'entregas',p:r.reduce((t,a)=>t+a.items.reduce((s,x)=>s+x.q,0),0),punit:'kits',obs:r.filter(a=>a.issues.length).length,fams:fam}; }
    const r=o.rows.filter(a=>salPass(a)), E=salScoped(), bad=new Set([...E.socio,...E.noCase,...E.noPerson,...E.badDate,...E.other.map(x=>x.a),...E.dup.flatMap(g=>g.rows)].filter(a=>salPass(a)));
    return {n:r.length,unit:'atenciones',p:new Set(r.map(a=>a.pkey)).size,punit:'personas',obs:bad.size,fams:new Set(r.map(a=>fold(a.caso||'')))}; });
}
function mmSumRows(){ const M=S.mm; mmApplyPeriod();
  return M.items.map((it,i)=>{ if(!mmOk(it)) return `<tr><td>${esc(it.label)}</td><td colspan="3" class="muted">No se procesó (faltan columnas)</td><td></td></tr>`; const s=mmStats(it);
    return `<tr><td>${esc(it.label)}<div class="muted" style="font-size:12px">${esc(it.file)}</div></td><td class="num">${fmt(s.n)} <span class="muted">${s.unit}</span></td><td class="num">${fmt(s.p)} <span class="muted">${s.punit}</span></td><td class="num">${s.obs==null?'—':`<span class="status ${s.obs?'warn':'ok'}">${fmt(s.obs)}</span>`}</td>
      <td class="kinc"><input type="checkbox" data-minc="${i}" ${M.inc.has(i)?'checked':''} ${it.type==='registro'?'':''} aria-label="Incluir ${esc(it.label)} en las salidas globales"></td></tr>`; }).join(''); }
function mmViewReview(){
  const M=S.mm, dates=M.items.filter(mmOk).flatMap(it=>(it.obj.rows||it.obj.fams||[]).map(a=>a.fecha||a.created).filter(Boolean));
  return `<h1>Datos a procesar</h1>
  <p class="lead">El periodo se aplica a todos los formularios. Marca qué formularios se incluyen en la tabla global para Power BI y en el informe global.</p>
  <div class="grid2"><div><h2 style="margin-top:0">Periodo</h2><div class="panel">${periodPanel('mm',M.minDate,M.maxDate,M.filters,dates,'mmrange','Según la fecha de registro, de atención, de actividad o de entrega de cada formulario.')}</div></div><div></div></div>
  <h2>Resumen por formulario</h2>
  <div class="scroll"><table><thead><tr><th>Formulario</th><th class="num">Registros</th><th class="num">Personas o cantidades</th><th class="num">Con observaciones</th><th>Incluir</th></tr></thead><tbody id="mmSum">${mmSumRows()}</tbody></table></div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a la verificación</button><button class="btn primary" type="button" id="next">Continuar a exportar</button></div>`;
}
/* --- Exportación --- */
const mmIncluded=()=>S.mm.items.filter((it,i)=>mmOk(it)&&S.mm.inc.has(i));
async function mmExportClean(i){ const it=S.mm.items[i]; mmApplyPeriod();
  await withCtx(it,()=>it.type==='registro'?famExportErrors():it.type==='comunitarias'?comExportErrors():(it.type==='nfi'||it.type==='wash')?nfiExportErrors():salExportErrors()); }
/* Une tablas de varios formularios: columnas comunes a todos en una sola columna; las propias, con el prefijo «(Formulario)/» */
function mergeParts(parts){
  if(!parts.length) return {cols:[],data:[]};
  const baseOf=c=>c.split?c.base:c.h, common=b=>parts.every(p=>p.cols.some(c=>baseOf(c)===b));
  const cols=[{h:'Formulario'}], key=new Map();
  parts.forEach(p=>p.cols.forEach(c=>{ const shared=common(baseOf(c)), h=shared?c.h:`(${p.tag})/${c.h}`; if(!key.has(h)){ key.set(h,cols.length); cols.push({h,type:c.type,split:c.split,shared}); } }));
  const data=[]; parts.forEach(p=>{ const map=p.cols.map(c=>key.get(common(baseOf(c))?c.h:`(${p.tag})/${c.h}`));
    p.data.forEach(r=>{ const out=cols.map((c,i)=>i===0?p.tag:(c.split&&c.shared?0:null)); r.forEach((v,j)=>{ out[map[j]]=v; }); data.push(out); }); });
  return {cols,data};
}
async function mmExportPbi(){
  mmApplyPeriod();
  const wb=XLSX.utils.book_new(), add=(n,t)=>{ if(t.data.length) XLSX.utils.book_append_sheet(wb,buildSheet(t.cols,t.data),sheetName(n)); };
  const kitCols=[{h:'ID entrega'},{h:'Formulario'},{h:'Fecha de asistencia',type:'date'},{h:'Estado donde se brindó la asistencia'},{h:'Municipio donde se brindó la asistencia'},{h:'Parroquia donde se brindó la asistencia'},{h:'Alojamiento'},{h:'Socio Implementador'},{h:'Código de caso'},{h:'Kit o servicio'},{h:'Categoría'},{h:'Proyecto'},{h:'Cantidad'}], kitData=[];
  const health=[], prot=[], com=[], TAG={salud:'Salud',mental:'Salud mental',proteccion:'Protección',psicosocial:'Psicosocial'}, CTAG={proteccion:'Protección',salud:'SMAPS',wash:'WASH'};
  for(const it of mmIncluded()){
    withCtx(it,()=>{
      if(it.type==='registro'){ add('Registro de Familias',famPbiTable()); return; }
      if(it.type==='comunitarias'){ const C=S.com, rows=comSelRows();
        C.types.filter(t=>C.sel.has(t.id)).forEach(tp=>{ const t=comTable(rows.filter(a=>a.type===tp.id),comTypeSpec(tp)); com.push({tag:CTAG[tp.id]||tp.name,cols:t.cols,data:t.data}); }); return; }
      if(it.type==='nfi'||it.type==='wash'){ const N=S.nfi, F=N.filters, fm=mmShort[it.type];
        nfiRows(F).forEach(a=>{ const base=[a.code,fm,a.fecha||null,a.estado,a.municipio,a.parroquia,a.alojamiento,a.socio,a.caso];
          nfiItems(a,F).forEach(x=>kitData.push([...base,N.kits[x.ki].name,N.cat[x.ki],x.proj,x.q]));
          (a.serv||[]).forEach((v,j)=>{ if(v>0) kitData.push([...base,N.services[j].label,'Servicio WASH',a.proyecto||'Sin datos',v]); }); }); return; }
      // Atenciones sin datos de beneficiarios (se relacionan con el Registro por el Código de caso)
      const t=salPbiTable(), part={tag:TAG[it.type],cols:t.cols.slice(0,-2),data:t.data.map(r=>r.slice(0,-2))};
      (it.type==='salud'||it.type==='mental'?health:prot).push(part);
    }); }
  add('Salud',mergeParts(health)); add('Protección',mergeParts(prot)); add('Comunitarias',mergeParts(com));
  add('Kits NFI y WASH',{cols:kitCols,data:kitData});
  if(!wb.SheetNames.length){ toast('No hay datos para exportar.'); return; }
  const F=S.mm.filters; await saveFile(`Depurador_IMS_Global_PowerBI${F.from&&F.to?`_${F.from}_a_${F.to}`:''}.xlsx`,xlsxBlob(wb));
}
async function mmPdf(){
  if(!window.jspdf||!window.jspdf.jsPDF){ toast('No se pudo cargar el generador de PDF. Revisa la conexión y recarga la página.'); return; }
  mmApplyPeriod();
  const M=S.mm, F=M.filters, its=mmIncluded(); if(!its.length){ toast('Incluye al menos un formulario.'); return; }
  const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'}), W=210, Mg=14, CW=W-2*Mg;
  const C={blue:[0,51,160],blue2:[65,143,222],pale:[231,238,249],ink:[34,43,69],grey:[107,114,128],line:[217,223,234],white:[255,255,255]};
  const fill=c=>doc.setFillColor(...c), stroke=c=>doc.setDrawColor(...c);
  const T=(s,x,y,o={})=>{ doc.setFont('helvetica',o.bold?'bold':'normal'); doc.setFontSize(o.size||8); doc.setTextColor(...(o.c||C.ink)); doc.text(String(s),x,y,{align:o.align||'left',maxWidth:o.maxW}); };
  const NN=n=>Number(n).toLocaleString('es-VE');
  let logo=null; try{ logo=JSON.parse(localStorage.getItem(LOGO_KEY)||'null'); }catch(e){}
  fill(C.blue); doc.rect(0,0,W,34,'F'); fill(C.blue2); doc.rect(0,34,W,1.4,'F'); let tx=Mg;
  if(logo){ try{ const h=18, w=Math.min(44,h*logo.w/logo.h); fill(C.white); doc.roundedRect(Mg,7,w+4,h+4,1.5,1.5,'F'); doc.addImage(logo.data,logo.fmt,Mg+2,9,w,h); tx=Mg+w+9; }catch(e){} }
  T(M.title||'Informe global de asistencia',tx,16,{size:17,bold:true,c:C.white}); T('OIM Venezuela · Consolidado de formularios del IMS',tx,23,{size:9,c:[214,226,248]});
  T('PERIODO',W-Mg,12,{size:6.5,bold:true,c:[180,200,240],align:'right'}); T(F.from&&F.to?`${dmy(F.from)} – ${dmy(F.to)}`:'Todo el periodo',W-Mg,17.5,{size:9.5,bold:true,c:C.white,align:'right'}); T(`Emitido el ${dmy(TODAY_YMD)}`,W-Mg,23,{size:7,c:[214,226,248],align:'right'});
  const st=its.map(it=>({it,s:mmStats(it)})), g=t=>st.filter(x=>x.it.type===t).map(x=>x.s)[0];
  const at=['salud','mental','proteccion'].reduce((t,k)=>t+((g(k)||{}).n||0),0), kits=['nfi','wash'].reduce((t,k)=>t+((g(k)||{}).p||0),0);
  const famAlc=new Set(st.flatMap(x=>x.s.fams?[...x.s.fams]:[]).filter(Boolean));
  const kp=[[NN((g('registro')||{}).n||0),'familias registradas'],[NN((g('registro')||{}).p||0),'personas registradas'],[NN(at),'atenciones (salud, salud mental y protección)'],[NN(kits),'kits NFI y WASH entregados'],
    [NN((g('comunitarias')||{}).n||0),'actividades comunitarias'],[NN((g('comunitarias')||{}).p||0),'participantes en actividades comunitarias'],[NN(famAlc.size),'familias distintas con atenciones o entregas'],[NN(its.length),'formularios incluidos']];
  let y=44; const kw=(CW-9)/4;
  kp.forEach(([v,l],i)=>{ const x=Mg+(i%4)*(kw+3), yy=y+Math.floor(i/4)*25; fill(C.pale); doc.roundedRect(x,yy,kw,21,1.5,1.5,'F'); fill(C.blue); doc.rect(x,yy,1.2,21,'F'); T(v,x+5,yy+10,{size:16,bold:true,c:C.blue}); doc.setFontSize(7); T(doc.splitTextToSize(l,kw-8).slice(0,2).join('\n'),x+5,yy+15,{size:7,c:C.grey}); });
  y+=56; T('Resumen por formulario',Mg,y,{size:10,bold:true,c:C.blue}); stroke(C.blue2); doc.setLineWidth(0.5); doc.line(Mg,y+1.6,Mg+12,y+1.6); y+=6;
  const cx=[Mg+1.5,Mg+95,Mg+140,W-Mg-1.5]; [['Formulario','left'],['Registros','right'],['Personas o cantidades','right'],['Con observaciones','right']].forEach(([h,a],i)=>T(h,cx[i],y+1,{size:7,bold:true,c:C.grey,align:a}));
  y+=2.5; st.forEach(({it,s},i)=>{ const yy=y+i*6.2; if(i%2===0){ fill([245,247,251]); doc.rect(Mg,yy,CW,6.2,'F'); } T(`${it.label}`,cx[0],yy+4.2,{size:7.6,bold:true}); T(`${NN(s.n)} ${s.unit}`,cx[1],yy+4.2,{size:7.4,align:'right'}); T(`${NN(s.p)} ${s.punit}`,cx[2],yy+4.2,{size:7.4,align:'right'}); T(s.obs==null?'—':NN(s.obs),cx[3],yy+4.2,{size:7.4,bold:true,align:'right'}); });
  y+=st.length*6.2+8;
  if(M.notes&&M.notes.trim()){ T('Observaciones',Mg,y,{size:10,bold:true,c:C.blue}); y+=5; doc.setFontSize(7.8); const ls=doc.splitTextToSize(M.notes.trim(),CW).slice(0,14); T(ls.join('\n'),Mg,y+1,{size:7.8}); y+=ls.length*3.5+6; }
  T('Las secciones siguientes presentan el detalle de cada formulario con sus propios criterios. Las cifras de personas no se suman entre formularios porque una misma persona puede recibir varias asistencias.',Mg,y,{size:7,c:C.grey,maxW:CW});
  { const sc=stateCounter(), inP=d=>!!d&&(!F.from||d>=F.from)&&(!F.to||d<=F.to), assist=its.some(it=>it.type!=='registro');
    its.forEach(it=>{ const o=it.obj;
      if(it.type==='registro'){ if(!assist) o.fams.forEach(f=>{ if(o.famByNum.get(f.num)===f&&inP(f.created)) (o.byFam.get(f.num)||[]).forEach(p=>sc.add(f.estado,p)); }); return; }
      if(it.type==='comunitarias') return;
      if(it.type==='nfi'||it.type==='wash'){ o.rows.forEach(a=>{ if(inP(a.fecha)) a.ps.forEach(p=>sc.add(a.estado,p)); }); return; }
      o.rows.forEach(a=>{ if(inP(a.fecha)) sc.add(a.estado,a.p||('u:'+a.pkey)); }); });
    y+=12; if(y+150>277){ doc.addPage(); y=20; }
    pdfMapBlock(doc,{x:Mg,y,w:CW,h:150,vals:sc.vals(),unit:'personas',title:assist?'Personas asistidas por estado (sin repetir dentro de cada estado)':'Personas registradas por estado de procedencia',unknown:sc.unknown()}); }
  for(const it of its){ await withCtx(it,()=>it.type==='registro'?repPdf({doc}):it.type==='comunitarias'?comPdf({doc}):(it.type==='nfi'||it.type==='wash')?nfiPdf({doc}):salPdf({doc})); }
  const n=doc.getNumberOfPages(); for(let i=1;i<=n;i++){ doc.setPage(i); stroke(C.line); doc.setLineWidth(0.3); doc.line(Mg,283,W-Mg,283);
    T(`Fuente: IMS, ${its.length} formularios (${its.map(x=>x.file).join(', ')}). Elaborado con el Depurador IMS.`,Mg,287.5,{size:6.3,c:C.grey,maxW:CW-30}); T(`Página ${i} de ${n}`,W-Mg,287.5,{size:6.3,c:C.grey,align:'right'}); }
  await saveFile(`Informe_Global_IMS${F.from&&F.to?`_${F.from}_a_${F.to}`:''}.pdf`,doc.output('blob'));
}
function mmViewExport(){
  const M=S.mm, inc=mmIncluded();
  return `<h1>Exportar</h1>
  <p class="lead">${fmt(inc.length)} formularios incluidos en las salidas globales${M.filters.from?`, del ${esc(dmy(M.filters.from))} al ${esc(dmy(M.filters.to))}`:''}.</p>
  <h2 style="margin-top:0">Limpieza de datos por archivo</h2>
  <div class="panel">${M.items.map((it,i)=>`<div class="pendrow"><div class="pendfile"><b>${esc(it.label)}</b><span class="muted">${esc(it.file)}</span></div>${mmOk(it)?`<button class="btn sm" type="button" data-mmclean="${i}">Descargar reporte</button>`:'<span class="status bad">No procesado</span>'}</div>`).join('')}</div>
  <div class="exports" style="margin-top:18px">
    <div class="exp"><h3>Power BI global</h3><p>Un solo Excel con el Registro de Familias (familias y personas), una hoja de Salud (salud y salud mental), una de Protección (protección y psicosocial), una de Comunitarias y una de Kits NFI y WASH. Cada hoja une sus formularios: las columnas comunes van juntas y las propias llevan el prefijo «(Formulario)/». Las atenciones no incluyen datos de beneficiarios: se relacionan con el Registro por el Código de caso.</p><button class="btn primary" type="button" id="mmPbi">Descargar Excel</button></div>
    <div class="exp"><h3>Informe global</h3><p>Un PDF con una portada de resultados consolidados y, a continuación, una sección por formulario con su propio análisis.</p>
      <div class="field" style="margin-bottom:8px"><label for="mmTitle">Título</label><input class="in" id="mmTitle" style="width:100%" maxlength="70" value="${esc(M.title)}"></div>
      <div class="field" style="margin-bottom:8px"><label for="mmNotes">Observaciones (opcional)</label><textarea class="in" id="mmNotes" rows="3" style="width:100%;resize:vertical" maxlength="800">${esc(M.notes)}</textarea></div>
      <button class="btn primary" type="button" id="mmPdfBtn">Descargar PDF</button></div>
    <div class="exp"><h3>SITREP</h3><p>Un Excel con el formato del SITREP: personas por sector (CCCM, Shelter and settlements, WASH, Health y Protection) y estado (La Guaira, Carabobo, Distrito Capital, Miranda y Yaracuy), cantidades de kits entregadas y totales de familias, personas y atenciones. Incluye una hoja con los criterios de cálculo.</p><button class="btn primary" type="button" id="mmSitrep">Descargar SITREP</button></div>
    <div class="exp"><h3>Tablero interactivo</h3><p>Un tablero con filtros de periodo, estado, municipio, parroquia y socio: resultados por formulario, desagregación por edad y sexo, población clave, histórico, ubicaciones y socios. Se puede exportar en PDF con los filtros aplicados.</p><button class="btn primary" type="button" data-opendash>Abrir tablero</button></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="back">Volver</button><button class="btn" type="button" id="restart">Procesar otros archivos</button></div>`;
}
function mmRefreshVerify(){ $('#main').innerHTML=mmViewVerify(); mmBind(); }
function mmBind(){
  const M=S.mm, on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  const restart=()=>{ S.mode=null; S.mm=null; S.step=1; render(); };
  if(S.step===2){
    document.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.acc; M.open=M.open===i?-1:i; mmRefreshVerify(); const el=document.querySelectorAll('.accitem')[i]; if(el) el.scrollIntoView({block:'nearest'}); });
    document.querySelectorAll('[data-accnext]').forEach(b=>b.onclick=()=>{ M.open=+b.dataset.accnext+1; mmRefreshVerify(); const el=document.querySelectorAll('.accitem')[M.open]; if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); });
    const syncV=id=>{ const [i,key]=id.split('|'), it=M.items[+i], o=it.obj, set=new Set([...document.querySelectorAll(`[data-mv="${id}"]`)].filter(b=>b.checked).map(b=>b.value));
      if(it.type==='comunitarias'){ o.valid[key]=set; comAnalyze(o); } else { o.valid=set; if(it.type==='nfi'||it.type==='wash') nfiAnalyze(o); else o.err=salAnalyze(o); } };
    document.querySelectorAll('[data-mv]').forEach(b=>b.onchange=()=>syncV(b.dataset.mv));
    document.querySelectorAll('[data-mvall]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-mv="${b.dataset.mvall}"]`).forEach(x=>x.checked=true); syncV(b.dataset.mvall); });
    document.querySelectorAll('[data-mvnone]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-mv="${b.dataset.mvnone}"]`).forEach(x=>x.checked=false); syncV(b.dataset.mvnone); });
    document.querySelectorAll('[data-mct]').forEach(b=>b.onchange=()=>{ const [i,t]=b.dataset.mct.split('|'), o=M.items[+i].obj; if(b.checked) o.sel.add(t); else o.sel.delete(t); const p=document.querySelector(`[data-mcp="${i}|${t}"]`); if(p) p.hidden=!b.checked; });
    document.querySelectorAll('[data-mki]').forEach(b=>b.onchange=()=>{ const [i,k]=b.dataset.mki.split('|').map(Number); M.items[i].obj.inc[k]=b.checked; b.closest('tr').children[1].classList.toggle('muted',!b.checked); });
    document.querySelectorAll('[data-mkc]').forEach(s=>s.onchange=()=>{ const [i,k]=s.dataset.mkc.split('|').map(Number), o=M.items[i].obj; o.cat[k]=s.value; const tb=document.querySelector(`[data-mkrows="${i}"]`); tb.innerHTML=mmKitRows(i,o); mmBind(); });
    const done=async()=>{ if(!mmOk(M.items[0])){ toast('El Registro de Familias tiene errores.'); return; } busy(true); await nextFrame(); const prev=S.step;
      try{ S.step=3; render(); }catch(e){ console.error(e); S.step=prev; render(); toast('No se pudo continuar: '+(e.message||e)); } finally{ busy(false); } };
    on('#mmDone','click',done); on('#next','click',done); on('#back','click',()=>{ S.mode=null; S.mm=null; S.step=1; render(); });
  }
  if(S.step===3){
    const dates=M.items.filter(mmOk).flatMap(it=>(it.obj.rows||it.obj.fams||[]).map(a=>a.fecha||a.created).filter(Boolean));
    bindPeriod('mm',M.filters,dates,'mmrange',()=>{ $('#mmSum').innerHTML=mmSumRows(); bindInc(); });
    const bindInc=()=>document.querySelectorAll('[data-minc]').forEach(b=>b.onchange=()=>{ const i=+b.dataset.minc; if(b.checked) M.inc.add(i); else M.inc.delete(i); }); bindInc();
    on('#back','click',()=>{ S.step=2; render(); }); on('#next','click',()=>{ S.step=4; render(); });
  }
  if(S.step===4){
    const run=fn=>async()=>{ busy(true); await nextFrame(); try{ await fn(); }catch(e){ console.error(e); toast('Error al exportar: '+(e.message||e)); } busy(false); };
    document.querySelectorAll('[data-mmclean]').forEach(b=>b.onclick=run(()=>mmExportClean(+b.dataset.mmclean)));
    on('#mmPbi','click',run(mmExportPbi)); on('#mmPdfBtn','click',run(mmPdf)); on('#mmSitrep','click',run(sitrepExport));
    on('#mmTitle','input',e=>{ M.title=e.target.value; }); on('#mmNotes','input',e=>{ M.notes=e.target.value; });
    on('#back','click',()=>{ S.step=3; render(); }); on('#restart','click',restart);
  }
}
const MULTI_MODULE={id:'multi',name:'Depurador múltiple',views:[null,null,mmViewVerify,mmViewReview,mmViewExport],bind:mmBind};
async function mmHandleFiles(list){
  const L=mmInitLoad(), files=[...list].filter(f=>/\.(xlsx|xls|xlsm)$/i.test(f.name)); if(!files.length){ toast('Selecciona archivos .xlsx o .xls descargados del IMS.'); return; }
  busy(true); await nextFrame();
  for(const f of files){ try{ const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}), det=detectForm(wb);
      if(det==='registro'){ if(L[0].f) toast(`Ya hay un Registro de Familias; se reemplazó por ${f.name}.`); Object.assign(L[0],{f,wb,det}); continue; }
      const type=det==='generic'?'':det, same=type?L.slice(1).find(r=>r.type===type&&r.f):null;
      if(same){ toast(`Ya había un archivo de ${mmLabel(type)}; se reemplazó por ${f.name}.`); Object.assign(same,{f,wb,det}); continue; }
      const empty=L.slice(1).find(r=>!r.f);
      if(empty) Object.assign(empty,{f,wb,det,type:type||empty.type}); else L.push({type,f,wb,det});
      if(det==='generic') toast(`No se reconoció ${f.name}: elige su tipo en la lista.`);
    }catch(e){ console.error(e); toast(`No se pudo leer ${f.name}.`); } }
  busy(false); render();
}
function mmLoadBind(){
  { const d=$('#mmDrop'), inp=$('#mmMulti'); if(d){ d.onclick=()=>inp.click(); d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); inp.click(); } };
      d.ondragover=e=>{ e.preventDefault(); d.classList.add('over'); }; d.ondragleave=()=>d.classList.remove('over'); d.ondrop=e=>{ e.preventDefault(); d.classList.remove('over'); mmHandleFiles(e.dataTransfer.files); };
      inp.onchange=()=>{ mmHandleFiles(inp.files); inp.value=''; }; } }
  const L=mmInitLoad(), re=()=>render();
  document.querySelectorAll('[data-mmtype]').forEach(s=>s.onchange=()=>{ L[+s.dataset.mmtype].type=s.value; re(); });
  document.querySelectorAll('[data-mmfile]').forEach(inp=>inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const r=L[+inp.dataset.mmfile]; busy(true); await nextFrame();
    try{ r.wb=XLSX.read(await f.arrayBuffer(),{type:'array'}); r.f=f; r.det=detectForm(r.wb); if(!r.fixed&&!r.type&&r.det!=='generic'&&r.det!=='registro') r.type=r.det; }catch(e){ toast(`No se pudo leer ${f.name}.`); } busy(false); re(); });
  document.querySelectorAll('[data-mmdel]').forEach(b=>b.onclick=()=>{ L.splice(+b.dataset.mmdel,1); re(); });
  const add=$('#mmAdd'); if(add) add.onclick=()=>{ L.push({type:'',f:null,wb:null,det:null}); re(); };
  const mode=$('#mmMode'); if(mode) mode.onclick=()=>{ S.loadMode=null; re(); };
  const go=$('#mmGo'); if(go) go.onclick=mmProcess;
}

