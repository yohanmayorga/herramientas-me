/* Herramientas M&E · Limpieza avanzada del Registro de Familias: exportación */
const SEV_LABEL={'Baja':'Se puede borrar','Media':'Revisar antes de borrar','Alta':'Caso complejo: consultar antes de borrar','Corrección':'Corregir dato'};
const SEV_STYLE={'Baja':11,'Media':12,'Alta':13,'Corrección':14};
async function regCleanExport(D,att){
  const P=regCleanPlan(D,att), C=D.sheets.cases, B=D.sheets.benef, fname=`Registro_Familias_Limpieza_${TODAY_YMD}.xlsx`;
  const red=[...P.notes.values()].filter(n=>n.red), cnt=s=>red.filter(n=>n.sev===s).length;
  const T=(v,s=0)=>[v,s];
  const resumen=[[T('Limpieza del Registro de Familias',16)],[T(`${D.file} · Generado el ${dmy(TODAY_YMD)}`)],[],
    [T('Concepto',1),T('Valor',1)],
    [T('Personas a borrar (duplicadas)',15),T(P.del.size)],[T(`· ${SEV_LABEL.Baja}`),T(cnt('Baja'))],[T(`· ${SEV_LABEL.Media}`),T(cnt('Media'))],[T(`· ${SEV_LABEL.Alta}`),T(cnt('Alta'))],
    [T('Familias a borrar (todos sus integrantes están en otras familias)',15),T(P.famDelete.size)],
    [T('Personas con datos a corregir',15),T([...P.notes.values()].filter(n=>!n.red).length)],[T('Familias con datos a corregir',15),T([...P.famNotes.values()].filter(n=>!n.red).length)],
    [T('Cruce con atenciones individuales',15),P.X.indChecked?T(`Realizado (${P.X.forms.ind.join(', ')})`):T('PENDIENTE: no se cargaron formularios de atenciones',9)],
    [T('Cruce con entregas de kits',15),P.X.famChecked?T(`Realizado (${P.X.forms.fam.join(', ')})`):T('PENDIENTE: no se cargaron formularios de kits',9)],[],
    [T('Colores',1),T('',1)],[T('',2),T('Fila en rojo: registro a borrar. La columna «Acción sugerida» indica si se puede borrar de inmediato o si antes hay que hacer algo.',10)],
    [T('',4),T('Celda en amarillo: dato a corregir. La explicación está en «Observaciones» y «Qué hacer».',10)],[T('',9),T('Naranja: revisión pendiente porque no se cargaron los formularios de asistencias.',10)],[],
    [T('Acción sugerida',1),T('Significado',1)],
    [T(SEV_LABEL.Baja,11),T('Duplicado que no es representante, sin atenciones y cuya familia no queda vacía.',10)],
    [T(SEV_LABEL.Media,12),T('Antes de borrar hay que asignar un nuevo representante adulto o reasignar atenciones o entregas a la persona o familia que se conserva.',10)],
    [T(SEV_LABEL.Alta,13),T('La familia quedaría solo con menores, la persona es representante en ambas familias o ambas versiones tienen atenciones. Revisar con el equipo antes de borrar.',10)],
    [T(SEV_LABEL['Corrección'],14),T('No se borra: hay que corregir el dato resaltado.',10)]];
  const dateCol=l=>/fecha|date/i.test(l);
  const famShort=t=>String(t).replace(/(familia|Familia) OIM-vcs-0*(\d+)/g,'$1 $2').replace(/\bOIM-vcs-0*(\d+)/g,'la familia $1');
  const build=(sh,map)=>{ const lab=sh.labels, isD=lab.map(dateCol), lr=sh.labelRow||2;
    const rows=[]; for(let i=0;i<lr-1;i++) rows.push([]);
    if(lr>1) rows[lr-2]=[null,null,null,...sh.machine.map(m=>m?T(m):null)];
    rows[lr-1]=[T('Acción sugerida',1),T('Observaciones',1),T('Qué hacer',1),...lab.map(l=>T(l,1))];
    const byN=new Map(); map.forEach((n,o)=>byN.set(o.n,n));
    sh.rows.forEach(x=>{ const n=byN.get(x.n), raw=x.r; while(rows.length<x.n-1) rows.push([]);
      if(!n){ rows[x.n-1]=[T('Sin observaciones',17),null,null,...lab.map((_,i)=>raw[i]==null||raw[i]===''?null:T(raw[i],isD[i]&&typeof raw[i]==='number'?6:0))]; return; }
      const cellIdx=new Set([...n.cells].map(k=>sh.idx[k]).filter(i=>i>=0));
      const cs=i=>{ const v=raw[i]; const d=isD[i]&&typeof v==='number'; if(n.red) return d?3:2; if(cellIdx.has(i)) return d?5:4; return d?6:0; };
      rows[x.n-1]=[T(n.red?SEV_LABEL[n.sev]:SEV_LABEL['Corrección'],n.red?SEV_STYLE[n.sev]:14),T(n.obs.join(' '),n.pending?9:n.red?7:8),T(famShort(n.act.join(' ')),n.red?7:8),...lab.map((_,i)=>T(raw[i]??null,cs(i)))]; });
    return {cols:[24,60,60,...lab.map(l=>Math.min(30,Math.max(11,String(l).length*0.9)))],rows,freeze:{x:1,y:lr},filter:true,filterRow:lr,hidden:new Set(lr>1?[lr-1]:[])}; };
  const dup=[[T('Grupo',1),T('Decisión',1),T('Código de familia',1),T('Fila',1),T('Nombres completos',1),T('Parentesco',1),T('Fecha de nacimiento',1),T('Cédula',1),T('Atenciones',1),T('Motivo',1)],
    ...P.dupRows.map(v=>{ const s=v[1]==='Eliminar'?2:0; return v.map((x,i)=>T(i===6&&x?serial(x):(i===1?(x==='Eliminar'?'Borrar':'Conservar'):x),i===6&&x?(s?3:6):(i===9?(s?7:10):s))); })];
  busy(true); await nextFrame();
  const blob=await xwBook([{name:'Resumen',cols:[60,90],rows:resumen},{name:'vzl_cases',...build(C,P.famNotes)},{name:'beneficiaries_vzl',...build(B,P.notes)},{name:'Duplicados (detalle)',cols:[9,11,17,8,32,24,14,16,12,70],rows:dup,freeze:{y:1},filter:true}]);
  await saveFile(fname,blob);
}
/* Formularios de atenciones cargados en el modo de archivo único para el cruce */
async function famLoadAtt(files){
  busy(true); await nextFrame();
  try{ S.famAtt=S.famAtt||[];
    for(const f of files){ const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}), t=detectForm(wb);
      if(!(ATT_CFG[t]||t==='nfi'||t==='wash')){ toast(`${f.name} no es un formulario de atenciones o de kits.`); continue; }
      const obj=t==='nfi'||t==='wash'?nfiLoad(wb,f.name,S.fam,t):salLoad(wb,f.name,S.fam,t);
      if(obj.fatal&&obj.fatal.length){ toast(`A ${f.name} le faltan columnas.`); continue; }
      S.famAtt=S.famAtt.filter(x=>x.type!==t); S.famAtt.push({type:t,label:mmLabel(t),file:f.name,obj}); }
  }catch(e){ console.error(e); toast('No se pudo leer el archivo: '+(e.message||e)); } finally{ busy(false); render(); }
}
