/* Herramientas M&E · Lectura IMS y módulo Registro de Familias */
/* ============ Formularios IMS reconocidos ============ */
/* Lectura específica de los Excel del IMS: fila de nombres internos + fila de etiquetas (desde "Excel Index"). */
function imsSheet(ws){
  const aoa=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,blankrows:true});
  let lab=-1;
  for(let r=0;r<Math.min(6,aoa.length);r++){ if((aoa[r]||[]).some(c=>typeof c==='string'&&c.trim().toLowerCase()==='excel index')){ lab=r; break; } }
  if(lab<0) lab=Math.min(1,aoa.length-1);
  const mrow=lab>0&&(aoa[lab-1]||[]).some(c=>c==='excel_index')?aoa[lab-1]:[];
  const labels=(aoa[lab]||[]).map(x=>String(x??'').trim()), machine=(mrow||[]).map(x=>String(x??'').trim());
  const rows=[];
  for(let i=lab+1;i<aoa.length;i++){ const r=aoa[i]; if(r&&r.some(c=>c!=null&&String(c).trim()!=='')) rows.push({r,n:i+1}); }
  return {machine,labels,rows,labelRow:lab+1};
}
function locateCol(sh,spec){
  let i=sh.machine.indexOf(spec.m); if(i>=0) return {idx:i,how:'Nombre interno'};
  const c=sh.labels.map((l,j)=>fold(l)===fold(spec.l)?j:-1).filter(j=>j>=0);
  if(!c.length) return {idx:-1,how:''};
  const filled=j=>sh.rows.reduce((t,x)=>t+(x.r[j]!=null&&String(x.r[j]).trim()!==''?1:0),0);
  c.sort((a,b)=>filled(b)-filled(a)); return {idx:c[0],how:c.length>1?'Etiqueta (la columna con datos)':'Etiqueta'};
}
function cellYMD(v,shiftH=0){
  if(v==null||String(v).trim()==='') return null;
  if(typeof v==='number'){ const d=new Date(Math.round((v-25569)*86400000)+shiftH*3600000); return ymdChk(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()); }
  return toDate(v);
}
const PERFILES=['Ninguno','Niño/a no acompañado','Adulto mayor','Necesidad de salud mental o apoyo psicosocial','Enfermedad crónica','Persona con discapacidad','Embarazada/Lactante','Enfermedad terminal','Otro','Víctima/sobreviviente de violencia','Separación familiar','Lactante','Embarazada'];
const FAM_SPEC={
  cases:{sheet:/vzl[_ ]?cases/i, cols:{
    excel_index:{m:'excel_index',l:'Excel Index'},
    created:{m:'created_at',l:'Created Date',req:1},
    code:{m:'code',l:'Código',req:1},
    org:{m:'org',l:'Organización que llena la encuesta',req:1},
    alojamiento:{m:'alojamiento',l:'Nombre del alojamiento',req:1},
    comunidad:{m:'comunidad',l:'Nombre de la comunidad',req:1},
    estado:{m:'states',l:'Estado de procedencia',req:1},
    municipio:{m:'municipalities',l:'Municipio de procedencia',req:1},
    parroquia:{m:'parishes',l:'Parroquia de procedencia',req:1},
    sheltered:{m:'sheltered',l:'Usted y su grupo familiar se encuentran en el alojamiento?.',req:1},
    afectacion:{m:'afectacion',l:'Nivel de afectación/daño de la vivienda',req:1}}},
  benef:{sheet:/beneficiaries[_ ]?vzl/i, cols:{
    fam:{m:'excel_index',l:'Excel Index',req:1},
    pid:{m:'id',l:'Machine Name'},
    name:{m:'full_name',l:'Nombres completos',req:1},
    parentesco:{m:'parentesco',l:'Parentesco con el/la representante',req:1},
    birth:{m:'birthdate',l:'Fecha de nacimiento',req:1},
    sexo:{m:'sex',l:'Sexo',req:1},
    idno:{m:'id_no',l:'N° de cédula o documento de identidad',req:1},
    nat:{m:'nationality',l:'Nacionalidad',req:1},
    disc:{m:'disbility',l:'Tiene discapacidad',req:1},
    perfil:{m:'condition_prfl',l:'Perfil o condición específica',req:1}}}
};
const isLeader=p=>p.rel.startsWith('representante');
function cleanId(v){
  let d=String(v??'').toUpperCase().replace(/\s/g,'').replace(/^[VE][-.]?/,'').replace(/[.,]/g,'');
  if(!/^\d+$/.test(d)) return null;            // con letras o sufijos (p. ej. 18214811-HJ-1) no es una cédula propia
  d=d.replace(/^0+/,'');
  if(d.length<6||d.length>8) return null;      // cédulas venezolanas: 6 a 8 dígitos
  if(/^(\d)\1+$/.test(d)) return null;          // 9999999, 1111111
  if('0123456789'.includes(d)||'9876543210'.includes(d)) return null; // secuencias
  return d;
}
const nameKey=s=>fold(s).replace(/[0-9]/g,'').split(' ').filter(Boolean).sort().join(' ');

