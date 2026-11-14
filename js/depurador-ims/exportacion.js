/* Herramientas M&E · Exportación (modo genérico) */
/* ============ Exportación ============ */
function serial(d){ const [y,m,dd]=d.split('-').map(Number); return (Date.UTC(y,m-1,dd)-Date.UTC(1899,11,30))/86400000; }
function buildSheet(cols,rows){
  const aoa=[cols.map(c=>c.h),...rows.map(r=>r.map(x=>x===''?null:x))];
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  cols.forEach((c,ci)=>{ if(c.type!=='date') return; for(let r=1;r<aoa.length;r++){ const v=aoa[r][ci]; if(v) ws[XLSX.utils.encode_cell({r,c:ci})]={t:'n',v:serial(v),z:'yyyy-mm-dd'}; } });
  ws['!cols']=cols.map(c=>({wch:Math.min(42,Math.max(10,String(c.h).length+2))}));
  if(ws['!ref']) ws['!autofilter']={ref:ws['!ref']};
  return ws;
}
async function saveFile(name,blob){
  let dl=null;
  try{ if(window.claude&&typeof window.claude.use==='function') dl=await window.claude.use('downloads'); }catch(e){ dl=null; }
  if(dl){
    try{ await dl.save({filename:name,data:blob}); toast(`Descargado: ${name}`); }
    catch(e){ const c=e&&e.code; if(c==='declined') toast('Descarga cancelada.'); else if(c==='rate_limited') toast('Hay una descarga pendiente. Intenta de nuevo en unos segundos.'); else toast(`No se pudo descargar (${c||'error'}).`); }
    return;
  }
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
}
/* Fechas válidas: desde la primera fecha que no esté aislada (separada más de 180 días del resto) hasta hoy */
function validFrom(dates){ const u=[...new Set(dates.filter(d=>d&&d<=TODAY_YMD))].sort(); if(!u.length) return ''; const dn=d=>Date.parse(d+'T00:00:00Z')/864e5; let i=Math.floor(u.length/2); while(i>0&&dn(u[i])-dn(u[i-1])<=180) i--; return u[i]; }
function dateRange(O){ const ds=O.rows.map(a=>a.fecha).filter(d=>d&&d>=O.minValid&&d<=TODAY_YMD).sort(); O.minDate=ds[0]||''; O.maxDate=ds[ds.length-1]||''; }
const dateProblem=(d,min)=>!d?'Fecha vacía o no válida':d>TODAY_YMD?`Fecha posterior a hoy (${dmy(d)})`:min&&d<min?`Fecha muy antigua (${dmy(d)}; las fechas válidas empiezan el ${dmy(min)})`:null;
const xlsxBlob = wb => new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array',compression:true})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
function baseName(){ const n=S.files.length===1?S.files[0].name.replace(/\.[^.]+$/,''):`${snake(S.profile.name)}_${S.files.length}_archivos`; return n.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g,'').trim().replace(/\s+/g,'_'); }
function rangeTag(){ const {from,to}=S.filters; return from&&to?`_${from}_a_${to}`:''; }

