/* Herramientas M&E · Reportes: Matriz de monitoreo (IMS, Kobo y Excel) */
const MMAT = {
  source: 'ims', // 'ims' | 'kobo' | 'excel'
  file: null,
  wb: null,
  imsType: '',   // 'nfi' | 'wash' | 'salud' | 'mental' | 'proteccion' | 'psicosocial' | 'comunitarias'
  imsDet: '',    // tipo detectado automáticamente
  imsObj: null,  // objeto cargado (nfi/wash/sal/com)
  imsSector: '', // sector configurable para salud/mental/proteccion/psicosocial
  imsProjCol: null, // { label, nonEmpty, total, samples } si el Excel IMS tiene columna de proyecto con datos
  imsUseProjCol: false, // null = pendiente de respuesta, true = extraer de columna, false = otro criterio
  imsScope: null, // null = pendiente de respuesta, 'general' = General (100%), 'echo25' = ECHO Alert (25%)
  imsRegFilter: null, // null = pendiente (solo para registro), 'all' = Toda la data, 'alojamientos' = Solo alojamientos
  nfi: null,
  raw: null,     // { headers, selectHeaders, rows, sheet, linkedInfo, sig } para Kobo / Excel
  map: {},       // mapeo de columnas para Kobo / Excel
  manual: {},    // valores manuales fijos por campo cuando se elige '__manual__'
  xlsform: null, // perfil del XLSForm cargado en la sesión actual (sin guardar en memoria)
  koboReady: false, // true cuando el usuario hace clic en Avanzar en Kobo
  excelReady: false, // true cuando el usuario completa los datos faltantes y avanza en Excel
  excelCountMode: '', // 'bands' | 'col' | 'row' | 'fixed'
  excelFixedCount: 1,
  excelAgeRand: false,
  excelAgeMin: 0,
  excelAgeMax: 74,
  excelSexMode: '', // '' | 'random' | 'equal' | 'all_f' | 'all_m' | 'maj_f' | 'maj_m'
  excelGeo: { estado:'', mun:'', parr:'', com:'', comCustom:'' },
  defProj: '',
  defProjOtro: '',
  defSector: 'NFI',
  validSocios: new Set(),
  socioList: [],
  from: '',
  to: '',
  minDate: '',
  maxDate: ''
};

const IMS_FORM_OPTS = [
  ['registro','Registro de Familias'],
  ['nfi','Entrega de kits NFI'],
  ['wash','Entrega de kits y servicios WASH'],
  ['salud','Atenciones en salud'],
  ['mental','Atenciones en salud mental'],
  ['proteccion','Atenciones en protección'],
  ['psicosocial','Atenciones psicosociales (Protección)'],
  ['comunitarias','Actividades comunitarias']
];
const IMS_DEF_SECTOR = { registro:'Alojamiento', salud:'Salud', mental:'SMAPS', proteccion:'Protección', psicosocial:'Protección' };
const IMS_REG_ALOJ_GEO = [
  { nombre: 'Estadio César Nieves', estado: 'La Guaira', mun: 'Vargas', parr: 'Catia la Mar' },
  { nombre: 'Polideportivo José María Vargas', estado: 'La Guaira', mun: 'Vargas', parr: 'Carlos Soublette' },
  { nombre: 'Estadio Playa Grande', estado: 'La Guaira', mun: 'Vargas', parr: 'Urimare' },
  { nombre: 'Campo de golf', estado: 'La Guaira', mun: 'Vargas', parr: 'Caraballeda' },
  { nombre: 'Mare Abajo', estado: 'La Guaira', mun: 'Vargas', parr: 'Carlos Soublette' }
];
const IMS_REG_ALOJAMIENTOS = IMS_REG_ALOJ_GEO.map(x => x.nombre);
const mmGetAlojGeo = raw => {
  const f = fold(raw || '');
  return f ? (IMS_REG_ALOJ_GEO.find(x => fold(x.nombre) === f) || null) : null;
};
const mmIsAllowedAloj = raw => !!mmGetAlojGeo(raw);
const mmMapProjName = raw => {
  const f = fold(raw || '');
  if(!f) return '';
  if(/echo/.test(f)) return 'ECHO ALERT';
  if(/\b(dhr|us)\b/.test(f)) return 'DHR Emergencia';
  return raw;
};

const MMAT_SOURCES = [
  { id:'ims', name:'IMS', tag:'Plataforma institucional', icon:'<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="3"/>', desc:'Descargas de Excel del IMS (Entrega de kits NFI vinculado con el Registro de Familias).' },
  { id:'kobo', name:'Kobo', tag:'KoboToolbox', icon:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h5M8 17h3"/>', desc:'Exportaciones de formularios de KoboToolbox en Excel o CSV.' },
  { id:'excel', name:'EXCEL', tag:'Hoja personalizada', icon:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13l4 4m0-4l-4 4"/>', desc:'Archivos Excel o CSV con desagregación o listado de asistencias.' }
];

const MMAT_FIELDS = [
  { k:'fecha', l:'Fecha', aliases:['fecha','fecha de asistencia','fecha de entrega','assistance_date','date','submission_time'], exclude:['nacimiento'] },
  { k:'proyecto', l:'Proyecto', aliases:['proyecto','project','donante','programa'] },
  { k:'socio', l:'Socio implementador', aliases:['socio','socio implementador','implementing_partner','organizacion','partner'] },
  { k:'estado', l:'Estado', aliases:['estado','states','entidad federal','state'], exclude:['estado civil','embarazo','lactancia'] },
  { k:'municipio', l:'Municipio', aliases:['municipio','municipalities','municipality'] },
  { k:'parroquia', l:'Parroquia', aliases:['parroquia','parishes','parish'] },
  { k:'comunidad', l:'Comunidad', aliases:['comunidad','communities','community','sector o comunidad'], exclude:['actividad comunitaria'] },
  { k:'sector', l:'Sector', aliases:['sector','area','tipo de kit','tipo'] },
  { k:'caso', l:'Código de familia / caso (para recurrentes)', aliases:['codigo de caso','codigo de familia','case_code','id familia','familia'] },
  { k:'nombres', l:'Nombres (para inferir sexo si falta)', aliases:['nombres','nombre y apellido','nombre completo','nombre','primer nombre'] },
  { k:'total_personas', l:'Total personas / asistencias (si agrupa varias)', aliases:['total personas','total asistencias','asistencias','cantidad de personas','personas','participantes','beneficiarios'] },
  { k:'indig', l:'Población indígena', aliases:['poblacion indigena','numero de poblacion indigena','indigena','etnia','pueblo indigena'] },
  { k:'disc', l:'Personas con discapacidad', aliases:['personas con discapacidad','numero de personas con discapacidad','discapacidad'] },
  { k:'preg', l:'Embarazadas o en lactancia', aliases:['embarazadas','embarazadas o en lactancia','numero de personas embarazadas o en lactancia','lactante'] },
  { k:'sexo', l:'Sexo (si es 1 fila por persona)', aliases:['sexo','sex','genero'], exclude:['orientacion'] },
  { k:'edad', l:'Edad (si es 1 fila por persona)', aliases:['edad','age','edad en anos'] },
  { k:'kits', l:'Total kits', aliases:['total kits','kits','cantidad de kits','cantidad'] }
];

const mmAutoMap = headers => {
  const map = {};
  MMAT_FIELDS.forEach(f => {
    const pool = headers.filter(h => {
      if(!f.exclude || !f.exclude.length) return true;
      const fh = fold(h);
      return !f.exclude.some(ex => fh.includes(fold(ex)));
    });
    let hit = '';
    for(const a of f.aliases){
      const fa = fold(a);
      hit = pool.find(h => fold(h) === fa);
      if(hit) break;
    }
    if(!hit){
      for(const a of f.aliases){
        const fa = fold(a);
        hit = pool.find(h => fold(h).includes(fa));
        if(hit) break;
      }
    }
    map[f.k] = hit || '';
  });
  map.bands = MAT_BANDS.flatMap(([fl, ml]) => [fl, ml]).map(lbl => {
    const hit = headers.find(h => fold(h) === fold(lbl));
    return { lbl, col: hit || '' };
  });
  return map;
};

function mmParseRaw(wb, fileName){
  let sheet = wb.SheetNames[0], max = -1;
  for(const n of wb.SheetNames){
    const ref = wb.Sheets[n]['!ref']; if(!ref) continue;
    const r = XLSX.utils.decode_range(ref);
    if(r.e.r - r.s.r + 1 > max){ max = r.e.r - r.s.r + 1; sheet = n; }
  }
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header:1, defval:null, raw:true, blankrows:false });
  if(!aoa.length) throw new Error('El archivo está vacío.');
  const hIdx = detectHeaderRow(aoa);
  const seen = {};
  const headers = (aoa[hIdx] || []).map((c, i) => {
    let n = toText(c) || `Columna ${i+1}`;
    if(seen[n]){ seen[n]++; n = `${n} (${seen[n]})`; } else seen[n] = 1;
    return n;
  });
  const rows = [];
  for(let i = hIdx + 1; i < aoa.length; i++){
    const r = aoa[i]; if(!r || r.every(c => c == null || String(c).trim() === '')) continue;
    const o = { _row: i + 1 };
    headers.forEach((hd, ci) => { o[hd] = r[ci] ?? null; });
    rows.push(o);
  }
  if(!rows.length) throw new Error('El archivo está vacío o no contiene filas de datos.');
  return { name: fileName, sheet, headers, selectHeaders: headers, rows, linkedInfo: null, sig: '' };
}

const KOBO_PREFS_KEY = 'herramientas_me_kobo_prefs_v1';
const KOBO_META_EXACT = new Set([
  'start','end','today','deviceid','username','simserial','subscriberid','phonenumber','audit','logo','mindate','maxdate','0',
  'instanceid','formhub/uuid','meta/instanceid','meta/rootuuid','_submission_meta/rootuuid',
  '_id','_uuid','_submission_time','_validation_status','_notes','_status','_submitted_by','__version__','_tags',
  '_index','repeat_pstion','_parent_table_name','_parent_index',
  '_submission__id','_submission__uuid','_submission__submission_time','_submission__validation_status',
  '_submission__notes','_submission__status','_submission__submitted_by','_submission__tags',
  'c_o','c1','c3','c8','c9','cl1','cl2','cl3','lms_table','len_low','len_high',
  'l0','m0','s0','l1','m1','s1','t','l','m','s','w_m3','w_m2','w_p2','w_p3',
  'sd_tail_neg','sd_tail_pos','zscore','zscore_index','height_2','height_2_child',
  'imc','imc_child','muac_index','probable_parto','calculo_edad_gestacional',
  'g7_total','g7_pct_mujeres','g7_pct_menores'
]);
const XLS_META_CALC_TYPES = new Set([
  'start','end','today','deviceid','username','simserial','subscriberid','phonenumber','audit',
  'hidden','note','begin_group','end_group','begin_repeat','end_repeat','begin group','end group','begin repeat','end repeat'
]);
const XLS_KEEP_CALC_RE = /\b(edad|age|discapacidad|wg_discapacidad|sexo|sex|indig|embaraz|lact|fecha|estado|municipio|parroquia|comunidad|socio|proyecto|sector)\b/;

function mmIsKoboMeta(h, xlsform){
  const raw = String(h || '').trim();
  const f = fold(raw);
  if(!f) return true;
  if(KOBO_META_EXACT.has(f) || raw.startsWith('_')) return true;
  if(f.includes('meta/') || f.includes('formhub/') || f.includes('consentimiento informado') || f.includes('declaracion de privacidad')) return true;
  if(/\$\{[^}]+\}/.test(raw) || raw.startsWith('**ALERTA:')) return true;
  if(raw.length > 110) return true;
  if(/^(OBESITY_INDEX|CALC_|TOTAL_|COUNT_|SUM_|MIN_|MAX_|FLAG_|AGE_GROUP|REPEAT_PSTION|MINDATE|MAXDATE|DISPLAY_)/.test(raw.toUpperCase()) && !/total\s+(personas|kits)/i.test(raw)) return true;
  if(xlsform && xlsform.ignoreSet && xlsform.ignoreSet.includes(f)) return true;
  return false;
}

function mmFilterKoboHeaders(headers, xlsform){
  const list = headers || [];
  const hSet = new Set(list.map(h => fold(h)));
  const multiSet = new Set(xlsform && xlsform.multiSet ? xlsform.multiSet : []);
  return list.filter(h => {
    if(mmIsKoboMeta(h, xlsform)) return false;
    const raw = String(h || '').trim();
    const slash = raw.indexOf('/');
    if(slash > 0 && !raw.startsWith('_')){
      const prefix = fold(raw.slice(0, slash).trim());
      if(hSet.has(prefix) || multiSet.has(prefix)) return false;
    }
    return true;
  });
}

function mmParseXlsForm(wb, fileName){
  const sName = wb.SheetNames.find(n => fold(n) === 'survey');
  if(!sName) throw new Error('El XLSForm debe contener una hoja llamada "survey".');
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sName], { header:1, defval:null, raw:true, blankrows:false });
  if(aoa.length < 2) throw new Error('La hoja "survey" del XLSForm está vacía.');
  const hdrs = (aoa[0] || []).map(c => fold(toText(c)));
  const iType = hdrs.findIndex(h => h === 'type' || h === 'tipo');
  const iName = hdrs.findIndex(h => h === 'name' || h === 'nombre');
  const labelCols = hdrs.map((h, i) => (h === 'label' || h.startsWith('label::') || h.startsWith('etiqueta')) ? i : -1).filter(i => i >= 0);
  if(iType < 0 || iName < 0) throw new Error('La hoja "survey" debe tener columnas "type" y "name".');

  const ignoreSet = new Set();
  const multiSet = new Set();
  const qKeys = [];
  let metaCount = 0, calcCount = 0, qCount = 0;

  for(let r = 1; r < aoa.length; r++){
    const row = aoa[r]; if(!row) continue;
    const rawType = fold(toText(row[iType]));
    const baseType = rawType.split(/\s+/)[0];
    const name = toText(row[iName]);
    const labels = labelCols.map(ci => toText(row[ci])).filter(Boolean);
    if(!rawType && !name) continue;
    const isCalc = baseType === 'calculate';
    const keepCalc = isCalc && (XLS_KEEP_CALC_RE.test(fold(name)) || labels.some(lb => XLS_KEEP_CALC_RE.test(fold(lb))));
    if(XLS_META_CALC_TYPES.has(rawType) || XLS_META_CALC_TYPES.has(baseType) || (isCalc && !keepCalc)){
      if(isCalc) calcCount++; else metaCount++;
      if(name) ignoreSet.add(fold(name));
      labels.forEach(lb => ignoreSet.add(fold(lb)));
    } else {
      qCount++;
      if(baseType === 'select_multiple'){
        if(name) multiSet.add(fold(name));
        labels.forEach(lb => multiSet.add(fold(lb)));
      }
      if(name) qKeys.push(fold(name));
      labels.forEach(lb => qKeys.push(fold(lb)));
    }
  }
  return {
    fileName,
    qCount,
    calcCount,
    metaCount,
    ignoreSet: [...ignoreSet],
    multiSet: [...multiSet],
    qKeys: [...new Set(qKeys)].slice(0, 250)
  };
}

const KOBO_ORG_MAP = {
  crvz: 'Cruz Roja Maracaibo',
  fpm: 'Fundación Proyecto Maniapure',
  dsc: 'Diócesis de San Cristóbal',
  cgdt: 'Cáritas Guasdualito',
  odisef: 'ODISEF'
};

const KOBO_ESTADO_CODES = {
  zul:'Zulia', bol:'Bolívar', tac:'Táchira', apu:'Apure', mir:'Miranda',
  dca:'Distrito Capital', car:'Carabobo', ara:'Aragua', lar:'Lara', fal:'Falcón',
  mer:'Mérida', tru:'Trujillo', bar:'Barinas', suc:'Sucre', anz:'Anzoátegui',
  mon:'Monagas', del:'Delta Amacuro', ama:'Amazonas', yar:'Yaracuy', por:'Portuguesa',
  coj:'Cojedes', gua:'Guárico', nue:'Nueva Esparta', lag:'La Guaira'
};

const KOBO_GEO_POINTS = [
  { match: s => s.includes('terminal de pasajeros de maracaibo'), geo: { estado:'Zulia', mun:'Maracaibo', parr:'Chiquinquirá', com:'Terminal de Pasajeros de Maracaibo' } },
  { match: s => s.includes('santa elena de uairen'), geo: { estado:'Bolívar', mun:'Gran Sabana', parr:'Gran Sabana', com:'Terminal de Pasajeros de Santa Elena de Uairén' } },
  { match: s => s.includes('san antonio') && s.includes('esperanza'), geo: { estado:'Táchira', mun:'Bolívar', parr:'San Antonio del Táchira', com:'San Antonio "Esperanza Venezuela"' } },
  { match: s => s.includes('urena') && s.includes('venezuela mia'), geo: { estado:'Táchira', mun:'Pedro María Ureña', parr:'Ureña', com:'Ureña "Venezuela Mía"' } },
  { match: s => s.includes('capacho'), geo: { estado:'Táchira', mun:'Independencia', parr:'Capacho Nuevo', com:'Capacho' } },
  { match: s => s.includes('la pedrera'), geo: { estado:'Táchira', mun:'Libertador', parr:'San Joaquín de Navay', com:'La Pedrera' } },
  { match: s => s.includes('guasdualito'), geo: { estado:'Apure', mun:'Páez', parr:'Guasdualito', com:'Guasdualito "Jesus Maestro"' } },
  { match: s => s.startsWith('cpt2 '), geo: { estado:'Amazonas', mun:'Atures', parr:'', com:'' } }
];

const KOBO_GEO_TEAMS = [
  { match: s => s.includes('cruz roja maracaibo') || s === 'crvz', geo: { estado:'Zulia', mun:'Maracaibo', parr:'', com:'' } },
  { match: s => s.includes('maniapure') || s === 'fpm', geo: { estado:'Bolívar', mun:'Gran Sabana', parr:'Gran Sabana', com:'' } },
  { match: s => s.includes('diocesis de san cristobal') || s === 'dsc', geo: { estado:'Táchira', mun:'', parr:'', com:'' } },
  { match: s => s.includes('caritas guasdualito') || s === 'cgdt', geo: { estado:'Apure', mun:'Páez', parr:'Guasdualito', com:'' } },
  { match: s => s.includes('odisef'), geo: { estado:'Táchira', mun:'', parr:'', com:'' } },
  { match: s => s.includes('oim - amazonas') || s.includes('oim amazonas'), geo: { estado:'Amazonas', mun:'Atures', parr:'', com:'' } },
  { match: s => s.includes('ven da tu mano'), geo: { estado:'Apure', mun:'', parr:'', com:'' } }
];

const KOBO_GEO_INVALID = new Set([
  'no','si','no sabe','no responde','no sabe no responde','prefiere no responder',
  'no aplica','na','n a','ninguno','ninguna','0','1','true','false'
]);
const KOBO_GENERIC_PUNTOS = new Set([
  'ventanilla','centro de salud comunidad','centro de salud/comunidad','punto de atencion','otro','otra'
]);
function mmCleanGeoVal(raw){
  const t = toText(raw) || '';
  if(!t) return '';
  const f = fold(t);
  return (!f || KOBO_GEO_INVALID.has(f)) ? '' : t;
}

function mmKoboResolveGeo({ socio, punto, estadoRaw, munRaw, parrRaw, comRaw }){
  let estado = mmCleanGeoVal(estadoRaw), mun = mmCleanGeoVal(munRaw), parr = mmCleanGeoVal(parrRaw), com = mmCleanGeoVal(comRaw);
  const estCode = fold(estado);
  if(KOBO_ESTADO_CODES[estCode]) estado = KOBO_ESTADO_CODES[estCode];
  const pClean = mmCleanGeoVal(punto);
  const fp = fold(pClean || com);
  const fs = fold(socio);
  const ptHit = fp ? KOBO_GEO_POINTS.find(x => x.match(fp)) : null;
  const tmHit = fs ? KOBO_GEO_TEAMS.find(x => x.match(fs)) : null;
  const ref = ptHit ? ptHit.geo : (tmHit ? tmHit.geo : null);
  if(ref){
    if(!estado && ref.estado) estado = ref.estado;
    if(!mun && ref.mun) mun = ref.mun;
    if(!parr && ref.parr) parr = ref.parr;
    if(!com && ref.com) com = ref.com;
  }
  if(!com && pClean && !KOBO_GENERIC_PUNTOS.has(fold(pClean))) com = pClean;
  return { estado, mun, parr, com };
}

