/* Herramientas M&E · Entrega de kits NFI y kits/servicios WASH */
/* ============ Módulo: Entrega de kits (NFI / WASH) ============ */
const NFI_COLS={
  code:{m:'code',l:'Código'}, createdBy:{m:'created_by',l:'Created User'},
  estado:{m:'states',l:'Estado donde se brindó la asistencia',req:1}, municipio:{m:'municipalities',l:'Municipio donde se brindó la asistencia',req:1},
  parroquia:{m:'parishes',l:'Parroquia donde se brindó la asistencia',req:1}, isAloj:{m:'is_alojamiento',l:'¿Está en un alojamiento?',req:1},
  alojamiento:{m:'alojamiento',l:'Alojamiento',req:1}, comunidad:{m:'communities',l:'Comunidad',req:1},
  fecha:{m:'assistance_date',l:'Fecha de asistencia',req:1}, socio:{m:'implementing_partner',l:'Socio Implementador',req:1},
  caso:{m:'case_code',l:'Código de caso',req:1}};
const KIT_CATS=['NFI','WASH','Otro'];
const kitDefaultCat=name=>/tobo|bidon|higiene|filtro/.test(fold(name))?'WASH':'NFI';
const WASH_NO_KIT_RE=/^(n[uú]mero de|litros de)|\b(usos\s+(de\s+)?(ba[nñ]os|duchas|lavander[ií]a)|personas\s+del\s+grupo\s+que\s+usaron\s+el\s+servicio|litros\s+de\s+agua\s+potable|personas\s+que\s+accedieron\s+al\s+servicio)\b/i;
const KIT_META_RE=/^(excel index|machine name|id|uuid|created date|created user|updated date|updated user|c[oó]digo|estado\b|municipio\b|parroquia\b|¿?est[aá] en un alojamiento|alojamiento|comunidad|fecha\b|socio\b|c[oó]digo de caso|beneficiario|tipo de atenci[oó]n|tipo de asistencia|proyecto|seleccione los kits|observaci|comentario|nota)/i;
const KIT_WORD_RE=/\b(kit|kits|lampara|lamparas|tobo|tobos|bidon|bidones|filtro|filtros|higiene|colchoneta|colchonetas|mosquitero|mosquiteros|cobija|cobijas|sabana|sabanas|hamaca|hamacas|cocina|enseres|lona|lonas|carpa|carpas|dignidad|menstrual|abrigo|dormitorio|aseo|limpieza|panal|panales|toalla|toallas|jabon|pastilla|pastillas|cloro)\b/;
const kitNameProject=name=>{ const f=` ${fold(name)} `; return / echo /.test(f)?'ECHO':/ dhr /.test(f)||/ us /.test(f)?'DHR':null; }; // «US» corresponde al proyecto DHR
const KIT_STOP=new Set(['de','del','la','el','los','las','y','oim','echo','dhr','us','coopi']);
const kitKey=s=>fold(s).split(' ').filter(w=>w&&!KIT_STOP.has(w)).join(' ');
const KIT_CFG={
  nfi:{id:'nfi',name:'Entrega de kits NFI',file:'Entregas_NFI',title:'Informe de entrega de kits NFI',sub:'Entrega de kits NFI · IMS',src:'entrega de kits NFI',
    sel:[{k:'selDhr',m:'kits_oim_dhr_nfi',l:'Seleccione los Kits OIM - DHR',proj:'DHR'},{k:'selEcho',m:'kits_oim_echo_nfi',l:'Seleccione los kits OIM - ECHO',proj:'ECHO'},{k:'selNe',m:'kits_oim_non_specify',l:'Seleccione los kits OIM - No especificado',proj:'No especificado'}],
    projCol:null, defaultCat:kitDefaultCat, serviceRe:null,
    ignored:'«Tipo de atención», «Seleccione los kits entregados», «Proyecto» y «Beneficiario»',
    catNote:'Por defecto los tobos, bidones, kits de higiene y filtros de agua se clasifican como WASH y el resto como NFI.'},
  wash:{id:'wash',name:'Entrega de kits y servicios WASH',file:'Entregas_WASH',title:'Informe de entrega de kits y servicios WASH',sub:'Kits y servicios WASH · IMS',src:'entrega de kits y servicios WASH',
    sel:[{k:'selDhr',m:'kits_oim_dhr',l:'Seleccione los kits entregados OIM-DHR',proj:'DHR'},{k:'selEcho',m:'kits_oim_echo',l:'Seleccione los kits entregados OIM-ECHO',proj:'ECHO'},{k:'selCoopi',m:'kits_coopi_dhr',l:'Seleccione los kits entregados COOPI-DHR',proj:'DHR'}],
    projCol:{m:'proyecto',l:'Proyecto'}, defaultCat:()=>'WASH', serviceRe:WASH_NO_KIT_RE,
    ignored:'«Tipo de asistencia», «Seleccione los kits entregados» y «Beneficiario»',
    catNote:'Por defecto todos los kits se clasifican como WASH.'}
};
function kitsSheet(wb){
  for(const n of wb.SheetNames){ const h=peekRows(wb.Sheets[n],2).flat().map(x=>String(x??''));
    if(!h.includes('case_code')) continue;
    if(h.includes('kits_given')||h.includes('kits_oim_dhr_nfi')) return {sheet:n,cfg:KIT_CFG.nfi};
    if(h.includes('kits_oim_dhr')||h.includes('toilet_usage')) return {sheet:n,cfg:KIT_CFG.wash}; }
  for(const n of wb.SheetNames){ const h=peekRows(wb.Sheets[n],2).flat().map(x=>fold(x));
    if(!h.includes('codigo de caso')) continue;
    if(h.includes('seleccione los kits oim dhr')) return {sheet:n,cfg:KIT_CFG.nfi};
    if(h.includes('seleccione los kits entregados oim dhr')) return {sheet:n,cfg:KIT_CFG.wash}; }
  return null;
}
function nfiDetect(wb){ return !!kitsSheet(wb); }
function isKitCol(sh,x,usedIdx,lastMetaIdx){
  if(!x.label||usedIdx.has(x.i)||WASH_NO_KIT_RE.test(x.label)||KIT_META_RE.test(x.label)) return false;
  if(/^(cantidad|cant\.?)\b/i.test(x.label)) return true;
  if(lastMetaIdx>=0&&x.i>lastMetaIdx){
    if(KIT_WORD_RE.test(fold(x.label))) return true;
    const vals=sh.rows.map(r=>r.r[x.i]).filter(v=>v!=null&&String(v).trim()!=='');
    if(vals.length&&vals.every(v=>toNum(v)!==undefined)) return true;
  }
  return false;
}
function nfiLoad(wb,fileName,REG,forced){
  const det0=kitsSheet(wb), cfg=forced&&KIT_CFG[forced]?KIT_CFG[forced]:det0.cfg, det={cfg,sheet:det0?det0.sheet:wb.SheetNames[0]}, N={file:fileName,check:[],fatal:[],reg:REG||null,cfg};
  const sh=imsSheet(wb.Sheets[det.sheet]); sh.idx={};
  const cols={...NFI_COLS}; cfg.sel.forEach(s=>{ cols[s.k]={m:s.m,l:s.l,req:1}; }); if(cfg.projCol) cols.proyecto={...cfg.projCol,req:1};
  for(const [k,c] of Object.entries(cols)){ const loc=locateCol(sh,c); sh.idx[k]=loc.idx;
    N.check.push({label:c.l,how:loc.how,col:loc.idx>=0?XLSX.utils.encode_col(loc.idx):'',found:loc.idx>=0,req:!!c.req}); if(loc.idx<0&&c.req) N.fatal.push(c.l); }
  const usedIdx=new Set(Object.values(sh.idx).filter(i=>i>=0)), lastMetaIdx=Math.max(...usedIdx,-1);
  // Kits: columnas «Cantidad …» o columnas numéricas de kits al final del Excel; servicios WASH excluidos
  N.kits=sh.labels.map((l,i)=>({i,label:l,machine:sh.machine[i]||''})).filter(x=>isKitCol(sh,x,usedIdx,lastMetaIdx))
    .map(x=>{ const name=x.label.replace(/^(cantidad|cant\.?)\s+(de\s+)?/i,'').trim()||x.label.trim(); return {...x,name:name.charAt(0).toUpperCase()+name.slice(1),proj:kitNameProject(name),total:0}; });
  N.services=cfg.serviceRe?sh.labels.map((l,i)=>({i,label:l})).filter(x=>!usedIdx.has(x.i)&&cfg.serviceRe.test(x.label)).map(x=>({...x,total:0})):[];
  N.check.push({label:`Columnas de cantidad de kits (${N.kits.length})`,how:'Etiqueta «Cantidad …»',col:'',found:N.kits.length>0,req:true});
  if(cfg.serviceRe) N.check.push({label:`Columnas de servicios (${N.services.length})`,how:'Etiqueta «Número de …» o «Litros de …»',col:'',found:N.services.length>0,req:false});
  if(!N.kits.length) N.fatal.push('Columnas de cantidad de kits');
  if(N.fatal.length||!REG) return N;
  const g=(x,k)=>sh.idx[k]>=0?x.r[sh.idx[k]]:null;
  const selTok=v=>multi(v)?multi(v).split('; '):[];
  const match=(t,name)=>{ const a=kitKey(t), b=kitKey(name); return !!a&&!!b&&(a===b||(a.length>4&&b.length>4&&(a.includes(b)||b.includes(a)))); };
  N.rows=sh.rows.map(x=>{
    const a={n:x.n};
    for(const k of ['code','createdBy','estado','municipio','parroquia','isAloj','alojamiento','comunidad','socio','caso','proyecto']) a[k]=toText(g(x,k));
    a.fecha=cellYMD(g(x,'fecha'));
    const m=a.caso&&a.caso.match(/(\d+)\s*$/); a.num=m?Number(m[1]):null;
    a.fam=a.num!=null?REG.famByNum.get(a.num)||null:null; a.ps=a.fam?(REG.byFam.get(a.num)||[]):[];
    a.sel=cfg.sel.map(s=>({proj:s.proj,label:s.l.replace(/^Seleccione los kits (entregados )?/i,''),list:selTok(g(x,s.k))}));
    a.items=[]; a.badQty=[];
    N.kits.forEach((k,ki)=>{ const raw=x.r[k.i]; if(raw==null||String(raw).trim()==='') return; const q=toNum(raw);
      if(q===undefined||q<0||!Number.isInteger(q)){ a.badQty.push(`${k.name}: ${raw}`); return; }
      if(!q) return;
      const hit=a.sel.find(s=>s.list.some(t=>match(t,k.name)));
      const proj=hit?hit.proj:(k.proj||(cfg.projCol&&a.proyecto?(fold(a.proyecto)==='us'?'DHR':a.proyecto):'Sin datos'));
      a.items.push({ki,q,proj}); k.total+=q; });
    a.serv=N.services.map(sv=>{ const raw=x.r[sv.i]; if(raw==null||String(raw).trim()==='') return 0; const q=toNum(raw);
      if(q===undefined||q<0){ a.badQty.push(`${sv.label}: ${raw}`); return 0; } sv.total+=q; return q; });
    // Kits marcados en las columnas de proyecto sin cantidad entregada
    a.selNoQty=[]; a.sel.forEach(s=>s.list.forEach(t=>{ if(!a.items.some(it=>match(t,N.kits[it.ki].name))) a.selNoQty.push(`${s.label}: ${t}`); }));
    return a; });
  N.servPairs=[]; N.services.forEach((sv,j)=>{ const f=fold(sv.label); if(!/personas .*usaron/.test(f)) return; const w=f.split(' ').pop(); const u=N.services.findIndex(x=>/usos/.test(fold(x.label))&&fold(x.label).split(' ').pop()===w); if(u>=0) N.servPairs.push([u,j]); });
  N.cat=N.kits.map(k=>cfg.defaultCat(`${k.name} ${k.label}`)); N.inc=N.kits.map(()=>true);
  N.matProj=N.kits.map(k=>/echo/i.test(`${k.name} ${k.label}`)?'ECHO ALERT':'DHR Emergencia');
  N.matProjOtro=N.kits.map(()=>'');
  N.socioList=countBy(N.rows,a=>a.socio||'(vacío)'); N.valid=new Set(N.socioList.map(([s])=>fold(s)));
  N.minValid=validFrom(N.rows.map(a=>a.fecha)); dateRange(N);
  N.filters={from:N.minDate,to:N.maxDate,cats:{},kcat:new Set(KIT_CATS)};
  nfiAnalyze(N);
  return N;
}