function famDetect(wb){ return wb.SheetNames.some(n=>FAM_SPEC.cases.sheet.test(n))&&wb.SheetNames.some(n=>FAM_SPEC.benef.sheet.test(n)); }
function famLoad(wb,fileName){
  const D={file:fileName,check:[],fatal:[],sheets:{}};
  for(const part of ['cases','benef']){
    const spec=FAM_SPEC[part], sn=wb.SheetNames.find(n=>spec.sheet.test(n)), sh=imsSheet(wb.Sheets[sn]);
    sh.name=sn; sh.idx={}; D.sheets[part]=sh;
    for(const [k,c] of Object.entries(spec.cols)){
      const loc=locateCol(sh,c); sh.idx[k]=loc.idx;
      D.check.push({sheet:sn,label:c.l,how:loc.how,col:loc.idx>=0?XLSX.utils.encode_col(loc.idx):'',found:loc.idx>=0,req:!!c.req});
      if(loc.idx<0&&c.req) D.fatal.push(`${c.l} (${sn})`);
    }
  }
  if(D.fatal.length) return D;
  const C=D.sheets.cases, B=D.sheets.benef, g=(sh,x,k)=>sh.idx[k]>=0?x.r[sh.idx[k]]:null;
  D.fams=C.rows.map(x=>{ const code=toText(g(C,x,'code')); const m=code&&code.match(/(\d+)\s*$/);
    return {n:x.n,code,num:m?Number(m[1]):null,codeOk:!!code&&/^OIM-vcs-\d+$/i.test(code),
      created:cellYMD(g(C,x,'created'),4),org:toText(g(C,x,'org')),alojamiento:toText(g(C,x,'alojamiento')),comunidad:toText(g(C,x,'comunidad')),
      estado:toText(g(C,x,'estado')),municipio:toText(g(C,x,'municipio')),parroquia:toText(g(C,x,'parroquia')),sheltered:toText(g(C,x,'sheltered')),afectacion:toText(g(C,x,'afectacion'))}; });
  D.famByNum=new Map(); D.fams.forEach(f=>{ if(f.num!=null&&!D.famByNum.has(f.num)) D.famByNum.set(f.num,f); });
  const known=new Map(PERFILES.map(p=>[fold(p),p])); D.unknownPerfil=new Map();
  D.pers=B.rows.map(x=>{
    const fn=toNum(g(B,x,'fam')), birth=cellYMD(g(B,x,'birth')), parentesco=toText(g(B,x,'parentesco')), name=toText(g(B,x,'name'));
    const idRaw=toText(g(B,x,'idno')); const toks=String(g(B,x,'perfil')??'').split(/\r?\n|;|\|/).map(t=>t.trim()).filter(Boolean);
    const perfil=new Set(); toks.forEach(t=>{ const k=known.get(fold(t)); if(k) perfil.add(k); else D.unknownPerfil.set(t,(D.unknownPerfil.get(t)||0)+1); });
    const fam=fn!=null?D.famByNum.get(fn):null;
    const age=birth?ageAt(birth,TODAY_YMD):null;
    return {n:x.n,fam:fn==null?null:fn,f:fam||null,pid:toText(g(B,x,'pid')),name,nk:nameKey(name),parentesco,rel:fold(parentesco),birth,
      age,ageReg:birth&&fam&&fam.created&&birth<=fam.created?ageAt(birth,fam.created):age,
      sexo:toText(g(B,x,'sexo')),idRaw,id:cleanId(idRaw),nat:toText(g(B,x,'nat')),disc:toText(g(B,x,'disc')),perfil};
  });
  D.byFam=new Map(); D.pers.forEach(p=>{ if(p.fam==null) return; if(!D.byFam.has(p.fam)) D.byFam.set(p.fam,[]); D.byFam.get(p.fam).push(p); });
  const ds=D.fams.map(f=>f.created).filter(Boolean).sort(); D.minDate=ds[0]||''; D.maxDate=ds[ds.length-1]||'';
  D.err=famAnalyze(D);
  D.filters={from:D.minDate,to:D.maxDate,cats:{}};
  return D;
}
const TODAY_YMD=today();
function famAnalyze(D){
  const E={};
  const seenCode=new Map(); D.fams.forEach(f=>{ if(f.code) seenCode.set(f.code,(seenCode.get(f.code)||0)+1); });
  E.badCode=D.fams.filter(f=>!f.codeOk||seenCode.get(f.code)>1).map(f=>({f,prob:!f.code?'Código vacío':!f.codeOk?'Formato de código no válido':'Código repetido'}));
  E.famNoPers=D.fams.filter(f=>f.num!=null&&!D.byFam.has(f.num));
  E.persNoFam=D.pers.filter(p=>!p.f);
  E.leader=[];
  D.fams.forEach(f=>{ const ps=D.byFam.get(f.num); if(!ps||D.famByNum.get(f.num)!==f) return; const L=ps.filter(isLeader);
    if(!L.length) E.leader.push({f,ps,prob:'Sin representante / líder'}); else if(L.length>1) E.leader.push({f,ps,prob:`Más de un representante (${L.length})`}); });
  E.birth=[];
  D.pers.forEach(p=>{
    const add=(prob,sev)=>E.birth.push({p,prob,sev});
    if(p.birth===null){ add('Fecha de nacimiento vacía','Error'); return; }
    if(p.birth===undefined){ add('Fecha de nacimiento no válida','Error'); return; }
    if(p.birth>TODAY_YMD){ add('Fecha de nacimiento posterior a hoy','Error'); return; }
    if(p.f&&p.f.created&&p.birth>p.f.created) add('Nacimiento posterior a la fecha de registro de la familia','Error');
    if(p.age>120) add('Edad mayor a 120 años','Error');
    const lead=isLeader(p);
    if(lead&&p.age<14) add(`Representante con ${p.age} años (menor de 14)`,'Error');
    else if(lead&&p.age<18) add(`Representante con ${p.age} años (menor de edad)`,'Alerta');
    if(p.rel==='pareja'&&p.age<14) add(`Pareja con ${p.age} años (menor de 14)`,'Error');
    if(lead||p.fam==null) return;
    const L=(D.byFam.get(p.fam)||[]).filter(x=>isLeader(x)&&x.birth&&x.age!=null);
    if(L.length!==1) return; const la=L[0].age;
    if((p.rel==='hijo a'||p.rel==='nieto a')&&p.age>=la) add(`${p.parentesco} con ${p.age} años, igual o mayor que el representante (${la})`,'Error');
    else if((p.rel==='padre madre'||p.rel==='abuelo a')&&p.age<=la) add(`${p.parentesco} con ${p.age} años, igual o menor que el representante (${la})`,'Error');
    else if(p.rel==='hijo a'&&la-p.age<12) add(`Hijo/a con ${la-p.age} años de diferencia con el representante`,'Alerta');
    else if(p.rel==='padre madre'&&p.age-la<12) add(`Padre/madre con ${p.age-la} años de diferencia con el representante`,'Alerta');
  });
  // Duplicados: nombre + cédula válida, o nombre + fecha de nacimiento
  const par=new Map(), crit=new Map();
  const find=x=>{ while(par.get(x)!==x){ par.set(x,par.get(par.get(x))); x=par.get(x); } return x; };
  const groupBy=(keyFn,label)=>{ const m=new Map(); D.pers.forEach((p,i)=>{ const k=keyFn(p); if(!k) return; if(!m.has(k)) m.set(k,[]); m.get(k).push(i); });
    for(const arr of m.values()){ if(arr.length<2) continue; arr.forEach(i=>{ if(!par.has(i)) par.set(i,i); if(!crit.has(i)) crit.set(i,new Set()); crit.get(i).add(label); });
      for(let j=1;j<arr.length;j++){ const a=find(arr[0]),b=find(arr[j]); if(a!==b) par.set(b,a); } } };
  groupBy(p=>p.nk&&p.id?`${p.nk}|${p.id}`:null,'Nombre + cédula');
  groupBy(p=>p.nk&&p.birth?`${p.nk}|${p.birth}`:null,'Nombre + fecha de nacimiento');
  groupBy(p=>p.id&&p.birth&&p.age>=18?`${p.id}|${p.birth}`:null,'Cédula + fecha de nacimiento'); // solo adultos: gemelos menores pueden compartir la cédula del representante
  const groups=new Map(); for(const i of par.keys()){ const r=find(i); if(!groups.has(r)) groups.set(r,[]); groups.get(r).push(i); }
  E.dup=[...groups.values()].map(ix=>ix.map(i=>D.pers[i])).sort((a,b)=>a[0].nk.localeCompare(b[0].nk,'es'))
    .map((ps,gi)=>({id:`D-${String(gi+1).padStart(4,'0')}`,ps,crit:[...new Set(ps.flatMap(p=>[...crit.get(D.pers.indexOf(p))]))].join(' y '),sameFam:new Set(ps.map(p=>p.fam)).size===1}));
  // Cédulas válidas repetidas entre adultos con nombres distintos (los menores suelen registrarse con la cédula de un adulto)
  const byId=new Map(); D.pers.forEach(p=>{ if(!p.id||p.age==null||p.age<18) return; if(!byId.has(p.id)) byId.set(p.id,[]); byId.get(p.id).push(p); });
  E.idConflict=[...byId.entries()].filter(([,ps])=>new Set(ps.map(p=>p.nk)).size>1).map(([id,ps])=>({id,ps}));
  return E;
}
function famPass(f,F=S.fam.filters){
  if(!f) return !(F.from>S.fam.minDate||F.to<S.fam.maxDate||Object.values(F.cats).some(s=>s&&s.size));
  if(F.from||F.to){ if(!f.created) return false; if(F.from&&f.created<F.from) return false; if(F.to&&f.created>F.to) return false; }
  for(const k in F.cats){ const s=F.cats[k]; if(s&&s.size&&!s.has(f[k]??'(vacío)')) return false; }
  return true;
}
const FAM_CATS=[['org','Organización que llena la encuesta'],['alojamiento','Nombre del alojamiento'],['estado','Estado de procedencia'],['sheltered','Se encuentran en el alojamiento'],['afectacion','Nivel de afectación']];
const FAM_PBI_FAM=[['created','Created Date','date'],['code','Código'],['org','Organización que llena la encuesta'],['alojamiento','Nombre del alojamiento'],['comunidad','Nombre de la comunidad'],['estado','Estado de procedencia'],['municipio','Municipio de procedencia'],['parroquia','Parroquia de procedencia'],['sheltered','Usted y su grupo familiar se encuentran en el alojamiento?.'],['afectacion','Nivel de afectación/daño de la vivienda']];
function famPbiTable(){
  const D=S.fam;
  const cols=[...FAM_PBI_FAM.map(([,h,t])=>({h,type:t})),{h:'Nombres completos'},{h:'Parentesco con el/la representante'},{h:'Edad'},{h:'Sexo'},{h:'Nacionalidad'},{h:'Tiene discapacidad'},...PERFILES.map(p=>({h:p}))];
  const famPart=f=>FAM_PBI_FAM.map(([k])=>f?f[k]:null);
  const persPart=p=>p?[p.name,p.parentesco,p.ageReg,p.sexo,p.nat,p.disc,...PERFILES.map(x=>p.perfil.has(x)?1:0)]:Array(6+PERFILES.length).fill(null);
  const data=[];
  D.fams.forEach(f=>{ if(!famPass(f)) return; const ps=D.famByNum.get(f.num)===f?D.byFam.get(f.num):null; if(ps&&ps.length) ps.forEach(p=>data.push([...famPart(f),...persPart(p)])); else data.push([...famPart(f),...persPart(null)]); });
  if(famPass(null)) D.err.persNoFam.forEach(p=>data.push([...famPart(null),...persPart(p)]));
  return {cols,data};
}
async function famExportPbi(kind){
  const {cols,data}=famPbiTable(); const tag=S.fam.filters.from&&S.fam.filters.to?`_${S.fam.filters.from}_a_${S.fam.filters.to}`:'';
  if(kind==='csv'){ const csv='\ufeff'+XLSX.utils.sheet_to_csv(buildSheet(cols,data),{FS:',',RS:'\r\n'}); await saveFile(`Registro_Familias_PowerBI${tag}.csv`,new Blob([csv],{type:'text/csv'})); return; }
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,buildSheet(cols,data),'Familias_Personas');
  await saveFile(`Registro_Familias_PowerBI${tag}.xlsx`,xlsxBlob(wb));
}
function famScopedErr(F=S.fam.filters){
  const E=S.fam.err, inF=f=>famPass(f||null,F);
  return {...E,
    badCode:E.badCode.filter(x=>inF(x.f)), famNoPers:E.famNoPers.filter(inF), persNoFam:E.persNoFam.filter(()=>inF(null)),
    leader:E.leader.filter(x=>inF(x.f)), birth:E.birth.filter(x=>inF(x.p.f)),
    dup:E.dup.filter(g=>g.ps.some(p=>inF(p.f))), idConflict:E.idConflict.filter(x=>x.ps.some(p=>inF(p.f)))};
}
function famSummary(){
  const E=famScopedErr(), uniq=(arr,f)=>new Set(arr.map(f)).size;
  const bErr=E.birth.filter(x=>x.sev==='Error'), bAl=E.birth.filter(x=>x.sev==='Alerta');
  const dupP=E.dup.reduce((t,g)=>t+g.ps.length,0);
  return [
    ['3.1','Familias en vzl_cases sin personas en beneficiaries_vzl',E.famNoPers.length,'familias'],
    ['3.2','Personas en beneficiaries_vzl sin familia en vzl_cases',E.persNoFam.length,'personas'],
    ['3.3','Familias sin representante / líder del grupo',E.leader.filter(x=>x.prob.startsWith('Sin')).length,'familias'],
    ['3.3','Familias con más de un representante',E.leader.filter(x=>!x.prob.startsWith('Sin')).length,'familias'],
    ['3.4','Personas con fecha de nacimiento errada',uniq(bErr,x=>x.p),'personas'],
    ['3.4','Personas con fecha de nacimiento a revisar (alertas)',uniq(bAl.filter(x=>!bErr.some(y=>y.p===x.p)),x=>x.p),'personas'],
    ['3.5','Grupos de personas duplicadas',E.dup.length,'grupos'],
    ['3.5','Personas involucradas en duplicados',dupP,'personas'],
    ['3.5','Registros sobrantes (personas a depurar)',dupP-E.dup.length,'personas'],
    ['3.5','Cédulas repetidas entre adultos con nombres distintos (alerta)',E.idConflict.length,'cédulas'],
    ['Adicional','Familias con código vacío, mal formado o repetido',E.badCode.length,'familias']
  ];
}
async function famExportErrors(){
  const att=S.mode&&S.mode.id==='multi'&&S.mm?S.mm.items.filter(it=>it.type!=='registro'&&mmOk(it)).map(it=>({type:it.type,label:it.label,obj:it.obj})):(S.famAtt||[]);
  return regCleanExport(S.fam,att);
}
async function famExportErrorsOld(){
  const D=S.fam, E=famScopedErr(), wb=XLSX.utils.book_new(), add=(n,c,r)=>XLSX.utils.book_append_sheet(wb,buildSheet(c,r),n);
  const pad=n=>n==null?'':`OIM-vcs-${String(n).padStart(6,'0')}`;
  const dupP=E.dup.reduce((t,g)=>t+g.ps.length,0);
  const resumen=[
    ['Familias sin personas registradas',E.famNoPers.length],
    ['Personas sin familia registrada',E.persNoFam.length],
    ['Familias sin representante o con más de uno',E.leader.length],
    ['Fechas de nacimiento a revisar',new Set(E.birth.map(x=>x.p)).size],
    ['Personas posiblemente duplicadas',dupP],
    ['Cédulas repetidas con nombres distintos',E.idConflict.length]];
  if(E.badCode.length) resumen.push(['Familias con código vacío, mal formado o repetido',E.badCode.length]);
  add('Resumen',[{h:'Descripción'},{h:'Cantidad'}],resumen);
  add('3.1 Familias sin personas',[{h:'Código'},{h:'Fila en vzl_cases'},{h:'Created Date',type:'date'},{h:'Organización'},{h:'Alojamiento'},{h:'Estado'},{h:'Municipio'},{h:'Parroquia'}],
    E.famNoPers.map(f=>[f.code,f.n,f.created,f.org,f.alojamiento,f.estado,f.municipio,f.parroquia]));
  add('3.2 Personas sin familia',[{h:'Excel Index'},{h:'Código esperado'},{h:'Fila en beneficiaries_vzl'},{h:'Nombres completos'},{h:'Parentesco'},{h:'Fecha de nacimiento',type:'date'}],
    E.persNoFam.map(p=>[p.fam,pad(p.fam),p.n,p.name,p.parentesco,p.birth||null]));
  add('3.3 Representante',[{h:'Código'},{h:'Problema'},{h:'N° de personas'},{h:'Integrantes (parentesco)'},{h:'Organización'},{h:'Alojamiento'}],
    E.leader.map(x=>[x.f.code,x.prob,x.ps.length,x.ps.map(p=>`${p.name||'(sin nombre)'} (${p.parentesco||'sin parentesco'})`).join('; '),x.f.org,x.f.alojamiento]));
  add('3.4 Fecha de nacimiento',[{h:'Problema'},{h:'Código'},{h:'Fila en beneficiaries_vzl'},{h:'Nombres completos'},{h:'Parentesco'},{h:'Fecha de nacimiento',type:'date'},{h:'Edad actual'}],
    E.birth.map(x=>[x.prob,x.p.f?x.p.f.code:pad(x.p.fam),x.p.n,x.p.name,x.p.parentesco,x.p.birth||null,x.p.age]));
  add('3.5 Duplicados',[{h:'Criterio de coincidencia'},{h:'Código'},{h:'Fila en beneficiaries_vzl'},{h:'Nombres completos'},{h:'Parentesco'}],
    E.dup.flatMap(g=>g.ps.map(p=>[g.crit,p.f?p.f.code:pad(p.fam),p.n,p.name,p.parentesco])));
  add('3.5 Cédula repetida',[{h:'Cédula'},{h:'Código'},{h:'Fila en beneficiaries_vzl'},{h:'Nombres completos'},{h:'Fecha de nacimiento',type:'date'},{h:'Parentesco'}],
    E.idConflict.flatMap(x=>x.ps.map(p=>[x.id,p.f?p.f.code:pad(p.fam),p.n,p.name,p.birth||null,p.parentesco])));
  if(E.badCode.length) add('Códigos',[{h:'Fila en vzl_cases'},{h:'Código'},{h:'Problema'}],E.badCode.map(x=>[x.f.n,x.f.code,x.prob]));
  await saveFile(`Registro_Familias_Errores_${TODAY_YMD}.xlsx`,xlsxBlob(wb));
}

