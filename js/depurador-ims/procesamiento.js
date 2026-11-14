/* Herramientas M&E · Procesamiento y validación (modo genérico) */
/* ============ Procesamiento ============ */
function parseBands(str){
  return String(str).split(',').map(s=>s.trim()).filter(Boolean).map(s=>{ const [rng,lab]=s.split(':'); const [a,b]=rng.split('-').map(Number); return {min:a,max:b,label:(lab||rng).trim()}; }).filter(b=>isFinite(b.min)&&isFinite(b.max));
}
function ageAt(birth,ref){ const [by,bm,bd]=birth.split('-').map(Number); const [ry,rm,rd]=ref.split('-').map(Number); let a=ry-by; if(rm<bm||(rm===bm&&rd<bd)) a--; return a; }

function processData(){
  const fields=[...S.fields.filter(f=>S.mapping[f.key])];
  if(S.opts.includeExtra&&S.profile.id!=='auto'){
    const keys=new Set(fields.map(f=>f.key));
    S.extraHeaders.forEach(h=>{ let k=snake(h); while(keys.has(k)) k+='_x'; keys.add(k); const type=inferType(S.rows.map(r=>r[h])); fields.push({key:k,label:h,type,role:'',extra:true}); S.mapping[k]=h; });
  }
  const role=r=>fields.find(f=>f.role===r);
  const fFecha=role('fecha'), fSexo=role('sexo'), fEdad=role('edad'), fNac=role('nacimiento'), fId=role('id');
  const now=today();
  const out=[], issues=[];
  S.rows.forEach((raw,idx)=>{
    const v={}, bad={}; let critical=false;
    for(const f of fields){
      const rv=raw[S.mapping[f.key]]; let val;
      if(f.role==='sexo'){ val=normSexo(rv); if(val===undefined){ issues.push([raw.__file,raw.__row,f.label,toText(rv),'Valor de sexo no reconocido']); bad[f.key]=1; val=toText(rv); } }
      else if(f.type==='date'){ val=toDate(rv); if(val===undefined){ issues.push([raw.__file,raw.__row,f.label,toText(rv),'Fecha no válida']); bad[f.key]=1; val=null; if(f.role==='fecha') critical=true; }
        else if(val&&f.role==='fecha'&&val>now){ issues.push([raw.__file,raw.__row,f.label,val,'Fecha futura']); bad[f.key]=1; } }
      else if(f.type==='number'){ val=toNum(rv); if(val===undefined){ issues.push([raw.__file,raw.__row,f.label,toText(rv),'Número no válido']); bad[f.key]=1; val=null; } }
      else val=toText(rv);
      if(f.role==='edad'&&val!=null&&(val<0||val>120)){ issues.push([raw.__file,raw.__row,f.label,val,'Edad fuera de rango (0–120)']); bad[f.key]=1; val=null; }
      if(f.required&&(val==null||val==='')){ issues.push([raw.__file,raw.__row,f.label,'','Campo obligatorio vacío']); bad[f.key]=1; critical=true; }
      v[f.key]=val;
    }
    out.push({i:idx,file:raw.__file,row:raw.__row,v,bad,critical,dup:false});
  });
  // Normalización de mayúsculas/minúsculas en categorías: se usa la variante más frecuente
  if(S.opts.normCase){
    fields.filter(f=>f.type==='category'&&f.role!=='sexo').forEach(f=>{
      const freq={}; out.forEach(r=>{ const x=r.v[f.key]; if(x==null) return; const k=fold(x); (freq[k]=freq[k]||{})[x]=(freq[k][x]||0)+1; });
      const canon={}; for(const k in freq){ canon[k]=Object.entries(freq[k]).sort((a,b)=>b[1]-a[1]||(/[a-z]/.test(b[0])-/[a-z]/.test(a[0])))[0][0]; }
      out.forEach(r=>{ const x=r.v[f.key]; if(x!=null) r.v[f.key]=canon[fold(x)]; });
    });
  }
  // Edad calculada desde la fecha de nacimiento cuando falta
  const derivedAge=!fEdad&&fNac&&fFecha;
  out.forEach(r=>{
    let age=fEdad?r.v[fEdad.key]:null;
    if((age==null)&&fNac&&r.v[fNac.key]){ const ref=(fFecha&&r.v[fFecha.key])||now; const a=ageAt(r.v[fNac.key],ref); if(a>=0&&a<=120) age=a; }
    r.age=age;
  });
  // Duplicados
  let dedupeKeys=(S.profile.dedupeBy||[]).filter(k=>fields.some(f=>f.key===k));
  if(!dedupeKeys.length||dedupeKeys.length!==(S.profile.dedupeBy||[]).length) dedupeKeys=fields.map(f=>f.key);
  const seen=new Set(); let dups=0;
  out.forEach(r=>{ const k=dedupeKeys.map(x=>fold(r.v[x])).join('|'); if(seen.has(k)){ r.dup=true; dups++; issues.push([r.file,r.row,'(fila)','', 'Registro duplicado']); } else seen.add(k); });
  const dateVals=fFecha?out.map(r=>r.v[fFecha.key]).filter(Boolean).sort():[];
  S.result={fields,rows:out,issues,dups,dedupeKeys,roles:{fFecha,fSexo,fEdad,fNac,fId},derivedAge,
    minDate:dateVals[0]||'',maxDate:dateVals[dateVals.length-1]||''};
  S.filters={dateKey:fFecha?fFecha.key:(fields.find(f=>f.type==='date')||{}).key||null,from:'',to:'',cats:{}};
  if(S.filters.dateKey&&!fFecha){ const ds=out.map(r=>r.v[S.filters.dateKey]).filter(Boolean).sort(); S.result.minDate=ds[0]||''; S.result.maxDate=ds[ds.length-1]||''; }
  S.filters.from=S.result.minDate; S.filters.to=S.result.maxDate;
}
function filteredRows(){
  const R=S.result; if(!R) return [];
  const {dateKey,from,to,cats}=S.filters;
  return R.rows.filter(r=>{
    if(S.opts.dedupe&&r.dup) return false;
    if(S.opts.excludeCritical&&r.critical) return false;
    if(dateKey&&(from||to)){ const d=r.v[dateKey]; if(!d) return false; if(from&&d<from) return false; if(to&&d>to) return false; }
    for(const k in cats){ const set=cats[k]; if(set&&set.size&&!set.has(r.v[k]??'(vacío)')) return false; }
    return true;
  });
}
function ageBand(age){ if(age==null) return 'Sin dato'; for(const b of parseBands(S.bands)) if(age>=b.min&&age<=b.max) return b.label; return 'Sin dato'; }