const NFI_CRIT=[
  ['dup','Entregas duplicadas (misma familia, mismo día y mismos kits)'],
  ['near','Posibles duplicados (misma familia y mismos kits con 1 a 7 días de diferencia, o varias entregas el mismo día)'],
  ['socio','Socio implementador no válido'],
  ['noCase','Código de caso que no existe en Registro de Familias'],
  ['noPers','Familia sin integrantes en Registro de Familias'],
  ['fecha','Fecha de asistencia vacía, futura o muy antigua'],
  ['sinKits','Entrega sin kits ni servicios (todas las cantidades en cero o vacías)'],
  ['serv','Servicios inconsistentes (más personas que usos registrados)'],
  ['qty','Cantidades no válidas (negativas o con decimales)'],
  ['selQty','Kit seleccionado en una columna de proyecto sin cantidad entregada'],
  ['sinProy','Kits entregados sin proyecto identificado'],
  ['lugar','Entrega sin estado, municipio o parroquia']];
function nfiAnalyze(N){
  const qv=a=>a.items.map(it=>`${it.ki}:${it.q}`).sort().join(',')+'|'+(a.serv||[]).join(',');
  N.rows.forEach(a=>{ const out=[], add=(k,d)=>out.push({k,d});
    if(!N.valid.has(fold(a.socio||'(vacío)'))) add('socio',`Socio «${a.socio||'vacío'}» no marcado como válido`);
    if(!a.fam) add('noCase',`${a.caso||'(vacío)'} no está en el Registro cargado`); else if(!a.ps.length) add('noPers',`${a.caso} no tiene personas en beneficiaries_vzl`);
    { const dp=dateProblem(a.fecha,N.minValid); if(dp) add('fecha',dp); }
    if(!a.items.length&&!a.badQty.length&&!(a.serv||[]).some(v=>v>0)) add('sinKits','Ningún kit ni servicio con cantidad mayor que cero');
    (N.servPairs||[]).forEach(([u,pp])=>{ if(a.serv[pp]>a.serv[u]) add('serv',`${N.services[pp].label}: ${a.serv[pp]}; ${N.services[u].label}: ${a.serv[u]}`); });
    if(a.badQty.length) add('qty',a.badQty.join('; '));
    if(a.selNoQty.length) add('selQty',a.selNoQty.join('; '));
    const sp=a.items.filter(it=>it.proj==='Sin datos'); if(sp.length) add('sinProy',sp.map(it=>`${N.kits[it.ki].name} (${it.q})`).join('; '));
    if(!a.estado||!a.municipio||!a.parroquia) add('lugar','Faltan datos de ubicación de la entrega');
    a.issues=out; });
  const byCase=new Map(); N.rows.forEach(a=>{ if(!a.caso) return; const k=fold(a.caso); if(!byCase.has(k)) byCase.set(k,[]); byCase.get(k).push(a); });
  const dn=d=>Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10))/86400000;
  for(const g of byCase.values()){ if(g.length<2) continue;
    g.forEach(a=>{ if(!a.fecha) return;
      const ex=g.filter(b=>b!==a&&b.fecha===a.fecha&&qv(b)===qv(a));
      if(ex.length){ a.issues.unshift({k:'dup',d:`Igual a: ${ex.map(b=>b.code).join(', ')}`}); return; }
      const nr=g.filter(b=>b!==a&&b.fecha&&((b.fecha===a.fecha)||(qv(b)===qv(a)&&Math.abs(dn(b.fecha)-dn(a.fecha))<=7)));
      if(nr.length) a.issues.unshift({k:'near',d:`Otra entrega a la misma familia: ${nr.map(b=>`${b.code} (${dmy(b.fecha)})`).join(', ')}`}); }); }
}
const NFI_FCATS=[['socio','Socio implementador'],['estado','Estado de la entrega'],['municipio','Municipio de la entrega'],['parroquia','Parroquia de la entrega'],['alojamiento','Alojamiento']];
function nfiPass(a,F){
  if(F.from||F.to){ if(!a.fecha) return false; if(F.from&&a.fecha<F.from) return false; if(F.to&&a.fecha>F.to) return false; }
  for(const k in F.cats){ const s=F.cats[k]; if(s&&s.size&&!s.has(a[k]??'(vacío)')) return false; }
  return true;
}
const nfiItems=(a,F)=>a.items.filter(it=>F.kcat.has(S.nfi.cat[it.ki]));
function nfiRows(F=S.nfi.filters){ return S.nfi.rows.filter(a=>nfiPass(a,F)&&(nfiItems(a,F).length||F.kcat.size===KIT_CATS.length)); }
function nfiCleanRows(){ const N=S.nfi, F=N.filters, base=nfiRows(F), inB=new Set(base);
  return base.concat(N.rows.filter(a=>!inB.has(a)&&a.issues.some(i=>i.k==='fecha')&&nfiPass(a,{...F,from:'',to:''}))); }
