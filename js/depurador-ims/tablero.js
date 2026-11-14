/* Herramientas M&E · Tablero interactivo */
/* ============ Tablero interactivo ============ */
const DASH_COLORS={registro:'#8FA6D6',salud:'#0033A0',mental:'#418FDE',proteccion:'#6E5BC2',psicosocial:'#B05FA8',comunitarias:'#D99A2B',nfi:'#5C7FB8',wash:'#26A69A'};
const DASH_AGES=[['0 - 17',[['0 - 4',0,4],['5 - 11',5,11],['12 - 17',12,17]]],['18 o más',[['18 - 59',18,59],['60 +',60,150]]]];
const DASH_SEX=['Hombre','Mujer','Otro','Sin datos'];
const dSex=p=>{ if(!p||typeof p!=='object') return 'Sin datos'; const f=fold(p.sexo); return f==='hombre'?'Hombre':f==='mujer'?'Mujer':p.sexo?'Otro':'Sin datos'; };
function dashItemsFromMode(){
  if(!S.mode) return [];
  if(S.mode.id==='multi') return mmIncluded().map(it=>({type:it.type,label:it.label,obj:it.obj}));
  if(S.mode.id==='familias') return [{type:'registro',label:'Registro de Familias',obj:S.fam}];
  if(S.mode.id==='comunitarias') return [{type:'comunitarias',label:'Actividades comunitarias',obj:S.com}];
  if(S.mode.id==='nfi') return [{type:S.nfi.cfg.id,label:mmLabel(S.nfi.cfg.id),obj:S.nfi}];
  return [{type:S.sal.cfg.id,label:mmLabel(S.sal.cfg.id),obj:S.sal}];
}
function dashRecords(items){
  const recs=[];
  items.forEach(it=>{ const o=it.obj, base={form:it.type};
    if(it.type==='registro'){ o.fams.forEach(f=>{ if(o.famByNum.get(f.num)!==f) return; recs.push({...base,kind:'reg',fecha:f.created,estado:f.estado,municipio:f.municipio,parroquia:f.parroquia,isAloj:f.alojamiento?'Sí':'No',alojamiento:f.alojamiento,comunidad:f.comunidad,socio:f.org,caso:f.num!=null?'n'+f.num:null,persons:o.byFam.get(f.num)||[]}); }); return; }
    if(it.type==='comunitarias'){ o.rows.forEach(a=>{ if(!o.sel.has(a.type)) return; recs.push({...base,kind:'act',fecha:a.fecha,estado:a.estado,municipio:a.municipio,parroquia:a.parroquia,isAloj:a.isAloj,alojamiento:a.alojamiento,comunidad:a.comunidad,socio:a.socio,caso:null,persons:[],act:a}); }); return; }
    if(it.type==='nfi'||it.type==='wash'){ o.rows.forEach(a=>{ recs.push({...base,kind:'kit',fecha:a.fecha,estado:a.estado,municipio:a.municipio,parroquia:a.parroquia,isAloj:a.isAloj,alojamiento:a.alojamiento,comunidad:a.comunidad,socio:a.socio,caso:a.num!=null?'n'+a.num:(a.caso?'c'+fold(a.caso):null),persons:a.ps||[],kits:a.items.map(x=>({q:x.q,cat:o.cat[x.ki],proj:x.proj,name:o.kits[x.ki].name}))}); }); return; }
    o.rows.forEach(a=>{ recs.push({...base,kind:'att',fecha:a.fecha,estado:a.estado,municipio:a.municipio,parroquia:a.parroquia,isAloj:a.isAloj,alojamiento:a.alojamiento,comunidad:a.comunidad,socio:a.socio,caso:a.num!=null?'n'+a.num:(a.caso?'c'+fold(a.caso):null),persons:[a.p||('u:'+a.pkey)]}); }); });
  return recs;
}
function openDash(){
  const items=dashItemsFromMode(); if(!items.length){ toast('No hay formularios para mostrar.'); return; }
  const recs=dashRecords(items), mv=items.map(it=>it.obj.minValid).filter(Boolean).sort()[0]||'', ds=recs.map(r=>r.fecha).filter(d=>d&&d<=TODAY_YMD&&(!mv||d>=mv)).sort();
  const prev=S.mode&&S.mode.id==='multi'?S.mm.filters:null;
  S.dash={items,recs,minDate:ds[0]||'',maxDate:ds[ds.length-1]||'',F:{from:prev?prev.from:(ds[0]||''),to:prev?prev.to:(ds[ds.length-1]||''),cats:{}},title:items.length>1?'Tablero de asistencia':`Tablero · ${items[0].label}`};
  render();
}
function dashPass(r,F,skip){
  if(F.from||F.to){ if(!r.fecha) return false; if(F.from&&r.fecha<F.from) return false; if(F.to&&r.fecha>F.to) return false; }
  for(const k in F.cats){ if(k===skip) continue; const s=F.cats[k]; if(!s||!s.size) continue; const v=k==='form'?r.form:(r[k]??'(Sin dato)'); if(!s.has(v)) return false; }
  return true;
}
function dashCompute(){
  const D=S.dash, F=D.F, recs=D.recs.filter(r=>dashPass(r,F)), forms=D.items.map(it=>it.type).filter(t=>!F.cats.form||!F.cats.form.size||F.cats.form.has(t));
  const assist=recs.filter(r=>r.kind!=='reg'), hasAssist=D.items.some(it=>it.type!=='registro');
  const pool=hasAssist?assist:recs;
  // personas únicas con la fecha más temprana en el periodo
  const P=new Map(); pool.forEach(r=>r.persons.forEach(p=>{ const cur=P.get(p); if(!cur||(r.fecha&&(!cur.d||r.fecha<cur.d))) P.set(p,{d:r.fecha}); }));
  const ageOf=(p,d)=>typeof p==='object'&&p.birth&&d&&p.birth<=d?ageAt(p.birth,d):null;
  const mx={}; DASH_AGES.forEach(([,subs])=>subs.forEach(([l])=>{ mx[l]={}; DASH_SEX.forEach(s=>mx[l][s]=0); })); mx['Sin datos']={}; DASH_SEX.forEach(s=>mx['Sin datos'][s]=0);
  const nat=new Map(), key={Lactante:0,Embarazada:0,'Persona con discapacidad':0,'Persona mayor (60 +)':0,'Niña o niño no acompañado':0,'Enfermedad crónica':0};
  for(const [p,info] of P){ const sx=dSex(p), age=ageOf(p,info.d); let row='Sin datos';
    if(age!=null) DASH_AGES.forEach(([,subs])=>subs.forEach(([l,a,b])=>{ if(age>=a&&age<=b) row=l; }));
    mx[row][sx]++;
    const n=typeof p==='object'?(p.nat||'Sin datos'):'Sin datos'; nat.set(n,(nat.get(n)||0)+1);
    if(typeof p==='object'){ const pf=p.perfil||new Set(), has=t=>[...pf].some(x=>fold(x)===fold(t));
      if(has('Lactante')||has('Embarazada/Lactante')) key.Lactante++; if(has('Embarazada')||has('Embarazada/Lactante')) key.Embarazada++;
      if(fold(p.disc)==='si') key['Persona con discapacidad']++; if(age!=null&&age>=60) key['Persona mayor (60 +)']++;
      if(has('Niño/a no acompañado')) key['Niña o niño no acompañado']++; if(has('Enfermedad crónica')) key['Enfermedad crónica']++; } }
  const fams=new Set(pool.map(r=>r.caso).filter(Boolean));
  const byForm=forms.map(t=>{ const rs=recs.filter(r=>r.form===t), ps=new Set(rs.flatMap(r=>r.persons));
    return {t,label:mmLabel(t),n:rs.length,unit:{registro:'familias registradas',comunitarias:'actividades',nfi:'entregas',wash:'entregas'}[t]||'atenciones',
      fams:t==='comunitarias'?null:new Set(rs.map(r=>r.caso).filter(Boolean)).size, pers:t==='comunitarias'?null:ps.size,
      kitsNfi:(t==='nfi'||t==='wash')?rs.reduce((s,r)=>s+r.kits.filter(k=>k.cat==='NFI').reduce((q,k)=>q+k.q,0),0):null,
      kitsWash:(t==='nfi'||t==='wash')?rs.reduce((s,r)=>s+r.kits.filter(k=>k.cat==='WASH').reduce((q,k)=>q+k.q,0),0):null,
      kitsOtro:(t==='nfi'||t==='wash')?rs.reduce((s,r)=>s+r.kits.filter(k=>k.cat==='Otro').reduce((q,k)=>q+k.q,0),0):null,
      part:t==='comunitarias'?rs.reduce((s,r)=>s+r.act.total,0):null}; }).sort((a,b)=>b.n-a.n);
  const months=[...new Set(assist.concat(hasAssist?[]:recs).map(r=>r.fecha&&r.fecha.slice(0,7)).filter(Boolean))].sort();
  const hist=months.map(m=>({m,parts:forms.filter(t=>hasAssist?t!=='registro':true).map(t=>[t,(hasAssist?assist:recs).filter(r=>r.form===t&&r.fecha&&r.fecha.slice(0,7)===m).length])}));
  const lvl=new Set(pool.map(r=>r.estado).filter(Boolean)).size>1?'estado':new Set(pool.map(r=>r.municipio).filter(Boolean)).size>1?'municipio':'parroquia';
  const loc=countBy(pool,r=>r[lvl]||'Sin ubicación registrada');
  const socios=countBy(pool,r=>r.socio||'(Sin dato)').sort((a,b)=>b[1]-a[1]).map(([s])=>[s,...forms.filter(t=>hasAssist?t!=='registro':true).map(t=>pool.filter(r=>(r.socio||'(Sin dato)')===s&&r.form===t).length)]);
  const kitRecs=recs.filter(r=>r.kind==='kit'), kc=new Map(), kp=new Map(); kitRecs.forEach(r=>r.kits.forEach(k=>{ kc.set(k.cat,(kc.get(k.cat)||0)+k.q); kp.set(k.proj,(kp.get(k.proj)||0)+k.q); }));
  const acts=recs.filter(r=>r.kind==='act').map(r=>r.act), cp={m:[0,0,0],h:[0,0,0],nr:0};
  acts.forEach(a=>{ cp.m[0]+=a.ninas||0; cp.m[1]+=a.mujeres||0; cp.m[2]+=a.mujeres60||0; cp.h[0]+=a.ninos||0; cp.h[1]+=a.hombres||0; cp.h[2]+=a.hombres60||0; cp.nr+=a.nr||0; });
  const attP=new Set(recs.filter(r=>r.kind==='att').flatMap(r=>r.persons)), kitP=new Set(recs.filter(r=>r.kind==='kit').flatMap(r=>r.persons));
  const comp={att:attP.size,kit:kitP.size,both:[...attP].filter(p=>kitP.has(p)).length,unk:[...attP].filter(p=>typeof p!=='object').length,
    nAtt:recs.filter(r=>r.kind==='att').length,nKit:recs.filter(r=>r.kind==='kit').length,nAct:recs.filter(r=>r.kind==='act').length};
  const sc=stateCounter(); pool.forEach(r=>r.persons.forEach(p=>sc.add(r.estado,p)));
  return {stateVals:sc.vals(),stateUnk:sc.unknown(),comp,recs,forms,hasAssist,persons:P.size,fams:fams.size,assistN:assist.length,kits:[...kc.values()].reduce((a,b)=>a+b,0),part:acts.reduce((s,a)=>s+a.total,0),hasKits:kitRecs.length>0,hasAct:acts.length>0,
    mx,nat:[...nat.entries()].sort((a,b)=>b[1]-a[1]),key:Object.entries(key).sort((a,b)=>b[1]-a[1]),byForm,hist,lvl,loc,socios,socForms:forms.filter(t=>hasAssist?t!=='registro':true),kc:[...kc.entries()].sort((a,b)=>b[1]-a[1]),kp:[...kp.entries()].sort((a,b)=>b[1]-a[1]),cp,regOnly:!hasAssist};
}
/* --- Componentes visuales --- */
const dEsc=esc, dN=n=>fmt(n);
function hbars(items,total,color){ const max=Math.max(1,...items.map(x=>x[1]));
  return `<div class="hb">${items.map(([l,v])=>`<div class="hbrow"><span class="hbl" title="${dEsc(l)}">${dEsc(l)}</span><span class="hbt"><span style="width:${Math.max(v?1.5:0,v/max*100)}%;background:${color||'var(--dash-1)'}"></span></span><span class="hbv">${dN(v)}</span>${total?`<span class="hbp">${pct(v,total)}</span>`:''}</div>`).join('')||'<p class="muted">Sin datos con los filtros aplicados.</p>'}</div>`; }
