/* Herramientas M&E · Creación de Kobo: Constructor visual interactivo de XLSForm */
const CK={
  formTitle:'Nuevo formulario Kobo',
  formId:'nuevo_formulario_kobo',
  formStyle:'theme-grid',
  langSuffix:'Spanish (es)',
  metaFields:[
    {id:'m_start',kind:'meta',type:'start',name:'start'},
    {id:'m_end',kind:'meta',type:'end',name:'end'},
    {id:'m_today',kind:'meta',type:'today',name:'today'},
    {id:'m_deviceid',kind:'meta',type:'deviceid',name:'deviceid'}
  ],
  fields:[],
  selectedId:null,
  tab:'general',
  search:'',
  dragPayload:null
};

const CK_PALETTE=[
  { cat:'Básicos', cls:'', items:[
    {type:'text', label:'Texto', ic:'Ab'},
    {type:'integer', label:'Entero', ic:'#'},
    {type:'decimal', label:'Decimal', ic:'.0'},
    {type:'date', label:'Fecha', ic:'📅'},
    {type:'time', label:'Hora', ic:'⏰'},
    {type:'datetime', label:'Fecha y hora', ic:'📆'},
    {type:'note', label:'Nota', ic:'ℹ'}
  ]},
  { cat:'Selección', cls:'', items:[
    {type:'select_one', label:'Opción única', ic:'◉'},
    {type:'select_multiple', label:'Opción múltiple', ic:'☑'},
    {type:'yesno', label:'Sí / No', ic:'⇄'},
    {type:'likert', label:'Escala 1–5', ic:'★'}
  ]},
  { cat:'Geografía (INE / Manual)', cls:'geo', single:true, items:[
    {type:'geo_cascade', label:'Bloque completo (Est → Mun → Par → Com)', ic:'🗺'},
    {type:'geo_estado', label:'Estado', ic:'📍'},
    {type:'geo_municipio', label:'Municipio', ic:'📍'},
    {type:'geo_parroquia', label:'Parroquia', ic:'📍'},
    {type:'geo_comunidad', label:'Comunidad', ic:'🏘'}
  ]},
  { cat:'Estructura y avanzados', cls:'grp', items:[
    {type:'begin_group', label:'Grupo / Sección', ic:'📁'},
    {type:'begin_repeat', label:'Grupo repetitivo', ic:'🔁'},
    {type:'calculate', label:'Cálculo', ic:'fx'},
    {type:'acknowledge', label:'Confirmación', ic:'✓'},
    {type:'range', label:'Rango / Escala', ic:'⇿'},
    {type:'hidden', label:'Campo oculto', ic:'◌'},
    {type:'signature', label:'Firma', ic:'✍'},
    {type:'image', label:'Foto', ic:'📷'},
    {type:'audio', label:'Audio', ic:'🎙'},
    {type:'video', label:'Video', ic:'🎥'},
    {type:'file', label:'Archivo', ic:'📎'},
    {type:'geopoint', label:'Punto GPS', ic:'🌐'},
    {type:'geotrace', label:'Ruta GPS', ic:'〰'},
    {type:'geoshape', label:'Área GPS', ic:'⬠'},
    {type:'barcode', label:'QR / Barras', ic:'▦'}
  ]}
];

function ckAllNames(){
  return new Set(CK_IO.flattenTree(CK.fields).filter(f=>f.kind!=='end').map(f=>f.name));
}

function ckUniqueName(base){
  const used=ckAllNames();
  let b=snake(base||'campo');
  if(/^\d/.test(b)) b='c_'+b;
  if(!used.has(b)) return b;
  let i=2;
  while(used.has(`${b}_${i}`)) i++;
  return `${b}_${i}`;
}

function ckMakeField(palType){
  const id=CK_IO.uid();
  if(palType==='geo_cascade'){
    const est=ckMakeField('geo_estado');
    const mun=ckMakeField('geo_municipio');
    const par=ckMakeField('geo_parroquia');
    const com=ckMakeField('geo_comunidad');
    mun.geo.parentField={estado:est.name};
    par.geo.parentField={estado:est.name,municipio:mun.name};
    com.geo.parentField={estado:est.name,municipio:mun.name,parroquia:par.name};
    return {
      id, kind:'group', type:'begin_group',
      name:ckUniqueName('ubicacion_geografica'),
      label:'Ubicación geográfica',
      hint:'', appearance:'field-list', relevant:'', collapsed:false,
      children:[est,mun,par,com]
    };
  }
  if(palType.startsWith('geo_')){
    const lvl=palType.replace('geo_','');
    const labels={estado:'Estado',municipio:'Municipio',parroquia:'Parroquia',comunidad:'Comunidad'};
    const nm=ckUniqueName(lvl);
    return {
      id, kind:'geo', type:'select_one',
      name:nm, label:labels[lvl]||'Ubicación',
      hint:'', required:true, requiredMsg:'', relevant:'', constraint:'', constraintMsg:'',
      appearance:'minimal autocomplete', default:'', readOnly:false, calculation:'',
      choiceFilter:'', choiceFilterManual:false,
      listName:`lista_${nm}`, orOther:false, options:[],
      geo:{ level:lvl, mode:'ine', estadosFilter:[], manual:[], parentField:{} }
    };
  }
  if(palType==='begin_group'||palType==='begin_repeat'){
    const isRep=palType==='begin_repeat';
    return {
      id, kind:isRep?'repeat':'group', type:palType,
      name:ckUniqueName(isRep?'repeticion':'seccion'),
      label:isRep?'Grupo repetitivo':'Nueva sección',
      hint:'', appearance:'', relevant:'', repeatCount:'', collapsed:false, children:[]
    };
  }
  if(palType==='yesno'){
    const nm=ckUniqueName('pregunta_si_no');
    return {
      id, kind:'field', type:'select_one', name:nm, label:'¿Confirma?',
      hint:'', required:false, requiredMsg:'', relevant:'', constraint:'', constraintMsg:'',
      appearance:'horizontal', default:'', readOnly:false, calculation:'',
      choiceFilter:'', listName:`lista_${nm}`, orOther:false,
      options:[{code:'si',label:'Sí'},{code:'no',label:'No'}]
    };
  }
  if(palType==='likert'){
    const nm=ckUniqueName('valoracion');
    return {
      id, kind:'field', type:'select_one', name:nm, label:'Nivel de satisfacción',
      hint:'', required:false, requiredMsg:'', relevant:'', constraint:'', constraintMsg:'',
      appearance:'likert', default:'', readOnly:false, calculation:'',
      choiceFilter:'', listName:`lista_${nm}`, orOther:false,
      options:[
        {code:'1',label:'1 - Muy insatisfecho'},
        {code:'2',label:'2 - Insatisfecho'},
        {code:'3',label:'3 - Neutral'},
        {code:'4',label:'4 - Satisfecho'},
        {code:'5',label:'5 - Muy satisfecho'}
      ]
    };
  }
  if(palType==='select_one'||palType==='select_multiple'){
    const nm=ckUniqueName('seleccion');
    return {
      id, kind:'field', type:palType, name:nm, label:'Nueva pregunta de selección',
      hint:'', required:false, requiredMsg:'', relevant:'', constraint:'', constraintMsg:'',
      appearance:'', default:'', readOnly:false, calculation:'',
      choiceFilter:'', listName:`lista_${nm}`, orOther:false,
      options:[{code:'opcion_1',label:'Opción 1'},{code:'opcion_2',label:'Opción 2'}]
    };
  }
  if(palType==='signature'){
    return {
      id, kind:'field', type:'image', name:ckUniqueName('firma'), label:'Firma',
      hint:'Firme dentro del recuadro', required:false, requiredMsg:'', relevant:'', constraint:'', constraintMsg:'',
      appearance:'signature', parameters:'', default:'', readOnly:false, calculation:'', choiceFilter:'',
      listName:'', orOther:false, options:[]
    };
  }
  const defs={
    text:{label:'Pregunta de texto',name:'texto'},
    integer:{label:'Número entero',name:'numero'},
    decimal:{label:'Número decimal',name:'decimal'},
    date:{label:'Fecha',name:'fecha'},
    time:{label:'Hora',name:'hora'},
    datetime:{label:'Fecha y hora',name:'fecha_hora'},
    note:{label:'Nota informativa',name:'nota'},
    calculate:{label:'Cálculo automático',name:'calculo'},
    acknowledge:{label:'Confirmación / Aceptación',name:'confirmacion'},
    range:{label:'Rango numérico',name:'rango',parameters:'start=1;end=10;step=1'},
    hidden:{label:'Campo oculto',name:'oculto'},
    geopoint:{label:'Ubicación GPS',name:'ubicacion_gps'},
    geotrace:{label:'Ruta GPS',name:'ruta_gps'},
    geoshape:{label:'Área / Polígono GPS',name:'area_gps'},
    image:{label:'Fotografía',name:'foto'},
    audio:{label:'Grabación de audio',name:'audio'},
    video:{label:'Grabación de video',name:'video'},
    file:{label:'Archivo adjunto',name:'archivo'},
    barcode:{label:'Código QR / Barras',name:'codigo_qr'}
  };
  const d=defs[palType]||{label:'Nueva pregunta',name:'campo'};
  return {
    id, kind:'field', type:palType, name:ckUniqueName(d.name), label:d.label,
    hint:'', required:false, requiredMsg:'', relevant:'', constraint:'', constraintMsg:'',
    appearance:'', parameters:d.parameters||'', default:'', readOnly:false, calculation:'', choiceFilter:'',
    listName:'', orOther:false, options:[]
  };
}