function issueSheet(){
  const keep=new Set(filteredRows().map(r=>`${r.file}|${r.row}`));
  const rows=S.result.issues.filter(i=>keep.has(`${i[0]}|${i[1]}`)||i[4]==='Registro duplicado');
  return buildSheet([{h:'Archivo'},{h:'Fila en Excel'},{h:'Campo'},{h:'Valor original'},{h:'Problema'}],rows);
}
async function exportClean(){
  const R=S.result, rows=filteredRows(), F=R.fields;
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,buildSheet(F.map(f=>({h:f.label,type:f.type})),rows.map(r=>F.map(f=>r.v[f.key]))),'Datos');
  XLSX.utils.book_append_sheet(wb,issueSheet(),'Incidencias');
  await saveFile(`${baseName()}_limpio${rangeTag()}.xlsx`,xlsxBlob(wb));
}
function pbiTable(){
  const R=S.result, rows=filteredRows(), F=R.fields, {fFecha,fSexo}=R.roles;
  const hasAge=R.roles.fEdad||R.roles.fNac;
  const cols=[{h:'id_fila'},{h:'archivo_origen'},{h:'fila_origen'},...F.map(f=>({h:f.key,type:f.type}))];
  if(R.derivedAge) cols.push({h:'edad_calculada'});
  if(fFecha) cols.push({h:'anio'},{h:'mes_num'},{h:'mes'},{h:'trimestre'},{h:'fecha_mes',type:'date'});
  if(hasAge) cols.push({h:'grupo_etario'});
  if(fSexo&&hasAge) cols.push({h:'sexo_grupo_etario'});
  cols.push({h:'tiene_incidencias'},{h:'fecha_proceso',type:'date'});
  const proc=today();
  const data=rows.map(r=>{
    const a=[r.i+1,r.file,r.row,...F.map(f=>r.v[f.key])];
    if(R.derivedAge) a.push(r.age);
    if(fFecha){ const d=r.v[fFecha.key]; if(d){ const [y,m]=d.split('-').map(Number); a.push(y,m,MONTHS[m-1],`T${Math.ceil(m/3)}`,`${y}-${String(m).padStart(2,'0')}-01`); } else a.push(null,null,null,null,null); }
    if(hasAge) a.push(ageBand(r.age));
    if(fSexo&&hasAge) a.push(`${r.v[fSexo.key]||'Sin dato'} ${ageBand(r.age)}`);
    a.push(Object.keys(r.bad).length?'Sí':'No', proc);
    return a;
  });
  return {cols,data};
}
async function exportPBI(kind){
  const {cols,data}=pbiTable();
  if(kind==='csv'){
    const ws=buildSheet(cols,data);
    const csv='\ufeff'+XLSX.utils.sheet_to_csv(ws,{FS:',',RS:'\r\n'});
    await saveFile(`${baseName()}_powerbi${rangeTag()}.csv`,new Blob([csv],{type:'text/csv'}));
    return;
  }
  const R=S.result, wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,buildSheet(cols,data),'Datos');
  const dict=[...R.fields.map(f=>[f.key,f.label,TYPES[f.type]||f.type,ROLES[f.role||'']||'',S.mapping[f.key]||'',f.extra?'Columna no incluida en el perfil':''])];
  XLSX.utils.book_append_sheet(wb,buildSheet([{h:'campo'},{h:'etiqueta'},{h:'tipo'},{h:'rol'},{h:'columna_original_IMS'},{h:'nota'}],dict),'Diccionario');
  XLSX.utils.book_append_sheet(wb,issueSheet(),'Incidencias');
  const meta=[['Perfil',S.profile.name],['Archivos',S.files.map(f=>f.name).join('; ')],['Filas leídas',R.rows.length],['Filas exportadas',data.length],['Duplicados excluidos',S.opts.dedupe?R.dups:0],['Rango de fechas',`${S.filters.from||'—'} a ${S.filters.to||'—'}`],['Fecha de proceso',today()]];
  XLSX.utils.book_append_sheet(wb,buildSheet([{h:'parametro'},{h:'valor'}],meta),'Proceso');
  await saveFile(`${baseName()}_powerbi${rangeTag()}.xlsx`,xlsxBlob(wb));
}
function w345Table(){
  const R=S.result, rows=filteredRows(), {fFecha,fSexo,fId}=R.roles;
  const dims=S.w345.dims.map(k=>R.fields.find(f=>f.key===k)).filter(Boolean);
  const byMonth=S.w345.byMonth&&fFecha;
  const hasAge=R.roles.fEdad||R.roles.fNac;
  const bands=[...parseBands(S.bands).map(b=>b.label),'Sin dato'];
  const sexes=['Mujer','Hombre','Otro'];
  const groups=new Map();
  rows.forEach(r=>{
    const keyParts=dims.map(d=>r.v[d.key]??'(vacío)');
    if(byMonth){ const d=r.v[fFecha.key]; keyParts.unshift(d?d.slice(0,7):'(sin fecha)'); }
    const k=keyParts.join('\u0001');
    let g=groups.get(k); if(!g){ g={parts:keyParts,n:0,ids:new Set(),cells:{}}; groups.set(k,g); }
    g.n++; if(fId&&r.v[fId.key]) g.ids.add(fold(r.v[fId.key]));
    if(fSexo){ const s=sexes.includes(r.v[fSexo.key])?r.v[fSexo.key]:'Sin dato'; const b=hasAge?ageBand(r.age):'Total'; const c=`${s}|${b}`; g.cells[c]=(g.cells[c]||0)+1; }
  });
  const cols=[]; if(byMonth) cols.push({h:'Mes'}); dims.forEach(d=>cols.push({h:d.label}));
  cols.push({h:'Atenciones (registros)'}); if(fId) cols.push({h:'Personas únicas'});
  const sexCols=[];
  if(fSexo){ [...sexes,'Sin dato'].forEach(s=>{ if(hasAge) bands.forEach(b=>sexCols.push([s,b])); sexCols.push([s,'Total']); }); sexCols.forEach(([s,b])=>cols.push({h:b==='Total'?`${s} total`:`${s} ${b}`})); }
  const data=[...groups.values()].sort((a,b)=>a.parts.join().localeCompare(b.parts.join(),'es')).map(g=>{
    const a=[...g.parts,g.n]; if(fId) a.push(g.ids.size);
    sexCols.forEach(([s,b])=>{ if(b==='Total'){ a.push(Object.entries(g.cells).filter(([k])=>k.startsWith(s+'|')).reduce((t,[,v])=>t+v,0)); } else a.push(g.cells[`${s}|${b}`]||0); });
    return a;
  });
  // Quitar columnas de desagregación completamente vacías
  const firstSex=cols.length-sexCols.length;
  const keepIdx=cols.map((c,i)=>i<firstSex||data.some(r=>r[i]));
  return {cols:cols.filter((_,i)=>keepIdx[i]),data:data.map(r=>r.filter((_,i)=>keepIdx[i]))};
}
async function export345(){
  const {cols,data}=w345Table();
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,buildSheet(cols,data),'Matriz 345W');
  await saveFile(`${baseName()}_345W${rangeTag()}.xlsx`,xlsxBlob(wb));
}