const MMAT_KOBO_FIELDS = [
  { k:'fecha', l:'Fecha de atención / registro', aliases:['fecha de la atencion o actividad','fecha de atencion','fecha de asistencia','fecha de entrega','fecha','assistance_date','date'], exclude:['nacimiento','ultima regla','primer control','ultimo control'] },
  { k:'proyecto', l:'Proyecto', aliases:['project','proyecto','donante','programa'] },
  { k:'socio', l:'Socio / Equipo implementador', aliases:['especifique el socio implementador','seleccione equipo implementador','equipo implementador','socio implementador','quien brindo la atencion','socio','org','organizacion','partner'] },
  { k:'punto', l:'Punto específico / Sede (para ubicación)', aliases:['seleccione','0.3 punto de atencion','punto de atencion','punto especifico','sede','ubicacion'], exclude:['tipo de punto'] },
  { k:'estado', l:'Estado', aliases:['estado','entidad federal','state'], exclude:['embarazo','lactancia','departamento','inicio su viaje','tiene intencion'] },
  { k:'municipio', l:'Municipio', aliases:['municipio','municipality'], exclude:['inicio su viaje','tiene intenciones'] },
  { k:'parroquia', l:'Parroquia', aliases:['parroquia','parish'] },
  { k:'comunidad', l:'Comunidad', aliases:['comunidad','sector o comunidad','community'], exclude:['indigena','miembro de una comunidad','persona de la comunidad','actividad comunitaria'] },
  { k:'sector', l:'Sector / Tipo de asistencia', aliases:['seleccione la asistencia provista','sector','tipo de asistencia','tipo de punto de atencion','area'] },
  { k:'caso', l:'Código de familia / caso (para recurrentes)', allowId:true, aliases:['_id','_submission__id','gdc_code','codigo de caso','codigo de familia','id familia','familia'] },
  { k:'nombres', l:'Nombres (para inferir sexo si falta)', aliases:['nombres','nombre y apellido','nombre','primer nombre'] },
  { k:'parentesco', l:'Parentesco (jefe de hogar / líder)', aliases:['parentesco','jefe de hogar','lider','relacion'] },
  { k:'sexo', l:'Sexo', aliases:['sexo','cual es su sexo','sex','genero'] },
  { k:'edad', l:'Edad (años cumplidos)', aliases:['edad','edad en anos','cual es su edad','age'] },
  { k:'indig', l:'Población indígena', aliases:['pertenencia etnica','comunidad indigena','poblacion indigena','total personas indigenas','indigena','etnia'] },
  { k:'disc', l:'Personas con discapacidad', aliases:['wg_discapacidad','total personas con discapacidad','personas con discapacidad','discapacidad'] },
  { k:'preg', l:'Embarazada', aliases:['estado de embarazo o lactancia','estado de embarazo','embarazo','embarazada'] },
  { k:'lact', l:'En lactancia', aliases:['estado de lactancia','lactancia','lactante'] },
  { k:'kits', l:'Total kits (si aplica)', aliases:['total kits','kits','cantidad de kits'] }
];

function mmLoadKoboPrefs(){
  try{ return JSON.parse(localStorage.getItem(KOBO_PREFS_KEY) || '{}') || {}; }catch{ return {}; }
}
function mmSaveKoboPrefs(sig, map, manual){
  if(!sig) return;
  try{
    const all = mmLoadKoboPrefs();
    all[sig] = { map: { ...map }, manual: { ...manual } };
    localStorage.setItem(KOBO_PREFS_KEY, JSON.stringify(all));
  }catch{}
}

function mmKoboFieldHeaders(f, selectHeaders, allHeaders){
  if(!f.allowId) return selectHeaders;
  const extra = ['_id', '_submission__id'].filter(h => (allHeaders || []).includes(h) && !selectHeaders.includes(h));
  return [...extra, ...selectHeaders];
}

function mmKoboAutoMap(selectHeaders, allHeaders, sig){
  const map = {}, manual = {};
  MMAT_KOBO_FIELDS.forEach(f => {
    const pool = mmKoboFieldHeaders(f, selectHeaders, allHeaders).filter(h => {
      if(!f.exclude || !f.exclude.length) return true;
      const fh = fold(h);
      return !f.exclude.some(ex => fh.includes(fold(ex)));
    });
    let hit = '';
    for(const a of f.aliases){
      const fa = fold(a);
      hit = pool.find(h => fold(h) === fa);
      if(hit) break;
    }
    if(!hit){
      for(const a of f.aliases){
        const fa = fold(a);
        hit = pool.find(h => fold(h).includes(fa));
        if(hit) break;
      }
    }
    map[f.k] = hit || '';
  });
  const saved = sig ? mmLoadKoboPrefs()[sig] : null;
  if(saved && saved.map){
    MMAT_KOBO_FIELDS.forEach(f => {
      const pool = mmKoboFieldHeaders(f, selectHeaders, allHeaders);
      const sv = saved.map[f.k];
      if(sv === '__manual__' || sv === '' || (sv && pool.includes(sv))) map[f.k] = sv;
    });
  }
  if(saved && saved.manual) Object.assign(manual, saved.manual);
  return { map, manual };
}

function mmInspectSheetMeta(ws){
  const ref = ws && ws['!ref'];
  if(!ref) return null;
  const rg = XLSX.utils.decode_range(ref);
  const topRg = { s: rg.s, e: { r: Math.min(rg.e.r, rg.s.r + 7), c: rg.e.c } };
  const topAoa = XLSX.utils.sheet_to_json(ws, { header:1, defval:null, raw:true, blankrows:false, range: topRg });
  if(!topAoa.length) return null;
  const hIdx = detectHeaderRow(topAoa);
  const seen = {};
  const headers = (topAoa[hIdx] || []).map((c, i) => {
    let n = toText(c) || `Columna ${i+1}`;
    if(seen[n]){ seen[n]++; n = `${n} (${seen[n]})`; } else seen[n] = 1;
    return n;
  });
  const estRows = Math.max(0, rg.e.r - (rg.s.r + hIdx));
  return { rg, hIdx, headers, estRows };
}

function mmExtractSheetRows(ws, meta, keepSet){
  const { rg, hIdx, headers } = meta;
  const startR = rg.s.r + hIdx + 1;
  if(startR > rg.e.r) return [];
  const keepIdx = [];
  headers.forEach((hd, ci) => { if(keepSet.has(hd)) keepIdx.push([ci, hd]); });
  const dataRg = { s: { r: startR, c: rg.s.c }, e: rg.e };
  const aoa = XLSX.utils.sheet_to_json(ws, { header:1, defval:null, raw:true, blankrows:false, range: dataRg });
  const rows = [];
  for(let i = 0; i < aoa.length; i++){
    const r = aoa[i];
    if(!r) continue;
    let hasAny = false;
    const o = { _row: startR + i + 1 };
    for(let k = 0; k < keepIdx.length; k++){
      const [ci, hd] = keepIdx[k];
      const v = r[ci] ?? null;
      if(v != null && String(v).trim() !== '') hasAny = true;
      o[hd] = v;
    }
    if(hasAny) rows.push(o);
  }
  return rows;
}

function mmParseKobo(wb, fileName, explicitXls){
  const metas = [];
  for(const name of wb.SheetNames){
    const m = mmInspectSheetMeta(wb.Sheets[name]);
    if(m && m.estRows > 0) metas.push({ name, ws: wb.Sheets[name], ...m });
  }
  if(!metas.length) throw new Error('El archivo Kobo está vacío.');

  const parentMeta = metas.find(s => s.headers.includes('_id') && !s.headers.includes('_submission__id')) || metas.find(s => s.headers.includes('_id'));
  const childCandidates = metas.filter(s => s.headers.includes('_submission__id'));
  const childMeta = childCandidates.find(s => /meal/i.test(s.name)) || childCandidates.sort((a, b) => b.estRows - a.estRows)[0];

  if(parentMeta && childMeta && parentMeta !== childMeta){
    const allHeaders = [...childMeta.headers];
    parentMeta.headers.forEach(h => { if(!allHeaders.includes(h)) allHeaders.push(h); });
    const xf = explicitXls || null;
    const selectHeaders = mmFilterKoboHeaders(allHeaders, xf);
    const keepSet = new Set([...selectHeaders, '_id', '_submission__id', '_index']);

    const pRows = mmExtractSheetRows(parentMeta.ws, parentMeta, keepSet);
    const cRows = mmExtractSheetRows(childMeta.ws, childMeta, keepSet);
    const pKeepCols = parentMeta.headers.filter(h => keepSet.has(h) && h !== '_id');

    const pById = new Map();
    for(let i = 0; i < pRows.length; i++){
      const pr = pRows[i];
      const id = toText(pr._id);
      if(id) pById.set(id, pr);
    }

    const rows = new Array(cRows.length);
    for(let idx = 0; idx < cRows.length; idx++){
      const cr = cRows[idx];
      const subId = toText(cr._submission__id);
      const pr = pById.get(subId);
      cr._id = pr && pr._id != null ? pr._id : subId;
      cr._row = cr._index != null ? Number(cr._index) || (idx + 2) : cr._row;
      cr._koboSubId = subId;
      if(pr){
        for(let j = 0; j < pKeepCols.length; j++){
          const h = pKeepCols[j];
          if((cr[h] == null || String(cr[h]).trim() === '') && pr[h] != null) cr[h] = pr[h];
        }
      }
      rows[idx] = cr;
    }

    const sig = selectHeaders.slice(0, 24).map(fold).join('|');
    return {
      name: fileName,
      sheet: `${parentMeta.name} + ${childMeta.name}`,
      headers: allHeaders,
      selectHeaders,
      rows,
      sig,
      xlsform: xf || null,
      linkedInfo: { parentSheet: parentMeta.name, childSheet: childMeta.name, parentCount: pRows.length, childCount: cRows.length }
    };
  }

  const main = metas.sort((a, b) => b.estRows - a.estRows)[0];
  const xf = explicitXls || null;
  const selectHeaders = mmFilterKoboHeaders(main.headers, xf);
  const keepSet = new Set([...selectHeaders, '_id', '_submission__id', '_index']);
  const rows = mmExtractSheetRows(main.ws, main, keepSet);
  const sig = selectHeaders.slice(0, 24).map(fold).join('|');
  return { name: fileName, sheet: main.name, headers: main.headers, selectHeaders, rows, sig, xlsform: xf || null, linkedInfo: null };
}

const NAMES_M = new Set('marcos,darwin,carlos,jose,luis,juan,jesus,pedro,miguel,alexander,anderson,jefferson,emerson,yerson,brayan,bryan,kevin,anthony,yorman,wilmer,edwin,erwin,ender,douglas,franklin,richard,robert,ronald,hector,victor,oscar,daniel,gabriel,rafael,samuel,david,angel,manuel,antonio,francisco,javier,jorge,ramon,simon,eduardo,alejandro,andres,diego,sebastian,mateo,santiago,nicolas,cristian,christian,jonathan,jhon,jhonny,freddy,william,henry,omar,cesar,julio,raul,ruben,felipe,fernando,ricardo,gustavo,alberto,alfredo,arturo,enrique,ernesto,esteban,fabian,gerardo,guillermo,hernan,hugo,ignacio,ivan,jaime,joaquin,joel,leonardo,lorenzo,lucas,marcelo,mario,martin,mauricio,nelson,nestor,orlando,pablo,patricio,roberto,rodrigo,rogelio,sergio,tomas,ulises,vicente,walter,xavier,yohan,yonathan,joshua,luca,bautista,isaias,elias,matias,tobias,jeremias,zacarias,noah,alex,danny,dennis,edgar,efren,elvis,enmanuel,emmanuel,erick,eugenio,felix,francis,gregorio,israel,jairo,jorman,junior,kendry,kleiber,leandro,lenin,maikel,moises,neomar,orlando,oswaldo,reinaldo,rey,ronny,wilfredo,yeison,yender,yoel,yovanny,yovani'.split(','));
const NAMES_F = new Set('maria,carmen,ana,rosa,genesis,yulimar,daniela,paola,valeria,andrea,carolina,alejandra,gabriela,patricia,claudia,sandra,monica,veronica,laura,lucia,sofia,camila,valentina,isabella,victoria,mariana,natalia,stephanie,estefania,yessica,jessica,yelitza,mileidy,mileidis,yuleidis,yuleidy,karelys,karelis,yusmery,yusmar,yennifer,jennifer,katherine,roxana,grecia,oriana,fabiola,adriana,beatriz,blanca,cecilia,clara,cristina,diana,elena,elizabeth,elsa,erika,esther,evelyn,flor,gloria,graciela,ines,ingrid,irene,isabel,johanna,juana,julia,karla,liliana,lorena,luisa,luz,magdalena,marcela,margarita,marisol,marlene,marta,martha,mayra,mercedes,milagros,miriam,nadia,nancy,nelly,norma,olga,raquel,rebeca,rita,rocio,rosario,consuelo,amparo,ruth,judith,edith,sara,silvia,sonia,susana,teresa,vanessa,virginia,viviana,wendy,xiomara,yolanda,zuleima,yulexy,yulexis,yuraima,yurbis,zoraida,nohelia,noelia,keyla,keila,kemberly,kimberly,stefany,wendy,yamileth,yarelys,yarisbel,yaritza,yasmil,yenny,jenny,yohana,yoana,yoleida,yorlenis,yudith,yuliana,yulianny,yusneidy'.split(','));

function mmInferSex(p, seed){
  if(isPreg(p)) return { sexo:'Mujer', why:'por condición de embarazo o lactancia' };
  const tokens = String(p.name || '').trim().split(/\s+/).filter(Boolean);
  for(const rawTok of tokens.slice(0, 2)){
    const fn = fold(rawTok);
    if(!fn || fn.length < 2) continue;
    if(NAMES_M.has(fn)) return { sexo:'Hombre', why:`por el nombre («${rawTok}»)` };
    if(NAMES_F.has(fn)) return { sexo:'Mujer', why:`por el nombre («${rawTok}»)` };
  }
  const rawFirst = tokens[0] || '', fn = fold(rawFirst);
  if(fn && fn.length >= 3){
    if(/(o|os|win|son|er|iel|on)$/.test(fn)) return { sexo:'Hombre', why:`por terminación del nombre («${rawFirst}»)` };
    if(/(a|th|lyn|lin|ys|is)$/.test(fn)) return { sexo:'Mujer', why:`por terminación del nombre («${rawFirst}»)` };
  }
  return { sexo: seed % 2 === 0 ? 'Mujer' : 'Hombre', why:'asignado aleatoriamente' };
}