/* Plantillas rápidas */
function ckResetBlank(){
  CK.formTitle='Nuevo formulario Kobo';
  CK.formId='nuevo_formulario_kobo';
  CK.formStyle='theme-grid';
  CK.langSuffix='Spanish (es)';
  CK.metaFields=[
    {id:'m_start',kind:'meta',type:'start',name:'start'},
    {id:'m_end',kind:'meta',type:'end',name:'end'},
    {id:'m_today',kind:'meta',type:'today',name:'today'},
    {id:'m_deviceid',kind:'meta',type:'deviceid',name:'deviceid'}
  ];
  CK.fields=[];
  CK.selectedId=null;
  CK.tab='general';
  CK.search='';
  const t=$('#ckFormTitle'), fid=$('#ckFormId'), lng=$('#ckLang'), sr=$('#ckSearch'), st=$('#ckStyle');
  if(t) t.value=CK.formTitle;
  if(fid) fid.value=CK.formId;
  if(lng) lng.value=CK.langSuffix;
  if(st) st.value=CK.formStyle;
  if(sr) sr.value='';
}

function ckApplyTemplate(tpl){
  if(tpl==='blank'){
    ckResetBlank();
  } else if(tpl==='consent'){
    ckResetBlank();
    CK.formTitle='Registro de Beneficiarios';
    CK.formId='registro_beneficiarios';
    const cons={...ckMakeField('yesno'), name:'consentimiento', listName:'si_no', label:'¿El/la participante otorga su consentimiento informado?', required:true};
    const nom={...ckMakeField('text'), name:'nombre_completo', label:'Nombre y apellido', required:true, relevant:"${consentimiento} = 'si'"};
    const edad={...ckMakeField('integer'), name:'edad', label:'Edad (años cumplidos)', required:true, relevant:"${consentimiento} = 'si'", constraint:'. >= 0 and . <= 120', constraintMsg:'La edad debe estar entre 0 y 120 años.'};
    const sexo={...ckMakeField('select_one'), name:'sexo', listName:'lista_sexo', label:'Sexo', required:true, relevant:"${consentimiento} = 'si'", options:[{code:'mujer',label:'Mujer'},{code:'hombre',label:'Hombre'},{code:'otro',label:'Otro'},{code:'no_responde',label:'Prefiere no responder'}]};
    CK.fields=[cons, nom, edad, sexo];
    CK.selectedId=edad.id;
  } else if(tpl==='asistencia'){
    ckResetBlank();
    CK.formTitle='Registro de Asistencia';
    CK.formId='registro_asistencia';
    const f1={...ckMakeField('date'), name:'fecha_actividad', label:'Fecha de la actividad', required:true, constraint:'. <= today()', constraintMsg:'La fecha no puede ser futura.'};
    const f2={...ckMakeField('text'), name:'nombre_actividad', label:'Nombre de la actividad o taller', required:true};
    const geo=ckMakeField('geo_cascade');
    const f3={...ckMakeField('text'), name:'participante', label:'Nombre completo del participante', required:true};
    const f4={...ckMakeField('text'), name:'documento', label:'Documento de identidad', constraint:"regex(., '^[0-9]{5,12}$')", constraintMsg:'Ingrese solo dígitos (5 a 12 caracteres).'};
    CK.fields=[f1,f2,geo,f3,f4];
    CK.selectedId=geo.id;
  }
  const t=$('#ckFormTitle'), fid=$('#ckFormId');
  if(t) t.value=CK.formTitle;
  if(fid) fid.value=CK.formId;
  CK.tab='general';
  ckRender();
}

/* Manipulación del árbol */
function ckRemoveById(nodes, id){
  for(let i=0;i<nodes.length;i++){
    if(nodes[i].id===id) return nodes.splice(i,1)[0];
    if(nodes[i].children){
      const r=ckRemoveById(nodes[i].children,id);
      if(r) return r;
    }
  }
  return null;
}

function ckInsertNode(nodes, targetId, pos, item){
  if(!targetId){ nodes.push(item); return true; }
  for(let i=0;i<nodes.length;i++){
    if(nodes[i].id===targetId){
      if(pos==='in'&&(nodes[i].kind==='group'||nodes[i].kind==='repeat')){
        nodes[i].children=nodes[i].children||[];
        nodes[i].children.push(item);
        nodes[i].collapsed=false;
      } else {
        nodes.splice(pos==='top'?i:i+1, 0, item);
      }
      return true;
    }
    if(nodes[i].children&&ckInsertNode(nodes[i].children,targetId,pos,item)) return true;
  }
  return false;
}

function ckContainsId(node, id){
  if(!node) return false;
  if(node.id===id) return true;
  return (node.children||[]).some(c=>ckContainsId(c,id));
}

function ckMoveStep(nodes, id, dir){
  for(let i=0;i<nodes.length;i++){
    if(nodes[i].id===id){
      const ni=i+dir;
      if(ni<0||ni>=nodes.length) return true;
      const [it]=nodes.splice(i,1);
      nodes.splice(ni,0,it);
      return true;
    }
    if(nodes[i].children&&ckMoveStep(nodes[i].children,id,dir)) return true;
  }
  return false;
}

function ckCloneNode(node){
  const copy=JSON.parse(JSON.stringify(node));
  const reassign=(n)=>{
    n.id=CK_IO.uid();
    n.name=ckUniqueName(n.name+'_copia');
    if(n.listName&&!n.geo) n.listName=`lista_${n.name}`;
    if(n.children) n.children.forEach(reassign);
  };
  reassign(copy);
  return copy;
}

function ckAddFromPalette(palType, targetId=null, pos='bot'){
  const created=ckMakeField(palType);
  const items=Array.isArray(created)?created:[created];
  items.forEach((it,idx)=>{
    if(targetId) ckInsertNode(CK.fields, targetId, idx===0?pos:'bot', it);
    else CK.fields.push(it);
  });
  CK.selectedId=items[0].id;
  CK.tab=items[0].kind==='geo'?'geo':'general';
  ckRender();
  if(palType==='geo_cascade'||palType==='geo_comunidad'){
    const comField=palType==='geo_cascade'
      ?(items[0].children||[]).find(c=>c.geo?.level==='comunidad')
      :items[0];
    if(comField) ckPromptComunidadMode(comField);
  }
}

function ckVenezuelaBgSvg(){
  if(typeof VE_MAP==='undefined'||!VE_MAP?.states?.length) return '';
  const paths=VE_MAP.states.map(s=>`<path d="${s.r.split('|').map(r=>'M'+r.replace(/ /g,'L')+'Z').join('')}"/>`).join('');
  return `<svg class="ck-geo-bg" viewBox="0 0 ${VE_MAP.w} ${VE_MAP.h}" fill="currentColor" aria-hidden="true">${paths}</svg>`;
}