function nfiSummary(rows){ return NFI_CRIT.map(([k,l])=>[l,rows.filter(a=>a.issues.some(i=>i.k===k)).length]); }
const isPreg=p=>p.perfil&&['embarazada','lactante','embarazada/lactante'].some(x=>[...p.perfil].some(y=>fold(y)===fold(x)));
function nfiTables(F=S.nfi.filters){
  const N=S.nfi, rows=nfiRows(F), cats=KIT_CATS.filter(c=>F.kcat.has(c));
  const tot=(a,c)=>a.items.filter(it=>N.cat[it.ki]===c).reduce((s,it)=>s+it.q,0);
  const ent={cols:[{h:'ID entrega'},{h:'Fecha de asistencia',type:'date'},{h:'Estado donde se brindó la asistencia'},{h:'Municipio donde se brindó la asistencia'},{h:'Parroquia donde se brindó la asistencia'},{h:'¿Está en un alojamiento?'},{h:'Alojamiento'},{h:'Comunidad'},{h:'Socio Implementador'},{h:'Código de caso'},{h:'Número de beneficiarios'},...cats.map(c=>({h:`Kits ${c} entregados`})),{h:'Total de kits entregados'},...N.services.map(sv=>({h:sv.label}))],
    data:rows.map(a=>[a.code,a.fecha||null,a.estado,a.municipio,a.parroquia,a.isAloj,a.alojamiento,a.comunidad,a.socio,a.caso,a.ps.length||'Sin datos',...cats.map(c=>tot(a,c)),cats.reduce((s,c)=>s+tot(a,c),0),...a.serv])};
  const kit={cols:[{h:'ID entrega'},{h:'Fecha de asistencia',type:'date'},{h:'Código de caso'},{h:'Socio Implementador'},{h:'Kit'},{h:'Categoría'},{h:'Proyecto'},{h:'Cantidad'}],
    data:rows.flatMap(a=>nfiItems(a,F).map(it=>[a.code,a.fecha||null,a.caso,a.socio,N.kits[it.ki].name,N.cat[it.ki],it.proj,it.q]))};
  const ben={cols:[{h:'ID entrega'},{h:'Fecha de asistencia',type:'date'},{h:'Código de caso'},{h:'Beneficiario'},{h:'Sexo'},{h:'Edad'},{h:'Parentesco con el/la representante'},{h:'Tiene discapacidad'},{h:'Embarazada o lactante'}],
    data:rows.flatMap(a=>a.ps.length?a.ps.map(p=>[a.code,a.fecha||null,a.caso,p.name,p.sexo||'Sin datos',p.birth&&a.fecha&&p.birth<=a.fecha?ageAt(p.birth,a.fecha):'Sin datos',p.parentesco||'Sin datos',p.disc||'Sin datos',isPreg(p)?'Sí':'No'])
      :[[a.code,a.fecha||null,a.caso,'Sin datos','Sin datos','Sin datos','Sin datos','Sin datos','Sin datos']])};
  return {ent,kit,ben,rows};
}
async function nfiExportPbi(){
  const T=nfiTables(), F=S.nfi.filters, tag=F.from&&F.to?`_${F.from}_a_${F.to}`:'', wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,buildSheet(T.ent.cols,T.ent.data),'Entregas');
  XLSX.utils.book_append_sheet(wb,buildSheet(T.kit.cols,T.kit.data),'Kits entregados');
  XLSX.utils.book_append_sheet(wb,buildSheet(T.ben.cols,T.ben.data),'Beneficiarios');
  await saveFile(`${S.nfi.cfg.file}_PowerBI${tag}.xlsx`,xlsxBlob(wb));
}
async function nfiExportErrors(){
  const rows=nfiCleanRows(), wb=XLSX.utils.book_new(), order=new Map(NFI_CRIT.map(([k],i)=>[k,i])), lab=new Map(NFI_CRIT);
  XLSX.utils.book_append_sheet(wb,buildSheet([{h:'Descripción'},{h:'Cantidad'}],nfiSummary(rows)),'Resumen');
  const lines=rows.flatMap(a=>a.issues.map(i=>({a,i}))).sort((x,y)=>order.get(x.i.k)-order.get(y.i.k)||(x.a.caso||'').localeCompare(y.a.caso||''));
  XLSX.utils.book_append_sheet(wb,buildSheet([{h:'Problema'},{h:'Detalle'},{h:'Código'},{h:'Fila en el Excel'},{h:'Código de caso'},{h:'Fecha de asistencia',type:'date'},{h:'Socio Implementador'},{h:'Cargado por'}],
    lines.map(({a,i})=>[lab.get(i.k),i.d,a.code,a.n,a.caso,a.fecha||null,a.socio,a.createdBy])),'Incidencias');
  await saveFile(`${S.nfi.cfg.file}_Errores_${TODAY_YMD}.xlsx`,xlsxBlob(wb));
}

const MAT_PROJS=['ECHO ALERT','DHR Emergencia','Otro'];
const MAT_BANDS=[
  ['Niñas de 0 a 5 años','Niños de 0 a 5 años',0,5],
  ['Niñas de 6 a 9 años','Niños de 6 a 9 años',6,9],
  ['Niñas de 10 a 11 años','Niños de 10 a 11 años',10,11],
  ['Niñas de 12 a 14 años','Niños de 12 a 14 años',12,14],
  ['Niñas de 15 a 17 años','Niños de 15 a 17 años',15,17],
  ['Mujeres de 18 a 19 años','Hombres de 18 a 19 años',18,19],
  ['Mujeres de 20 a 49 años','Hombres de 20 a 49 años',20,49],
  ['Mujeres de 50 a 59 años','Hombres de 50 a 59 años',50,59],
  ['Mujeres de 60 años o más','Hombres de 60 años o más',60,150]
];
const isIndig=p=>!!((p.indig&&!['no','ninguno','ninguna','no aplica','na','n a'].includes(fold(p.indig)))||(p.perfil&&[...p.perfil].some(y=>/indig/.test(fold(y)))));
async function nfiExportMatriz(){
  const N=S.nfi, F=N.filters, tag=F.from&&F.to?`_${F.from}_a_${F.to}`:'';
  const rows=nfiRows(F).filter(a=>N.valid.has(fold(a.socio||'(vacío)'))).slice().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')||a.n-b.n);
  if(!rows.length){ toast('No hay entregas válidas con los filtros y socios seleccionados.'); return; }
  const seenBySec={NFI:new Set(),WASH:new Set()}, grpMap=new Map();
  const getGrp=(fecha,proj,socio,estado,mun,parr,com,sector,rec)=>{
    const k=[fecha,proj,socio,estado,mun,parr,com,sector,rec].join('|');
    let g=grpMap.get(k);
    if(!g){ g={fecha,proj,socio,estado,mun,parr,com,sector,rec,indig:0,disc:0,preg:0,ages:Array(18).fill(0),kits:0}; grpMap.set(k,g); }
    return g;
  };
  const pKey=p=>p.pid?`id:${p.pid}`:`f:${p.fam}|${p.n}`;
  rows.forEach(a=>{
    const slices=new Map();
    nfiItems(a,F).forEach(it=>{
      const sec=N.cat[it.ki]==='WASH'?'WASH':'NFI';
      const mp=N.matProj&&N.matProj[it.ki]?N.matProj[it.ki]:'DHR Emergencia';
      const proj=mp==='Otro'?((N.matProjOtro&&N.matProjOtro[it.ki]||'').trim()||'Otro'):mp;
      const sk=`${proj}|${sec}`;
      slices.set(sk,{proj,sec,q:(slices.get(sk)?.q||0)+it.q});
    });
    slices.forEach(({proj,sec,q})=>{
      const seen=seenBySec[sec], psNo=[], psSi=[];
      (a.ps||[]).forEach(p=>{ const pk=pKey(p); if(seen.has(pk)) psSi.push(p); else{ seen.add(pk); psNo.push(p); } });
      const addBucket=(rec,ps,kitsQ)=>{
        const g=getGrp(a.fecha||'',proj,a.socio||'',a.estado||'',a.municipio||'',a.parroquia||'',a.comunidad||'',sec,rec);
        g.kits+=kitsQ;
        ps.forEach(p=>{
          if(isIndig(p)) g.indig++;
          if(fold(p.disc)==='si') g.disc++;
          if(isPreg(p)) g.preg++;
          const age=p.birth&&a.fecha&&p.birth<=a.fecha?ageAt(p.birth,a.fecha):p.age;
          const sx=fold(p.sexo);
          if(age!=null&&(sx==='mujer'||sx==='hombre')){
            const bi=MAT_BANDS.findIndex(([,,lo,hi])=>age>=lo&&age<=hi);
            if(bi>=0) g.ages[bi*2+(sx==='mujer'?0:1)]++;
          }
        });
      };
      if(psNo.length){
        addBucket('NO',psNo,q);
        if(psSi.length) addBucket('SÍ',psSi,0);
      } else if(psSi.length){
        addBucket('SÍ',psSi,q);
      } else {
        addBucket('NO',[],q);
      }
    });
  });
  const outRows=[...grpMap.values()].sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.proj.localeCompare(b.proj)||a.socio.localeCompare(b.socio)||a.estado.localeCompare(b.estado)||a.mun.localeCompare(b.mun)||a.parr.localeCompare(b.parr)||a.com.localeCompare(b.com)||a.sector.localeCompare(b.sector)||a.rec.localeCompare(b.rec));
  if(typeof mmFillGeo==='function') mmFillGeo(outRows);
  const headers=[
    'FECHA','PROYECTO','SOCIO','ESTADO','MUNICIPIO','PARROQUIA','COMUNIDAD','SECTOR',
    'NOMBRE DE LA ACTIVIDAD','INDICADOR 345W','INDICADOR DE CONVENIO','INDICADOR DEL PROYECTO',
    'Número de Población Indígena','Número de Personas con discapacidad','Número de Personas embarazadas o en lactancia',
    'RECURRENTES','TOTAL RECURRENTES',
    ...MAT_BANDS.flatMap(([f,m])=>[f,m]),
    'TOTAL PERSONAS','TOTAL SERVICIOS','TOTAL KITS'
  ];
  const matDate=ymdStr=>{
    if(!ymdStr||!/^\d{4}-\d{2}-\d{2}$/.test(ymdStr)) return null;
    const [y,m,d]=ymdStr.split('-').map(Number);
    return new Date(Date.UTC(y,m-1,d));
  };
  const fname=`Matriz_Monitoreo_NFI${tag}.xlsx`;
  if(window.ExcelJS){
    const wb=new ExcelJS.Workbook(), ws=wb.addWorksheet('Matriz de monitoreo',{views:[{state:'frozen',ySplit:1}]});
    const thin={style:'thin',color:{argb:'FFCBD5E1'}}, box={top:thin,left:thin,bottom:thin,right:thin};
    ws.columns=headers.map((h,i)=>({width:i===0?14:i<8?18:i<12?22:i<17?16:i<35?14:15}));
    const r1=ws.getRow(1);
    headers.forEach((h,i)=>{ const c=r1.getCell(i+1); c.value=h; c.font={bold:true,color:{argb:'FFFFFFFF'},size:10}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0033A0'}}; c.alignment={horizontal:'center',vertical:'middle',wrapText:true}; c.border=box; });
    r1.height=34;
    outRows.forEach((g,idx)=>{
      const rIdx=2+idx, r=ws.getRow(rIdx), totPers=g.ages.reduce((s,v)=>s+v,0);
      const vals=[
        matDate(g.fecha),g.proj,g.socio,g.estado,g.mun,g.parr,g.com,g.sector,
        null,null,null,null,
        g.indig,g.disc,g.preg,g.rec,null,
        ...g.ages,
        {formula:`SUM(R${rIdx}:AI${rIdx})`,result:totPers},null,g.kits
      ];
      vals.forEach((v,ci)=>{
        const c=r.getCell(ci+1); c.value=v; c.border=box;
        if(ci===0){ c.numFmt='dd/mm/yyyy'; c.alignment={horizontal:'center'}; }
        if(ci>=3&&ci<=6&&g._geo){
          const gk=['estado','mun','parr','com'][ci-3], st=g._geo[gk];
          if(st==='imp') c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF6CC'}};
          else if(st==='miss'){ c.value=null; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFDE2E2'}}; }
        }
        if(ci>=12&&ci!==15&&ci!==16&&ci!==36){ c.numFmt='#,##0'; }
        if(ci===15) c.alignment={horizontal:'center'};
      });
    });
    ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,outRows.length+1),column:headers.length}};
    const buf=await wb.xlsx.writeBuffer();
    await saveFile(fname,new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); return;
  }
  const wb=XLSX.utils.book_new();
  const aoa=[headers,...outRows.map(g=>[g.fecha||null,g.proj,g.socio,g.estado,g.mun,g.parr,g.com,g.sector,null,null,null,null,g.indig,g.disc,g.preg,g.rec,null,...g.ages,g.ages.reduce((s,v)=>s+v,0),null,g.kits])];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'Matriz de monitoreo');
  await saveFile(fname,xlsxBlob(wb));
}

