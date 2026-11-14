/* Herramientas M&E · Limpieza avanzada del Registro de Familias: plan */
/* ============ Limpieza avanzada del Registro de Familias ============ */
const REL_PREF=['pareja','padre madre','abuelo a','hermano a','tio a','hijo a','nieto a'];
function regAttIndex(att){
  const byPerson=new Map(), byFamKits=new Map(), forms={ind:[],fam:[]};
  (att||[]).forEach(it=>{ const o=it.obj; if(!o||!o.rows) return;
    if(it.type==='nfi'||it.type==='wash'){ forms.fam.push(it.label); o.rows.forEach(a=>{ if(a.num==null) return; if(!byFamKits.has(a.num)) byFamKits.set(a.num,[]); byFamKits.get(a.num).push({form:mmShort[it.type]||it.label,code:a.code,fecha:a.fecha}); }); return; }
    if(ATT_CFG[it.type]){ forms.ind.push(it.label); o.rows.forEach(a=>{ if(!a.p) return; if(!byPerson.has(a.p)) byPerson.set(a.p,[]); byPerson.get(a.p).push({form:mmShort[it.type]||it.label,code:a.code,fecha:a.fecha}); }); } });
  return {byPerson,byFamKits,forms,indChecked:forms.ind.length>0,famChecked:forms.fam.length>0};
}
const ageTxt=p=>p.age!=null?`${p.age} años`:'edad sin dato';
const attTxt=list=>{ const by=countBy(list,x=>x.form); return by.map(([f,n])=>`${n} de ${f}`).join(', '); };
function regCleanPlan(D,att){
  const E=D.err, X=regAttIndex(att), isL=p=>p.rel.startsWith('representante');
  const notes=new Map(), famNotes=new Map(), dupRows=[];
  const note=(m,k)=>{ if(!m.has(k)) m.set(k,{red:false,sev:'',obs:[],act:[],cells:new Set(),pending:false}); return m.get(k); };
  const SEVR={'':0,'Corrección':1,'Baja':2,'Media':3,'Alta':4}, bump=(n,s)=>{ if(SEVR[s]>SEVR[n.sev]) n.sev=s; };
  const members=f=>D.famByNum.get(f.num)===f?(D.byFam.get(f.num)||[]):[];
  const valid=p=>(p.id?1:0)+(p.birth?1:0);
  const del=new Map();
  // 1) Duplicados: decidir a quién conservar
  E.dup.forEach(g=>{
    const score=p=>{ const fam=p.f?members(p.f):[]; return (isL(p)?40:0)+((X.byPerson.get(p)||[]).length?30:0)+(p.f&&X.byFamKits.get(p.fam)?10:0)+valid(p)*3+(fam.length>1?2:0); };
    const ranked=g.ps.slice().sort((a,b)=>score(b)-score(a)||((a.f&&a.f.created||'9')<(b.f&&b.f.created||'9')?-1:1)||a.n-b.n);
    const keep=ranked[0], tie=ranked.length>1&&score(ranked[0])===score(ranked[1])&&isL(ranked[0])&&isL(ranked[1]);
    ranked.slice(1).forEach(p=>del.set(p,{keep,crit:g.crit,tie}));
    ranked.forEach((p,i)=>dupRows.push([g.id,i===0?'Conservar':'Eliminar',p.f?p.f.code:'(sin familia)',p.n,p.name,p.parentesco,p.birth||null,p.idRaw,(X.byPerson.get(p)||[]).length||(X.indChecked?0:'Sin verificar'),
      i===0?`Se conserva: ${[isL(p)?'es representante':'',(X.byPerson.get(p)||[]).length?'tiene atenciones':'',valid(p)?'datos más completos':''].filter(Boolean).join(', ')||'primer registro'}`:`Duplicado de ${keep.name} en ${keep.f?keep.f.code:'(sin familia)'} (${g.crit})`]));
  });
  // 2) Consecuencias de cada eliminación
  const famDelete=new Set();
  D.fams.forEach(f=>{ const ms=members(f); if(ms.length&&ms.every(p=>del.has(p))) famDelete.add(f); });
  del.forEach((d,p)=>{ const n=note(notes,p), k=d.keep, kf=k.f?k.f.code:'(sin familia)';
    n.red=true; bump(n,'Baja');
    n.obs.push(`Persona duplicada: también está en ${kf} (fila ${k.n}) como ${k.parentesco||'sin parentesco'}; coincide por ${d.crit.toLowerCase()}.`);
    n.act.push(`Borrar este registro y conservar el de ${kf}.`);
    const wholeFam=p.f&&famDelete.has(p.f);
    if(d.tie&&!wholeFam){ bump(n,'Alta'); n.obs.push('Es representante en ambas familias.'); n.act.push(`Confirmar con el equipo en cuál familia vive actualmente antes de eliminar.`); }
    const at=X.byPerson.get(p)||[], atK=X.byPerson.get(k)||[];
    if(at.length){ bump(n,'Media'); n.act.push(`Reasignar ${attTxt(at)} (${at.slice(0,4).map(x=>x.code).join(', ')}${at.length>4?'…':''}) a ${k.name} de ${kf}.`);
      if(atK.length){ bump(n,'Alta'); n.obs.push(`Ambas versiones tienen atenciones (esta: ${attTxt(at)}; la que se conserva: ${attTxt(atK)}); revisar que no estén duplicadas al unificarlas.`); } }
    if(!X.indChecked){ n.pending=true; n.obs.push('PENDIENTE: no se cargaron los formularios de atenciones individuales (salud, salud mental, protección, psicosocial); verificar si esta persona tiene atenciones antes de eliminarla.'); }
    const f=p.f; if(!f) return;
    if(famDelete.has(f)) return;
    const rest=members(f).filter(x=>!del.has(x));
    if(isL(p)&&!rest.some(isL)){ const adults=rest.filter(x=>x.age!=null&&x.age>=18).sort((a,b)=>{ const ia=REL_PREF.indexOf(a.rel), ib=REL_PREF.indexOf(b.rel); return (ia<0?99:ia)-(ib<0?99:ib)||b.age-a.age; });
      if(adults.length){ bump(n,'Media'); n.obs.push(`Es el representante de ${f.code}.`); n.act.push(`Al eliminarlo, la familia queda sin representante: asignar como representante a ${adults[0].name} (${ageTxt(adults[0])}, ${adults[0].parentesco||'sin parentesco'}).`);
        const nn=note(notes,adults[0]); nn.cells.add('parentesco'); bump(nn,'Corrección'); nn.obs.push(`Su representante (${p.name}) se elimina por estar duplicado en ${kf}.`); nn.act.push('Asignarle la categoría de representante / líder del grupo.'); }
      else { bump(n,'Alta'); n.obs.push(`Es el representante de ${f.code} y en la familia solo quedarían menores de edad (${rest.map(x=>`${x.name}, ${ageTxt(x)}`).join('; ')}).`);
        n.act.push(`No eliminar sin antes trasladar a esos menores a ${kf} (con ${k.name}) o registrar a un adulto responsable como representante.`); } }
  });
  // 3) Familias que quedan vacías
  famDelete.forEach(f=>{ const n=note(famNotes,f), ms=members(f); n.red=true; bump(n,'Baja');
    n.obs.push(`Todos sus integrantes están registrados en otras familias: ${ms.map(p=>`${p.name} → ${del.get(p).keep.f?del.get(p).keep.f.code:'(sin familia)'}`).join('; ')}.`);
    n.act.push('Borrar la familia (después de borrar a sus integrantes duplicados).');
    const kits=X.byFamKits.get(f.num)||[], to=[...new Set(ms.map(p=>del.get(p).keep.f&&del.get(p).keep.f.code).filter(Boolean))];
    if(kits.length){ bump(n,'Media'); n.act.push(`Antes de eliminarla, reasignar ${attTxt(kits)} (${kits.slice(0,4).map(x=>x.code).join(', ')}${kits.length>4?'…':''}) a ${to.join(' o ')}.`); }
    if(!X.famChecked){ n.pending=true; n.obs.push('PENDIENTE: no se cargaron los formularios de entrega de kits (NFI y WASH); verificar si la familia recibió entregas antes de eliminarla.'); }
    ms.forEach(p=>{ const pn=note(notes,p); if(!pn.act.some(a=>a.includes('la familia completa'))) pn.act.push(`La familia ${f.code} completa debe eliminarse (ver pestaña vzl_cases).`); });
  });
  // 4) Correcciones (celdas en amarillo) para registros que se conservan
  const keepP=p=>!del.has(p);
  E.birth.forEach(x=>{ if(!keepP(x.p)) return; const n=note(notes,x.p); bump(n,'Corrección'); n.cells.add('birth'); if(/representante|pareja|hijo|nieto|padre|abuelo/i.test(x.prob)) n.cells.add('parentesco');
    n.obs.push(x.prob+'.'); n.act.push(/representante|pareja|hijo|nieto|padre|abuelo/i.test(x.prob)?'Revisar la fecha de nacimiento o el parentesco.':'Corregir la fecha de nacimiento.'); });
  // Las cédulas con formato no válido (0000000, 9999999, etc.) no se resaltan: ya se excluyen de la detección de duplicados.
  E.idConflict.forEach(x=>{ const ps=x.ps.filter(keepP); if(ps.length<2) return; ps.forEach(p=>{ const n=note(notes,p); bump(n,'Corrección'); n.cells.add('idno'); n.cells.add('name');
    n.obs.push(`La cédula ${x.id} también la tiene ${ps.filter(o=>o!==p).map(o=>`${o.name} (${o.f?o.f.code:'sin familia'})`).join(', ')}.`); n.act.push('Verificar a quién pertenece la cédula y corregir la otra.'); }); });
  E.leader.forEach(x=>{ if(famDelete.has(x.f)) return; const ms=x.ps.filter(keepP);
    if(x.prob.startsWith('Sin')){ if(ms.some(isL)) return; const n=note(famNotes,x.f); bump(n,'Corrección'); n.cells.add('code'); n.obs.push('Familia sin representante / líder del grupo.');
      const ad=ms.filter(p=>p.age!=null&&p.age>=18).sort((a,b)=>b.age-a.age); n.act.push(ad.length?`Asignar como representante a ${ad[0].name} (${ageTxt(ad[0])}).`:'Asignar un representante adulto; la familia solo tiene menores o personas sin edad válida.'); }
    else { const L=ms.filter(isL); if(L.length<2) return; L.forEach(p=>{ const n=note(notes,p); bump(n,'Corrección'); n.cells.add('parentesco'); n.obs.push(`La familia ${x.f.code} tiene ${L.length} representantes.`); n.act.push('Dejar un solo representante y corregir el parentesco de los demás.'); }); } });
  E.famNoPers.forEach(f=>{ const n=note(famNotes,f); bump(n,'Corrección'); n.cells.add('code'); n.obs.push('Familia sin integrantes registrados.'); n.act.push('Registrar a sus integrantes o eliminar la familia.'); });
  E.persNoFam.forEach(p=>{ const n=note(notes,p); bump(n,'Corrección'); n.cells.add('fam'); n.obs.push(`Su código de familia (Excel Index ${p.fam??'vacío'}) no existe en vzl_cases.`); n.act.push('Corregir el código de familia o eliminar el registro.'); });
  E.badCode.forEach(x=>{ const n=note(famNotes,x.f); bump(n,'Corrección'); n.cells.add('code'); n.obs.push(x.prob+'.'); n.act.push('Corregir el código de la familia.'); });
  return {notes,famNotes,dupRows,X,del,famDelete};
}
