/* Herramientas M&E · Informe PDF del Registro de Familias */
/* ============ Informe PDF (Registro de Familias) ============ */
const REP_CATS=[['org','Equipo implementador'],['estado','Estado de procedencia'],['municipio','Municipio de procedencia'],['parroquia','Parroquia de procedencia'],['alojamiento','Alojamiento']];
const AGE_GROUPS=[['0-5',0,5],['6-11',6,11],['12-17',12,17],['18-59',18,59],['60+',60,150]];
const LOGO_KEY='depurador-ims-logo';
function repInit(){ const D=S.fam; if(!D.rep){ let logo=null; try{ logo=JSON.parse(localStorage.getItem(LOGO_KEY)||'null'); }catch(e){}
  D.rep={from:D.minDate,to:D.maxDate,cats:{},title:'Informe de registro de familias',notes:'',logo}; } return D.rep; }
const pct=(a,b)=>!b?'0 %':(a>0&&a/b<0.0005)?'<0,1 %':(a/b*100).toLocaleString('es-VE',{maximumFractionDigits:1})+' %';
const countBy=(arr,fn)=>{ const m=new Map(); arr.forEach(x=>{ const k=fn(x); if(k==null||k==='') return; m.set(k,(m.get(k)||0)+1); }); return [...m.entries()].sort((a,b)=>b[1]-a[1]); };
function repData(){
  const D=S.fam, R=repInit();
  const fams=D.fams.filter(f=>D.famByNum.get(f.num)===f&&famPass(f,R));
  const pers=fams.flatMap(f=>D.byFam.get(f.num)||[]);
  const withP=fams.filter(f=>(D.byFam.get(f.num)||[]).length).length;
  const sex=s=>{ const x=fold(s); return x==='mujer'?'Mujer':x==='hombre'?'Hombre':'Otro'; };
  const pyr=AGE_GROUPS.map(([l,a,b])=>({l,m:pers.filter(p=>sex(p.sexo)==='Mujer'&&p.ageReg!=null&&p.ageReg>=a&&p.ageReg<=b).length,h:pers.filter(p=>sex(p.sexo)==='Hombre'&&p.ageReg!=null&&p.ageReg>=a&&p.ageReg<=b).length}));
  const E=famScopedErr(R);
  const obsFams=new Set([...E.famNoPers.map(f=>f.code),...E.leader.map(x=>x.f.code),...E.birth.filter(x=>x.p.f&&famPass(x.p.f,R)).map(x=>x.p.f.code),
    ...E.dup.flatMap(g=>g.ps.filter(p=>p.f&&famPass(p.f,R)).map(p=>p.f.code))]);
  const orgs=countBy(fams,f=>f.org||'(sin dato)').map(([o,n])=>{ const ps=fams.filter(f=>(f.org||'(sin dato)')===o).reduce((t,f)=>t+(D.byFam.get(f.num)||[]).length,0); return [o,n,ps]; });
  return {R,fams,pers,withP,
    mujeres:pers.filter(p=>sex(p.sexo)==='Mujer').length, hombres:pers.filter(p=>sex(p.sexo)==='Hombre').length, otros:pers.filter(p=>sex(p.sexo)==='Otro').length,
    pyr, sinEdad:pers.filter(p=>p.ageReg==null).length,
    nna:pers.filter(p=>p.ageReg!=null&&p.ageReg<18).length, mayores:pers.filter(p=>p.ageReg!=null&&p.ageReg>=60).length,
    disc:pers.filter(p=>fold(p.disc)==='si').length,
    venez:pers.filter(p=>fold(p.nat)==='venezolana').length,
    enAloj:fams.filter(f=>fold(f.sheltered)==='si').length,
    perfiles:PERFILES.filter(x=>x!=='Ninguno').map(x=>[x,pers.filter(p=>p.perfil.has(x)).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]),
    aloj:countBy(fams,f=>f.alojamiento), mun:countBy(fams,f=>f.municipio?`${f.municipio} (${f.estado||'sin estado'})`:null), est:countBy(fams,f=>f.estado),
    afect:countBy(fams,f=>f.afectacion), orgs,
    q:{sinRep:E.leader.length,fechas:new Set(E.birth.filter(x=>x.p.f&&famPass(x.p.f,R)).map(x=>x.p)).size,
       dup:new Set(E.dup.flatMap(g=>g.ps.filter(p=>p.f&&famPass(p.f,R)))).size,famNoPers:E.famNoPers.length,obsFams:obsFams.size}};
}
function repFilterText(R){
  const parts=[]; const sel=k=>R.cats[k]&&R.cats[k].size?[...R.cats[k]]:null;
  const o=sel('org'); parts.push(o?`Equipo: ${o.join(', ')}`:'Todos los equipos implementadores');
  ['estado','municipio','parroquia','alojamiento'].forEach(k=>{ const v=sel(k); if(v) parts.push(`${REP_CATS.find(c=>c[0]===k)[1]}: ${v.join(', ')}`); });
  return parts;
}