function ckPromptComunidadMode(comField){
  const dlg=$('#ckDlg'), tabsEl=$('#ckDlgTabs'), bodyEl=$('#ckDlgBody'), titleEl=$('#ckDlgTitle');
  if(!dlg) return;
  dlg.classList.add('sm');
  titleEl.textContent='Comunidades';
  tabsEl.innerHTML='';
  bodyEl.innerHTML=`
    <div class="ck-geo-modal">
      ${ckVenezuelaBgSvg()}
      <p style="position:relative;z-index:1;margin:0 0 16px;font-size:14px;line-height:1.5;color:var(--ink-2)">
        Venezuela tiene miles de comunidades; incluirlas todas vuelve muy pesado el Excel. ¿Cómo prefieres cargarlas?
      </p>
      <div class="ck-geo-opts">
        <button type="button" class="btn primary ck-geo-opt" id="ckOptCsv">
          <strong>Usar <code>comunidades.csv</code> externo</strong>
          <small style="opacity:.88;font-weight:400">Recomendado · Se sube a Media en Kobo</small>
        </button>
        <button type="button" class="btn ck-geo-opt" id="ckOptFilter">
          <strong>Filtrar por Estado en el Excel</strong>
          <small class="muted" style="font-weight:400">Incluir solo algunos estados</small>
        </button>
      </div>
    </div>
  `;
  $('#ckOptCsv').onclick=()=>{
    comField.geo.mode='csv';
    comField.geo.csvFile=comField.geo.csvFile||'comunidades.csv';
    CK.selectedId=comField.id;
    CK.tab='geo';
    dlg.close();
    ckRender();
    toast('Comunidad configurada con CSV externo.');
  };
  $('#ckOptFilter').onclick=()=>{
    comField.geo.mode='ine';
    if(!comField.geo.estadosFilter?.length) comField.geo.estadosFilter=['Distrito Capital'];
    CK.selectedId=comField.id;
    CK.tab='geo';
    dlg.close();
    ckRender();
  };
  dlg.showModal();
}

/* Vista principal */
function viewCreacionKobo(){
  return `<div class="ck-wrap">
    <section class="p-hero ck-hero">
      <div>
        <h1>Creación de Kobo</h1>
        <p>Constructor visual de formularios XLSForm para KoboToolbox: arrastra campos, configura dependencias, geografía en cascada y exporta listo para subir.</p>
      </div>
      <span class="ck-meta-pill" style="background:var(--surface)">XLSForm · KoboToolbox</span>
    </section>

    <div class="ck-top">
      <div class="ck-title-grp">
        <input class="ck-title-in" id="ckFormTitle" type="text" value="${esc(CK.formTitle)}" aria-label="Título del formulario" title="Haz clic para editar el título del formulario">
        <span class="ck-meta-pill">ID: <input id="ckFormId" type="text" value="${esc(CK.formId)}" aria-label="ID del formulario"></span>
        <span class="ck-meta-pill">Estilo Kobo:
          <select id="ckStyle" aria-label="Estilo visual en Kobo">
            <option value="theme-grid"${CK.formStyle==='theme-grid'?' selected':''}>Grid (Naranja moderno)</option>
            <option value="pages"${CK.formStyle==='pages'?' selected':''}>Por páginas</option>
            <option value=""${CK.formStyle===''?' selected':''}>Clásico (Azul)</option>
          </select>
        </span>
        <span class="ck-meta-pill">Idioma:
          <select id="ckLang" aria-label="Idioma principal">
            <option value="Spanish (es)"${CK.langSuffix==='Spanish (es)'?' selected':''}>Spanish (es)</option>
            <option value="Español"${CK.langSuffix==='Español'?' selected':''}>Español</option>
            <option value="English (en)"${CK.langSuffix==='English (en)'?' selected':''}>English (en)</option>
            <option value=""${CK.langSuffix===''?' selected':''}>Sin sufijo (label)</option>
          </select>
        </span>
      </div>
      <div class="ck-actions">
        <button class="btn" type="button" id="ckBtnReset" title="Descartar todo y empezar un formulario desde cero">↺ Empezar desde cero</button>
        <label class="btn" title="Cargar un XLSForm (.xlsx) existente de Kobo para editarlo"><input type="file" id="ckFileIn" accept=".xlsx,.xls" hidden>📂 Cargar XLS</label>
        <a class="btn" href="https://getodk.org/xlsform/" target="_blank" rel="noopener noreferrer" title="Validar y probar tu XLSForm en ODK Online">↗ Probar en ODK</a>
        <button class="btn" type="button" id="ckBtnPrev">👁 Vista XLS / Validar <span id="ckValBadge"></span></button>
        <button class="btn primary" type="button" id="ckBtnExport">⬇ Descargar XLSForm</button>
      </div>
    </div>

    <div class="ck-quick">
      <div class="ck-quick-l">
        <strong>Plantillas:</strong>
        <button class="btn sm" type="button" data-tpl="blank">En blanco</button>
        <button class="btn sm" type="button" data-tpl="consent">Consentimiento + Datos</button>
        <button class="btn sm" type="button" data-tpl="asistencia">Registro de asistencia</button>
      </div>
      <div class="ck-quick-r" id="ckStats"></div>
    </div>

    <div class="ck-grid">
      <aside class="ck-panel ck-panel-sticky" aria-label="Tipos de campo">
        <div class="ck-ph"><h2>Bloques</h2><span class="muted" style="font-size:11px">Arrastra o haz clic</span></div>
        <div class="ck-pb" id="ckPalette"></div>
      </aside>

      <section class="ck-panel" aria-label="Lienzo del formulario">
        <div class="ck-canvas-head">
          <strong style="font-size:14px">Estructura del formulario</strong>
          <input class="ck-search" id="ckSearch" type="search" placeholder="Buscar pregunta o variable…" value="${esc(CK.search)}">
        </div>
        <div class="ck-canvas-body" id="ckCanvas"></div>
      </section>

      <aside class="ck-panel ck-panel-sticky" aria-label="Propiedades del campo">
        <div class="ck-ph"><h2>Propiedades</h2><span class="muted" id="ckSelType" style="font-size:11.5px"></span></div>
        <div id="ckInspector"></div>
      </aside>
    </div>

    <dialog class="ck-dlg" id="ckDlg">
      <div class="dlg-h"><strong id="ckDlgTitle">Vista previa y validación XLSForm</strong><button class="btn sm" type="button" id="ckDlgClose">Cerrar</button></div>
      <div class="ck-tabs" id="ckDlgTabs"></div>
      <div class="ck-dlg-b" id="ckDlgBody"></div>
    </dialog>
  </div>`;
}

function ckRenderPalette(){
  const el=$('#ckPalette');
  if(!el) return;
  el.innerHTML=CK_PALETTE.map(cat=>`<div class="ck-pal-cat">
    <div class="ck-pal-t">${esc(cat.cat)}</div>
    <div class="ck-pal-list${cat.single?' single':''}">
      ${cat.items.map(it=>`<button class="ck-pal-btn${cat.cls?' '+cat.cls:''}" type="button" draggable="true" data-pal="${esc(it.type)}">
        <span class="ck-pal-ic">${it.ic}</span><span>${esc(it.label)}</span>
      </button>`).join('')}
    </div>
  </div>`).join('');

  el.querySelectorAll('.ck-pal-btn').forEach(btn=>{
    btn.onclick=()=>ckAddFromPalette(btn.dataset.pal);
    btn.ondragstart=(e)=>{
      CK.dragPayload={kind:'palette',palType:btn.dataset.pal};
      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setData('text/plain',btn.dataset.pal);
    };
  });
}

