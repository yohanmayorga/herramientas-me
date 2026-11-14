/* Herramientas M&E · SITREP */
/* ============ SITREP (depurador múltiple) ============ */
const SIT_STATES=['La Guaira','Carabobo','Distrito Capital','Miranda','Yaracuy'];
const SIT_ALOJ=['cesar nieves','polideportivo','mare abajo','campo de golf','playa grande'];
const sitState=v=>SIT_STATES.find(s=>fold(s)===fold(v))||'La Guaira';
const SIT_ALOJ_NAMES=['Polideportivo José María Vargas','Estadio César Nieves','Estadio Playa Grande','Campo de golf','Mare Abajo'];
function sitrepData(){
  const M=S.mm, F=M.filters, inP=d=>!!d&&(!F.from||d>=F.from)&&(!F.to||d<=F.to), its=mmIncluded(), by=t=>its.find(it=>it.type===t);
  const zero=()=>Object.fromEntries(SIT_STATES.map(s=>[s,0])), sets=()=>Object.fromEntries(SIT_STATES.map(s=>[s,new Set()]));
  const R={cccm:zero(),shelter:sets(),wash:sets(),health:zero(),prot:zero()}, qty={NFI:0,WASH:0};
  const has={cccm:false,shelter:false,wash:false,health:false,prot:false}, aloj=new Set(SIT_ALOJ_NAMES.map(fold));
  let famsTot=0, persTot=0;
  const reg=by('registro');
  if(reg){ has.cccm=true; const o=reg.obj;
    o.fams.forEach(f=>{ if(o.famByNum.get(f.num)!==f||!inP(f.created)) return; const n=(o.byFam.get(f.num)||[]).length;
      famsTot++; persTot+=n; if(aloj.has(fold(f.alojamiento))) R.cccm['La Guaira']+=n; }); }
  ['nfi','wash'].forEach(t=>{ const it=by(t); if(!it) return; const o=it.obj;
    o.rows.forEach(a=>{ if(!inP(a.fecha)) return; const cats=new Set(); a.items.forEach(x=>{ const c=o.cat[x.ki]; if(c==='NFI'||c==='WASH'){ qty[c]+=x.q; cats.add(c); } });
      const st=sitState(a.estado); cats.forEach(c=>{ const tgt=c==='NFI'?R.shelter:R.wash; if(c==='NFI') has.shelter=true; else has.wash=true; a.ps.forEach(p=>tgt[st].add(p)); }); }); });
  ['salud','mental'].forEach(t=>{ const it=by(t); if(!it) return; has.health=true; it.obj.rows.forEach(a=>{ if(inP(a.fecha)) R.health[sitState(a.estado)]++; }); });
  { const it=by('proteccion'); if(it){ has.prot=true; it.obj.rows.forEach(a=>{ if(inP(a.fecha)) R.prot[sitState(a.estado)]++; }); } }
  { const it=by('psicosocial'); if(it){ has.prot=true; it.obj.rows.forEach(a=>{ if(inP(a.fecha)&&!a.cross) R.prot[sitState(a.estado)]++; }); } }
  const vals=r=>SIT_STATES.map(s=>typeof r[s]==='number'?r[s]:r[s].size);
  const rows=[['CCCM',vals(R.cccm),null,has.cccm],['Shelter and settlements',vals(R.shelter),qty.NFI,has.shelter],['WASH',vals(R.wash),qty.WASH,has.wash],['Health',vals(R.health),null,has.health],['Protection',vals(R.prot),null,has.prot]];
  const atn=rows.reduce((t,[, v,,h])=>t+(h?v.reduce((a,b)=>a+b,0):0),0);
  return {rows,fams:famsTot,people:persTot,atn,F};
}
async function sitrepExport(){
  mmApplyPeriod();
  const X=sitrepData(), F=X.F, per=F.from&&F.to?`${dmy(F.from)} – ${dmy(F.to)}`:'Todo el periodo';
  const fname=`SITREP${F.from&&F.to?`_${F.from}_a_${F.to}`:''}.xlsx`;
  const criterios=[
    ['CCCM','Todas las personas del Registro de Familias cuyas familias marcaron como alojamiento: Polideportivo José María Vargas, Estadio César Nieves, Estadio Playa Grande, Campo de golf o Mare Abajo. Todas se asignan a La Guaira. Periodo según la fecha de registro.'],
    ['Shelter and settlements','Personas distintas (integrantes de la familia según el Registro) de las entregas que incluyeron kits clasificados como NFI, por estado de la entrega. «Cantidades entregadas»: unidades de kits NFI.'],
    ['WASH','Misma lógica que Shelter, con los kits clasificados como WASH (de los formularios NFI y WASH).'],
    ['Health','Número de líneas de los formularios de salud y salud mental (cada línea es una persona atendida), por estado de la atención.'],
    ['Protection','Número de líneas del formulario de protección más las líneas de atención psicosocial (cada línea es una persona atendida), por estado de la atención. Las atenciones psicosociales que también están registradas en el formulario de protección se cuentan una sola vez.'],
    ['Estados','Las personas de estados distintos a La Guaira, Carabobo, Distrito Capital, Miranda y Yaracuy, o sin estado registrado, se suman a La Guaira.'],
    ['Familias (Total)','Todas las familias del Registro de Familias registradas en el periodo.'],
    ['Personas (Total)','Todas las personas (integrantes) de esas familias del Registro de Familias.'],
    ['Atenciones (Total)','Suma de la columna Total de la tabla (CCCM, Shelter and settlements, WASH, Health y Protection).'],
    ['Personas en kits','En Shelter y WASH se cuentan los integrantes de la familia que figuran en el Registro de Familias, sin repetir dentro de cada estado.']];
  if(window.ExcelJS){
    const wb=new ExcelJS.Workbook(), ws=wb.addWorksheet('SITREP',{views:[{showGridLines:false}]});
    const peach='FFFBE0D4', blue='FFDCE8F7', yellow='FFFFFF00', thin={style:'thin',color:{argb:'FF000000'}}, box={top:thin,left:thin,bottom:thin,right:thin};
    ws.columns=[{width:26},{width:13},{width:12},{width:16},{width:12},{width:12},{width:12},{width:3},{width:22},{width:12}];
    ws.getCell('A1').value='SITREP · OIM Venezuela'; ws.getCell('A1').font={bold:true,size:14,color:{argb:'FF0033A0'}};
    ws.getCell('A2').value=`Periodo: ${per} · Generado el ${dmy(TODAY_YMD)}`; ws.getCell('A2').font={italic:true,color:{argb:'FF555555'}};
    const hr=ws.getRow(4); ['Sector',...SIT_STATES,'Total'].forEach((h,i)=>{ const c=hr.getCell(i+1); c.value=h; c.font={bold:true}; c.border=box; });
    const NF='#,##0;-#,##0;"-"';
    X.rows.forEach(([name,v,q,has],i)=>{ const r=ws.getRow(5+i); r.getCell(1).value=name; r.getCell(1).font={bold:true}; r.getCell(1).border=box;
      v.forEach((n,j)=>{ const c=r.getCell(2+j); c.value=has?n:null; c.numFmt=NF; c.border=box; });
      const t=r.getCell(7); t.value=has?{formula:`SUM(B${5+i}:F${5+i})`,result:v.reduce((a,b)=>a+b,0)}:null; t.numFmt=NF; t.border=box; t.fill={type:'pattern',pattern:'solid',fgColor:{argb:blue}};
      if(q!=null&&has){ const a=r.getCell(9), b=r.getCell(10); a.value='Cantidades entregadas'; b.value=q; b.numFmt='#,##0'; [a,b].forEach(c=>{ c.border=box; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:peach}}; }); } });
    [['Familias (Total)',X.fams],['Personas (Total)',X.people],['Atenciones (Total)',{formula:'SUM(G5:G9)',result:X.atn}]].forEach(([l,v],i)=>{ const r=ws.getRow(11+i); const a=r.getCell(1), b=r.getCell(2); a.value=l; b.value=v; b.numFmt='#,##0';
      [a,b].forEach(c=>{ c.font={bold:true}; c.border=box; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:yellow}}; }); });
    [[peach,'Cantidades'],[blue,'Personas']].forEach(([col,l],i)=>{ const r=ws.getRow(15+i); const a=r.getCell(1), b=r.getCell(2); a.fill={type:'pattern',pattern:'solid',fgColor:{argb:col}}; b.value=l; [a,b].forEach(c=>c.border=box); });
    const cs=wb.addWorksheet('Criterios'); cs.columns=[{width:26},{width:110}]; cs.getCell('A1').value='Cómo se calcula cada cifra'; cs.getCell('A1').font={bold:true,size:13,color:{argb:'FF0033A0'}};
    criterios.forEach(([a,b],i)=>{ const r=cs.getRow(3+i); r.getCell(1).value=a; r.getCell(1).font={bold:true}; r.getCell(2).value=b; r.getCell(2).alignment={wrapText:true,vertical:'top'}; r.getCell(1).alignment={vertical:'top'}; });
    const buf=await wb.xlsx.writeBuffer();
    await saveFile(fname,new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); return;
  }
  // Respaldo sin formato (si ExcelJS no cargó)
  const wb=XLSX.utils.book_new(), aoa=[['SITREP · OIM Venezuela'],[`Periodo: ${per}`],[],['Sector',...SIT_STATES,'Total','','Cantidades entregadas'],
    ...X.rows.map(([n,v,q,h])=>[n,...(h?v:v.map(()=>null)),h?v.reduce((a,b)=>a+b,0):null,'',q!=null&&h?q:null]),[],['Familias (Total)',X.fams],['Personas (Total)',X.people],['Atenciones (Total)',X.atn]];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'SITREP'); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Concepto','Criterio'],...criterios]),'Criterios');
  await saveFile(fname,xlsxBlob(wb));
}
