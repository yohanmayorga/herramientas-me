/* Herramientas M&E · Reportes: Matriz de monitoreo (IMS, Kobo y Excel) */
const MMAT = {
  source: 'ims', // 'ims' | 'kobo' | 'excel'
  file: null,
  wb: null,
  imsType: '',   // 'nfi' | 'wash' | 'salud' | 'mental' | 'proteccion' | 'psicosocial' | 'comunitarias'
  imsDet: '',    // tipo detectado automáticamente
  imsObj: null,  // objeto cargado (nfi/wash/sal/com)
  imsSector: '', // sector configurable para salud/mental/proteccion/psicosocial
  nfi: null,
  raw: null,     // { headers, rows, sheet } para Kobo / Excel
  map: {},       // mapeo de columnas para Kobo / Excel
  defProj: 'DHR Emergencia',
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
  ['nfi','Entrega de kits NFI'],
  ['wash','Entrega de kits y servicios WASH'],
  ['salud','Atenciones en salud'],
  ['mental','Atenciones en salud mental'],
  ['proteccion','Atenciones en protección'],
  ['psicosocial','Atenciones psicosociales (Protección)'],
  ['comunitarias','Actividades comunitarias']
];
const IMS_DEF_SECTOR = { salud:'Salud', mental:'SMAPS', proteccion:'Protección', psicosocial:'Protección' };
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
  { k:'fecha', l:'Fecha', aliases:['fecha','fecha de asistencia','fecha de entrega','assistance_date','date','submission_time'] },
  { k:'proyecto', l:'Proyecto', aliases:['proyecto','project','donante','programa'] },
  { k:'socio', l:'Socio implementador', aliases:['socio','socio implementador','implementing_partner','organizacion','partner'] },
  { k:'estado', l:'Estado', aliases:['estado','states','entidad federal','state'] },
  { k:'municipio', l:'Municipio', aliases:['municipio','municipalities','municipality'] },
  { k:'parroquia', l:'Parroquia', aliases:['parroquia','parishes','parish'] },
  { k:'comunidad', l:'Comunidad', aliases:['comunidad','communities','community','sector o comunidad'] },
  { k:'sector', l:'Sector', aliases:['sector','area','tipo de kit','tipo'] },
  { k:'caso', l:'Código de familia / caso (para recurrentes)', aliases:['codigo de caso','codigo de familia','case_code','id familia','familia'] },
  { k:'indig', l:'Población indígena', aliases:['poblacion indigena','numero de poblacion indigena','indigena','etnia','pueblo indigena'] },
  { k:'disc', l:'Personas con discapacidad', aliases:['personas con discapacidad','numero de personas con discapacidad','discapacidad'] },
  { k:'preg', l:'Embarazadas o en lactancia', aliases:['embarazadas','embarazadas o en lactancia','numero de personas embarazadas o en lactancia','lactante'] },
  { k:'sexo', l:'Sexo (si es 1 fila por persona)', aliases:['sexo','sex','genero'] },
  { k:'edad', l:'Edad (si es 1 fila por persona)', aliases:['edad','age','edad en anos'] },
  { k:'kits', l:'Total kits', aliases:['total kits','kits','cantidad de kits','cantidad'] }
];