function ckRenderCard(node, valMap){
  const q=fold(CK.search);
  const match=!q||fold(node.label).includes(q)||fold(node.name).includes(q)||fold(node.type).includes(q);
  const isGrp=node.kind==='group'||node.kind==='repeat';
  const childHtml=isGrp?(node.children||[]).map(c=>ckRenderCard(c,valMap)).join(''):'';
  if(!match&&!childHtml) return '';

  const sel=CK.selectedId===node.id?' sel':'';
  const grpCls=node.kind==='group'?' is-group':(node.kind==='repeat'?' is-repeat':'');
  const errs=valMap.get(node.id)||[];

  const badges=[];
  if(node.geo) badges.push(`<span class="ck-pill geo">Geo: ${esc(node.geo.level)} (${node.geo.mode==='ine'?'INE':node.geo.mode==='csv'?'CSV externo':node.geo.mode==='manual'?'Manual':'Híbrido'})</span>`);
  else badges.push(`<span class="ck-pill">${esc(node.type)}</span>`);
  if(node.relevant) badges.push(`<span class="ck-pill cond" title="${esc(node.relevant)}">Condicional</span>`);
  if(node.constraint) badges.push(`<span class="ck-pill cons" title="${esc(node.constraint)}">Restricción</span>`);
  if(node.calculation) badges.push(`<span class="ck-pill">Cálculo</span>`);
  if(errs.some(x=>x.severity==='err')) badges.push(`<span class="ck-pill err">Revisar</span>`);

  return `<div class="ck-card${sel}${grpCls}" draggable="true" data-id="${esc(node.id)}">
    <div class="ck-card-top">
      <span class="ck-drag" title="Arrastra para reordenar">⋮⋮</span>
      <div class="ck-card-main">
        <div class="ck-card-lbl">
          ${isGrp?`<button type="button" class="ck-icon-btn" data-act="toggle" title="${node.collapsed?'Expandir':'Contraer'}">${node.collapsed?'▸':'▾'}</button>`:''}
          <span>${esc(node.label||node.name)}</span>
          ${node.required?'<span class="ck-req" title="Obligatoria">*</span>':''}
        </div>
        <div class="ck-card-sub">
          <span class="ck-code">\${${esc(node.name)}}</span>
          ${badges.join('')}
        </div>
      </div>
      <div class="ck-card-acts">
        <button type="button" class="ck-icon-btn" data-act="up" title="Subir">↑</button>
        <button type="button" class="ck-icon-btn" data-act="down" title="Bajar">↓</button>
        <button type="button" class="ck-icon-btn" data-act="dup" title="Duplicar">⧉</button>
        <button type="button" class="ck-icon-btn del" data-act="del" title="Eliminar">✕</button>
      </div>
    </div>
    ${isGrp&&!node.collapsed?`<div class="ck-group-children" data-grp="${esc(node.id)}">
      ${childHtml||`<div class="ck-group-empty" data-grp-empty="${esc(node.id)}">Arrastra preguntas aquí dentro de "${esc(node.label)}"</div>`}
    </div>`:''}
  </div>`;
}

function ckRenderCanvas(){
  const canvas=$('#ckCanvas');
  if(!canvas) return;
  const val=CK_IO.validateForm(CK);
  const valMap=new Map();
  [...val.errors,...val.warnings].forEach(v=>{
    if(!valMap.has(v.fieldId)) valMap.set(v.fieldId,[]);
    valMap.get(v.fieldId).push(v);
  });

  const badge=$('#ckValBadge');
  if(badge){
    badge.innerHTML=val.errors.length
      ?`<span class="ck-badge-err">${val.errors.length}</span>`
      :`<span class="ck-badge-ok">✓</span>`;
  }
  const flat=CK_IO.flattenTree(CK.fields).filter(f=>f.kind!=='end');
  const stats=$('#ckStats');
  if(stats){
    const reqN=flat.filter(f=>f.required).length;
    const condN=flat.filter(f=>f.relevant).length;
    const metaN=(CK.metaFields||[]).length;
    stats.innerHTML=`<span><b>${flat.length}</b> campos</span> · <span><b>${reqN}</b> obligatorios</span> · <span><b>${condN}</b> condicionales</span> · <span title="Se exportan automáticamente al inicio del XLSForm"><b>${metaN}</b> metadatos ocultos</span>`;
  }

  if(!CK.fields.length){
    canvas.innerHTML=`<div class="ck-empty" id="ckDropEmpty">
      <strong>Tu formulario está vacío</strong>
      <span>Arrastra un bloque desde la izquierda, haz clic en un tipo de campo, elige una plantilla arriba o carga un XLSForm (.xlsx) existente.</span>
    </div>`;
    const emp=$('#ckDropEmpty');
    emp.ondragover=(e)=>{ e.preventDefault(); emp.classList.add('over'); };
    emp.ondragleave=()=>emp.classList.remove('over');
    emp.ondrop=(e)=>{
      e.preventDefault(); emp.classList.remove('over');
      if(CK.dragPayload?.kind==='palette') ckAddFromPalette(CK.dragPayload.palType);
      CK.dragPayload=null;
    };
    return;
  }

  canvas.innerHTML=CK.fields.map(n=>ckRenderCard(n,valMap)).join('');

  /* Eventos de tarjetas y drag & drop */
  const clearDropClasses=()=>canvas.querySelectorAll('.drop-top,.drop-bot,.drop-in,.over').forEach(x=>x.classList.remove('drop-top','drop-bot','drop-in','over'));

  canvas.querySelectorAll('.ck-card').forEach(card=>{
    const id=card.dataset.id;
    card.onclick=(e)=>{
      const actBtn=e.target.closest('[data-act]');
      if(actBtn){
        e.stopPropagation();
        const act=actBtn.dataset.act;
        if(act==='toggle'){ const n=CK_IO.findById(CK.fields,id); if(n){ n.collapsed=!n.collapsed; ckRenderCanvas(); } }
        else if(act==='up'){ ckMoveStep(CK.fields,id,-1); ckRenderCanvas(); }
        else if(act==='down'){ ckMoveStep(CK.fields,id,1); ckRenderCanvas(); }
        else if(act==='dup'){ const n=CK_IO.findById(CK.fields,id); if(n){ const c=ckCloneNode(n); ckInsertNode(CK.fields,id,'bot',c); CK.selectedId=c.id; ckRender(); } }
        else if(act==='del'){ ckRemoveById(CK.fields,id); if(CK.selectedId===id) CK.selectedId=null; ckRender(); }
        return;
      }
      e.stopPropagation();
      CK.selectedId=id;
      const n=CK_IO.findById(CK.fields,id);
      if(n&&n.kind==='geo'&&CK.tab==='options') CK.tab='geo';
      if(n&&n.kind!=='geo'&&CK.tab==='geo') CK.tab='general';
      ckRenderCanvas();
      ckRenderInspector();
    };

    card.ondragstart=(e)=>{
      e.stopPropagation();
      CK.dragPayload={kind:'move',id};
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',id);
    };
    card.ondragend=()=>{ card.classList.remove('dragging'); clearDropClasses(); CK.dragPayload=null; };
    card.ondragover=(e)=>{
      e.preventDefault(); e.stopPropagation();
      if(!CK.dragPayload) return;
      if(CK.dragPayload.kind==='move'&&CK.dragPayload.id===id) return;
      clearDropClasses();
      const rect=card.getBoundingClientRect();
      const relY=(e.clientY-rect.top)/rect.height;
      const isGrp=card.classList.contains('is-group')||card.classList.contains('is-repeat');
      if(isGrp&&relY>0.28&&relY<0.72) card.classList.add('drop-in');
      else if(relY<0.5) card.classList.add('drop-top');
      else card.classList.add('drop-bot');
    };
    card.ondrop=(e)=>{
      e.preventDefault(); e.stopPropagation();
      const p=CK.dragPayload;
      if(!p){ clearDropClasses(); return; }
      const rect=card.getBoundingClientRect();
      const relY=(e.clientY-rect.top)/rect.height;
      const isGrp=card.classList.contains('is-group')||card.classList.contains('is-repeat');
      const pos=(isGrp&&relY>0.28&&relY<0.72)?'in':(relY<0.5?'top':'bot');
      clearDropClasses();
      CK.dragPayload=null;
      if(p.kind==='palette'){
        ckAddFromPalette(p.palType, id, pos);
      } else if(p.kind==='move'){
        if(p.id===id) return;
        const moving=CK_IO.findById(CK.fields,p.id);
        if(moving&&ckContainsId(moving,id)){ toast('No puedes mover un grupo dentro de sí mismo.'); return; }
        ckRemoveById(CK.fields,p.id);
        ckInsertNode(CK.fields,id,pos,moving);
        ckRender();
      }
    };
  });

  canvas.querySelectorAll('[data-grp-empty]').forEach(emp=>{
    const grpId=emp.dataset.grpEmpty;
    emp.ondragover=(e)=>{ e.preventDefault(); e.stopPropagation(); clearDropClasses(); emp.classList.add('over'); };
    emp.ondrop=(e)=>{
      e.preventDefault(); e.stopPropagation();
      const p=CK.dragPayload; clearDropClasses(); CK.dragPayload=null;
      if(!p) return;
      if(p.kind==='palette') ckAddFromPalette(p.palType, grpId, 'in');
      else if(p.kind==='move'){
        const moving=CK_IO.findById(CK.fields,p.id);
        if(moving&&ckContainsId(moving,grpId)) return;
        ckRemoveById(CK.fields,p.id);
        ckInsertNode(CK.fields,grpId,'in',moving);
        ckRender();
      }
    };
  });
}