function dcard(title,body,note,cls=''){ return `<section class="dcard ${cls}"><h3>${dEsc(title)}</h3>${body}${note?`<p class="dnote">${note}</p>`:''}</section>`; }
function dFiltersText(){ const D=S.dash, F=D.F, parts=[F.from&&F.to?`Periodo: ${dmy(F.from)} – ${dmy(F.to)}`:'Todo el periodo'];
  DASH_FKEYS.forEach(([k,l])=>{ const s=F.cats[k]; if(s&&s.size) parts.push(`${l}: ${s.has('__none__')?'ninguno':[...s].map(v=>k==='form'?mmLabel(v):v).join(', ')}`); });
  if(parts.length===1) parts.push('sin otros filtros'); return parts.join(' · '); }
function kpiNote(X){
  const C=X.comp, parts=[];
  if(X.regOnly) return `<div class="dexpl"><b>Cómo se calculan.</b> Personas registradas: integrantes de las familias del Registro de Familias registradas en el periodo y con los filtros aplicados. Familias registradas: familias de vzl_cases en esas mismas condiciones.</div>`;
  let ppl=`<b>Personas asistidas (${dN(X.persons)})</b> = `;
  const terms=[]; if(C.att) terms.push(`${dN(C.att)} personas distintas con atenciones de salud, salud mental o protección`); if(C.kit) terms.push(`${dN(C.kit)} integrantes de familias que recibieron kits`);
  ppl+=terms.join(' + ')+(C.both?` − ${dN(C.both)} personas que aparecen en ambos grupos`:'')+'.';
  if(C.unk) ppl+=` Incluye ${dN(C.unk)} personas atendidas que no se encontraron en el Registro (se identifican por su nombre y código de caso; su sexo y edad figuran como «Sin datos»).`;
  parts.push(ppl);
  parts.push(`<b>Familias alcanzadas (${dN(X.fams)})</b>: códigos de caso distintos con al menos una atención o entrega de kits.`);
  const as=[]; if(C.nAtt) as.push(`${dN(C.nAtt)} atenciones`); if(C.nKit) as.push(`${dN(C.nKit)} entregas de kits`); if(C.nAct) as.push(`${dN(C.nAct)} actividades comunitarias`);
  parts.push(`<b>Asistencias brindadas (${dN(X.assistN)})</b> = ${as.join(' + ')}.`);
  if(X.hasKits) parts.push(`<b>Kits</b>: unidades entregadas en los formularios de NFI y WASH, separadas según la categoría confirmada de cada kit (un kit WASH entregado en el formulario NFI suma como WASH).`);
  parts.push('No se incluyen las personas que solo están registradas ni los participantes de actividades comunitarias, que se presentan aparte.');
  return `<div class="dexpl"><b>Cómo se calculan los indicadores.</b> ${parts.join(' ')}</div>`;
}
function stateTable(X){ const rows=[...X.stateVals.entries()].filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]), tot=rows.reduce((t,e)=>t+e[1],0)+X.stateUnk;
  return `<div class="scroll"><table class="dt"><thead><tr><th>Estado</th><th class="num">Personas</th><th class="num">%</th></tr></thead><tbody>${rows.map(([n,v])=>`<tr><td>${dEsc(n)}</td><td class="num">${dN(v)}</td><td class="num">${pct(v,tot)}</td></tr>`).join('')}${X.stateUnk?`<tr><td class="muted">Sin estado o no reconocido</td><td class="num">${dN(X.stateUnk)}</td><td class="num">${pct(X.stateUnk,tot)}</td></tr>`:''}<tr class="tot"><td>Total</td><td class="num">${dN(tot)}</td><td class="num">100 %</td></tr></tbody></table></div>`; }
