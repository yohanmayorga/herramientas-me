/* Herramientas M&E · Atenciones: salud, salud mental, protección y psicosocial */
/* ============ Módulo: Atenciones en Salud ============ */
const SAL_SOCIOS=new Set(['ven da tu mano','equipo salud oim']);
const socioKey=a=>fold(a.socio||'(vacío)');
const SOCIO_LS=id=>`depurador-ims-socios-${id}`;
function initValid(A){
  let saved=null; try{ saved=JSON.parse(localStorage.getItem(SOCIO_LS(A.cfg.id))||'null'); }catch(e){}
  A.socioList=countBy(A.rows,a=>a.socio||'(vacío)');
  const def=k=>(A.cfg.defaultValid?A.cfg.defaultValid.includes(k):SAL_SOCIOS.has(k))||(A.cfg.extraValid?A.cfg.extraValid.test(k):false);
  A.valid=new Set(A.socioList.map(([x])=>fold(x))); // por defecto todos los socios son válidos
}
function saveValid(A){
  let saved={seen:[],valid:[]}; try{ saved=JSON.parse(localStorage.getItem(SOCIO_LS(A.cfg.id))||'null')||saved; }catch(e){}
  const keys=A.socioList.map(([x])=>fold(x));
  const seen=[...new Set([...saved.seen,...keys])], valid=[...saved.valid.filter(k=>!keys.includes(k)),...keys.filter(k=>A.valid.has(k))];
  try{ localStorage.setItem(SOCIO_LS(A.cfg.id),JSON.stringify({seen,valid})); }catch(e){}
}
const ATT_COMMON={
  code:{m:'code',l:'Código'}, created:{m:'created_at',l:'Created Date'}, createdBy:{m:'created_by',l:'Created User'},
  estado:{m:'states',l:'Estado donde se brindó la asistencia',req:1}, municipio:{m:'municipalities',l:'Municipio donde se brindó la asistencia',req:1},
  parroquia:{m:'parishes',l:'Parroquia donde se brindó la asistencia',req:1}, isAloj:{m:'is_alojamiento',l:'¿Está en un alojamiento?',req:1},
  alojamiento:{m:'alojamiento',l:'Alojamiento',req:1}, comunidad:{m:'communities',l:'Comunidad',req:1},
  fecha:{m:'assistance_date',l:'Fecha de asistencia',req:1}, socio:{m:'implementing_partner',l:'Socio Implementador',req:1},
  socioOtro:{m:'other_implementing_partner',l:'Otro Socio Implementador'}, caso:{m:'case_code',l:'Código de caso',req:1},
  tipo:{m:'tipo_atencion',l:'Tipo de atención',req:1}, benef:{m:'bnf_id',l:'Beneficiario',req:1}};