async function repPdf(ext){
  if(!window.jspdf||!window.jspdf.jsPDF){ toast('No se pudo cargar el generador de PDF. Revisa la conexión y recarga la página.'); return; }
  const X=repData(), R=X.R; if(!X.fams.length){ if(!ext) toast('No hay familias con los criterios seleccionados.'); return; }
  const doc=ext?ext.doc:new window.jspdf.jsPDF({unit:'mm',format:'a4'}); if(ext) doc.addPage();
  const W=210, M=14, CW=W-2*M;
  const C={blue:[0,51,160],blue2:[65,143,222],pale:[231,238,249],ink:[34,43,69],grey:[107,114,128],line:[217,223,234],amber:[226,149,0],white:[255,255,255]};
  const fill=c=>doc.setFillColor(...c), stroke=c=>doc.setDrawColor(...c), color=c=>doc.setTextColor(...c);
  const T=(s,x,y,o={})=>{ doc.setFont('helvetica',o.bold?'bold':'normal'); doc.setFontSize(o.size||8); color(o.c||C.ink); doc.text(String(s),x,y,{align:o.align||'left',baseline:o.base||'alphabetic',maxWidth:o.maxW}); };
  const fit=(s,w,size,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(size); s=String(s); if(doc.getTextWidth(s)<=w) return s; while(s.length>1&&doc.getTextWidth(s+'…')>w) s=s.slice(0,-1); return s+'…'; };
  const N=n=>Number(n).toLocaleString('es-VE');
  const section=(t,x,y,w)=>{ T(t,x,y,{size:9.5,bold:true,c:C.blue}); stroke(C.blue2); doc.setLineWidth(0.5); doc.line(x,y+1.6,x+12,y+1.6); return y+6; };
  const PG={top:20,bottom:277};
  const newPage=()=>{ doc.addPage(); fill(C.blue); doc.rect(0,0,W,11,'F'); fill(C.blue2); doc.rect(0,11,W,0.8,'F'); T(fit(R.title||'',CW,9,true),M,7.2,{size:9,bold:true,c:C.white}); return PG.top; };
  const need=(y,h)=>y+h>PG.bottom?newPage():y;
  const notes=y=>{ if(!(R.notes&&R.notes.trim())) return y; y=need(y,16); y=section('Observaciones',M,y,CW); doc.setFontSize(7.6);
    for(const ln of doc.splitTextToSize(R.notes.trim(),CW)){ if(y+3.4>PG.bottom) y=newPage(); T(ln,M,y+1,{size:7.6}); y+=3.4; } return y; };
  const footer=src=>{ const n=doc.getNumberOfPages(); for(let i=1;i<=n;i++){ doc.setPage(i); stroke(C.line); doc.setLineWidth(0.3); doc.line(M,283,W-M,283);
    T(src,M,287.5,{size:6.3,c:C.grey,maxW:CW-30}); T(`Página ${i} de ${n}`,W-M,287.5,{size:6.3,c:C.grey,align:'right'}); } };
  const bars=(items,x,y,w,o={})=>{ const rowH=o.rowH||6, lw=o.lw||w*0.44, vw=o.total?28:16, bw=w-lw-vw-2, max=Math.max(1,...items.map(i=>i[1]));
    items.forEach(([l,v],i)=>{ const yy=y+i*rowH; { const L=String(l); doc.setFont('helvetica','normal'); doc.setFontSize(7.2); if(doc.getTextWidth(L)<=lw-2) T(L,x,yy+3.4,{size:7.2}); else { const fs=rowH>=5.6?6.2:5.8; doc.setFontSize(fs); let ls=doc.splitTextToSize(L,lw-2); if(ls.length>2) ls=[ls[0],fit(ls.slice(1).join(' '),lw-2,fs)]; const lh=fs*0.406; T(ls.join('\n'),x,yy+(rowH-lh*ls.length)/2+fs*0.3528*0.8+0.3,{size:fs}); } } fill(C.pale); doc.rect(x+lw,yy+0.8,bw,3.6,'F'); if(v>0){ fill(o.c||C.blue); doc.rect(x+lw,yy+0.8,Math.max(0.6,bw*v/max),3.6,'F'); }
      T(o.fmt?o.fmt(v):N(v),x+w-(o.total?13:0),yy+3.4,{size:7.2,bold:true,align:'right'}); if(o.total) T(pct(v,o.total),x+w,yy+3.4,{size:6.8,c:C.grey,align:'right'}); }); return y+items.length*rowH; };

  // Encabezado
  fill(C.blue); doc.rect(0,0,W,30,'F'); fill(C.blue2); doc.rect(0,30,W,1.4,'F');
  let tx=M;
  if(R.logo){ try{ const h=16, w=Math.min(40,h*R.logo.w/R.logo.h); fill(C.white); doc.roundedRect(M,7,w+4,h+4,1.5,1.5,'F'); doc.addImage(R.logo.data,R.logo.fmt,M+2,9,w,h); tx=M+w+9; }catch(e){ console.warn(e); } }
  T(fit(R.title||'Informe de registro de familias',W-M-tx-58,15,true),tx,14,{size:15,bold:true,c:C.white});
  T('Registro de Familias · IMS',tx,20.5,{size:8.5,c:[214,226,248]});
  const per=R.from&&R.to?`${dmy(R.from)} – ${dmy(R.to)}`:'Todo el periodo';
  T('PERIODO',W-M,11.5,{size:6.5,bold:true,c:[180,200,240],align:'right'}); T(per,W-M,16.5,{size:9,bold:true,c:C.white,align:'right'});
  T(`Emitido el ${dmy(TODAY_YMD)}`,W-M,21.5,{size:7,c:[214,226,248],align:'right'});
  const ft=repFilterText(R).join('  ·  '); doc.setFontSize(7.2); const ftl=doc.splitTextToSize(ft,CW);
  T(ftl[0]+(ftl.length>1?' …':''),M,38,{size:7.2,c:C.grey});

  // Indicadores
  let y=42; const kw=(CW-9)/4;
  const kpis=[[N(X.fams.length),'familias registradas'],[N(X.pers.length),'personas registradas'],[X.withP?(X.pers.length/X.withP).toLocaleString('es-VE',{minimumFractionDigits:1,maximumFractionDigits:1}):'0','personas por familia en promedio'],[N(X.disc),`personas con discapacidad (${pct(X.disc,X.pers.length)})`]];
  kpis.forEach(([v,l],i)=>{ const x=M+i*(kw+3); fill(C.pale); doc.roundedRect(x,y,kw,21,1.5,1.5,'F'); fill(C.blue); doc.rect(x,y,1.2,21,'F');
    T(v,x+5,y+10,{size:17,bold:true,c:C.blue}); doc.setFontSize(7); T(doc.splitTextToSize(l,kw-8).slice(0,2).join('\n'),x+5,y+15.2,{size:7,c:C.grey}); });

  // Columnas
  { const sc=stateCounter(); X.fams.forEach(f=>(S.fam.byFam.get(f.num)||[]).forEach(p=>sc.add(f.estado,p)));
    pdfMapBlock(doc,{x:M,y:71,w:CW,h:160,vals:sc.vals(),unit:'personas',title:'Personas registradas por estado de procedencia',unknown:sc.unknown()}); }
  const LX=M, RX=M+CW/2+4, HW=CW/2-4; y=newPage();
  // Pirámide
  let yl=section('Personas por sexo y grupo de edad',LX,y,HW);
  const cx=LX+HW/2, gap=8, half=HW/2-gap-9, pmax=Math.max(1,...X.pyr.flatMap(r=>[r.m,r.h]));
  T('Mujeres',cx-gap,yl+1,{size:7,bold:true,c:C.blue2,align:'right'}); T('Hombres',cx+gap,yl+1,{size:7,bold:true,c:C.blue});
  yl+=3.5;
  X.pyr.slice().reverse().forEach((r,i)=>{ const yy=yl+i*6.2;
    T(r.l,cx,yy+3.5,{size:7,align:'center',c:C.grey});
    const wm=half*r.m/pmax, wh=half*r.h/pmax;
    fill(C.blue2); doc.rect(cx-gap-wm,yy+0.9,Math.max(0.5,wm),4.2,'F'); fill(C.blue); doc.rect(cx+gap,yy+0.9,Math.max(0.5,wh),4.2,'F');
    T(N(r.m),cx-gap-wm-1.2,yy+3.9,{size:6.8,align:'right'}); T(N(r.h),cx+gap+wh+1.2,yy+3.9,{size:6.8}); });
  yl+=AGE_GROUPS.length*6.2+2;
  T(`Mujeres ${pct(X.mujeres,X.pers.length)}  ·  Hombres ${pct(X.hombres,X.pers.length)}${X.otros?`  ·  Otro / no responde ${pct(X.otros,X.pers.length)}`:''}${X.sinEdad?`  ·  ${N(X.sinEdad)} sin edad válida`:''}`,LX,yl+1.5,{size:6.8,c:C.grey});
  yl+=9;
  yl=section('Perfiles y condiciones específicas',LX,yl,HW);
  if(X.perfiles.length) yl=bars(X.perfiles.slice(0,7),LX,yl,HW,{lw:HW*0.5,c:C.blue2,total:X.pers.length}); else { T('Ninguna persona con perfil o condición específica.',LX,yl+3,{size:7.2,c:C.grey}); yl+=6; }

  // Derecha: ubicaciones
  let yr=section('Alojamientos con más familias',RX,y,HW);
  yr=bars(X.aloj.slice(0,6),RX,yr,HW,{total:X.fams.length})+6;
  yr=section(X.mun.length>1?'Municipios de procedencia (estado)':'Parroquias de procedencia (municipio)',RX,yr,HW);
  yr=bars((X.mun.length>1?X.mun:countBy(X.fams,f=>f.parroquia?`${f.parroquia} (${f.municipio||'sin municipio'})`:null)).slice(0,5),RX,yr,HW,{lw:HW*0.5,total:X.fams.length})+6;
  yr=section('Nivel de afectación de la vivienda',RX,yr,HW);
  { const tot=X.afect.reduce((t,a)=>t+a[1],0)||1, pal=[C.blue,C.blue2,[150,185,235],[200,208,222],[230,233,240]]; let xx=RX;
    X.afect.forEach(([l,v],i)=>{ const w=HW*v/tot; fill(pal[i%pal.length]); doc.rect(xx,yr,w,5,'F'); xx+=w; });
    yr+=8.5; let lx=RX; X.afect.forEach(([l,v],i)=>{ const s=`${l} ${pct(v,tot)}`; doc.setFontSize(6.8); const w=doc.getTextWidth(s)+7; if(lx+w>RX+HW){ lx=RX; yr+=4.2; } fill(pal[i%pal.length]); doc.rect(lx,yr-2.3,2.6,2.6,'F'); T(s,lx+3.6,yr,{size:6.8,c:C.grey}); lx+=w; });
    yr+=4; }

  // Franja de datos complementarios
  y=need(Math.max(yl,yr)+5,21);
  const strip=[[pct(X.nna,X.pers.length),'niñas, niños y adolescentes (0–17 años)'],[pct(X.mayores,X.pers.length),'personas mayores (60 años o más)'],[pct(X.enAloj,X.fams.length),'de las familias se encuentran en el alojamiento'],[pct(X.venez,X.pers.length),'de las personas son de nacionalidad venezolana']];
  stroke(C.line); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); doc.line(M,y+15,W-M,y+15);
  strip.forEach(([v,l],i)=>{ const x=M+i*(CW/4); T(v,x+2,y+6.5,{size:11,bold:true,c:C.blue}); doc.setFontSize(6.6); T(doc.splitTextToSize(l,CW/4-6).slice(0,2).join('\n'),x+2,y+10.3,{size:6.6,c:C.grey}); });
  y+=21;

  // Equipos y calidad
  y=need(y,Math.max(8.5+Math.min(5,X.orgs.length)*5.4+(X.orgs.length>5?5:0),37));
  let ye=section('Por equipo implementador',LX,y,HW);
  T('Equipo',LX,ye+1,{size:6.8,bold:true,c:C.grey}); T('Familias',LX+HW-20,ye+1,{size:6.8,bold:true,c:C.grey,align:'right'}); T('Personas',LX+HW,ye+1,{size:6.8,bold:true,c:C.grey,align:'right'});
  ye+=2.5; X.orgs.slice(0,5).forEach(([o,n,p],i)=>{ const yy=ye+i*5.4; if(i%2===0){ fill([245,247,251]); doc.rect(LX,yy,HW,5.4,'F'); }
    T(fit(o,HW-44,7.2),LX+1.5,yy+3.7,{size:7.2}); T(N(n),LX+HW-20,yy+3.7,{size:7.2,bold:true,align:'right'}); T(N(p),LX+HW-1.5,yy+3.7,{size:7.2,bold:true,align:'right'}); });
  ye+=Math.min(5,X.orgs.length)*5.4; if(X.orgs.length>5){ T(`y ${X.orgs.length-5} equipos más`,LX,ye+3.5,{size:6.6,c:C.grey}); ye+=5; }

  let yq=section('Calidad de los datos',RX,y,HW);
  fill([253,246,232]); const qh=31; doc.roundedRect(RX,yq-1,HW,qh,1.5,1.5,'F'); fill(C.amber); doc.rect(RX,yq-1,1.2,qh,'F');
  T(N(X.q.obsFams),RX+5,yq+7,{size:16,bold:true,c:[150,95,0]});
  doc.setFontSize(7); T(doc.splitTextToSize(`familias con al menos una observación (${pct(X.q.obsFams,X.fams.length)} del total)`,HW-30).join('\n'),RX+28,yq+3.6,{size:7,c:C.ink});
  const ql=[['Familias sin representante o con más de uno',X.q.sinRep],['Personas con fecha de nacimiento a revisar',X.q.fechas],['Personas posiblemente duplicadas',X.q.dup],['Familias sin personas registradas',X.q.famNoPers]];
  ql.forEach(([l,v],i)=>{ const yy=yq+13+i*4.3; T(fit(l,HW-22,6.8),RX+5,yy,{size:6.8,c:C.grey}); T(N(v),RX+HW-3,yy,{size:6.8,bold:true,align:'right'}); });
  yq+=qh;

  // Observaciones
  y=Math.max(ye,yq)+5;
  notes(y);
  if(ext) return true;
  footer(`Fuente: IMS, formulario Registro de Familias (${S.fam.file}). Las edades se calculan a la fecha de registro de cada familia.`);

  const blob=doc.output('blob');
  const tag=R.from&&R.to?`_${R.from}_a_${R.to}`:'';
  await saveFile(`Informe_Registro_Familias${tag}.pdf`,blob);
}