function dashBody(){
  const D=S.dash, X=dashCompute(), tot=X.persons;
  const kpis=[[X.regOnly?'Personas registradas':'Personas asistidas',X.persons,'dk1'],[X.regOnly?'Familias registradas':'Familias alcanzadas',X.fams,'dk2']];
  if(!X.regOnly) kpis.push(['Asistencias brindadas',X.assistN,'dk3']); if(X.hasKits){ X.kc.forEach(([c,v])=>{ if(v) kpis.push([`Kits ${c} entregados`,v,'dk3']); }); } if(X.hasAct) kpis.push(['Participantes en actividades comunitarias',X.part,'dk3']);
  const mxRows=DASH_AGES.map(([g,subs])=>{ const sum=s=>subs.reduce((t,[l])=>t+X.mx[l][s],0), gt=DASH_SEX.reduce((t,s)=>t+sum(s),0);
    return `<tr class="grp"><td>${g}</td>${DASH_SEX.map(s=>`<td class="num">${dN(sum(s))}</td>`).join('')}<td class="num">${dN(gt)}</td></tr>`+subs.map(([l])=>`<tr><td class="sub">${l}</td>${DASH_SEX.map(s=>`<td class="num">${dN(X.mx[l][s])}</td>`).join('')}<td class="num">${dN(DASH_SEX.reduce((t,s)=>t+X.mx[l][s],0))}</td></tr>`).join(''); }).join('')
    +`<tr class="grp"><td>Sin datos de edad</td>${DASH_SEX.map(s=>`<td class="num">${dN(X.mx['Sin datos'][s])}</td>`).join('')}<td class="num">${dN(DASH_SEX.reduce((t,s)=>t+X.mx['Sin datos'][s],0))}</td></tr>`
    +`<tr class="tot"><td>Total</td>${DASH_SEX.map(s=>`<td class="num">${dN(Object.values(X.mx).reduce((t,r)=>t+r[s],0))}</td>`).join('')}<td class="num">${dN(tot)}</td></tr>`;
  const formRows=X.byForm.map(f=>`<tr><td><span class="dot" style="background:${DASH_COLORS[f.t]}"></span>${dEsc(f.label)}</td><td class="num">${dN(f.n)}<div class="muted dunit">${f.unit}</div></td><td class="num">${f.fams==null?'—':dN(f.fams)}</td><td class="num">${f.pers==null?'—':dN(f.pers)}</td>${X.hasKits?`<td class="num">${f.kitsNfi==null?'—':dN(f.kitsNfi)}</td><td class="num">${f.kitsWash==null?'—':dN(f.kitsWash)}</td>`+(X.kc.some(k=>k[0]==='Otro'&&k[1])?`<td class="num">${f.kitsOtro==null?'—':dN(f.kitsOtro)}</td>`:''):''}${X.hasAct?`<td class="num">${f.part==null?'—':dN(f.part)}</td>`:''}</tr>`).join('');
  const hmax=Math.max(1,...X.hist.map(h=>h.parts.reduce((s,p)=>s+p[1],0)));
  const hist=X.hist.length?`<div class="hist">${X.hist.map(h=>{ const t=h.parts.reduce((s,p)=>s+p[1],0); const [y,m]=h.m.split('-');
    return `<div class="hcol"><span class="hval">${dN(t)}</span><div class="hbar" style="height:${t/hmax*100}%">${h.parts.filter(p=>p[1]).map(([f,v])=>`<span style="flex:${v};background:${DASH_COLORS[f]}" title="${dEsc(mmLabel(f))}: ${dN(v)}"></span>`).join('')}</div><span class="hlab">${MONTHS[+m-1].slice(0,3)}<br>${y}</span></div>`; }).join('')}</div>
    <div class="legend">${X.socForms.map(f=>`<span><span class="dot" style="background:${DASH_COLORS[f]}"></span>${dEsc(mmLabel(f))}</span>`).join('')}</div>`:'<p class="muted">Sin datos con los filtros aplicados.</p>';
  const lvlName={estado:'estado',municipio:'municipio',parroquia:'parroquia'}[X.lvl];
  const socT=`<div class="scroll"><table class="dt"><thead><tr><th>Socio</th>${X.socForms.map(f=>`<th class="num">${dEsc(mmShort[f]||'Registro')}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>${X.socios.slice(0,12).map(r=>`<tr><td>${dEsc(r[0])}</td>${r.slice(1).map(v=>`<td class="num">${v?dN(v):'·'}</td>`).join('')}<td class="num"><b>${dN(r.slice(1).reduce((a,b)=>a+b,0))}</b></td></tr>`).join('')}</tbody></table></div>`;
  const natT=`<div class="scroll"><table class="dt"><thead><tr><th>Nacionalidad</th><th class="num">Personas</th><th class="num">%</th></tr></thead><tbody>${X.nat.slice(0,8).map(([n,v])=>`<tr><td>${dEsc(n)}</td><td class="num">${dN(v)}</td><td class="num">${pct(v,tot)}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="num">${dN(tot)}</td><td class="num">100 %</td></tr></tbody></table></div>`;
  const cpT=X.hasAct?dcard('Participantes en actividades comunitarias',`<div class="scroll"><table class="dt"><thead><tr><th>Edad</th><th class="num">Mujeres y niñas</th><th class="num">Hombres y niños</th><th class="num">Total</th></tr></thead><tbody>${['0 - 17','18 - 59','60 +'].map((l,i)=>`<tr><td>${l}</td><td class="num">${dN(X.cp.m[i])}</td><td class="num">${dN(X.cp.h[i])}</td><td class="num">${dN(X.cp.m[i]+X.cp.h[i])}</td></tr>`).join('')}${X.cp.nr?`<tr><td>Prefiere no responder</td><td class="num" colspan="2"></td><td class="num">${dN(X.cp.nr)}</td></tr>`:''}<tr class="tot"><td>Total</td><td class="num">${dN(X.cp.m.reduce((a,b)=>a+b,0))}</td><td class="num">${dN(X.cp.h.reduce((a,b)=>a+b,0))}</td><td class="num">${dN(X.part)}</td></tr></tbody></table></div>`,
    'Las actividades comunitarias registran participantes agregados, sin identificar a cada persona; por eso se presentan aparte y no se suman a las personas asistidas.'):'';
  return `
  <div class="dblock dhead"><div><h1>${dEsc(D.title)}</h1><p class="dsub">OIM Venezuela · ${dEsc(D.items.map(it=>it.label).join(', '))}</p></div><div class="dmeta"><b>Filtros aplicados</b><span>${dEsc(dFiltersText())}</span><span class="muted">Generado el ${dmy(TODAY_YMD)}</span></div></div>
  <div class="dblock"><div class="dkpis">${kpis.map(([l,v,c])=>`<div class="dkpi ${c}"><span>${dEsc(l)}</span><b>${dN(v)}</b></div>`).join('')}</div>${kpiNote(X)}</div>
  <div class="dblock drow">${dcard(X.regOnly?'Personas registradas por estado de procedencia':'Personas asistidas por estado',mapSvg(X.stateVals,'personas'),`Personas distintas por estado donde se brindó la asistencia${X.regOnly?' (en el Registro, estado de procedencia)':''}; una persona atendida en dos estados cuenta en ambos. El mapa se acerca a los estados con datos o muestra todo el país si están dispersos. Los límites y nombres mostrados no implican aprobación ni aceptación oficial por parte de la OIM.`,'span2')}${dcard('Personas por estado',stateTable(X),'')}</div>
  <div class="dblock drow">${dcard('Resultados por formulario',`<div class="scroll"><table class="dt"><thead><tr><th>Formulario</th><th class="num">Registros</th><th class="num">Familias</th><th class="num">Personas</th>${X.hasKits?'<th class="num">Kits NFI</th><th class="num">Kits WASH</th>'+(X.kc.some(k=>k[0]==='Otro'&&k[1])?'<th class="num">Kits Otro</th>':''):''}${X.hasAct?'<th class="num">Participantes</th>':''}</tr></thead><tbody>${formRows}</tbody></table></div>`,
      `Familias y personas se cuentan sin duplicados dentro de cada formulario; en kits, las personas son todos los integrantes de la familia según el Registro. Las filas no se suman para obtener los indicadores superiores porque una misma familia o persona puede aparecer en varios formularios: los indicadores la cuentan una sola vez.${X.hasKits?' Los kits se separan por su categoría; por eso el formulario NFI puede tener kits WASH.':''}`,'span2')}
    ${dcard('Población clave',hbars(X.key.filter(x=>x[1]),tot,'var(--dash-1)'),`Personas ${X.regOnly?'registradas':'asistidas'} con cada condición, según el Registro de Familias; los porcentajes son sobre ${dN(tot)} personas. Una persona puede tener varias condiciones, así que no se suman.`)}</div>
  <div class="dblock drow">${dcard('Desagregación por edad y sexo',`<div class="scroll"><table class="dt mx"><thead><tr><th>Rango de edad</th>${DASH_SEX.map(s=>`<th class="num">${s}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>${mxRows}</tbody></table></div>`,
      `Personas ${X.regOnly?'registradas':'asistidas'} únicas: cada persona se cuenta una vez aunque haya recibido varias asistencias. La edad se calcula a la fecha de su primera asistencia en el periodo; «Sin datos» agrupa a quienes no se encontraron en el Registro. El total (${dN(tot)}) es el mismo de ${X.regOnly?'«Personas registradas»':'«Personas asistidas»'}.`,'span2')}
    ${dcard('Nacionalidad',natT,`Según el Registro de Familias. El total (${dN(tot)}) es el mismo de ${X.regOnly?'«Personas registradas»':'«Personas asistidas»'}; «Sin datos» corresponde a personas que no están en el Registro.`)}</div>
  <div class="dblock drow">${dcard(X.regOnly?'Familias registradas por mes':'Histórico de asistencias',hist,X.regOnly?'Familias registradas cada mes.':'Registros de asistencia por mes y formulario: atenciones, entregas de kits y actividades comunitarias. Pasa el cursor sobre cada tramo para ver su valor.','span3')}</div>
  <div class="dblock drow">${dcard(`Asistencias por ${lvlName}`,hbars(X.loc.slice(0,10),X.recs.filter(r=>X.regOnly||r.kind!=='reg').length,'var(--dash-2)'),X.regOnly?'Familias registradas según su lugar de procedencia.':`Registros de asistencia (${dN(X.assistN)}: atenciones, entregas y actividades) según el lugar donde se brindaron; los porcentajes son sobre ese total. Al filtrar un estado, el gráfico pasa a municipios y luego a parroquias.`)}
    ${dcard('Socios implementadores',socT,`Registros de asistencia por socio y formulario, ordenados de mayor a menor; la columna Total suma ${dN(X.regOnly?X.recs.length:X.assistN)} registros.`,'span2')}</div>
  ${X.hasKits?`<div class="dblock drow">${dcard('Kits por categoría',hbars(X.kc,X.kits,'var(--dash-3)'),`Unidades entregadas (${dN(X.kits)} en total, sumando los formularios NFI y WASH) según la categoría confirmada al procesar.`)}${dcard('Kits por proyecto',hbars(X.kp,X.kits,'var(--dash-1)'),`Las mismas ${dN(X.kits)} unidades según el proyecto indicado en las columnas de selección o en el nombre del kit. «Sin datos» señala kits pendientes de asignar.`)}${cpT||'<span></span>'}</div>`:(cpT?`<div class="dblock drow">${cpT}</div>`:'')}
`;
}
const DASH_FKEYS=[['form','Formulario'],['estado','Estado'],['municipio','Municipio'],['parroquia','Parroquia'],['isAloj','¿Está en un alojamiento?'],['alojamiento','Alojamiento'],['comunidad','Comunidad'],['socio','Socio implementador']];
function dashActive(){ const F=S.dash.F; let n=Object.values(F.cats).filter(x=>x&&x.size).length; if(F.from!==S.dash.minDate||F.to!==S.dash.maxDate) n++; return n; }
function dashFilterSec(k,label,opts){ const s=S.dash.F.cats[k], st=!s||!s.size?'Todos':s.has('__none__')?'Ninguno':`${s.size} seleccionado${s.size>1?'s':''}`;
  return `<details class="fsec" data-fsec="${k}" ${S.dash.openSec===k?'open':''}><summary><span>${dEsc(label)}</span><span class="fst ${s&&s.size?'on':''}">${st}</span></summary><div class="fbody">
    ${opts.length>8?`<input class="in fsearch" type="search" placeholder="Buscar…" data-fsearch="${k}" aria-label="Buscar en ${dEsc(label)}">`:''}
    <div class="row" style="margin:6px 0"><button class="btn sm" type="button" data-dall="${k}">Todos</button><button class="btn sm" type="button" data-dnone="${k}">Ninguno</button></div>
    <div class="flist">${opts.map(([v,n,l])=>`<label class="check" data-ftext="${dEsc(fold(l||v))}"><input type="checkbox" data-dcat="${k}" value="${dEsc(v)}" ${!s||!s.size||s.has(v)?'checked':''}> <span>${dEsc(l||v)}</span> <span class="muted">${dN(n)}</span></label>`).join('')||'<p class="muted">Sin opciones con los filtros actuales.</p>'}</div></div></details>`; }
function dashMonthSelect(){ const D=S.dash, F=D.F, ms=[...new Set(D.recs.map(r=>r.fecha).filter(d=>d&&d>=D.minDate&&d<=D.maxDate).map(d=>d.slice(0,7)))].sort();
  const years=[...new Set(ms.map(m=>m.slice(0,4)))]; const last=m=>{ const [y,mo]=m.split('-').map(Number); return ymd(y,mo,new Date(Date.UTC(y,mo,0)).getUTCDate()); };
  const cur=ms.find(m=>F.from===[`${m}-01`,D.minDate].sort()[1]&&F.to===[last(m),D.maxDate].sort()[0])||'';
  return `<select class="in" id="dMonth" aria-label="Mes"><option value="">${F.from===D.minDate&&F.to===D.maxDate?'Todo el periodo':'Periodo personalizado'}</option>${years.map(y=>`<optgroup label="${y}">${ms.filter(m=>m.startsWith(y)).map(m=>`<option value="${m}" ${m===cur?'selected':''}>${MONTHS[+m.slice(5)-1]} ${y}</option>`).join('')}</optgroup>`).join('')}</select>`; }
function dashFilters(){
  const D=S.dash, F=D.F, ok=k=>D.recs.filter(r=>dashPass(r,F,k));
  const o=(k,lab)=>countBy(ok(k),r=>k==='form'?r.form:(r[k]||'(Sin dato)')).sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'es')).map(([v,n])=>[v,n,lab?lab(v):v]);
  return `<div class="fhead"><b>Filtros</b><button class="btn sm" type="button" id="fClose" aria-label="Cerrar filtros">✕</button></div>
  <div class="fscroll">
    <section class="fsec fper"><div class="fpt">Periodo</div>
      <div class="field"><label for="dMonth">Mes</label>${dashMonthSelect()}</div>
      <div class="row" style="margin-top:8px"><div class="field"><label for="dshFrom">Desde</label><input type="hidden" id="dshFrom" data-dp data-label="Desde" data-pair="dshTo" data-min="${D.minDate}" data-max="${D.maxDate}" value="${esc(F.from)}"></div><div class="field"><label for="dshTo">Hasta</label><input type="hidden" id="dshTo" data-dp data-label="Hasta" data-pair="dshFrom" data-min="${D.minDate}" data-max="${D.maxDate}" value="${esc(F.to)}"></div></div></section>
    ${DASH_FKEYS.filter(([k])=>k!=='form'||D.items.length>1).map(([k,l])=>dashFilterSec(k,l,o(k,k==='form'?mmLabel:null))).join('')}
  </div>
  <div class="ffoot"><button class="btn" type="button" id="dReset">Quitar filtros</button><button class="btn primary" type="button" id="fDone">Ver resultados</button></div>`;
}
function viewDash(){
  const n=dashActive();
  return `<div class="dash" id="dash">
    <div class="dtop noprint"><button class="btn" type="button" id="dBack">← Volver</button>
      <button class="btn" type="button" id="fOpen" aria-expanded="${!!S.dash.drawer}" aria-controls="fDrawer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 5h18M6 12h12M10 19h4"/></svg><span>Filtros</span><span class="fcount" id="fCount" ${n?'':'hidden'}>${n}</span></button>
      <span class="dsum muted" id="dSum">${dEsc(dFiltersText())}</span>
      <button class="btn primary" type="button" id="dPdf">Exportar tablero en PDF</button></div>
    <div class="fback noprint ${S.dash.drawer?'show':''}" id="fBack"></div>
    <aside class="fdrawer noprint ${S.dash.drawer?'open':''}" id="fDrawer" aria-label="Filtros" ${S.dash.drawer?'':'inert'}>${dashFilters()}</aside>
    <div id="dashBody">${dashBody()}</div></div>`;
}
function bindDash(){
  const D=S.dash, F=D.F;
  const setDrawer=open=>{ D.drawer=open; $('#fDrawer').classList.toggle('open',open); $('#fBack').classList.toggle('show',open); open?$('#fDrawer').removeAttribute('inert'):$('#fDrawer').setAttribute('inert',''); $('#fOpen').setAttribute('aria-expanded',String(open)); if(open){ const c=$('#fClose'); if(c) c.focus(); } else $('#fOpen').focus(); };
  const refresh=()=>{ $('#dashBody').innerHTML=dashBody(); const sc=$('.fscroll'), top=sc?sc.scrollTop:0; $('#fDrawer').innerHTML=dashFilters(); const sc2=$('.fscroll'); if(sc2) sc2.scrollTop=top; bindF();
    const n=dashActive(), fc=$('#fCount'); fc.textContent=n; fc.hidden=!n; $('#dSum').textContent=dFiltersText(); };
  const bindF=()=>{
    bindPeriod('dsh',F,D.recs.map(r=>r.fecha),'dshrange',refresh);
    const mo=$('#dMonth'); if(mo) mo.onchange=()=>{ const m=mo.value; if(!m){ F.from=D.minDate; F.to=D.maxDate; } else { const [y,mm]=m.split('-').map(Number); F.from=[`${m}-01`,D.minDate].sort()[1]; F.to=[ymd(y,mm,new Date(Date.UTC(y,mm,0)).getUTCDate()),D.maxDate].sort()[0]; } refresh(); };
    const sync=k=>{ const bx=[...document.querySelectorAll(`[data-dcat="${k}"]`)], sel=new Set(bx.filter(b=>b.checked).map(b=>b.value)); F.cats[k]=sel.size===bx.length?null:(sel.size?sel:new Set(['__none__'])); D.openSec=k; refresh(); };
    document.querySelectorAll('[data-dcat]').forEach(b=>b.onchange=()=>sync(b.dataset.dcat));
    document.querySelectorAll('[data-dall]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-dcat="${b.dataset.dall}"]`).forEach(x=>x.checked=true); sync(b.dataset.dall); });
    document.querySelectorAll('[data-dnone]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-dcat="${b.dataset.dnone}"]`).forEach(x=>x.checked=false); sync(b.dataset.dnone); });
    document.querySelectorAll('[data-fsearch]').forEach(inp=>inp.oninput=()=>{ const q=fold(inp.value); inp.closest('.fbody').querySelectorAll('[data-ftext]').forEach(l=>{ l.hidden=!!q&&!l.dataset.ftext.includes(q); }); });
    document.querySelectorAll('details.fsec').forEach(d=>d.addEventListener('toggle',()=>{ if(d.open){ D.openSec=d.dataset.fsec; document.querySelectorAll('details.fsec').forEach(o=>{ if(o!==d) o.open=false; }); } else if(D.openSec===d.dataset.fsec) D.openSec=null; }));
    const rs=$('#dReset'); if(rs) rs.onclick=()=>{ F.cats={}; F.from=D.minDate; F.to=D.maxDate; D.openSec=null; refresh(); };
    const cl=$('#fClose'); if(cl) cl.onclick=()=>setDrawer(false); const dn=$('#fDone'); if(dn) dn.onclick=()=>setDrawer(false);
  };
  bindF();
  $('#fOpen').onclick=()=>setDrawer(!D.drawer); $('#fBack').onclick=()=>setDrawer(false);
  document.onkeydown=e=>{ if(e.key==='Escape'&&S.dash&&S.dash.drawer&&!document.querySelector('dialog[open]')&&!dpOpen) setDrawer(false); };
  $('#dBack').onclick=()=>{ S.dash=null; render(); };
  $('#dPdf').onclick=async()=>{ busy(true); await nextFrame(); try{ await dashPdf(); }catch(e){ console.error(e); toast('No se pudo exportar el tablero: '+(e.message||e)); } busy(false); };
}
async function dashPdf(){
  if(!window.html2canvas||!window.jspdf){ toast('No se pudo cargar el generador de PDF. Revisa la conexión y recarga la página.'); return; }
  const root=document.documentElement, prevTheme=root.dataset.theme; root.dataset.theme='light'; document.body.classList.add('capturing'); await nextFrame();
  try{
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'landscape'}), W=297, H=210, M=10, CW=W-2*M; let y=M;
    for(const el of document.querySelectorAll('#dashBody .dblock')){
      const cv=await window.html2canvas(el,{scale:2,backgroundColor:'#FFFFFF',logging:false,useCORS:true});
      let w=CW, h=cv.height*w/cv.width; if(h>H-2*M-8){ h=H-2*M-8; w=cv.width*h/cv.height; }
      if(y+h>H-M-6){ const rem=H-M-6-y; if(rem>=h*0.78){ w*=rem/h; h=rem; } else { doc.addPage(); y=M; } }
      doc.addImage(cv.toDataURL('image/jpeg',0.92),'JPEG',M+(CW-w)/2,y,w,h); y+=h+3;
    }
    const n=doc.getNumberOfPages(); for(let i=1;i<=n;i++){ doc.setPage(i); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,128,140); doc.text(`Generado con el Depurador IMS el ${dmy(TODAY_YMD)} · Herramienta elaborada por Yohan Mayorga, Monitoreo y Evaluación, OIM Venezuela`,M,H-4); doc.text(`Página ${i} de ${n}`,W-M,H-4,{align:'right'}); }
    const F=S.dash.F; await saveFile(`Tablero_IMS${F.from&&F.to?`_${F.from}_a_${F.to}`:''}.pdf`,doc.output('blob'));
  } finally { if(prevTheme) root.dataset.theme=prevTheme; else delete root.dataset.theme; document.body.classList.remove('capturing'); }
}

