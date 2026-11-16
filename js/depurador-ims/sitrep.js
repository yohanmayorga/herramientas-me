/* Herramientas M&E · SITREP */
/* ============ SITREP (depurador múltiple) ============ */
const SIT_STATES=['La Guaira','Carabobo','Distrito Capital','Miranda','Yaracuy'];
const SIT_ALOJ=['cesar nieves','polideportivo','mare abajo','campo de golf','playa grande'];
const sitState=v=>SIT_STATES.find(s=>fold(s)===fold(v))||'La Guaira';
const SIT_ALOJ_NAMES=['Polideportivo José María Vargas','Estadio César Nieves','Estadio Playa Grande','Campo de golf','Mare Abajo'];
const SIT_NO_KIT_RE=/^(n[uú]mero de|litros de)|\b(usos\s+(de\s+)?(ba[nñ]os|duchas|lavander[ií]a)|personas\s+del\s+grupo\s+que\s+usaron\s+el\s+servicio|litros\s+de\s+agua\s+potable|personas\s+que\s+accedieron\s+al\s+servicio)\b/i;
const sitIsWashKit=name=>/\b(bidon|bidones|filtro|filtros|higiene|tobo|tobos)\b/.test(fold(name));
const sitKitType=(formType,name)=>formType==='wash'||sitIsWashKit(name)?'WASH':'NFI';
const sitExcelDate=ymdStr=>{
  if(!ymdStr||!/^\d{4}-\d{2}-\d{2}$/.test(ymdStr)) return null;
  const [y,m,d]=ymdStr.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d));
};

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
  const kitMap=new Map(), kitRows=[];
  ['nfi','wash'].forEach(t=>{ const it=by(t); if(!it) return; const o=it.obj;
    (o.kits||[]).forEach(k=>{
      if(!k||!k.name||SIT_NO_KIT_RE.test(k.label||k.name)) return;
      const tipo=sitKitType(t,k.name), key=`${tipo}|${fold(k.name)}`;
      if(!kitMap.has(key)) kitMap.set(key,{kit:k.name,tipo,qtyPeriod:0,qtyAll:0});
    });
    o.rows.forEach(a=>{
      const cats=new Set(), inPer=inP(a.fecha);
      a.items.forEach(x=>{
        const k=o.kits[x.ki];
        if(!k||!x.q||SIT_NO_KIT_RE.test(k.label||k.name)) return;
        const c=sitKitType(t,k.name), key=`${c}|${fold(k.name)}`;
        let entry=kitMap.get(key);
        if(!entry){ entry={kit:k.name,tipo:c,qtyPeriod:0,qtyAll:0}; kitMap.set(key,entry); }
        entry.qtyAll+=x.q;
        kitRows.push({caso:a.caso||'',code:a.code||'',fecha:a.fecha||null,tipo:c,kit:entry.kit,q:x.q});
        if(inPer){ entry.qtyPeriod+=x.q; qty[c]+=x.q; cats.add(c); }
      });
      if(inPer){
        const st=sitState(a.estado);
        cats.forEach(c=>{ const tgt=c==='NFI'?R.shelter:R.wash; if(c==='NFI') has.shelter=true; else has.wash=true; a.ps.forEach(p=>tgt[st].add(p)); });
      }
    });
  });
  kitRows.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')||a.code.localeCompare(b.code)||a.tipo.localeCompare(b.tipo)||a.kit.localeCompare(b.kit));
  const kitCatalog=[...kitMap.values()].sort((a,b)=>a.tipo.localeCompare(b.tipo)||b.qtyPeriod-a.qtyPeriod||b.qtyAll-a.qtyAll||a.kit.localeCompare(b.kit));
  const kitDates=kitRows.map(r=>r.fecha).filter(Boolean).sort();
  const kitFrom=F.from||kitDates[0]||'', kitTo=F.to||kitDates[kitDates.length-1]||'';
  const kitTotalPeriod=kitCatalog.reduce((s,x)=>s+x.qtyPeriod,0);
  ['salud','mental'].forEach(t=>{ const it=by(t); if(!it) return; has.health=true; it.obj.rows.forEach(a=>{ if(inP(a.fecha)) R.health[sitState(a.estado)]++; }); });
  { const it=by('proteccion'); if(it){ has.prot=true; it.obj.rows.forEach(a=>{ if(inP(a.fecha)) R.prot[sitState(a.estado)]++; }); } }
  { const it=by('psicosocial'); if(it){ has.prot=true; it.obj.rows.forEach(a=>{ if(inP(a.fecha)&&!a.cross) R.prot[sitState(a.estado)]++; }); } }
  const vals=r=>SIT_STATES.map(s=>typeof r[s]==='number'?r[s]:r[s].size);
  const rows=[['CCCM',vals(R.cccm),null,has.cccm],['Shelter and settlements',vals(R.shelter),qty.NFI,has.shelter],['WASH',vals(R.wash),qty.WASH,has.wash],['Health',vals(R.health),null,has.health],['Protection',vals(R.prot),null,has.prot]];
  const atn=rows.reduce((t,[, v,,h])=>t+(h?v.reduce((a,b)=>a+b,0):0),0);
  return {rows,fams:famsTot,people:persTot,atn,F,kitRows,kitCatalog,kitFrom,kitTo,kitTotalPeriod};
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
    ['Personas en kits','En Shelter y WASH se cuentan los integrantes de la familia que figuran en el Registro de Familias, sin repetir dentro de cada estado.'],
    ['Cuadro de kits (SITREP) y pestaña Kits','La pestaña «Kits» consolida todas las entregas de los formularios NFI y WASH (Código de familia, Código de asistencia, Fecha, Tipo de kit, Kit y Cantidad). En NFI, todo kit que contenga bidón/bidones, filtros de agua, higiene/kits de higiene o tobo/tobos se clasifica como WASH; en WASH todos los kits son WASH y se excluyen las columnas de servicios (usos y personas de baños, duchas y lavandería, litros de agua potable y personas que accedieron al servicio). El cuadro de kits en la hoja «SITREP» suma las cantidades desde la pestaña «Kits» y permite filtrar dinámicamente por Tipo de kit (Todos, NFI o WASH) y por rango de fechas (Fecha desde / Fecha hasta).']];
  if(window.ExcelJS){
    const wb=new ExcelJS.Workbook(), ws=wb.addWorksheet('SITREP',{views:[{showGridLines:false}]});
    const peach='FFFBE0D4', blue='FFDCE8F7', yellow='FFFFFF00', filterBg='FFFFF9DB', thin={style:'thin',color:{argb:'FF000000'}}, box={top:thin,left:thin,bottom:thin,right:thin};
    ws.columns=[{width:38},{width:15},{width:18},{width:16},{width:12},{width:12},{width:12},{width:3},{width:22},{width:12}];
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

    // Cuadro de kits entregados (debajo del cuadro principal en la pestaña SITREP)
    ws.getCell('A18').value='Kits entregados (NFI y WASH)';
    ws.getCell('A18').font={bold:true,size:12,color:{argb:'FF0033A0'}};

    const fltRows=[
      ['Tipo de kit','Todos',null,'Desplegable: Todos, NFI o WASH'],
      ['Fecha desde',sitExcelDate(X.kitFrom),'dd/mm/yyyy','Fecha inicial del filtro (vacío = desde el inicio)'],
      ['Fecha hasta',sitExcelDate(X.kitTo),'dd/mm/yyyy','Fecha final del filtro (vacío = hasta el final)']
    ];
    fltRows.forEach(([lbl,val,fmtStr,help],idx)=>{
      const r=ws.getRow(19+idx), cA=r.getCell(1), cB=r.getCell(2), cC=r.getCell(3);
      cA.value=lbl; cA.font={bold:true}; cA.border=box; cA.fill={type:'pattern',pattern:'solid',fgColor:{argb:blue}};
      cB.value=val; cB.font={bold:true}; cB.border=box; cB.fill={type:'pattern',pattern:'solid',fgColor:{argb:filterBg}};
      cB.alignment={horizontal:'center'};
      if(fmtStr) cB.numFmt=fmtStr;
      cC.value=help; cC.font={italic:true,size:9.5,color:{argb:'FF666666'}};
    });
    ws.getCell('B19').dataValidation={
      type:'list',
      allowBlank:true,
      formulae:['"Todos,NFI,WASH"'],
      showErrorMessage:true,
      errorTitle:'Valor no válido',
      error:'Selecciona Todos, NFI o WASH'
    };

    const khr=ws.getRow(23);
    ['Kit','Tipo de kit','Cantidad entregada'].forEach((h,i)=>{
      const c=khr.getCell(i+1);
      c.value=h; c.font={bold:true}; c.border=box;
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:blue}};
      if(i===1) c.alignment={horizontal:'center'};
      if(i===2) c.alignment={horizontal:'right'};
    });

    const lastK=Math.max(2,X.kitRows.length+1);
    X.kitCatalog.forEach((item,idx)=>{
      const rIdx=24+idx, r=ws.getRow(rIdx);
      const cKit=r.getCell(1), cTipo=r.getCell(2), cQty=r.getCell(3);
      cKit.value=item.kit; cKit.border=box;
      cTipo.value=item.tipo; cTipo.border=box; cTipo.alignment={horizontal:'center'};
      cQty.value=X.kitRows.length
        ? {formula:`IF(AND($B$19<>"",$B$19<>"Todos",$B$19<>B${rIdx}),0,SUMIFS(Kits!$F$2:$F$${lastK},Kits!$E$2:$E$${lastK},A${rIdx},Kits!$D$2:$D$${lastK},B${rIdx},Kits!$C$2:$C$${lastK},">="&IF($B$20="",0,$B$20),Kits!$C$2:$C$${lastK},"<="&IF($B$21="",999999,$B$21)))`,result:item.qtyPeriod}
        : 0;
      cQty.numFmt=NF; cQty.border=box;
    });

    const totRowIdx=24+X.kitCatalog.length, tr=ws.getRow(totRowIdx);
    tr.getCell(1).value='Total kits entregados';
    tr.getCell(2).value='';
    tr.getCell(3).value=X.kitCatalog.length
      ? {formula:`SUBTOTAL(9,C24:C${23+X.kitCatalog.length})`,result:X.kitTotalPeriod}
      : 0;
    tr.getCell(3).numFmt=NF;
    [1,2,3].forEach(ci=>{
      const c=tr.getCell(ci);
      c.font={bold:true}; c.border=box;
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:peach}};
    });
    if(X.kitCatalog.length){
      ws.autoFilter={from:{row:23,column:1},to:{row:23+X.kitCatalog.length,column:3}};
    }

    // Pestaña consolidada «Kits» (NFI + WASH)
    const ks=wb.addWorksheet('Kits',{views:[{state:'frozen',ySplit:1}]});
    ks.columns=[
      {width:20},
      {width:22},
      {width:14},
      {width:14},
      {width:38},
      {width:14}
    ];
    const ksHead=ks.getRow(1);
    ['Código de familia','Código de asistencia','Fecha','Tipo de kit','Kit','Cantidad'].forEach((h,i)=>{
      const c=ksHead.getCell(i+1);
      c.value=h; c.font={bold:true,color:{argb:'FFFFFFFF'}};
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0033A0'}};
      c.border=box;
    });
    X.kitRows.forEach((kr,idx)=>{
      const r=ks.getRow(2+idx);
      r.getCell(1).value=kr.caso;
      r.getCell(2).value=kr.code;
      const cF=r.getCell(3); cF.value=sitExcelDate(kr.fecha); cF.numFmt='dd/mm/yyyy';
      const cT=r.getCell(4); cT.value=kr.tipo; cT.alignment={horizontal:'center'};
      r.getCell(5).value=kr.kit;
      const cQ=r.getCell(6); cQ.value=kr.q; cQ.numFmt='#,##0';
      for(let ci=1;ci<=6;ci++) r.getCell(ci).border=box;
    });
    ks.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,X.kitRows.length+1),column:6}};

    const cs=wb.addWorksheet('Criterios'); cs.columns=[{width:28},{width:110}]; cs.getCell('A1').value='Cómo se calcula cada cifra'; cs.getCell('A1').font={bold:true,size:13,color:{argb:'FF0033A0'}};
    criterios.forEach(([a,b],i)=>{ const r=cs.getRow(3+i); r.getCell(1).value=a; r.getCell(1).font={bold:true}; r.getCell(2).value=b; r.getCell(2).alignment={wrapText:true,vertical:'top'}; r.getCell(1).alignment={vertical:'top'}; });
    const buf=await wb.xlsx.writeBuffer();
    await saveFile(fname,new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); return;
  }
  // Respaldo sin formato (si ExcelJS no cargó)
  const wb=XLSX.utils.book_new(), aoa=[['SITREP · OIM Venezuela'],[`Periodo: ${per}`],[],['Sector',...SIT_STATES,'Total','','Cantidades entregadas'],
    ...X.rows.map(([n,v,q,h])=>[n,...(h?v:v.map(()=>null)),h?v.reduce((a,b)=>a+b,0):null,'',q!=null&&h?q:null]),[],['Familias (Total)',X.fams],['Personas (Total)',X.people],['Atenciones (Total)',X.atn],
    [],['Kits entregados (NFI y WASH)'],['Tipo de kit','Todos'],['Fecha desde',X.kitFrom||''],['Fecha hasta',X.kitTo||''],[],['Kit','Tipo de kit','Cantidad entregada'],
    ...X.kitCatalog.map(k=>[k.kit,k.tipo,k.qtyPeriod]),['Total kits entregados','',X.kitTotalPeriod]];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'SITREP');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Código de familia','Código de asistencia','Fecha','Tipo de kit','Kit','Cantidad'],...X.kitRows.map(r=>[r.caso,r.code,r.fecha||'',r.tipo,r.kit,r.q])]),'Kits');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Concepto','Criterio'],...criterios]),'Criterios');
  await saveFile(fname,xlsxBlob(wb));
}