const mmAutoMap = headers => {
  const map = {};
  MMAT_FIELDS.forEach(f => {
    const idx = headers.findIndex(h => f.aliases.some(a => fold(h) === fold(a) || fold(h).includes(fold(a))));
    map[f.k] = idx >= 0 ? headers[idx] : '';
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
  return { name: fileName, sheet, headers, rows };
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

  const seed = Math.abs((p.n || 1) * 31 + (a.num || 0) * 17 + (p.fam || 0) * 13);
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

function mmComputeGeneric(){
  const R = MMAT.raw, M = MMAT.map;
  if(!R) return null;
  const g = (r, k) => M[k] ? r[M[k]] : null;
  const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : MMAT.defProj;
  const seenBySec = new Map(), grpMap = new Map();
  let omitSocio = 0, omitFecha = 0, omitEmpty = 0;

  const sorted = R.rows.map(r => ({ r, fecha: M.fecha ? toDate(g(r, 'fecha')) : '' }))
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || a.r._row - b.r._row);

  sorted.forEach(({ r, fecha }) => {
    const socio = toText(g(r, 'socio')) || '';
    if(M.socio && MMAT.validSocios.size && !MMAT.validSocios.has(fold(socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!fecha || (MMAT.from && fecha < MMAT.from) || (MMAT.to && fecha > MMAT.to))){ omitFecha++; return; }

    const proj = toText(g(r, 'proyecto')) || defP;
    const sector = toText(g(r, 'sector')) || MMAT.defSector || 'NFI';
    const estado = toText(g(r, 'estado')) || '';
    const mun = toText(g(r, 'municipio')) || '';
    const parr = toText(g(r, 'parroquia')) || '';
    const com = toText(g(r, 'comunidad')) || '';

    const caso = toText(g(r, 'caso'));
    let rec = 'NO';
    if(caso){
      if(!seenBySec.has(sector)) seenBySec.set(sector, new Set());
      const s = seenBySec.get(sector), ck = fold(caso);
      if(s.has(ck)) rec = 'SÍ'; else s.add(ck);
    }

    const ages = Array(18).fill(0);
    let hasBandCols = false;
    (M.bands || []).forEach((b, bi) => {
      if(b.col){ hasBandCols = true; const v = toNum(r[b.col]); if(v && v > 0) ages[bi] += v; }
    });
    if(!hasBandCols && M.sexo && M.edad){
      const sx = fold(toText(g(r, 'sexo'))), age = toNum(g(r, 'edad'));
      if(age != null && (sx === 'mujer' || sx === 'femenino' || sx === 'f' || sx === 'hombre' || sx === 'masculino' || sx === 'm')){
        const isF = sx === 'mujer' || sx === 'femenino' || sx === 'f';
        const bi = MAT_BANDS.findIndex(([,, lo, hi]) => age >= lo && age <= hi);
        if(bi >= 0) ages[bi * 2 + (isF ? 0 : 1)]++;
      }
    }

    const toFlagNum = v => {
      if(v == null) return 0;
      const n = toNum(v); if(n != null) return Math.max(0, n);
      const f = fold(toText(v));
      return f && !['no','ninguno','ninguna','no aplica','na','n a'].includes(f) ? 1 : 0;
    };
    const indig = toFlagNum(g(r, 'indig'));
    const disc = toFlagNum(g(r, 'disc'));
    const preg = toFlagNum(g(r, 'preg'));
    const kits = Math.max(0, toNum(g(r, 'kits')) || 0);
    const totP = ages.reduce((s, v) => s + v, 0);
    if(!totP && !kits && !indig && !disc && !preg){ omitEmpty++; return; }

    const k = [fecha || '', proj, socio, estado, mun, parr, com, sector, rec].join('|');
    let grp = grpMap.get(k);
    if(!grp){ grp = { fecha:fecha||'', proj, socio, estado, mun, parr, com, sector, rec, indig:0, disc:0, preg:0, ages:Array(18).fill(0), kits:0 }; grpMap.set(k, grp); }
    grp.indig += indig; grp.disc += disc; grp.preg += preg; grp.kits += kits;
    ages.forEach((v, i) => { grp.ages[i] += v; });
  });

  const outRows = [...grpMap.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.proj.localeCompare(b.proj) || a.socio.localeCompare(b.socio) || a.estado.localeCompare(b.estado) || a.mun.localeCompare(b.mun) || a.parr.localeCompare(b.parr) || a.com.localeCompare(b.com) || a.sector.localeCompare(b.sector) || a.rec.localeCompare(b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  if(omitEmpty) omitted.push(`${fmt(omitEmpty)} fila(s) sin personas ni kits registrados`);
  return { outRows, omitted, ajustes: [] };
}

function mmComputeIms(){
  const t = MMAT.imsType, O = MMAT.imsObj;
  if(!t || !O || !O.rows) return null;
  if(t === 'nfi' || t === 'wash') return mmComputeImsKits(O);
  if(t === 'comunitarias') return mmComputeImsCom(O);
  return mmComputeImsSal(t, O);
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

    const slices = new Map();
    items.forEach(it => {
      const sec = N.cat[it.ki] === 'WASH' ? 'WASH' : 'NFI';
      const mp = N.matProj && N.matProj[it.ki] ? N.matProj[it.ki] : 'DHR Emergencia';
      const proj = mp === 'Otro' ? ((N.matProjOtro && N.matProjOtro[it.ki] || '').trim() || 'Otro') : mp;
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

  const outRows = [...grpMap.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.proj.localeCompare(b.proj) || a.socio.localeCompare(b.socio) || a.estado.localeCompare(b.estado) || a.mun.localeCompare(b.mun) || a.parr.localeCompare(b.parr) || a.com.localeCompare(b.com) || a.sector.localeCompare(b.sector) || a.rec.localeCompare(b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  if(omitSinKits) omitted.push(`${fmt(omitSinKits)} entrega(s) sin kits incluidos en las categorías seleccionadas`);
  return { outRows, omitted, ajustes };
}

function mmComputeImsSal(t, A){
  const seen = new Set(), grpMap = new Map(), adjSeen = new Set(), ajustes = [];
  let omitSocio = 0, omitFecha = 0;
  const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : MMAT.defProj;
  const sector = MMAT.imsSector || IMS_DEF_SECTOR[t] || 'Salud';
  const sorted = A.rows.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || a.n - b.n);

  sorted.forEach(a => {
    if(!A.valid.has(fold(a.socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!a.fecha || (MMAT.from && a.fecha < MMAT.from) || (MMAT.to && a.fecha > MMAT.to))){ omitFecha++; return; }

    const proj = mmMapProjName(a.proyecto) || defP;
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

  const outRows = [...grpMap.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.proj.localeCompare(b.proj) || a.socio.localeCompare(b.socio) || a.estado.localeCompare(b.estado) || a.mun.localeCompare(b.mun) || a.parr.localeCompare(b.parr) || a.com.localeCompare(b.com) || a.sector.localeCompare(b.sector) || a.rec.localeCompare(b.rec));
  const omitted = [];
  if(omitSocio) omitted.push(`${fmt(omitSocio)} registro(s) de socio(s) marcados como no válidos`);
  if(omitFecha) omitted.push(`${fmt(omitFecha)} registro(s) fuera del rango de fechas seleccionado`);
  return { outRows, omitted, ajustes };
}

function mmComputeImsCom(C){
  const grpMap = new Map();
  let omitTipo = 0, omitSocio = 0, omitFecha = 0, omitCero = 0;
  const defP = MMAT.defProj === 'Otro' ? (MMAT.defProjOtro.trim() || 'Otro') : MMAT.defProj;
  const secMap = { proteccion:'Protección', salud:'SMAPS', wash:'WASH' };

  C.rows.forEach(a => {
    if(!C.sel.has(a.type)){ omitTipo++; return; }
    if(!C.valid[a.type].has(fold(a.socio || '(vacío)'))){ omitSocio++; return; }
    if((MMAT.from || MMAT.to) && (!a.fecha || (MMAT.from && a.fecha < MMAT.from) || (MMAT.to && a.fecha > MMAT.to))){ omitFecha++; return; }
    const tot = (a.ninas||0)+(a.ninos||0)+(a.mujeres||0)+(a.hombres||0)+(a.mujeres60||0)+(a.hombres60||0);
    if(!tot){ omitCero++; return; }

    const proj = mmMapProjName(a.proyecto) || defP;
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

  const outRows = [...grpMap.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.proj.localeCompare(b.proj) || a.socio.localeCompare(b.socio) || a.estado.localeCompare(b.estado) || a.mun.localeCompare(b.mun) || a.parr.localeCompare(b.parr) || a.com.localeCompare(b.com) || a.sector.localeCompare(b.sector) || a.rec.localeCompare(b.rec));
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
      r.estado = best.estado; r.mun = best.mun; r.parr = best.parr; r.com = best.com;
      ['estado','mun','parr','com'].forEach(k => {
        if(!orig[k]) r._geo[k] = r[k] ? 'imp' : 'miss';
      });
    }
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
  const fname = `Matriz_Monitoreo_${MMAT.source.toUpperCase()}${tag}.xlsx`;
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
        if(MMAT.imsType === 'nfi' || MMAT.imsType === 'wash'){
          const kitRows = O.kits.map((k, i) => ({ k, i })).filter(x => x.k.total > 0).sort((a, b) => b.k.total - a.k.total).map(({ k, i }) => {
            return `<tr>
              <td style="white-space:normal">${esc(k.name)}</td>
              <td class="num">${fmt(k.total)}</td>
              <td><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <select class="in" data-mmproj="${i}">${MAT_PROJS.map(p => `<option ${O.matProj[i] === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
                <input type="text" class="in" data-mmproj-otro="${i}" value="${esc(O.matProjOtro[i] || '')}" placeholder="Escribir proyecto…" style="min-width:140px;${O.matProj[i] === 'Otro' ? '' : 'display:none'}">
              </div></td>
              <td><select class="in kitcat kitcat-${O.cat[i].toLowerCase()}" data-mmcat="${i}">${['NFI','WASH'].map(c => `<option ${O.cat[i] === c ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
            </tr>`;
          }).join('');
          body += `<h2>Configuración de kits (NFI / WASH) y Proyecto</h2>
          <div class="panel">
            <p class="muted" style="margin:0 0 10px;font-size:13.5px">${esc(O.cfg.catNote)} Los kits que mencionan ECHO se asignan por defecto a <b>ECHO ALERT</b> y el resto a <b>DHR Emergencia</b>.</p>
            <div class="scroll"><table class="kits"><thead><tr><th>Kit</th><th class="num">Cantidad</th><th>Proyecto</th><th>Tipo</th></tr></thead><tbody>${kitRows}</tbody></table></div>
          </div>`;
        } else if(MMAT.imsType === 'comunitarias'){
          body += `<h2>Configuración de Actividades comunitarias</h2>
          <div class="panel" style="margin-bottom:14px">
            <label class="pj-fg" style="max-width:340px;margin-bottom:12px"><span class="pj-fl">Proyecto por defecto (si falta en el registro)</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <select class="in" id="mmDefProj">${MAT_PROJS.map(p => `<option ${MMAT.defProj === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
                <input type="text" class="in" id="mmDefProjOtro" value="${esc(MMAT.defProjOtro)}" placeholder="Escribir proyecto…" style="min-width:140px;${MMAT.defProj === 'Otro' ? '' : 'display:none'}">
              </div>
            </label>
            <p class="muted" style="margin:0 0 6px;font-size:13.5px">Tipos de actividad a incluir:</p>
            ${O.types.map(tp => `<label class="check"><input type="checkbox" data-mmcomt="${tp.id}" ${O.sel.has(tp.id) ? 'checked' : ''}> ${esc(tp.label)} <span class="muted">(${fmt(tp.count)} actividades)</span></label>`).join('')}
          </div>`;
        } else {
          const secOpts = ['Salud','SMAPS','Protección','NFI','WASH'];
          body += `<h2>Configuración de ${esc(O.cfg.name)}</h2>
          <div class="panel" style="margin-bottom:14px">
            <div class="grid2" style="gap:12px">
              <label class="pj-fg"><span class="pj-fl">Proyecto por defecto (si falta columna)</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <select class="in" id="mmDefProj">${MAT_PROJS.map(p => `<option ${MMAT.defProj === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
                  <input type="text" class="in" id="mmDefProjOtro" value="${esc(MMAT.defProjOtro)}" placeholder="Escribir proyecto…" style="min-width:140px;${MMAT.defProj === 'Otro' ? '' : 'display:none'}">
                </div>
              </label>
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
  } else if(MMAT.raw){
    const R = MMAT.raw, M = MMAT.map;
    const opts = cur => `<option value="">— No aplica / usar defecto —</option>${R.headers.map(h => `<option value="${esc(h)}"${cur === h ? ' selected' : ''}>${esc(h)}</option>`).join('')}`;
    body += `<h2>Mapeo de columnas (${esc(MMAT.source.toUpperCase())})</h2>
    <div class="panel">
      <p class="muted" style="margin:0 0 10px;font-size:13.5px">Hoja leída: <b>${esc(R.sheet)}</b> · ${fmt(R.rows.length)} filas. Confirma las columnas detectadas automáticamente:</p>
      <div class="grid2" style="gap:10px;margin-bottom:12px">
        <label class="pj-fg"><span class="pj-fl">Proyecto por defecto (si falta columna)</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <select class="in" id="mmDefProj">${MAT_PROJS.map(p => `<option ${MMAT.defProj === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
            <input type="text" class="in" id="mmDefProjOtro" value="${esc(MMAT.defProjOtro)}" placeholder="Escribir proyecto…" style="min-width:140px;${MMAT.defProj === 'Otro' ? '' : 'display:none'}">
          </div>
        </label>
        <label class="pj-fg"><span class="pj-fl">Sector por defecto (si falta columna)</span>
          <select class="in" id="mmDefSec">${['NFI','WASH'].map(c => `<option ${MMAT.defSector === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
        </label>
      </div>
      <div class="scroll"><table class="ledger"><thead><tr><th>Campo de la Matriz</th><th>Columna en el archivo</th></tr></thead><tbody>
        ${MMAT_FIELDS.map(f => `<tr><td>${esc(f.l)}</td><td><select class="in" data-mmap="${f.k}">${opts(M[f.k])}</select></td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
    if(M.socio && MMAT.socioList.length){
      body += `<h2>Socios implementadores válidos</h2><div class="panel">
        <div class="row" style="margin:0 0 6px"><button class="btn sm" type="button" id="mmSocAll">Seleccionar todos</button><button class="btn sm" type="button" id="mmSocNone">Quitar todos</button></div>
        ${MMAT.socioList.map(([x, c]) => `<label class="check"><input type="checkbox" data-mmsoc value="${esc(fold(x))}" ${MMAT.validSocios.has(fold(x)) ? 'checked' : ''}> ${esc(x)} <span class="muted">(${fmt(c)} registros)</span></label>`).join('')}
      </div>`;
    }
  }

  const res = MMAT.source === 'ims' ? mmComputeIms() : mmComputeGeneric();
  const hasOutput = res && res.outRows.length > 0;
  const summary = hasOutput ? mmBuildSummary(res) : { html:'', plain:'' };
  const hasAdj = MMAT.source === 'ims' && res && res.ajustes && res.ajustes.length > 0;

  let exportHtml = '';
  if(res){
    exportHtml = `<h2>Periodo y exportación</h2>
    <div class="panel" style="margin-bottom:14px">
      <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end">
        <label class="pj-fg" style="width:auto"><span class="pj-fl">Fecha desde</span><input type="date" class="in" id="mmFrom" value="${esc(MMAT.from)}"${MMAT.minDate ? ` min="${esc(MMAT.minDate)}"` : ''}${MMAT.maxDate ? ` max="${esc(MMAT.maxDate)}"` : ''}></label>
        <label class="pj-fg" style="width:auto"><span class="pj-fl">Fecha hasta</span><input type="date" class="in" id="mmTo" value="${esc(MMAT.to)}"${MMAT.minDate ? ` min="${esc(MMAT.minDate)}"` : ''}${MMAT.maxDate ? ` max="${esc(MMAT.maxDate)}"` : ''}></label>
        <button class="btn sm" type="button" id="mmClearDates">Todo el periodo</button>
        ${MMAT.minDate && MMAT.maxDate ? `<span class="muted" style="font-size:12.5px">Rango disponible: ${esc(dmy(MMAT.minDate))} – ${esc(dmy(MMAT.maxDate))}</span>` : ''}
      </div>
    </div>
    <div class="exp" style="margin-top:12px">
      <h3>Matriz de monitoreo</h3>
      <p class="muted">${hasOutput ? `${fmt(res.outRows.length)} fila(s) listas para exportar en el formato oficial de la Matriz de monitoreo.` : 'No hay filas válidas con los filtros y socios seleccionados.'}</p>
      <div id="mmSummaryBox" style="margin:12px 0;padding:12px 14px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);font-size:13.5px;line-height:1.5;${summary.html ? '' : 'display:none'}">
        <div style="font-weight:600;margin-bottom:8px;color:var(--accent)">Resumen para correo / reporte</div>
        <div id="mmSummaryTxt">${summary.html}</div>
      </div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <button class="btn primary" type="button" id="mmExportBtn" ${hasOutput ? '' : 'disabled'}>Descargar Excel</button>
        ${MMAT.source === 'ims' ? `<button class="btn" type="button" id="mmExportAdj" ${hasAdj ? '' : 'disabled'}>Descargar ajustes${res.ajustes ? ` (${fmt(res.ajustes.length)})` : ''}</button>` : ''}
        <button class="btn" type="button" id="mmCopySummary" ${summary.plain ? '' : 'disabled'}>Copiar resumen</button>
      </div>
    </div>`;
  }

  return `<div class="portal">
    <section class="p-hero pj-hero">
      <div>
        <h1>Matriz de monitoreo</h1>
        <p>Genera el Excel de la Matriz de monitoreo y el resumen ejecutivo para correo o reporte a partir de descargas del IMS, KoboToolbox o archivos Excel.</p>
      </div>
    </section>

    <h2 style="margin-top:0">1. Fuente de datos</h2>
    <div class="p-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-bottom:18px">${srcCards}</div>

    <h2>2. Cargar archivo (${esc(srcInfo.name)})</h2>
    <div class="drop" id="mmFileDrop" tabindex="0" role="button" style="margin-bottom:16px">
      <strong>${MMAT.file ? esc(MMAT.file.name) : `Arrastra aquí el archivo de ${esc(srcInfo.name)} o haz clic para seleccionarlo`}</strong>
      <span>${MMAT.file ? 'Haz clic para reemplazar el archivo cargado' : 'Formatos compatibles: .xlsx, .xls, .csv'}</span>
    </div>
    <input type="file" id="mmFileIn" accept=".xlsx,.xls,.xlsm,.csv" hidden>

    ${body}
    ${exportHtml}
  </div>`;
}

let mmLastSummaryPlain = '';
function mmRefreshOutput(){
  const res = MMAT.source === 'ims' ? mmComputeIms() : mmComputeGeneric();
  const hasOutput = res && res.outRows.length > 0;
  const summary = hasOutput ? mmBuildSummary(res) : { html:'', plain:'' };
  mmLastSummaryPlain = summary.plain;
  const box = $('#mmSummaryBox'), tEl = $('#mmSummaryTxt'), exBtn = $('#mmExportBtn'), cpBtn = $('#mmCopySummary'), adjBtn = $('#mmExportAdj');
  if(tEl) tEl.innerHTML = summary.html;
  if(box) box.style.display = summary.html ? '' : 'none';
  if(exBtn) exBtn.disabled = !hasOutput;
  if(cpBtn) cpBtn.disabled = !summary.plain;
  if(adjBtn && res && res.ajustes){
    adjBtn.disabled = !res.ajustes.length;
    adjBtn.textContent = `Descargar ajustes (${fmt(res.ajustes.length)})`;
  }
}

function mmApplyImsType(t){
  MMAT.imsType = t;
  MMAT.imsObj = null;
  MMAT.imsSector = IMS_DEF_SECTOR[t] || '';
  if(!MMAT.wb || !t) return;
  try{
    let obj = null;
    if(t === 'comunitarias') obj = comLoad(MMAT.wb, MMAT.file.name);
    else if(t === 'nfi' || t === 'wash') obj = nfiLoad(MMAT.wb, MMAT.file.name, S.registro || null, t);
    else obj = salLoad(MMAT.wb, MMAT.file.name, S.registro || null, t);
    MMAT.imsObj = obj;
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
    const wb = XLSX.read(buf, { type:'array', cellDates:true });
    MMAT.file = f; MMAT.wb = wb; MMAT.imsObj = null; MMAT.raw = null;
    if(MMAT.source === 'ims'){
      const det = detectForm(wb);
      MMAT.imsDet = det;
      const initType = IMS_FORM_OPTS.some(([v]) => v === det) ? det : 'nfi';
      mmApplyImsType(initType);
    } else {
      const raw = mmParseRaw(wb, f.name);
      MMAT.raw = raw;
      MMAT.map = mmAutoMap(raw.headers);
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
  if(M.socio){
    MMAT.socioList = countBy(R.rows, r => toText(r[M.socio]) || '(vacío)');
    MMAT.validSocios = new Set(MMAT.socioList.map(([s]) => fold(s)));
  } else {
    MMAT.socioList = []; MMAT.validSocios = new Set();
  }
  if(M.fecha){
    const ds = R.rows.map(r => toDate(r[M.fecha])).filter(Boolean).sort();
    MMAT.minDate = ds[0] || ''; MMAT.maxDate = ds[ds.length - 1] || '';
    MMAT.from = MMAT.minDate; MMAT.to = MMAT.maxDate;
  } else {
    MMAT.minDate = ''; MMAT.maxDate = ''; MMAT.from = ''; MMAT.to = '';
  }
}

function bindMatrizMonitoreo(){
  const on = (sel, ev, fn) => { const el = $(sel); if(el) el.addEventListener(ev, fn); };
  document.querySelectorAll('[data-msrc]').forEach(b => b.onclick = () => {
    MMAT.source = b.dataset.msrc;
    MMAT.file = null; MMAT.wb = null; MMAT.imsType = ''; MMAT.imsDet = ''; MMAT.imsObj = null; MMAT.raw = null;
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

  bindDrop('#mmFileDrop', '#mmFileIn', mmLoadMainFile);
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
  } else if(MMAT.raw){
    document.querySelectorAll('[data-mmap]').forEach(sel => sel.onchange = () => {
      MMAT.map[sel.dataset.mmap] = sel.value;
      if(sel.dataset.mmap === 'socio' || sel.dataset.mmap === 'fecha'){ mmSyncRawMeta(); navApply(); }
      else mmRefreshOutput();
    });
    on('#mmDefProj', 'change', e => {
      MMAT.defProj = e.target.value;
      const inp = $('#mmDefProjOtro'); if(inp) inp.style.display = e.target.value === 'Otro' ? '' : 'none';
      mmRefreshOutput();
    });
    on('#mmDefProjOtro', 'input', e => { MMAT.defProjOtro = e.target.value; mmRefreshOutput(); });
    on('#mmDefSec', 'change', e => { MMAT.defSector = e.target.value; mmRefreshOutput(); });
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
      const res = MMAT.source === 'ims' ? mmComputeIms() : mmComputeGeneric();
      await mmExportMatrizExcel(res);
    }catch(e){ console.error(e); toast('Error al exportar: ' + (e.message || e)); }
    finally{ busy(false); }
  });
  on('#mmExportAdj', 'click', async () => {
    busy(true); await nextFrame();
    try{
      const res = mmComputeIms();
      await mmExportAjustesExcel(res);
    }catch(e){ console.error(e); toast('Error al exportar ajustes: ' + (e.message || e)); }
    finally{ busy(false); }
  });
  on('#mmCopySummary', 'click', () => {
    const res = MMAT.source === 'ims' ? mmComputeIms() : mmComputeGeneric();
    const txt = mmLastSummaryPlain || (res ? mmBuildSummary(res).plain : '');
    if(!txt) return;
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Resumen copiado al portapapeles'));
  });
}