/* Inspector derecho */
function ckRenderInspector(){
  const box=$('#ckInspector');
  const selLbl=$('#ckSelType');
  if(!box) return;
  const f=CK.selectedId?CK_IO.findById(CK.fields,CK.selectedId):null;
  if(!f){
    if(selLbl) selLbl.textContent='';
    box.innerHTML=`<div class="ck-pb"><div class="ck-hint-box">Selecciona una pregunta o grupo en el centro para editar sus propiedades, opciones, dependencias o restricciones.</div></div>`;
    return;
  }
  if(selLbl) selLbl.textContent=f.geo?`geo:${f.geo.level}`:f.type;

  const isSel=(f.type==='select_one'||f.type==='select_multiple')&&!f.geo;
  const isGeo=Boolean(f.geo);
  const isGrp=f.kind==='group'||f.kind==='repeat';
  const isMeta=f.kind==='meta';
  const isCalc=f.type==='calculate';

  const tabs=[{id:'general',lbl:'General'}];
  if(isSel) tabs.push({id:'options',lbl:`Opciones (${(f.options||[]).length})`});
  if(isGeo) tabs.push({id:'geo',lbl:'Geografía'});
  if(!isMeta) tabs.push({id:'relevant',lbl:'Dependencias'});
  if(!isMeta&&!isGrp&&!isCalc&&f.type!=='note') tabs.push({id:'constraint',lbl:'Restricciones'});
  if(isCalc) tabs.push({id:'calc',lbl:'Cálculo'});

  if(!tabs.some(t=>t.id===CK.tab)) CK.tab='general';

  let body='';
  if(CK.tab==='general') body=ckTabGeneral(f,isGrp,isMeta,isSel);
  else if(CK.tab==='options') body=ckTabOptions(f);
  else if(CK.tab==='geo') body=ckTabGeo(f);
  else if(CK.tab==='relevant') body=ckTabRelevant(f);
  else if(CK.tab==='constraint') body=ckTabConstraint(f);
  else if(CK.tab==='calc') body=ckTabCalc(f);

  box.innerHTML=`<div class="ck-tabs">${tabs.map(t=>`<button type="button" class="ck-tab${CK.tab===t.id?' on':''}" data-tab="${t.id}">${esc(t.lbl)}</button>`).join('')}</div>
    <div class="ck-pb"><div class="ck-form">${body}</div></div>`;

  box.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ CK.tab=b.dataset.tab; ckRenderInspector(); });
  ckBindInspector(box, f);
}

function ckTabGeneral(f,isGrp,isMeta,isSel){
  const appPresets=[
    ['','Predeterminada'],
    ['minimal','minimal (desplegable)'],
    ['horizontal','horizontal'],
    ['horizontal-compact','horizontal-compact'],
    ['multiline','multiline (texto largo)'],
    ['numbers','numbers (teclado numérico)'],
    ['autocomplete','autocomplete'],
    ['likert','likert'],
    ['signature','signature (firma)'],
    ['field-list','field-list (todo en una pantalla)'],
    ['table-list','table-list']
  ];
  return `
    ${!isMeta?`<div class="ck-field"><label>Etiqueta visible (Pregunta)</label><input type="text" id="inLabel" value="${esc(f.label)}"></div>`:''}
    <div class="ck-field">
      <label>Nombre interno (variable) <button type="button" class="btn sm" id="btnAutoName" style="padding:2px 7px;font-size:11px">Autogenerar</button></label>
      <input type="text" id="inName" value="${esc(f.name)}">
    </div>
    ${!isMeta?`<div class="ck-field"><label>Texto de ayuda (hint)</label><input type="text" id="inHint" value="${esc(f.hint||'')}" placeholder="Instrucción corta para el encuestador"></div>`:''}
    ${!isGrp&&!isMeta&&f.type!=='note'&&f.type!=='calculate'?`
      <label class="ck-chk"><input type="checkbox" id="inReq"${f.required?' checked':''}> Pregunta obligatoria (required)</label>
      ${f.required?`<div class="ck-field"><label>Mensaje si queda vacía (opcional)</label><input type="text" id="inReqMsg" value="${esc(f.requiredMsg||'')}"></div>`:''}
      <label class="ck-chk"><input type="checkbox" id="inRO"${f.readOnly?' checked':''}> Solo lectura (read_only)</label>
    `:''}
    ${isSel?`<label class="ck-chk"><input type="checkbox" id="inOrOther"${f.orOther?' checked':''}> Permitir opción "Otro, especifique" (or_other)</label>`:''}
    ${!isMeta?`
      <div class="ck-row2">
        <div class="ck-field"><label>Apariencia</label>
          <select id="inAppSel">
            ${appPresets.map(([v,t])=>`<option value="${v}"${f.appearance===v?' selected':''}>${esc(t)}</option>`).join('')}
            ${f.appearance&&!appPresets.some(([v])=>v===f.appearance)?`<option value="${esc(f.appearance)}" selected>${esc(f.appearance)}</option>`:''}
          </select>
        </div>
        ${f.kind==='repeat'
          ?`<div class="ck-field"><label>Repeticiones (repeat_count)</label><input type="text" id="inRepCnt" value="${esc(f.repeatCount||'')}" placeholder="Ej: \${num_miembros}"></div>`
          :`<div class="ck-field"><label>Valor por defecto</label><input type="text" id="inDef" value="${esc(f.default||'')}"></div>`}
      </div>
      ${f.type==='range'?`<div class="ck-field"><label>Parámetros de rango (parameters)</label><input type="text" id="inParams" value="${esc(f.parameters||'start=1;end=10;step=1')}" placeholder="start=1;end=10;step=1"></div>`:''}
    `:''}
  `;
}