function mmImputePerson(p, a){
  const rawAge = p.birth && a.fecha && p.birth <= a.fecha ? ageAt(p.birth, a.fecha) : p.age;
  const ageOk = rawAge != null && rawAge >= 0 && rawAge <= 120;
  const sxRaw = fold(p.sexo);
  const sxOk = sxRaw === 'mujer' || sxRaw === 'hombre';
  if(ageOk && sxOk) return { age: rawAge, sexo: sxRaw === 'mujer' ? 'Mujer' : 'Hombre', adj: null };

  const hashNum = v => {
    if(typeof v === 'number' && !isNaN(v)) return v;
    const s = String(v || '');
    let h = 0;
    for(let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  const seed = Math.abs(hashNum(p.n || 1) * 31 + hashNum(a.num) * 17 + hashNum(p.fam) * 13);
  const rel = p.rel || '';
  const lead = (a.ps || []).find(x => isLeader(x) && x.birth && x.age != null && x.age >= 15 && x.age <= 100);
  const repAge = lead ? lead.age : 32;

  const sxInf = sxOk ? { sexo: sxRaw === 'mujer' ? 'Mujer' : 'Hombre', why: '' } : mmInferSex(p, seed);
  const sexo = sxInf.sexo;

  let age = ageOk ? rawAge : null, relDesc = '';
  if(age == null){
    const pick = (lo, hi) => lo + (seed % Math.max(1, hi - lo + 1));
    if(rel.includes('hijo')){
      const hi = Math.max(1, repAge - 14), lo = Math.min(2, hi);
      age = pick(lo, hi); relDesc = `por ser ${p.parentesco || 'Hijo/a'} (representante de ${repAge} años)`;
    } else if(rel.includes('nieto')){
      const hi = Math.max(1, repAge - 28);
      age = pick(0, hi); relDesc = `por ser ${p.parentesco || 'Nieto/a'} (representante de ${repAge} años)`;
    } else if(rel.includes('padre') || rel.includes('madre')){
      const lo = Math.min(85, repAge + 16), hi = Math.min(92, lo + 18);
      age = pick(lo, hi); relDesc = `por ser ${p.parentesco || 'Padre/Madre'} (representante de ${repAge} años)`;
    } else if(rel.includes('abuelo')){
      const lo = Math.min(85, Math.max(60, repAge + 30));
      age = pick(lo, 92); relDesc = `por ser ${p.parentesco || 'Abuelo/a'} (representante de ${repAge} años)`;
    } else if(isLeader(p) || rel.includes('pareja') || rel.includes('conyuge') || rel.includes('espos')){
      const lo = Math.max(18, repAge - 5), hi = Math.min(65, repAge + 5);
      age = pick(lo, hi); relDesc = `por ser ${p.parentesco || 'Representante/Pareja'}`;
    } else if(rel.includes('hermano')){
      const lo = Math.max(1, repAge - 8), hi = Math.min(80, repAge + 8);
      age = pick(lo, hi); relDesc = `por ser ${p.parentesco || 'Hermano/a'} (representante de ${repAge} años)`;
    } else {
      age = pick(1, 65);
      relDesc = rel ? `por parentesco «${p.parentesco}»` : 'de forma aleatoria por no tener parentesco registrado';
    }
  }

  const faltante = !ageOk && !sxOk ? 'Edad y sexo' : !ageOk ? 'Edad' : 'Sexo';
  const partes = [];
  if(!ageOk) partes.push(`edad ${age} años (${relDesc})`);
  if(!sxOk) partes.push(`sexo ${sexo} (${sxInf.why})`);
  const asignacion = `Se asignó ${partes.join(' y ')}.`;
  return {
    age, sexo,
    adj: {
      filaIms: a.n,
      codigoAsistencia: a.code || '',
      codigoCaso: a.caso || '',
      filaRegistro: p.n != null ? p.n : 'No encontrada en Registro',
      persona: p.name || 'Sin nombre',
      parentesco: p.parentesco || 'Sin parentesco',
      faltante,
      asignacion
    }
  };
}

let _MM_GEO_CAT = null;
function _mmGeoCatalog(){
  if(_MM_GEO_CAT) return _MM_GEO_CAT;
  const estSet = new Set(), munsByE = new Map(), parrsByEM = new Map(), comsByEMP = new Map();
  const title = s => String(s || '').replace(/\b([a-záéíóúñü])([a-záéíóúñü]*)/gi, (_, a, b) => a.toUpperCase() + b);
  if(typeof GEO_INE_EMP !== 'undefined' && Array.isArray(GEO_INE_EMP)){
    GEO_INE_EMP.forEach(s => {
      const [e, m, p] = s.split('|');
      if(!e || !m || !p) return;
      estSet.add(e);
      if(!munsByE.has(e)) munsByE.set(e, new Set());
      munsByE.get(e).add(m);
      const em = `${e}|${m}`;
      if(!parrsByEM.has(em)) parrsByEM.set(em, new Set());
      parrsByEM.get(em).add(p);
    });
  }
  if(typeof GEO_INE_COM !== 'undefined' && GEO_INE_COM && typeof GEO_INE_EMP !== 'undefined'){
    Object.entries(GEO_INE_COM).forEach(([k, idx]) => {
      const emp = GEO_INE_EMP[idx];
      if(!emp) return;
      const rawName = k.includes('|') ? k.split('|').slice(1).join('|') : k;
      if(!rawName) return;
      if(!comsByEMP.has(emp)) comsByEMP.set(emp, new Set());
      comsByEMP.get(emp).add(title(rawName));
    });
  }
  const cmp = (a, b) => a.localeCompare(b, 'es');
  _MM_GEO_CAT = {
    estados: [...estSet].sort(cmp),
    muns: e => [...(munsByE.get(e) || [])].sort(cmp),
    parrs: (e, m) => [...(parrsByEM.get(`${e}|${m}`) || [])].sort(cmp),
    coms: (e, m, p) => [...(comsByEMP.get(`${e}|${m}|${p}`) || [])].sort(cmp)
  };
  return _MM_GEO_CAT;
}

function mmExcelComVal(){
  const g = MMAT.excelGeo;
  if(!g) return '';
  return g.com === '__custom__' ? (g.comCustom || '').trim() : (g.com || '').trim();
}

function mmExcelValidation(){
  const R = MMAT.raw, M = MMAT.map || {};
  if(!R || !R.rows || !R.rows.length){
    return { ok:false, missing:['Archivo vacío o sin filas de datos'], hasBands:false, hasCount:false, hasAge:false, hasSex:false, hasNames:false, needGeo:true, needEst:true, needMun:true, needParr:true, needCom:true, needRandAgeSex:false };
  }
  const hasColData = k => (M[k] === '__manual__' && !!(MMAT.manual[k] || '').trim())
    || (!!M[k] && M[k] !== '__manual__' && R.rows.some(r => toText(r[M[k]])));
  const hasBands = (M.bands || []).some(b => !!b.col);
  const hasTotalCol = hasColData('total_personas');
  const mode = MMAT.excelCountMode || (hasBands ? 'bands' : (hasTotalCol ? 'col' : ''));
  const hasCount = (mode === 'bands' && hasBands)
    || (mode === 'col' && hasTotalCol)
    || (mode === 'row' && R.rows.length > 0)
    || (mode === 'fixed' && Number(MMAT.excelFixedCount) > 0);

  const hasEstCol = hasColData('estado');
  const hasMunCol = hasColData('municipio');
  const hasParrCol = hasColData('parroquia');
  const hasComCol = hasColData('comunidad');
  const needGeo = !hasEstCol || !hasMunCol || !hasParrCol || !hasComCol;

  const hasEst = hasEstCol || !!MMAT.excelGeo.estado;
  const hasMun = hasMunCol || !!MMAT.excelGeo.mun;
  const hasParr = hasParrCol || !!MMAT.excelGeo.parr;
  const hasCom = hasComCol || !!mmExcelComVal();

  const hasAge = hasBands || hasColData('edad');
  const hasSex = hasBands || hasColData('sexo');
  const hasNames = hasColData('nombres');
  const needAgeRand = !hasBands && !hasAge;
  const needSexAssign = !hasBands && !hasSex;

  const missing = [];
  if(!hasCount) missing.push('Forma de contar asistencias / personas');
  if(!hasEst) missing.push('Estado');
  if(!hasMun) missing.push('Municipio');
  if(!hasParr) missing.push('Parroquia');
  if(!hasCom) missing.push('Comunidad');
  if(needAgeRand && !MMAT.excelAgeRand) missing.push('Activar asignación aleatoria de edades');
  if(needSexAssign && !MMAT.excelSexMode) missing.push('Seleccionar cómo asignar el sexo');

  return {
    ok: missing.length === 0,
    missing,
    hasBands,
    hasTotalCol,
    hasCount,
    mode,
    hasAge,
    hasSex,
    hasNames,
    needGeo,
    needEst: !hasEst,
    needMun: !hasMun,
    needParr: !hasParr,
    needCom: !hasCom,
    needAgeRand,
    needSexAssign
  };
}

function mmComputeGeneric(){
  const R = MMAT.raw, M = MMAT.map;
  if(!R) return null;
  const g = (r, k) => {
    const col = M[k];
    if(col === '__manual__') return MMAT.manual[k] || '';
    return col ? r[col] : null;
  };
  const defP = (MMAT.defProj || '').trim() || 'DHR Emergencia';
  const defS = (MMAT.defSector || '').trim() || 'NFI';
  const seenBySec = new Map(), grpMap = new Map(), ajustes = [];
  let omitSocio = 0, omitFecha = 0, omitEmpty = 0;

  const hasBands = (M.bands || []).some(b => !!b.col);
  const mode = MMAT.excelCountMode || (hasBands ? 'bands' : (M.total_personas ? 'col' : 'row'));
  const geoComFallback = mmExcelComVal();
  const aMin = Math.max(0, Math.min(110, Number(MMAT.excelAgeMin) || 0));
  const aMax = Math.max(aMin, Math.min(110, MMAT.excelAgeMax === '' || MMAT.excelAgeMax == null ? 74 : Number(MMAT.excelAgeMax)));
  let sexSeq = 0;

  const sorted = R.rows.map(r => ({ r, fecha: M.fecha ? toDate(g(r, 'fecha')) : '' }))
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || a.r._row - b.r._row);

  sorted.forEach(({ r, fecha }, idx) => {
    const socio = toText(g(r, 'socio')) || '';
    if(M.socio && M.socio !== '__manual__' && MMAT.validSocios.size && !MMAT.validSocios.has(fold(socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!fecha || (MMAT.from && fecha < MMAT.from) || (MMAT.to && fecha > MMAT.to))){ omitFecha++; return; }

    const proj = toText(g(r, 'proyecto')) || defP;
    const sector = toText(g(r, 'sector')) || defS;
    const estado = toText(g(r, 'estado')) || MMAT.excelGeo.estado || '';
    const mun = toText(g(r, 'municipio')) || MMAT.excelGeo.mun || '';
    const parr = toText(g(r, 'parroquia')) || MMAT.excelGeo.parr || '';
    const com = toText(g(r, 'comunidad')) || geoComFallback || '';

    const caso = toText(g(r, 'caso'));
    let rec = 'NO';
    if(caso){
      if(!seenBySec.has(sector)) seenBySec.set(sector, new Set());
      const s = seenBySec.get(sector), ck = fold(caso);
      if(s.has(ck)) rec = 'SÍ'; else s.add(ck);
    }

    const toFlagNum = v => {
      if(v == null) return 0;
      const n = toNum(v); if(n != null) return Math.max(0, n);
      const f = fold(toText(v));
      return f && !['no','ninguno','ninguna','no aplica','na','n a','0','false'].includes(f) ? 1 : 0;
    };
    const indig = toFlagNum(g(r, 'indig'));
    const disc = toFlagNum(g(r, 'disc'));
    const preg = toFlagNum(g(r, 'preg'));
    const kits = Math.max(0, toNum(g(r, 'kits')) || 0);

    const ages = Array(18).fill(0);
    if(mode === 'bands' && hasBands){
      (M.bands || []).forEach((b, bi) => {
        if(b.col){ const v = toNum(r[b.col]); if(v && v > 0) ages[bi] += v; }
      });
    } else {
      let nPers = 1;
      if(mode === 'col' && M.total_personas){
        nPers = Math.max(0, Math.floor(toNum(g(r, 'total_personas')) || 0));
      } else if(mode === 'fixed'){
        nPers = Math.max(1, Math.floor(Number(MMAT.excelFixedCount) || 1));
      }

      const rawSex = M.sexo ? mmKoboNormSex(g(r, 'sexo')) : '';
      const rawAgeNum = M.edad ? toNum(g(r, 'edad')) : null;
      const rawAge = rawAgeNum != null && rawAgeNum >= 0 && rawAgeNum <= 120 ? Math.floor(rawAgeNum) : null;
      const nombre = toText(g(r, 'nombres')) || '';

      for(let pi = 0; pi < nPers; pi++){
        let sx = rawSex;
        let sxWhy = '';
        if(!sx){
          const inf = (nombre && pi === 0) ? mmInferSex({ name: nombre, preg: preg ? 'Si' : '' }, idx + pi) : null;
          if(inf && inf.why !== 'asignado aleatoriamente'){
            sx = inf.sexo;
            sxWhy = inf.why;
          } else if(MMAT.excelSexMode){
            const m = MMAT.excelSexMode;
            if(m === 'all_f'){ sx = 'Mujer'; sxWhy = 'regla: todas mujeres'; }
            else if(m === 'all_m'){ sx = 'Hombre'; sxWhy = 'regla: todos hombres'; }
            else if(m === 'equal'){ sx = (sexSeq++ % 2 === 0) ? 'Mujer' : 'Hombre'; sxWhy = 'regla: proporciones iguales (50/50)'; }
            else if(m === 'maj_f'){ sx = Math.random() < 0.7 ? 'Mujer' : 'Hombre'; sxWhy = 'regla: mayoritariamente mujeres (70/30)'; }
            else if(m === 'maj_m'){ sx = Math.random() < 0.7 ? 'Hombre' : 'Mujer'; sxWhy = 'regla: mayoritariamente hombres (70/30)'; }
            else { sx = Math.random() < 0.5 ? 'Mujer' : 'Hombre'; sxWhy = 'asignado aleatoriamente'; }
          }
        }
        let age = rawAge;
        let ageWhy = '';
        if(age == null && MMAT.excelAgeRand){
          age = aMin + Math.floor(Math.random() * (aMax - aMin + 1));
          ageWhy = `asignada aleatoriamente (${aMin}–${aMax} años)`;
        }
        if(sx && age != null){
          const bi = MAT_BANDS.findIndex(([,, lo, hi]) => age >= lo && age <= hi);
          if(bi >= 0) ages[bi * 2 + (sx === 'Mujer' ? 0 : 1)]++;
          if((!rawSex || rawAge == null) && (sxWhy || ageWhy)){
            const partes = [];
            if(rawAge == null && ageWhy) partes.push(`edad ${age} años (${ageWhy})`);
            if(!rawSex && sxWhy) partes.push(`sexo ${sx} (${sxWhy})`);
            ajustes.push({
              filaIms: r._row,
              codigoAsistencia: '',
              codigoCaso: caso || '',
              filaRegistro: 'Excel personalizado',
              persona: nombre || `Fila ${r._row}${nPers > 1 ? ` (#${pi + 1})` : ''}`,
              parentesco: '—',
              faltante: (rawAge == null && !rawSex) ? 'Edad y sexo' : (rawAge == null ? 'Edad' : 'Sexo'),
              asignacion: `Se asignó ${partes.join(' y ')}.`
            });
          }
        }
      }
    }

    const totP = ages.reduce((s, v) => s + v, 0);
    if(!totP && !kits && !indig && !disc && !preg){ omitEmpty++; return; }

    const k = [fecha || '', proj, socio, estado, mun, parr, com, sector, rec].join('|');
    let grp = grpMap.get(k);
    if(!grp){ grp = { fecha:fecha||'', proj, socio, estado, mun, parr, com, sector, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 }; grpMap.set(k, grp); }
    grp.indig += indig; grp.disc += disc; grp.preg += preg; grp.kits += kits;
    ages.forEach((v, i) => { grp.ages[i] += v; });
  });

  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''));
  const outRows = [...grpMap.values()].sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.proj, b.proj) || cmp(a.socio, b.socio) || cmp(a.estado, b.estado) || cmp(a.mun, b.mun) || cmp(a.parr, b.parr) || cmp(a.com, b.com) || cmp(a.sector, b.sector) || cmp(a.rec, b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  if(omitEmpty) omitted.push(`${fmt(omitEmpty)} fila(s) sin personas ni kits registrados`);
  return { outRows, omitted, ajustes };
}

function mmKoboVal(r, k){
  const col = MMAT.map[k];
  if(col === '__manual__') return MMAT.manual[k] || '';
  return col ? r[col] : null;
}

function mmKoboNormSex(raw){
  const f = fold(toText(raw));
  if(!f) return '';
  if(['mujer','femenino','f','female','nina','dama'].includes(f)) return 'Mujer';
  if(['hombre','masculino','m','male','nino','caballero'].includes(f)) return 'Hombre';
  return '';
}

function mmKoboFlag(v){
  if(v == null) return 0;
  const n = toNum(v);
  if(n != null) return n > 0 ? 1 : 0;
  const f = fold(toText(v));
  if(!f) return 0;
  if(['no','ninguno','ninguna','no aplica','na','n a','no sabe','no responde','no sabe no responde','prefiere no responder','0','false'].includes(f)) return 0;
  return 1;
}

function mmKoboIndigFlag(v){
  if(v == null) return 0;
  const n = toNum(v);
  if(n != null) return Math.max(0, Math.floor(n));
  const f = fold(toText(v));
  if(!f) return 0;
  if(['no','ninguno','ninguna','no aplica','na','n a','no sabe','no responde','no sabe no responde','prefiere no responder','otra','otro','afrodescendiente','0','false'].includes(f)) return 0;
  return 1;
}

function mmKoboFindCol(headers, pred){
  return (headers || []).find(h => pred(fold(h))) || '';
}

function mmKoboResolveSocio(r, socioCol, headers){
  let s = '';
  if(socioCol === '__manual__') s = MMAT.manual.socio || '';
  else if(socioCol) s = toText(r[socioCol]) || '';

  if(socioCol && socioCol !== '__manual__' && headers){
    const fs = fold(s);
    if(fs && fs.includes('especificar')){
      const espCol = mmKoboFindCol(headers, fh => fh !== fold(socioCol) && (fh.includes('especifique el socio') || fh.includes('socio implementador')));
      const espVal = espCol ? toText(r[espCol]) : '';
      if(espVal) s = espVal;
    } else if(!s && fold(socioCol).includes('especifique')){
      const mainCol = mmKoboFindCol(headers, fh => fh !== fold(socioCol) && (fh.includes('quien brindo') || fh.includes('equipo implementador')));
      const mainVal = mainCol ? toText(r[mainCol]) : '';
      if(mainVal && !fold(mainVal).includes('especificar')) s = mainVal;
    }
  }
  if(KOBO_ORG_MAP[fold(s)]) s = KOBO_ORG_MAP[fold(s)];
  return s;
}

function mmKoboWgDisc(r, wgCols){
  for(const col of wgCols){
    const f = fold(toText(r[col]));
    if(!f) continue;
    if(f.includes('mucha dificultad') || f.includes('le resulta imposible') || f === '3' || f === '4') return 1;
  }
  return 0;
}

function mmComputeKobo(){
  const R = MMAT.raw, M = MMAT.map;
  if(!R) return null;
  const defP = (MMAT.defProj || '').trim() || 'Sin proyecto';
  const seenBySec = new Map(), grpMap = new Map(), ajustes = [];
  let omitSocio = 0, omitFecha = 0;

  const hdrs = R.selectHeaders || R.headers || [];
  const wgCols = hdrs.filter(h => {
    const f = fold(h);
    return f.includes('dificultad para ver') || f.includes('dificultad para oir') || f.includes('dificultad para caminar')
      || f.includes('dificultad para recordar') || f.includes('autocuidado') || f.includes('cuidarse a si mismo')
      || f.includes('dificultad para comunicarse');
  });
  const birthCol = mmKoboFindCol(hdrs, f => f.includes('fecha de nacimiento'));
  const comCols = {
    ma: mmKoboFindCol(hdrs, f => f === 'mujeres adultas'),
    ha: mmKoboFindCol(hdrs, f => f === 'hombres adultos'),
    na: mmKoboFindCol(hdrs, f => f.includes('ninas y adolescentes')),
    no: mmKoboFindCol(hdrs, f => f.includes('ninos y adolescentes')),
    disc: mmKoboFindCol(hdrs, f => f.includes('total personas con discapacidad')),
    indig: mmKoboFindCol(hdrs, f => f.includes('total personas indigenas'))
  };
  const hasComCols = !!(comCols.ma || comCols.ha || comCols.na || comCols.no);

  const prepared = [];
  R.rows.forEach((r, idx) => {
    const fecha = M.fecha ? toDate(mmKoboVal(r, 'fecha')) : '';
    const socio = mmKoboResolveSocio(r, M.socio, hdrs);
    if((M.socio === '__manual__' || M.socio) && MMAT.validSocios.size && !MMAT.validSocios.has(fold(socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!fecha || (MMAT.from && fecha < MMAT.from) || (MMAT.to && fecha > MMAT.to))){ omitFecha++; return; }

    let projRaw = toText(mmKoboVal(r, 'proyecto'));
    if(projRaw === '0') projRaw = '';
    const proj = projRaw || defP;

    let secRaw = toText(mmKoboVal(r, 'sector'));
    if(secRaw === '0') secRaw = '';
    const sector = secRaw || (MMAT.defSector || '').trim() || 'Sin sector';

    const punto = toText(mmKoboVal(r, 'punto'));
    const geo = mmKoboResolveGeo({
      socio,
      punto,
      estadoRaw: mmKoboVal(r, 'estado'),
      munRaw: mmKoboVal(r, 'municipio'),
      parrRaw: mmKoboVal(r, 'parroquia'),
      comRaw: mmKoboVal(r, 'comunidad')
    });

    const caso = toText(mmKoboVal(r, 'caso'));
    const subKey = toText(r._koboSubId || r._submission__id || r._id) || caso || `row_${r._row || idx + 1}`;
    const rawAge = toNum(mmKoboVal(r, 'edad'));
    let age = rawAge != null && rawAge >= 0 && rawAge <= 110 ? Math.floor(rawAge) : null;
    const birth = birthCol ? toDate(r[birthCol]) : '';
    if(age == null && birth && fecha && birth <= fecha){
      const aCalc = ageAt(birth, fecha);
      if(aCalc != null && aCalc >= 0 && aCalc <= 110) age = aCalc;
    }
    const sexo = mmKoboNormSex(mmKoboVal(r, 'sexo'));
    const parentesco = toText(mmKoboVal(r, 'parentesco'));
    const nombres = toText(mmKoboVal(r, 'nombres'));
    const indig = mmKoboIndigFlag(mmKoboVal(r, 'indig'));
    let disc = M.disc ? mmKoboFlag(mmKoboVal(r, 'disc')) : 0;
    if(!M.disc && wgCols.length) disc = mmKoboWgDisc(r, wgCols);
    const preg = (mmKoboFlag(mmKoboVal(r, 'preg')) || mmKoboFlag(mmKoboVal(r, 'lact'))) ? 1 : 0;
    const kits = Math.max(0, toNum(mmKoboVal(r, 'kits')) || 0);

    if(age == null && !sexo && hasComCols){
      const ma = Math.max(0, toNum(comCols.ma ? r[comCols.ma] : 0) || 0);
      const ha = Math.max(0, toNum(comCols.ha ? r[comCols.ha] : 0) || 0);
      const na = Math.max(0, toNum(comCols.na ? r[comCols.na] : 0) || 0);
      const no = Math.max(0, toNum(comCols.no ? r[comCols.no] : 0) || 0);
      if(ma + ha + na + no > 0){
        const cDisc = Math.max(disc, toNum(comCols.disc ? r[comCols.disc] : 0) || 0);
        const cIndig = Math.max(indig, toNum(comCols.indig ? r[comCols.indig] : 0) || 0);
        prepared.push({ r, fecha, proj, socio, geo, sector, caso, subKey, indig:cIndig, disc:cDisc, preg, kits, comCounts:{ ma, ha, na, no } });
        return;
      }
    }

    const p = {
      n: r._row || (idx + 2),
      fam: subKey,
      birth: birth || null,
      age,
      sexo,
      rel: fold(parentesco),
      parentesco,
      name: nombres || `Persona ${r._row || idx + 1}`,
      embarazo: preg ? 'Si' : '',
      preg: preg ? 'Si' : ''
    };
    prepared.push({ r, fecha, proj, socio, geo, sector, caso, subKey, indig, disc, preg, kits, p });
  });

  // Agrupar por envío (_submission__id) para dar contexto de hogar/líder al imputar edad y sexo
  const bySub = new Map();
  prepared.forEach(item => {
    if(!item.p) return;
    let a = bySub.get(item.subKey);
    if(!a){
      a = { n: item.r._row, num: item.subKey, fecha: item.fecha, code: item.subKey, caso: item.caso, ps: [] };
      bySub.set(item.subKey, a);
    }
    a.ps.push(item.p);
  });

  prepared.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || a.r._row - b.r._row);

  prepared.forEach(item => {
    const { fecha, proj, socio, geo, sector, caso, subKey, indig, disc, preg, kits, p, comCounts } = item;
    let rec = 'NO';
    if(caso){
      if(!seenBySec.has(sector)) seenBySec.set(sector, new Set());
      const s = seenBySec.get(sector), ck = fold(caso);
      if(s.has(ck)) rec = 'SÍ'; else s.add(ck);
    }

    const ages = Array(18).fill(0);
    if(comCounts){
      ages[4] += comCounts.na;
      ages[5] += comCounts.no;
      ages[12] += comCounts.ma;
      ages[13] += comCounts.ha;
    } else {
      const a = bySub.get(subKey);
      const imp = mmImputePerson(p, a);
      if(imp.adj) ajustes.push(imp.adj);
      const bi = MAT_BANDS.findIndex(([,, lo, hi]) => imp.age >= lo && imp.age <= hi);
      if(bi >= 0) ages[bi * 2 + (imp.sexo === 'Mujer' ? 0 : 1)]++;
    }

    const k = [fecha || '', proj, socio, geo.estado, geo.mun, geo.parr, geo.com, sector, rec].join('|');
    let grp = grpMap.get(k);
    if(!grp){
      grp = { fecha:fecha||'', proj, socio, estado:geo.estado, mun:geo.mun, parr:geo.parr, com:geo.com, sector, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 };
      grpMap.set(k, grp);
    }
    grp.indig += indig; grp.disc += disc; grp.preg += preg; grp.kits += kits;
    ages.forEach((v, i) => { grp.ages[i] += v; });
  });

  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''));
  const outRows = [...grpMap.values()].sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.proj, b.proj) || cmp(a.socio, b.socio) || cmp(a.estado, b.estado) || cmp(a.mun, b.mun) || cmp(a.parr, b.parr) || cmp(a.com, b.com) || cmp(a.sector, b.sector) || cmp(a.rec, b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  return { outRows, omitted, ajustes };
}

