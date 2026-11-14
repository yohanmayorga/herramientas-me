/* Herramientas M&E · Utilidades generales (DOM, formato, fechas, archivos) */
/* ============ Utilidades ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const snake = s => fold(s).replace(/ /g,'_') || 'campo';
const fmt = n => Number(n).toLocaleString('es-VE');
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const NULLS = new Set(['','na','n a','null','none','nan','undefined','sin dato','s d','sd','no disponible']);
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),3600); }
function busy(on){ $('#busy').classList.toggle('show',on); }
const nextFrame = () => new Promise(r=>setTimeout(r,30));

function ymd(y,m,d){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function ymdChk(y,m,d){ if(m<1||m>12||d<1||d>31||y<1900||y>2100) return undefined; const dt=new Date(Date.UTC(y,m-1,d)); if(dt.getUTCMonth()!==m-1) return undefined; return ymd(y,m,d); }
/* Devuelve 'YYYY-MM-DD', null (vacío) o undefined (inválido) */
function toDate(v){
  if(v==null) return null;
  if(v instanceof Date){ if(isNaN(v)) return undefined; return ymdChk(v.getFullYear(),v.getMonth()+1,v.getDate()); }
  if(typeof v==='number'){ if(v>1000&&v<80000){ const d=new Date(Math.round((v-25569)*86400000)); return ymdChk(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()); } return undefined; }
  const s=String(v).trim(); if(NULLS.has(fold(s))) return null;
  let m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/); if(m) return ymdChk(+m[1],+m[2],+m[3]);
  m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if(m){ let a=+m[1],b=+m[2],y=+m[3]; if(y<100) y+= y>50?1900:2000; let d=a,mo=b; if(b>12&&a<=12){d=b;mo=a;} return ymdChk(y,mo,d); }
  if(/^\d{4,5}(\.\d+)?$/.test(s)) return toDate(parseFloat(s));
  const t=Date.parse(s); if(!isNaN(t)){ const d=new Date(t); return ymdChk(d.getFullYear(),d.getMonth()+1,d.getDate()); }
  return undefined;
}
function toNum(v){
  if(v==null) return null;
  if(typeof v==='number') return isFinite(v)?v:undefined;
  if(v instanceof Date) return undefined;
  let s=String(v).trim().replace(/\s/g,''); if(NULLS.has(fold(s))) return null;
  if(s.includes(',')&&s.includes('.')) s = s.lastIndexOf(',')>s.lastIndexOf('.') ? s.replace(/\./g,'').replace(',','.') : s.replace(/,/g,'');
  else if((s.match(/,/g)||[]).length===1) s=s.replace(',','.');
  const n=Number(s); return isFinite(n)?n:undefined;
}
function toText(v){
  if(v==null) return null;
  if(v instanceof Date) return toDate(v);
  const s=String(v).replace(/\s+/g,' ').trim();
  return NULLS.has(fold(s))?null:s;
}
function normSexo(v){
  const f=fold(v); if(!f) return null;
  if(['f','femenino','mujer','female','woman','fem','nina','mujeres'].includes(f)) return 'Mujer';
  if(['m','h','masculino','hombre','male','man','masc','nino','hombres','varon'].includes(f)) return 'Hombre';
  if(f.includes('otro')||f.includes('no binari')||f.includes('intersex')) return 'Otro';
  if(f.includes('no responde')||f.includes('prefiere no')||f.includes('no sabe')) return 'No responde';
  return undefined;
}