const sesionOk=v=>v==null||(Number.isInteger(v)&&v>=1&&v<=50);
const ATT_CFG={
  salud:{id:'salud',name:'Atenciones en salud',srcName:'atenciones en salud',file:'Atenciones_Salud',title:'Informe de atenciones en salud',sub:'Atenciones en salud · IMS',
    lead:'Archivo reconocido por sus columnas de atención (Código de caso, Fecha de asistencia, Diagnóstico).',
    cols:{proyecto:{m:'proyecto',l:'Proyecto',req:1},diag:{m:'diagnostico',l:'Diagnóstico',req:1},diagP:{m:'treatment',l:'Diagnóstico Principal',req:1},otroDiag:{m:'otro_diagnostico',l:'Otro Diagnóstico'},
      estatus:{m:'diagnosis_status',l:'Confirmado/Presuntivo',req:1},conducta:{m:'conduct',l:'Conducta',req:1}},
    derive:g=>({proyecto:toText(g('proyecto')),diagnostico:toText(g('diagP'))||toText(g('diag')),otroDiag:toText(g('otroDiag')),estatus:toText(g('estatus')),conducta:multi(g('conducta'))}),
    exactKey:a=>[fold(a.diagnostico),fold(a.otroDiag),fold(a.tipo),...(a.diagnostico?[]:[fold(a.conducta),fold(a.estatus)])],
    nearKey:a=>a.diagnostico?`${fold(a.diagnostico)}|${fold(a.otroDiag)}`:null,
    nearLabel:'mismo diagnóstico con 1 o 2 días de diferencia',
    issues:[{sum:'Atenciones sin diagnóstico',prob:a=>'Sin diagnóstico',test:a=>!a.diagnostico}],
    cats:[['socio','Socio implementador'],['estado','Estado de atención'],['municipio','Municipio de atención'],['parroquia','Parroquia de atención'],['alojamiento','Alojamiento'],['tipo','Tipo de atención'],['proyecto','Proyecto']],
    pbi:[['estado','Estado donde se brindó la asistencia'],['municipio','Municipio donde se brindó la asistencia'],['parroquia','Parroquia donde se brindó la asistencia'],['isAloj','¿Está en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['fecha','Fecha de asistencia','date'],['socio','Socio Implementador'],['caso','Código de caso'],['#split','tipo','Tipo de atención'],['proyecto','Proyecto'],['diagnostico','Diagnóstico'],['estatus','Confirmado/Presuntivo'],['#split','conducta','Conducta']],
    dupCol:['diagnostico','Diagnóstico'],
    pbiDesc:'Una fila por atención con los campos de ubicación, socio, código de caso, tipo de atención, proyecto, diagnóstico unificado, confirmación y conducta, más el sexo y la edad de la persona tomados del Registro de Familias.',
    errDesc:'duplicados y posibles duplicados (con los minutos entre cargas y quién cargó), socios no válidos, atenciones sin vínculo con el Registro y atenciones sin diagnóstico',
    repDesc:'volumen, personas atendidas, diagnósticos, perfil por sexo y edad, lugares de atención, socios y calidad de los datos'},
  proteccion:{id:'proteccion',companion:'psicosocial',defaultValid:['hias','equipo proteccion oim'],name:'Atenciones en protección',srcName:'atenciones en protección',file:'Atenciones_Proteccion',title:'Informe de atenciones en protección',sub:'Protección · IMS',
    lead:'Archivo reconocido por sus columnas de atención (Código de caso, Fecha de asistencia, Tipo de asistencia).',
    cols:{tipo:{m:'tipo_asistencia',l:'Tipo de asistencia',req:1},proyecto:{m:'proyecto',l:'Proyecto',req:1},project:{m:'project',l:'Proyecto (columna 2)'},
      orient:{m:'orientacion',l:'¿Qué tipo de orientación recibió la persona?',req:1},material:{m:'informativos',l:'Entrega de material informativo / directorio de servicios',req:1},
      orientDoc:{m:'orientacion_document',l:'¿Qué tipo de orientación recibió la persona? (documentación)',req:1},acciones:{m:'acciones_realizadas',l:'Acciones realizadas',req:1},
      kitEcho:{m:'can_dignidad',l:'Cantidad de Echo kit dignidad',req:1},kitUs:{m:'can_dignidad_us',l:'Cantidad de US kit dignidad',req:1},kitDhr:{m:'can_dignidad_dhr',l:'Cantidad de DHR Kit dignidad',req:1},
      tema:{m:'sensitive_topic',l:'Tema abordado',req:1},atType:{m:'atention_type',l:'Tipo de atención',req:1},modal:{m:'modality',l:'Modalidad',req:1},sesN:{m:'session_number',l:'Numero de sesiones',req:1},cierre:{m:'end_session',l:'¿Es sesión de cierre?',req:1},motIng:{m:'reason_admission',l:'Motivo de ingreso (categorias no clinicas)',req:1},estAcomp:{m:'accompaniment_status',l:'Estado del acompañamiento',req:1},derSM:{m:'referred_specialized',l:'¿Se derivó a servicio especializado de salud mental?',req:1}},
    derive:g=>{ const n=k=>{ const v=toNum(g(k)); return v===undefined?null:v; }; return {proyecto:toText(g('proyecto'))||toText(g('project')),orient:multi(g('orient')),material:toText(g('material')),orientDoc:multi(g('orientDoc')),
      acciones:multi(g('acciones')),kitEcho:n('kitEcho'),kitUs:n('kitUs'),kitDhr:n('kitDhr'),tema:multi(g('tema')),atType:toText(g('atType')),modal:toText(g('modal')),sesRaw:toText(g('sesN')),sesN:(v=>v===undefined||!sesionOk(v)?null:v)(toNum(g('sesN'))),sesBad:(v=>v===undefined||(v!=null&&!sesionOk(v)))(toNum(g('sesN'))),cierre:toText(g('cierre')),motIng:multi(g('motIng')),estAcomp:toText(g('estAcomp')),derSM:toText(g('derSM'))}; },
    splitKnown:{tipo:['ORIENTACIÓN GENERAL','DOCUMENTACIÓN','DERIVACIONES','PSICOSOCIAL','DHR KIT DIGNIDAD','EN ESPECIE','SENSIBILIZACIONES']},
    exactKey:a=>[fold(a.tipo),fold(a.orient),fold(a.orientDoc),fold(a.acciones),String(a.kitEcho??''),String(a.kitUs??''),String(a.kitDhr??''),fold(a.tema),fold(a.atType),String(a.sesN??a.sesRaw??'')],
    nearKey:a=>a.tipo&&!/psicosocial/.test(fold(a.tipo))?[fold(a.tipo),fold(a.orient),fold(a.orientDoc),fold(a.acciones)].join('|'):null,
    nearLabel:'misma asistencia con 1 o 2 días de diferencia; no aplica a psicosocial',
    issues:[{sum:'Atenciones sin tipo de asistencia',prob:a=>'Sin tipo de asistencia',test:a=>!a.tipo},
      {sum:'Orientación general sin el tipo de orientación recibida',prob:a=>'Tipo de asistencia «Orientación general» sin el tipo de orientación',test:a=>fold(a.tipo).includes('orientacion general')&&!a.orient},
      {sum:'Documentación sin el tipo de orientación legal recibida',prob:a=>'Tipo de asistencia «Documentación» sin el tipo de orientación legal',test:a=>fold(a.tipo).includes('documentacion')&&!a.orientDoc},
      {sum:'Kits de dignidad inconsistentes con el tipo de asistencia',prob:a=>/kit dignidad/.test(fold(a.tipo))?'Kit de dignidad en el tipo de asistencia sin cantidad registrada':'Cantidad de kits registrada sin kit en el tipo de asistencia',
        test:a=>/kit dignidad/.test(fold(a.tipo))!==(((a.kitEcho||0)+(a.kitUs||0)+(a.kitDhr||0))>0)},
      {sum:'Psicosocial sin el tipo de atención psicosocial',prob:a=>'Tipo de asistencia «Psicosocial» sin tipo de atención',test:a=>fold(a.tipo).includes('psicosocial')&&!a.atType},
      {sum:'Atenciones con número de sesiones no válido',prob:a=>`Número de sesiones no válido (${a.sesRaw})`,test:a=>a.sesBad}],
    qualityLabel:'Atenciones con datos incompletos o inconsistentes',
    cats:[['socio','Socio implementador'],['estado','Estado de atención'],['municipio','Municipio de atención'],['parroquia','Parroquia de atención'],['alojamiento','Alojamiento'],['proyecto','Proyecto'],['atType','Tipo de atención psicosocial']],
    pbi:[['estado','Estado donde se brindó la asistencia'],['municipio','Municipio donde se brindó la asistencia'],['parroquia','Parroquia donde se brindó la asistencia'],['isAloj','¿Está en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['fecha','Fecha de asistencia','date'],['socio','Socio Implementador'],['caso','Código de caso'],['proyecto','Proyecto'],
      ['#split','tipo','Tipo de asistencia'],['#split','orient','Orientación (general)'],['material','Entrega de material informativo / directorio de servicios'],['#split','orientDoc','Orientación (documentación)'],['#split','acciones','Acciones'],
      ['kitEcho','Cantidad de Echo kit dignidad'],['kitUs','Cantidad de US kit dignidad'],['kitDhr','Cantidad de DHR Kit dignidad'],['#split','tema','Tema abordado'],
      ['atType','Tipo de atención psicosocial'],['modal','Modalidad'],['sesN','Número de sesiones'],['cierre','¿Es sesión de cierre?'],['#split','motIng','Motivo de ingreso'],['estAcomp','Estado del acompañamiento'],['derSM','¿Se derivó a servicio especializado de salud mental?']],
    dupCol:['tipo','Tipo de asistencia'],
    pbiDesc:'Una fila por atención con ubicación, socio, código de caso y proyecto; una columna 1/0 por cada tipo de asistencia; orientaciones, material informativo, acciones realizadas, kits de dignidad, tema abordado y el bloque psicosocial (tipo de atención, modalidad, sesiones, cierre, motivo de ingreso y estado del acompañamiento), más el sexo y la edad tomados del Registro de Familias.',
    errDesc:'duplicados y posibles duplicados (con los minutos entre cargas y quién cargó), socios no válidos, atenciones sin vínculo con el Registro y datos incompletos o inconsistentes (orientaciones y kits)',
    repDesc:'volumen, personas atendidas, tipos de asistencia, orientaciones, acciones, kits de dignidad, atención psicosocial, perfil por sexo y edad, lugares de atención, socios y calidad de los datos'},
  psicosocial:{id:'psicosocial',companion:'proteccion',defaultValid:['hias','equipo proteccion oim'],name:'Atenciones psicosociales (Protección)',srcName:'atenciones psicosociales',file:'Atenciones_Psicosociales',title:'Informe de atenciones psicosociales',sub:'Atención psicosocial · Protección · IMS',
    lead:'Archivo reconocido por sus columnas de atención psicosocial (Código de caso, Fecha de asistencia, Tipo de atención, Número de sesiones).',
    cols:{tipo:{m:'atention_type',l:'Tipo de atención',req:1},modal:{m:'modality',l:'Modalidad',req:1},sesN:{m:'session_number',l:'Numero de sesiones',req:1},cierre:{m:'end_session',l:'¿Es sesión de cierre?',req:1},
      motIng:{m:'reason_admission',l:'Motivo de ingreso (categorias no clinicas)',req:1},estAcomp:{m:'accompaniment_status',l:'Estado del acompañamiento',req:1}},
    derive:g=>{ const sv=toNum(g('sesN')); const ok=sv!==undefined&&sesionOk(sv); return {modal:toText(g('modal')),sesRaw:toText(g('sesN')),sesN:ok?sv:null,sesion:ok?sv:null,sesBad:sv===undefined||(sv!=null&&!sesionOk(sv)),
      cierre:toText(g('cierre')),motIng:multi(g('motIng')),estAcomp:toText(g('estAcomp'))}; },
    exactKey:a=>[fold(a.tipo),String(a.sesN??a.sesRaw??''),fold(a.modal),fold(a.estAcomp)],
    nearKey:a=>a.tipo&&a.sesN!=null?`${fold(a.tipo)}|s${a.sesN}`:null,
    nearLabel:'mismo tipo de atención y misma sesión con 1 o 2 días de diferencia',
    issues:[{sum:'Atenciones sin tipo de atención',prob:a=>'Sin tipo de atención',test:a=>!a.tipo},
      {sum:'Atenciones con número de sesiones no válido',prob:a=>`Número de sesiones no válido (${a.sesRaw})`,test:a=>a.sesBad},
      {sum:'Atenciones sin estado del acompañamiento',prob:a=>'Sin estado del acompañamiento',test:a=>!a.estAcomp},
      {sum:'Sesión de cierre inconsistente con el estado del acompañamiento',prob:a=>fold(a.cierre)==='si'?`Sesión de cierre con acompañamiento «${a.estAcomp}»`:`Acompañamiento «${a.estAcomp}» sin sesión de cierre`,
        test:a=>(fold(a.cierre)==='si'&&fold(a.estAcomp)==='activo')||(fold(a.cierre)==='no'&&/^cerrado/.test(fold(a.estAcomp)))}],
    qualityLabel:'Atenciones con datos incompletos o inconsistentes',
    cats:[['socio','Socio implementador'],['estado','Estado de atención'],['municipio','Municipio de atención'],['parroquia','Parroquia de atención'],['alojamiento','Alojamiento'],['tipo','Tipo de atención']],
    pbi:[['estado','Estado donde se brindó la asistencia'],['municipio','Municipio donde se brindó la asistencia'],['parroquia','Parroquia donde se brindó la asistencia'],['isAloj','¿Está en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['fecha','Fecha de asistencia','date'],['socio','Socio Implementador'],['caso','Código de caso'],
      ['tipo','Tipo de atención psicosocial'],['modal','Modalidad'],['sesN','Número de sesiones'],['cierre','¿Es sesión de cierre?'],['#split','motIng','Motivo de ingreso'],['estAcomp','Estado del acompañamiento']],
    dupCol:['tipo','Tipo de atención'],
    pbiDesc:'Una fila por atención con ubicación, socio, código de caso, tipo de atención, modalidad, número de sesiones, sesión de cierre, motivo de ingreso (1/0 por opción) y estado del acompañamiento, más el sexo y la edad tomados del Registro de Familias.',
    errDesc:'duplicados y posibles duplicados, atenciones registradas también en el formulario de Protección, socios no válidos, atenciones sin vínculo con el Registro y datos incompletos o inconsistentes',
    repDesc:'volumen, personas atendidas, tipos de atención, motivos de ingreso, sesiones, perfil por sexo y edad, lugares de atención, socios y calidad de los datos'},
  mental:{id:'mental',extraValid:/ucab/,name:'Atenciones en salud mental',srcName:'atenciones en salud mental',file:'Atenciones_Salud_Mental',title:'Informe de atenciones en salud mental',sub:'Salud mental y apoyo psicosocial · IMS',
    lead:'Archivo reconocido por sus columnas de atención (Código de caso, Fecha de asistencia, Tipo de atención psicosocial).',
    cols:{motivo:{m:'motive_ps',l:'Motivo / problemática presentada',req:1},psico:{m:'psicosocial',l:'Tipo de atención psicosocial',req:1},
      psico2:{m:'psicosocial_ucab_vdt_oim',l:'Tipo de atención psicosocial (UCAB / VDT / OIM)'},sesion:{m:'sesion_no',l:'Número de sesión',req:1}},
    derive:g=>{ const sv=toNum(g('sesion')); return {motivo:multi(g('motivo')),psico:multi(g('psico'))||multi(g('psico2')),sesionRaw:toText(g('sesion')),sesion:sesionOk(sv)?sv:null,sesionBad:sv===undefined||!sesionOk(sv)}; },
    exactKey:a=>[fold(a.motivo),fold(a.psico),fold(a.tipo),String(a.sesion??'')],
    nearKey:a=>a.psico?`${fold(a.psico)}|${a.sesion!=null?'s'+a.sesion:'m'+fold(a.motivo)}`:null,
    nearLabel:'mismo tipo de atención y misma sesión con 1 o 2 días de diferencia',
    issues:[{sum:'Atenciones sin tipo de atención psicosocial',prob:a=>'Sin tipo de atención psicosocial',test:a=>!a.psico},
      {sum:'Atenciones sin motivo / problemática',prob:a=>'Sin motivo / problemática',test:a=>!a.motivo},
      {sum:'Atenciones con número de sesión no válido',prob:a=>`Número de sesión no válido (${a.sesionRaw})`,test:a=>a.sesionBad}],
    cats:[['socio','Socio implementador'],['estado','Estado de atención'],['municipio','Municipio de atención'],['parroquia','Parroquia de atención'],['alojamiento','Alojamiento'],['psico','Tipo de atención psicosocial']],
    pbi:[['estado','Estado donde se brindó la asistencia'],['municipio','Municipio donde se brindó la asistencia'],['parroquia','Parroquia donde se brindó la asistencia'],['isAloj','¿Está en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['fecha','Fecha de asistencia','date'],['socio','Socio Implementador'],['caso','Código de caso'],['#split','tipo','Tipo de atención'],['psico','Tipo de atención psicosocial'],['motivo','Motivo / problemática presentada'],['sesion','Número de sesión']],
    dupCol:['psico','Tipo de atención psicosocial'],
    pbiDesc:'Una fila por atención con ubicación, socio, código de caso, tipo de atención, tipo de atención psicosocial, motivo y número de sesión, más el sexo y la edad de la persona tomados del Registro de Familias.',
    errDesc:'duplicados y posibles duplicados (con los minutos entre cargas y quién cargó), socios no válidos, atenciones sin vínculo con el Registro, datos incompletos y números de sesión no válidos',
    repDesc:'volumen, personas atendidas, tipos de atención psicosocial, motivos, sesiones, perfil por sexo y edad, lugares de atención, socios y calidad de los datos'}
};
function peekRows(ws,n){ if(!ws||!ws['!ref']) return []; const r=XLSX.utils.decode_range(ws['!ref']); r.e.r=Math.min(r.e.r,n); return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,range:XLSX.utils.encode_range(r)}); }
function attSheet(wb){
  for(const n of wb.SheetNames){ const h=peekRows(wb.Sheets[n],2).flat().map(x=>String(x??''));
    if(!(h.includes('case_code')&&h.includes('assistance_date'))) continue;
    if(h.includes('tipo_asistencia')&&!h.includes('acciones_realizadas')&&h.includes('atention_type')) return {sheet:n,cfg:ATT_CFG.psicosocial};
    if(h.includes('tipo_asistencia')) return {sheet:n,cfg:ATT_CFG.proteccion};
    if(h.includes('diagnostico')||h.includes('treatment')) return {sheet:n,cfg:ATT_CFG.salud};
    if(h.includes('psicosocial')||h.includes('motive_ps')) return {sheet:n,cfg:ATT_CFG.mental}; }
  for(const n of wb.SheetNames){ const h=peekRows(wb.Sheets[n],2).flat().map(x=>fold(x));
    if(!(h.includes('codigo de caso')&&h.includes('fecha de asistencia'))) continue;
    if(h.includes('tipo de asistencia')&&!h.includes('acciones realizadas')) return {sheet:n,cfg:ATT_CFG.psicosocial};
    if(h.includes('tipo de asistencia')) return {sheet:n,cfg:ATT_CFG.proteccion};
    if(h.includes('diagnostico principal')) return {sheet:n,cfg:ATT_CFG.salud};
    if(h.includes('tipo de atencion psicosocial')) return {sheet:n,cfg:ATT_CFG.mental}; }
  return null;
}
function salDetect(wb){ return !!attSheet(wb); }
const multi=v=>{ const t=toText(v==null?null:String(v).split(/\r?\n/).map(s=>s.trim()).filter(Boolean).join('; ')); return t; };
function matchPerson(ps,name){
  if(!ps||!ps.length||!name) return null;
  const nk=nameKey(name); if(!nk) return null;
  const ex=ps.filter(p=>p.nk===nk); if(ex.length) return ex[0];
  const t=nk.split(' ');
  const sub=ps.filter(p=>{ const u=p.nk.split(' ').filter(Boolean); if(!u.length) return false; const [a,b]=u.length<=t.length?[u,new Set(t)]:[t,new Set(u)]; return a.every(x=>b.has(x)); });
  if(sub.length===1) return sub[0];
  const first=fold(name).split(' ')[0];
  const ov=ps.filter(p=>{ const u=new Set(p.nk.split(' ')); return fold(p.name).split(' ')[0]===first&&t.filter(x=>u.has(x)).length>=2; });
  return ov.length===1?ov[0]:null;
}
function salLoad(wb,fileName,REG,forced){
  const det0=attSheet(wb), cfg=forced&&ATT_CFG[forced]?ATT_CFG[forced]:det0.cfg, det={cfg,sheet:det0?det0.sheet:wb.SheetNames[0]};
  const A={file:fileName,check:[],fatal:[],reg:REG||null,cfg};
  const sn=det.sheet, sh=imsSheet(wb.Sheets[sn]); sh.idx={}; A.sheet=sn;
  for(const [k,c] of Object.entries({...ATT_COMMON,...cfg.cols})){ const loc=locateCol(sh,c); sh.idx[k]=loc.idx;
    A.check.push({sheet:sn,label:c.l,how:loc.how,col:loc.idx>=0?XLSX.utils.encode_col(loc.idx):'',found:loc.idx>=0,req:!!c.req});
    if(loc.idx<0&&c.req) A.fatal.push(c.l); }
  if(A.fatal.length||!REG) return A;
  const g=(x,k)=>sh.idx[k]>=0?x.r[sh.idx[k]]:null;
  A.rows=sh.rows.map(x=>{ const caso=toText(g(x,'caso')), m=caso&&caso.match(/(\d+)\s*$/), num=m?Number(m[1]):null, benef=toText(g(x,'benef'));
    const fam=num!=null?REG.famByNum.get(num):null, ps=fam?REG.byFam.get(num):null, p=fam?matchPerson(ps,benef):null, cr=g(x,'created'), fecha=cellYMD(g(x,'fecha'));
    return {n:x.n,code:toText(g(x,'code')),createdMs:typeof cr==='number'?Math.round(cr*86400000):null,createdBy:toText(g(x,'createdBy')),
      estado:toText(g(x,'estado')),municipio:toText(g(x,'municipio')),parroquia:toText(g(x,'parroquia')),isAloj:toText(g(x,'isAloj')),alojamiento:toText(g(x,'alojamiento')),comunidad:toText(g(x,'comunidad')),
      fecha,socio:toText(g(x,'socio')),socioOtro:toText(g(x,'socioOtro')),caso,num,fam,ps,tipo:multi(g(x,'tipo')),benef,nk:nameKey(benef),...cfg.derive(k=>g(x,k)),p,
      age:p&&p.birth&&fecha&&p.birth<=fecha?ageAt(p.birth,fecha):null,
      pkey:`${num??caso??''}|${nameKey(benef)}`}; });
  A.minValid=validFrom(A.rows.map(a=>a.fecha)); dateRange(A);
  // Campos de respuesta múltiple: una columna 1/0 por opción (conocidas + encontradas en el archivo)
  A.split={};
  A.cfg.pbi.filter(e=>e[0]==='#split').forEach(([,k])=>{ const known=((A.cfg.splitKnown||{})[k]||[]).slice(), kf=new Set(known.map(fold)), cnt=new Map();
    A.rows.forEach(a=>{ const toks=(a[k]||'').split('; ').filter(Boolean); (a.sets=a.sets||{})[k]=new Set(toks.map(fold)); toks.forEach(t=>{ if(!kf.has(fold(t))) cnt.set(t,(cnt.get(t)||0)+1); }); });
    const extra=[], seenF=new Set(); [...cnt.entries()].sort((x,y)=>y[1]-x[1]).forEach(([t])=>{ const f=fold(t); if(!seenF.has(f)){ seenF.add(f); extra.push(t); } });
    A.split[k]=[...known,...extra]; });
  initValid(A); A.err=salAnalyze(A); A.filters={from:A.minDate,to:A.maxDate,cats:{}};
  return A;
}
function salAnalyze(A){
  const E={};
  E.socio=A.rows.filter(a=>!A.valid.has(socioKey(a)));
  E.noCase=A.rows.filter(a=>!a.fam);
  E.noPerson=A.rows.filter(a=>a.fam&&!a.p);
  E.other=A.cfg.issues.flatMap(d=>A.rows.filter(d.test).map(a=>({a,def:d,prob:d.prob(a)})));
  E.badDate=A.rows.filter(a=>dateProblem(a.fecha,A.minValid));
  // Duplicados: misma persona, mismo día y mismos datos; posibles: mismo diagnóstico con 1 a 2 días de diferencia
  const uf=()=>{ const par=new Map(); const find=x=>{ while(par.get(x)!==x){ par.set(x,par.get(par.get(x))); x=par.get(x); } return x; };
    return {add:x=>{ if(!par.has(x)) par.set(x,x); },union:(a,b)=>{ const ra=find(a),rb=find(b); if(ra!==rb) par.set(rb,ra); },groups:()=>{ const g=new Map(); for(const x of par.keys()){ const r=find(x); if(!g.has(r)) g.set(r,[]); g.get(r).push(x); } return [...g.values()]; }}; };
  const exact=uf(), seen=new Map();
  A.rows.forEach((a,i)=>{ if(!a.nk||!a.fecha) return; const k=[a.pkey,a.fecha,...A.cfg.exactKey(a)].join('|');
    if(seen.has(k)){ exact.add(seen.get(k)); exact.add(i); exact.union(seen.get(k),i); } else seen.set(k,i); });
  const inExact=new Set(exact.groups().flat());
  const near=uf(), byPD=new Map();
  A.rows.forEach((a,i)=>{ const nk=A.cfg.nearKey(a); if(!a.nk||!a.fecha||!nk) return; const k=`${a.pkey}|${nk}`; if(!byPD.has(k)) byPD.set(k,[]); byPD.get(k).push(i); });
  const dnum=d=>Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10))/86400000;
  for(const ix of byPD.values()){ ix.sort((x,y)=>A.rows[x].fecha.localeCompare(A.rows[y].fecha));
    for(let j=1;j<ix.length;j++){ const d=dnum(A.rows[ix[j]].fecha)-dnum(A.rows[ix[j-1]].fecha); if(d>=1&&d<=2){ near.add(ix[j-1]); near.add(ix[j]); near.union(ix[j-1],ix[j]); } } }
  const mk=(groups,tipo)=>groups.map(g=>g.map(i=>A.rows[i]).sort((x,y)=>(x.fecha||'').localeCompare(y.fecha||'')||(x.createdMs||0)-(y.createdMs||0))).map(rows=>({tipo,rows}));
  E.dup=[...mk(exact.groups(),'Duplicado: misma persona, mismo día y mismos datos'),...mk(near.groups().filter(g=>!g.every(i=>inExact.has(i))),'Posible duplicado: '+A.cfg.nearLabel)]
    .sort((a,b)=>(a.rows[0].benef||'').localeCompare(b.rows[0].benef||'','es'));
  // Atenciones registradas también en el formulario complementario (Protección ↔ Atención psicosocial)
  E.cross=[]; A.rows.forEach(a=>{ delete a.cross; });
  if(A.comp){ const idx=new Map();
    A.comp.rows.forEach(b=>{ if(!b.fecha||!b.nk) return; if(A.cfg.id==='psicosocial'&&!/psicosocial/.test(fold(b.tipo))) return; const k=b.pkey+'|'+b.fecha; if(!idx.has(k)) idx.set(k,[]); idx.get(k).push(b); });
    A.rows.forEach(a=>{ if(!a.fecha||!a.nk) return; if(A.cfg.id==='proteccion'&&!/psicosocial/.test(fold(a.tipo))) return; const m=idx.get(a.pkey+'|'+a.fecha); if(m){ a.cross=m; E.cross.push(a); } }); }
  return E;
}
function salAttachComp(A,rows,file){ A.comp={file,rows}; A.err=salAnalyze(A); }
const crossType=(A,a)=>A.cfg.id==='psicosocial'?a.tipo:(a.atType||a.tipo);
function salPass(a,F=S.sal.filters){
  if(F.from||F.to){ if(!a.fecha) return false; if(F.from&&a.fecha<F.from) return false; if(F.to&&a.fecha>F.to) return false; }
  for(const k in F.cats){ const s=F.cats[k]; if(s&&s.size&&!s.has(a[k]??'(vacío)')) return false; }
  return true;
}
function salScoped(F=S.sal.filters){ const E=S.sal.err, f=a=>salPass(a,F);
  return {socio:E.socio.filter(f),noCase:E.noCase.filter(f),noPerson:E.noPerson.filter(f),other:E.other.filter(x=>f(x.a)),badDate:E.badDate.filter(a=>salPass(a,{...F,from:'',to:''})),dup:E.dup.filter(g=>g.rows.some(f)),cross:(E.cross||[]).filter(f)}; }
function salSummary(F){ const E=salScoped(F), dRows=g=>g.reduce((t,x)=>t+x.rows.length,0);
  const ex=E.dup.filter(g=>g.tipo.startsWith('Duplicado')), nr=E.dup.filter(g=>!g.tipo.startsWith('Duplicado'));
  const r=[['Atenciones duplicadas (misma persona, mismo día y mismos datos)',dRows(ex)],[`Atenciones posiblemente duplicadas (${S.sal.cfg.nearLabel})`,dRows(nr)],
    ['Atenciones con socio implementador no válido',E.socio.length],['Atenciones con código de caso que no existe en Registro de Familias',E.noCase.length],
    ['Atenciones cuya persona no se encontró en su familia',E.noPerson.length],...S.sal.cfg.issues.map(d=>[d.sum,E.other.filter(x=>x.def===d).length])];
  r.push(['Atenciones con fecha de asistencia vacía, futura o muy antigua',E.badDate.length]);
  if(S.sal.comp) r.splice(2,0,[`Atenciones registradas también en ${mmLabel(S.sal.cfg.companion)}`,E.cross.length]);
  return r; }
const SAL_PBI_UNUSED=[['estado','Estado donde se brindó la asistencia'],['municipio','Municipio donde se brindó la asistencia'],['parroquia','Parroquia donde se brindó la asistencia'],['isAloj','¿Está en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['fecha','Fecha de asistencia','date'],['socio','Socio Implementador'],['caso','Código de caso'],['tipo','Tipo de atención'],['proyecto','Proyecto'],['diagnostico','Diagnóstico'],['estatus','Confirmado/Presuntivo'],['conducta','Conducta']];
function salPbiTable(){
  const A=S.sal, PB=A.cfg.pbi, cols=[...PB.flatMap(e=>e[0]==='#split'?A.split[e[1]].map(o=>({h:`${e[2]}/${o}`,base:e[2],split:true})):[{h:e[1],type:e[2]}]),{h:'Sexo'},{h:'Edad'}];
  const data=A.rows.filter(a=>salPass(a)).map(a=>[...PB.flatMap(e=>e[0]==='#split'?A.split[e[1]].map(o=>a.sets[e[1]].has(fold(o))?1:0):[a[e[0]]]),a.p?(a.p.sexo||'Sin datos'):'Sin datos',a.age!=null?a.age:'Sin datos']);
  return {cols,data};
}
async function salExportPbi(kind){
  const {cols,data}=salPbiTable(), F=S.sal.filters, tag=F.from&&F.to?`_${F.from}_a_${F.to}`:'';
  if(kind==='csv'){ const csv='\ufeff'+XLSX.utils.sheet_to_csv(buildSheet(cols,data),{FS:',',RS:'\r\n'}); await saveFile(`${S.sal.cfg.file}_PowerBI${tag}.csv`,new Blob([csv],{type:'text/csv'})); return; }
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,buildSheet(cols,data),S.sal.cfg.file.slice(0,31)); await saveFile(`${S.sal.cfg.file}_PowerBI${tag}.xlsx`,xlsxBlob(wb));
}
async function salExportErrors(){
  const E=salScoped(), wb=XLSX.utils.book_new(), add=(n,c,r)=>XLSX.utils.book_append_sheet(wb,buildSheet(c,r),n);
  add('Resumen',[{h:'Descripción'},{h:'Cantidad'}],salSummary());
  add('Duplicados',[{h:'Tipo'},{h:'Código'},{h:'Fila en el Excel'},{h:'Código de caso'},{h:'Beneficiario'},{h:'Fecha de asistencia',type:'date'},{h:S.sal.cfg.dupCol[1]},{h:'Socio Implementador'},{h:'Minutos desde la carga anterior'},{h:'Cargado por'}],
    E.dup.flatMap(g=>g.rows.map((a,i)=>[g.tipo,a.code,a.n,a.caso,a.benef,a.fecha||null,a[S.sal.cfg.dupCol[0]],a.socio,i&&a.createdMs!=null&&g.rows[i-1].createdMs!=null?Math.round(Math.abs(a.createdMs-g.rows[i-1].createdMs)/60000):null,a.createdBy])));
  add('Socio no válido',[{h:'Código'},{h:'Fila en el Excel'},{h:'Socio Implementador'},{h:'Otro Socio Implementador'},{h:'Código de caso'},{h:'Beneficiario'},{h:'Fecha de asistencia',type:'date'},{h:'Cargado por'}],
    E.socio.map(a=>[a.code,a.n,a.socio,a.socioOtro,a.caso,a.benef,a.fecha||null,a.createdBy]));
  add('Sin vínculo con Registro',[{h:'Problema'},{h:'Código'},{h:'Fila en el Excel'},{h:'Código de caso'},{h:'Beneficiario'},{h:'Fecha de asistencia',type:'date'},{h:'Integrantes registrados en la familia'}],
    [...E.noCase.map(a=>['Código de caso no existe en Registro de Familias',a.code,a.n,a.caso,a.benef,a.fecha||null,null]),
     ...E.noPerson.map(a=>['Persona no encontrada en la familia',a.code,a.n,a.caso,a.benef,a.fecha||null,(a.ps||[]).map(p=>p.name).join('; ')])]);
  add('Otras incidencias',[{h:'Problema'},{h:'Código'},{h:'Fila en el Excel'},{h:'Código de caso'},{h:'Beneficiario'},{h:'Fecha de asistencia',type:'date'}],
    [...E.other.map(x=>[x.prob,x.a.code,x.a.n,x.a.caso,x.a.benef,x.a.fecha||null]),...E.badDate.map(a=>[dateProblem(a.fecha,S.sal.minValid),a.code,a.n,a.caso,a.benef,a.fecha||null])]);
  if(S.sal.comp){ const L=mmShort[S.sal.cfg.companion];
    add('En ambos formularios',[{h:'Código'},{h:'Fila en el Excel'},{h:'Código de caso'},{h:'Beneficiario'},{h:'Fecha de asistencia',type:'date'},{h:'Tipo de atención'},{h:`Código en ${L}`},{h:`Fila en ${L}`},{h:`Tipo de atención en ${L}`}],
      E.cross.flatMap(a=>a.cross.map(b=>[a.code,a.n,a.caso,a.benef,a.fecha||null,crossType(S.sal,a),b.code,b.n,b.atType||b.tipo]))); }
  await saveFile(`${S.sal.cfg.file}_Errores_${TODAY_YMD}.xlsx`,xlsxBlob(wb));
}

/* --- Bloques de filtros reutilizables --- */
function catBlock(attr,k,label,items,sel,unit){
  const cnt={}; items.forEach(x=>{ const v=x[k]??'(vacío)'; cnt[v]=(cnt[v]||0)+1; }); const vals=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  return `<details class="cat" ${sel&&sel.size?'open':''}><summary><span>${esc(label)}</span><span class="cnt">${sel&&sel.size?`${sel.size} de ${vals.length} seleccionados`:'Todos'}</span></summary><div class="body">
    <div class="row" style="margin:4px 0 6px"><button class="btn sm" type="button" data-${attr}all="${k}">Todos</button><button class="btn sm" type="button" data-${attr}none="${k}">Ninguno</button></div>
    ${vals.map(([v,n])=>`<label><input type="checkbox" data-${attr}cat="${k}" value="${esc(v)}" ${!sel||!sel.size||sel.has(v)?'checked':''}> ${esc(v)} <span class="cnt">${fmt(n)} ${unit}</span></label>`).join('')}</div></details>`;
}
function bindCats(attr,cats,upd){
  const sync=k=>{ const bx=[...document.querySelectorAll(`[data-${attr}cat="${k}"]`)]; const sel=new Set(bx.filter(b=>b.checked).map(b=>b.value)); cats[k]=sel.size===bx.length?null:sel;
    bx[0].closest('details').querySelector('summary .cnt').textContent=sel.size===bx.length?'Todos':`${sel.size} de ${bx.length} seleccionados`; upd(); };
  document.querySelectorAll(`[data-${attr}cat]`).forEach(b=>b.onchange=()=>sync(b.getAttribute(`data-${attr}cat`)));
  document.querySelectorAll(`[data-${attr}all]`).forEach(b=>b.onclick=()=>{ const k=b.getAttribute(`data-${attr}all`); document.querySelectorAll(`[data-${attr}cat="${k}"]`).forEach(x=>x.checked=true); sync(k); });
  document.querySelectorAll(`[data-${attr}none]`).forEach(b=>b.onclick=()=>{ const k=b.getAttribute(`data-${attr}none`); document.querySelectorAll(`[data-${attr}cat="${k}"]`).forEach(x=>x.checked=false); sync(k); });
}
function monthButtons(dates,minD,maxD,attr){
  const ms=[...new Set(dates.filter(Boolean).map(d=>d.slice(0,7)))].sort().slice(-12); if(ms.length<2) return '';
  return ms.map(m=>{ const [y,mo]=m.split('-').map(Number); const a=[`${m}-01`,minD].sort()[1], z=[ymd(y,mo,new Date(Date.UTC(y,mo,0)).getUTCDate()),maxD].sort()[0];
    return `<button class="btn sm" type="button" data-${attr}="${a}|${z}">${MONTHS[mo-1]} ${y}</button>`; }).join('');
}
function periodPanel(id,minD,maxD,F,dates,attr,note){
  if(!minD) return '<p class="muted" style="margin:0">El archivo no tiene fechas válidas para filtrar.</p>';
  return `<div class="row"><div class="field"><label for="${id}From">Desde</label><input type="hidden" id="${id}From" data-dp data-label="Desde" data-pair="${id}To" data-min="${minD}" data-max="${maxD}" value="${esc(F.from)}"></div><div class="field"><label for="${id}To">Hasta</label><input type="hidden" id="${id}To" data-dp data-label="Hasta" data-pair="${id}From" data-min="${minD}" data-max="${maxD}" value="${esc(F.to)}"></div></div>
    <div class="row" style="margin-top:10px"><button class="btn sm" type="button" data-${attr}="${minD}|${maxD}">Todo</button>${monthButtons(dates,minD,maxD,attr)}</div>${note?`<p class="muted" style="font-size:13px;margin:8px 0 0">${note}</p>`:''}`;
}
function bindPeriod(id,F,dates,attr,upd){
  if(!$(`#${id}From`)) return;
  mountPickers(new Set(dates.filter(Boolean)));
  const setR=(a,z)=>{ [a,z]=orderRange(a,z); F.from=a; F.to=z; $(`#${id}From`).value=a; $(`#${id}To`).value=z; dpRefreshAll(); upd(); };
  $(`#${id}From`).addEventListener('change',e=>setR(e.target.value,F.to)); $(`#${id}To`).addEventListener('change',e=>setR(F.from,e.target.value));
  document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>{ const [a,z]=b.getAttribute(`data-${attr}`).split('|'); setR(a,z); });
}

/* --- Vistas del módulo de salud --- */
function salViewVerify(){
  const A=S.sal, R=S.registro;
  const rows=A.check.map(c=>`<tr class="${c.req?'req':''}"><td>${esc(c.label)}</td><td data-label="Columna">${c.found?`${esc(c.col)} <span class="muted">· ${esc(c.how)}</span>`:'—'}</td><td data-label="Estado">${c.found?'<span class="status ok">Encontrada</span>':(c.req?'<span class="status bad">Falta</span>':'<span class="status mute">No está</span>')}</td></tr>`).join('');
  const regBox=R?`<div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><div><b>Registro de Familias vinculado</b><div class="muted" style="font-size:14px">${esc(R.file)} · ${fmt(R.fams.length)} familias · ${fmt(R.pers.length)} personas · códigos hasta OIM-vcs-${String(Math.max(...R.fams.map(f=>f.num||0))).padStart(6,'0')}</div></div><label class="btn sm"><input type="file" id="regIn" accept=".xlsx,.xls" hidden>Cambiar Registro</label></div></div>`
    :`<div class="note bad">Para procesar este archivo se necesita el <b>Registro de Familias</b>: de ahí salen el sexo y la edad de cada persona, y con él se valida el código de caso.</div>
      <div class="drop" id="regDrop" tabindex="0" role="button" aria-label="Cargar Registro de Familias"><strong>Carga aquí el Excel de Registro de Familias</strong><span>Descárgalo completo del IMS, sin filtros de fecha</span></div><input type="file" id="regIn" accept=".xlsx,.xls" hidden>`;
  let link='';
  if(R&&A.rows){ const n=A.rows.length, nc=A.err.noCase.length, np=A.err.noPerson.length, ok=n-nc-np;
    link=`<div class="facts"><div><b>${fmt(n)}</b><span>Atenciones</span></div><div><b>${esc(A.minDate||'—')}</b><span>Primera atención</span></div><div><b>${esc(A.maxDate||'—')}</b><span>Última atención</span></div><div class="${ok/n>0.9?'ok':'warn'}"><b>${pct(ok,n)}</b><span>Vinculadas a una persona del Registro</span></div></div>
    ${nc/n>0.2?`<div class="note warn">${fmt(nc)} atenciones (${pct(nc,n)}) tienen un código de caso que no existe en el Registro cargado, por lo que tendrán sexo y edad “Sin datos”. Lo más probable es que el Registro esté incompleto: verifica que sea la descarga completa, sin filtro de fechas.</div>`:''}`; }
  const cmp=A.cfg.companion, compBox=!cmp||A.fatal.length?'':(A.comp?`<div class="panel" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><div><b>Formulario complementario: ${esc(mmLabel(cmp))}</b><div class="muted" style="font-size:14px">${esc(A.comp.file)} · ${fmt(A.comp.rows.length)} registros · ${fmt((A.err.cross||[]).length)} atenciones de este archivo también están registradas allí</div></div><label class="btn sm"><input type="file" id="compIn" accept=".xlsx,.xls" hidden>Cambiar archivo</label></div></div>`
    :`<div class="note">Para depurar este archivo se recomienda cargar también el formulario de <b>${esc(mmLabel(cmp))}</b>: así se identifican las atenciones registradas en ambos. Solo sirve de guía para la limpieza; las exportaciones son de este archivo.</div>
      <div class="drop" id="compDrop" tabindex="0" role="button" aria-label="Cargar formulario complementario" style="margin-bottom:18px"><strong>Carga aquí el Excel de ${esc(mmLabel(cmp))} (recomendado)</strong><span>Opcional</span></div><input type="file" id="compIn" accept=".xlsx,.xls" hidden>`);
  return `<h1>${esc(A.cfg.name)}</h1>
  <p class="lead">${esc(A.cfg.lead)} Cada atención se vincula con su familia por el Código de caso y con la persona por el nombre.</p>
  ${A.fatal.length?`<div class="note bad">Faltan columnas necesarias: ${esc(A.fatal.join(', '))}.</div>`:''}
  ${regBox}${compBox}${link}
  ${A.rows&&A.minValid?`<h2>Rango de fechas válidas</h2><div class="panel"><p class="muted" style="margin:0 0 10px;font-size:14px">Las atenciones con fecha posterior a hoy o anterior a esta fecha se reportan como fechas erradas en la limpieza y no se incluyen en los periodos. La fecha se propone automáticamente: es la primera que no está aislada del resto de los datos (separada por más de 6 meses). Ajústala si hace falta.</p>
    <div class="row"><div class="field"><label for="minValid">Fechas válidas desde</label><input type="hidden" id="minValid" data-dp data-label="Fechas válidas desde" data-min="${esc(A.rows.map(a=>a.fecha).filter(Boolean).sort()[0]||'')}" data-max="${TODAY_YMD}" value="${esc(A.minValid)}"></div><div class="field"><label>Hasta</label><span class="muted" style="display:inline-block;padding:6px 0">${dmy(TODAY_YMD)} (hoy)</span></div></div>
    <p class="muted" style="margin:8px 0 0;font-size:13px">${fmt(A.err.badDate.length)} atenciones con fecha vacía, futura o anterior a esa fecha.</p></div>`:''}
  ${A.rows?`<h2>Socios implementadores válidos</h2><div class="panel">
    <p class="muted" style="margin:0 0 8px;font-size:14px">Marca los socios autorizados para este tipo de atención. Las atenciones de socios no marcados se reportan en la limpieza de datos, pero se incluyen igual en Power BI y en el informe.</p>
    <div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" id="validAll">Seleccionar todos</button><button class="btn sm" type="button" id="validNone">Quitar todos</button></div>
    ${A.socioList.map(([x,n])=>`<label class="check"><input type="checkbox" data-valid="${esc(fold(x))}" ${A.valid.has(fold(x))?'checked':''}> ${esc(x)} <span class="muted">(${fmt(n)} atenciones)</span></label>`).join('')}</div>`:''}
  <h2>Columnas utilizadas</h2>
  <div class="scroll"><table class="ledger"><thead><tr><th>Campo</th><th>Columna</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="muted" style="font-size:13px;margin:8px 0 0">* Obligatorias. Las columnas adicionales del Excel se ignoran.</p>
  <div class="actions"><button class="btn" type="button" id="back">Cargar otro archivo</button><button class="btn primary" type="button" id="next" ${A.fatal.length||!R||!A.rows?'disabled':''}>Continuar</button></div>`;
}
function salSumRows(sum){ return sum.map(([d,n])=>`<tr><td style="white-space:normal">${esc(d)}</td><td class="num"><span class="status ${n?(d.startsWith('Atenciones posiblemente')?'warn':'bad'):'ok'}">${fmt(n)}</span></td></tr>`).join(''); }
function salViewReview(){
  const A=S.sal, F=A.filters, {cols,data}=salPbiTable();
  const prev=data.slice(0,50).map(r=>`<tr>${cols.map((c,i)=>`<td class="${typeof r[i]==='number'?'num':''}">${esc(r[i]??'')}</td>`).join('')}</tr>`).join('');
  return `<h1>Datos a procesar</h1>
  <p class="lead">El periodo y los criterios se aplican a la limpieza de datos y a la tabla para Power BI. Los duplicados se buscan en todo el archivo y se listan los que tienen atenciones dentro del periodo.</p>
  <h2 style="margin-top:0">Incidencias encontradas</h2>
  <div class="scroll"><table><thead><tr><th>Descripción</th><th class="num">Cantidad</th></tr></thead><tbody id="salSum">${salSumRows(salSummary())}</tbody></table></div>
  <div class="grid2" style="margin-top:8px">
    <div><h2>Periodo de atención</h2><div class="panel">${periodPanel('s',A.minDate,A.maxDate,F,A.rows.map(a=>a.fecha),'srange','Según la Fecha de asistencia.')}</div></div>
    <div><h2>Criterios</h2>${A.cfg.cats.map(([k,l])=>catBlock('s',k,l,A.rows,F.cats[k],'atenciones')).join('')}</div>
  </div>
  <h2>Vista previa de la tabla para Power BI <span class="muted" style="font-weight:400;font-size:14px">(<span id="sN">${fmt(data.length)}</span> filas; primeras 50)</span></h2>
  <div class="scroll" style="max-height:420px"><table><thead><tr>${cols.map(c=>`<th>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${prev||`<tr><td colspan="${cols.length}" class="muted">Ninguna atención cumple los filtros.</td></tr>`}</tbody></table></div>
  <div class="actions"><button class="btn" type="button" id="back">Volver</button><button class="btn primary" type="button" id="next">Continuar a exportar</button></div>`;
}
function salViewExport(){
  if(S.sal.view==='report') return salViewReport();
  const n=salPbiTable().data.length, F=S.sal.filters;
  return `<h1>Exportar</h1>
  <p class="lead">${fmt(n)} atenciones${F.from?` entre el ${esc(dmy(F.from))} y el ${esc(dmy(F.to))}`:''}.</p>
  <div class="exports">
    <div class="exp"><h3>Limpieza de datos</h3><p>Un Excel con el resumen y una pestaña por tipo de incidencia: ${esc(S.sal.cfg.errDesc)}. No modifica el archivo original.</p><button class="btn primary" type="button" id="exErr">Descargar reporte</button></div>
    <div class="exp"><h3>Tabla para Power BI</h3><p>${esc(S.sal.cfg.pbiDesc)}</p><div class="row"><button class="btn primary" type="button" id="exPbi" ${n?'':'disabled'}>Descargar Excel</button><button class="btn" type="button" id="exCsv" ${n?'':'disabled'}>Descargar CSV</button></div></div>
    <div class="exp"><h3>Construir informe</h3><p>Un PDF de una página con el análisis de las atenciones: ${esc(S.sal.cfg.repDesc)}. Tiene sus propios criterios.</p><button class="btn primary" type="button" id="exRep">Construir informe</button></div>
    <div class="exp"><h3>Tablero interactivo</h3><p>Un tablero con filtros de periodo, estado, municipio, parroquia y socio: resultados por formulario, desagregación por edad y sexo, población clave, histórico, ubicaciones y socios. Se puede exportar en PDF con los filtros aplicados.</p><button class="btn primary" type="button" data-opendash>Abrir tablero</button></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a filtros</button><button class="btn" type="button" id="restart">Procesar otro archivo</button></div>`;
}

/* --- Informe PDF de salud --- */
function salRepInit(){ const A=S.sal; if(!A.rep){ let logo=null; try{ logo=JSON.parse(localStorage.getItem(LOGO_KEY)||'null'); }catch(e){}
  A.rep={from:A.minDate,to:A.maxDate,cats:{},title:A.cfg.title,notes:'',logo}; } return A.rep; }
function salRepData(){
  const A=S.sal, R=salRepInit(), rows=A.rows.filter(a=>salPass(a,R));
  const persons=new Map(); rows.forEach(a=>{ if(!persons.has(a.pkey)) persons.set(a.pkey,a); });
  const pers=[...persons.values()];
  const sex=a=>{ const x=fold(a.p&&a.p.sexo); return x==='mujer'?'Mujer':x==='hombre'?'Hombre':null; };
  const pyr=AGE_GROUPS.map(([l,lo,hi])=>({l,m:pers.filter(a=>sex(a)==='Mujer'&&a.age!=null&&a.age>=lo&&a.age<=hi).length,h:pers.filter(a=>sex(a)==='Hombre'&&a.age!=null&&a.age>=lo&&a.age<=hi).length}));
  const tok=(arr,k)=>countBy(arr.flatMap(a=>(a[k]||'').split('; ').filter(Boolean)),x=>x);
  const ds=rows.map(a=>a.fecha).filter(Boolean).sort(); const span=ds.length?(Date.parse(ds[ds.length-1])-Date.parse(ds[0]))/86400000:0;
  let series;
  if(span>62){ series=countBy(rows.filter(a=>a.fecha),a=>a.fecha.slice(0,7)).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,n])=>[`${MONTHS[+m.slice(5)-1].slice(0,3)} ${m.slice(2,4)}`,n]); }
  else { const wk=d=>{ const t=new Date(d+'T00:00:00Z'); const dow=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-dow); return t.toISOString().slice(0,10); };
    series=countBy(rows.filter(a=>a.fecha),a=>wk(a.fecha)).sort((a,b)=>a[0].localeCompare(b[0])).map(([w,n])=>[`${+w.slice(8)} ${MONTHS[+w.slice(5,7)-1].slice(0,3).toLowerCase()}`,n]); }
  const E=salScoped(R), socios=countBy(rows,a=>a.socio||'(sin dato)').map(([s,n])=>[s,n,new Set(rows.filter(a=>(a.socio||'(sin dato)')===s).map(a=>a.pkey)).size]);
  const dupRows=new Set(E.dup.flatMap(g=>g.rows.filter(a=>salPass(a,R))));
  return {R,rows,pers,series,weekly:span<=62,pyr,mujeres:pers.filter(a=>sex(a)==='Mujer').length,hombres:pers.filter(a=>sex(a)==='Hombre').length,sinSexo:pers.filter(a=>!sex(a)).length,
    fams:new Set(rows.map(a=>a.caso)).size, diag:countBy(rows,a=>a.diagnostico), lugar:countBy(rows,a=>a.municipio?`${a.municipio} (${a.estado||'sin estado'})`:null), parr:countBy(rows,a=>a.parroquia?`${a.parroquia} (${a.municipio||'sin municipio'})`:null), estatus:countBy(rows,a=>a.estatus||'Sin dato'),
    conducta:tok(rows,'conducta'), deriv:rows.filter(a=>/derivaci/i.test(a.tipo||'')).length, aloj:rows.filter(a=>fold(a.isAloj)==='si').length,
    nna:pers.filter(a=>a.age!=null&&a.age<18).length, conEdad:pers.filter(a=>a.age!=null).length, linked:rows.filter(a=>a.p).length, socios,
    tipos:tok(rows,'tipo'), orients:countBy(rows.flatMap(a=>[...(a.orient||'').split('; '),...(a.orientDoc||'').split('; ')].filter(Boolean)),x=>x), acciones:tok(rows,'acciones'),
    psi:rows.filter(a=>a.atType), atTypes:countBy(rows,a=>a.atType), motIng:tok(rows,'motIng'), estAcomp:countBy(rows.filter(a=>a.atType),a=>a.estAcomp||'Sin dato'),
    kEcho:rows.reduce((t,a)=>t+(a.kitEcho||0),0), kUs:rows.reduce((t,a)=>t+(a.kitUs||0),0), kDhr:rows.reduce((t,a)=>t+(a.kitDhr||0),0),
    kits:rows.reduce((t,a)=>t+(a.kitEcho||0)+(a.kitUs||0)+(a.kitDhr||0),0), kitAt:rows.filter(a=>((a.kitEcho||0)+(a.kitUs||0)+(a.kitDhr||0))>0).length,
    motIngT:tok(rows,'motIng'), motivo:tok(rows,'motivo'), psico:countBy(rows,a=>a.psico||'Sin dato'),
    sesiones:(()=>{ const c=[['1.ª sesión',0],['2.ª sesión',0],['3.ª sesión',0],['4.ª sesión o más',0],['Sin número de sesión',0]]; rows.forEach(a=>{ const v=a.sesion; c[v==null?4:Math.min(v,4)-1][1]++; }); return c.filter(x=>x[1]); })(),
    primera:rows.filter(a=>a.sesion===1).length, conSesion:rows.filter(a=>a.sesion!=null).length,
    q:{dup:dupRows.size,socio:E.socio.length,sinVinculo:E.noCase.length+E.noPerson.length,other:new Set(E.other.filter(x=>salPass(x.a,R)).map(x=>x.a)).size}};
}
function salRepFilterText(R){ const parts=[], sel=k=>R.cats[k]&&R.cats[k].size?[...R.cats[k]]:null;
  const s=sel('socio'); parts.push(s?`Socio: ${s.join(', ')}`:'Todos los socios implementadores');
  S.sal.cfg.cats.slice(1).forEach(([k,l])=>{ const v=sel(k); if(v) parts.push(`${l}: ${v.join(', ')}`); }); return parts; }
async function salPdf(ext){
  if(!window.jspdf||!window.jspdf.jsPDF){ toast('No se pudo cargar el generador de PDF. Revisa la conexión y recarga la página.'); return; }
  const X=salRepData(), R=X.R; if(!X.rows.length){ if(!ext) toast('No hay atenciones con los criterios seleccionados.'); return; }
  const doc=ext?ext.doc:new window.jspdf.jsPDF({unit:'mm',format:'a4'}), W=210, M=14, CW=W-2*M; if(ext) doc.addPage();
  const C={blue:[0,51,160],blue2:[65,143,222],pale:[231,238,249],ink:[34,43,69],grey:[107,114,128],line:[217,223,234],amber:[226,149,0],white:[255,255,255]};
  const fill=c=>doc.setFillColor(...c), stroke=c=>doc.setDrawColor(...c), color=c=>doc.setTextColor(...c);
  const T=(s,x,y,o={})=>{ doc.setFont('helvetica',o.bold?'bold':'normal'); doc.setFontSize(o.size||8); color(o.c||C.ink); doc.text(String(s),x,y,{align:o.align||'left',maxWidth:o.maxW}); };
  const fit=(s,w,size,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(size); s=String(s); if(doc.getTextWidth(s)<=w) return s; while(s.length>1&&doc.getTextWidth(s+'…')>w) s=s.slice(0,-1); return s+'…'; };
  const N=n=>Number(n).toLocaleString('es-VE');
  const section=(t,x,y)=>{ T(t,x,y,{size:9.5,bold:true,c:C.blue}); stroke(C.blue2); doc.setLineWidth(0.5); doc.line(x,y+1.6,x+12,y+1.6); return y+6; };
  const PG={top:20,bottom:277};
  const newPage=()=>{ doc.addPage(); fill(C.blue); doc.rect(0,0,W,11,'F'); fill(C.blue2); doc.rect(0,11,W,0.8,'F'); T(fit(R.title||'',CW,9,true),M,7.2,{size:9,bold:true,c:C.white}); return PG.top; };
  const need=(y,h)=>y+h>PG.bottom?newPage():y;
  const notes=y=>{ if(!(R.notes&&R.notes.trim())) return y; y=need(y,16); y=section('Observaciones',M,y,CW); doc.setFontSize(7.6);
    for(const ln of doc.splitTextToSize(R.notes.trim(),CW)){ if(y+3.4>PG.bottom) y=newPage(); T(ln,M,y+1,{size:7.6}); y+=3.4; } return y; };
  const footer=src=>{ const n=doc.getNumberOfPages(); for(let i=1;i<=n;i++){ doc.setPage(i); stroke(C.line); doc.setLineWidth(0.3); doc.line(M,283,W-M,283);
    T(src,M,287.5,{size:6.3,c:C.grey,maxW:CW-30}); T(`Página ${i} de ${n}`,W-M,287.5,{size:6.3,c:C.grey,align:'right'}); } };
  const bars=(items,x,y,w,o={})=>{ const rowH=o.rowH||6, lw=o.lw||w*0.44, vw=o.total?28:16, bw=w-lw-vw-2, max=Math.max(1,...items.map(i=>i[1]));
    items.forEach(([l,v],i)=>{ const yy=y+i*rowH; { const L=String(l); doc.setFont('helvetica','normal'); doc.setFontSize(7.2); if(doc.getTextWidth(L)<=lw-2) T(L,x,yy+3.4,{size:7.2}); else { const fs=rowH>=5.6?6.2:5.8; doc.setFontSize(fs); let ls=doc.splitTextToSize(L,lw-2); if(ls.length>2) ls=[ls[0],fit(ls.slice(1).join(' '),lw-2,fs)]; const lh=fs*0.406; T(ls.join('\n'),x,yy+(rowH-lh*ls.length)/2+fs*0.3528*0.8+0.3,{size:fs}); } } fill(C.pale); doc.rect(x+lw,yy+0.8,bw,3.6,'F'); if(v>0){ fill(o.c||C.blue); doc.rect(x+lw,yy+0.8,Math.max(0.6,bw*v/max),3.6,'F'); }
      T(N(v),x+w-(o.total?13:0),yy+3.4,{size:7.2,bold:true,align:'right'}); if(o.total) T(pct(v,o.total),x+w,yy+3.4,{size:6.8,c:C.grey,align:'right'}); }); return y+items.length*rowH; };
  // Encabezado
  fill(C.blue); doc.rect(0,0,W,30,'F'); fill(C.blue2); doc.rect(0,30,W,1.4,'F');
  let tx=M;
  if(R.logo){ try{ const h=16, w=Math.min(40,h*R.logo.w/R.logo.h); fill(C.white); doc.roundedRect(M,7,w+4,h+4,1.5,1.5,'F'); doc.addImage(R.logo.data,R.logo.fmt,M+2,9,w,h); tx=M+w+9; }catch(e){ console.warn(e); } }
  const MH=S.sal.cfg.id==='mental', PR=S.sal.cfg.id==='proteccion', PS=S.sal.cfg.id==='psicosocial';
  T(fit(R.title||S.sal.cfg.title,W-M-tx-58,15,true),tx,14,{size:15,bold:true,c:C.white});
  T(S.sal.cfg.sub,tx,20.5,{size:8.5,c:[214,226,248]});
  T('PERIODO',W-M,11.5,{size:6.5,bold:true,c:[180,200,240],align:'right'}); T(R.from&&R.to?`${dmy(R.from)} – ${dmy(R.to)}`:'Todo el periodo',W-M,16.5,{size:9,bold:true,c:C.white,align:'right'});
  T(`Emitido el ${dmy(TODAY_YMD)}`,W-M,21.5,{size:7,c:[214,226,248],align:'right'});
  doc.setFontSize(7.2); const ftl=doc.splitTextToSize(salRepFilterText(R).join('  ·  '),CW); T(ftl[0]+(ftl.length>1?' …':''),M,38,{size:7.2,c:C.grey});
  // Indicadores
  let y=42; const kw=(CW-9)/4;
  [[N(X.rows.length),S.sal.cfg.srcName],[N(X.pers.length),'personas atendidas'],[N(X.fams),'familias atendidas'],PR?[N(X.kits),`kits de dignidad entregados (${N(X.kitAt)} atenciones)`]:[(X.rows.length/Math.max(1,X.pers.length)).toLocaleString('es-VE',{minimumFractionDigits:1,maximumFractionDigits:1}),'atenciones por persona en promedio']]
    .forEach(([v,l],i)=>{ const x=M+i*(kw+3); fill(C.pale); doc.roundedRect(x,y,kw,21,1.5,1.5,'F'); fill(C.blue); doc.rect(x,y,1.2,21,'F');
      T(v,x+5,y+10,{size:17,bold:true,c:C.blue}); doc.setFontSize(7); T(doc.splitTextToSize(l,kw-8).slice(0,2).join('\n'),x+5,y+15.2,{size:7,c:C.grey}); });
  { const sc=stateCounter(); X.rows.forEach(a=>sc.add(a.estado,a.p||('u:'+a.pkey)));
    pdfMapBlock(doc,{x:M,y:71,w:CW,h:160,vals:sc.vals(),unit:'personas',title:'Personas atendidas por estado donde se brindó la asistencia',unknown:sc.unknown()}); }
  const LX=M, RX=M+CW/2+4, HW=CW/2-4; y=newPage();
  // Izquierda: serie temporal
  let yl=section(X.weekly?'Atenciones por semana':'Atenciones por mes',LX,y);
  { const s=X.series.slice(-14), h=30, base=yl+h, max=Math.max(1,...s.map(x=>x[1])), bw=HW/Math.max(1,s.length);
    stroke(C.line); doc.setLineWidth(0.2); doc.line(LX,base,LX+HW,base);
    s.forEach(([l,v],i)=>{ const bh=Math.max(0.4,(h-6)*v/max), x=LX+i*bw+bw*0.15, w=bw*0.7; fill(C.blue); doc.rect(x,base-bh,w,bh,'F');
      T(N(v),x+w/2,base-bh-1,{size:6.2,bold:true,align:'center'}); T(fit(l,bw+1,5.8),x+w/2,base+3.2,{size:5.8,c:C.grey,align:'center'}); });
    yl=base+9; }
  yl=section(PS?'Tipos de atención':PR?'Tipos de asistencia':MH?'Motivos o problemáticas más frecuentes':'Diagnósticos más frecuentes',LX,yl);
  yl=bars((PS||PR?X.tipos:MH?X.motivo:X.diag).slice(0,8),LX,yl,HW,{lw:HW*0.52,c:C.blue2,total:X.rows.length});
  // Derecha: pirámide
  let yr=section('Personas atendidas por sexo y edad',RX,y);
  { const cx=RX+HW/2, gap=8, half=HW/2-gap-9, pmax=Math.max(1,...X.pyr.flatMap(r=>[r.m,r.h]));
    T('Mujeres',cx-gap,yr+1,{size:7,bold:true,c:C.blue2,align:'right'}); T('Hombres',cx+gap,yr+1,{size:7,bold:true,c:C.blue}); yr+=3.5;
    X.pyr.slice().reverse().forEach((r,i)=>{ const yy=yr+i*6; T(r.l,cx,yy+3.5,{size:7,align:'center',c:C.grey}); const wm=half*r.m/pmax, wh=half*r.h/pmax;
      fill(C.blue2); doc.rect(cx-gap-wm,yy+0.9,Math.max(0.5,wm),4.2,'F'); fill(C.blue); doc.rect(cx+gap,yy+0.9,Math.max(0.5,wh),4.2,'F');
      T(N(r.m),cx-gap-wm-1.2,yy+3.9,{size:6.8,align:'right'}); T(N(r.h),cx+gap+wh+1.2,yy+3.9,{size:6.8}); });
    yr+=AGE_GROUPS.length*6+2;
    T(`Mujeres ${pct(X.mujeres,X.pers.length)}  ·  Hombres ${pct(X.hombres,X.pers.length)}  ·  Sin datos en el Registro ${pct(X.sinSexo,X.pers.length)}`,RX,yr+1.5,{size:6.6,c:C.grey}); yr+=9; }
  const useParr=X.lugar.length<2;
  yr=section(useParr?'Parroquias de atención (municipio)':'Municipios de atención (estado)',RX,yr);
  yr=bars((useParr?X.parr:X.lugar).slice(0,5),RX,yr,HW,{lw:HW*0.5,total:X.rows.length})+6;
  if(PR){ yr=section('Orientaciones brindadas',RX,yr); if(X.orients.length) yr=bars(X.orients.slice(0,6),RX,yr,HW,{lw:HW*0.56,c:C.blue2,total:X.rows.length}); else { T('Sin orientaciones registradas en el periodo.',RX,yr+3,{size:7.2,c:C.grey}); yr+=6; }
    yr+=6; yr=section('Kits de dignidad por proyecto',RX,yr); yr=bars([['DHR',X.kDhr+X.kUs],['ECHO',X.kEcho]].sort((x,y)=>y[1]-x[1]),RX,yr,HW,{c:C.blue,total:Math.max(1,X.kits)}); }
  else if(PS){ yr=section('Motivos de ingreso',RX,yr); yr=bars(X.motIngT.slice(0,6),RX,yr,HW,{lw:HW*0.56,c:C.blue2,total:X.rows.length}); }
  else if(MH){ yr=section('Tipo de atención psicosocial',RX,yr); yr=bars(X.psico.slice(0,7),RX,yr,HW,{lw:HW*0.52,c:C.blue2,total:X.rows.length}); }
  else { yr=section('Diagnóstico confirmado o presuntivo',RX,yr);
  { const ST=X.estatus, tot=ST.reduce((t,a)=>t+a[1],0)||1, pal=[C.blue,C.blue2,[150,185,235],[200,208,222],[230,233,240],[110,130,170]]; let xx=RX;
    ST.forEach(([l,v],i)=>{ const w=HW*v/tot; fill(pal[i%pal.length]); doc.rect(xx,yr,w,5,'F'); xx+=w; });
    yr+=8.5; let lx=RX; ST.forEach(([l,v],i)=>{ const s=`${l} ${pct(v,tot)}`; doc.setFontSize(6.8); const w=doc.getTextWidth(s)+7; if(lx+w>RX+HW){ lx=RX; yr+=4.2; } fill(pal[i%pal.length]); doc.rect(lx,yr-2.3,2.6,2.6,'F'); T(s,lx+3.6,yr,{size:6.8,c:C.grey}); lx+=w; }); yr+=4; } }
  // Franja complementaria
  y=need(Math.max(yl,yr)+5,21);
  const strip=[[pct(X.aloj,X.rows.length),'de las atenciones se dieron a personas en alojamientos'],(MH||PS)?[pct(X.primera,X.conSesion),'de las atenciones con sesión registrada fueron primeras sesiones']:[pct(X.deriv,X.rows.length),'de las atenciones incluyeron una derivación'],[pct(X.nna,X.conEdad),'de las personas atendidas tienen menos de 18 años'],[pct(X.linked,X.rows.length),'de las atenciones están vinculadas al Registro de Familias']];
  stroke(C.line); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); doc.line(M,y+15,W-M,y+15);
  strip.forEach(([v,l],i)=>{ const x=M+i*(CW/4); T(v,x+2,y+6.5,{size:11,bold:true,c:C.blue}); doc.setFontSize(6.6); T(doc.splitTextToSize(l,CW/4-6).slice(0,2).join('\n'),x+2,y+10.3,{size:6.6,c:C.grey}); });
  y+=21;
  // Socios y calidad
  y=need(y,Math.max(8.5+Math.min(5,X.socios.length)*5.4,37));
  let ye=section('Por socio implementador',LX,y);
  T('Socio',LX,ye+1,{size:6.8,bold:true,c:C.grey}); T('Atenciones',LX+HW-20,ye+1,{size:6.8,bold:true,c:C.grey,align:'right'}); T('Personas',LX+HW,ye+1,{size:6.8,bold:true,c:C.grey,align:'right'});
  ye+=2.5; X.socios.slice(0,5).forEach(([o,n,p],i)=>{ const yy=ye+i*5.4; if(i%2===0){ fill([245,247,251]); doc.rect(LX,yy,HW,5.4,'F'); }
    T(fit(o,HW-46,7.2),LX+1.5,yy+3.7,{size:7.2}); T(N(n),LX+HW-20,yy+3.7,{size:7.2,bold:true,align:'right'}); T(N(p),LX+HW-1.5,yy+3.7,{size:7.2,bold:true,align:'right'}); });
  ye+=Math.min(5,X.socios.length)*5.4;
  let yq=section('Calidad de los datos',RX,y);
  const qh=31;
  fill([253,246,232]); doc.roundedRect(RX,yq-1,HW,qh,1.5,1.5,'F'); fill(C.amber); doc.rect(RX,yq-1,1.2,qh,'F');
  T(N(X.q.dup),RX+5,yq+7,{size:16,bold:true,c:[150,95,0]});
  doc.setFontSize(7); T(doc.splitTextToSize(`atenciones duplicadas o posiblemente duplicadas (${pct(X.q.dup,X.rows.length)} del total)`,HW-30).join('\n'),RX+28,yq+3.6,{size:7});
  [['Atenciones con socio implementador no válido',X.q.socio],['Atenciones sin vínculo con el Registro de Familias',X.q.sinVinculo],[S.sal.cfg.qualityLabel||(MH?'Atenciones con datos incompletos o sesión no válida':'Atenciones sin diagnóstico'),X.q.other]]
    .forEach(([l,v],i)=>{ const yy=yq+14.5+i*4.6; T(fit(l,HW-22,6.8),RX+5,yy,{size:6.8,c:C.grey}); T(N(v),RX+HW-3,yy,{size:6.8,bold:true,align:'right'}); });
  yq+=qh;
  y=Math.max(ye,yq)+8;
  { const items=PR?X.acciones.slice(0,5):(MH||PS)?X.sesiones:X.conducta.slice(0,4);
    if(items.length){ y=need(y,8+items.length*6); y=section(PR?'Acciones realizadas':(MH||PS)?'Atenciones por número de sesión':'Conducta indicada',LX,y); y=bars(items,LX,y,PR?CW:HW,{lw:PR?CW*0.5:undefined,c:C.blue2,total:X.rows.length})+5; } }
  if(PR&&X.psi.length){ const nL=Math.min(6,X.atTypes.length), nR=Math.min(5,X.motIng.length);
    y=need(y,14+Math.max(nL,nR)*6+12); y=section('Atención psicosocial',M,y)+1;
    T('Tipo de atención',LX,y+1,{size:7,bold:true,c:C.grey}); T('Motivo de ingreso',RX,y+1,{size:7,bold:true,c:C.grey}); y+=3;
    const yA=bars(X.atTypes.slice(0,6),LX,y,HW,{lw:HW*0.5,c:C.blue2,total:X.psi.length}), yB=nR?bars(X.motIng.slice(0,5),RX,y,HW,{lw:HW*0.56,c:C.blue2,total:X.psi.length}):y;
    y=Math.max(yA,yB)+3; const cierre=X.psi.filter(a=>fold(a.cierre)==='si').length;
    doc.setFontSize(6.8); const txt=`${N(X.psi.length)} atenciones psicosociales  ·  ${pct(cierre,X.psi.length)} fueron sesiones de cierre  ·  Estado del acompañamiento: ${X.estAcomp.map(([l,v])=>`${l} ${pct(v,X.psi.length)}`).join(', ')}`;
    const ls=doc.splitTextToSize(txt,CW); T(ls.join('\n'),M,y+1,{size:6.8,c:C.grey}); y+=ls.length*3.2+5; }
  notes(y);
  if(ext) return true;
  footer(`Fuente: IMS, ${S.sal.cfg.srcName} (${S.sal.file}) y Registro de Familias (${S.registro.file}). Sexo y edad según el Registro; edad a la fecha de la atención.`);
  await saveFile(`Informe_${S.sal.cfg.file}${R.from&&R.to?`_${R.from}_a_${R.to}`:''}.pdf`,doc.output('blob'));
}
function salRepFacts(X){ return `<div><b>${fmt(X.rows.length)}</b><span>Atenciones</span></div><div><b>${fmt(X.pers.length)}</b><span>Personas atendidas</span></div><div><b>${fmt(X.fams)}</b><span>Familias atendidas</span></div><div class="${X.q.dup?'warn':'ok'}"><b>${fmt(X.q.dup)}</b><span>Atenciones posiblemente duplicadas</span></div>`; }
function salViewReport(){
  const A=S.sal, R=salRepInit(), X=salRepData();
  return `<h1>Construir informe</h1>
  <p class="lead">Genera un PDF de una página con el análisis de las ${esc(A.cfg.srcName)} para el periodo, los socios y la ubicación que elijas.</p>
  <div class="facts" id="sRepFacts">${salRepFacts(X)}</div>
  <div class="grid2">
    <div><h2 style="margin-top:0">Periodo</h2><div class="panel">${periodPanel('sr',A.minDate,A.maxDate,R,A.rows.map(a=>a.fecha),'srrange','')}</div>
      <h2>Socio, ubicación y tipo de atención</h2>${A.cfg.cats.map(([k,l])=>catBlock('sr',k,l,A.rows,R.cats[k],'atenciones')).join('')}</div>
    <div><h2 style="margin-top:0">Contenido</h2><div class="panel">
      <div class="field" style="margin-bottom:12px"><label for="rTitle">Título del informe</label><input class="in" id="rTitle" style="width:100%" maxlength="70" value="${esc(R.title)}"></div>
      <div class="field" style="margin-bottom:12px"><label for="rNotes">Observaciones (opcional)</label><textarea class="in" id="rNotes" rows="4" style="width:100%;resize:vertical" maxlength="600" placeholder="Contexto, logros o limitaciones que deban acompañar las cifras.">${esc(R.notes)}</textarea></div>
      <div class="field"><label>Logo (opcional)</label><div class="row">${R.logo?`<img src="${R.logo.data}" alt="Logo cargado" style="height:36px;max-width:120px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px;padding:3px"><button class="btn sm" type="button" id="rLogoDel">Quitar logo</button>`:''}
        <label class="btn sm"><input type="file" id="rLogo" accept="image/png,image/jpeg" hidden>${R.logo?'Cambiar logo':'Cargar logo PNG o JPG'}</label></div></div>
    </div></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="rBack">Volver a exportar</button><button class="btn primary" type="button" id="rPdf">Descargar PDF</button></div>`;
}
function salReattachComp(){ const C=S.salComp; if(!C||!S.sal||!S.sal.rows||!S.registro) return; const o=salLoad(C.wb,C.name,S.registro,C.type); if(o.rows) salAttachComp(S.sal,o.rows,C.name); }
async function loadCompFile(f){
  busy(true); await nextFrame();
  try{ const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}), want=S.sal.cfg.companion, det=detectForm(wb);
    if(det!==want){ toast(`Ese archivo no parece ser de ${mmLabel(want)}.`); return; }
    S.salComp={wb,name:f.name,type:want}; salReattachComp(); if(!S.sal.rows) toast('Se usará cuando cargues el Registro de Familias.'); render();
  }catch(e){ console.error(e); toast('No se pudo leer el archivo: '+(e.message||e)); } finally{ busy(false); }
}
async function loadRegistroFile(f){
  busy(true); await nextFrame();
  try{ const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
    if(!famDetect(wb)){ toast('Ese archivo no es un Registro de Familias (faltan las pestañas vzl_cases y beneficiaries_vzl).'); return; }
    const D=famLoad(wb,f.name); if(D.fatal.length){ toast('Al Registro le faltan columnas: '+D.fatal.join(', ')); return; }
    S.registro=D; S.sal=salLoad(S.salWb.wb,S.salWb.name,D,S.salWb.type); salReattachComp(); render();
  }catch(e){ console.error(e); toast('No se pudo leer el Registro: '+(e.message||e)); } finally{ busy(false); }
}
function salBind(){
  const on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  const restart=()=>{ S.mode=null; S.sal=null; S.step=1; render(); };
  if(S.step===2){
    const d=$('#regDrop'); if(d){ d.onclick=()=>$('#regIn').click(); d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#regIn').click(); } };
      d.ondragover=e=>{ e.preventDefault(); d.classList.add('over'); }; d.ondragleave=()=>d.classList.remove('over'); d.ondrop=e=>{ e.preventDefault(); d.classList.remove('over'); if(e.dataTransfer.files[0]) loadRegistroFile(e.dataTransfer.files[0]); }; }
    on('#regIn','change',e=>{ if(e.target.files[0]) loadRegistroFile(e.target.files[0]); e.target.value=''; });
    document.querySelectorAll('[data-valid]').forEach(b=>b.onchange=()=>{ const A=S.sal, k=b.dataset.valid; if(b.checked) A.valid.add(k); else A.valid.delete(k); A.err=salAnalyze(A); });
    const setAllValid=on=>{ const A=S.sal; document.querySelectorAll('[data-valid]').forEach(b=>{ b.checked=on; if(on) A.valid.add(b.dataset.valid); else A.valid.delete(b.dataset.valid); }); A.err=salAnalyze(A); };
    on('#validAll','click',()=>setAllValid(true)); on('#validNone','click',()=>setAllValid(false));
    { const d2=$('#compDrop'); if(d2){ d2.onclick=()=>$('#compIn').click(); d2.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#compIn').click(); } };
      d2.ondragover=e=>{ e.preventDefault(); d2.classList.add('over'); }; d2.ondragleave=()=>d2.classList.remove('over'); d2.ondrop=e=>{ e.preventDefault(); d2.classList.remove('over'); if(e.dataTransfer.files[0]) loadCompFile(e.dataTransfer.files[0]); }; } }
    on('#compIn','change',e=>{ if(e.target.files[0]) loadCompFile(e.target.files[0]); e.target.value=''; });
    if($('#minValid')){ mountPickers(new Set(S.sal.rows.map(a=>a.fecha).filter(Boolean))); $('#minValid').addEventListener('change',e=>{ const A=S.sal; A.minValid=e.target.value; dateRange(A); A.filters.from=A.minDate; A.filters.to=A.maxDate; A.err=salAnalyze(A); A.rep=null; render(); }); }
    on('#back','click',restart);
    on('#next','click',async()=>{ const A=S.sal, cmp=A.cfg.companion;
      if(cmp&&!A.comp){ const ok=await confirmBox('¿Continuar sin el formulario complementario?',`Para depurar este archivo se recomienda cargar también el formulario de ${mmLabel(cmp)}, para identificar las atenciones registradas en ambos. ¿Deseas continuar sin cargarlo?`,'Continuar sin cargarlo'); if(!ok) return; }
      S.step=3; render(); });
  }
  if(S.step===3){
    const F=S.sal.filters, upd=()=>{ $('#sN').textContent=fmt(salPbiTable().data.length); $('#salSum').innerHTML=salSumRows(salSummary()); };
    bindPeriod('s',F,S.sal.rows.map(a=>a.fecha),'srange',upd); bindCats('s',F.cats,upd);
    on('#back','click',()=>{ S.step=2; render(); }); on('#next','click',()=>{ S.step=4; render(); });
  }
  if(S.step===4&&S.sal.view==='report'){
    const R=salRepInit(), upd=()=>{ $('#sRepFacts').innerHTML=salRepFacts(salRepData()); };
    bindPeriod('sr',R,S.sal.rows.map(a=>a.fecha),'srrange',upd); bindCats('sr',R.cats,upd);
    on('#rTitle','input',e=>{ R.title=e.target.value; }); on('#rNotes','input',e=>{ R.notes=e.target.value; });
    on('#rLogo','change',e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>1.5e6){ toast('El logo supera 1,5 MB. Usa una imagen más liviana.'); return; }
      const rd=new FileReader(); rd.onload=()=>{ const img=new Image(); img.onload=()=>{ R.logo={data:rd.result,fmt:/png/i.test(f.type)?'PNG':'JPEG',w:img.naturalWidth,h:img.naturalHeight}; try{ localStorage.setItem(LOGO_KEY,JSON.stringify(R.logo)); }catch(err){} render(); }; img.src=rd.result; }; rd.readAsDataURL(f); });
    on('#rLogoDel','click',()=>{ R.logo=null; try{ localStorage.removeItem(LOGO_KEY); }catch(e){} render(); });
    on('#rBack','click',()=>{ S.sal.view=null; render(); });
    on('#rPdf','click',async()=>{ busy(true); await nextFrame(); try{ await salPdf(); }catch(e){ console.error(e); toast('Error al generar el PDF: '+(e.message||e)); } busy(false); });
    return;
  }
  if(S.step===4){
    const run=fn=>async()=>{ busy(true); await nextFrame(); try{ await fn(); }catch(e){ console.error(e); toast('Error al exportar: '+(e.message||e)); } busy(false); };
    on('#exErr','click',run(salExportErrors)); on('#exPbi','click',run(()=>salExportPbi('xlsx'))); on('#exCsv','click',run(()=>salExportPbi('csv')));
    on('#exRep','click',()=>{ S.sal.view='report'; render(); });
    on('#back','click',()=>{ S.step=3; render(); }); on('#restart','click',restart);
  }
}
const SAL_MODULE={id:'salud',name:'Atenciones en salud',views:[null,null,salViewVerify,salViewReview,salViewExport],bind:salBind};

