/* Herramientas M&E · Mapa coroplético de Venezuela (SVG y PDF) */
let _VE=null;
function veModel(){ if(_VE) return _VE; _VE=VE_MAP.states.map(s=>({n:s.n,k:fold(s.n),b:s.b,c:s.c,rings:s.r.split('|').map(r=>r.split(' ').map(p=>p.split(',').map(Number)))})); return _VE; }
const VE_ALIAS={'vargas':'la guaira','distrito capital':'distrito capital','capital':'distrito capital','dtto capital':'distrito capital','nueva esparta':'nueva esparta'};
function veMatch(name){ const f=fold(name); if(!f) return null; const k=VE_ALIAS[f]||f; const st=veModel().find(s=>s.k===k||s.k===f); return st?st.n:null; }
const MAP_PAL=[[220,232,247],[169,196,236],[111,155,219],[47,102,194],[0,51,160]], MAP_ZERO=[236,239,244];
function mapBreaks(vals){ const v=[...vals].filter(x=>x>0).sort((a,b)=>a-b); if(!v.length) return []; const u=[...new Set(v)];
  if(u.length<=5) return u; const q=p=>v[Math.min(v.length-1,Math.floor(p*v.length))]; return [...new Set([v[0],q(.2),q(.4),q(.6),q(.8)])]; }
