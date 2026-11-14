/* Herramientas M&E · Selector de fechas (calendario) */
/* ============ Selector de fechas ============ */
const DOW=['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
const dmy=v=>v?v.split('-').reverse().join('/'):'Seleccionar';
const CAL_ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
let dpOpen=null;
/* Convierte cada <input type="hidden" data-dp> en un botón que abre un calendario limitado a data-min/data-max. */
function mountPickers(marks){
  document.querySelectorAll('input[data-dp]').forEach(inp=>{
    const wrap=document.createElement('div'); wrap.className='dp-wrap'; inp.parentNode.insertBefore(wrap,inp); wrap.appendChild(inp);
    const btn=document.createElement('button'); btn.type='button'; btn.className='in dp-field'; btn.setAttribute('aria-haspopup','dialog'); btn.setAttribute('aria-expanded','false');
    if(inp.id){ btn.id=inp.id+'Btn'; const lab=document.querySelector(`label[for="${inp.id}"]`); if(lab) lab.setAttribute('for',btn.id); }
    wrap.appendChild(btn); inp._btn=btn; inp._marks=marks; dpLabel(inp);
    btn.onclick=e=>{ e.stopPropagation(); if(dpOpen&&dpOpen.inp===inp) dpClose(); else dpShow(inp); };
  });
}
function dpLabel(inp){ inp._btn.innerHTML=`<span>${dmy(inp.value)}</span>${CAL_ICON}`; inp._btn.setAttribute('aria-label',`${inp.dataset.label||'Fecha'}: ${dmy(inp.value)}. Abrir calendario`); }
function dpRefreshAll(){ document.querySelectorAll('input[data-dp]').forEach(i=>{ if(i._btn) dpLabel(i); }); }
function dpClose(){ if(!dpOpen) return; dpOpen.pop.remove(); dpOpen.inp._btn.setAttribute('aria-expanded','false'); dpOpen=null; }
function dpShow(inp){
  dpClose();
  const min=inp.dataset.min||'', max=inp.dataset.max||'';
  const other=inp.dataset.pair?$('#'+inp.dataset.pair):null;
  let cur=(inp.value||max||min||today()).slice(0,7);
  const pop=document.createElement('div'); pop.className='dp-pop'; pop.setAttribute('role','dialog'); pop.setAttribute('aria-label','Calendario');
  inp._btn.after(pop); dpOpen={inp,pop}; inp._btn.setAttribute('aria-expanded','true');
  const r=inp._btn.getBoundingClientRect(); if(r.left+280>window.innerWidth){ pop.style.left='auto'; pop.style.right='0'; }
  const draw=()=>{
    const [y,m]=cur.split('-').map(Number), off=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7, days=new Date(Date.UTC(y,m,0)).getUTCDate();
    const lo=[inp.value,other&&other.value].filter(Boolean).sort()[0]||'', hi=[inp.value,other&&other.value].filter(Boolean).sort()[1]||'';
    let cells=''; for(let i=0;i<off;i++) cells+='<span></span>';
    for(let d=1;d<=days;d++){ const v=ymd(y,m,d), dis=(min&&v<min)||(max&&v>max);
      const cls=[v===inp.value?'sel':'', lo&&hi&&v>lo&&v<hi?'inr':'', inp._marks&&inp._marks.has(v)?'has':''].join(' ');
      cells+=`<button type="button" data-v="${v}" class="${cls}" ${dis?'disabled':''} aria-label="${d} de ${MONTHS[m-1]} de ${y}">${d}</button>`; }
    pop.innerHTML=`<div class="dp-h"><button type="button" data-nav="-1" ${!min||cur>min.slice(0,7)?'':'disabled'} aria-label="Mes anterior">‹</button><b>${MONTHS[m-1]} ${y}</b><button type="button" data-nav="1" ${!max||cur<max.slice(0,7)?'':'disabled'} aria-label="Mes siguiente">›</button></div>
      <div class="dp-g">${DOW.map(d=>`<span class="dow">${d}</span>`).join('')}${cells}</div>
      <p class="dp-note">Solo se pueden elegir fechas entre el ${dmy(min)} y el ${dmy(max)}. El punto marca los días con registros.</p>`;
  };
  pop.onclick=e=>{ e.stopPropagation();
    const n=e.target.closest('[data-nav]'); if(n&&!n.disabled){ let [y,m]=cur.split('-').map(Number); m+=Number(n.dataset.nav); if(m<1){m=12;y--;} if(m>12){m=1;y++;} cur=`${y}-${String(m).padStart(2,'0')}`; draw(); return; }
    const b=e.target.closest('[data-v]'); if(b&&!b.disabled){ inp.value=b.dataset.v; dpLabel(inp); const btn=inp._btn; dpClose(); inp.dispatchEvent(new Event('change')); btn.focus(); } };
  draw();
  const f=pop.querySelector('[data-v].sel')||pop.querySelector('[data-v]:not([disabled])'); if(f) f.focus();
}
document.addEventListener('click',e=>{ if(dpOpen&&!dpOpen.pop.contains(e.target)) dpClose(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&dpOpen){ const b=dpOpen.inp._btn; dpClose(); b.focus(); } });
/* Mantiene Desde ≤ Hasta y devuelve el par corregido */
function orderRange(from,to){ return from&&to&&from>to?[to,from]:[from,to]; }