function mmComputeActive(){
  if(MMAT.source === 'ims') return mmComputeIms();
  if(MMAT.source === 'kobo') return mmComputeKobo();
  return mmComputeGeneric();
}

function mmApportion(weights, target, caps){
  const n = weights.length;
  const out = Array(n).fill(0);
  if(!n || target <= 0) return out;
  const lim = caps ? caps.map(c => Math.max(0, Math.floor(c))) : Array(n).fill(Infinity);
  const w = weights.map((v, i) => (v > 0 && lim[i] > 0) ? v : 0);
  let maxCap = 0;
  for(let i = 0; i < n; i++){
    if(w[i] > 0) maxCap = (lim[i] === Infinity || maxCap === Infinity) ? Infinity : (maxCap + lim[i]);
  }
  const goal = Math.min(Math.floor(target), maxCap);
  let rem = goal;
  if(rem <= 0) return out;

  const active = [];
  for(let i = 0; i < n; i++) if(w[i] > 0) active.push(i);

  while(active.length && rem > 0){
    const sumW = active.reduce((s, i) => s + w[i], 0);
    if(sumW <= 0) break;
    let cappedAny = false;
    for(let k = active.length - 1; k >= 0; k--){
      const i = active[k];
      const exact = rem * (w[i] / sumW);
      const room = lim[i] - out[i];
      if(exact >= room){
        out[i] += room;
        rem -= room;
        active.splice(k, 1);
        cappedAny = true;
      }
    }
    if(!cappedAny) break;
  }

  if(!active.length || rem <= 0) return out;

  const sumW = active.reduce((s, i) => s + w[i], 0);
  if(sumW <= 0) return out;
  const fracs = active.map(i => {
    const q = rem * (w[i] / sumW);
    const fl = Math.min(Math.floor(q), lim[i] - out[i]);
    out[i] += fl;
    return { i, remFrac: q - fl, w: w[i] };
  });
  let left = goal - out.reduce((s, v) => s + v, 0);
  fracs.sort((a, b) => (b.remFrac - a.remFrac) || (b.w - a.w) || (a.i - b.i));
  for(let k = 0; k < fracs.length && left > 0; k++){
    const idx = fracs[k].i;
    if(out[idx] < lim[idx]){
      out[idx]++;
      left--;
    }
  }
  return out;
}

function mmScaleEcho25(res){
  const ratio = 0.25;
  if(!res || !res.outRows || !res.outRows.length){
    return {
      ...(res || { outRows: [], omitted: [], ajustes: [] }),
      echoMeta: { ratio, origPers: 0, scaledPers: 0, origRows: 0, scaledRows: 0, droppedRows: 0, origKits: 0, scaledKits: 0 }
    };
  }

  const rows = res.outRows.map(g => {
    let origF = 0, origM = 0;
    for(let bi = 0; bi < 9; bi++){
      origF += g.ages[bi * 2] || 0;
      origM += g.ages[bi * 2 + 1] || 0;
    }
    return {
      g,
      origF,
      origM,
      origPers: origF + origM,
      origIndig: g.indig || 0,
      origDisc: g.disc || 0,
      origPreg: g.preg || 0,
      origKits: g.kits || 0
    };
  });

  const totalPers = rows.reduce((s, r) => s + r.origPers, 0);
  const totalF = rows.reduce((s, r) => s + r.origF, 0);
  const totalM = rows.reduce((s, r) => s + r.origM, 0);
  const totalIndig = rows.reduce((s, r) => s + r.origIndig, 0);
  const totalDisc = rows.reduce((s, r) => s + r.origDisc, 0);
  const totalPreg = rows.reduce((s, r) => s + r.origPreg, 0);
  const totalKits = rows.reduce((s, r) => s + r.origKits, 0);

  const targetPers = Math.round(totalPers * ratio);
  const targetIndig = Math.round(totalIndig * ratio);
  const targetDisc = Math.round(totalDisc * ratio);
  const targetPreg = Math.round(totalPreg * ratio);
  const targetKits = Math.round(totalKits * ratio);

  const allocPers = mmApportion(rows.map(r => r.origPers), targetPers);

  // Conservar filas con >= 1 persona tras escalar, o filas de solo kits que originalmente tenían 0 personas
  const kept = [];
  rows.forEach((r, i) => {
    const tp = allocPers[i];
    if(tp > 0 || (r.origPers === 0 && r.origKits > 0)){
      kept.push({ ...r, targetPers: tp });
    }
  });

  // Distribución ponderada por sexo (consistente globalmente y por fila)
  const minF = kept.map(k => (k.origM === 0 && k.targetPers > 0) ? k.targetPers : 0);
  const maxF = kept.map(k => (k.origF === 0) ? 0 : k.targetPers);
  const minFSum = minF.reduce((s, v) => s + v, 0);
  const maxFSum = maxF.reduce((s, v) => s + v, 0);
  const [rawTargetF] = mmApportion([totalF, totalM], targetPers);
  const targetF = Math.max(minFSum, Math.min(maxFSum, rawTargetF));

  const extraCap = kept.map((k, i) => Math.max(0, maxF[i] - minF[i]));
  const extraW = kept.map((k, i) => (extraCap[i] > 0 && k.origPers > 0) ? (k.targetPers * (k.origF / k.origPers)) : 0);
  const extraF = mmApportion(extraW, Math.max(0, targetF - minFSum), extraCap);

  kept.forEach((k, i) => {
    k.rowF = minF[i] + extraF[i];
    k.rowM = k.targetPers - k.rowF;
  });

  // Distribución ponderada por vulnerabilidades y kits
  const allocIndig = mmApportion(kept.map(k => k.origIndig), targetIndig, kept.map(k => k.origIndig > 0 ? k.targetPers : 0));
  const allocDisc = mmApportion(kept.map(k => k.origDisc), targetDisc, kept.map(k => k.origDisc > 0 ? k.targetPers : 0));
  const allocPreg = mmApportion(kept.map(k => k.origPreg), targetPreg, kept.map(k => k.origPreg > 0 ? k.rowF : 0));
  const allocKits = mmApportion(kept.map(k => k.origKits), targetKits);

  const scaledRows = [];
  kept.forEach((k, i) => {
    const kits = allocKits[i];
    if(k.targetPers === 0 && kits === 0) return;

    const fBandsOrig = [], mBandsOrig = [];
    for(let bi = 0; bi < 9; bi++){
      fBandsOrig.push(k.g.ages[bi * 2] || 0);
      mBandsOrig.push(k.g.ages[bi * 2 + 1] || 0);
    }
    const fBandsNew = mmApportion(fBandsOrig, k.rowF);
    const mBandsNew = mmApportion(mBandsOrig, k.rowM);
    const newAges = Array(18).fill(0);
    for(let bi = 0; bi < 9; bi++){
      newAges[bi * 2] = fBandsNew[bi];
      newAges[bi * 2 + 1] = mBandsNew[bi];
    }

    scaledRows.push({
      ...k.g,
      indig: allocIndig[i],
      disc: allocDisc[i],
      preg: allocPreg[i],
      ages: newAges,
      kits
    });
  });

  const droppedRows = rows.length - scaledRows.length;
  const scaledPers = scaledRows.reduce((s, r) => s + r.ages.reduce((a, b) => a + b, 0), 0);
  const scaledKits = scaledRows.reduce((s, r) => s + (r.kits || 0), 0);
  const omitted = [...(res.omitted || [])];
  if(droppedRows > 0){
    omitted.push(`${fmt(droppedRows)} fila(s)/comunidad(es) omitida(s) al quedar con 0 personas tras el cálculo al 25% (ECHO Alert)`);
  }

  return {
    outRows: scaledRows,
    omitted,
    ajustes: res.ajustes || [],
    echoMeta: {
      ratio,
      origPers: totalPers,
      scaledPers,
      origRows: rows.length,
      scaledRows: scaledRows.length,
      droppedRows,
      origKits: totalKits,
      scaledKits
    }
  };
}

function mmLoadImsRegistro(wb, fileName){
  if(!famDetect(wb)) return { fatal:['El archivo no contiene las pestañas vzl_cases y beneficiaries_vzl del Registro de Familias.'] };
  const D = famLoad(wb, fileName);
  if(D.fatal && D.fatal.length) return D;
  const C = D.sheets && D.sheets.cases;
  const findExtraCol = (mach, lbl) => {
    if(!C) return -1;
    const mi = C.machine.indexOf(mach);
    if(mi >= 0) return mi;
    return C.labels.findIndex(l => fold(l) === fold(lbl));
  };
  const iExIdx = C && C.idx && C.idx.excel_index >= 0 ? C.idx.excel_index : findExtraCol('excel_index', 'Excel Index');
  const iOrgOtro = findExtraCol('organizacion_otro', 'Especifique la organización');
  const iComProc = findExtraCol('communities', 'Comunidad de procedencia');
  const iOtroAloja = findExtraCol('otro_aloja', 'Otros Alojamientos');
  const iSecProc = findExtraCol('sector', 'Sector de procedencia');

  const rawByN = new Map();
  if(C && C.rows) C.rows.forEach(x => rawByN.set(x.n, x.r));

  D.fams.forEach(f => {
    const rr = rawByN.get(f.n);
    const exIdx = rr && iExIdx >= 0 ? toNum(rr[iExIdx]) : null;
    const orgOtro = rr && iOrgOtro >= 0 ? toText(rr[iOrgOtro]) : '';
    const comProc = rr && iComProc >= 0 ? toText(rr[iComProc]) : '';
    const otroAloja = rr && iOtroAloja >= 0 ? toText(rr[iOtroAloja]) : '';
    const secProc = rr && iSecProc >= 0 ? toText(rr[iSecProc]) : '';
    f._excelIndex = exIdx;
    f.socio = (f.org && !['otro','otra'].includes(fold(f.org))) ? f.org : (orgOtro || f.org || '');
    f.comunidadEff = f.comunidad || comProc || f.alojamiento || otroAloja || secProc || '';
  });

  D.cfg = { name: 'Registro de Familias' };
  D.rows = D.fams;
  D.socioList = countBy(D.fams, f => f.socio || '(vacío)');
  D.valid = new Set(D.socioList.map(([s]) => fold(s)));
  return D;
}

function mmComputeImsRegistro(D){
  const seen = new Set(), grpMap = new Map(), adjSeen = new Set(), ajustes = [];
  let omitAloj = 0, omitSocio = 0, omitFecha = 0, omitSinPers = 0;
  const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : (MMAT.defProj || '');
  const sector = MMAT.imsSector || IMS_DEF_SECTOR.registro || 'Alojamiento';
  const sorted = D.fams.slice().sort((a, b) => (a.created || '').localeCompare(b.created || '') || a.n - b.n);

  sorted.forEach(f => {
    const alojGeo = MMAT.imsRegFilter === 'alojamientos' ? mmGetAlojGeo(f.alojamiento) : null;
    if(MMAT.imsRegFilter === 'alojamientos' && !alojGeo){ omitAloj++; return; }
    if(!D.valid.has(fold(f.socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!f.created || (MMAT.from && f.created < MMAT.from) || (MMAT.to && f.created > MMAT.to))){ omitFecha++; return; }

    const famKey = f.num != null && D.famByNum.get(f.num) === f ? f.num : f._excelIndex;
    const ps = (famKey != null ? D.byFam.get(famKey) : null) || [];
    if(!ps.length){ omitSinPers++; return; }

    const rawProj = MMAT.imsUseProjCol ? (f._colProyecto || '') : '';
    const proj = mmMapProjName(rawProj) || defP;
    const est = alojGeo ? alojGeo.estado : (f.estado || '');
    const mun = alojGeo ? alojGeo.mun : (f.municipio || '');
    const parr = alojGeo ? alojGeo.parr : (f.parroquia || '');
    const com = alojGeo ? alojGeo.nombre : (f.comunidadEff || '');
    const famCtx = { n: f.n, num: famKey || f.n, fecha: f.created || '', code: f.code || '', caso: f.code || '', ps };

    ps.forEach(p => {
      const pk = p.pid ? `id:${p.pid}` : `f:${p.fam ?? famKey}|${p.n}`;
      const rec = seen.has(pk) ? 'SÍ' : 'NO';
      seen.add(pk);

      const k = [f.created || '', proj, f.socio || '', est, mun, parr, com, sector, rec].join('|');
      let g = grpMap.get(k);
      if(!g){
        g = { fecha:f.created||'', proj, socio:f.socio||'', estado:est, mun, parr, com, sector, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 };
        grpMap.set(k, g);
      }

      if(isIndig(p)) g.indig++;
      if(fold(p.disc) === 'si' || (p.perfil && p.perfil.has('Persona con discapacidad'))) g.disc++;
      if(isPreg(p)) g.preg++;

      const imp = mmImputePerson(p, famCtx);
      if(imp.adj){
        const ak = `${f.n}|${p.n}`;
        if(!adjSeen.has(ak)){ adjSeen.add(ak); ajustes.push(imp.adj); }
      }
      const bi = MAT_BANDS.findIndex(([,, lo, hi]) => imp.age >= lo && imp.age <= hi);
      if(bi >= 0) g.ages[bi * 2 + (imp.sexo === 'Mujer' ? 0 : 1)]++;
    });
  });

  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''));
  const outRows = [...grpMap.values()].sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.proj, b.proj) || cmp(a.socio, b.socio) || cmp(a.estado, b.estado) || cmp(a.mun, b.mun) || cmp(a.parr, b.parr) || cmp(a.com, b.com) || cmp(a.sector, b.sector) || cmp(a.rec, b.rec));
  const omitted = [];
  if(omitAloj) omitted.push(`${fmt(omitAloj)} familia(s) fuera de los 5 alojamientos seleccionados`);
  if(omitSocio) omitted.push(`${fmt(omitSocio)} familia(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} familia(s) fuera del rango de fechas seleccionado`);
  if(omitSinPers) omitted.push(`${fmt(omitSinPers)} familia(s) sin integrantes vinculados en beneficiaries_vzl`);
  return { outRows, omitted, ajustes };
}

function mmComputeIms(){
  const t = MMAT.imsType, O = MMAT.imsObj;
  if(!t || !O || !O.rows) return null;
  let res;
  if(t === 'registro') res = mmComputeImsRegistro(O);
  else if(t === 'nfi' || t === 'wash') res = mmComputeImsKits(O);
  else if(t === 'comunitarias') res = mmComputeImsCom(O);
  else res = mmComputeImsSal(t, O);
  if(res && MMAT.imsScope === 'echo25') res = mmScaleEcho25(res);
  return res;
}

function mmComputeImsKits(N){
  const F = { ...N.filters, from: MMAT.from, to: MMAT.to };
  const seenBySec = { NFI: new Set(), WASH: new Set() }, grpMap = new Map(), adjSeen = new Set(), ajustes = [];
  let omitSocio = 0, omitFecha = 0, omitSinKits = 0;

  const pKey = p => p.pid ? `id:${p.pid}` : `f:${p.fam}|${p.n}`;
  const sorted = N.rows.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || a.n - b.n);

  sorted.forEach(a => {
    if(!N.valid.has(fold(a.socio || '(vacío)'))){ omitSocio++; return; }
    if((F.from || F.to) && (!a.fecha || (F.from && a.fecha < F.from) || (F.to && a.fecha > F.to))){ omitFecha++; return; }
    const items = a.items.filter(it => F.kcat.has(N.cat[it.ki]));
    if(!items.length){ omitSinKits++; return; }

    const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : (MMAT.defProj || '');
    const rowProj = MMAT.imsUseProjCol ? mmMapProjName(a._colProyecto) : '';
    const slices = new Map();
    items.forEach(it => {
      const sec = N.cat[it.ki] === 'WASH' ? 'WASH' : 'NFI';
      const mp = N.matProj && N.matProj[it.ki] !== undefined ? N.matProj[it.ki] : '';
      const kitProj = mp === 'Otro' ? ((N.matProjOtro && N.matProjOtro[it.ki] || '').trim() || 'Otro') : mp;
      const proj = MMAT.imsUseProjCol ? (rowProj || defP) : kitProj;
      const sk = `${proj}|${sec}`;
      slices.set(sk, { proj, sec, q: (slices.get(sk)?.q || 0) + it.q });
    });

    slices.forEach(({ proj, sec, q }) => {
      const seen = seenBySec[sec], psNo = [], psSi = [];
      (a.ps || []).forEach(p => { const pk = pKey(p); if(seen.has(pk)) psSi.push(p); else { seen.add(pk); psNo.push(p); } });
      const addBucket = (rec, ps, kitsQ) => {
        const k = [a.fecha || '', proj, a.socio || '', a.estado || '', a.municipio || '', a.parroquia || '', a.comunidad || '', sec, rec].join('|');
        let g = grpMap.get(k);
        if(!g){ g = { fecha:a.fecha||'', proj, socio:a.socio||'', estado:a.estado||'', mun:a.municipio||'', parr:a.parroquia||'', com:a.comunidad||'', sector:sec, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 }; grpMap.set(k, g); }
        g.kits += kitsQ;
        ps.forEach(p => {
          if(isIndig(p)) g.indig++;
          if(fold(p.disc) === 'si') g.disc++;
          if(isPreg(p)) g.preg++;
          const imp = mmImputePerson(p, a);
          if(imp.adj){
            const ak = `${a.n}|${p.n}`;
            if(!adjSeen.has(ak)){ adjSeen.add(ak); ajustes.push(imp.adj); }
          }
          const bi = MAT_BANDS.findIndex(([,, lo, hi]) => imp.age >= lo && imp.age <= hi);
          if(bi >= 0) g.ages[bi * 2 + (imp.sexo === 'Mujer' ? 0 : 1)]++;
        });
      };
      if(psNo.length){
        addBucket('NO', psNo, q);
        if(psSi.length) addBucket('SÍ', psSi, 0);
      } else if(psSi.length){
        addBucket('SÍ', psSi, q);
      } else {
        addBucket('NO', [], q);
      }
    });
  });

  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''));
  const outRows = [...grpMap.values()].sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.proj, b.proj) || cmp(a.socio, b.socio) || cmp(a.estado, b.estado) || cmp(a.mun, b.mun) || cmp(a.parr, b.parr) || cmp(a.com, b.com) || cmp(a.sector, b.sector) || cmp(a.rec, b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  if(omitSinKits) omitted.push(`${fmt(omitSinKits)} entrega(s) sin kits incluidos en las categorías seleccionadas`);
  return { outRows, omitted, ajustes };
}

