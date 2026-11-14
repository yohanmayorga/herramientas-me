/* Herramientas M&E · Estado global del depurador */
/* ============ Estado ============ */
const S = {
  step:1, files:[], headers:[], rows:[], profile:null, fields:[], mapping:{}, matchInfo:{},
  extraHeaders:[], opts:{includeExtra:true, dedupe:true, excludeCritical:false, normCase:true},
  bands:DEFAULT_BANDS, result:null, filters:{dateKey:null, from:'', to:'', cats:{}},
  w345:{dims:[], byMonth:true}
};

