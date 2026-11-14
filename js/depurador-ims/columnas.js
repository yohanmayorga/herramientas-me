/* Herramientas M&E · Emparejamiento de columnas (modo genérico) */
/* ============ Emparejamiento de columnas ============ */
function scoreHeader(header, alias){
  const h=fold(header), a=fold(alias); if(!h||!a) return 0;
  if(h===a) return 1;
  if(a.length<4) return 0;
  const hw=` ${h} `, aw=` ${a} `;
  if(hw.includes(aw)) return 0.6+0.3*(a.length/h.length);
  if(h.length>=5&&aw.includes(hw)) return 0.55+0.3*(h.length/a.length);
  return 0;
}
function matchFields(fields, headers){
  const cands=[];
  fields.forEach(f=>{ const al=[f.label,f.key.replace(/_/g,' '),...(f.aliases||[])];
    headers.forEach(h=>{ let best=0; al.forEach(a=>{ best=Math.max(best,scoreHeader(h,a)); }); if(best>=0.6) cands.push({k:f.key,h,s:best}); }); });
  cands.sort((a,b)=>b.s-a.s);
  const map={}, info={}, used=new Set();
  for(const c of cands){ if(map[c.k]||used.has(c.h)) continue; map[c.k]=c.h; info[c.k]=c.s>=0.999?'exacta':'aproximada'; used.add(c.h); }
  return {map,info};
}
function detectProfile(){
  let best={profile:allProfiles().find(p=>p.id==='auto'),score:0};
  for(const p of allProfiles()){
    if(p.id==='auto'||!p.fields.length) continue;
    const {map}=matchFields(p.fields,S.headers);
    const req=p.fields.filter(f=>f.required); const reqOk=req.filter(f=>map[f.key]).length;
    const score=(req.length?reqOk/req.length:1)*0.6+(Object.keys(map).length/p.fields.length)*0.4;
    if(score>=(p.minScore??0.5)&&score>best.score) best={profile:p,score};
  }
  return best;
}
function inferType(values){
  const ne=values.filter(v=>v!=null&&String(v).trim()!=='').slice(0,800);
  if(!ne.length) return 'text';
  const dates=ne.filter(v=>v instanceof Date||(typeof v==='string'&&toDate(v)&&/[\/\-]/.test(v))).length;
  if(dates/ne.length>0.8) return 'date';
  const nums=ne.filter(v=>typeof v==='number'||(typeof v==='string'&&/^-?[\d.,\s]+$/.test(v.trim())&&toNum(v)!==undefined)).length;
  if(nums/ne.length>0.85) return 'number';
  const distinct=new Set(ne.map(v=>fold(v))).size;
  if(distinct<=60&&(distinct<=ne.length*0.5||ne.length<20)) return 'category';
  return 'text';
}
function guessRole(header,type){
  const h=fold(header);
  if(type==='date'&&h.includes('nacim')) return 'nacimiento';
  if(type==='date'&&h.includes('fecha')) return 'fecha';
  if(/(^| )(sexo|genero)( |$)/.test(h)) return 'sexo';
  if(/^edad( |$)/.test(h)) return 'edad';
  if(/(cedula|documento|id beneficiario|codigo beneficiario|id persona|id unico)/.test(h)) return 'id';
  return '';
}
function autoFields(headers){
  const fields=headers.map(h=>{ const type=inferType(S.rows.map(r=>r[h])); const role=guessRole(h,type); return {key:snake(h),label:h,type:role==='edad'?'number':type,role,aliases:[h]}; });
  const seen={}; fields.forEach(f=>{ if(seen[f.key]){ seen[f.key]++; f.key+=`_${seen[f.key]}`; } else seen[f.key]=1; });
  // Un solo campo por rol (el primero, priorizando fecha de atención/registro)
  const dates=fields.filter(f=>f.role==='fecha'); if(dates.length>1){ const pref=dates.find(f=>/atencion|registro|servicio/.test(fold(f.label)))||dates[0]; dates.forEach(f=>{ if(f!==pref) f.role=''; }); }
  ['sexo','edad','nacimiento','id'].forEach(r=>{ fields.filter(f=>f.role===r).slice(1).forEach(f=>f.role=''); });
  return fields;
}
function applyProfile(p){
  S.profile=p;
  if(p.id==='auto'){
    S.fields=autoFields(S.headers);
    S.mapping={}; S.matchInfo={}; S.fields.forEach((f,i)=>{ S.mapping[f.key]=S.headers[i]; S.matchInfo[f.key]='exacta'; });
  } else {
    S.fields=p.fields.map(f=>({type:'text',role:'',...f}));
    const {map,info}=matchFields(S.fields,S.headers); S.mapping=map; S.matchInfo=info;
  }
  refreshExtras();
  S.w345.dims=(p.w345||[]).filter(k=>S.mapping[k]);
  S.result=null;
}
function refreshExtras(){ const used=new Set(Object.values(S.mapping).filter(Boolean)); S.extraHeaders=S.headers.filter(h=>!used.has(h)); }

