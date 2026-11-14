/* Herramientas M&E · Tema claro / oscuro y botones de la cabecera */
/* ============ Tema claro / oscuro ============ */
const THEME_KEY='depurador-ims-tema';
const mq=matchMedia('(prefers-color-scheme: dark)');
function currentTheme(){ return document.documentElement.dataset.theme||(mq.matches?'dark':'light'); }
function paintThemeBtn(){ const t=currentTheme(), b=$('#btnTheme'); const l=t==='dark'?'Modo claro':'Modo oscuro'; b.innerHTML=`<span aria-hidden="true">${t==='dark'?'☀':'☾'}</span><span class="blabel">${l}</span>`; b.title=l; b.setAttribute('aria-label',l); b.setAttribute('aria-pressed',String(t==='dark')); }
(()=>{ let t=null; try{ t=localStorage.getItem(THEME_KEY); }catch(e){} document.documentElement.dataset.theme=(t==='dark')?'dark':'light'; paintThemeBtn(); })(); // por defecto, modo claro
mq.addEventListener('change',paintThemeBtn);
$('#btnGuide').onclick=()=>{ S.guide=!S.guide; render(); };
$('#btnTheme').onclick=()=>{ const t=currentTheme()==='dark'?'light':'dark'; document.documentElement.dataset.theme=t; try{ localStorage.setItem(THEME_KEY,t); }catch(e){} paintThemeBtn(); };