function ckTabOptions(f){
  const opts=f.options||[];
  return `
    <div class="ck-field">
      <label>Nombre de lista (list_name)</label>
      <input type="text" id="inListName" value="${esc(f.listName||`lista_${f.name}`)}">
    </div>
    <div class="ck-opt-list" id="ckOptList">
      ${opts.map((o,i)=>`<div class="ck-opt-row" data-oi="${i}">
        <input type="text" class="opt-code" value="${esc(o.code)}" placeholder="código">
        <input type="text" class="opt-lbl" value="${esc(o.label)}" placeholder="Etiqueta visible">
        <button type="button" class="ck-icon-btn del opt-del" title="Quitar">✕</button>
      </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="btn sm" id="btnAddOpt">+ Agregar opción</button>
      <button type="button" class="btn sm" id="btnBulkOpt">Pegar varias líneas</button>
    </div>
    <div id="ckBulkBox" hidden class="ck-field">
      <label>Pega una opción por línea (se genera su código automáticamente)</label>
      <textarea id="inBulkText" placeholder="Opción A&#10;Opción B&#10;Opción C"></textarea>
      <button type="button" class="btn sm primary" id="btnApplyBulk">Agregar lista</button>
    </div>
  `;
}

function ckTabGeo(f){
  const g=f.geo;
  const lvl=g.level;
  const allEstados=CK_GEO.getEstados();
  const estFilter=new Set(g.estadosFilter||[]);
  const flat=CK_IO.flattenTree(CK.fields).filter(x=>x.kind!=='end');
  const manual=g.manual||[];

  /* Opciones de padres disponibles para ingreso manual */
  const estParents=[...new Set([...allEstados, ...flat.filter(x=>x.geo?.level==='estado').flatMap(x=>(x.geo.manual||[]).map(m=>m.label))])];

  return `
    <div class="ck-field">
      <label>Origen de datos para "${esc(lvl.toUpperCase())}"</label>
      <select id="inGeoMode">
        <option value="ine"${g.mode==='ine'?' selected':''}>Catálogo INE en memoria (Venezuela)</option>
        ${lvl==='comunidad'?`<option value="csv"${g.mode==='csv'?' selected':''}>Archivo CSV externo (comunidades.csv para Media en Kobo)</option>`:''}
        <option value="manual"${g.mode==='manual'?' selected':''}>Ingreso manual personalizado</option>
        <option value="hibrido"${g.mode==='hibrido'?' selected':''}>Híbrido (INE en memoria + agregados manuales)</option>
      </select>
    </div>

    ${g.mode==='csv'?`
      <div class="ck-geo-box">
        <strong style="font-size:12px">Archivo CSV externo para Kobo Media</strong>
        <div class="ck-hint-box">El formulario usará <code>select_one_from_file ${esc(g.csvFile||'comunidades.csv')}</code>. Descarga el CSV y súbelo en KoboToolbox dentro de <b>Configuración → Media</b>.</div>
        <button type="button" class="btn sm primary" id="btnDlGeoCsv">⬇ Descargar ${esc(g.csvFile||'comunidades.csv')}</button>
      </div>
    `:''}

    ${g.mode==='ine'||g.mode==='hibrido'||g.mode==='csv'?`
      <div class="ck-geo-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
          <strong style="font-size:12px">Filtrar por Estados del proyecto</strong>
          <span style="display:flex;gap:4px">
            <button type="button" class="btn sm" id="btnGeoAll" style="padding:2px 6px;font-size:11px">Todos</button>
            <button type="button" class="btn sm" id="btnGeoNone" style="padding:2px 6px;font-size:11px">Limpiar</button>
          </span>
        </div>
        <div class="muted" style="font-size:11.5px">${estFilter.size?`${estFilter.size} estado(s) seleccionado(s)`:'Sin filtro: se incluirán los 24 estados de Venezuela.'}</div>
        <div class="ck-geo-tags" id="ckGeoTags">
          ${allEstados.map(e=>`<button type="button" class="ck-geo-tag${estFilter.has(e)?' on':''}" data-est="${esc(e)}">${esc(e)}</button>`).join('')}
        </div>
      </div>
      ${f.type==='range'?`<div class="ck-field"><label>Parámetros de rango (parameters)</label><input type="text" id="inParams" value="${esc(f.parameters||'start=1;end=10;step=1')}" placeholder="start=1;end=10;step=1"></div>`:''}
    `:''}

    ${g.mode==='manual'||g.mode==='hibrido'?`
      <div class="ck-geo-box">
        <strong style="font-size:12px">Agregar ${esc(lvl)} manualmente</strong>
        ${lvl!=='estado'?`<div class="muted" style="font-size:11.5px">Debes especificar a qué ${lvl==='municipio'?'Estado':lvl==='parroquia'?'Estado y Municipio':'Estado, Municipio y Parroquia'} pertenece.</div>`:''}
        ${lvl!=='estado'?`
          <div class="ck-field"><label>Estado padre</label>
            <select id="manEst">${estParents.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join('')}</select>
          </div>
        `:''}
        ${lvl==='parroquia'||lvl==='comunidad'?`
          <div class="ck-field"><label>Municipio padre</label>
            <input type="text" id="manMun" list="dlManMun" placeholder="Escribe o selecciona el municipio">
            <datalist id="dlManMun"></datalist>
          </div>
        `:''}
        ${lvl==='comunidad'?`
          <div class="ck-field"><label>Parroquia padre</label>
            <input type="text" id="manPar" list="dlManPar" placeholder="Escribe o selecciona la parroquia">
            <datalist id="dlManPar"></datalist>
          </div>
        `:''}
        <div class="ck-manual-row" style="grid-template-columns:1fr auto">
          <input type="text" id="manLbl" placeholder="Nombre de ${esc(lvl)}">
          <button type="button" class="btn sm primary" id="btnAddManual">+ Agregar</button>
        </div>
        ${manual.length?`<div style="display:flex;flex-direction:column;gap:4px;max-height:150px;overflow-y:auto;margin-top:4px">
          ${manual.map((m,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;background:var(--surface);padding:4px 8px;border-radius:6px;font-size:12px;border:1px solid var(--line)">
            <span><b>${esc(m.label)}</b> <span class="muted">${esc([m.estado,m.municipio,m.parroquia].filter(Boolean).join(' › '))}</span></span>
            <button type="button" class="ck-icon-btn del" data-mdel="${i}">✕</button>
          </div>`).join('')}
        </div>`:'<div class="muted" style="font-size:12px">Aún no hay elementos manuales.</div>'}
      </div>
      ${f.type==='range'?`<div class="ck-field"><label>Parámetros de rango (parameters)</label><input type="text" id="inParams" value="${esc(f.parameters||'start=1;end=10;step=1')}" placeholder="start=1;end=10;step=1"></div>`:''}
    `:''}

    <div class="ck-field">
      <label>Filtro en cascada (choice_filter)</label>
      <input type="text" id="inChoiceFilter" value="${esc(CK_GEO.autoChoiceFilter(f,flat))}" placeholder="Automático si hay campo padre arriba">
    </div>
  `;
}

function ckTabRelevant(f){
  const flat=CK_IO.flattenTree(CK.fields).filter(x=>x.kind!=='end'&&x.id!==f.id&&x.kind!=='group'&&x.kind!=='repeat'&&x.type!=='note');
  return `
    <div class="ck-hint-box">Define cuándo debe mostrarse esta pregunta. Puedes usar el asistente o escribir la expresión XLSForm directamente.</div>
    <div class="ck-cond-card">
      <strong style="font-size:12px">Asistente rápido de condición</strong>
      <select id="relQ">
        <option value="">— Elige una pregunta previa —</option>
        ${flat.map(x=>`<option value="${esc(x.name)}">${esc(x.label||x.name)} (\${${esc(x.name)}})</option>`).join('')}
      </select>
      <select id="relOp">
        <option value="=">Es igual a (=)</option>
        <option value="!=">Es diferente a (!=)</option>
        <option value="selected">Incluye opción (select_multiple)</option>
        <option value=">">Mayor que (&gt;)</option>
        <option value="<">Menor que (&lt;)</option>
        <option value="answered">Está respondida</option>
      </select>
      <div id="relValWrap"><input type="text" id="relVal" placeholder="Valor (ej: si)"></div>
      <div style="display:flex;gap:6px">
        <button type="button" class="btn sm primary" id="btnRelSet">Aplicar condición</button>
        <button type="button" class="btn sm" id="btnRelAnd">+ Agregar con Y (and)</button>
        <button type="button" class="btn sm" id="btnRelOr">+ Agregar con O (or)</button>
      </div>
    </div>
    <div class="ck-field">
      <label>Expresión XLSForm (relevant) <button type="button" class="btn sm" id="btnRelClr" style="padding:2px 6px;font-size:11px">Limpiar</button></label>
      <textarea id="inRelevant" placeholder="Ej: \${consentimiento} = 'si'">${esc(f.relevant||'')}</textarea>
    </div>
  `;
}

function ckTabConstraint(f){
  const isNum=f.type==='integer'||f.type==='decimal';
  const isDate=f.type==='date'||f.type==='datetime';
  return `
    <div class="ck-cond-card">
      <strong style="font-size:12px">Regla rápida</strong>
      ${isNum?`
        <div class="ck-row2">
          <input type="number" id="cMin" placeholder="Mínimo (ej: 0)">
          <input type="number" id="cMax" placeholder="Máximo (ej: 120)">
        </div>
        <button type="button" class="btn sm primary" id="btnApplyNumCons">Aplicar rango numérico</button>
      `:isDate?`
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn sm" data-dcons=". <= today()">No mayor a hoy</button>
          <button type="button" class="btn sm" data-dcons=". >= today()">Desde hoy en adelante</button>
        </div>
      `:`
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn sm" data-tcons="regex(., '^[0-9]+$')" data-tmsg="Solo se permiten dígitos numéricos.">Solo números</button>
          <button type="button" class="btn sm" data-tcons="regex(., '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')" data-tmsg="Ingresa un correo electrónico válido.">Correo válido</button>
          <button type="button" class="btn sm" data-tcons="string-length(.) >= 3">Mínimo 3 caracteres</button>
        </div>
      `}
    </div>
    <div class="ck-field">
      <label>Expresión de restricción (constraint)</label>
      <textarea id="inCons" placeholder="Ej: . >= 0 and . <= 120">${esc(f.constraint||'')}</textarea>
    </div>
    <div class="ck-field">
      <label>Mensaje de error si no cumple (constraint_message)</label>
      <input type="text" id="inConsMsg" value="${esc(f.constraintMsg||'')}" placeholder="Ej: La edad debe estar entre 0 y 120 años.">
    </div>
  `;
}

function ckTabCalc(f){
  return `
    <div class="ck-hint-box">Usa <code>\${variable}</code> para referenciar otras preguntas. Ej: <code>\${adultos} + \${ninos}</code>.</div>
    <div class="ck-field">
      <label>Fórmula (calculation)</label>
      <textarea id="inCalc" placeholder="Ej: int((today() - \${fecha_nacimiento}) div 365.25)">${esc(f.calculation||'')}</textarea>
    </div>
  `;
}

function ckBindInspector(box, f){
  const syncCanvas=()=>ckRenderCanvas();
  const on=(sel,ev,fn)=>{ const el=box.querySelector(sel); if(el) el.addEventListener(ev,fn); };

  on('#inLabel','input',(e)=>{ f.label=e.target.value; syncCanvas(); });
  on('#inName','input',(e)=>{ f.name=e.target.value; syncCanvas(); });
  on('#btnAutoName','click',()=>{ f.name=ckUniqueName(f.label); const inp=box.querySelector('#inName'); if(inp) inp.value=f.name; syncCanvas(); });
  on('#inHint','input',(e)=>{ f.hint=e.target.value; });
  on('#inReq','change',(e)=>{ f.required=e.target.checked; ckRenderInspector(); syncCanvas(); });
  on('#inReqMsg','input',(e)=>{ f.requiredMsg=e.target.value; });
  on('#inRO','change',(e)=>{ f.readOnly=e.target.checked; });
  on('#inOrOther','change',(e)=>{ f.orOther=e.target.checked; });
  on('#inAppSel','change',(e)=>{ f.appearance=e.target.value; });
  on('#inParams','input',(e)=>{ f.parameters=e.target.value; });
  on('#inDef','input',(e)=>{ f.default=e.target.value; });
  on('#inRepCnt','input',(e)=>{ f.repeatCount=e.target.value; });

  /* Opciones */
  on('#inListName','input',(e)=>{ f.listName=snake(e.target.value); });
  box.querySelectorAll('.ck-opt-row').forEach(row=>{
    const i=+row.dataset.oi;
    row.querySelector('.opt-code').oninput=(e)=>{ f.options[i].code=e.target.value; };
    row.querySelector('.opt-lbl').oninput=(e)=>{
      f.options[i].label=e.target.value;
      if(!f.options[i].code||f.options[i].code.startsWith('opcion_')) f.options[i].code=snake(e.target.value);
    };
    row.querySelector('.opt-del').onclick=()=>{ f.options.splice(i,1); ckRenderInspector(); };
  });
  on('#btnAddOpt','click',()=>{
    const n=(f.options||[]).length+1;
    f.options=f.options||[];
    f.options.push({code:`opcion_${n}`,label:`Opción ${n}`});
    ckRenderInspector();
  });
  on('#btnBulkOpt','click',()=>{ const b=box.querySelector('#ckBulkBox'); if(b) b.hidden=!b.hidden; });
  on('#btnApplyBulk','click',()=>{
    const txt=box.querySelector('#inBulkText')?.value||'';
    const lines=txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(!lines.length) return;
    f.options=f.options||[];
    lines.forEach(l=>f.options.push({code:snake(l),label:l}));
    ckRenderInspector();
  });

  /* Geografía */
  on('#inGeoMode','change',(e)=>{ f.geo.mode=e.target.value; ckRenderInspector(); syncCanvas(); });
  on('#btnDlGeoCsv','click',()=>{
    const n=CK_GEO.downloadComunidadesCsv(f);
    toast(`Descargado ${f.geo.csvFile||'comunidades.csv'} (${fmt(n)} comunidades). Súbelo en Kobo → Configuración → Media.`);
  });
  on('#btnGeoAll','click',()=>{ f.geo.estadosFilter=[]; ckRenderInspector(); });
  on('#btnGeoNone','click',()=>{ f.geo.estadosFilter=['Distrito Capital']; ckRenderInspector(); });
  box.querySelectorAll('[data-est]').forEach(btn=>{
    btn.onclick=()=>{
      const est=btn.dataset.est;
      const arr=f.geo.estadosFilter||[];
      const i=arr.indexOf(est);
      if(i>=0) arr.splice(i,1); else arr.push(est);
      f.geo.estadosFilter=arr;
      ckRenderInspector();
    };
  });

  /* Datalists para ingreso manual de municipio/parroquia */
  const fillManLists=()=>{
    const est=box.querySelector('#manEst')?.value||'';
    const dlMun=box.querySelector('#dlManMun');
    if(dlMun&&est) dlMun.innerHTML=CK_GEO.getMunicipios(est).map(m=>`<option value="${esc(m)}">`).join('');
    const mun=box.querySelector('#manMun')?.value||'';
    const dlPar=box.querySelector('#dlManPar');
    if(dlPar&&est&&mun) dlPar.innerHTML=CK_GEO.getParroquias(est,mun).map(p=>`<option value="${esc(p)}">`).join('');
  };
  fillManLists();
  on('#manEst','change',fillManLists);
  on('#manMun','input',fillManLists);

  on('#btnAddManual','click',()=>{
    const lbl=(box.querySelector('#manLbl')?.value||'').trim();
    if(!lbl){ toast('Escribe el nombre antes de agregar.'); return; }
    const est=box.querySelector('#manEst')?.value||'';
    const mun=(box.querySelector('#manMun')?.value||'').trim();
    const par=(box.querySelector('#manPar')?.value||'').trim();
    const lvl=f.geo.level;
    if(lvl==='parroquia'&&!mun){ toast('Debes especificar a qué Municipio pertenece esta parroquia.'); return; }
    if(lvl==='comunidad'&&(!mun||!par)){ toast('Debes especificar a qué Municipio y Parroquia pertenece esta comunidad.'); return; }
    f.geo.manual=f.geo.manual||[];
    f.geo.manual.push({code:snake(lbl),label:lbl,estado:est,municipio:mun,parroquia:par});
    ckRenderInspector();
  });
  box.querySelectorAll('[data-mdel]').forEach(b=>{
    b.onclick=()=>{ f.geo.manual.splice(+b.dataset.mdel,1); ckRenderInspector(); };
  });
  on('#inChoiceFilter','input',(e)=>{ f.choiceFilter=e.target.value; f.choiceFilterManual=true; });

  /* Dependencias (relevant) */
  const relQ=box.querySelector('#relQ');
  const relValWrap=box.querySelector('#relValWrap');
  if(relQ&&relValWrap){
    relQ.onchange=()=>{
      const target=CK_IO.flattenTree(CK.fields).find(x=>x.name===relQ.value);
      if(target&&(target.type==='select_one'||target.type==='select_multiple')&&(target.options||[]).length){
        relValWrap.innerHTML=`<select id="relVal">${target.options.map(o=>`<option value="${esc(o.code)}">${esc(o.label)} (${esc(o.code)})</option>`).join('')}</select>`;
      } else {
        relValWrap.innerHTML=`<input type="text" id="relVal" placeholder="Valor (ej: si)">`;
      }
    };
  }
  const buildRelExpr=()=>{
    const q=box.querySelector('#relQ')?.value;
    const op=box.querySelector('#relOp')?.value;
    const v=box.querySelector('#relVal')?.value??'';
    if(!q){ toast('Elige primero una pregunta.'); return null; }
    if(op==='answered') return `\${${q}} != ''`;
    if(op==='selected') return `selected(\${${q}}, '${v}')`;
    const isNum=/^-?\d+(\.\d+)?$/.test(String(v).trim());
    const valLit=isNum?v:`'${v}'`;
    return `\${${q}} ${op} ${valLit}`;
  };
  on('#btnRelSet','click',()=>{ const ex=buildRelExpr(); if(!ex) return; f.relevant=ex; ckRenderInspector(); syncCanvas(); });
  on('#btnRelAnd','click',()=>{ const ex=buildRelExpr(); if(!ex) return; f.relevant=f.relevant?`(${f.relevant}) and (${ex})`:ex; ckRenderInspector(); syncCanvas(); });
  on('#btnRelOr','click',()=>{ const ex=buildRelExpr(); if(!ex) return; f.relevant=f.relevant?`(${f.relevant}) or (${ex})`:ex; ckRenderInspector(); syncCanvas(); });
  on('#btnRelClr','click',()=>{ f.relevant=''; ckRenderInspector(); syncCanvas(); });
  on('#inRelevant','input',(e)=>{ f.relevant=e.target.value; syncCanvas(); });

  /* Restricciones */
  on('#btnApplyNumCons','click',()=>{
    const mn=box.querySelector('#cMin')?.value, mx=box.querySelector('#cMax')?.value;
    const parts=[];
    if(mn!=='') parts.push(`. >= ${mn}`);
    if(mx!=='') parts.push(`. <= ${mx}`);
    if(!parts.length){ toast('Ingresa al menos un mínimo o un máximo.'); return; }
    f.constraint=parts.join(' and ');
    if(!f.constraintMsg&&mn!==''&&mx!=='') f.constraintMsg=`El valor debe estar entre ${mn} y ${mx}.`;
    ckRenderInspector(); syncCanvas();
  });
  box.querySelectorAll('[data-dcons]').forEach(b=>b.onclick=()=>{ f.constraint=b.dataset.dcons; ckRenderInspector(); syncCanvas(); });
  box.querySelectorAll('[data-tcons]').forEach(b=>b.onclick=()=>{ f.constraint=b.dataset.tcons; if(b.dataset.tmsg&&!f.constraintMsg) f.constraintMsg=b.dataset.tmsg; ckRenderInspector(); syncCanvas(); });
  on('#inCons','input',(e)=>{ f.constraint=e.target.value; syncCanvas(); });
  on('#inConsMsg','input',(e)=>{ f.constraintMsg=e.target.value; });

  /* Cálculo */
  on('#inCalc','input',(e)=>{ f.calculation=e.target.value; syncCanvas(); });
}

/* Diálogo de Vista previa y Validación */
function ckOpenPreview(startTab='val'){
  const dlg=$('#ckDlg'), tabsEl=$('#ckDlgTabs'), bodyEl=$('#ckDlgBody'), titleEl=$('#ckDlgTitle');
  if(!dlg) return;
  dlg.classList.remove('sm');
  titleEl.textContent='Vista previa y validación XLSForm';
  let active=startTab;
  const val=CK_IO.validateForm(CK);
  const {surveyCols,surveyRows,choiceCols,choiceRows,settingsCols,settingsRows}=CK_IO.buildXlsTables(CK);

  const renderDlg=()=>{
    const tList=[
      {id:'val',lbl:`Validación (${val.errors.length} err · ${val.warnings.length} av)`},
      {id:'survey',lbl:`survey (${surveyRows.length})`},
      {id:'choices',lbl:`choices (${choiceRows.length})`},
      {id:'settings',lbl:'settings'}
    ];
    tabsEl.innerHTML=tList.map(t=>`<button type="button" class="ck-tab${active===t.id?' on':''}" data-dtab="${t.id}">${esc(t.lbl)}</button>`).join('');
    tabsEl.querySelectorAll('[data-dtab]').forEach(b=>b.onclick=()=>{ active=b.dataset.dtab; renderDlg(); });

    if(active==='val'){
      const items=[...val.errors,...val.warnings];
      bodyEl.innerHTML=items.length
        ?items.map(it=>`<div class="ck-val-item ${it.severity}" data-jump="${esc(it.fieldId)}">
            <b>${it.severity==='err'?'Error':'Aviso'}</b>
            <div><div>${esc(it.msg)}</div><small class="muted">Haz clic para ir al campo</small></div>
          </div>`).join('')
        :`<div class="ck-hint-box" style="background:var(--ok-soft);color:var(--ok);border-color:var(--ok)">¡Todo correcto! El formulario no tiene errores y está listo para descargar y subir a KoboToolbox.</div>`;
      bodyEl.querySelectorAll('[data-jump]').forEach(el=>el.onclick=()=>{
        CK.selectedId=el.dataset.jump;
        dlg.close();
        ckRender();
      });
    } else {
      const cols=active==='survey'?surveyCols:(active==='choices'?choiceCols:settingsCols);
      const rows=active==='survey'?surveyRows:(active==='choices'?choiceRows:settingsRows);
      const slice=rows.slice(0,150);
      bodyEl.innerHTML=(rows.length>150?`<p class="muted" style="margin-top:0">Mostrando las primeras 150 de ${rows.length} filas.</p>`:'')+
        `<table class="ck-tbl"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${slice.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
  };
  renderDlg();
  dlg.showModal();
}

function ckRender(){
  ckRenderPalette();
  ckRenderCanvas();
  ckRenderInspector();
}

function bindCreacionKobo(){
  ckRender();
  $('#ckFormTitle').oninput=(e)=>{ CK.formTitle=e.target.value; };
  $('#ckFormId').oninput=(e)=>{ CK.formId=snake(e.target.value); };
  $('#ckStyle').onchange=(e)=>{ CK.formStyle=e.target.value; };
  $('#ckLang').onchange=(e)=>{ CK.langSuffix=e.target.value; };
  $('#ckSearch').oninput=(e)=>{ CK.search=e.target.value; ckRenderCanvas(); };
  $('#ckBtnPrev').onclick=()=>ckOpenPreview('val');
  $('#ckDlgClose').onclick=()=>$('#ckDlg').close();
  $('#ckBtnReset').onclick=async()=>{
    if(CK.fields.length||CK.formTitle!=='Nuevo formulario Kobo'){
      const ok=await confirmBox('¿Empezar desde cero?','Se descartarán todas las preguntas, grupos y configuraciones actuales del formulario y volverás a la pantalla inicial.','Sí, empezar desde cero');
      if(!ok) return;
    }
    ckResetBlank();
    ckRender();
    toast('Formulario reiniciado desde cero.');
  };

  document.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>ckApplyTemplate(b.dataset.tpl));

  $('#ckFileIn').onchange=async(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    busy(true);
    try{
      const parsed=await CK_IO.importXlsx(file);
      CK.formTitle=parsed.formTitle;
      CK.formId=parsed.formId;
      CK.formStyle=parsed.formStyle!==undefined?parsed.formStyle:'theme-grid';
      CK.langSuffix=parsed.langSuffix;
      CK.metaFields=parsed.metaFields||[];
      CK.fields=parsed.fields;
      CK.selectedId=CK.fields[0]?.id||null;
      CK.tab='general';
      $('#ckFormTitle').value=CK.formTitle;
      $('#ckFormId').value=CK.formId;
      $('#ckStyle').value=CK.formStyle;
      $('#ckLang').value=CK.langSuffix;
      ckRender();
      toast(`XLSForm "${file.name}" cargado correctamente.`);
    } catch(err){
      toast(err.message||'No se pudo leer el archivo XLSForm.');
    } finally{
      busy(false);
      e.target.value='';
    }
  };

  $('#ckBtnExport').onclick=async()=>{
    const val=CK_IO.validateForm(CK);
    if(val.errors.length){
      ckOpenPreview('val');
      toast(`Hay ${val.errors.length} error(es) por revisar antes de exportar.`);
      return;
    }
    busy(true);
    try{
      await CK_IO.exportXlsx(CK);
      const csvFields=CK_IO.flattenTree(CK.fields).filter(f=>f.geo?.mode==='csv');
      if(csvFields.length){
        csvFields.forEach(cf=>CK_GEO.downloadComunidadesCsv(cf));
        toast('XLSForm y comunidades.csv descargados. Sube el CSV en Kobo → Configuración → Media.');
      } else {
        toast('XLSForm descargado listo para KoboToolbox.');
      }
    } catch(err){
      toast('Error al generar el archivo Excel.');
    } finally{
      busy(false);
    }
  };
}
