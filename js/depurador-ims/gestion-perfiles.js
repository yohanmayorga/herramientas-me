/* Herramientas M&E · Diálogo de gestión de perfiles */
/* ============ Gestión de perfiles ============ */
let pfCurrent=null;
function openProfiles(selectId){
  const list=allProfiles();
  $('#pfSel').innerHTML=list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${p.builtin?' (predefinido)':''}</option>`).join('');
  pfCurrent=selectId||list[0].id; $('#pfSel').value=pfCurrent; showProfile();
  if(!$('#dlg').open) $('#dlg').showModal();
}
function showProfile(){
  const p=allProfiles().find(x=>x.id===pfCurrent); const copy={...p}; delete copy.builtin;
  $('#pfJson').value=JSON.stringify(copy,null,2); $('#pfErr').textContent=p.builtin?'Los perfiles predefinidos se pueden editar: al guardar se crea tu versión.':''; $('#pfErr').style.color='';
  $('#pfDel').disabled=!!p.builtin; $('#pfJson').readOnly=p.id==='auto';
}
function storeProfile(p){
  const err=validateProfile(p); if(err){ $('#pfErr').textContent=err; $('#pfErr').style.color='var(--bad)'; return false; }
  if(p.id==='auto'){ $('#pfErr').textContent='El perfil automático no se puede modificar.'; return false; }
  const c=loadCustom().filter(x=>x.id!==p.id); c.push(p); if(!saveCustom(c)) return false;
  toast(`Perfil guardado: ${p.name}`); return true;
}
function profileFromCurrent(){
  const inp=$('#pfName'); const name=(inp&&inp.value||'').trim();
  if(!name){ toast('Escribe un nombre para el perfil.'); if(inp) inp.focus(); return; }
  const id=snake(name);
  const fields=S.fields.filter(f=>S.mapping[f.key]).map(f=>{ const al=new Set([...(f.aliases||[]),S.mapping[f.key]]); const o={key:f.key,label:f.label,type:f.type,aliases:[...al]}; if(f.role) o.role=f.role; if(f.required||f.role==='fecha') o.required=true; return o; });
  const p={id,name,description:`Creado desde ${S.files.map(f=>f.name).join(', ')} el ${today()}`,minScore:0.5,fields,
    w345:S.w345.dims.length?S.w345.dims:fields.filter(f=>f.type==='category').slice(0,5).map(f=>f.key)};
  if(S.profile.dedupeBy&&S.profile.dedupeBy.every(k=>fields.some(f=>f.key===k))) p.dedupeBy=S.profile.dedupeBy;
  if(storeProfile(p)){ S.profile=allProfiles().find(x=>x.id===id); S.detection={profile:S.profile,score:1}; render(); }
}


$('#dlg').addEventListener('click',e=>{ if(e.target.hasAttribute('data-close')) $('#dlg').close(); });
$('#pfSel').onchange=e=>{ pfCurrent=e.target.value; showProfile(); };
$('#pfSave').onclick=()=>{ let p; try{ p=JSON.parse($('#pfJson').value); }catch(e){ $('#pfErr').textContent='JSON no válido: '+e.message; $('#pfErr').style.color='var(--bad)'; return; }
  if(storeProfile(p)){ openProfiles(p.id); if(S.step===2&&S.profile&&S.profile.id===p.id){ applyProfile(allProfiles().find(x=>x.id===p.id)); render(); } } };
$('#pfNew').onclick=()=>{ $('#pfJson').readOnly=false; $('#pfJson').value=JSON.stringify({id:'nuevo_formulario',name:'Nuevo formulario',description:'',minScore:0.5,fields:[{key:'fecha',label:'Fecha',type:'date',role:'fecha',required:true,aliases:['fecha']}],dedupeBy:[],w345:[]},null,2); $('#pfErr').textContent='Edita y guarda.'; $('#pfDel').disabled=true; };
$('#pfDup').onclick=()=>{ let p; try{ p=JSON.parse($('#pfJson').value); }catch(e){ return; } p.id=p.id+'_copia'; p.name=p.name+' (copia)'; $('#pfJson').readOnly=false; $('#pfJson').value=JSON.stringify(p,null,2); $('#pfErr').textContent='Copia sin guardar.'; };
$('#pfDel').onclick=()=>{ const b=$('#pfDel'); if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent='Confirmar eliminación'; setTimeout(()=>{ delete b.dataset.armed; b.textContent='Eliminar'; },4000); return; } delete b.dataset.armed; b.textContent='Eliminar'; saveCustom(loadCustom().filter(x=>x.id!==pfCurrent)); toast('Perfil eliminado.'); openProfiles(); };
$('#pfExport').onclick=()=>{ const c=loadCustom(); if(!c.length){ toast('No hay perfiles propios para exportar.'); return; } saveFile(`perfiles_depurador_ims_${today()}.json`,new Blob([JSON.stringify(c,null,2)],{type:'application/json'})); };
$('#pfImport').onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ let j=JSON.parse(await f.text()); if(!Array.isArray(j)) j=[j]; const bad=j.map(validateProfile).find(Boolean); if(bad) throw new Error(bad); const c=loadCustom().filter(x=>!j.some(y=>y.id===x.id)); saveCustom([...c,...j.filter(p=>p.id!=='auto')]); toast(`${j.length} perfil(es) importado(s).`); openProfiles(j[0].id); }catch(err){ toast('No se pudo importar: '+err.message); } e.target.value=''; };

