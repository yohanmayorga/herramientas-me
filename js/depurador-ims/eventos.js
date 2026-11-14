/* Herramientas M&E · Eventos de la interfaz y carga de archivos */
/* ============ Eventos ============ */
function bindStep(){
  const on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  if(S.step===1){
    document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ S.loadMode=b.dataset.mode; render(); });
    if(!S.loadMode) return;
    if(S.loadMode==='multi'){ mmLoadBind(); return; }
    { const tm=$('#toMode'); if(tm) tm.onclick=()=>{ S.loadMode=null; S.pending=null; render(); }; }
    const d=$('#drop');
    d.onclick=()=>$('#fileIn').click();
    d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#fileIn').click(); } };
    d.ondragover=e=>{ e.preventDefault(); d.classList.add('over'); };
    d.ondragleave=()=>d.classList.remove('over');
    d.ondrop=e=>{ e.preventDefault(); d.classList.remove('over'); handleFiles(e.dataTransfer.files); };
    document.querySelectorAll('[data-ptype]').forEach(sel=>sel.onchange=()=>{ S.pending[+sel.dataset.ptype].type=sel.value; render(); });
    const pc=$('#pendCancel'); if(pc) pc.onclick=()=>{ S.pending=null; render(); };
    const po=$('#pendOk'); if(po) po.onclick=processPending;
  }
  if(S.step===2){
    on('#pfPick','change',e=>{ applyProfile(allProfiles().find(p=>p.id===e.target.value)); render(); });
    document.querySelectorAll('[data-map]').forEach(s=>s.onchange=()=>{ const k=s.dataset.map; const h=s.value;
      if(h){ for(const kk in S.mapping) if(S.mapping[kk]===h&&kk!==k){ delete S.mapping[kk]; } S.mapping[k]=h; S.matchInfo[k]='manual'; } else delete S.mapping[k];
      refreshExtras(); render(); });
    document.querySelectorAll('[data-type]').forEach(s=>s.onchange=()=>{ S.fields.find(f=>f.key===s.dataset.type).type=s.value; });
    document.querySelectorAll('[data-role]').forEach(s=>s.onchange=()=>{ const r=s.value; if(r) S.fields.forEach(f=>{ if(f.role===r) f.role=''; }); S.fields.find(f=>f.key===s.dataset.role).role=r; render(); });
    on('#optExtra','change',e=>{ S.opts.includeExtra=e.target.checked; });
    on('#back','click',()=>{ S.step=1; render(); });
    on('#saveAsProfile','click',profileFromCurrent);
    on('#next','click',async()=>{ busy(true); await nextFrame(); try{ processData(); S.step=3; }catch(e){ console.error(e); toast('Error al procesar: '+(e.message||e)); } busy(false); render(); });
  }
  if(S.step===3){
    const upd=()=>{ $('#nOut').textContent=fmt(filteredRows().length); };
    on('#dateKey','change',e=>{ S.filters.dateKey=e.target.value; const ds=S.result.rows.map(r=>r.v[e.target.value]).filter(Boolean).sort(); S.result.minDate=ds[0]||''; S.result.maxDate=ds[ds.length-1]||''; S.filters.from=S.result.minDate; S.filters.to=S.result.maxDate; render(); });
    mountPickers(new Set(S.filters.dateKey?S.result.rows.map(r=>r.v[S.filters.dateKey]).filter(Boolean):[]));
    const setR=(a,z)=>{ [a,z]=orderRange(a,z); S.filters.from=a; S.filters.to=z; $('#dFrom').value=a; $('#dTo').value=z; dpRefreshAll(); upd(); };
    on('#dFrom','change',e=>setR(e.target.value,S.filters.to));
    on('#dTo','change',e=>setR(S.filters.from,e.target.value));
    document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{ const [a,z]=b.dataset.range.split('|'); setR(a,z); });
    on('#optDedupe','change',e=>{ S.opts.dedupe=e.target.checked; render(); });
    on('#optCrit','change',e=>{ S.opts.excludeCritical=e.target.checked; upd(); });
    on('#bands','change',e=>{ if(parseBands(e.target.value).length){ S.bands=e.target.value; toast('Grupos etarios actualizados.'); } else { e.target.value=S.bands; toast('Formato no válido. Ejemplo: 0-17:Menores, 18-150:Adultos'); } });
    const syncCat=k=>{ const boxes=[...document.querySelectorAll(`[data-cat="${CSS.escape(k)}"]`)]; const sel=new Set(boxes.filter(b=>b.checked).map(b=>b.value)); S.filters.cats[k]=sel.size===boxes.length?null:sel; const sum=boxes[0].closest('details').querySelector('summary .cnt'); sum.textContent=sel.size===boxes.length?`${boxes.length} valores · todos`:`${sel.size} de ${boxes.length} seleccionados`; upd(); };
    document.querySelectorAll('[data-cat]').forEach(b=>b.onchange=()=>syncCat(b.dataset.cat));
    document.querySelectorAll('[data-catall]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-cat="${CSS.escape(b.dataset.catall)}"]`).forEach(x=>x.checked=true); syncCat(b.dataset.catall); });
    document.querySelectorAll('[data-catnone]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-cat="${CSS.escape(b.dataset.catnone)}"]`).forEach(x=>x.checked=false); syncCat(b.dataset.catnone); });
    on('#back','click',()=>{ S.step=2; render(); });
    on('#next','click',()=>{ S.step=4; render(); });
  }
  if(S.step===4){
    const run=fn=>async()=>{ busy(true); await nextFrame(); try{ await fn(); }catch(e){ console.error(e); toast('Error al exportar: '+(e.message||e)); } busy(false); };
    on('#exClean','click',run(exportClean));
    on('#exPbi','click',run(()=>exportPBI('xlsx')));
    on('#exCsv','click',run(()=>exportPBI('csv')));
    on('#ex345','click',run(export345));
    on('#w345Month','change',e=>{ S.w345.byMonth=e.target.checked; info345(); });
    document.querySelectorAll('[data-dim]').forEach(b=>b.onclick=()=>{ const k=b.dataset.dim; const i=S.w345.dims.indexOf(k); if(i>=0) S.w345.dims.splice(i,1); else S.w345.dims.push(k); b.setAttribute('aria-pressed',i<0); info345(); });
    on('#back','click',()=>{ S.step=3; render(); });
    on('#restart','click',()=>{ S.step=1; S.result=null; S.mode=null; render(); });
    info345();
  }
}
function info345(){ const el=$('#w345Info'); if(!el) return; try{ const {cols,data}=w345Table(); el.textContent=`${fmt(data.length)} filas × ${cols.length} columnas`; }catch(e){ el.textContent=''; } }
$('#fileIn').addEventListener('change',e=>{ handleFiles(e.target.files); e.target.value=''; });