function mmComputeImsSal(t, A){
  const seen = new Set(), grpMap = new Map(), adjSeen = new Set(), ajustes = [];
  let omitSocio = 0, omitFecha = 0;
  const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : (MMAT.defProj || '');
  const sector = MMAT.imsSector || IMS_DEF_SECTOR[t] || 'Salud';
  const sorted = A.rows.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || a.n - b.n);

  sorted.forEach(a => {
    if(!A.valid.has(fold(a.socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!a.fecha || (MMAT.from && a.fecha < MMAT.from) || (MMAT.to && a.fecha > MMAT.to))){ omitFecha++; return; }

    const rawProj = MMAT.imsUseProjCol ? (a._colProyecto || a.proyecto) : '';
    const proj = mmMapProjName(rawProj) || defP;
    const pk = a.p && a.p.pid ? `id:${a.p.pid}` : a.pkey;
    const rec = pk && seen.has(pk) ? 'SÍ' : 'NO';
    if(pk) seen.add(pk);

    const k = [a.fecha || '', proj, a.socio || '', a.estado || '', a.municipio || '', a.parroquia || '', a.comunidad || '', sector, rec].join('|');
    let g = grpMap.get(k);
    if(!g){ g = { fecha:a.fecha||'', proj, socio:a.socio||'', estado:a.estado||'', mun:a.municipio||'', parr:a.parroquia||'', com:a.comunidad||'', sector, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 }; grpMap.set(k, g); }

    const pMatched = a.p
      || (a.ps && a.ps.length === 1 ? a.ps[0] : null)
      || (a.ps && a.ps.filter(x => !x.name).length === 1 ? a.ps.find(x => !x.name) : null);
    const pObj = pMatched || { n: null, fam: a.num || 0, name: a.benef || '', sexo: null, birth: null, age: null, parentesco: '', rel: '', disc: null, indig: null, perfil: null };
    if(isIndig(pObj)) g.indig++;
    if(fold(pObj.disc) === 'si') g.disc++;
    if(isPreg(pObj)) g.preg++;

    const imp = mmImputePerson(pObj, a);
    if(imp.adj){
      const ak = `${a.n}|${pObj.n ?? 'nf'}`;
      if(!adjSeen.has(ak)){ adjSeen.add(ak); ajustes.push(imp.adj); }
    }
    const bi = MAT_BANDS.findIndex(([,, lo, hi]) => imp.age >= lo && imp.age <= hi);
    if(bi >= 0) g.ages[bi * 2 + (imp.sexo === 'Mujer' ? 0 : 1)]++;
    if(t === 'proteccion') g.kits += (a.kitEcho || 0) + (a.kitUs || 0) + (a.kitDhr || 0);
  });

  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''));
  const outRows = [...grpMap.values()].sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.proj, b.proj) || cmp(a.socio, b.socio) || cmp(a.estado, b.estado) || cmp(a.mun, b.mun) || cmp(a.parr, b.parr) || cmp(a.com, b.com) || cmp(a.sector, b.sector) || cmp(a.rec, b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  return { outRows, omitted, ajustes };
}

function mmComputeImsCom(C){
  const grpMap = new Map();
  let omitTipo = 0, omitSocio = 0, omitFecha = 0, omitCero = 0;
  const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : (MMAT.defProj || '');
  const secMap = { proteccion:'Protección', salud:'SMAPS', wash:'WASH' };

  C.rows.forEach(a => {
    if(!C.sel.has(a.type)){ omitTipo++; return; }
    if(!C.valid[a.type].has(fold(a.socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!a.fecha || (MMAT.from && a.fecha < MMAT.from) || (MMAT.to && a.fecha > MMAT.to))){ omitFecha++; return; }
    const tot = (a.ninas||0)+(a.ninos||0)+(a.mujeres||0)+(a.hombres||0)+(a.mujeres60||0)+(a.hombres60||0);
    if(!tot){ omitCero++; return; }

    const rawProj = MMAT.imsUseProjCol ? (a._colProyecto || a.proyecto) : '';
    const proj = mmMapProjName(rawProj) || defP;
    const sector = secMap[a.type] || 'Protección';
    const rec = fold(a.recurr) === 'si' ? 'SÍ' : 'NO';
    const k = [a.fecha || '', proj, a.socio || '', a.estado || '', a.municipio || '', a.parroquia || '', a.comunidad || '', sector, rec].join('|');
    let g = grpMap.get(k);
    if(!g){ g = { fecha:a.fecha||'', proj, socio:a.socio||'', estado:a.estado||'', mun:a.municipio||'', parr:a.parroquia||'', com:a.comunidad||'', sector, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 }; grpMap.set(k, g); }
    g.ages[4] += a.ninas || 0;      // Niñas 0-17 -> banda 10-11
    g.ages[5] += a.ninos || 0;      // Niños 0-17 -> banda 10-11
    g.ages[12] += a.mujeres || 0;   // Mujeres 18-59 -> banda 20-49
    g.ages[13] += a.hombres || 0;   // Hombres 18-59 -> banda 20-49
    g.ages[16] += a.mujeres60 || 0; // Mujeres 60+
    g.ages[17] += a.hombres60 || 0; // Hombres 60+
  });

  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''));
  const outRows = [...grpMap.values()].sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.proj, b.proj) || cmp(a.socio, b.socio) || cmp(a.estado, b.estado) || cmp(a.mun, b.mun) || cmp(a.parr, b.parr) || cmp(a.com, b.com) || cmp(a.sector, b.sector) || cmp(a.rec, b.rec));
  const omitted = [];
  if(omitTipo) omitted.push(`${fmt(omitTipo)} actividad(es) de tipo excluido`);
  if(omitSocio) omitted.push(`${fmt(omitSocio)} actividad(es) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} actividad(es) fuera del rango de fechas seleccionado`);
  if(omitCero) omitted.push(`${fmt(omitCero)} actividad(es) sin participantes registrados`);
  return { outRows, omitted, ajustes: [] };
}

function mmBuildSummary(res){
  if(!res || !res.outRows.length) return { html:'', plain:'' };
  const byProj = new Map();
  res.outRows.forEach(g => {
    const p = g.proj || 'Sin proyecto';
    if(!byProj.has(p)) byProj.set(p, []);
    byProj.get(p).push(g);
  });

  const omitTot = res.omitted.length ? `Se omitieron registros debido a: ${res.omitted.join('; ')}.` : 'No se omitieron registros durante el procesamiento.';
  const blocks = [...byProj.entries()].map(([proj, rows]) => {
    let ninas = 0, ninos = 0, mujeres = 0, hombres = 0, totalKits = 0;
    const secs = new Set(), dates = [];
    rows.forEach(g => {
      secs.add(g.sector);
      if(g.fecha) dates.push(g.fecha);
      totalKits += g.kits;
      for(let i = 0; i < 5; i++){ ninas += g.ages[i * 2]; ninos += g.ages[i * 2 + 1]; }
      for(let i = 5; i < 9; i++){ mujeres += g.ages[i * 2]; hombres += g.ages[i * 2 + 1]; }
    });
    dates.sort();
    const totPers = ninas + mujeres + ninos + hombres;
    const secTxt = [...secs].filter(Boolean).join(' y ') || 'NFIs';
    const perTxt = dates.length ? `en el período comprendido entre el ${dmy(dates[0])} y el ${dmy(dates[dates.length - 1])}` : 'para el período cargado';
    const body = `Se reportan ${fmt(totPers)} personas asistidas por entregas de ${secTxt} (${fmt(totalKits)} kits entregados), desagregadas en ${fmt(ninas)} niñas, ${fmt(mujeres)} mujeres, ${fmt(ninos)} niños y ${fmt(hombres)} hombres, en el marco del proyecto ${proj}, ${perTxt}. ${omitTot}`;
    return { proj, body };
  });

  const html = blocks.map(b => `<div style="margin-bottom:10px"><b>${esc(b.proj)}</b><br>${esc(b.body)}</div>`).join('');
  const plain = blocks.map(b => `${b.proj}\n${b.body}`).join('\n\n');
  return { html, plain };
}

function mmFillGeo(outRows){
  if(!outRows || !outRows.length) return;
  const dayN = d => d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? Math.round(Date.UTC(+d.slice(0,4), +d.slice(5,7)-1, +d.slice(8,10)) / 86400000) : null;
  const depth = g => (g.estado ? 1 : 0) + (g.mun ? 1 : 0) + (g.parr ? 1 : 0) + (g.com ? 1 : 0);
  const refs = outRows.filter(g => g.estado).map(g => ({
    g, d: depth(g), dn: dayN(g.fecha), sk: fold(g.socio || ''),
    fe: fold(g.estado), fm: fold(g.mun), fp: fold(g.parr)
  }));

  outRows.forEach(r => {
    const orig = { estado: !!r.estado, mun: !!r.mun, parr: !!r.parr, com: !!r.com };
    r._geo = {
      estado: orig.estado ? 'orig' : 'miss',
      mun: orig.mun ? 'orig' : 'miss',
      parr: orig.parr ? 'orig' : 'miss',
      com: orig.com ? 'orig' : 'miss'
    };
    if(orig.estado && orig.mun && orig.parr && orig.com) return;

    const applyIne = () => {
      if(typeof geoIneInfer !== 'function' || (r.estado && r.mun && r.parr)) return;
      const inf = geoIneInfer({ estado: r.estado, mun: r.mun, parr: r.parr, com: r.com });
      if(!r.estado && inf.estado){ r.estado = inf.estado; r._geo.estado = 'imp'; }
      if(!r.mun && inf.mun){ r.mun = inf.mun; r._geo.mun = 'imp'; }
      if(!r.parr && inf.parr){ r.parr = inf.parr; r._geo.parr = 'imp'; }
    };
    applyIne();
    if(r.estado && r.mun && r.parr && r.com) return;

    const rDepth = depth(r), rDn = dayN(r.fecha), rSk = fold(r.socio || '');
    const fe = fold(r.estado), fm = fold(r.mun), fp = fold(r.parr);

    const compat = refs.filter(c =>
      c.d > rDepth &&
      (!fe || c.fe === fe) &&
      (!fm || c.fm === fm) &&
      (!fp || c.fp === fp) &&
      (orig.estado || c.g.estado) &&
      (!orig.estado || orig.mun || c.g.mun) &&
      (!orig.mun || orig.parr || c.g.parr) &&
      (!orig.parr || orig.com || c.g.com)
    );

    if(compat.length){
      compat.sort((a, b) => {
        const sa = a.sk === rSk ? 0 : 1, sb = b.sk === rSk ? 0 : 1;
        if(sa !== sb) return sa - sb;
        const da = a.dn != null && rDn != null ? Math.abs(a.dn - rDn) : 999999;
        const db = b.dn != null && rDn != null ? Math.abs(b.dn - rDn) : 999999;
        if(da !== db) return da - db;
        return b.d - a.d;
      });
      const best = compat[0].g;
      if(!r.estado && best.estado) r.estado = best.estado;
      if(!r.mun && best.mun) r.mun = best.mun;
      if(!r.parr && best.parr) r.parr = best.parr;
      if(!r.com && best.com) r.com = best.com;
      ['estado','mun','parr','com'].forEach(k => {
        if(!orig[k]) r._geo[k] = r[k] ? 'imp' : 'miss';
      });
    }
    applyIne();
  });
}

