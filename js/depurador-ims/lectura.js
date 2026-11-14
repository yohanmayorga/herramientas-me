/* Herramientas M&E · Lectura de archivos Excel/CSV */
/* ============ Lectura de archivos ============ */
function detectHeaderRow(aoa){
  let best=0,bestScore=-1;
  for(let i=0;i<Math.min(20,aoa.length);i++){
    const r=aoa[i]||[]; const txt=r.filter(c=>typeof c==='string'&&c.trim()&&isNaN(Number(c))).length;
    const next=(aoa[i+1]||[]).filter(c=>c!==''&&c!=null).length;
    const score=txt*2+(next>0?1:0);
    if(score>bestScore){ bestScore=score; best=i; }
  }
  return best;
}
async function readFile(file){
  const buf=await file.arrayBuffer();
  const wb=XLSX.read(buf,{type:'array',cellDates:true});
  let sheetName=wb.SheetNames[0], max=-1;
  for(const n of wb.SheetNames){ const ref=wb.Sheets[n]['!ref']; if(!ref) continue; const r=XLSX.utils.decode_range(ref); const size=(r.e.r-r.s.r+1); if(size>max){max=size;sheetName=n;} }
  const aoa=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:null,raw:true,blankrows:false});
  if(!aoa.length) throw new Error(`La hoja “${sheetName}” está vacía.`);
  const h=detectHeaderRow(aoa);
  const seen={}; const headers=(aoa[h]||[]).map((c,i)=>{ let n=toText(c)||`Columna ${i+1}`; if(seen[n]){ seen[n]++; n=`${n} (${seen[n]})`; } else seen[n]=1; return n; });
  const rows=[];
  for(let i=h+1;i<aoa.length;i++){
    const r=aoa[i]; if(!r||r.every(c=>c==null||String(c).trim()==='')) continue;
    const o={__file:file.name,__row:i+1}; headers.forEach((hd,ci)=>{ o[hd]=r[ci]??null; }); rows.push(o);
  }
  const emptyCols=headers.filter(hd=>rows.every(r=>r[hd]==null||String(r[hd]).trim()===''));
  return {name:file.name,sheet:sheetName,sheets:wb.SheetNames.length,headerRow:h+1,headers,rows,emptyCols};
}
const FORM_TYPES=[['registro','Registro de Familias'],['salud','Atenciones en salud'],['mental','Atenciones en salud mental'],['proteccion','Atenciones en protección'],['psicosocial','Atenciones psicosociales (Protección)'],['comunitarias','Actividades comunitarias'],['nfi','Entrega de kits NFI'],['wash','Entrega de kits y servicios WASH'],['generic','Otro formulario (modo genérico)']];
const NEEDS_REG=new Set(['salud','mental','proteccion','psicosocial','nfi','wash']);
function detectForm(wb){
  try{ if(comDetect(wb)) return 'comunitarias'; const k=kitsSheet(wb); if(k) return k.cfg.id; if(famDetect(wb)) return 'registro'; const a=attSheet(wb); if(a) return a.cfg.id; }catch(e){ console.error(e); }
  return 'generic';
}
async function handleFiles(list){
  const files=[...list].filter(f=>/\.(xlsx|xls|xlsm|csv)$/i.test(f.name));
  if(!files.length){ toast('Selecciona archivos .xlsx, .xls o .csv descargados del IMS.'); return; }
  busy(true); await nextFrame();
  const pend=[];
  for(const f of files){ try{ const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}); const det=detectForm(wb); pend.push({f,wb,det,type:det}); }catch(e){ console.error(e); toast(`No se pudo leer ${f.name}.`); } }
  busy(false);
  if(!pend.length) return;
  S.pending=pend; S.loadMode='single'; S.step=1; render();
}
async function processPending(){
  const P=S.pending; if(!P||!P.length) return;
  busy(true); await nextFrame();
  try{
    const regs=P.filter(x=>x.type==='registro'), others=P.filter(x=>x.type!=='registro');
    for(const r of regs){ if(!famDetect(r.wb)){ toast(`${r.f.name} no tiene las pestañas vzl_cases y beneficiaries_vzl de un Registro de Familias.`); return; } }
    if(regs.length){ const D=famLoad(regs[0].wb,regs[0].f.name); if(D.fatal.length&&!others.length){ S.fam=D; S.mode=MODULES[0]; S.pending=null; S.step=2; return; } if(!D.fatal.length) S.registro=D; else toast('El Registro de Familias no tiene todas las columnas necesarias.');
      if(!others.length){ S.fam=D; S.mode=MODULES[0]; S.pending=null; S.step=2; return; } }
    const main=others[0], compType=ATT_CFG[main.type]&&ATT_CFG[main.type].companion, comp=compType?others.find(x=>x!==main&&x.type===compType):null; S.salComp=null;
    if(others.length>(comp?2:1)) toast(`Se procesa ${main.f.name}; los formularios se procesan de uno en uno.`);
    S.pending=null;
    if(main.type==='generic'){ await genericLoad(others.filter(x=>x.type==='generic').map(x=>x.f)); return; }
    if(main.type==='comunitarias'){ S.com=comLoad(main.wb,main.f.name); S.mode=COM_MODULE; S.step=2; return; }
    if(main.type==='nfi'||main.type==='wash'){ S.nfiWb={wb:main.wb,name:main.f.name,type:main.type}; S.nfi=nfiLoad(main.wb,main.f.name,S.registro||null,main.type); S.mode=NFI_MODULE; S.step=2; return; }
    S.salWb={wb:main.wb,name:main.f.name,type:main.type}; S.sal=salLoad(main.wb,main.f.name,S.registro||null,main.type); if(comp){ S.salComp={wb:comp.wb,name:comp.f.name,type:comp.type}; salReattachComp(); } S.mode=SAL_MODULE; S.step=2;
  }catch(e){ console.error(e); toast('No se pudo procesar el archivo con el tipo elegido. Verifica que sea el formulario correcto.'); S.step=1; }
  finally{ busy(false); render(); }
}
async function genericLoad(files){
  const parsed=[], errors=[];
  for(const f of files){ try{ parsed.push(await readFile(f)); }catch(e){ errors.push(`${f.name}: ${e.message||'no se pudo leer'}`); } }
  if(!parsed.length){ toast('No se pudo leer ningún archivo. '+errors.join(' ')); return; }
  S.files=parsed; S.fileErrors=errors; S.mode=null;
  const hs=[]; parsed.forEach(p=>p.headers.forEach(h=>{ if(!hs.includes(h)) hs.push(h); }));
  const allEmpty=new Set(hs.filter(h=>parsed.every(p=>!p.headers.includes(h)||p.emptyCols.includes(h))));
  S.emptyCols=[...allEmpty];
  S.headers=hs.filter(h=>!allEmpty.has(h));
  S.rows=parsed.flatMap(p=>p.rows);
  const det=detectProfile(); S.detection=det;
  applyProfile(det.profile);
  S.step=2;
}