/* --- Vistas --- */
function kitRowsHtml(N){
  const isNfi=N.cfg.id==='nfi', ord=c=>KIT_CATS.indexOf(c);
  return N.kits.map((k,i)=>({k,i})).filter(x=>x.k.total>0).sort((a,b)=>ord(N.cat[a.i])-ord(N.cat[b.i])||b.k.total-a.k.total)
    .map(({k,i},j,arr)=>{
      const projCell=isNfi
        ? `<td><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><select class="in" data-mproj="${i}" aria-label="Proyecto del kit">${MAT_PROJS.map(p=>`<option ${N.matProj[i]===p?'selected':''}>${p}</option>`).join('')}</select><input type="text" class="in" data-mproj-otro="${i}" value="${esc(N.matProjOtro[i]||'')}" placeholder="Escribir proyecto…" style="min-width:140px;${N.matProj[i]==='Otro'?'':'display:none'}"></div></td>`
        : `<td>${esc(k.proj||'—')}</td>`;
      return `<tr${j&&N.cat[arr[j-1].i]!==N.cat[i]?' class="kitgroup"':''}><td class="kinc"><input type="checkbox" data-kinc="${i}" ${N.inc[i]?'checked':''} aria-label="Incluir ${esc(k.name)} en el informe"></td><td style="white-space:normal" class="${N.inc[i]?'':'muted'}">${esc(k.name)}</td><td class="num">${fmt(k.total)}</td>${projCell}<td>${kitSelect(i,N.cat[i],isNfi)}</td></tr>`;
    }).join('');
}
function bindKitSelects(N){
  document.querySelectorAll('[data-kinc]').forEach(b=>b.onchange=()=>{ const i=+b.dataset.kinc; N.inc[i]=b.checked; b.closest('tr').children[1].classList.toggle('muted',!b.checked); });
  document.querySelectorAll('[data-kit]').forEach(sel=>sel.onchange=()=>{ const i=+sel.dataset.kit; N.cat[i]=sel.value; $('#kitRows').innerHTML=kitRowsHtml(N); bindKitSelects(N); const ns=document.querySelector(`[data-kit="${i}"]`); if(ns){ ns.focus(); ns.closest('tr').scrollIntoView({block:'nearest'}); } });
  document.querySelectorAll('[data-mproj]').forEach(sel=>sel.onchange=()=>{ const i=+sel.dataset.mproj; N.matProj[i]=sel.value; const inp=document.querySelector(`[data-mproj-otro="${i}"]`); if(inp){ inp.style.display=sel.value==='Otro'?'':'none'; if(sel.value==='Otro') inp.focus(); } });
  document.querySelectorAll('[data-mproj-otro]').forEach(inp=>inp.oninput=()=>{ N.matProjOtro[+inp.dataset.mprojOtro]=inp.value; });
}
function kitSelect(i,v,nfiOnly=false){ const opts=nfiOnly?['NFI','WASH']:KIT_CATS; return `<select class="in kitcat kitcat-${v.toLowerCase()}" data-kit="${i}" aria-label="Tipo de kit">${opts.map(c=>`<option ${c===v?'selected':''}>${c}</option>`).join('')}</select>`; }
async function nfiLoadRegistro(f){
  busy(true); await nextFrame();
  try{ const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
    if(!famDetect(wb)){ toast('Ese archivo no es un Registro de Familias (faltan las pestañas vzl_cases y beneficiaries_vzl).'); return; }
    const D=famLoad(wb,f.name); if(D.fatal.length){ toast('Al Registro le faltan columnas: '+D.fatal.join(', ')); return; }
    S.registro=D; S.nfi=nfiLoad(S.nfiWb.wb,S.nfiWb.name,D,S.nfiWb.type); render();
  }catch(e){ console.error(e); toast('No se pudo leer el Registro: '+(e.message||e)); } finally{ busy(false); }
}
function nfiViewVerify(){
  const N=S.nfi, R=S.registro;
  const ledger=N.check.map(c=>`<tr class="${c.req?'req':''}"><td>${esc(c.label)}</td><td data-label="Columna">${c.found?`${esc(c.col)} <span class="muted">${c.col?'· ':''}${esc(c.how)}</span>`:'—'}</td><td data-label="Estado">${c.found?'<span class="status ok">Encontrada</span>':'<span class="status bad">Falta</span>'}</td></tr>`).join('');
  const regBox=R?`<div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><div><b>Registro de Familias vinculado</b><div class="muted" style="font-size:14px">${esc(R.file)} · ${fmt(R.fams.length)} familias · ${fmt(R.pers.length)} personas</div></div><label class="btn sm"><input type="file" id="nRegIn" accept=".xlsx,.xls" hidden>Cambiar Registro</label></div></div>`
    :`<div class="note bad">Para procesar las entregas de kits se necesita el <b>Registro de Familias</b>: los beneficiarios de cada entrega son todos los integrantes de la familia.</div>
      <div class="drop" id="nRegDrop" tabindex="0" role="button" aria-label="Cargar Registro de Familias"><strong>Carga aquí el Excel de Registro de Familias</strong><span>Descárgalo completo del IMS, sin filtros de fecha</span></div><input type="file" id="nRegIn" accept=".xlsx,.xls" hidden>`;
  let body='';
  if(R&&N.rows){
    const n=N.rows.length, linked=N.rows.filter(a=>a.fam).length, kits=N.kits.filter(k=>k.total>0);
    body=`<div class="facts"><div><b>${fmt(n)}</b><span>Entregas</span></div><div><b>${fmt(N.kits.reduce((s,k)=>s+k.total,0))}</b><span>Kits entregados</span></div><div><b>${esc(N.minDate?dmy(N.minDate):'—')}</b><span>Primera entrega</span></div><div class="${linked/n>0.9?'ok':'warn'}"><b>${pct(linked,n)}</b><span>Familias encontradas en el Registro</span></div></div>
    ${linked/n<0.8?`<div class="note warn">${fmt(n-linked)} entregas (${pct(n-linked,n)}) tienen un código de caso que no existe en el Registro cargado, por lo que sus beneficiarios quedarán como “Sin datos”. Verifica que el Registro sea la descarga completa.</div>`:''}
    <h2>Clasificación de los kits</h2>
    <div class="panel"><p class="muted" style="margin:0 0 10px;font-size:14px">Confirma la categoría de cada kit entregado. ${esc(N.cfg.catNote)} La clasificación se usa para separar NFI, WASH y Otro en la tabla para Power BI y en el informe.</p>
      <div class="row" style="margin:0 0 8px;gap:14px;justify-content:space-between"><div class="row" style="gap:14px"><span class="kitchip kitcat-nfi">NFI</span><span class="kitchip kitcat-wash">WASH</span><span class="kitchip kitcat-otro">Otro</span></div><div class="row"><button class="btn sm" type="button" id="kincAll">Incluir todos</button><button class="btn sm" type="button" id="kincNone">Excluir todos</button></div></div><p class="muted" style="margin:0 0 8px;font-size:13px">Desmarca «Incluir» para dejar un kit fuera del informe PDF; se mantiene en la limpieza de datos y en la tabla para Power BI.</p>
      <div class="scroll"><table class="kits"><thead><tr><th>Incluir</th><th>Kit</th><th class="num">Cantidad entregada</th><th>${N.cfg.id==='nfi'?'Proyecto':'Proyecto según el nombre'}</th><th>${N.cfg.id==='nfi'?'Tipo':'Categoría'}</th></tr></thead><tbody id="kitRows">${kitRowsHtml(N)}</tbody></table></div>
      ${N.kits.length>kits.length?`<p class="muted" style="font-size:13px;margin:8px 0 0">Se omiten ${N.kits.length-kits.length} tipos de kit sin entregas en este archivo.</p>`:''}</div>
    ${N.services.length?`<h2>Servicios registrados (no son kits)</h2><div class="scroll"><table><thead><tr><th>Servicio</th><th class="num">Total</th></tr></thead><tbody>${N.services.map(sv=>`<tr><td style="white-space:normal">${esc(sv.label)}</td><td class="num">${fmt(sv.total)}</td></tr>`).join('')}</tbody></table></div>`:''}
    <h2>Socios implementadores válidos</h2><div class="panel">
      <p class="muted" style="margin:0 0 8px;font-size:14px">Desmarca los socios que no deberían realizar entregas de kits. Sus entregas se reportan en la limpieza, pero se incluyen igual en Power BI y en el informe.</p>
      <div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" id="nvAll">Seleccionar todos</button><button class="btn sm" type="button" id="nvNone">Quitar todos</button></div>
      ${N.socioList.map(([x,c])=>`<label class="check"><input type="checkbox" data-nvalid value="${esc(fold(x))}" ${N.valid.has(fold(x))?'checked':''}> ${esc(x)} <span class="muted">(${fmt(c)} entregas)</span></label>`).join('')}</div>`;
  }
  return `<h1>${esc(N.cfg.name)}</h1>
  <p class="lead">Cada entrega se vincula con su familia por el Código de caso; los beneficiarios son todos los integrantes registrados en el Registro de Familias. Las cantidades de kits se toman de las columnas «Cantidad …»; el proyecto de cada kit sale de las columnas «Seleccione los kits … ${esc(N.cfg.sel.map(x=>x.proj).filter((v,i,a)=>a.indexOf(v)===i).join(' / '))}» o, si están vacías, del nombre del kit${N.cfg.projCol?' y, en último caso, de la columna «Proyecto»':''}.${N.services.length?' Los servicios (baños, duchas, lavandería, agua potable) se procesan aparte porque no son kits.':''}</p>
  ${N.fatal.length?`<div class="note bad">Faltan columnas necesarias: ${esc(N.fatal.join(', '))}.</div>`:''}
  ${regBox}${body}
  <h2>Columnas utilizadas</h2>
  <div class="scroll"><table class="ledger"><thead><tr><th>Campo</th><th>Columna</th><th>Estado</th></tr></thead><tbody>${ledger}</tbody></table></div>
  <p class="muted" style="font-size:13px;margin:8px 0 0">* Obligatorias. No se usan ${esc(N.cfg.ignored)}.</p>
  <div class="actions"><button class="btn" type="button" id="back">Cargar otro archivo</button><button class="btn primary" type="button" id="next" ${N.fatal.length||!R||!N.rows?'disabled':''}>Continuar</button></div>`;
}
function kcatPanel(attr,F){ return `<div class="panel"><p class="muted" style="margin:0 0 6px;font-size:14px">Categorías de kit a incluir</p>${KIT_CATS.map(c=>`<label class="check"><input type="checkbox" data-${attr}="${c}" ${F.kcat.has(c)?'checked':''}> <span class="kitchip kitcat-${c.toLowerCase()}">${c}</span></label>`).join('')}</div>`; }
function nfiSumRows(rows){ return nfiSummary(rows).map(([d,n])=>`<tr><td style="white-space:normal">${esc(d)}</td><td class="num"><span class="status ${n?(d.startsWith('Posibles')||d.startsWith('Kits entregados sin proyecto')||d.startsWith('Entrega sin estado')?'warn':'bad'):'ok'}">${fmt(n)}</span></td></tr>`).join(''); }
function nfiViewReview(){
  const N=S.nfi, F=N.filters, T=nfiTables(), C2=T.ent.cols;
  return `<h1>Datos a procesar</h1>
  <p class="lead">El periodo, los criterios y las categorías de kit se aplican a la limpieza de datos y a la tabla para Power BI.</p>
  <h2 style="margin-top:0">Incidencias encontradas <span class="muted" style="font-weight:400;font-size:14px">(entregas)</span></h2>
  <div class="scroll"><table><thead><tr><th>Descripción</th><th class="num">Cantidad</th></tr></thead><tbody id="nSum">${nfiSumRows(nfiCleanRows())}</tbody></table></div>
  <div class="grid2" style="margin-top:8px">
    <div><h2>Periodo de entrega</h2><div class="panel">${periodPanel('n',N.minDate,N.maxDate,F,N.rows.map(a=>a.fecha),'nrange','Según la Fecha de asistencia.')}</div>
      <h2>Categoría de kit</h2>${kcatPanel('nkc',F)}</div>
    <div><h2>Criterios</h2>${NFI_FCATS.map(([k,l])=>catBlock('n',k,l,N.rows,F.cats[k],'entregas')).join('')}</div>
  </div>
  <h2>Vista previa: entregas <span class="muted" style="font-weight:400;font-size:14px">(<span id="nN">${fmt(T.rows.length)}</span> entregas; primeras 50)</span></h2>
  <div class="scroll" style="max-height:420px"><table><thead><tr>${C2.map(c=>`<th>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${T.ent.data.slice(0,50).map(r=>`<tr>${r.map(v=>`<td class="${typeof v==='number'?'num':''}">${esc(v??'')}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${C2.length}" class="muted">Ninguna entrega cumple los filtros.</td></tr>`}</tbody></table></div>
  <div class="actions"><button class="btn" type="button" id="back">Volver</button><button class="btn primary" type="button" id="next">Continuar a exportar</button></div>`;
}
function nfiViewExport(){
  const N=S.nfi; if(N.view==='report') return nfiViewReport();
  const T=nfiTables();
  return `<h1>Exportar</h1>
  <p class="lead">${fmt(T.rows.length)} entregas · ${fmt(T.kit.data.reduce((s,r)=>s+r[7],0))} kits (${esc(KIT_CATS.filter(c=>N.filters.kcat.has(c)).join(', '))}) · ${fmt(T.ben.data.length)} filas de beneficiarios.</p>
  <div class="exports">
    <div class="exp"><h3>Limpieza de datos</h3><p>Un Excel con el resumen y el detalle de incidencias: duplicados, socios no válidos, familias que no están en el Registro, fechas, entregas sin kits, cantidades no válidas, kits seleccionados sin cantidad, kits sin proyecto y entregas sin ubicación. No modifica el archivo original.</p><button class="btn primary" type="button" id="exErr">Descargar reporte</button></div>
    <div class="exp"><h3>Tabla para Power BI</h3><p>Un Excel con tres tablas relacionadas por el Código de la entrega: <b>Entregas</b> (una fila por entrega, con totales por categoría), <b>Kits entregados</b> (una fila por kit, con categoría NFI/WASH/Otro, proyecto y cantidad) y <b>Beneficiarios</b> (una fila por integrante de la familia, con sexo, edad, parentesco, discapacidad y embarazo o lactancia).</p><button class="btn primary" type="button" id="exPbi" ${T.rows.length?'':'disabled'}>Descargar Excel</button></div>
    ${N.cfg.id==='nfi'?`<div class="exp"><h3>Matriz de monitoreo</h3><p>Un Excel con el formato de la Matriz de monitoreo: desagregado por proyecto, socio válido (omitiendo socios errados), comunidad/parroquia/municipio, sector (NFI o WASH), recurrentes (SI/NO), población indígena, discapacidad, embarazadas/lactantes, edad y sexo, y total de kits.</p><button class="btn primary" type="button" id="exMat" ${T.rows.length?'':'disabled'}>Descargar Excel</button></div>`:''}
    <div class="exp"><h3>Construir informe</h3><p>Un PDF con el análisis de las entregas: kits NFI y WASH por separado, kits por proyecto, familias y personas beneficiarias, perfil por sexo y edad, lugares, socios y calidad de los datos.</p><button class="btn primary" type="button" id="exRep">Construir informe</button></div>
    <div class="exp"><h3>Tablero interactivo</h3><p>Un tablero con filtros de periodo, estado, municipio, parroquia y socio: resultados por formulario, desagregación por edad y sexo, población clave, histórico, ubicaciones y socios. Se puede exportar en PDF con los filtros aplicados.</p><button class="btn primary" type="button" data-opendash>Abrir tablero</button></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a filtros</button><button class="btn" type="button" id="restart">Procesar otro archivo</button></div>`;
}

/* --- Informe --- */
function nfiRepInit(){ const N=S.nfi; if(!N.rep){ let logo=null; try{ logo=JSON.parse(localStorage.getItem(LOGO_KEY)||'null'); }catch(e){}
  N.rep={from:N.minDate,to:N.maxDate,cats:{},kcat:new Set(KIT_CATS),title:N.cfg.title,notes:'',logo}; } return N.rep; }
const repItems=(a,R)=>nfiItems(a,R).filter(it=>S.nfi.inc[it.ki]);
function nfiRepData(){
  const N=S.nfi, R=nfiRepInit(), rows=nfiRows(R).filter(a=>repItems(a,R).length||(a.serv||[]).some(v=>v>0)), items=rows.flatMap(a=>repItems(a,R).map(it=>({a,it,k:N.kits[it.ki],cat:N.cat[it.ki]})));
  const fams=new Map(); rows.forEach(a=>{ if(a.caso&&!fams.has(fold(a.caso))) fams.set(fold(a.caso),a); });
  const fl=[...fams.values()], pers=fl.flatMap(a=>a.ps.map(p=>({p,age:p.birth&&a.fecha&&p.birth<=a.fecha?ageAt(p.birth,a.fecha):null})));
  const sum=arr=>arr.reduce((s,x)=>s+x.it.q,0);
  return {R,rows,items,fams:fl,pers,total:sum(items),byCat:KIT_CATS.map(c=>[c,sum(items.filter(x=>x.cat===c))]).filter(x=>R.kcat.has(x[0])&&x[1]>0),
    kitsBy:c=>countBy(items.filter(x=>x.cat===c).flatMap(x=>Array(1).fill(x)),x=>x.k.name).map(([n])=>[n,sum(items.filter(x=>x.cat===c&&x.k.name===n))]).sort((a,b)=>b[1]-a[1]),
    proj:['DHR','ECHO','No especificado','Sin datos'].map(p=>[p,sum(items.filter(x=>x.it.proj===p))]).filter(x=>x[1]),
    sinReg:fl.filter(a=>!a.ps.length).length};
}
function nfiRepFacts(X){ return `<div><b>${fmt(X.rows.length)}</b><span>Entregas</span></div><div><b>${fmt(X.fams.length)}</b><span>Familias</span></div><div><b>${fmt(X.pers.length)}</b><span>Personas beneficiarias (Registro)</span></div><div><b>${fmt(X.total)}</b><span>Kits entregados</span></div>`; }
function nfiViewReport(){
  const N=S.nfi, R=nfiRepInit();
  return `<h1>Construir informe</h1>
  <p class="lead">Genera un PDF con el análisis de las entregas de kits para el periodo, las categorías, los socios y la ubicación que elijas.</p>
  <div class="facts" id="nRepFacts">${nfiRepFacts(nfiRepData())}</div>
  <div class="grid2">
    <div><h2 style="margin-top:0">Periodo</h2><div class="panel">${periodPanel('nr',N.minDate,N.maxDate,R,N.rows.map(a=>a.fecha),'nrrange','')}</div>
      <h2>Categoría de kit</h2>${kcatPanel('nrkc',R)}
      <h2>Socio y ubicación</h2>${NFI_FCATS.map(([k,l])=>catBlock('nr',k,l,N.rows,R.cats[k],'entregas')).join('')}</div>
    <div><h2 style="margin-top:0">Contenido</h2><div class="panel">
      <div class="field" style="margin-bottom:12px"><label for="rTitle">Título del informe</label><input class="in" id="rTitle" style="width:100%" maxlength="70" value="${esc(R.title)}"></div>
      <div class="field" style="margin-bottom:12px"><label for="rNotes">Observaciones (opcional)</label><textarea class="in" id="rNotes" rows="4" style="width:100%;resize:vertical" maxlength="600" placeholder="Contexto, logros o limitaciones que deban acompañar las cifras.">${esc(R.notes)}</textarea></div>
      <div class="field"><label>Logo (opcional)</label><div class="row">${R.logo?`<img src="${R.logo.data}" alt="Logo cargado" style="height:36px;max-width:120px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px;padding:3px"><button class="btn sm" type="button" id="rLogoDel">Quitar logo</button>`:''}
        <label class="btn sm"><input type="file" id="rLogo" accept="image/png,image/jpeg" hidden>${R.logo?'Cambiar logo':'Cargar logo PNG o JPG'}</label></div></div>
    </div></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="rBack">Volver a exportar</button><button class="btn primary" type="button" id="rPdf">Descargar PDF</button></div>`;
}
async function nfiPdf(ext){
  if(!window.jspdf||!window.jspdf.jsPDF){ toast('No se pudo cargar el generador de PDF. Revisa la conexión y recarga la página.'); return; }
  const N=S.nfi, X=nfiRepData(), R=X.R; if(!X.rows.length){ if(!ext) toast('No hay entregas con los criterios seleccionados.'); return; }
  const doc=ext?ext.doc:new window.jspdf.jsPDF({unit:'mm',format:'a4'}), W=210, M=14, CW=W-2*M, LX=M, RX=M+CW/2+4, HW=CW/2-4; if(ext) doc.addPage();
  const C={blue:[0,51,160],blue2:[65,143,222],pale:[231,238,249],ink:[34,43,69],grey:[107,114,128],line:[217,223,234],amber:[226,149,0],white:[255,255,255],nfi:[65,143,222],wash:[38,166,154],otro:[214,160,60]};
  const catColor={NFI:C.nfi,WASH:C.wash,Otro:C.otro};
  const fill=c=>doc.setFillColor(...c), stroke=c=>doc.setDrawColor(...c), color=c=>doc.setTextColor(...c);
  const T=(s,x,y,o={})=>{ doc.setFont('helvetica',o.bold?'bold':'normal'); doc.setFontSize(o.size||8); color(o.c||C.ink); doc.text(String(s),x,y,{align:o.align||'left',maxWidth:o.maxW}); };
  const fit=(s,w,size,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(size); s=String(s); if(doc.getTextWidth(s)<=w) return s; while(s.length>1&&doc.getTextWidth(s+'…')>w) s=s.slice(0,-1); return s+'…'; };
  const NN=n=>Number(n).toLocaleString('es-VE');
  const section=(t,x,y)=>{ T(t,x,y,{size:9.5,bold:true,c:C.blue}); stroke(C.blue2); doc.setLineWidth(0.5); doc.line(x,y+1.6,x+12,y+1.6); return y+6; };
  const bars=(items,x,y,w,o={})=>{ const rowH=5.6, lw=o.lw||w*0.5, vw=28, bw=w-lw-vw-2, max=Math.max(1,...items.map(i=>i[1]));
    items.forEach(([l,v],i)=>{ const yy=y+i*rowH; { const L=String(l); doc.setFont('helvetica','normal'); doc.setFontSize(7.2); if(doc.getTextWidth(L)<=lw-2) T(L,x,yy+3.4,{size:7.2}); else { const fs=rowH>=5.6?6.2:5.8; doc.setFontSize(fs); let ls=doc.splitTextToSize(L,lw-2); if(ls.length>2) ls=[ls[0],fit(ls.slice(1).join(' '),lw-2,fs)]; const lh=fs*0.406; T(ls.join('\n'),x,yy+(rowH-lh*ls.length)/2+fs*0.3528*0.8+0.3,{size:fs}); } } fill(C.pale); doc.rect(x+lw,yy+0.8,bw,3.6,'F'); if(v>0){ fill(o.c||C.blue); doc.rect(x+lw,yy+0.8,Math.max(0.6,bw*v/max),3.6,'F'); }
      T(NN(v),x+w-13,yy+3.4,{size:7.2,bold:true,align:'right'}); T(pct(v,o.total||1),x+w,yy+3.4,{size:6.8,c:C.grey,align:'right'}); }); return y+items.length*rowH; };
  const PG={top:20,bottom:277};
  const newPage=()=>{ doc.addPage(); fill(C.blue); doc.rect(0,0,W,11,'F'); fill(C.blue2); doc.rect(0,11,W,0.8,'F'); T(fit(R.title||'',CW,9,true),M,7.2,{size:9,bold:true,c:C.white}); return PG.top; };
  const need=(y,h)=>y+h>PG.bottom?newPage():y;
  // Encabezado
  fill(C.blue); doc.rect(0,0,W,30,'F'); fill(C.blue2); doc.rect(0,30,W,1.4,'F');
  let tx=M;
  if(R.logo){ try{ const h=16, w=Math.min(40,h*R.logo.w/R.logo.h); fill(C.white); doc.roundedRect(M,7,w+4,h+4,1.5,1.5,'F'); doc.addImage(R.logo.data,R.logo.fmt,M+2,9,w,h); tx=M+w+9; }catch(e){ console.warn(e); } }
  T(fit(R.title||'Informe de entrega de kits',W-M-tx-58,15,true),tx,14,{size:15,bold:true,c:C.white});
  T(N.cfg.sub,tx,20.5,{size:8.5,c:[214,226,248]});
  T('PERIODO',W-M,11.5,{size:6.5,bold:true,c:[180,200,240],align:'right'}); T(R.from&&R.to?`${dmy(R.from)} – ${dmy(R.to)}`:'Todo el periodo',W-M,16.5,{size:9,bold:true,c:C.white,align:'right'});
  T(`Emitido el ${dmy(TODAY_YMD)}`,W-M,21.5,{size:7,c:[214,226,248],align:'right'});
  const exc=N.kits.filter((k,i)=>k.total>0&&!N.inc[i]).length;
  const ft=[`Categorías: ${X.byCat.map(c=>c[0]).join(', ')}`,...(exc?[`${exc} tipo${exc>1?'s':''} de kit excluido${exc>1?'s':''} del informe`]:[]),...NFI_FCATS.filter(([k])=>R.cats[k]&&R.cats[k].size).map(([k,l])=>`${l}: ${[...R.cats[k]].join(', ')}`)];
  doc.setFontSize(7.2); const ftl=doc.splitTextToSize(ft.join('  ·  '),CW); T(ftl[0]+(ftl.length>1?' …':''),M,38,{size:7.2,c:C.grey});
  let y=42; const kw=(CW-9)/4;
  [[NN(X.rows.length),'entregas realizadas'],[NN(X.fams.length),'familias atendidas'],[NN(X.pers.length),'personas beneficiarias según el Registro'],[NN(X.total),'kits entregados']].forEach(([v,l],i)=>{ const x=M+i*(kw+3); fill(C.pale); doc.roundedRect(x,y,kw,21,1.5,1.5,'F'); fill(C.blue); doc.rect(x,y,1.2,21,'F');
    T(v,x+5,y+10,{size:17,bold:true,c:C.blue}); doc.setFontSize(7); T(doc.splitTextToSize(l,kw-8).slice(0,2).join('\n'),x+5,y+15.2,{size:7,c:C.grey}); });
  y+=27;
  { const sc=stateCounter(); X.rows.forEach(a=>a.ps.forEach(p=>sc.add(a.estado,p)));
    pdfMapBlock(doc,{x:M,y,w:CW,h:165,vals:sc.vals(),unit:'personas',title:'Personas beneficiarias por estado de entrega',unknown:sc.unknown()}); y=newPage(); }
  // Kits por categoría (barra apilada con colores de categoría)
  y=section('Kits entregados por categoría',M,y);
  { const tot=Math.max(1,X.total); let xx=M; X.byCat.forEach(([c,v])=>{ const w=CW*v/tot; if(w>0){ fill(catColor[c]); doc.rect(xx,y,w,6,'F'); } xx+=w; });
    y+=10; let lx=M; X.byCat.forEach(([c,v])=>{ const s=`${c}: ${NN(v)} kits (${pct(v,tot)})`; fill(catColor[c]); doc.rect(lx,y-2.6,3,3,'F'); T(s,lx+4.5,y,{size:7.5,bold:true}); doc.setFontSize(7.5); lx+=doc.getTextWidth(s)+12; }); y+=7; }
  // Kits NFI | Kits WASH ; Proyecto | Otro
  const blocks=[];
  X.byCat.forEach(([c,v])=>{ if(v) blocks.push({t:`Kits ${c} entregados`,items:X.kitsBy(c).slice(0,8),total:v,c:catColor[c]}); });
  blocks.push({t:'Kits por proyecto',items:X.proj,total:Math.max(1,X.total),c:C.blue});
  for(let i=0;i<blocks.length;i+=2){ const a=blocks[i], b=blocks[i+1], h=6+Math.max(a.items.length,b?b.items.length:0)*5.6; y=need(y,h+2);
    section(a.t,LX,y); bars(a.items,LX,y+6,HW,{total:a.total,c:a.c}); if(b){ section(b.t,RX,y); bars(b.items,RX,y+6,HW,{total:b.total,c:b.c}); } y+=h+5; }
  // Servicios (no son kits)
  { const sv=N.services.map((x,j)=>[x.label,X.rows.reduce((t,a)=>t+(a.serv[j]||0),0)]).filter(x=>x[1]>0);
    if(sv.length){ const rowsN=Math.ceil(sv.length/3), cw=(CW-6)/3; y=need(y,8+rowsN*16); y=section('Servicios WASH',M,y);
      sv.forEach(([l,v],i)=>{ const x=M+(i%3)*(cw+3), yy=y+Math.floor(i/3)*16; fill([231,245,242]); doc.roundedRect(x,yy,cw,13,1.2,1.2,'F'); fill(C.wash); doc.rect(x,yy,1,13,'F');
        T(NN(v),x+4,yy+6,{size:11,bold:true,c:[23,105,94]}); T(fit(l.replace(/^n[uú]mero de /i,''),cw-7,6.6),x+4,yy+10.5,{size:6.6,c:C.grey}); });
      y+=rowsN*16+4; } }
  // Serie y pirámide
  const ds=X.rows.map(a=>a.fecha).filter(Boolean).sort(), span=ds.length?(Date.parse(ds[ds.length-1])-Date.parse(ds[0]))/86400000:0;
  const wk=d=>{ const x=new Date(d+'T00:00:00Z'); x.setUTCDate(x.getUTCDate()-((x.getUTCDay()+6)%7)); return x.toISOString().slice(0,10); };
  const series=span>62?countBy(X.rows.filter(a=>a.fecha),a=>a.fecha.slice(0,7)).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,n])=>[`${MONTHS[+m.slice(5)-1].slice(0,3)} ${m.slice(2,4)}`,n])
    :countBy(X.rows.filter(a=>a.fecha),a=>wk(a.fecha)).sort((a,b)=>a[0].localeCompare(b[0])).map(([w,n])=>[`${+w.slice(8)} ${MONTHS[+w.slice(5,7)-1].slice(0,3).toLowerCase()}`,n]);
  y=need(y,48);
  { let yy=section(span>62?'Entregas por mes':'Entregas por semana',LX,y); const s=series.slice(-14), h=28, base=yy+h, max=Math.max(1,...s.map(z=>z[1])), bw=HW/Math.max(1,s.length);
    stroke(C.line); doc.setLineWidth(0.2); doc.line(LX,base,LX+HW,base);
    s.forEach(([l,v],i)=>{ const bh=Math.max(0.4,(h-6)*v/max), xx=LX+i*bw+bw*0.15, ww=bw*0.7; fill(C.blue); doc.rect(xx,base-bh,ww,bh,'F'); T(NN(v),xx+ww/2,base-bh-1,{size:6.2,bold:true,align:'center'}); T(fit(l,bw+1,5.8),xx+ww/2,base+3.2,{size:5.8,c:C.grey,align:'center'}); }); }
  { let yy=section('Personas beneficiarias por sexo y edad',RX,y); const sx=p=>fold(p.p.sexo), cx=RX+HW/2, gap=8, half=HW/2-gap-9;
    const pyr=AGE_GROUPS.map(([l,lo,hi])=>({l,m:X.pers.filter(p=>sx(p)==='mujer'&&p.age!=null&&p.age>=lo&&p.age<=hi).length,h:X.pers.filter(p=>sx(p)==='hombre'&&p.age!=null&&p.age>=lo&&p.age<=hi).length})), pm=Math.max(1,...pyr.flatMap(r=>[r.m,r.h]));
    T('Mujeres',cx-gap,yy+1,{size:7,bold:true,c:C.blue2,align:'right'}); T('Hombres',cx+gap,yy+1,{size:7,bold:true,c:C.blue}); yy+=3.5;
    pyr.slice().reverse().forEach((r,i)=>{ const y2=yy+i*5.4, wm=half*r.m/pm, wh=half*r.h/pm; T(r.l,cx,y2+3.2,{size:6.8,align:'center',c:C.grey}); if(r.m){ fill(C.blue2); doc.rect(cx-gap-wm,y2+0.8,wm,3.8,'F'); } if(r.h){ fill(C.blue); doc.rect(cx+gap,y2+0.8,wh,3.8,'F'); }
      T(NN(r.m),cx-gap-wm-1.2,y2+3.5,{size:6.6,align:'right'}); T(NN(r.h),cx+gap+wh+1.2,y2+3.5,{size:6.6}); }); }
  y+=48;
  // Franja
  y=need(y,21);
  const fp=X.fams.filter(a=>a.ps.length), anyP=(a,f)=>a.ps.some(f);
  const strip=[[pct(fp.filter(a=>anyP(a,p=>fold(p.disc)==='si')).length,fp.length),'de las familias tienen al menos una persona con discapacidad'],[pct(fp.filter(a=>anyP(a,isPreg)).length,fp.length),'de las familias tienen una persona embarazada o lactante'],
    [pct(X.pers.filter(p=>p.age!=null&&p.age<18).length,X.pers.length),'de las personas beneficiarias son niñas, niños o adolescentes'],[pct(X.fams.length-X.sinReg,X.fams.length),'de las familias están en el Registro de Familias']];
  stroke(C.line); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); doc.line(M,y+15,W-M,y+15);
  strip.forEach(([v,l],i)=>{ const x=M+i*(CW/4); T(v,x+2,y+6.5,{size:11,bold:true,c:C.blue}); doc.setFontSize(6.6); T(doc.splitTextToSize(l,CW/4-6).slice(0,2).join('\n'),x+2,y+10.3,{size:6.6,c:C.grey}); });
  y+=21;
  // Lugares y socios
  const lug=countBy(X.rows,a=>a.parroquia?`${a.parroquia} (${a.municipio||'sin municipio'})`:'Sin ubicación registrada').slice(0,5);
  const soc=countBy(X.rows,a=>a.socio||'(sin dato)').map(([s,n])=>[s,n,X.rows.filter(a=>(a.socio||'(sin dato)')===s).reduce((t,a)=>t+repItems(a,R).reduce((q,it)=>q+it.q,0),0)]);
  const h2=Math.max(6+lug.length*5.6,8.5+Math.min(5,soc.length)*5.4); y=need(y,h2+2);
  section('Parroquias de entrega (municipio)',LX,y); bars(lug,LX,y+6,HW,{total:X.rows.length,c:C.blue2});
  { let yy=section('Por socio implementador',RX,y); T('Socio',RX,yy+1,{size:6.8,bold:true,c:C.grey}); T('Entregas',RX+HW-20,yy+1,{size:6.8,bold:true,c:C.grey,align:'right'}); T('Kits',RX+HW,yy+1,{size:6.8,bold:true,c:C.grey,align:'right'}); yy+=2.5;
    soc.slice(0,5).forEach(([o,n,k],i)=>{ const y2=yy+i*5.4; if(i%2===0){ fill([245,247,251]); doc.rect(RX,y2,HW,5.4,'F'); } T(fit(o,HW-44,7.2),RX+1.5,y2+3.7,{size:7.2}); T(NN(n),RX+HW-20,y2+3.7,{size:7.2,bold:true,align:'right'}); T(NN(k),RX+HW-1.5,y2+3.7,{size:7.2,bold:true,align:'right'}); }); }
  y+=h2+5;
  // Calidad
  const sum=nfiSummary(X.rows).filter(r=>r[1]).sort((a,b)=>b[1]-a[1]).slice(0,4), obs=X.rows.filter(a=>a.issues.length).length, qh=13+Math.max(1,sum.length)*4.4;
  y=need(y,qh+7); y=section('Calidad de los datos',M,y);
  fill([253,246,232]); doc.roundedRect(M,y-1,CW,qh,1.5,1.5,'F'); fill(C.amber); doc.rect(M,y-1,1.2,qh,'F');
  T(NN(obs),M+5,y+7,{size:16,bold:true,c:[150,95,0]}); T(`entregas con al menos una observación (${pct(obs,X.rows.length)} del total). Detalle en el reporte de limpieza de datos.`,M+28,y+6,{size:7});
  (sum.length?sum:[['Sin observaciones',0]]).forEach(([l,v],i)=>{ const y2=y+13+i*4.4; T(fit(l,CW-30,6.8),M+5,y2,{size:6.8,c:C.grey}); T(NN(v),W-M-3,y2,{size:6.8,bold:true,align:'right'}); });
  y+=qh+6;
  if(R.notes&&R.notes.trim()){ y=need(y,16); y=section('Observaciones',M,y); doc.setFontSize(7.6); for(const ln of doc.splitTextToSize(R.notes.trim(),CW)){ if(y+3.4>PG.bottom) y=newPage(); T(ln,M,y+1,{size:7.6}); y+=3.4; } }
  if(ext) return true;
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); stroke(C.line); doc.setLineWidth(0.3); doc.line(M,283,W-M,283);
    T(`Fuente: IMS, ${N.cfg.src} (${N.file}) y Registro de Familias (${S.registro.file}). Categorías de kit según la clasificación confirmada al procesar.`,M,287.5,{size:6.3,c:C.grey,maxW:CW-30}); T(`Página ${i} de ${np}`,W-M,287.5,{size:6.3,c:C.grey,align:'right'}); }
  await saveFile(`Informe_${N.cfg.file}${R.from&&R.to?`_${R.from}_a_${R.to}`:''}.pdf`,doc.output('blob'));
}
function nfiBind(){
  const N=S.nfi, on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  const restart=()=>{ S.mode=null; S.nfi=null; S.step=1; render(); };
  if(S.step===2){
    const d=$('#nRegDrop'); if(d){ d.onclick=()=>$('#nRegIn').click(); d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#nRegIn').click(); } };
      d.ondragover=e=>{ e.preventDefault(); d.classList.add('over'); }; d.ondragleave=()=>d.classList.remove('over'); d.ondrop=e=>{ e.preventDefault(); d.classList.remove('over'); if(e.dataTransfer.files[0]) nfiLoadRegistro(e.dataTransfer.files[0]); }; }
    on('#nRegIn','change',e=>{ if(e.target.files[0]) nfiLoadRegistro(e.target.files[0]); e.target.value=''; });
    bindKitSelects(N);
    const setInc=v=>{ N.inc=N.inc.map(()=>v); $('#kitRows').innerHTML=kitRowsHtml(N); bindKitSelects(N); };
    on('#kincAll','click',()=>setInc(true)); on('#kincNone','click',()=>setInc(false));
    const syncV=()=>{ N.valid=new Set([...document.querySelectorAll('[data-nvalid]')].filter(b=>b.checked).map(b=>b.value)); nfiAnalyze(N); };
    document.querySelectorAll('[data-nvalid]').forEach(b=>b.onchange=syncV);
    on('#nvAll','click',()=>{ document.querySelectorAll('[data-nvalid]').forEach(b=>b.checked=true); syncV(); });
    on('#nvNone','click',()=>{ document.querySelectorAll('[data-nvalid]').forEach(b=>b.checked=false); syncV(); });
    on('#back','click',restart); on('#next','click',()=>{ S.step=3; render(); });
  }
  if(S.step===3){
    const F=N.filters, upd=()=>{ const rows=nfiRows(); $('#nN').textContent=fmt(rows.length); $('#nSum').innerHTML=nfiSumRows(nfiCleanRows()); };
    bindPeriod('n',F,N.rows.map(a=>a.fecha),'nrange',upd); bindCats('n',F.cats,upd);
    document.querySelectorAll('[data-nkc]').forEach(b=>b.onchange=()=>{ if(b.checked) F.kcat.add(b.dataset.nkc); else F.kcat.delete(b.dataset.nkc); upd(); });
    on('#back','click',()=>{ S.step=2; render(); }); on('#next','click',()=>{ S.step=4; render(); });
  }
  if(S.step===4&&N.view==='report'){
    const R=nfiRepInit(), upd=()=>{ $('#nRepFacts').innerHTML=nfiRepFacts(nfiRepData()); };
    bindPeriod('nr',R,N.rows.map(a=>a.fecha),'nrrange',upd); bindCats('nr',R.cats,upd);
    document.querySelectorAll('[data-nrkc]').forEach(b=>b.onchange=()=>{ if(b.checked) R.kcat.add(b.dataset.nrkc); else R.kcat.delete(b.dataset.nrkc); upd(); });
    on('#rTitle','input',e=>{ R.title=e.target.value; }); on('#rNotes','input',e=>{ R.notes=e.target.value; });
    on('#rLogo','change',e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>1.5e6){ toast('El logo supera 1,5 MB. Usa una imagen más liviana.'); return; }
      const rd=new FileReader(); rd.onload=()=>{ const img=new Image(); img.onload=()=>{ R.logo={data:rd.result,fmt:/png/i.test(f.type)?'PNG':'JPEG',w:img.naturalWidth,h:img.naturalHeight}; try{ localStorage.setItem(LOGO_KEY,JSON.stringify(R.logo)); }catch(err){} render(); }; img.src=rd.result; }; rd.readAsDataURL(f); });
    on('#rLogoDel','click',()=>{ R.logo=null; try{ localStorage.removeItem(LOGO_KEY); }catch(e){} render(); });
    on('#rBack','click',()=>{ N.view=null; render(); });
    on('#rPdf','click',async()=>{ if(!R.kcat.size){ toast('Selecciona al menos una categoría de kit.'); return; } busy(true); await nextFrame(); try{ await nfiPdf(); }catch(e){ console.error(e); toast('Error al generar el PDF: '+(e.message||e)); } busy(false); });
    return;
  }
  if(S.step===4){
    const run=fn=>async()=>{ busy(true); await nextFrame(); try{ await fn(); }catch(e){ console.error(e); toast('Error al exportar: '+(e.message||e)); } busy(false); };
    on('#exErr','click',run(nfiExportErrors)); on('#exPbi','click',run(nfiExportPbi)); on('#exMat','click',run(nfiExportMatriz));
    on('#exRep','click',()=>{ N.view='report'; render(); });
    on('#back','click',()=>{ S.step=3; render(); }); on('#restart','click',restart);
  }
}
const NFI_MODULE={id:'nfi',name:'Entrega de kits',views:[null,null,nfiViewVerify,nfiViewReview,nfiViewExport],bind:nfiBind};