async function mmExportMatrizExcel(res){
  if(!res || !res.outRows.length){ toast('No hay datos válidos para exportar.'); return; }
  const outRows = res.outRows.map(g => ({ ...g, ages: g.ages.slice() }));
  mmFillGeo(outRows);
  const headers = [
    'FECHA','PROYECTO','SOCIO','ESTADO','MUNICIPIO','PARROQUIA','COMUNIDAD','SECTOR',
    'NOMBRE DE LA ACTIVIDAD','INDICADOR 345W','INDICADOR DE CONVENIO','INDICADOR DEL PROYECTO',
    'Número de Población Indígena','Número de Personas con discapacidad','Número de Personas embarazadas o en lactancia',
    'RECURRENTES','TOTAL RECURRENTES',
    ...MAT_BANDS.flatMap(([f, m]) => [f, m]),
    'TOTAL PERSONAS','TOTAL SERVICIOS','TOTAL KITS'
  ];
  const tag = MMAT.from && MMAT.to ? `_${MMAT.from}_a_${MMAT.to}` : '';
  const alojTag = (MMAT.source === 'ims' && MMAT.imsType === 'registro' && MMAT.imsRegFilter === 'alojamientos') ? '_Alojamientos' : '';
  const echoTag = (MMAT.source === 'ims' && MMAT.imsScope === 'echo25') ? '_ECHO_25pct' : '';
  const fname = `Matriz_Monitoreo_${MMAT.source.toUpperCase()}${alojTag}${echoTag}${tag}.xlsx`;
  const matDate = ymdStr => {
    if(!ymdStr || !/^\d{4}-\d{2}-\d{2}$/.test(ymdStr)) return null;
    const [y, m, d] = ymdStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  if(window.ExcelJS){
    const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet('Matriz de monitoreo', { views:[{ state:'frozen', ySplit:1 }] });
    const thin = { style:'thin', color:{ argb:'FFCBD5E1' } }, box = { top:thin, left:thin, bottom:thin, right:thin };
    ws.columns = headers.map((h, i) => ({ width: i === 0 ? 14 : i < 8 ? 18 : i < 12 ? 22 : i < 17 ? 16 : i < 35 ? 14 : 15 }));
    const r1 = ws.getRow(1);
    headers.forEach((h, i) => { const c = r1.getCell(i + 1); c.value = h; c.font = { bold:true, color:{ argb:'FFFFFFFF' }, size:10 }; c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF0033A0' } }; c.alignment = { horizontal:'center', vertical:'middle', wrapText:true }; c.border = box; });
    r1.height = 34;
    outRows.forEach((g, idx) => {
      const rIdx = 2 + idx, r = ws.getRow(rIdx), totPers = g.ages.reduce((s, v) => s + v, 0);
      const vals = [
        matDate(g.fecha), g.proj, g.socio, g.estado, g.mun, g.parr, g.com, g.sector,
        null, null, null, null,
        g.indig, g.disc, g.preg, g.rec, null,
        ...g.ages,
        { formula:`SUM(R${rIdx}:AI${rIdx})`, result:totPers }, null, g.kits
      ];
      vals.forEach((v, ci) => {
        const c = r.getCell(ci + 1); c.value = v; c.border = box;
        if(ci === 0){ c.numFmt = 'dd/mm/yyyy'; c.alignment = { horizontal:'center' }; }
        if(ci >= 3 && ci <= 6 && g._geo){
          const gk = ['estado','mun','parr','com'][ci - 3], st = g._geo[gk];
          if(st === 'imp') c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFF6CC' } };
          else if(st === 'miss'){ c.value = null; c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFDE2E2' } }; }
        }
        if(ci >= 12 && ci !== 15 && ci !== 16 && ci !== 36) c.numFmt = '#,##0';
        if(ci === 15) c.alignment = { horizontal:'center' };
      });
    });
    ws.autoFilter = { from:{ row:1, column:1 }, to:{ row:Math.max(1, outRows.length + 1), column:headers.length } };
    const buf = await wb.xlsx.writeBuffer();
    await saveFile(fname, new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    return;
  }
  const wb = XLSX.utils.book_new();
  const aoa = [headers, ...outRows.map(g => [g.fecha || null, g.proj, g.socio, g.estado, g.mun, g.parr, g.com, g.sector, null, null, null, null, g.indig, g.disc, g.preg, g.rec, null, ...g.ages, g.ages.reduce((s, v) => s + v, 0), null, g.kits])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Matriz de monitoreo');
  await saveFile(fname, xlsxBlob(wb));
}

async function mmExportAjustesExcel(res){
  const list = res && res.ajustes ? res.ajustes : [];
  if(!list.length){ toast('No hubo personas con edad o sexo faltante que requirieran ajuste.'); return; }
  const tag = MMAT.from && MMAT.to ? `_${MMAT.from}_a_${MMAT.to}` : '';
  const fname = `Ajustes_Matriz_IMS${tag}.xlsx`;
  const headers = ['Fila en archivo IMS','Código de asistencia','Código de caso / familia','Fila en Registro (beneficiaries_vzl)','Persona','Parentesco','Dato faltante','Asignación realizada'];
  if(window.ExcelJS){
    const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet('Ajustes', { views:[{ state:'frozen', ySplit:1 }] });
    const thin = { style:'thin', color:{ argb:'FFCBD5E1' } }, box = { top:thin, left:thin, bottom:thin, right:thin };
    ws.columns = [{ width:18 },{ width:22 },{ width:24 },{ width:26 },{ width:30 },{ width:22 },{ width:16 },{ width:58 }];
    const r1 = ws.getRow(1);
    headers.forEach((h, i) => { const c = r1.getCell(i + 1); c.value = h; c.font = { bold:true, color:{ argb:'FFFFFFFF' }, size:10 }; c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF0033A0' } }; c.alignment = { horizontal:'center', vertical:'middle', wrapText:true }; c.border = box; });
    r1.height = 30;
    list.forEach((x, idx) => {
      const r = ws.getRow(2 + idx);
      [x.filaIms, x.codigoAsistencia, x.codigoCaso, x.filaRegistro, x.persona, x.parentesco, x.faltante, x.asignacion].forEach((v, ci) => {
        const c = r.getCell(ci + 1); c.value = v; c.border = box;
        if(ci === 0 || (ci === 3 && typeof v === 'number')) c.numFmt = '#,##0';
      });
    });
    ws.autoFilter = { from:{ row:1, column:1 }, to:{ row:Math.max(1, list.length + 1), column:headers.length } };
    const buf = await wb.xlsx.writeBuffer();
    await saveFile(fname, new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    return;
  }
  const wb = XLSX.utils.book_new();
  const aoa = [headers, ...list.map(x => [x.filaIms, x.codigoAsistencia, x.codigoCaso, x.filaRegistro, x.persona, x.parentesco, x.faltante, x.asignacion])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Ajustes');
  await saveFile(fname, xlsxBlob(wb));
}

function mmFieldDefaultHint(k, R, isKobo){
  if(!isKobo){
    if(k === 'proyecto') return 'Usará el «Proyecto por defecto» indicado arriba.';
    if(k === 'sector') return 'Usará el «Sector por defecto» indicado arriba.';
    if(['estado','municipio','parroquia','comunidad'].includes(k)) return 'Si falta, se inferirá de filas compatibles (amarillo pastel); si no, quedará en blanco (rojo pastel).';
    return '';
  }
  const hdrs = (R && (R.selectHeaders || R.headers)) || [];
  if(k === 'disc'){
    const wgCount = hdrs.filter(h => {
      const f = fold(h);
      return f.includes('dificultad para ver') || f.includes('dificultad para oir') || f.includes('dificultad para caminar')
        || f.includes('dificultad para recordar') || f.includes('autocuidado') || f.includes('cuidarse a si mismo')
        || f.includes('dificultad para comunicarse');
    }).length;
    return wgCount
      ? `Usará el criterio del Grupo de Washington («Tiene mucha dificultad» o «Le resulta imposible» en ${wgCount} preguntas detectadas).`
      : 'Sin preguntas del Grupo de Washington detectadas (se colocará 0).';
  }
  if(k === 'edad'){
    const birthCol = mmKoboFindCol(hdrs, f => f.includes('fecha de nacimiento'));
    return birthCol
      ? `Calculará la edad desde «${birthCol}»; si falta, se imputará según parentesco.`
      : 'Se imputará automáticamente según parentesco o contexto del hogar (registrado en Ajustes).';
  }
  if(k === 'sexo') return 'Se inferirá por embarazo/lactancia o por nombre (registrado en Ajustes).';
  if(k === 'proyecto') return 'Usará el «Proyecto por defecto» indicado arriba.';
  if(k === 'sector') return 'Usará el «Sector por defecto» indicado arriba.';
  if(['estado','municipio','parroquia'].includes(k)) return 'Si falta, se inferirá por socio/punto o filas compatibles (amarillo pastel); si no, quedará en blanco (rojo pastel).';
  if(k === 'comunidad') return 'Si falta, usará el punto específico (si aplica) o se inferirá; si no, quedará en blanco (rojo pastel).';
  if(['indig','preg','lact','kits'].includes(k)) return 'No se aplicará (se colocará 0).';
  return '';
}

function viewMatrizMonitoreo(){
  const srcCards = MMAT_SOURCES.map(s => {
    const on = MMAT.source === s.id;
    return `<button type="button" class="p-card" data-msrc="${s.id}" aria-pressed="${on}" style="text-align:left;cursor:pointer;${on ? 'border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft);background:var(--accent-soft)' : ''}">
      <div class="p-ch"><span class="p-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg></span><span class="chip-st ${on ? 'ok' : ''}">${esc(on ? 'Seleccionada' : s.tag)}</span></div>
      <h3 style="margin:8px 0 4px">${esc(s.name)}</h3>
      <p class="muted" style="margin:0;font-size:13px">${esc(s.desc)}</p>
    </button>`;
  }).join('');
  const srcInfo = MMAT_SOURCES.find(s => s.id === MMAT.source);
  let body = '';

  if(MMAT.source === 'ims'){
    if(MMAT.wb){
      body += `<div class="panel" style="margin-bottom:14px;border-left:4px solid var(--pri,#0033a0)">
        <div class="pj-fl" style="margin-bottom:4px">¿Para qué necesitas procesar este archivo?</div>
        <p style="margin:0 0 10px;font-size:13.5px">
          Elige si los datos se procesarán en modalidad <b>General (100%)</b> o para <b>ECHO Alert (25%)</b>.
          En <b>ECHO Alert</b> la data se recalcula entera al 25% mediante distribución ponderada (por comunidad, sexo, grupo etario, vulnerabilidades y kits), omitiendo las filas que queden en 0.
        </p>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button type="button" class="btn ${MMAT.imsScope === 'general' ? 'primary' : ''}" data-mmimsscope="general">General (100%)</button>
          <button type="button" class="btn ${MMAT.imsScope === 'echo25' ? 'primary' : ''}" data-mmimsscope="echo25">ECHO Alert (25%)</button>
        </div>
      </div>`;

      if(MMAT.imsType === 'registro'){
        const famsList = MMAT.imsObj && Array.isArray(MMAT.imsObj.fams) ? MMAT.imsObj.fams : [];
        const alojCount = famsList.filter(f => mmIsAllowedAloj(f.alojamiento)).length;
        body += `<div class="panel" style="margin-bottom:14px;border-left:4px solid var(--pri,#0033a0)">
          <div class="pj-fl" style="margin-bottom:4px">Alcance del Registro de Familias</div>
          <p style="margin:0 0 8px;font-size:13.5px">
            ¿Deseas procesar <b>toda la data</b> o <b>solo los alojamientos</b>?${famsList.length ? ` <span class="muted">(${fmt(alojCount)} de ${fmt(famsList.length)} familias coinciden en «Nombre del alojamiento»)</span>` : ''}
          </p>
          <p class="muted" style="margin:0 0 10px;font-size:12.5px">Alojamientos incluidos: ${IMS_REG_ALOJAMIENTOS.map(esc).join(' · ')}</p>
          <div class="row" style="gap:8px;flex-wrap:wrap">
            <button type="button" class="btn ${MMAT.imsRegFilter === 'all' ? 'primary' : ''}" data-mmregfilter="all">Toda la data</button>
            <button type="button" class="btn ${MMAT.imsRegFilter === 'alojamientos' ? 'primary' : ''}" data-mmregfilter="alojamientos">Solo alojamientos</button>
          </div>
        </div>`;
      }

      const regFilterPending = MMAT.imsType === 'registro' && MMAT.imsRegFilter === null;
      if(MMAT.imsScope === null || regFilterPending){
        const pendMsgs = [];
        if(MMAT.imsScope === null) pendMsgs.push('<b>General (100%)</b> o <b>ECHO Alert (25%)</b>');
        if(regFilterPending) pendMsgs.push('<b>Toda la data</b> o <b>Solo alojamientos</b>');
        body += `<div class="note warn" style="margin-bottom:14px">Selecciona arriba ${pendMsgs.join(' y ')} para continuar.</div>`;
      } else {
      const needsReg = NEEDS_REG.has(MMAT.imsType);
      const typeOpts = IMS_FORM_OPTS.map(([v, l]) => `<option value="${v}"${MMAT.imsType === v ? ' selected' : ''}>${esc(l)}${MMAT.imsDet === v ? ' (detectado)' : ''}</option>`).join('');
      body += `<div class="panel" style="margin-bottom:14px">
        <div class="row" style="justify-content:space-between;gap:12px;flex-wrap:wrap">
          <label class="pj-fg" style="width:auto;min-width:280px"><span class="pj-fl">Tipo de formulario IMS</span><select class="in" id="mmImsType">${typeOpts}</select></label>
          ${MMAT.imsDet === 'generic' ? `<span class="status warn">No se reconoció automáticamente; elige el formulario correcto.</span>` : ''}
        </div>
      </div>`;

      if(needsReg){
        const reg = S.registro;
        body += reg
          ? `<div class="panel" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><div><b>Registro de Familias vinculado</b><div class="muted" style="font-size:13.5px">${esc(reg.file)} · ${fmt(reg.fams.length)} familias · ${fmt(reg.pers.length)} personas</div></div><label class="btn sm"><input type="file" id="mmRegIn" accept=".xlsx,.xls" hidden>Cambiar Registro</label></div></div>`
          : `<div class="note bad" style="margin-bottom:12px">Este formulario requiere el <b>Registro de Familias</b> (pestañas <code>vzl_cases</code> y <code>beneficiaries_vzl</code>).</div>
             <div class="drop" id="mmRegDrop" tabindex="0" role="button" style="margin-bottom:14px"><strong>Carga aquí el Excel de Registro de Familias</strong><span>Descárgalo completo del IMS, sin filtros de fecha</span></div><input type="file" id="mmRegIn" accept=".xlsx,.xls" hidden>`;
      }

      const O = MMAT.imsObj;
      if(O && O.fatal && O.fatal.length){
        body += `<div class="note bad">Faltan columnas necesarias en el archivo del IMS: ${esc(O.fatal.join(', '))}. Verifica que el tipo de formulario seleccionado sea el correcto.</div>`;
      } else if(O && O.rows){
        const imsProjOptsHtml = val => [['', '— Dejar en blanco —'], ...MAT_PROJS.map(p => [p, p])]
          .map(([v, l]) => `<option value="${esc(v)}"${val === v ? ' selected' : ''}>${esc(l)}</option>`).join('');

        if(MMAT.imsProjCol){
          const pc = MMAT.imsProjCol;
          body += `<div class="panel" style="margin-bottom:14px;border-left:4px solid var(--pri,#0033a0)">
            <div class="pj-fl" style="margin-bottom:4px">Columna de proyecto detectada en el Excel</div>
            <p style="margin:0 0 10px;font-size:13.5px">
              Se identificó la columna <b>«${esc(pc.label)}»</b> (${fmt(pc.nonEmpty)} de ${fmt(pc.total)} registros con dato${pc.samples.length ? `; ej.: ${pc.samples.map(esc).join(', ')}` : ''}).
              ¿Esta columna será de donde se extraerá la información del proyecto?
            </p>
            <div class="row" style="gap:8px;flex-wrap:wrap">
              <button type="button" class="btn ${MMAT.imsUseProjCol === true ? 'primary' : ''}" data-mmuseprojcol="yes">Sí, extraer de esta columna</button>
              <button type="button" class="btn ${MMAT.imsUseProjCol === false ? 'primary' : ''}" data-mmuseprojcol="no">No, usar otro criterio</button>
            </div>
          </div>`;
        }

        const projPending = !!(MMAT.imsProjCol && MMAT.imsUseProjCol === null);
        const needFallback = !MMAT.imsUseProjCol || (MMAT.imsProjCol && MMAT.imsProjCol.nonEmpty < MMAT.imsProjCol.total);
        const fallbackLabel = MMAT.imsUseProjCol
          ? 'Proyecto para filas con la columna en blanco (opcional)'
          : 'Proyecto (especificar o dejar en blanco)';
        const defProjHtml = needFallback
          ? `<label class="pj-fg" style="max-width:340px"><span class="pj-fl">${fallbackLabel}</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <select class="in" id="mmDefProj">${imsProjOptsHtml(MMAT.defProj)}</select>
                <input type="text" class="in" id="mmDefProjOtro" value="${esc(MMAT.defProjOtro)}" placeholder="Escribir proyecto…" style="min-width:140px;${MMAT.defProj === 'Otro' ? '' : 'display:none'}">
              </div>
            </label>`
          : `<div class="pj-fg"><span class="pj-fl">Proyecto</span><div class="muted" style="font-size:13.5px;padding-top:6px">Se extraerá de la columna <b>«${esc(MMAT.imsProjCol.label)}»</b>.</div></div>`;

        if(projPending){
          body += `<div class="note warn" style="margin-bottom:14px">Responde arriba si deseas extraer el proyecto desde la columna <b>«${esc(MMAT.imsProjCol.label)}»</b> para continuar con la configuración.</div>`;
        } else if(MMAT.imsType === 'nfi' || MMAT.imsType === 'wash'){
          const activeKits = O.kits.map((k, i) => ({ k, i })).filter(x => x.k.total > 0).sort((a, b) => b.k.total - a.k.total);
          const unmappedCount = activeKits.filter(({ i }) => !O.matProj[i]).length;
          const kitRows = activeKits.map(({ k, i }) => {
            const projCell = MMAT.imsUseProjCol
              ? `<td><span class="muted" style="font-size:13px">Según columna «${esc(MMAT.imsProjCol.label)}»</span></td>`
              : `<td><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <select class="in" data-mmproj="${i}">${imsProjOptsHtml(O.matProj[i] || '')}</select>
                <input type="text" class="in" data-mmproj-otro="${i}" value="${esc(O.matProjOtro[i] || '')}" placeholder="Escribir proyecto…" style="min-width:140px;${O.matProj[i] === 'Otro' ? '' : 'display:none'}">
              </div></td>`;
            return `<tr>
              <td style="white-space:normal">${esc(k.name)}</td>
              <td class="num">${fmt(k.total)}</td>
              ${projCell}
              <td><select class="in kitcat kitcat-${O.cat[i].toLowerCase()}" data-mmcat="${i}">${['NFI','WASH','Otro'].map(c => `<option ${O.cat[i] === c ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
            </tr>`;
          }).join('');
          const kitProjNote = MMAT.imsUseProjCol
            ? `El proyecto se extraerá de la columna <b>«${esc(MMAT.imsProjCol.label)}»</b>.`
            : unmappedCount > 0
              ? `Se identificó el proyecto por el nombre del kit cuando fue posible (ECHO → <b>ECHO ALERT</b>, DHR/US → <b>DHR Emergencia</b>). En ${fmt(unmappedCount)} kit(s) sin proyecto en el nombre se dejó en blanco; puedes especificarlo en la tabla o dejarlo en blanco.`
              : `Los proyectos se identificaron automáticamente a partir del nombre de cada kit (ECHO → <b>ECHO ALERT</b>, DHR/US → <b>DHR Emergencia</b>).`;
          body += `<h2>Configuración de kits (NFI / WASH) y Proyecto</h2>
          <div class="panel">
            <p class="muted" style="margin:0 0 10px;font-size:13.5px">${esc(O.cfg.catNote)} ${kitProjNote}</p>
            ${MMAT.imsUseProjCol && MMAT.imsProjCol.nonEmpty < MMAT.imsProjCol.total ? `<div style="margin-bottom:12px">${defProjHtml}</div>` : ''}
            <div class="scroll"><table class="kits"><thead><tr><th>Kit</th><th class="num">Cantidad</th><th>Proyecto</th><th>Tipo</th></tr></thead><tbody>${kitRows}</tbody></table></div>
          </div>`;
        } else if(MMAT.imsType === 'comunitarias'){
          body += `<h2>Configuración de Actividades comunitarias</h2>
          <div class="panel" style="margin-bottom:14px">
            <div style="margin-bottom:12px">${defProjHtml}</div>
            <p class="muted" style="margin:0 0 6px;font-size:13.5px">Tipos de actividad a incluir:</p>
            ${O.types.map(tp => `<label class="check"><input type="checkbox" data-mmcomt="${tp.id}" ${O.sel.has(tp.id) ? 'checked' : ''}> ${esc(tp.label)} <span class="muted">(${fmt(tp.count)} actividades)</span></label>`).join('')}
          </div>`;
        } else {
          const secOpts = ['Alojamiento','CCCM','Protección','Salud','SMAPS','NFI','WASH'];
          body += `<h2>Configuración de ${esc(O.cfg.name)}</h2>
          <div class="panel" style="margin-bottom:14px">
            <div class="grid2" style="gap:12px">
              ${defProjHtml}
              <label class="pj-fg"><span class="pj-fl">Sector en la Matriz</span>
                <select class="in" id="mmImsSector">${secOpts.map(s => `<option ${MMAT.imsSector === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
              </label>
            </div>
          </div>`;
        }

        if(MMAT.imsType === 'comunitarias'){
          body += `<h2>Socios implementadores válidos</h2><div class="panel">
            <p class="muted" style="margin:0 0 8px;font-size:13.5px">Desmarca los socios errados o que no deben incluirse en la Matriz de monitoreo.</p>
            ${O.types.filter(tp => O.sel.has(tp.id)).map(tp => `<h3 style="margin:10px 0 6px;font-size:14px">${esc(tp.name)}</h3>${O.socios[tp.id].map(([x, c]) => `<label class="check"><input type="checkbox" data-mmcomsoc="${tp.id}|${esc(fold(x))}" ${O.valid[tp.id].has(fold(x)) ? 'checked' : ''}> ${esc(x)} <span class="muted">(${fmt(c)} actividades)</span></label>`).join('')}`).join('')}
          </div>`;
        } else {
          body += `<h2>Socios implementadores válidos</h2>
          <div class="panel">
            <p class="muted" style="margin:0 0 8px;font-size:13.5px">Desmarca los socios errados o que no deben incluirse en la Matriz de monitoreo.</p>
            <div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" id="mmSocAll">Seleccionar todos</button><button class="btn sm" type="button" id="mmSocNone">Quitar todos</button></div>
            ${O.socioList.map(([x, c]) => `<label class="check"><input type="checkbox" data-mmsoc value="${esc(fold(x))}" ${O.valid.has(fold(x)) ? 'checked' : ''}> ${esc(x)} <span class="muted">(${fmt(c)} registros)</span></label>`).join('')}
          </div>`;
        }
      }
      }
    }
  } else if(MMAT.raw && (MMAT.source !== 'kobo' || MMAT.koboReady)){
    const R = MMAT.raw, M = MMAT.map, isKobo = MMAT.source === 'kobo';
    const fields = isKobo ? MMAT_KOBO_FIELDS : MMAT_FIELDS;
    const baseHdrs = isKobo ? (R.selectHeaders || R.headers) : R.headers;
    const optsFor = (f, cur) => {
      const hdrs = isKobo ? mmKoboFieldHeaders(f, baseHdrs, R.headers) : baseHdrs;
      return `<option value="">— No aplica / usar defecto —</option><option value="__manual__"${cur === '__manual__' ? ' selected' : ''}>— Opción manual (valor fijo) —</option>${hdrs.map(h => `<option value="${esc(h)}"${cur === h ? ' selected' : ''}>${esc(h)}</option>`).join('')}`;
    };
    const linkMsg = R.linkedInfo
      ? `Hojas vinculadas automáticamente: <b>${esc(R.linkedInfo.parentSheet)}</b> (${fmt(R.linkedInfo.parentCount)} envíos, <code>_id</code>) ↔ <b>${esc(R.linkedInfo.childSheet)}</b> (${fmt(R.linkedInfo.childCount)} individuos, <code>_submission__id</code>).`
      : `Hoja leída: <b>${esc(R.sheet)}</b> · ${fmt(R.rows.length)} filas.`;
    const xfMsg = isKobo && (MMAT.xlsform || R.xlsform)
      ? ` XLSForm activo: <b>${esc((MMAT.xlsform || R.xlsform).fileName)}</b> (${fmt((MMAT.xlsform || R.xlsform).calcCount)} cálculos y ${fmt((MMAT.xlsform || R.xlsform).metaCount)} metadatos excluidos).`
      : (isKobo ? ' Metadatos y cálculos de Kobo ocultos automáticamente.' : '');
    const projSugs = [...new Set([
      ...(typeof PROYECTOS !== 'undefined' && Array.isArray(PROYECTOS) ? PROYECTOS.map(p => p.n || p.nombre || p.codigo).filter(Boolean) : []),
      ...MAT_PROJS.filter(p => p !== 'Otro')
    ])];
    const secSugs = ['Protección','Salud','SMAPS','WASH','NFI','Educación','Seguridad Alimentaria','Alojamiento'];
    body += `<h2 id="mmKoboColsH">Confirmación de columnas (${esc(MMAT.source.toUpperCase())})</h2>
    <div class="panel">
      <p class="muted" style="margin:0 0 10px;font-size:13.5px">${linkMsg}${xfMsg} Confirma cada columna o elige <b>Opción manual</b> para escribir un valor fijo:</p>
      <div class="grid2" style="gap:10px;margin-bottom:12px">
        <label class="pj-fg"><span class="pj-fl">Proyecto por defecto (si falta columna)</span>
          <input type="text" class="in" id="mmDefProjFree" list="mmProjDatalist" value="${esc(MMAT.defProj)}" placeholder="Escribir nombre o código del proyecto…">
          <datalist id="mmProjDatalist">${projSugs.map(p => `<option value="${esc(p)}">`).join('')}</datalist>
        </label>
        <label class="pj-fg"><span class="pj-fl">Sector por defecto (si falta columna)</span>
          <input type="text" class="in" id="mmDefSecFree" list="mmSecDatalist" value="${esc(MMAT.defSector)}" placeholder="Ej. Protección, Salud, WASH, NFI…">
          <datalist id="mmSecDatalist">${secSugs.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        </label>
      </div>
      <div class="scroll"><table class="ledger"><thead><tr><th>Campo de la Matriz</th><th>Columna en el archivo / Opción manual</th></tr></thead><tbody>
        ${fields.map(f => {
          const cur = M[f.k] || '';
          const manVal = MMAT.manual[f.k] || '';
          const hint = mmFieldDefaultHint(f.k, R, isKobo);
          return `<tr><td>${esc(f.l)}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><select class="in" data-mmap="${f.k}" style="flex:1;min-width:200px">${optsFor(f, cur)}</select><input type="text" class="in" data-mmanual="${f.k}" value="${esc(manVal)}" placeholder="Valor fijo para todas las filas…" style="flex:1;min-width:170px;${cur === '__manual__' ? '' : 'display:none'}"></div>${hint ? `<div class="muted" data-mhint="${f.k}" style="font-size:12px;margin-top:4px;${cur === '' ? '' : 'display:none'}">${esc(hint)}</div>` : ''}</td></tr>`;
        }).join('')}
      </tbody></table></div>
    </div>`;
    if(M.socio && M.socio !== '__manual__' && MMAT.socioList.length){
      body += `<h2>Socios implementadores válidos</h2><div class="panel">
        <div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" id="mmSocAll">Seleccionar todos</button><button class="btn sm" type="button" id="mmSocNone">Quitar todos</button></div>
        ${MMAT.socioList.map(([x, c]) => `<label class="check"><input type="checkbox" data-mmsoc value="${esc(fold(x))}" ${MMAT.validSocios.has(fold(x)) ? 'checked' : ''}> ${esc(x)} <span class="muted">(${fmt(c)} registros)</span></label>`).join('')}
      </div>`;
    }
  }

  const excelVal = MMAT.source === 'excel' && MMAT.raw ? mmExcelValidation() : null;
  if(MMAT.source === 'excel' && MMAT.raw && excelVal){
    const cat = _mmGeoCatalog();
    const g = MMAT.excelGeo;
    const muns = g.estado ? cat.muns(g.estado) : [];
    const parrs = (g.estado && g.mun) ? cat.parrs(g.estado, g.mun) : [];
    const coms = (g.estado && g.mun && g.parr) ? cat.coms(g.estado, g.mun, g.parr) : [];
    const showCustomCom = g.com === '__custom__' || (g.parr && coms.length === 0 && g.com !== '');

    body += `<h2>Verificación y datos faltantes (EXCEL)</h2>
    <div class="panel" style="margin-bottom:14px">`;

    if(!excelVal.hasBands){
      body += `<div style="margin-bottom:14px">
        <div class="pj-fl" style="margin-bottom:6px">Forma de contar asistencias / personas</div>
        <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">
          <select class="in" id="mmExcelCountMode" style="min-width:260px">
            <option value=""${!excelVal.mode ? ' selected' : ''}>— Seleccionar cómo contar asistencias —</option>
            <option value="row"${excelVal.mode === 'row' ? ' selected' : ''}>1 persona por cada fila (${fmt(MMAT.raw.rows.length)} filas)</option>
            <option value="col"${excelVal.mode === 'col' ? ' selected' : ''}${excelVal.hasTotalCol ? '' : ' disabled'}>Usar columna «Total personas / asistencias»${excelVal.hasTotalCol ? '' : ' (no mapeada)'}</option>
            <option value="fixed"${excelVal.mode === 'fixed' ? ' selected' : ''}>Cantidad fija de personas por fila</option>
          </select>
          <input type="number" class="in" id="mmExcelFixedCount" min="1" value="${esc(MMAT.excelFixedCount || 1)}" style="width:110px;${excelVal.mode === 'fixed' ? '' : 'display:none'}" aria-label="Personas por fila">
        </div>
      </div>`;
    } else {
      body += `<div class="note ok" style="margin-bottom:12px">Se detectaron columnas de desagregación por bandas de edad y sexo.</div>`;
    }

    if(excelVal.needGeo){
      body += `<div style="margin-bottom:14px">
        <div class="pj-fl" style="margin-bottom:4px">Ubicación geográfica (desplegables condicionados)</div>
        <p class="muted" style="margin:0 0 10px;font-size:13px">Faltan datos de ubicación en el archivo. Selecciona Estado, Municipio, Parroquia y Comunidad para completar las filas sin ubicación:</p>
        <div class="grid2" style="gap:10px">
          <label class="pj-fg"><span class="pj-fl">Estado${excelVal.needEst ? ' *' : ' (filtro)'}</span>
            <select class="in" id="mmGeoEst">
              <option value="">— Seleccionar estado —</option>
              ${cat.estados.map(e => `<option value="${esc(e)}"${g.estado === e ? ' selected' : ''}>${esc(e)}</option>`).join('')}
            </select>
          </label>
          <label class="pj-fg"><span class="pj-fl">Municipio${excelVal.needMun ? ' *' : ' (filtro)'}</span>
            <select class="in" id="mmGeoMun" ${g.estado ? '' : 'disabled'}>
              <option value="">— Seleccionar municipio —</option>
              ${muns.map(m => `<option value="${esc(m)}"${g.mun === m ? ' selected' : ''}>${esc(m)}</option>`).join('')}
            </select>
          </label>
          <label class="pj-fg"><span class="pj-fl">Parroquia${excelVal.needParr ? ' *' : ' (filtro)'}</span>
            <select class="in" id="mmGeoParr" ${g.mun ? '' : 'disabled'}>
              <option value="">— Seleccionar parroquia —</option>
              ${parrs.map(p => `<option value="${esc(p)}"${g.parr === p ? ' selected' : ''}>${esc(p)}</option>`).join('')}
            </select>
          </label>
          <label class="pj-fg"><span class="pj-fl">Comunidad${excelVal.needCom ? ' *' : ''}</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <select class="in" id="mmGeoCom" ${g.parr ? '' : 'disabled'} style="flex:1;min-width:180px">
                <option value="">— Seleccionar comunidad —</option>
                ${coms.map(c => `<option value="${esc(c)}"${g.com === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}
                <option value="__custom__"${g.com === '__custom__' ? ' selected' : ''}>— Otra / escribir manualmente —</option>
              </select>
              <input type="text" class="in" id="mmGeoComCustom" value="${esc(g.comCustom || '')}" placeholder="Escribir comunidad…" style="flex:1;min-width:160px;${showCustomCom ? '' : 'display:none'}">
            </div>
          </label>
        </div>
      </div>`;
    }

    if(excelVal.needAgeRand){
      body += `<div style="margin-bottom:14px">
        <div class="pj-fl" style="margin-bottom:4px">Asignación de edades faltantes</div>
        <p class="muted" style="margin:0 0 8px;font-size:13px">No se detectó columna de edad. Activa la asignación aleatoria e indica el rango de edades:</p>
        <label class="check" style="font-weight:500;margin-bottom:8px">
          <input type="checkbox" id="mmExcelAgeRand" ${MMAT.excelAgeRand ? 'checked' : ''}>
          Asignar edades de manera aleatoria
        </label>
        <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;${MMAT.excelAgeRand ? '' : 'opacity:.6'}">
          <label class="pj-fg" style="width:auto"><span class="pj-fl">Edad desde</span><input type="number" class="in" id="mmExcelAgeMin" min="0" max="110" value="${esc(MMAT.excelAgeMin)}" style="width:100px" ${MMAT.excelAgeRand ? '' : 'disabled'}></label>
          <label class="pj-fg" style="width:auto"><span class="pj-fl">Edad hasta</span><input type="number" class="in" id="mmExcelAgeMax" min="0" max="110" value="${esc(MMAT.excelAgeMax)}" style="width:100px" ${MMAT.excelAgeRand ? '' : 'disabled'}></label>
        </div>
      </div>`;
    }

    if(excelVal.needSexAssign){
      const sexOpts = [
        ['', '— Seleccionar cómo asignar el sexo —'],
        ['random', 'Totalmente aleatorio'],
        ['equal', 'Proporciones iguales (50% mujeres / 50% hombres)'],
        ['all_f', 'Todas mujeres (100% Mujeres)'],
        ['all_m', 'Todos hombres (100% Hombres)'],
        ['maj_f', 'Mayoritariamente mujeres (~70% Mujeres / 30% Hombres)'],
        ['maj_m', 'Mayoritariamente hombres (~70% Hombres / 30% Mujeres)']
      ];
      body += `<div style="margin-bottom:14px">
        <div class="pj-fl" style="margin-bottom:4px">Asignación de sexo faltante</div>
        <p class="muted" style="margin:0 0 8px;font-size:13px">${excelVal.hasNames ? 'Se intentará inferir el sexo desde la columna de nombres; cuando no se reconozca, se aplicará esta regla:' : 'No se detectó columna de sexo ni nombres para inferirlo. Selecciona cómo asignar el sexo:'}</p>
        <select class="in" id="mmExcelSexMode" style="max-width:460px">
          ${sexOpts.map(([v, l]) => `<option value="${v}"${MMAT.excelSexMode === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}
        </select>
      </div>`;
    }

    if(!excelVal.ok){
      body += `<div class="note bad" style="margin-bottom:12px">No puedes avanzar todavía. Falta indicar: <b>${esc(excelVal.missing.join(' · '))}</b>.</div>`;
    } else {
      body += `<div class="note ok" style="margin-bottom:12px">Datos mínimos verificados (${fmt(MMAT.raw.rows.length)} filas listas para procesar).</div>`;
    }
    body += `<button class="btn primary" type="button" id="mmExcelAdvance" ${excelVal.ok ? '' : 'disabled'}>${MMAT.excelReady && excelVal.ok ? 'Actualizar periodo y exportación' : 'Avanzar a periodo y exportación →'}</button>
    </div>`;
  }

  const res = mmReadyForCompute(excelVal) ? mmComputeActive() : null;
  const hasOutput = res && res.outRows.length > 0;
  const hasAdj = (MMAT.source === 'ims' || MMAT.source === 'kobo' || MMAT.source === 'excel') && res && res.ajustes && res.ajustes.length > 0;

  let exportHtml = '';
  if(res){
    const echoNoteHtml = res.echoMeta ? mmEchoSummaryHtml(res.echoMeta) : '';
    exportHtml = `<h2>Periodo y exportación</h2>
    <div class="panel" style="margin-bottom:14px">
      <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end">
        <label class="pj-fg" style="width:auto"><span class="pj-fl">Fecha desde</span><input type="date" class="in" id="mmFrom" value="${esc(MMAT.from)}"${MMAT.minDate ? ` min="${esc(MMAT.minDate)}"` : ''}${MMAT.maxDate ? ` max="${esc(MMAT.maxDate)}"` : ''}></label>
        <label class="pj-fg" style="width:auto"><span class="pj-fl">Fecha hasta</span><input type="date" class="in" id="mmTo" value="${esc(MMAT.to)}"${MMAT.minDate ? ` min="${esc(MMAT.minDate)}"` : ''}${MMAT.maxDate ? ` max="${esc(MMAT.maxDate)}"` : ''}></label>
        <button class="btn sm" type="button" id="mmClearDates">Todo el periodo</button>
        ${MMAT.minDate && MMAT.maxDate ? `<span class="muted" style="font-size:12.5px">Rango disponible: ${esc(dmy(MMAT.minDate))} – ${esc(dmy(MMAT.maxDate))}</span>` : ''}
      </div>
    </div>
    <div id="mmEchoSummary">${echoNoteHtml}</div>
    <div class="exp" style="margin-top:12px">
      <h3>Matriz de monitoreo${MMAT.source === 'ims' && MMAT.imsScope === 'echo25' ? ' · ECHO Alert (25%)' : ''}</h3>
      <p class="muted" id="mmExportDesc">${hasOutput ? `${fmt(res.outRows.length)} fila(s) listas para exportar en el formato oficial de la Matriz de monitoreo.` : 'No hay filas válidas con los filtros y socios seleccionados.'}</p>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <button class="btn primary" type="button" id="mmExportBtn" ${hasOutput ? '' : 'disabled'}>Descargar Excel</button>
        ${(MMAT.source === 'ims' || MMAT.source === 'kobo' || MMAT.source === 'excel') ? `<button class="btn" type="button" id="mmExportAdj" ${hasAdj ? '' : 'disabled'}>Descargar ajustes${res.ajustes ? ` (${fmt(res.ajustes.length)})` : ''}</button>` : ''}
      </div>
    </div>`;
  }

  const koboXlsHtml = MMAT.source === 'kobo' ? (() => {
    const xf = MMAT.xlsform || (MMAT.raw && MMAT.raw.xlsform) || null;
    const canAdv = !!(MMAT.file && MMAT.wb);
    return `<h2>2b. XLSForm del formulario (opcional)</h2>
    <div class="drop" id="mmXlsDrop" tabindex="0" role="button" style="margin-bottom:12px;padding:16px">
      <strong>${xf ? esc(xf.fileName) : 'Arrastra aquí el XLSForm de Kobo o haz clic para seleccionarlo'}</strong>
      <span>${xf ? `Activo (${fmt(xf.qCount)} preguntas, ${fmt(xf.calcCount)} cálculos y ${fmt(xf.metaCount)} metadatos excluidos). Haz clic o arrastra para reemplazar.` : 'Opcional: ayuda al sistema a identificar preguntas y ocultar cálculos/metadatos antes de avanzar (.xlsx, .xls)'}</span>
    </div>
    <input type="file" id="mmXlsIn" accept=".xlsx,.xls" hidden>
    <div class="row" style="gap:10px;margin-bottom:18px;align-items:center;flex-wrap:wrap">
      <button class="btn primary" type="button" id="mmKoboAdvance" ${canAdv ? '' : 'disabled'}>${MMAT.koboReady ? 'Volver a analizar columnas' : 'Avanzar y analizar columnas →'}</button>
      ${xf ? `<button class="btn sm" type="button" id="mmXlsClear">Quitar XLSForm</button>` : ''}
      ${!canAdv ? `<span class="muted" style="font-size:12.5px">Carga primero el archivo de datos de Kobo para poder avanzar.</span>` : ''}
    </div>`;
  })() : '';

  return `<div class="portal">
    <section class="p-hero pj-hero">
      <div>
        <h1>Matriz de monitoreo</h1>
        <p>Genera el Excel de la Matriz de monitoreo a partir de descargas del IMS, KoboToolbox o archivos Excel.</p>
      </div>
    </section>

    <h2 style="margin-top:0">1. Fuente de datos</h2>
    <div class="p-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-bottom:18px">${srcCards}</div>

    <h2>2. Cargar archivo (${esc(srcInfo.name)})</h2>
    <div class="drop" id="mmFileDrop" tabindex="0" role="button" style="margin-bottom:12px">
      <strong>${MMAT.file ? esc(MMAT.file.name) : `Arrastra aquí el archivo de ${esc(srcInfo.name)} o haz clic para seleccionarlo`}</strong>
      <span>${MMAT.file ? 'Haz clic para reemplazar el archivo cargado' : 'Formatos compatibles: .xlsx, .xls, .csv'}</span>
    </div>
    <input type="file" id="mmFileIn" accept=".xlsx,.xls,.xlsm,.csv" hidden>
    ${koboXlsHtml}

    ${body}
    ${exportHtml}
  </div>`;
}

function mmEchoSummaryHtml(em){
  if(!em) return '';
  const kitsPart = em.origKits > 0 ? ` · <b>${fmt(em.scaledKits)}</b> de ${fmt(em.origKits)} kits` : '';
  const dropPart = em.droppedRows > 0 ? ` (${fmt(em.droppedRows)} omitida(s) por quedar en 0)` : '';
  return `<div class="note ok" style="margin-bottom:12px"><b>Modo ECHO Alert (25%):</b> <b>${fmt(em.scaledPers)}</b> personas al 25% (de ${fmt(em.origPers)} originales)${kitsPart} · <b>${fmt(em.scaledRows)}</b> de ${fmt(em.origRows)} fila(s) conservada(s)${dropPart}.</div>`;
}

function mmReadyForCompute(excelVal){
  if(MMAT.source === 'ims'){
    if(MMAT.imsScope === null) return false;
    if(MMAT.imsType === 'registro' && MMAT.imsRegFilter === null) return false;
    return !(MMAT.imsProjCol && MMAT.imsUseProjCol === null);
  }
  if(MMAT.source === 'kobo') return !!MMAT.koboReady;
  if(MMAT.source === 'excel') return !!(MMAT.excelReady && excelVal && excelVal.ok);
  return true;
}

function mmRefreshOutput(){
  const excelVal = MMAT.source === 'excel' && MMAT.raw ? mmExcelValidation() : null;
  const res = mmReadyForCompute(excelVal) ? mmComputeActive() : null;
  const hasOutput = res && res.outRows.length > 0;
  const exBtn = $('#mmExportBtn'), adjBtn = $('#mmExportAdj');
  const descEl = $('#mmExportDesc'), echoEl = $('#mmEchoSummary');
  if(exBtn) exBtn.disabled = !hasOutput;
  if(descEl){
    descEl.textContent = hasOutput
      ? `${fmt(res.outRows.length)} fila(s) listas para exportar en el formato oficial de la Matriz de monitoreo.`
      : 'No hay filas válidas con los filtros y socios seleccionados.';
  }
  if(echoEl) echoEl.innerHTML = res && res.echoMeta ? mmEchoSummaryHtml(res.echoMeta) : '';
  if(adjBtn && res && res.ajustes){
    adjBtn.disabled = !res.ajustes.length;
    adjBtn.textContent = `Descargar ajustes (${fmt(res.ajustes.length)})`;
  }
}

function mmGetImsSheetName(wb, t, obj){
  if(t === 'registro' && obj && obj.sheets && obj.sheets.cases && wb.Sheets[obj.sheets.cases.name]) return obj.sheets.cases.name;
  if(obj && obj.sheet && wb.Sheets[obj.sheet]) return obj.sheet;
  if(t === 'nfi' || t === 'wash'){
    const d = typeof kitsSheet === 'function' ? kitsSheet(wb) : null;
    if(d && d.sheet && wb.Sheets[d.sheet]) return d.sheet;
  } else if(t === 'comunitarias'){
    const s = typeof comSheetName === 'function' ? comSheetName(wb) : null;
    if(s && wb.Sheets[s]) return s;
  } else {
    const d = typeof attSheet === 'function' ? attSheet(wb) : null;
    if(d && d.sheet && wb.Sheets[d.sheet]) return d.sheet;
  }
  return wb.SheetNames[0];
}

function mmInspectImsProjCol(wb, t, obj){
  if(!wb || !obj || !obj.rows || !obj.rows.length) return null;
  const sn = mmGetImsSheetName(wb, t, obj);
  const ws = wb.Sheets[sn];
  if(!ws) return null;
  const sh = imsSheet(ws);
  const machTargets = ['proyecto', 'proyectos', 'projects_vzl', 'project'];
  const labTargets = new Set(['proyecto', 'proyectos', 'project', 'proyecto columna 2']);
  const idxs = [];
  machTargets.forEach(m => {
    const i = sh.machine.indexOf(m);
    if(i >= 0 && !idxs.includes(i)) idxs.push(i);
  });
  sh.labels.forEach((l, i) => {
    if(labTargets.has(fold(l)) && !idxs.includes(i)) idxs.push(i);
  });
  if(!idxs.length) return null;

  const byRow = new Map();
  sh.rows.forEach(x => {
    let val = '';
    for(const i of idxs){
      const v = toText(x.r[i]);
      if(v){ val = v; break; }
    }
    byRow.set(x.n, val);
  });

  let nonEmpty = 0;
  const sampleSet = new Set();
  obj.rows.forEach(a => {
    const v = byRow.get(a.n) || toText(a.proyecto) || '';
    a._colProyecto = v;
    if(v){
      nonEmpty++;
      if(sampleSet.size < 4) sampleSet.add(mmMapProjName(v) || v);
    }
  });
  if(!nonEmpty) return null;
  const primaryIdx = idxs.find(i => sh.rows.some(x => toText(x.r[i]))) ?? idxs[0];
  return {
    label: sh.labels[primaryIdx] || sh.machine[primaryIdx] || 'Proyecto',
    nonEmpty,
    total: obj.rows.length,
    samples: [...sampleSet]
  };
}

function mmKitNameProj(k){
  const p = kitNameProject(`${k.name || ''} ${k.label || ''}`);
  if(p === 'ECHO') return 'ECHO ALERT';
  if(p === 'DHR') return 'DHR Emergencia';
  return '';
}

function mmApplyImsType(t){
  MMAT.imsType = t;
  MMAT.imsObj = null;
  MMAT.imsSector = IMS_DEF_SECTOR[t] || '';
  MMAT.imsProjCol = null;
  MMAT.imsUseProjCol = false;
  MMAT.imsRegFilter = null;
  MMAT.defProj = '';
  MMAT.defProjOtro = '';
  if(!MMAT.wb || !t) return;
  try{
    let obj = null;
    if(t === 'registro') obj = mmLoadImsRegistro(MMAT.wb, MMAT.file.name);
    else if(t === 'comunitarias') obj = comLoad(MMAT.wb, MMAT.file.name);
    else if(t === 'nfi' || t === 'wash') obj = nfiLoad(MMAT.wb, MMAT.file.name, S.registro || null, t);
    else obj = salLoad(MMAT.wb, MMAT.file.name, S.registro || null, t);
    if(obj && (t === 'nfi' || t === 'wash') && Array.isArray(obj.kits)){
      obj.matProj = obj.kits.map(k => mmKitNameProj(k));
      obj.matProjOtro = obj.kits.map(() => '');
    }
    MMAT.imsObj = obj;
    MMAT.imsProjCol = mmInspectImsProjCol(MMAT.wb, t, obj);
    MMAT.imsUseProjCol = MMAT.imsProjCol ? null : false;
    MMAT.minDate = obj && obj.minDate ? obj.minDate : '';
    MMAT.maxDate = obj && obj.maxDate ? obj.maxDate : '';
    MMAT.from = MMAT.minDate;
    MMAT.to = MMAT.maxDate;
  }catch(e){
    console.error(e);
    MMAT.imsObj = { fatal:[`No se pudo leer como ${mmLabel(t)}`] };
  }
}

async function mmLoadMainFile(f){
  busy(true); await nextFrame();
  try{
    const buf = await f.arrayBuffer();
    const readOpts = MMAT.source === 'kobo'
      ? { type:'array', cellDates:true, cellStyles:false, cellHTML:false, cellFormula:false, cellNF:false }
      : { type:'array', cellDates:true };
    const wb = XLSX.read(buf, readOpts);
    const hadFile = !!MMAT.file;
    MMAT.file = f; MMAT.wb = wb; MMAT.imsObj = null; MMAT.raw = null;
    if(MMAT.source === 'ims'){
      MMAT.imsScope = null;
      const det = detectForm(wb);
      MMAT.imsDet = det;
      const initType = IMS_FORM_OPTS.some(([v]) => v === det) ? det : 'nfi';
      mmApplyImsType(initType);
    } else if(MMAT.source === 'kobo'){
      MMAT.koboReady = false;
      if(hadFile) MMAT.xlsform = null;
      MMAT.defProj = '';
      MMAT.defSector = '';
    } else {
      MMAT.defProj = '';
      MMAT.defSector = '';
      MMAT.excelReady = false;
      MMAT.excelAgeRand = false;
      MMAT.excelAgeMin = 0;
      MMAT.excelAgeMax = 74;
      MMAT.excelSexMode = '';
      MMAT.excelFixedCount = 1;
      MMAT.excelGeo = { estado:'', mun:'', parr:'', com:'', comCustom:'' };
      const raw = mmParseRaw(wb, f.name);
      MMAT.raw = raw;
      MMAT.map = mmAutoMap(raw.headers);
      MMAT.manual = {};
      const hasBands = (MMAT.map.bands || []).some(b => !!b.col);
      MMAT.excelCountMode = hasBands ? 'bands' : (MMAT.map.total_personas ? 'col' : 'row');
      mmSyncRawMeta();
    }
  }catch(e){
    console.error(e);
    toast('No se pudo leer el archivo: ' + (e.message || e));
  } finally {
    busy(false);
    navApply();
  }
}

function mmSyncRawMeta(){
  const R = MMAT.raw, M = MMAT.map;
  if(!R) return;
  if(M.socio && M.socio !== '__manual__'){
    const hdrs = R.selectHeaders || R.headers;
    MMAT.socioList = countBy(R.rows, r => {
      const s = MMAT.source === 'kobo'
        ? mmKoboResolveSocio(r, M.socio, hdrs)
        : (toText(r[M.socio]) || '');
      return s || '(vacío)';
    });
    MMAT.validSocios = new Set(MMAT.socioList.map(([s]) => fold(s)));
  } else {
    MMAT.socioList = []; MMAT.validSocios = new Set();
  }
  if(M.fecha && M.fecha !== '__manual__'){
    const ds = R.rows.map(r => toDate(r[M.fecha])).filter(Boolean).sort();
    MMAT.minDate = ds[0] || ''; MMAT.maxDate = ds[ds.length - 1] || '';
    MMAT.from = MMAT.minDate; MMAT.to = MMAT.maxDate;
  } else {
    MMAT.minDate = ''; MMAT.maxDate = ''; MMAT.from = ''; MMAT.to = '';
  }
}

function bindMatrizMonitoreo(){
  const on = (sel, ev, fn) => { const el = $(sel); if(el) el.addEventListener(ev, fn); };
  const navKeepScroll = () => {
    const y = window.scrollY;
    navApply();
    window.scrollTo(0, y);
  };
  document.querySelectorAll('[data-msrc]').forEach(b => b.onclick = () => {
    MMAT.source = b.dataset.msrc;
    MMAT.file = null; MMAT.wb = null; MMAT.imsType = ''; MMAT.imsDet = ''; MMAT.imsObj = null; MMAT.raw = null;
    MMAT.imsProjCol = null;
    MMAT.imsUseProjCol = false;
    MMAT.imsScope = null;
    MMAT.imsRegFilter = null;
    MMAT.xlsform = null;
    MMAT.koboReady = false;
    MMAT.excelReady = false;
    MMAT.excelCountMode = '';
    MMAT.excelAgeRand = false;
    MMAT.excelAgeMin = 0;
    MMAT.excelAgeMax = 74;
    MMAT.excelSexMode = '';
    MMAT.excelGeo = { estado:'', mun:'', parr:'', com:'', comCustom:'' };
    MMAT.defProj = '';
    MMAT.defProjOtro = '';
    MMAT.defSector = MMAT.source === 'ims' ? 'NFI' : '';
    navApply();
  });

  const bindDrop = (dropSel, inSel, handler) => {
    const d = $(dropSel), inp = $(inSel);
    if(!d || !inp) return;
    d.onclick = () => inp.click();
    d.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); inp.click(); } };
    d.ondragover = e => { e.preventDefault(); d.classList.add('over'); };
    d.ondragleave = () => d.classList.remove('over');
    d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); if(e.dataTransfer.files[0]) handler(e.dataTransfer.files[0]); };
    inp.onchange = e => { if(e.target.files[0]) handler(e.target.files[0]); e.target.value = ''; };
  };

  if(MMAT.source === 'kobo'){
    const loadXls = async f => {
      busy(true); await nextFrame();
      try{
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type:'array' });
        const prof = mmParseXlsForm(wb, f.name);
        MMAT.xlsform = prof;
        toast(`XLSForm cargado (${prof.qCount} preguntas, ${prof.calcCount} cálculos excluidos)`);
      }catch(err){ console.error(err); toast('No se pudo leer el XLSForm: ' + (err.message || err)); }
      finally{ busy(false); navApply(); }
    };
    bindDrop('#mmXlsDrop', '#mmXlsIn', loadXls);
    on('#mmXlsClear', 'click', () => {
      MMAT.xlsform = null;
      if(MMAT.raw){
        MMAT.raw.xlsform = null;
        MMAT.raw.selectHeaders = mmFilterKoboHeaders(MMAT.raw.headers, null);
      }
      navApply();
    });
    on('#mmKoboAdvance', 'click', async () => {
      if(!MMAT.wb || !MMAT.file){ toast('Carga primero el archivo de datos de Kobo.'); return; }
      busy(true); await nextFrame();
      try{
        const raw = mmParseKobo(MMAT.wb, MMAT.file.name, MMAT.xlsform);
        MMAT.raw = raw;
        if(raw.xlsform && !MMAT.xlsform) MMAT.xlsform = raw.xlsform;
        const auto = mmKoboAutoMap(raw.selectHeaders, raw.headers, raw.sig);
        MMAT.map = auto.map;
        MMAT.manual = auto.manual;
        MMAT.koboReady = true;
        mmSyncRawMeta();
        navApply();
        const el = $('#mmKoboColsH');
        if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
      }catch(err){ console.error(err); toast('No se pudo analizar el archivo Kobo: ' + (err.message || err)); }
      finally{ busy(false); }
    });
  }

  bindDrop('#mmFileDrop', '#mmFileIn', mmLoadMainFile);
  document.querySelectorAll('[data-mmimsscope]').forEach(b => b.onclick = () => {
    MMAT.imsScope = b.dataset.mmimsscope;
    navKeepScroll();
  });
  document.querySelectorAll('[data-mmregfilter]').forEach(b => b.onclick = () => {
    MMAT.imsRegFilter = b.dataset.mmregfilter;
    navKeepScroll();
  });
  on('#mmImsType', 'change', e => { mmApplyImsType(e.target.value); navApply(); });
  const regIn = $('#mmRegIn');
  if(regIn){
    const loadReg = async f => {
      busy(true); await nextFrame();
      try{
        const wb = XLSX.read(await f.arrayBuffer(), { type:'array' });
        if(!famDetect(wb)){ toast('Ese archivo no es un Registro de Familias (faltan vzl_cases y beneficiaries_vzl).'); return; }
        const D = famLoad(wb, f.name);
        if(D.fatal.length){ toast('Al Registro le faltan columnas: ' + D.fatal.join(', ')); return; }
        S.registro = D;
        if(MMAT.wb && MMAT.source === 'ims' && MMAT.imsType) mmApplyImsType(MMAT.imsType);
      }catch(e){ console.error(e); toast('No se pudo leer el Registro: ' + (e.message || e)); }
      finally { busy(false); navApply(); }
    };
    if($('#mmRegDrop')) bindDrop('#mmRegDrop', '#mmRegIn', loadReg);
    else regIn.onchange = e => { if(e.target.files[0]) loadReg(e.target.files[0]); e.target.value = ''; };
  }

  if(MMAT.source === 'ims' && MMAT.imsObj){
    const O = MMAT.imsObj;
    document.querySelectorAll('[data-mmuseprojcol]').forEach(b => b.onclick = () => {
      MMAT.imsUseProjCol = b.dataset.mmuseprojcol === 'yes';
      navKeepScroll();
    });
    if(MMAT.imsType === 'nfi' || MMAT.imsType === 'wash'){
      document.querySelectorAll('[data-mmproj]').forEach(sel => sel.onchange = () => {
        const i = +sel.dataset.mmproj; O.matProj[i] = sel.value;
        const inp = document.querySelector(`[data-mmproj-otro="${i}"]`);
        if(inp){ inp.style.display = sel.value === 'Otro' ? '' : 'none'; if(sel.value === 'Otro') inp.focus(); }
        mmRefreshOutput();
      });
      document.querySelectorAll('[data-mmproj-otro]').forEach(inp => inp.oninput = () => {
        O.matProjOtro[+inp.dataset.mmprojOtro] = inp.value; mmRefreshOutput();
      });
      document.querySelectorAll('[data-mmcat]').forEach(sel => sel.onchange = () => {
        const i = +sel.dataset.mmcat; O.cat[i] = sel.value;
        sel.className = `in kitcat kitcat-${sel.value.toLowerCase()}`;
        mmRefreshOutput();
      });
    } else if(MMAT.imsType === 'comunitarias'){
      document.querySelectorAll('[data-mmcomt]').forEach(b => b.onchange = () => {
        if(b.checked) O.sel.add(b.dataset.mmcomt); else O.sel.delete(b.dataset.mmcomt);
        navApply();
      });
      document.querySelectorAll('[data-mmcomsoc]').forEach(b => b.onchange = () => {
        const [tid, sk] = b.dataset.mmcomsoc.split('|');
        if(b.checked) O.valid[tid].add(sk); else O.valid[tid].delete(sk);
        mmRefreshOutput();
      });
    } else {
      on('#mmImsSector', 'change', e => { MMAT.imsSector = e.target.value; mmRefreshOutput(); });
    }
    on('#mmDefProj', 'change', e => {
      MMAT.defProj = e.target.value;
      const inp = $('#mmDefProjOtro'); if(inp) inp.style.display = e.target.value === 'Otro' ? '' : 'none';
      mmRefreshOutput();
    });
    on('#mmDefProjOtro', 'input', e => { MMAT.defProjOtro = e.target.value; mmRefreshOutput(); });
    if(MMAT.imsType !== 'comunitarias'){
      const syncS = () => { O.valid = new Set([...document.querySelectorAll('[data-mmsoc]')].filter(b => b.checked).map(b => b.value)); mmRefreshOutput(); };
      document.querySelectorAll('[data-mmsoc]').forEach(b => b.onchange = syncS);
      on('#mmSocAll', 'click', () => { document.querySelectorAll('[data-mmsoc]').forEach(b => b.checked = true); syncS(); });
      on('#mmSocNone', 'click', () => { document.querySelectorAll('[data-mmsoc]').forEach(b => b.checked = false); syncS(); });
    }
  } else if(MMAT.raw && (MMAT.source !== 'kobo' || MMAT.koboReady)){
    document.querySelectorAll('[data-mmap]').forEach(sel => sel.onchange = () => {
      const k = sel.dataset.mmap;
      MMAT.map[k] = sel.value;
      const manInp = document.querySelector(`[data-mmanual="${k}"]`);
      if(manInp){
        manInp.style.display = sel.value === '__manual__' ? '' : 'none';
        if(sel.value === '__manual__') manInp.focus();
      }
      const hintEl = document.querySelector(`[data-mhint="${k}"]`);
      if(hintEl) hintEl.style.display = sel.value === '' ? '' : 'none';
      if(MMAT.source === 'kobo' && MMAT.raw.sig) mmSaveKoboPrefs(MMAT.raw.sig, MMAT.map, MMAT.manual);
      if(k === 'socio' || k === 'fecha'){ mmSyncRawMeta(); navKeepScroll(); }
      else if(MMAT.source === 'excel' && ['estado','municipio','parroquia','comunidad','edad','sexo','nombres','total_personas'].includes(k)){
        if(k === 'total_personas' && sel.value && MMAT.excelCountMode !== 'col') MMAT.excelCountMode = 'col';
        navKeepScroll();
      }
      else mmRefreshOutput();
    });
    document.querySelectorAll('[data-mmanual]').forEach(inp => inp.oninput = () => {
      const k = inp.dataset.mmanual;
      MMAT.manual[k] = inp.value;
      if(MMAT.source === 'kobo' && MMAT.raw.sig) mmSaveKoboPrefs(MMAT.raw.sig, MMAT.map, MMAT.manual);
      if(MMAT.source === 'excel' && ['estado','municipio','parroquia','comunidad','edad','sexo','nombres','total_personas'].includes(k)){
        const btn = $('#mmExcelAdvance');
        const ev = mmExcelValidation();
        if(btn) btn.disabled = !ev.ok;
      }
      mmRefreshOutput();
    });
    if(MMAT.source === 'excel'){
      on('#mmExcelCountMode', 'change', e => {
        MMAT.excelCountMode = e.target.value;
        navKeepScroll();
      });
      on('#mmExcelFixedCount', 'input', e => {
        MMAT.excelFixedCount = Math.max(1, parseInt(e.target.value, 10) || 1);
        const btn = $('#mmExcelAdvance');
        if(btn) btn.disabled = !mmExcelValidation().ok;
        mmRefreshOutput();
      });
      on('#mmGeoEst', 'change', e => {
        MMAT.excelGeo.estado = e.target.value;
        MMAT.excelGeo.mun = '';
        MMAT.excelGeo.parr = '';
        MMAT.excelGeo.com = '';
        MMAT.excelGeo.comCustom = '';
        navKeepScroll();
      });
      on('#mmGeoMun', 'change', e => {
        MMAT.excelGeo.mun = e.target.value;
        MMAT.excelGeo.parr = '';
        MMAT.excelGeo.com = '';
        MMAT.excelGeo.comCustom = '';
        navKeepScroll();
      });
      on('#mmGeoParr', 'change', e => {
        MMAT.excelGeo.parr = e.target.value;
        MMAT.excelGeo.com = '';
        MMAT.excelGeo.comCustom = '';
        navKeepScroll();
      });
      on('#mmGeoCom', 'change', e => {
        MMAT.excelGeo.com = e.target.value;
        if(e.target.value !== '__custom__') MMAT.excelGeo.comCustom = '';
        navKeepScroll();
      });
      on('#mmGeoComCustom', 'input', e => {
        MMAT.excelGeo.comCustom = e.target.value;
        const btn = $('#mmExcelAdvance');
        if(btn) btn.disabled = !mmExcelValidation().ok;
        mmRefreshOutput();
      });
      on('#mmExcelAgeRand', 'change', e => {
        MMAT.excelAgeRand = e.target.checked;
        navKeepScroll();
      });
      on('#mmExcelAgeMin', 'input', e => {
        const v = parseInt(e.target.value, 10);
        MMAT.excelAgeMin = isNaN(v) ? 0 : Math.max(0, Math.min(110, v));
        mmRefreshOutput();
      });
      on('#mmExcelAgeMax', 'input', e => {
        const v = parseInt(e.target.value, 10);
        MMAT.excelAgeMax = isNaN(v) ? 74 : Math.max(0, Math.min(110, v));
        mmRefreshOutput();
      });
      on('#mmExcelSexMode', 'change', e => {
        MMAT.excelSexMode = e.target.value;
        navKeepScroll();
      });
      on('#mmExcelAdvance', 'click', () => {
        const ev = mmExcelValidation();
        if(!ev.ok){
          toast('Falta completar: ' + ev.missing.join(', '));
          return;
        }
        MMAT.excelReady = true;
        navKeepScroll();
        const ex = $('#mmExportBtn');
        if(ex) ex.scrollIntoView({ behavior:'smooth', block:'center' });
      });
    }
    on('#mmDefProjFree', 'input', e => { MMAT.defProj = e.target.value; mmRefreshOutput(); });
    on('#mmDefSecFree', 'input', e => { MMAT.defSector = e.target.value; mmRefreshOutput(); });
    const syncS = () => { MMAT.validSocios = new Set([...document.querySelectorAll('[data-mmsoc]')].filter(b => b.checked).map(b => b.value)); mmRefreshOutput(); };
    document.querySelectorAll('[data-mmsoc]').forEach(b => b.onchange = syncS);
    on('#mmSocAll', 'click', () => { document.querySelectorAll('[data-mmsoc]').forEach(b => b.checked = true); syncS(); });
    on('#mmSocNone', 'click', () => { document.querySelectorAll('[data-mmsoc]').forEach(b => b.checked = false); syncS(); });
  }

  const clampDates = changed => {
    let f = MMAT.from, t = MMAT.to;
    if(f && MMAT.minDate && f < MMAT.minDate){ f = MMAT.minDate; toast('La fecha inicial se ajustó al inicio de los datos.'); }
    if(f && MMAT.maxDate && f > MMAT.maxDate){ f = MMAT.maxDate; toast('La fecha inicial no puede superar el rango disponible.'); }
    if(t && MMAT.minDate && t < MMAT.minDate){ t = MMAT.minDate; toast('La fecha final no puede ser menor al rango disponible.'); }
    if(t && MMAT.maxDate && t > MMAT.maxDate){ t = MMAT.maxDate; toast('La fecha final se ajustó al máximo disponible.'); }
    if(f && t && f > t){
      if(changed === 'from') t = f; else f = t;
      toast('El rango de fechas se ajustó para mantener consistencia.');
    }
    MMAT.from = f; MMAT.to = t;
    if($('#mmFrom')) $('#mmFrom').value = f;
    if($('#mmTo')) $('#mmTo').value = t;
    mmRefreshOutput();
  };
  on('#mmFrom', 'change', e => { MMAT.from = e.target.value; clampDates('from'); });
  on('#mmTo', 'change', e => { MMAT.to = e.target.value; clampDates('to'); });
  on('#mmClearDates', 'click', () => {
    MMAT.from = MMAT.minDate || ''; MMAT.to = MMAT.maxDate || '';
    if($('#mmFrom')) $('#mmFrom').value = MMAT.from;
    if($('#mmTo')) $('#mmTo').value = MMAT.to;
    mmRefreshOutput();
  });

  on('#mmExportBtn', 'click', async () => {
    busy(true); await nextFrame();
    try{
      const res = (MMAT.source === 'kobo' && !MMAT.koboReady) ? null : mmComputeActive();
      await mmExportMatrizExcel(res);
    }catch(e){ console.error(e); toast('Error al exportar: ' + (e.message || e)); }
    finally{ busy(false); }
  });
  on('#mmExportAdj', 'click', async () => {
    busy(true); await nextFrame();
    try{
      const res = (MMAT.source === 'kobo' && !MMAT.koboReady) ? null : mmComputeActive();
      await mmExportAjustesExcel(res);
    }catch(e){ console.error(e); toast('Error al exportar ajustes: ' + (e.message || e)); }
    finally{ busy(false); }
  });
}
