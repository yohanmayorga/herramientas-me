/* Herramientas M&E · Actividades comunitarias */
/* ============ Módulo: Actividades comunitarias ============ */
const COM_COLS={
  code:{m:'code',l:'Código'}, createdBy:{m:'created_by',l:'Created User'}, facil:{m:'person',l:'Persona Facilitadora'},
  fecha:{m:'start_date',l:'Fecha de la actividad',req:1}, estado:{m:'states',l:'Estado',req:1}, municipio:{m:'municipalities',l:'Municipio',req:1}, parroquia:{m:'parishes',l:'Parroquia',req:1},
  isAloj:{m:'is_alojamiento',l:'¿Se realiza en un alojamiento?',req:1}, alojamiento:{m:'alojamiento',l:'Alojamiento',req:1}, comunidad:{m:'communities',l:'Comunidad',req:1},
  lng:{m:'location_gps_lng',l:'Ubicación (longitud)',req:1}, lat:{m:'location_gps_lat',l:'Ubicación (latitud)',req:1},
  proyecto:{m:'projects_vzl',l:'Proyectos',req:1}, socio:{m:'implement_partner',l:'Socio Implementador',req:1}, modal:{m:'modality',l:'Modalidad',req:1},
  material:{m:'material_distributed',l:'Material distribuido',req:1}, cAfiches:{m:'can_afiches',l:'Cantidad de afiches',req:1}, cTripticos:{m:'can_tripticos',l:'Cantidad de trípticos',req:1},
  cDesplegables:{m:'can_desplegables',l:'Cantidad de desplegables',req:1}, cPendones:{m:'can_pendones',l:'Cantidad de pendones',req:1}, cIndigena:{m:'can_material',l:'Cantidad material en lengua indígena'},
  cOtro:{m:'can_otro',l:'Cantidad de otro material distribuido',req:1}, tipoAct:{m:'type_activity_now',l:'Tipo de actividad',req:1},
  riskYN:{m:'is_risk_management',l:'Se va a aplicar una gestion de riesgos?',req:1}, riesgo:{m:'risk_management',l:'Gestion de riesgos',req:1},
  actWash:{m:'wash_activity',l:'Actividades de wash',req:1}, actProt:{m:'protection_activity',l:'Actividades de proteccion',req:1},
  actSal:{m:'healty_activity',l:'Actividades de salud y SMAPS',req:1}, actSal2:{m:'healty_activity_oim_ucab_vdt',l:'Actividades de salud y SMAPS (OIM / UCAB / VDT)'},
  temas:{m:'topic_aborded',l:'Temas Abordados',req:1}, desag:{m:'disintegration',l:'Desagregación por sexo y grupo de edad',req:1},
  ninos:{m:'boys_number',l:'Número de niños 0 a 17 años',req:1}, mujeres:{m:'woman_number',l:'Número de mujeres 18 a 59 años',req:1}, hombres:{m:'man_number',l:'Número de hombres 18 a 59 años',req:1},
  mujeres60:{m:'old_woman_number',l:'Número de mujeres 60 años o más',req:1}, hombres60:{m:'old_man_number',l:'Número de hombres 60 años o más',req:1}, ninas:{m:'girls_number',l:'Número de niñas 0 a 17 años',req:1},
  nr:{m:'other_number',l:'Número de personas que prefieren no responder'},
  grupos:{m:'town_group',l:'Grupos poblacionales',req:1}, recurr:{m:'current_person',l:'¿Actividad con participantes recurrentes?',req:1},
  canales:{m:'channel_information',l:'¿Se informó sobre los canales de retroalimentación y la línea de contacto?',req:1},
  solicit:{m:'request_person',l:'Número de personas que solicitaron orientación individual con posterioridad a la actividad',req:1}};
const COM_TYPES=[
  {id:'proteccion',match:/protec/,name:'Protección',label:'Actividades de protección',act:['actProt'],own:['actProt','temas'],extra:[['#split','temas','Temas abordados']],spec:['temas','Temas abordados']},
  {id:'salud',match:/salud|smaps/,name:'Salud y SMAPS',label:'Actividades de salud y SMAPS',act:['actSal','actSal2'],own:['actSal','actSal2'],extra:[],spec:null},
  {id:'wash',match:/wash/,name:'WASH',label:'Actividades de WASH',act:['actWash'],own:['actWash','riskYN','riesgo'],extra:[['riskYN','¿Se aplicó gestión de riesgos?'],['#split','riesgo','Gestión de riesgos']],spec:['riesgo','Gestión de riesgos']}];
const COM_OWN_ALL=['actProt','temas','actSal','actSal2','actWash','riskYN','riesgo'];
const DESAG=[['Niñas de 0 a 17 años','ninas'],['Niños de 0 a 17 años','ninos'],['Mujeres de 18 a 59 años','mujeres'],['Hombres de 18 a 59 años','hombres'],['Mujeres de 60 años o más','mujeres60'],['Hombres de 60 años o más','hombres60'],['Prefiere no responder','nr']];
const MATS=[['Afiches','cAfiches'],['Trípticos','cTripticos'],['Desplegables','cDesplegables'],['Pendones','cPendones'],['Otro','cOtro']];
const COUNT_KEYS=['ninas','ninos','mujeres','hombres','mujeres60','hombres60','nr'];
const COM_CRIT=[
  ['dup','Actividades duplicadas (mismo día, socio, lugar, actividad, facilitador y participantes)'],
  ['near','Posibles duplicados (mismo día, socio, lugar, actividad y facilitador, con participantes similares)'],
  ['socio','Socio implementador no válido para el tipo de actividad'],
  ['fecha','Fecha de la actividad vacía, futura o muy antigua'],
  ['act','Sin actividad específica registrada'],
  ['tema','Datos propios del tipo de actividad incompletos (tema abordado o gestión de riesgos)'],
  ['ajena','Respuestas en preguntas de otro tipo de actividad'],
  ['desag','Desagregación por sexo y edad inconsistente con los números'],
  ['cero','Sin participantes registrados'],
  ['alto','Número de participantes inusualmente alto (más de 300)'],
  ['solic','Solicitudes de orientación individual mayores que los participantes'],
  ['mat','Material distribuido inconsistente con las cantidades'],
  ['aloj','En alojamiento sin el nombre del alojamiento'],
  ['geo','Coordenadas vacías o fuera de Venezuela']];