function famViewReport(){
  const D=S.fam, R=repInit(), X=repData();
  const cats=REP_CATS.map(([k,l])=>{ const cnt={}; D.fams.forEach(f=>{ const x=f[k]??'(vacío)'; cnt[x]=(cnt[x]||0)+1; }); const vals=Object.entries(cnt).sort((a,b)=>b[1]-a[1]); const sel=R.cats[k];
    return `<details class="cat" ${sel&&sel.size?'open':''}><summary><span>${esc(l)}</span><span class="cnt">${sel&&sel.size?`${sel.size} de ${vals.length} seleccionados`:'Todos'}</span></summary><div class="body">
      <div class="row" style="margin:4px 0 6px"><button class="btn sm" type="button" data-rall="${k}">Todos</button><button class="btn sm" type="button" data-rnone="${k}">Ninguno</button></div>
      ${vals.map(([v,n])=>`<label><input type="checkbox" data-rcat="${k}" value="${esc(v)}" ${!sel||!sel.size||sel.has(v)?'checked':''}> ${esc(v)} <span class="cnt">${fmt(n)} familias</span></label>`).join('')}</div></details>`; }).join('');
  return `<h1>Construir informe</h1>
  <p class="lead">Genera un PDF de una página con el resumen de lo registrado por uno o varios equipos implementadores en el periodo y la ubicación que elijas.</p>
  <div class="facts" id="repFacts">${repFacts(X)}</div>
  <div class="grid2">
    <div>
      <h2 style="margin-top:0">Periodo</h2>
      <div class="panel">${D.minDate?`<div class="row"><div class="field"><label for="rFrom">Desde</label><input type="hidden" id="rFrom" data-dp data-label="Desde" data-pair="rTo" data-min="${esc(D.minDate)}" data-max="${esc(D.maxDate)}" value="${esc(R.from)}"></div><div class="field"><label for="rTo">Hasta</label><input type="hidden" id="rTo" data-dp data-label="Hasta" data-pair="rFrom" data-min="${esc(D.minDate)}" data-max="${esc(D.maxDate)}" value="${esc(R.to)}"></div></div>
        <div class="row" style="margin-top:10px"><button class="btn sm" type="button" data-rrange="${D.minDate}|${D.maxDate}">Todo</button>${famMonthButtons().replace(/data-frange/g,'data-rrange')}</div>`:'<p class="muted" style="margin:0">El archivo no trae Created Date; el informe cubre todo el archivo.</p>'}</div>
      <h2>Equipo y ubicación</h2>${cats}
    </div>
    <div>
      <h2 style="margin-top:0">Contenido</h2>
      <div class="panel">
        <div class="field" style="margin-bottom:12px"><label for="rTitle">Título del informe</label><input class="in" id="rTitle" style="width:100%" maxlength="70" value="${esc(R.title)}"></div>
        <div class="field" style="margin-bottom:12px"><label for="rNotes">Observaciones (opcional)</label><textarea class="in" id="rNotes" rows="4" style="width:100%;resize:vertical" maxlength="600" placeholder="Contexto, logros o limitaciones que deban acompañar las cifras.">${esc(R.notes)}</textarea></div>
        <div class="field"><label>Logo (opcional)</label>
          <div class="row">${R.logo?`<img src="${R.logo.data}" alt="Logo cargado" style="height:36px;max-width:120px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px;padding:3px"><button class="btn sm" type="button" id="rLogoDel">Quitar logo</button>`:''}
          <label class="btn sm"><input type="file" id="rLogo" accept="image/png,image/jpeg" hidden>${R.logo?'Cambiar logo':'Cargar logo PNG o JPG'}</label></div>
          <p class="muted" style="font-size:13px;margin:6px 0 0">Se coloca en el encabezado del informe y se recuerda en este navegador.</p></div>
      </div>
    </div>
  </div>
  <div class="actions"><button class="btn" type="button" id="rBack">Volver a exportar</button><button class="btn primary" type="button" id="rPdf">Descargar PDF</button></div>`;
}
function repFacts(X){
  return `<div><b>${fmt(X.fams.length)}</b><span>Familias</span></div><div><b>${fmt(X.pers.length)}</b><span>Personas</span></div>
    <div><b>${X.withP?(X.pers.length/X.withP).toLocaleString('es-VE',{minimumFractionDigits:1,maximumFractionDigits:1}):'0'}</b><span>Personas por familia</span></div>
    <div class="${X.q.obsFams?'warn':'ok'}"><b>${fmt(X.q.obsFams)}</b><span>Familias con observaciones</span></div>`;
}
function repBind(){
  const R=repInit(), on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  const upd=()=>{ $('#repFacts').innerHTML=repFacts(repData()); };
  if($('#rFrom')) mountPickers(new Set(S.fam.fams.map(f=>f.created).filter(Boolean)));
  const setR=(a,z)=>{ [a,z]=orderRange(a,z); R.from=a; R.to=z; $('#rFrom').value=a; $('#rTo').value=z; dpRefreshAll(); upd(); };
  on('#rFrom','change',e=>setR(e.target.value,R.to)); on('#rTo','change',e=>setR(R.from,e.target.value));
  document.querySelectorAll('[data-rrange]').forEach(b=>b.onclick=()=>{ const [a,z]=b.dataset.rrange.split('|'); setR(a,z); });
  const sync=k=>{ const bx=[...document.querySelectorAll(`[data-rcat="${k}"]`)]; const sel=new Set(bx.filter(b=>b.checked).map(b=>b.value)); R.cats[k]=sel.size===bx.length?null:sel;
    bx[0].closest('details').querySelector('summary .cnt').textContent=sel.size===bx.length?'Todos':`${sel.size} de ${bx.length} seleccionados`; upd(); };
  document.querySelectorAll('[data-rcat]').forEach(b=>b.onchange=()=>sync(b.dataset.rcat));
  document.querySelectorAll('[data-rall]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-rcat="${b.dataset.rall}"]`).forEach(x=>x.checked=true); sync(b.dataset.rall); });
  document.querySelectorAll('[data-rnone]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-rcat="${b.dataset.rnone}"]`).forEach(x=>x.checked=false); sync(b.dataset.rnone); });
  on('#rTitle','input',e=>{ R.title=e.target.value; }); on('#rNotes','input',e=>{ R.notes=e.target.value; });
  on('#rLogo','change',e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>1.5e6){ toast('El logo supera 1,5 MB. Usa una imagen más liviana.'); return; }
    const rd=new FileReader(); rd.onload=()=>{ const img=new Image(); img.onload=()=>{ R.logo={data:rd.result,fmt:/png/i.test(f.type)?'PNG':'JPEG',w:img.naturalWidth,h:img.naturalHeight};
      try{ localStorage.setItem(LOGO_KEY,JSON.stringify(R.logo)); }catch(err){} render(); }; img.src=rd.result; }; rd.readAsDataURL(f); });
  on('#rLogoDel','click',()=>{ R.logo=null; try{ localStorage.removeItem(LOGO_KEY); }catch(e){} render(); });
  on('#rBack','click',()=>{ S.fam.view=null; render(); });
  on('#rPdf','click',async()=>{ busy(true); await nextFrame(); try{ await repPdf(); }catch(e){ console.error(e); toast('Error al generar el PDF: '+(e.message||e)); } busy(false); });
}

