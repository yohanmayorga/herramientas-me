/* Herramientas M&E · Perfiles de formulario genéricos */
/* ============ Perfiles ============ */
const ROLES = {'':'—', fecha:'Fecha principal', sexo:'Sexo', edad:'Edad', nacimiento:'Fecha de nacimiento', id:'ID de persona'};
const TYPES = {text:'Texto', category:'Categoría', date:'Fecha', number:'Número'};
const DEFAULT_BANDS = '0-5:0-5, 6-11:6-11, 12-17:12-17, 18-59:18-59, 60-150:60+';
const BUILTIN = [
  { id:'auto', name:'Automático (cualquier formulario)', builtin:true,
    description:'Usa todas las columnas del archivo e infiere tipos y roles. Útil para formularios sin perfil.', fields:[] },
  { id:'salud', name:'Atenciones de salud (plantilla)', builtin:true, minScore:0.5,
    description:'Plantilla inicial: ajusta los alias con los encabezados reales del IMS.',
    fields:[
      {key:'id_beneficiario',label:'ID beneficiario',type:'text',role:'id',aliases:['id beneficiario','codigo beneficiario','id persona','cedula','documento de identidad','numero de documento','id']},
      {key:'fecha_atencion',label:'Fecha de atención',type:'date',role:'fecha',required:true,aliases:['fecha de atencion','fecha atencion','fecha de la atencion','fecha de registro','fecha']},
      {key:'socio',label:'Socio implementador',type:'category',aliases:['socio implementador','socio','organizacion','implementador','partner','agencia']},
      {key:'estado',label:'Estado',type:'category',required:true,aliases:['estado','entidad federal']},
      {key:'municipio',label:'Municipio',type:'category',aliases:['municipio']},
      {key:'parroquia',label:'Parroquia',type:'category',aliases:['parroquia']},
      {key:'punto_atencion',label:'Punto de atención',type:'category',aliases:['punto de atencion','lugar de atencion','centro de salud','establecimiento']},
      {key:'tipo_atencion',label:'Tipo de atención',type:'category',required:true,aliases:['tipo de atencion','tipo de servicio','servicio','especialidad','actividad']},
      {key:'modalidad',label:'Modalidad',type:'category',aliases:['modalidad']},
      {key:'sexo',label:'Sexo',type:'category',role:'sexo',aliases:['sexo','genero']},
      {key:'edad',label:'Edad',type:'number',role:'edad',aliases:['edad','edad en anos','edad anos']},
      {key:'fecha_nacimiento',label:'Fecha de nacimiento',type:'date',role:'nacimiento',aliases:['fecha de nacimiento','fecha nacimiento']},
      {key:'nacionalidad',label:'Nacionalidad',type:'category',aliases:['nacionalidad','pais de origen']},
      {key:'perfil_poblacional',label:'Perfil poblacional',type:'category',aliases:['perfil poblacional','tipo de poblacion','condicion migratoria','perfil']},
      {key:'discapacidad',label:'Discapacidad',type:'category',aliases:['discapacidad','persona con discapacidad']}
    ],
    dedupeBy:['id_beneficiario','fecha_atencion','tipo_atencion'],
    w345:['socio','estado','municipio','parroquia','tipo_atencion']
  }
];
const LS_KEY='depurador-ims-perfiles-v1';
function loadCustom(){ try{ const j=JSON.parse(localStorage.getItem(LS_KEY)||'[]'); return Array.isArray(j)?j:[]; }catch(e){ return []; } }
function saveCustom(list){ try{ localStorage.setItem(LS_KEY,JSON.stringify(list)); return true; }catch(e){ toast('No se pudo guardar en este navegador. Exporta los perfiles para conservarlos.'); return false; } }
function allProfiles(){ const c=loadCustom(); const ids=new Set(c.map(p=>p.id)); return [...BUILTIN.filter(b=>!ids.has(b.id)||b.id==='auto'), ...c.filter(p=>p.id!=='auto')]; }
function validateProfile(p){
  if(!p||typeof p!=='object') return 'El perfil debe ser un objeto JSON.';
  if(!p.id||!/^[a-z0-9_-]+$/i.test(p.id)) return 'Falta "id" (solo letras, números, guion o guion bajo).';
  if(!p.name) return 'Falta "name".';
  if(!Array.isArray(p.fields)) return '"fields" debe ser una lista.';
  const keys=new Set();
  for(const f of p.fields){
    if(!f.key) return 'Cada campo necesita "key".';
    if(keys.has(f.key)) return `La clave "${f.key}" está repetida.`; keys.add(f.key);
    if(f.type&&!TYPES[f.type]) return `Tipo no válido en "${f.key}": usa text, category, date o number.`;
    if(f.role&&!(f.role in ROLES)) return `Rol no válido en "${f.key}".`;
    if(f.aliases&&!Array.isArray(f.aliases)) return `"aliases" de "${f.key}" debe ser una lista.`;
  }
  return null;
}