const COM_CATS=[['socio','Socio implementador'],['estado','Estado'],['municipio','Municipio'],['parroquia','Parroquia'],['alojamiento','Alojamiento'],['proyecto','Proyecto']];
const COM_BASE1=[['code','Código'],['fecha','Fecha de la actividad','date'],['tipoAct','Tipo de actividad'],['estado','Estado'],['municipio','Municipio'],['parroquia','Parroquia'],['isAloj','¿Se realiza en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['latV','Latitud'],['lngV','Longitud'],['proyecto','Proyecto'],['socio','Socio Implementador'],['modal','Modalidad']];
const COM_BASE2=[['#split','material','Material distribuido'],['cAfiches','Cantidad de afiches'],['cTripticos','Cantidad de trípticos'],['cDesplegables','Cantidad de desplegables'],['cPendones','Cantidad de pendones'],['cIndigena','Cantidad de material en lengua indígena'],['cOtro','Cantidad de otro material'],
  ['ninas','Niñas 0 a 17 años'],['ninos','Niños 0 a 17 años'],['mujeres','Mujeres 18 a 59 años'],['hombres','Hombres 18 a 59 años'],['mujeres60','Mujeres 60 años o más'],['hombres60','Hombres 60 años o más'],['nr','Prefiere no responder'],['total','Total de participantes'],
  ['#split','grupos','Grupos poblacionales'],['recurr','¿Actividad con participantes recurrentes?'],['canales','¿Se informó sobre los canales de retroalimentación?'],['solicit','Personas que solicitaron orientación individual']];
const ZERO_KEYS=new Set(['cAfiches','cTripticos','cDesplegables','cPendones','cIndigena','cOtro','ninas','ninos','mujeres','hombres','mujeres60','hombres60','nr','total','solicit']);

function comSheetName(wb){ return wb.SheetNames.find(n=>{ const h=peekRows(wb.Sheets[n],2).flat().map(x=>String(x??'')); return h.includes('type_activity_now')&&h.includes('disintegration'); })
  || wb.SheetNames.find(n=>{ const h=peekRows(wb.Sheets[n],2).flat().map(x=>fold(x)); return h.includes('tipo de actividad')&&h.includes('desagregacion por sexo y grupo de edad'); }); }
function comDetect(wb){ return !!comSheetName(wb); }
const tokens=s=>(s||'').split('; ').filter(Boolean);
function comLoad(wb,fileName){
  const C={file:fileName,check:[],fatal:[]};
  const sn=comSheetName(wb)||wb.SheetNames[0], sh=imsSheet(wb.Sheets[sn]); sh.idx={};
  for(const [k,c] of Object.entries(COM_COLS)){ const loc=locateCol(sh,c); sh.idx[k]=loc.idx;
    C.check.push({label:c.l,how:loc.how,col:loc.idx>=0?XLSX.utils.encode_col(loc.idx):'',found:loc.idx>=0,req:!!c.req}); if(loc.idx<0&&c.req) C.fatal.push(c.l); }
  if(C.fatal.length) return C;
  const g=(x,k)=>sh.idx[k]>=0?x.r[sh.idx[k]]:null, num=v=>{ const n=toNum(v); return n===undefined?null:n; };
  const types=new Map(COM_TYPES.map(t=>[t.id,{...t,count:0}]));
  C.rows=sh.rows.map(x=>{
    const a={n:x.n};
    for(const k of ['code','createdBy','facil','estado','municipio','parroquia','isAloj','alojamiento','comunidad','proyecto','socio','modal','tipoAct','riskYN','recurr','canales']) a[k]=toText(g(x,k));
    for(const k of ['material','riesgo','actWash','actProt','actSal','actSal2','temas','desag','grupos']) a[k]=multi(g(x,k));
    for(const k of ['cAfiches','cTripticos','cDesplegables','cPendones','cIndigena','cOtro','ninos','mujeres','hombres','mujeres60','hombres60','ninas','nr','solicit','lat','lng']) a[k]=num(g(x,k));
    a.fecha=cellYMD(g(x,'fecha'));
    let td=COM_TYPES.find(t=>t.match.test(fold(a.tipoAct)));
    if(!td){ const id='otro_'+snake(a.tipoAct||'sin tipo'); if(!types.has(id)) types.set(id,{id,name:a.tipoAct||'Sin tipo de actividad',label:a.tipoAct||'Sin tipo de actividad',act:[],own:[],extra:[],spec:null,count:0}); td=types.get(id); }
    else td=types.get(td.id);
    td.count++; a.type=td.id;
    a.act=[...new Set(td.act.flatMap(k=>tokens(a[k])))].join('; ')||null;
    a.total=COUNT_KEYS.reduce((t,k)=>t+(a[k]||0),0);
    a.geoOk=a.lat!=null&&a.lng!=null&&a.lat>=0.5&&a.lat<=12.6&&a.lng>=-73.5&&a.lng<=-59.5;
    a.latV=a.geoOk?a.lat:null; a.lngV=a.geoOk?a.lng:null;
    a.desagSet=new Set(tokens(a.desag).map(fold)); a.matSet=new Set(tokens(a.material).map(fold));
    return a; });
  C.types=[...types.values()].filter(t=>t.count);
  C.nrUsed=C.rows.some(a=>a.nr!=null);
  C.sel=new Set(C.types.map(t=>t.id));
  C.socios={}; C.valid={};
  C.types.forEach(t=>{ C.socios[t.id]=countBy(C.rows.filter(a=>a.type===t.id),a=>a.socio||'(vacío)'); C.valid[t.id]=new Set(C.socios[t.id].map(([s])=>fold(s))); });
  C.minValid=validFrom(C.rows.map(a=>a.fecha)); dateRange(C);
  C.filters={from:C.minDate,to:C.maxDate,cats:{}};
  comAnalyze(C);
  return C;
}
function comTypeDef(id){ return S.com.types.find(t=>t.id===id); }
function comAnalyze(C){
  const crit=new Map(COM_CRIT);
  C.rows.forEach(a=>{
    const td=C.types.find(t=>t.id===a.type), out=[], add=(k,d)=>out.push({k,d});
    if(!C.valid[a.type].has(fold(a.socio||'(vacío)'))) add('socio',`Socio «${a.socio||'vacío'}» no marcado como válido para ${td.name}`);
    { const dp=dateProblem(a.fecha,C.minValid); if(dp) add('fecha',dp); }
    if(td.act.length&&!a.act) add('act','Sin actividad específica registrada');
    if(td.id==='proteccion'&&!a.temas) add('tema','Sin tema abordado');
    if(td.id==='wash'&&fold(a.riskYN)==='si'&&!a.riesgo) add('tema','Indica gestión de riesgos sin el tipo de gestión');
    const foreign=COM_OWN_ALL.filter(k=>!td.own.includes(k)&&a[k]); if(foreign.length) add('ajena',`Tiene datos en: ${foreign.map(k=>COM_COLS[k].l).join(', ')}`);
    DESAG.forEach(([lab,k])=>{ if(k==='nr'&&!C.nrUsed) return; const marked=a.desagSet.has(fold(lab)), has=(a[k]||0)>0; if(marked&&!has) add('desag',`${lab}: marcado sin número`); if(!marked&&has) add('desag',`${lab}: ${a[k]} personas sin marcar en la desagregación`); });
    if(!a.total) add('cero','Sin participantes registrados');
    if(a.total>300) add('alto',`${a.total} participantes`);
    if(a.solicit&&a.total&&a.solicit>a.total) add('solic',`${a.solicit} solicitudes y ${a.total} participantes`);
    MATS.forEach(([lab,k])=>{ const marked=a.matSet.has(fold(lab)), q=(a[k]||0)>0; if(marked&&!q) add('mat',`${lab}: marcado sin cantidad`); if(!marked&&q) add('mat',`${lab}: cantidad ${a[k]} sin marcar como material distribuido`); });
    if(a.matSet.has('ninguno')&&a.matSet.size>1) add('mat','«Ninguno» marcado junto con otros materiales');
    if(fold(a.isAloj)==='si'&&!a.alojamiento) add('aloj','Indica que se realiza en un alojamiento sin el nombre del alojamiento');
    if(!a.geoOk) add('geo',a.lat==null||a.lng==null?'Sin coordenadas':`Coordenadas fuera de Venezuela (latitud ${a.lat}, longitud ${a.lng})`);
    a.issues=out; });
  // Duplicados: mismo día, socio, lugar, actividad y persona facilitadora
  const place=a=>[a.type,a.fecha,fold(a.socio),fold(a.parroquia),fold(a.comunidad),fold(a.alojamiento),fold(a.act),fold(a.facil)].join('|');
  const byPlace=new Map(); C.rows.forEach(a=>{ if(!a.fecha) return; const k=place(a); if(!byPlace.has(k)) byPlace.set(k,[]); byPlace.get(k).push(a); });
  const spec=a=>{ const td=C.types.find(t=>t.id===a.type); return td&&td.spec?fold(a[td.spec[0]]):''; };
  for(const g of byPlace.values()){ if(g.length<2) continue;
    const ck=a=>COUNT_KEYS.map(x=>a[x]||0).join(','), exact=new Set();
    g.forEach(a=>{ const tw=g.filter(b=>b!==a&&ck(b)===ck(a)); if(tw.length){ exact.add(a); a.issues.unshift({k:'dup',d:`Igual a: ${tw.map(b=>b.code).join(', ')}`}); } });
    g.forEach(a=>{ if(exact.has(a)) return; const nr=g.filter(b=>b!==a&&!exact.has(b)&&spec(b)===spec(a)&&Math.abs(b.total-a.total)<=2);
      if(nr.length) a.issues.unshift({k:'near',d:`Mismo día, socio, lugar, actividad y facilitador, con participantes similares: ${nr.map(b=>`${b.code} (${b.total})`).join(', ')}`}); }); }
}
function comPass(a,F,types){
  if(!types.has(a.type)) return false;
  if(F.from||F.to){ if(!a.fecha) return false; if(F.from&&a.fecha<F.from) return false; if(F.to&&a.fecha>F.to) return false; }
  for(const k in F.cats){ const s=F.cats[k]; if(s&&s.size&&!s.has(a[k]??'(vacío)')) return false; }
  return true;
}
function comSelRows(){ const C=S.com; return C.rows.filter(a=>comPass(a,C.filters,C.sel)); }
function comSummary(rows){
  const C=S.com, types=C.types.filter(t=>C.sel.has(t.id));
  return COM_CRIT.map(([k,l])=>[l,...types.map(t=>rows.filter(a=>a.type===t.id&&a.issues.some(i=>i.k===k)).length)]);
}
function splitOpts(rows,k){ const cnt=new Map(); rows.forEach(a=>tokens(a[k]).forEach(t=>cnt.set(t,(cnt.get(t)||0)+1)));
  const out=[], seen=new Set(); [...cnt.entries()].sort((x,y)=>y[1]-x[1]).forEach(([t])=>{ const f=fold(t); if(!seen.has(f)){ seen.add(f); out.push(t); } }); return out; }
function comTable(rows,spec){
  const opts={}; spec.filter(e=>e[0]==='#split').forEach(e=>{ opts[e[1]]=splitOpts(rows,e[1]); });
  const cols=spec.flatMap(e=>e[0]==='#split'?opts[e[1]].map(o=>({h:`${e[2]}/${o}`,base:e[2],split:true})):[{h:e[1],type:e[2]}]);
  const data=rows.map(a=>{ const sets={}; return spec.flatMap(e=>{ if(e[0]==='#split'){ const st=sets[e[1]]||(sets[e[1]]=new Set(tokens(a[e[1]]).map(fold))); return opts[e[1]].map(o=>st.has(fold(o))?1:0); }
    const v=a[e[0]]; return [v==null&&ZERO_KEYS.has(e[0])?0:v]; }); });
  return {cols,data};
}
const comTypeSpec=td=>[...COM_BASE1,...(td.act.length?[['#split','act','Actividad']]:[]),...td.extra,...COM_BASE2];
const sheetName=s=>s.replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31);
async function comExportPbi(kind){
  const C=S.com, rows=comSelRows(), types=C.types.filter(t=>C.sel.has(t.id)), F=C.filters, tag=F.from&&F.to?`_${F.from}_a_${F.to}`:'';
  if(kind==='csv'){ const {cols,data}=comTable(rows,comTypeSpec(types[0])); const csv='\ufeff'+XLSX.utils.sheet_to_csv(buildSheet(cols,data),{FS:',',RS:'\r\n'});
    await saveFile(`Actividades_Comunitarias_${snake(types[0].name)}_PowerBI${tag}.csv`,new Blob([csv],{type:'text/csv'})); return; }
  const wb=XLSX.utils.book_new();
  if(types.length>1){ const {cols,data}=comTable(rows,[...COM_BASE1,...COM_BASE2]); XLSX.utils.book_append_sheet(wb,buildSheet(cols,data),'Consolidado'); }
  types.forEach(t=>{ const {cols,data}=comTable(rows.filter(a=>a.type===t.id),comTypeSpec(t)); XLSX.utils.book_append_sheet(wb,buildSheet(cols,data),sheetName(t.name)); });
  await saveFile(`Actividades_Comunitarias_PowerBI${tag}.xlsx`,xlsxBlob(wb));
}
async function comExportErrors(){
  const C=S.com, rows=comCleanRows(), types=C.types.filter(t=>C.sel.has(t.id)), wb=XLSX.utils.book_new(), order=new Map(COM_CRIT.map(([k],i)=>[k,i])), lab=new Map(COM_CRIT);
  const sum=comSummary(rows), cols=[{h:'Descripción'},...types.map(t=>({h:t.name}))];
  if(types.length>1){ cols.push({h:'Total'}); sum.forEach(r=>r.push(r.slice(1).reduce((x,y)=>x+y,0))); }
  XLSX.utils.book_append_sheet(wb,buildSheet(cols,sum),'Resumen');
  types.forEach(t=>{ const lines=rows.filter(a=>a.type===t.id).flatMap(a=>a.issues.map(i=>({a,i}))).sort((x,y)=>order.get(x.i.k)-order.get(y.i.k)||(x.a.fecha||'').localeCompare(y.a.fecha||''));
    XLSX.utils.book_append_sheet(wb,buildSheet([{h:'Problema'},{h:'Detalle'},{h:'Código'},{h:'Fila en el Excel'},{h:'Fecha de la actividad',type:'date'},{h:'Socio Implementador'},{h:'Parroquia'},{h:'Comunidad'},{h:'Alojamiento'},{h:'Cargado por'}],
      lines.map(({a,i})=>[lab.get(i.k),i.d,a.code,a.n,a.fecha||null,a.socio,a.parroquia,a.comunidad,a.alojamiento,a.createdBy])),sheetName(t.name)); });
  await saveFile(`Actividades_Comunitarias_Errores_${TODAY_YMD}.xlsx`,xlsxBlob(wb));
}

/* --- Vistas --- */
function comViewVerify(){
  const C=S.com;
  const ledger=C.check.map(c=>`<tr class="${c.req?'req':''}"><td>${esc(c.label)}</td><td data-label="Columna">${c.found?`${esc(c.col)} <span class="muted">· ${esc(c.how)}</span>`:'—'}</td><td data-label="Estado">${c.found?'<span class="status ok">Encontrada</span>':(c.req?'<span class="status bad">Falta</span>':'<span class="status mute">No está</span>')}</td></tr>`).join('');
  if(C.fatal.length) return `<h1>Actividades comunitarias</h1><div class="note bad">Faltan columnas necesarias: ${esc(C.fatal.join(', '))}.</div><div class="scroll"><table class="ledger"><thead><tr><th>Campo</th><th>Columna</th><th>Estado</th></tr></thead><tbody>${ledger}</tbody></table></div><div class="actions"><button class="btn" type="button" id="back">Cargar otro archivo</button></div>`;
  const tot=C.rows.reduce((t,a)=>t+a.total,0);
  return `<h1>Actividades comunitarias</h1>
  <p class="lead">Son actividades grupales, por lo que no se vinculan con el Registro de Familias. Elige qué tipos de actividad vas a revisar y valida los socios de cada uno; cada tipo se procesa con sus propios criterios.</p>
  <div class="facts"><div><b>${fmt(C.rows.length)}</b><span>Actividades</span></div><div><b>${fmt(tot)}</b><span>Participantes</span></div><div><b>${esc(C.minDate?dmy(C.minDate):'—')}</b><span>Primera actividad</span></div><div><b>${esc(C.maxDate?dmy(C.maxDate):'—')}</b><span>Última actividad</span></div></div>
  <h2>¿Qué tipo de actividad quieres revisar?</h2>
  <div class="panel"><div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" id="ctAll">Todas</button><button class="btn sm" type="button" id="ctNone">Ninguna</button></div>
    ${C.types.map(t=>`<label class="check"><input type="checkbox" data-ctype="${t.id}" ${C.sel.has(t.id)?'checked':''}> ${esc(t.label)} <span class="muted">(${fmt(t.count)} actividades)</span></label>`).join('')}
    <p class="muted" style="font-size:13px;margin:8px 0 0">Con más de un tipo, la limpieza de datos y la tabla para Power BI se organizan en una pestaña por tipo, y el informe en una sección por tipo.</p></div>
  ${C.types.map(t=>`<div data-socpanel="${t.id}" ${C.sel.has(t.id)?'':'hidden'}><h2>Socios válidos · ${esc(t.name)}</h2><div class="panel">
    <p class="muted" style="margin:0 0 8px;font-size:14px">Desmarca los socios que no deberían realizar este tipo de actividad. Sus actividades se reportan en la limpieza, pero se incluyen igual en Power BI y en el informe.</p>
    <div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" data-vall="${t.id}">Seleccionar todos</button><button class="btn sm" type="button" data-vnone="${t.id}">Quitar todos</button></div>
    ${C.socios[t.id].map(([x,n])=>`<label class="check"><input type="checkbox" data-cvalid="${t.id}" value="${esc(fold(x))}" ${C.valid[t.id].has(fold(x))?'checked':''}> ${esc(x)} <span class="muted">(${fmt(n)} actividades)</span></label>`).join('')}</div></div>`).join('')}
  <h2>Columnas utilizadas</h2>
  <div class="scroll"><table class="ledger"><thead><tr><th>Campo</th><th>Columna</th><th>Estado</th></tr></thead><tbody>${ledger}</tbody></table></div>
  <p class="muted" style="font-size:13px;margin:8px 0 0">* Obligatorias. Se ignoran la lista de asistencia, los campos de texto libre y las columnas que el IMS marca como “No está en uso”.</p>
  <div class="actions"><button class="btn" type="button" id="back">Cargar otro archivo</button><button class="btn primary" type="button" id="next" ${C.sel.size?'':'disabled'}>Continuar</button></div>`;
}
function comCleanRows(){ const C=S.com, F=C.filters, base=C.rows.filter(a=>comPass(a,F,C.sel)), inB=new Set(base);
  return base.concat(C.rows.filter(a=>!inB.has(a)&&a.issues.some(i=>i.k==='fecha')&&comPass(a,{...F,from:'',to:''},C.sel))); }
function comSumTable(rows){
  const C=S.com, types=C.types.filter(t=>C.sel.has(t.id)), sum=comSummary(rows);
  return `<table><thead><tr><th>Descripción</th>${types.map(t=>`<th class="num">${esc(t.name)}</th>`).join('')}</tr></thead><tbody>${sum.map(r=>`<tr><td style="white-space:normal">${esc(r[0])}</td>${r.slice(1).map(n=>`<td class="num"><span class="status ${n?(r[0].startsWith('Posibles')||r[0].includes('inusualmente')?'warn':'bad'):'ok'}">${fmt(n)}</span></td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function comViewReview(){
  const C=S.com, F=C.filters, base=C.rows.filter(a=>C.sel.has(a.type)), rows=comSelRows(), {cols,data}=comTable(rows,[...COM_BASE1,...COM_BASE2]);
  const C2=cols.slice(0,22);
  return `<h1>Datos a procesar</h1>
  <p class="lead">Tipos seleccionados: ${esc(C.types.filter(t=>C.sel.has(t.id)).map(t=>t.name).join(', '))}. El periodo y los criterios se aplican a la limpieza de datos y a la tabla para Power BI.</p>
  <h2 style="margin-top:0">Incidencias encontradas <span class="muted" style="font-weight:400;font-size:14px">(actividades)</span></h2>
  <div class="scroll" id="comSum">${comSumTable(comCleanRows())}</div>
  <div class="grid2" style="margin-top:8px">
    <div><h2>Periodo de la actividad</h2><div class="panel">${periodPanel('c',C.minDate,C.maxDate,F,base.map(a=>a.fecha),'crange','Según la Fecha de la actividad.')}</div></div>
    <div><h2>Criterios</h2>${COM_CATS.map(([k,l])=>catBlock('c',k,l,base,F.cats[k],'actividades')).join('')}</div>
  </div>
  <h2>Vista previa <span class="muted" style="font-weight:400;font-size:14px">(<span id="cN">${fmt(rows.length)}</span> actividades; primeras 50 y columnas comunes)</span></h2>
  <div class="scroll" style="max-height:420px"><table><thead><tr>${C2.map(c=>`<th>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${data.slice(0,50).map(r=>`<tr>${C2.map((c,i)=>`<td class="${typeof r[i]==='number'?'num':''}">${esc(r[i]??'')}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${C2.length}" class="muted">Ninguna actividad cumple los filtros.</td></tr>`}</tbody></table></div>
  <div class="actions"><button class="btn" type="button" id="back">Volver</button><button class="btn primary" type="button" id="next">Continuar a exportar</button></div>`;
}
function comViewExport(){
  const C=S.com; if(C.view==='report') return comViewReport();
  const n=comSelRows().length, types=C.types.filter(t=>C.sel.has(t.id)), multiT=types.length>1;
  return `<h1>Exportar</h1>
  <p class="lead">${fmt(n)} actividades de ${esc(types.map(t=>t.name).join(', '))}.</p>
  <div class="exports">
    <div class="exp"><h3>Limpieza de datos</h3><p>Un Excel con el resumen${multiT?' por tipo de actividad y una pestaña por tipo':' y una pestaña de incidencias'}: duplicados, socios no válidos, fechas, actividades y temas faltantes, respuestas de otro tipo, desagregación por sexo y edad, material distribuido, alojamiento y coordenadas. No modifica el archivo original.</p><button class="btn primary" type="button" id="exErr">Descargar reporte</button></div>
    <div class="exp"><h3>Tabla para Power BI</h3><p>Una fila por actividad con ubicación, coordenadas válidas, socio, participantes por sexo y edad y una columna 1/0 por cada opción de actividad, tema, material y grupo poblacional.${multiT?' Incluye una hoja Consolidado con las columnas comunes y una hoja por tipo con sus columnas propias.':''}</p><div class="row"><button class="btn primary" type="button" id="exPbi" ${n?'':'disabled'}>Descargar Excel</button>${multiT?'':`<button class="btn" type="button" id="exCsv" ${n?'':'disabled'}>Descargar CSV</button>`}</div></div>
    <div class="exp"><h3>Construir informe</h3><p>Un PDF con el análisis de las actividades${multiT?', con una sección por tipo de actividad':''}: participantes, actividades realizadas, lugares, grupos poblacionales, material, socios y calidad de los datos.</p><button class="btn primary" type="button" id="exRep">Construir informe</button></div>
    <div class="exp"><h3>Tablero interactivo</h3><p>Un tablero con filtros de periodo, estado, municipio, parroquia y socio: resultados por formulario, desagregación por edad y sexo, población clave, histórico, ubicaciones y socios. Se puede exportar en PDF con los filtros aplicados.</p><button class="btn primary" type="button" data-opendash>Abrir tablero</button></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a filtros</button><button class="btn" type="button" id="restart">Procesar otro archivo</button></div>`;
}

/* --- Informe --- */
function comRepInit(){ const C=S.com; if(!C.rep){ let logo=null; try{ logo=JSON.parse(localStorage.getItem(LOGO_KEY)||'null'); }catch(e){}
  C.rep={types:new Set(C.sel),from:C.minDate,to:C.maxDate,cats:{},title:'Informe de actividades comunitarias',notes:'',logo}; }
  C.rep.types=new Set([...C.rep.types].filter(t=>C.sel.has(t))); if(!C.rep.types.size) C.rep.types=new Set(C.sel); return C.rep; }
function comRepRows(){ const C=S.com, R=comRepInit(); return C.rows.filter(a=>comPass(a,R,R.types)); }
function comRepFacts(rows){ return `<div><b>${fmt(rows.length)}</b><span>Actividades</span></div><div><b>${fmt(rows.reduce((t,a)=>t+a.total,0))}</b><span>Participantes</span></div><div><b>${fmt(new Set(rows.map(a=>a.type)).size)}</b><span>Tipos de actividad</span></div><div class="${rows.some(a=>a.issues.length)?'warn':'ok'}"><b>${fmt(rows.filter(a=>a.issues.length).length)}</b><span>Actividades con observaciones</span></div>`; }
function comViewReport(){
  const C=S.com, R=comRepInit(), base=C.rows.filter(a=>C.sel.has(a.type));
  return `<h1>Construir informe</h1>
  <p class="lead">Genera un PDF con el análisis de las actividades comunitarias. Cada tipo de actividad se presenta en su propia sección, con sus propios criterios.</p>
  <div class="facts" id="cRepFacts">${comRepFacts(comRepRows())}</div>
  <div class="grid2">
    <div><h2 style="margin-top:0">Tipos de actividad</h2><div class="panel">${C.types.filter(t=>C.sel.has(t.id)).map(t=>`<label class="check"><input type="checkbox" data-rtype="${t.id}" ${R.types.has(t.id)?'checked':''}> ${esc(t.label)}</label>`).join('')}</div>
      <h2>Periodo</h2><div class="panel">${periodPanel('cr',C.minDate,C.maxDate,R,base.map(a=>a.fecha),'crrange','')}</div>
      <h2>Socio y ubicación</h2>${COM_CATS.map(([k,l])=>catBlock('cr',k,l,base,R.cats[k],'actividades')).join('')}</div>
    <div><h2 style="margin-top:0">Contenido</h2><div class="panel">
      <div class="field" style="margin-bottom:12px"><label for="rTitle">Título del informe</label><input class="in" id="rTitle" style="width:100%" maxlength="70" value="${esc(R.title)}"></div>
      <div class="field" style="margin-bottom:12px"><label for="rNotes">Observaciones (opcional)</label><textarea class="in" id="rNotes" rows="4" style="width:100%;resize:vertical" maxlength="600" placeholder="Contexto, logros o limitaciones que deban acompañar las cifras.">${esc(R.notes)}</textarea></div>
      <div class="field"><label>Logo (opcional)</label><div class="row">${R.logo?`<img src="${R.logo.data}" alt="Logo cargado" style="height:36px;max-width:120px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px;padding:3px"><button class="btn sm" type="button" id="rLogoDel">Quitar logo</button>`:''}
        <label class="btn sm"><input type="file" id="rLogo" accept="image/png,image/jpeg" hidden>${R.logo?'Cambiar logo':'Cargar logo PNG o JPG'}</label></div></div>
    </div></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="rBack">Volver a exportar</button><button class="btn primary" type="button" id="rPdf">Descargar PDF</button></div>`;
}
async function comPdf(ext){
  if(!window.jspdf||!window.jspdf.jsPDF){ toast('No se pudo cargar el generador de PDF. Revisa la conexión y recarga la página.'); return; }
  const C=S.com, R=comRepInit(), rows=comRepRows(); if(!rows.length){ if(!ext) toast('No hay actividades con los criterios seleccionados.'); return; }
  const types=C.types.filter(t=>R.types.has(t.id)&&rows.some(a=>a.type===t.id));
  const doc=ext?ext.doc:new window.jspdf.jsPDF({unit:'mm',format:'a4'}), W=210, M=14, CW=W-2*M, LX=M, RX=M+CW/2+4, HW=CW/2-4; if(ext) doc.addPage();
  const Cc={blue:[0,51,160],blue2:[65,143,222],pale:[231,238,249],ink:[34,43,69],grey:[107,114,128],line:[217,223,234],amber:[226,149,0],white:[255,255,255]};
  const fill=c=>doc.setFillColor(...c), stroke=c=>doc.setDrawColor(...c), color=c=>doc.setTextColor(...c);
  const T=(s,x,y,o={})=>{ doc.setFont('helvetica',o.bold?'bold':'normal'); doc.setFontSize(o.size||8); color(o.c||Cc.ink); doc.text(String(s),x,y,{align:o.align||'left',maxWidth:o.maxW}); };
  const fit=(s,w,size,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(size); s=String(s); if(doc.getTextWidth(s)<=w) return s; while(s.length>1&&doc.getTextWidth(s+'…')>w) s=s.slice(0,-1); return s+'…'; };
  const N=n=>Number(n).toLocaleString('es-VE');
  const section=(t,x,y)=>{ T(t,x,y,{size:9.5,bold:true,c:Cc.blue}); stroke(Cc.blue2); doc.setLineWidth(0.5); doc.line(x,y+1.6,x+12,y+1.6); return y+6; };
  const bars=(items,x,y,w,o={})=>{ const rowH=5.3, lw=o.lw||w*0.46, vw=o.total?28:16, bw=w-lw-vw-2, max=Math.max(1,...items.map(i=>i[1]));
    items.forEach(([l,v],i)=>{ const yy=y+i*rowH; { const L=String(l); doc.setFont('helvetica','normal'); doc.setFontSize(7.2); if(doc.getTextWidth(L)<=lw-2) T(L,x,yy+3.4,{size:7.2}); else { const fs=rowH>=5.6?6.2:5.8; doc.setFontSize(fs); let ls=doc.splitTextToSize(L,lw-2); if(ls.length>2) ls=[ls[0],fit(ls.slice(1).join(' '),lw-2,fs)]; const lh=fs*0.406; T(ls.join('\n'),x,yy+(rowH-lh*ls.length)/2+fs*0.3528*0.8+0.3,{size:fs}); } } fill(Cc.pale); doc.rect(x+lw,yy+0.8,bw,3.6,'F'); if(v>0){ fill(o.c||Cc.blue); doc.rect(x+lw,yy+0.8,Math.max(0.6,bw*v/max),3.6,'F'); }
      T(N(v),x+w-(o.total?13:0),yy+3.4,{size:7.2,bold:true,align:'right'}); if(o.total) T(pct(v,o.total),x+w,yy+3.4,{size:6.8,c:Cc.grey,align:'right'}); }); return y+items.length*rowH; };
  const PG={top:20,bottom:277};
  const newPage=()=>{ doc.addPage(); fill(Cc.blue); doc.rect(0,0,W,11,'F'); fill(Cc.blue2); doc.rect(0,11,W,0.8,'F'); T(fit(R.title||'',CW,9,true),M,7.2,{size:9,bold:true,c:Cc.white}); return PG.top; };
  const need=(y,h)=>y+h>PG.bottom?newPage():y;
  const kpis=(y,items)=>{ const kw=(CW-9)/4; items.forEach(([v,l],i)=>{ const x=M+i*(kw+3); fill(Cc.pale); doc.roundedRect(x,y,kw,21,1.5,1.5,'F'); fill(Cc.blue); doc.rect(x,y,1.2,21,'F');
    T(v,x+5,y+10,{size:17,bold:true,c:Cc.blue}); doc.setFontSize(7); T(doc.splitTextToSize(l,kw-8).slice(0,2).join('\n'),x+5,y+15.2,{size:7,c:Cc.grey}); }); return y+26; };
  // Encabezado
  fill(Cc.blue); doc.rect(0,0,W,30,'F'); fill(Cc.blue2); doc.rect(0,30,W,1.4,'F');
  let tx=M;
  if(R.logo){ try{ const h=16, w=Math.min(40,h*R.logo.w/R.logo.h); fill(Cc.white); doc.roundedRect(M,7,w+4,h+4,1.5,1.5,'F'); doc.addImage(R.logo.data,R.logo.fmt,M+2,9,w,h); tx=M+w+9; }catch(e){ console.warn(e); } }
  T(fit(R.title||'Informe de actividades comunitarias',W-M-tx-58,15,true),tx,14,{size:15,bold:true,c:Cc.white});
  T('Actividades comunitarias · IMS',tx,20.5,{size:8.5,c:[214,226,248]});
  T('PERIODO',W-M,11.5,{size:6.5,bold:true,c:[180,200,240],align:'right'}); T(R.from&&R.to?`${dmy(R.from)} – ${dmy(R.to)}`:'Todo el periodo',W-M,16.5,{size:9,bold:true,c:Cc.white,align:'right'});
  T(`Emitido el ${dmy(TODAY_YMD)}`,W-M,21.5,{size:7,c:[214,226,248],align:'right'});
  const ftxt=[`Tipos: ${types.map(t=>t.name).join(', ')}`,...COM_CATS.filter(([k])=>R.cats[k]&&R.cats[k].size).map(([k,l])=>`${l}: ${[...R.cats[k]].join(', ')}`)];
  doc.setFontSize(7.2); const ftl=doc.splitTextToSize(ftxt.join('  ·  '),CW); T(ftl[0]+(ftl.length>1?' …':''),M,38,{size:7.2,c:Cc.grey});
  let y=42;
  const sumPart=rs=>({m:rs.reduce((t,a)=>t+(a.mujeres||0)+(a.mujeres60||0),0),h:rs.reduce((t,a)=>t+(a.hombres||0)+(a.hombres60||0),0),nna:rs.reduce((t,a)=>t+(a.ninas||0)+(a.ninos||0),0),tot:rs.reduce((t,a)=>t+a.total,0)});
  if(types.length>1){
    const P=sumPart(rows);
    y=kpis(y,[[N(rows.length),'actividades comunitarias'],[N(P.tot),'participantes'],[N(types.length),'tipos de actividad'],[N(new Set(rows.map(a=>a.socio)).size),'socios implementadores']]);
    y=section('Resumen por tipo de actividad',M,y+2);
    const cx=[M+1.5,M+80,M+105,M+130,M+155,W-M-1.5];
    [['Tipo de actividad','left'],['Actividades','right'],['Participantes','right'],['Mujeres 18+','right'],['Hombres 18+','right'],['Niñas y niños','right']].forEach(([h,al],i)=>T(h,cx[i],y+1,{size:6.8,bold:true,c:Cc.grey,align:al}));
    y+=2.5; types.forEach((t,i)=>{ const rs=rows.filter(a=>a.type===t.id), p=sumPart(rs), yy=y+i*5.6; if(i%2===0){ fill([245,247,251]); doc.rect(M,yy,CW,5.6,'F'); }
      [t.label,N(rs.length),N(p.tot),N(p.m),N(p.h),N(p.nna)].forEach((v,j)=>T(v,cx[j],yy+3.8,{size:7.2,bold:j>0,align:j?'right':'left'})); });
    y+=types.length*5.6+4;
  }
  { const sc=stateCounter(); rows.forEach(a=>sc.addN(a.estado,a.total));
    y=pdfMapBlock(doc,{x:M,y:y+2,w:CW,h:types.length>1?150:165,vals:sc.vals(),unit:'participantes',title:'Participantes por estado de la actividad',unknown:sc.unknown()}); if(types.length===1) y=newPage(); }
  types.forEach((t,ti)=>{
    const rs=rows.filter(a=>a.type===t.id), P=sumPart(rs), A=rs.length;
    if(types.length>1){ y=newPage(); fill(Cc.pale); doc.rect(M,y-4,CW,11,'F'); fill(Cc.blue); doc.rect(M,y-4,1.6,11,'F'); T(`Sección ${ti+1}. ${t.label}`,M+5,y+3,{size:12,bold:true,c:Cc.blue}); y+=12; }
    const mats=MATS.map(([l,k])=>[l,rs.reduce((s,a)=>s+(a[k]||0),0)]).concat([['Material en lengua indígena',rs.reduce((s,a)=>s+(a.cIndigena||0),0)]]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
    const matTot=mats.reduce((s,x)=>s+x[1],0);
    y=kpis(y,[[N(A),'actividades realizadas'],[N(P.tot),'participantes'],[(P.tot/Math.max(1,A)).toLocaleString('es-VE',{minimumFractionDigits:1,maximumFractionDigits:1}),'participantes por actividad en promedio'],[N(matTot),'piezas de material distribuidas']]);
    // Bloques en pares
    const ds=rs.map(a=>a.fecha).filter(Boolean).sort(), span=ds.length?(Date.parse(ds[ds.length-1])-Date.parse(ds[0]))/86400000:0;
    const wk=d=>{ const x=new Date(d+'T00:00:00Z'); x.setUTCDate(x.getUTCDate()-((x.getUTCDay()+6)%7)); return x.toISOString().slice(0,10); };
    const series=span>62?countBy(rs.filter(a=>a.fecha),a=>a.fecha.slice(0,7)).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,n])=>[`${MONTHS[+m.slice(5)-1].slice(0,3)} ${m.slice(2,4)}`,n])
      :countBy(rs.filter(a=>a.fecha),a=>wk(a.fecha)).sort((a,b)=>a[0].localeCompare(b[0])).map(([w,n])=>[`${+w.slice(8)} ${MONTHS[+w.slice(5,7)-1].slice(0,3).toLowerCase()}`,n]);
    const tok=k=>countBy(rs.flatMap(a=>tokens(a[k])),x=>x);
    const lugar=countBy(rs,a=>a.municipio?`${a.municipio} (${a.estado||'sin estado'})`:null), useP=lugar.length<2, lug=useP?countBy(rs,a=>a.parroquia?`${a.parroquia} (${a.municipio||'sin municipio'})`:null):lugar;
    const socios=countBy(rs,a=>a.socio||'(sin dato)').map(([s,n])=>[s,n,rs.filter(a=>(a.socio||'(sin dato)')===s).reduce((x,a)=>x+a.total,0)]);
    const blk={
      serie:{h:40,draw:(x,yy,w)=>{ yy=section(span>62?'Actividades por mes':'Actividades por semana',x,yy); const s=series.slice(-14), h=26, base=yy+h, max=Math.max(1,...s.map(z=>z[1])), bw=w/Math.max(1,s.length);
        stroke(Cc.line); doc.setLineWidth(0.2); doc.line(x,base,x+w,base);
        s.forEach(([l,v],i)=>{ const bh=Math.max(0.4,(h-6)*v/max), xx=x+i*bw+bw*0.15, ww=bw*0.7; fill(Cc.blue); doc.rect(xx,base-bh,ww,bh,'F'); T(N(v),xx+ww/2,base-bh-1,{size:6.2,bold:true,align:'center'}); T(fit(l,bw+1,5.8),xx+ww/2,base+3.2,{size:5.8,c:Cc.grey,align:'center'}); }); }},
      piramide:{h:40,draw:(x,yy,w)=>{ yy=section('Participantes por sexo y edad',x,yy); const cx=x+w/2, gap=8, half=w/2-gap-10;
        const pr=[['60+',rs.reduce((s,a)=>s+(a.mujeres60||0),0),rs.reduce((s,a)=>s+(a.hombres60||0),0)],['18-59',rs.reduce((s,a)=>s+(a.mujeres||0),0),rs.reduce((s,a)=>s+(a.hombres||0),0)],['0-17',rs.reduce((s,a)=>s+(a.ninas||0),0),rs.reduce((s,a)=>s+(a.ninos||0),0)]];
        const pm=Math.max(1,...pr.flatMap(r=>[r[1],r[2]]));
        T('Mujeres / niñas',cx-gap,yy+1,{size:7,bold:true,c:Cc.blue2,align:'right'}); T('Hombres / niños',cx+gap,yy+1,{size:7,bold:true,c:Cc.blue}); yy+=3.5;
        pr.forEach(([l,m,h],i)=>{ const y2=yy+i*6.2, wm=half*m/pm, wh=half*h/pm; T(l,cx,y2+3.5,{size:7,align:'center',c:Cc.grey});
          if(m){ fill(Cc.blue2); doc.rect(cx-gap-wm,y2+0.9,wm,4.2,'F'); } if(h){ fill(Cc.blue); doc.rect(cx+gap,y2+0.9,wh,4.2,'F'); }
          T(N(m),cx-gap-wm-1.2,y2+3.9,{size:6.8,align:'right'}); T(N(h),cx+gap+wh+1.2,y2+3.9,{size:6.8}); });
        const nr=rs.reduce((s,a)=>s+(a.nr||0),0); T(`Mujeres y niñas ${pct(P.m+rs.reduce((s,a)=>s+(a.ninas||0),0),P.tot)}  ·  Hombres y niños ${pct(P.h+rs.reduce((s,a)=>s+(a.ninos||0),0),P.tot)}${nr?`  ·  Prefiere no responder ${N(nr)}`:''}`,x,yy+3*6.2+4,{size:6.6,c:Cc.grey}); }},
      act:{items:tok('act').slice(0,6),title:'Actividades realizadas',total:A},
      lug:{items:lug.slice(0,5),title:useP?'Parroquias (municipio)':'Municipios (estado)',total:A},
      spec:t.spec?{items:tok(t.spec[0]).slice(0,5),title:t.spec[1],total:A}:null,
      grupos:{items:tok('grupos').slice(0,5),title:'Grupos poblacionales',total:A},
      mat:{items:mats.slice(0,5),title:'Material distribuido (piezas)',total:Math.max(1,matTot)},
      socios:{h:8.5+Math.min(5,socios.length)*5.4,draw:(x,yy,w)=>{ yy=section('Por socio implementador',x,yy); T('Socio',x,yy+1,{size:6.8,bold:true,c:Cc.grey}); T('Actividades',x+w-22,yy+1,{size:6.8,bold:true,c:Cc.grey,align:'right'}); T('Participantes',x+w,yy+1,{size:6.8,bold:true,c:Cc.grey,align:'right'}); yy+=2.5;
        socios.slice(0,5).forEach(([o,n,p],i)=>{ const y2=yy+i*5.4; if(i%2===0){ fill([245,247,251]); doc.rect(x,y2,w,5.4,'F'); } T(fit(o,w-50,7.2),x+1.5,y2+3.7,{size:7.2}); T(N(n),x+w-22,y2+3.7,{size:7.2,bold:true,align:'right'}); T(N(p),x+w-1.5,y2+3.7,{size:7.2,bold:true,align:'right'}); }); }}
    };
    const asBlock=b=>!b?null:b.draw?b:(b.items.length?{h:6+b.items.length*5.3,draw:(x,yy,w)=>{ yy=section(b.title,x,yy); bars(b.items,x,yy,w,{lw:w*0.52,c:Cc.blue2,total:b.total}); }}:null);
    const pairs=[[blk.serie,blk.piramide],[blk.act,blk.lug],t.spec?[blk.spec,blk.grupos]:[blk.grupos,blk.mat],t.spec?[blk.mat,blk.socios]:[blk.socios,null]].map(p=>p.map(asBlock));
    pairs.forEach(([a,b])=>{ if(!a&&!b) return; const h=Math.max(a?a.h:0,b?b.h:0); y=need(y,h+2); if(a) a.draw(LX,y,HW); if(b) b.draw(RX,y,HW); y+=h+4; });
    // Franja
    y=need(y,21);
    const strip=[[pct(rs.filter(a=>fold(a.isAloj)==='si').length,A),'de las actividades se realizaron en alojamientos'],[pct(rs.filter(a=>fold(a.recurr)==='si').length,A),'de las actividades tuvieron participantes recurrentes'],
      [pct(rs.filter(a=>fold(a.canales)==='si').length,A),'informaron sobre los canales de retroalimentación'],[N(rs.reduce((s,a)=>s+(a.solicit||0),0)),'personas solicitaron orientación individual después de la actividad']];
    stroke(Cc.line); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); doc.line(M,y+15,W-M,y+15);
    strip.forEach(([v,l],i)=>{ const x=M+i*(CW/4); T(v,x+2,y+6.5,{size:11,bold:true,c:Cc.blue}); doc.setFontSize(6.6); T(doc.splitTextToSize(l,CW/4-6).slice(0,2).join('\n'),x+2,y+10.3,{size:6.6,c:Cc.grey}); });
    y+=21;
    // Calidad
    const obs=rs.filter(a=>a.issues.length).length, top=COM_CRIT.map(([k,l])=>[l,rs.filter(a=>a.issues.some(i=>i.k===k)).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const qh=13+Math.max(1,top.length)*4.4;
    y=need(y,qh+7); y=section('Calidad de los datos',M,y);
    fill([253,246,232]); doc.roundedRect(M,y-1,CW,qh,1.5,1.5,'F'); fill(Cc.amber); doc.rect(M,y-1,1.2,qh,'F');
    T(N(obs),M+5,y+7,{size:16,bold:true,c:[150,95,0]}); T(`actividades con al menos una observación (${pct(obs,A)} del total). Detalle en el reporte de limpieza de datos.`,M+28,y+6,{size:7});
    (top.length?top:[['Sin observaciones',0]]).forEach(([l,v],i)=>{ const y2=y+13+i*4.4; T(fit(l,CW-30,6.8),M+5,y2,{size:6.8,c:Cc.grey}); T(N(v),W-M-3,y2,{size:6.8,bold:true,align:'right'}); });
    y+=qh+6;
  });
  // Observaciones
  if(R.notes&&R.notes.trim()){ y=need(y,16); y=section('Observaciones',M,y); doc.setFontSize(7.6); for(const ln of doc.splitTextToSize(R.notes.trim(),CW)){ if(y+3.4>PG.bottom) y=newPage(); T(ln,M,y+1,{size:7.6}); y+=3.4; } }
  if(ext) return true;
  const n=doc.getNumberOfPages(); for(let i=1;i<=n;i++){ doc.setPage(i); stroke(Cc.line); doc.setLineWidth(0.3); doc.line(M,283,W-M,283);
    T(`Fuente: IMS, actividades comunitarias (${C.file}). Participantes según la desagregación por sexo y edad registrada en cada actividad.`,M,287.5,{size:6.3,c:Cc.grey,maxW:CW-30}); T(`Página ${i} de ${n}`,W-M,287.5,{size:6.3,c:Cc.grey,align:'right'}); }
  await saveFile(`Informe_Actividades_Comunitarias${R.from&&R.to?`_${R.from}_a_${R.to}`:''}.pdf`,doc.output('blob'));
}

function comBind(){
  const C=S.com, on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  const restart=()=>{ S.mode=null; S.com=null; S.step=1; render(); };
  if(S.step===2){
    on('#back','click',restart); on('#next','click',()=>{ S.step=3; render(); });
    const syncTypes=()=>{ document.querySelectorAll('[data-ctype]').forEach(b=>{ const id=b.dataset.ctype; if(b.checked) C.sel.add(id); else C.sel.delete(id); const p=document.querySelector(`[data-socpanel="${id}"]`); if(p) p.hidden=!b.checked; }); const nx=$('#next'); if(nx) nx.disabled=!C.sel.size; };
    document.querySelectorAll('[data-ctype]').forEach(b=>b.onchange=syncTypes);
    on('#ctAll','click',()=>{ document.querySelectorAll('[data-ctype]').forEach(b=>b.checked=true); syncTypes(); });
    on('#ctNone','click',()=>{ document.querySelectorAll('[data-ctype]').forEach(b=>b.checked=false); syncTypes(); });
    const syncValid=id=>{ C.valid[id]=new Set([...document.querySelectorAll(`[data-cvalid="${id}"]`)].filter(b=>b.checked).map(b=>b.value)); comAnalyze(C); };
    document.querySelectorAll('[data-cvalid]').forEach(b=>b.onchange=()=>syncValid(b.dataset.cvalid));
    document.querySelectorAll('[data-vall]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-cvalid="${b.dataset.vall}"]`).forEach(x=>x.checked=true); syncValid(b.dataset.vall); });
    document.querySelectorAll('[data-vnone]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-cvalid="${b.dataset.vnone}"]`).forEach(x=>x.checked=false); syncValid(b.dataset.vnone); });
  }
  if(S.step===3){
    const base=C.rows.filter(a=>C.sel.has(a.type)), upd=()=>{ const rows=comSelRows(); $('#cN').textContent=fmt(rows.length); $('#comSum').innerHTML=comSumTable(comCleanRows()); };
    bindPeriod('c',C.filters,base.map(a=>a.fecha),'crange',upd); bindCats('c',C.filters.cats,upd);
    on('#back','click',()=>{ S.step=2; render(); }); on('#next','click',()=>{ S.step=4; render(); });
  }
  if(S.step===4&&C.view==='report'){
    const R=comRepInit(), base=C.rows.filter(a=>C.sel.has(a.type)), upd=()=>{ $('#cRepFacts').innerHTML=comRepFacts(comRepRows()); };
    document.querySelectorAll('[data-rtype]').forEach(b=>b.onchange=()=>{ if(b.checked) R.types.add(b.dataset.rtype); else R.types.delete(b.dataset.rtype); upd(); });
    bindPeriod('cr',R,base.map(a=>a.fecha),'crrange',upd); bindCats('cr',R.cats,upd);
    on('#rTitle','input',e=>{ R.title=e.target.value; }); on('#rNotes','input',e=>{ R.notes=e.target.value; });
    on('#rLogo','change',e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>1.5e6){ toast('El logo supera 1,5 MB. Usa una imagen más liviana.'); return; }
      const rd=new FileReader(); rd.onload=()=>{ const img=new Image(); img.onload=()=>{ R.logo={data:rd.result,fmt:/png/i.test(f.type)?'PNG':'JPEG',w:img.naturalWidth,h:img.naturalHeight}; try{ localStorage.setItem(LOGO_KEY,JSON.stringify(R.logo)); }catch(err){} render(); }; img.src=rd.result; }; rd.readAsDataURL(f); });
    on('#rLogoDel','click',()=>{ R.logo=null; try{ localStorage.removeItem(LOGO_KEY); }catch(e){} render(); });
    on('#rBack','click',()=>{ C.view=null; render(); });
    on('#rPdf','click',async()=>{ if(!R.types.size){ toast('Selecciona al menos un tipo de actividad.'); return; } busy(true); await nextFrame(); try{ await comPdf(); }catch(e){ console.error(e); toast('Error al generar el PDF: '+(e.message||e)); } busy(false); });
    return;
  }
  if(S.step===4){
    const run=fn=>async()=>{ busy(true); await nextFrame(); try{ await fn(); }catch(e){ console.error(e); toast('Error al exportar: '+(e.message||e)); } busy(false); };
    on('#exErr','click',run(comExportErrors)); on('#exPbi','click',run(()=>comExportPbi('xlsx'))); on('#exCsv','click',run(()=>comExportPbi('csv')));
    on('#exRep','click',()=>{ C.view='report'; render(); });
    on('#back','click',()=>{ S.step=3; render(); }); on('#restart','click',restart);
  }
}
const COM_MODULE={id:'comunitarias',name:'Actividades comunitarias',views:[null,null,comViewVerify,comViewReview,comViewExport],bind:comBind};