function famViewExport(){
  if(S.fam.view==='report') return famViewReport();
  const n=famPbiTable().data.length, E=S.fam.err, F=S.fam.filters;
  const tot=famSummary().filter(r=>r[3]!=='grupos'&&!r[1].startsWith('Personas involucradas')).reduce((t,r)=>t+r[2],0);
  return `<h1>Exportar</h1>
  <p class="lead">Este formulario no se reporta en la 345W. Elige la salida que necesitas.</p>
  <div class="exports">
    <div class="exp"><h3>Limpieza de datos</h3><p>Un Excel con las pestañas vzl_cases y beneficiaries_vzl completas y en el mismo orden, con una columna «Estado de revisión»: filas en rojo para borrar (con la acción sugerida y los pasos previos, como asignar un nuevo representante o reasignar atenciones) y celdas en amarillo para corregir, con las columnas Observaciones y Qué hacer. Incluye el detalle de duplicados. Analiza el archivo completo y no modifica el original.${(S.famAtt||[]).length?'':' <b>Sin formularios de atenciones cargados, el cruce quedará pendiente.</b>'}</p><button class="btn primary" type="button" id="exErr">Descargar reporte</button></div>
    <div class="exp"><h3>Tabla para Power BI</h3><p>Una sola tabla con una fila por persona y los datos de su familia, edad al momento del registro y una columna 1/0 por cada perfil o condición. ${fmt(n)} filas${F.from?` registradas entre el ${esc(F.from)} y el ${esc(F.to)}`:''}.</p><div class="row"><button class="btn primary" type="button" id="exPbi" ${n?'':'disabled'}>Descargar Excel</button><button class="btn" type="button" id="exCsv" ${n?'':'disabled'}>Descargar CSV</button></div></div>
    <div class="exp"><h3>Construir informe</h3><p>Un PDF de una página con el resumen de lo realizado por uno o varios equipos implementadores: familias, personas, perfil demográfico, ubicaciones y calidad de los datos. Tiene sus propios criterios de periodo, equipo y ubicación.</p><button class="btn primary" type="button" id="exRep">Construir informe</button></div>
    <div class="exp"><h3>Tablero interactivo</h3><p>Un tablero con filtros de periodo, estado, municipio, parroquia y socio: resultados por formulario, desagregación por edad y sexo, población clave, histórico, ubicaciones y socios. Se puede exportar en PDF con los filtros aplicados.</p><button class="btn primary" type="button" data-opendash>Abrir tablero</button></div>
  </div>
  <div class="actions"><button class="btn" type="button" id="back">Volver a filtros</button><button class="btn" type="button" id="restart">Procesar otro archivo</button></div>`;
}
function famBind(){
  const on=(sel,ev,fn)=>{ const el=$(sel); if(el) el.addEventListener(ev,fn); };
  const restart=()=>{ S.mode=null; S.fam=null; S.famAtt=null; S.step=1; render(); };
  if(S.step===2){ on('#back','click',restart); on('#next','click',()=>{ S.step=3; render(); });
    const d=$('#attDrop'), inp=$('#attIn'); if(d){ d.onclick=()=>inp.click(); d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); inp.click(); } };
      d.ondragover=e=>{ e.preventDefault(); d.classList.add('over'); }; d.ondragleave=()=>d.classList.remove('over'); d.ondrop=e=>{ e.preventDefault(); d.classList.remove('over'); famLoadAtt([...e.dataTransfer.files]); };
      inp.onchange=()=>{ famLoadAtt([...inp.files]); inp.value=''; }; }
    document.querySelectorAll('[data-attdel]').forEach(b=>b.onclick=()=>{ S.famAtt.splice(+b.dataset.attdel,1); render(); }); }
  if(S.step===3){
    const upd=()=>{ $('#fN').textContent=fmt(famPbiTable().data.length); $('#famSum').innerHTML=famSumRows(famSummary()); };
    const F=S.fam.filters;
    if($('#fFrom')) mountPickers(new Set(S.fam.fams.map(f=>f.created).filter(Boolean)));
    const setR=(a,z)=>{ [a,z]=orderRange(a,z); F.from=a; F.to=z; $('#fFrom').value=a; $('#fTo').value=z; dpRefreshAll(); upd(); };
    on('#fFrom','change',e=>setR(e.target.value,F.to));
    on('#fTo','change',e=>setR(F.from,e.target.value));
    document.querySelectorAll('[data-frange]').forEach(b=>b.onclick=()=>{ const [a,z]=b.dataset.frange.split('|'); setR(a,z); });
    const sync=k=>{ const bx=[...document.querySelectorAll(`[data-fcat="${k}"]`)]; const sel=new Set(bx.filter(b=>b.checked).map(b=>b.value)); F.cats[k]=sel.size===bx.length?null:sel;
      bx[0].closest('details').querySelector('summary .cnt').textContent=sel.size===bx.length?`${bx.length} valores · todos`:`${sel.size} de ${bx.length} seleccionados`; upd(); };
    document.querySelectorAll('[data-fcat]').forEach(b=>b.onchange=()=>sync(b.dataset.fcat));
    document.querySelectorAll('[data-fall]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-fcat="${b.dataset.fall}"]`).forEach(x=>x.checked=true); sync(b.dataset.fall); });
    document.querySelectorAll('[data-fnone]').forEach(b=>b.onclick=()=>{ document.querySelectorAll(`[data-fcat="${b.dataset.fnone}"]`).forEach(x=>x.checked=false); sync(b.dataset.fnone); });
    on('#back','click',()=>{ S.step=2; render(); });
    on('#next','click',()=>{ S.step=4; render(); });
  }
  if(S.step===4&&S.fam.view==='report'){ repBind(); return; }
  if(S.step===4){
    on('#exRep','click',()=>{ S.fam.view='report'; render(); });
    const run=fn=>async()=>{ busy(true); await nextFrame(); try{ await fn(); }catch(e){ console.error(e); toast('Error al exportar: '+(e.message||e)); } busy(false); };
    on('#exErr','click',run(famExportErrors)); on('#exPbi','click',run(()=>famExportPbi('xlsx'))); on('#exCsv','click',run(()=>famExportPbi('csv')));
    on('#back','click',()=>{ S.step=3; render(); }); on('#restart','click',restart);
  }
}
const MODULES=[{id:'familias',name:'Registro de Familias',detect:famDetect,load:famLoad,views:[null,null,famViewVerify,famViewReview,famViewExport],bind:famBind}];
async function loadKnown(files){
  const wbs=[]; for(const f of files){ try{ wbs.push({f,wb:XLSX.read(await f.arrayBuffer(),{type:'array'})}); }catch(e){ console.error(e); } }
  const com=wbs.find(x=>comDetect(x.wb));
  if(com){ S.com=comLoad(com.wb,com.f.name); S.mode=COM_MODULE; S.step=2; return true; }
  const reg=wbs.find(x=>famDetect(x.wb)), nfi=wbs.find(x=>nfiDetect(x.wb)), sal=nfi?null:wbs.find(x=>salDetect(x.wb));
  if(!reg&&!sal&&!nfi) return false;
  if(reg){ const D=famLoad(reg.wb,reg.f.name); if(!D.fatal.length) S.registro=D;
    if(!sal&&!nfi){ S.fam=D; S.mode=MODULES[0]; S.step=2; return true; }
    if(D.fatal.length) toast('El Registro de Familias no tiene todas las columnas necesarias.'); }
  if(nfi){ S.nfiWb={wb:nfi.wb,name:nfi.f.name}; S.nfi=nfiLoad(nfi.wb,nfi.f.name,S.registro||null); S.mode=NFI_MODULE; S.step=2; return true; }
  S.salWb={wb:sal.wb,name:sal.f.name}; S.sal=salLoad(sal.wb,sal.f.name,S.registro||null); S.mode=SAL_MODULE; S.step=2; return true;
}
async function tryModule(file){
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
  const mod=MODULES.find(m=>m.detect(wb)); if(!mod) return false;
  S.fam=mod.load(wb,file.name); S.mode=mod; S.step=2; return true;
}