/* --- Vistas del módulo --- */
function famViewVerify(){
  const D=S.fam;
  const rows=D.check.map(c=>`<tr class="${c.req?'req':''}"><td>${esc(c.label)}</td><td data-label="Pestaña">${esc(c.sheet)}</td><td data-label="Columna">${c.found?`${esc(c.col)} <span class="muted">· ${esc(c.how)}</span>`:'—'}</td><td data-label="Estado">${c.found?'<span class="status ok">Encontrada</span>':(c.req?'<span class="status bad">Falta</span>':'<span class="status warn">No está (saldrá vacía)</span>')}</td></tr>`).join('');
  const unk=D.unknownPerfil?[...D.unknownPerfil.entries()]:[];
  return `<h1>Registro de Familias</h1>
  <p class="lead">Archivo reconocido por sus pestañas <b>vzl_cases</b> (familias) y <b>beneficiaries_vzl</b> (personas). Las familias se vinculan con sus integrantes mediante el número del Código (OIM-vcs-000007 → Excel Index 7).</p>
  ${D.fatal.length?`<div class="note bad">Faltan columnas necesarias: ${esc(D.fatal.join(', '))}. Verifica que sea la descarga completa del IMS.</div>`:`
  <div class="facts">
    <div><b>${fmt(D.fams.length)}</b><span>Familias</span></div>
    <div><b>${fmt(D.pers.length)}</b><span>Personas</span></div>
    <div><b>${esc(D.minDate||'—')}</b><span>Primer registro</span></div>
    <div><b>${esc(D.maxDate||'—')}</b><span>Último registro</span></div>
  </div>`}
  ${unk.length?`<div class="note warn">Hay valores en “Perfil o condición específica” que no están en la lista de opciones y no se marcarán en ninguna columna: ${unk.map(([t,n])=>`${esc(t)} (${n})`).join(', ')}.</div>`:''}
  ${D.fatal.length?'':`<h2>Cruce con atenciones (recomendado para la limpieza)</h2>
  <div class="panel"><p class="muted" style="margin:0 0 10px;font-size:14px">Para decidir qué duplicados eliminar y qué atenciones reasignar, carga los formularios de atenciones individuales (salud, salud mental, protección, psicosocial) y de entregas de kits (NFI, WASH). Si no los cargas, la limpieza marcará esa revisión como <b>pendiente</b>.</p>
    ${(S.famAtt||[]).map((x,i)=>`<div class="pendrow"><div class="pendfile"><b>${esc(x.label)}</b><span class="muted">${esc(x.file)} · ${fmt(x.obj.rows.length)} registros</span></div><button class="btn sm" type="button" data-attdel="${i}">Quitar</button></div>`).join('')}
    <div class="drop" id="attDrop" tabindex="0" role="button" aria-label="Cargar formularios de atenciones" style="margin-top:10px;padding:22px"><strong>Arrastra aquí los formularios de atenciones y kits</strong><span>Opcional · puedes cargar varios a la vez</span></div><input type="file" id="attIn" accept=".xlsx,.xls" multiple hidden></div>`}
  <h2>Columnas utilizadas</h2>
  <div class="scroll"><table class="ledger"><thead><tr><th>Campo</th><th>Pestaña</th><th>Columna</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="muted" style="font-size:13px;margin:8px 0 0">* Obligatorias: son las que usan el reporte de errores, la tabla para Power BI y el informe. Las columnas adicionales del Excel se ignoran. Las columnas se ubican por su nombre interno del IMS (fila 1) o, si no existe, por su etiqueta (fila 2).</p>
  <div class="actions"><button class="btn" type="button" id="back">Cargar otro archivo</button><button class="btn primary" type="button" id="next" ${D.fatal.length?'disabled':''}>Continuar</button></div>`;
}
function famMonthButtons(){
  const D=S.fam, ms=[...new Set(D.fams.map(f=>f.created&&f.created.slice(0,7)).filter(Boolean))].sort().slice(-12);
  if(ms.length<2) return '';
  return ms.map(m=>{ const [y,mo]=m.split('-').map(Number); const a=[`${m}-01`,D.minDate].sort()[1], z=[ymd(y,mo,new Date(Date.UTC(y,mo,0)).getUTCDate()),D.maxDate].sort()[0];
    return `<button class="btn sm" type="button" data-frange="${a}|${z}">${MONTHS[mo-1]} ${y}</button>`; }).join('');
}
function famSumRows(sum){
  return sum.map(r=>`<tr><td>${esc(r[0])}</td><td style="white-space:normal">${esc(r[1])}</td><td class="num"><span class="status ${r[2]?(r[1].includes('alerta')||r[0]==='Adicional'?'warn':'bad'):'ok'}">${fmt(r[2])}</span></td><td class="muted">${esc(r[3])}</td></tr>`).join('');
}
function famViewReview(){
  const D=S.fam, F=D.filters, sum=famSummary();
  const cats=FAM_CATS.map(([k,l])=>{
    const cnt={}; D.fams.forEach(f=>{ const x=f[k]??'(vacío)'; cnt[x]=(cnt[x]||0)+1; });
    const vals=Object.entries(cnt).sort((a,b)=>b[1]-a[1]); const sel=F.cats[k];
    return `<details class="cat" ${sel&&sel.size?'open':''}><summary><span>${esc(l)}</span><span class="cnt">${sel&&sel.size?`${sel.size} de ${vals.length} seleccionados`:`${vals.length} valores · todos`}</span></summary><div class="body">
      <div class="row" style="margin:4px 0 6px"><button class="btn sm" type="button" data-fall="${k}">Todos</button><button class="btn sm" type="button" data-fnone="${k}">Ninguno</button></div>
      ${vals.map(([v,n])=>`<label><input type="checkbox" data-fcat="${k}" value="${esc(v)}" ${!sel||!sel.size||sel.has(v)?'checked':''}> ${esc(v)} <span class="cnt">${fmt(n)}</span></label>`).join('')}</div></details>`; }).join('');
  const {cols,data}=famPbiTable(); const C=cols.slice(0,17);
  const prev=data.slice(0,50).map(r=>`<tr>${C.map((c,i)=>`<td class="${typeof r[i]==='number'?'num':''}">${esc(r[i]??'')}</td>`).join('')}</tr>`).join('');
  return `<h1>Datos a procesar</h1>
  <p class="lead">El periodo y los criterios se aplican al reporte de errores y a la tabla para Power BI. Los duplicados se buscan en todo el archivo y se listan los que involucran a familias del periodo elegido.</p>
  <h2 style="margin-top:0">Incidencias encontradas</h2>
  <div class="scroll"><table><thead><tr><th>Criterio</th><th>Descripción</th><th class="num">Cantidad</th><th>Unidad</th></tr></thead><tbody id="famSum">
  ${famSumRows(sum)}</tbody></table></div>
  
  <div class="grid2" style="margin-top:8px">
    <div><h2>Periodo a revisar</h2><div class="panel">${D.minDate?`
      <div class="row"><div class="field"><label for="fFrom">Desde</label><input type="hidden" id="fFrom" data-dp data-label="Desde" data-pair="fTo" data-min="${esc(D.minDate)}" data-max="${esc(D.maxDate)}" value="${esc(F.from)}"></div><div class="field"><label for="fTo">Hasta</label><input type="hidden" id="fTo" data-dp data-label="Hasta" data-pair="fFrom" data-min="${esc(D.minDate)}" data-max="${esc(D.maxDate)}" value="${esc(F.to)}"></div></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" type="button" data-frange="${D.minDate}|${D.maxDate}">Todo</button>${famMonthButtons()}</div>
      <p class="muted" style="font-size:13px;margin:8px 0 0">Según Created Date, corregida a la hora de Venezuela (el IMS la exporta en UTC, por eso aparece a las 20:00 del día anterior). Las familias sin fecha de registro quedan fuera cuando se acota el periodo.</p>`:
      '<p class="muted" style="margin:0">El archivo no trae la columna Created Date, así que no es posible filtrar por periodo.</p>'}</div></div>
    <div><h2>Criterios</h2>${cats}</div>
  </div>
  <h2>Vista previa de la tabla para Power BI <span class="muted" style="font-weight:400;font-size:14px">(<span id="fN">${fmt(data.length)}</span> filas; primeras 50)</span></h2>
  <div class="scroll" style="max-height:420px"><table><thead><tr>${C.map(c=>`<th>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${prev||`<tr><td colspan="${C.length}" class="muted">Ningún registro cumple los filtros.</td></tr>`}</tbody></table></div>
  <div class="actions"><button class="btn" type="button" id="back">Volver</button><button class="btn primary" type="button" id="next">Continuar a exportar</button></div>`;
}