function mapClass(v,br){ if(!v) return -1; let c=0; br.forEach((b,i)=>{ if(v>=b) c=i; }); return Math.round(c*(MAP_PAL.length-1)/Math.max(1,br.length-1)); }
/* vals: Map nombre de estado (del mapa) → valor */
function mapModel(vals){ const br=mapBreaks(vals.values()); const states=veModel().map(s=>{ const v=vals.get(s.n)||0; return {...s,v,cls:mapClass(v,br)}; }); return {states,br,active:states.filter(s=>s.v>0)}; }
function mapView(active,aspect){
  const W=VE_MAP.w, H=VE_MAP.h; let v=[0,0,W,H];
  if(active.length){ let x0=Math.min(...active.map(s=>s.b[0])), y0=Math.min(...active.map(s=>s.b[1])), x1=Math.max(...active.map(s=>s.b[2])), y1=Math.max(...active.map(s=>s.b[3]));
    let w=x1-x0, h=y1-y0; const px=Math.max(w*.12,30), py=Math.max(h*.15,30); x0-=px; x1+=px; y0-=py; y1+=py; w=x1-x0; h=y1-y0;
    if(w<170){ x0-=(170-w)/2; w=170; } if(h<110){ y0-=(110-h)/2; h=110; }
    if(w<W*.8&&h<H*.75) v=[x0,y0,w,h]; }
  let [x,y,w,h]=v; if(!aspect) return v; if(w/h<aspect){ const nw=h*aspect; x-=(nw-w)/2; w=nw; } else { const nh=w/aspect; y-=(nh-h)/2; h=nh; }
  return [x,y,w,h];
}
function mapRanges(br){ return br.map((b,i)=>{ const next=br[i+1]; return [mapClass(b,br),next!=null?(next-1>b?`${fmt(b)} – ${fmt(next-1)}`:fmt(b)):`${fmt(b)} o más`]; }); }
/* Mapa SVG para el tablero */
function mapSvg(vals,unit){
  const M=mapModel(vals), v=mapView(M.active,2.2), fs=v[2]*0.02;
  const paths=M.states.map(s=>`<path class="mc mc${s.cls+1}" d="${s.rings.map(r=>'M'+r.map(p=>p.join(',')).join('L')+'Z').join('')}"><title>${esc(s.n)}: ${fmt(s.v)} ${unit}</title></path>`).join('');
  const labels=M.active.filter(s=>(s.b[2]-s.b[0])/v[2]>0.035||s.v===Math.max(...M.active.map(a=>a.v))).map(s=>`<text x="${s.c[0]}" y="${s.c[1]}" class="ml ${s.cls>=3?'mlw':''}" font-size="${fs.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${fmt(s.v)}</text>`).join('');
  return `<svg class="vemap" viewBox="${v.map(n=>n.toFixed(1)).join(' ')}" role="img" aria-label="Mapa de Venezuela por estado">${paths}${labels}</svg>
  <div class="mlegend">${M.br.length?mapRanges(M.br).map(([c,t])=>`<span><i class="mc${c+1}"></i>${t}</span>`).join(''):''}<span><i class="mc0"></i>Sin ${esc(unit)}</span></div>`;
}
/* Bloque de mapa para los PDF: mapa a la izquierda y tabla por estado a la derecha */
function pdfMapBlock(doc,o){
  const {x,y,w,h,vals,unit,title,unknown=0,total}=o, C={blue:[0,51,160],blue2:[65,143,222],grey:[107,114,128],ink:[34,43,69],line:[217,223,234]};
  const T=(s,xx,yy,p={})=>{ doc.setFont('helvetica',p.bold?'bold':'normal'); doc.setFontSize(p.size||7.5); doc.setTextColor(...(p.c||C.ink)); doc.text(String(s),xx,yy,{align:p.align||'left',maxWidth:p.maxW}); };
  T(title,x,y,{size:9.5,bold:true,c:C.blue}); doc.setDrawColor(...C.blue2); doc.setLineWidth(.5); doc.line(x,y+1.6,x+12,y+1.6);
  const top=y+5, mw=w*0.62, mh0=h-22, M=mapModel(vals), nat=mapView(M.active,null), asp=Math.max(mw/mh0,Math.min(nat[2]/nat[3],mw/60)), mh=mw/asp, v=mapView(M.active,asp), sc=Math.min(mw/v[2],mh/v[3]), ox=x+(mw-v[2]*sc)/2-v[0]*sc, oy=top+(mh-v[3]*sc)/2-v[1]*sc;
  doc.setFillColor(248,250,253); doc.setDrawColor(...C.line); doc.setLineWidth(.2); doc.roundedRect(x,top,mw,mh,1.5,1.5,'FD');
  doc.saveGraphicsState(); doc.rect(x,top,mw,mh,null); doc.clip(); doc.discardPath();
  M.states.forEach(s=>{ doc.setFillColor(...(s.cls<0?MAP_ZERO:MAP_PAL[s.cls])); doc.setDrawColor(255,255,255); doc.setLineWidth(.18);
    s.rings.forEach(r=>{ const pts=r.map(([px,py])=>[ox+px*sc,oy+py*sc]), d=[]; for(let i=1;i<pts.length;i++) d.push([pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]]); if(d.length) doc.lines(d,pts[0][0],pts[0][1],[1,1],'FD',true); }); });
  const mx=Math.max(0,...M.active.map(s=>s.v));
  M.active.forEach(s=>{ const cx=ox+s.c[0]*sc, cy=oy+s.c[1]*sc; if(cx<x+3||cx>x+mw-3||cy<top+3||cy>top+mh-3) return; if((s.b[2]-s.b[0])*sc<7&&s.v!==mx) return;
    doc.setFont('helvetica','bold'); doc.setFontSize(6.8); doc.setDrawColor(255,255,255); doc.setLineWidth(.9); doc.text(fmt(s.v),cx,cy+1.2,{align:'center',renderingMode:'stroke'});
    doc.setTextColor(...C.ink); doc.text(fmt(s.v),cx,cy+1.2,{align:'center',renderingMode:'fill'}); });
  doc.restoreGraphicsState();
  // Leyenda
  let lx=x, ly=top+mh+5; const items=[...mapRanges(M.br),[-1,`Sin ${unit}`]];
  items.forEach(([c,t])=>{ doc.setFontSize(6.6); const tw=doc.getTextWidth(t)+8; if(lx+tw>x+mw){ lx=x; ly+=4.2; } doc.setFillColor(...(c<0?MAP_ZERO:MAP_PAL[c])); doc.setDrawColor(...C.line); doc.rect(lx,ly-2.6,3,3,'FD'); T(t,lx+4.2,ly,{size:6.6,c:C.grey}); lx+=tw+3; });
  T('Los límites y nombres mostrados no implican aprobación ni aceptación oficial por parte de la OIM. Fuente cartográfica: Natural Earth.',x,ly+5,{size:5.8,c:C.grey,maxW:mw}); const mapBottom=ly+9;
  // Tabla por estado
  const tx=x+mw+6, tw=w-mw-6, rows=[...vals.entries()].filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]), tot=total!=null?total:rows.reduce((t,e)=>t+e[1],0)+unknown;
  T('Estado',tx,top+3,{size:6.8,bold:true,c:C.grey}); T(unit.charAt(0).toUpperCase()+unit.slice(1),tx+tw-13,top+3,{size:6.8,bold:true,c:C.grey,align:'right'}); T('%',tx+tw,top+3,{size:6.8,bold:true,c:C.grey,align:'right'});
  let ty=top+5; const maxRows=Math.floor((mh-8)/5.2), show=rows.slice(0,unknown?maxRows-1:maxRows);
  show.forEach(([n,val],i)=>{ if(i%2===0){ doc.setFillColor(245,247,251); doc.rect(tx,ty,tw,5.2,'F'); } T(n,tx+1.2,ty+3.6,{size:7}); T(fmt(val),tx+tw-13,ty+3.6,{size:7,bold:true,align:'right'}); T(pct(val,tot),tx+tw,ty+3.6,{size:6.4,c:C.grey,align:'right'}); ty+=5.2; });
  if(rows.length>show.length){ const rest=rows.slice(show.length).reduce((t,e)=>t+e[1],0); T(`Otros ${rows.length-show.length} estados`,tx+1.2,ty+3.6,{size:7,c:C.grey}); T(fmt(rest),tx+tw-13,ty+3.6,{size:7,bold:true,align:'right'}); ty+=5.2; }
  if(unknown){ T('Sin estado o no reconocido',tx+1.2,ty+3.6,{size:7,c:C.grey}); T(fmt(unknown),tx+tw-13,ty+3.6,{size:7,bold:true,align:'right'}); T(pct(unknown,tot),tx+tw,ty+3.6,{size:6.4,c:C.grey,align:'right'}); ty+=5.2; }
  doc.setDrawColor(...C.ink); doc.setLineWidth(.3); doc.line(tx,ty+.6,tx+tw,ty+.6); T('Total',tx+1.2,ty+4.4,{size:7,bold:true}); T(fmt(tot),tx+tw-13,ty+4.4,{size:7,bold:true,align:'right'});
  T('Una persona atendida en más de un estado se cuenta en cada uno.',tx,ty+9.5,{size:5.8,c:C.grey,maxW:tw});
  return Math.max(mapBottom,ty+12)+4;
}
/* Conteo por estado: personas distintas (o una cantidad) por estado */
function stateCounter(){ const sets=new Map(), sums=new Map(); let unk=new Set(), unkSum=0;
  return { add(estado,key){ const st=veMatch(estado); if(!st){ unk.add(key); return; } if(!sets.has(st)) sets.set(st,new Set()); sets.get(st).add(key); },
    addN(estado,n){ const st=veMatch(estado); if(!st){ unkSum+=n; return; } sums.set(st,(sums.get(st)||0)+n); },
    vals(){ const m=new Map(sums); sets.forEach((s,k)=>m.set(k,(m.get(k)||0)+s.size)); return m; }, unknown(){ return unk.size+unkSum; } }; }

