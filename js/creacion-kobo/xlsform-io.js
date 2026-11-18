/* Herramientas M&E · Creación de Kobo: Importación, Validación y Exportación XLSForm (.xlsx) */
const CK_IO=(()=>{
  let _uid=1;
  const uid=()=>'f_'+(Date.now().toString(36))+'_'+(_uid++);

  function flattenTree(nodes, out=[]){
    (nodes||[]).forEach(n=>{
      if(n.kind==='group'||n.kind==='repeat'){
        out.push({...n, _rowType: n.kind==='repeat'?'begin_repeat':'begin_group'});
        flattenTree(n.children||[], out);
        out.push({id:n.id+'_end', kind:'end', _rowType: n.kind==='repeat'?'end_repeat':'end_group', name:n.name});
      } else {
        out.push(n);
      }
    });
    return out;
  }

  function findById(nodes, id){
    for(const n of nodes||[]){
      if(n.id===id) return n;
      if(n.children){ const f=findById(n.children,id); if(f) return f; }
    }
    return null;
  }

  function isTruthyReq(v){
    const s=String(v??'').trim().toLowerCase();
    return s==='yes'||s==='true'||s==='1'||s==='sí'||s==='si';
  }

  function pickCol(row, bases){
    const keys=Object.keys(row||{});
    for(const b of bases){
      const exact=keys.find(k=>k.toLowerCase()===b.toLowerCase());
      if(exact) return row[exact];
      const pref=keys.find(k=>k.toLowerCase().startsWith(b.toLowerCase()+'::'));
      if(pref) return row[pref];
    }
    return '';
  }

  function detectLangSuffix(rows){
    for(const r of rows||[]){
      for(const k of Object.keys(r)){
        const m=k.match(/^label::(.+)$/i);
        if(m) return m[1].trim();
      }
    }
    return '';
  }

  async function importXlsx(file){
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    const sheetByName=(name)=>{
      const found=wb.SheetNames.find(s=>s.toLowerCase().trim()===name);
      return found?XLSX.utils.sheet_to_json(wb.Sheets[found],{defval:''}):[];
    };
    const surveyRows=sheetByName('survey');
    if(!surveyRows.length) throw new Error('El archivo no contiene una hoja "survey" con preguntas.');
    const choiceRows=sheetByName('choices');
    const settingRows=sheetByName('settings');

    const langSuffix=detectLangSuffix(surveyRows);
    const settingsObj=settingRows[0]||{};
    const formTitle=String(settingsObj.form_title||file.name.replace(/\.xlsx?$/i,'')).trim();
    const formId=snake(settingsObj.form_id||formTitle||'formulario_kobo');
    const formStyle=String(settingsObj.style||'theme-grid').trim();

    /* Agrupar choices por list_name */
    const choicesByList=new Map();
    choiceRows.forEach(r=>{
      const ln=String(r.list_name||r['list name']||'').trim();
      if(!ln) return;
      if(!choicesByList.has(ln)) choicesByList.set(ln,[]);
      const lbl=pickCol(r,['label'])||'';
      const name=String(r.name||'').trim();
      const extra={};
      Object.keys(r).forEach(k=>{
        const kl=k.toLowerCase();
        if(!['list_name','list name','name'].includes(kl)&&!kl.startsWith('label')) extra[k]=r[k];
      });
      choicesByList.get(ln).push({code:name, label:String(lbl), extra});
    });

    /* Reconstruir árbol */
    const root=[];
    const metaFields=[];
    const stack=[root];
    const META_TYPES=new Set(['start','end','today','deviceid','username','phonenumber','audit','simserial','subscriberid','start-geopoint']);

    surveyRows.forEach(r=>{
      const rawType=String(r.type||'').trim();
      if(!rawType) return;
      const normType=rawType.toLowerCase().replace(/\s+/g,'_');
      const name=String(r.name||'').trim();
      const label=String(pickCol(r,['label'])||'').trim();
      const hint=String(pickCol(r,['hint'])||'').trim();
      const required=isTruthyReq(r.required);
      const requiredMsg=String(pickCol(r,['required_message'])||'').trim();
      const relevant=String(r.relevant||'').trim();
      const constraint=String(r.constraint||'').trim();
      const constraintMsg=String(pickCol(r,['constraint_message'])||'').trim();
      const appearance=String(r.appearance||'').trim();
      const parameters=String(r.parameters||'').trim();
      const defVal=String(r.default||'').trim();
      const readOnly=isTruthyReq(r.read_only);
      const calculation=String(r.calculation||'').trim();
      const choiceFilter=String(r.choice_filter||'').trim();
      const repeatCount=String(r.repeat_count||'').trim();

      if(META_TYPES.has(normType)||META_TYPES.has(rawType.toLowerCase())){
        metaFields.push({id:uid(),kind:'meta',type:rawType.toLowerCase(),name:name||rawType.toLowerCase()});
        return;
      }

      if(normType==='begin_group'||normType==='begin_repeat'){
        const grp={
          id:uid(),
          kind:normType==='begin_repeat'?'repeat':'group',
          type:normType,
          name:name||snake(label||'grupo'),
          label:label||name||'Grupo',
          hint,
          appearance,
          relevant,
          repeatCount,
          collapsed:false,
          children:[]
        };
        stack[stack.length-1].push(grp);
        stack.push(grp.children);
        return;
      }
      if(normType==='end_group'||normType==='end_repeat'){
        if(stack.length>1) stack.pop();
        return;
      }

      const csvMatch=rawType.match(/^select_one_from_file\s+([^\s]+)$/i);
      if(csvMatch){
        const csvFile=csvMatch[1].trim();
        const node={
          id:uid(),
          kind:'geo',
          type:'select_one',
          name:name||snake(label||'comunidad'),
          label:label||name||'Comunidad',
          hint, required, requiredMsg, relevant, constraint, constraintMsg,
          appearance, parameters, default:defVal, readOnly, calculation,
          choiceFilter, choiceFilterManual:Boolean(choiceFilter),
          listName:'', orOther:false, options:[],
          geo:{level:'comunidad',mode:'csv',csvFile,estadosFilter:[],manual:[],parentField:{}}
        };
        stack[stack.length-1].push(node);
        return;
      }

      const selMatch=rawType.match(/^(select_one|select_multiple)\s+([^\s]+)(\s+or_other)?$/i);
      const baseType=selMatch?selMatch[1].toLowerCase():(META_TYPES.has(normType)?normType:normType);
      const listName=selMatch?selMatch[2].trim():'';
      const orOther=Boolean(selMatch&&selMatch[3]);
      const rawOpts=listName?(choicesByList.get(listName)||[]):[];

      /* Detectar si es un campo geográfico importado con columnas state/municipality/parish */
      let geo=null;
      const cfLow=choiceFilter.toLowerCase();
      const hasGeoCols=rawOpts.some(o=>o.extra&&(o.extra.state||o.extra.municipality||o.extra.parish));
      if(selMatch&&selMatch[1].toLowerCase()==='select_one'&&(hasGeoCols||/^(estados?|municipios?|parroquias?|comunidades?)$/i.test(listName))){
        let level='estado';
        if(/parish=/i.test(cfLow)||/comunidad/i.test(listName)||/comunidad/i.test(name)) level='comunidad';
        else if(/municipality=/i.test(cfLow)||/parroquia/i.test(listName)||/parroquia/i.test(name)) level='parroquia';
        else if(/state=/i.test(cfLow)||/municipio/i.test(listName)||/municipio/i.test(name)) level='municipio';
        geo={
          level,
          mode:'manual',
          estadosFilter:[],
          manual:rawOpts.map(o=>({
            code:o.code,
            label:o.label,
            estado:o.extra?.state||'',
            municipio:o.extra?.municipality||'',
            parroquia:o.extra?.parish||''
          }))
        };
      }

      const node={
        id:uid(),
        kind:META_TYPES.has(baseType)?'meta':(geo?'geo':'field'),
        type:baseType,
        name:name||snake(label||'campo'),
        label:label||name,
        hint,
        required,
        requiredMsg,
        relevant,
        constraint,
        constraintMsg,
        appearance,
        parameters,
        default:defVal,
        readOnly,
        calculation,
        choiceFilter,
        choiceFilterManual:Boolean(choiceFilter),
        listName,
        orOther,
        options:geo?[]:rawOpts.map(o=>({code:o.code,label:o.label})),
        geo
      };
      stack[stack.length-1].push(node);
    });

    return {
      formTitle,
      formId,
      formStyle,
      langSuffix,
      allowChoiceDuplicates:true,
      metaFields,
      fields:root
    };
  }

  function validateForm(state){
    const flat=flattenTree(state.fields).filter(f=>f.kind!=='end');
    const errors=[];
    const warnings=[];
    const names=new Map();
    const validNameRe=/^[a-zA-Z_][a-zA-Z0-9_-]*$/;

    flat.forEach(f=>{
      const nm=String(f.name||'').trim();
      if(!nm){
        errors.push({fieldId:f.id,fieldName:'(sin nombre)',msg:'El campo no tiene nombre interno (name).',severity:'err'});
      } else {
        if(!validNameRe.test(nm)){
          errors.push({fieldId:f.id,fieldName:nm,msg:`El nombre "${nm}" debe iniciar con letra o "_" y no tener espacios ni tildes.`,severity:'err'});
        }
        if(names.has(nm)){
          errors.push({fieldId:f.id,fieldName:nm,msg:`El nombre de variable "${nm}" está duplicado.`,severity:'err'});
        } else {
          names.set(nm,f);
        }
      }
      if(f.kind!=='meta'&&f.type!=='calculate'&&!String(f.label||'').trim()){
        warnings.push({fieldId:f.id,fieldName:nm,msg:`"${nm}" no tiene etiqueta visible (label).`,severity:'warn'});
      }
      if((f.type==='select_one'||f.type==='select_multiple')&&!f.geo){
        if(!f.options||!f.options.length){
          errors.push({fieldId:f.id,fieldName:nm,msg:`La pregunta de selección "${f.label||nm}" no tiene opciones definidas.`,severity:'err'});
        }
      }
      if(f.geo&&(f.geo.mode==='manual'||f.geo.mode==='hibrido')){
        const lvl=f.geo.level;
        const man=f.geo.manual||[];
        if(f.geo.mode==='manual'&&!man.length){
          errors.push({fieldId:f.id,fieldName:nm,msg:`El campo geográfico manual "${f.label||nm}" no tiene elementos agregados.`,severity:'err'});
        }
        man.forEach((m,i)=>{
          if(lvl==='municipio'&&!m.estado) warnings.push({fieldId:f.id,fieldName:nm,msg:`En "${f.label||nm}", el municipio "${m.label||('#'+(i+1))}" no tiene Estado asignado.`,severity:'warn'});
          if(lvl==='parroquia'&&(!m.estado||!m.municipio)) warnings.push({fieldId:f.id,fieldName:nm,msg:`En "${f.label||nm}", la parroquia "${m.label||('#'+(i+1))}" debe especificar Estado y Municipio.`,severity:'warn'});
          if(lvl==='comunidad'&&(!m.estado||!m.municipio||!m.parroquia)) warnings.push({fieldId:f.id,fieldName:nm,msg:`En "${f.label||nm}", la comunidad "${m.label||('#'+(i+1))}" debe especificar Estado, Municipio y Parroquia.`,severity:'warn'});
        });
      }
    });

    /* Verificar referencias ${var} */
    const checkRefs=(expr, field, col)=>{
      if(!expr) return;
      const re=/\$\{([^}]+)\}/g;
      let m;
      while((m=re.exec(expr))!==null){
        const ref=m[1].trim();
        if(!names.has(ref)){
          errors.push({fieldId:field.id,fieldName:field.name,msg:`En "${field.label||field.name}" (${col}), la referencia \${${ref}} no existe en el formulario.`,severity:'err'});
        }
      }
    };
    flat.forEach(f=>{
      checkRefs(f.relevant,f,'relevant');
      checkRefs(f.constraint,f,'constraint');
      checkRefs(f.calculation,f,'calculation');
      const cf=f.geo?CK_GEO.autoChoiceFilter(f,flat):f.choiceFilter;
      checkRefs(cf,f,'choice_filter');
    });

    return {errors, warnings};
  }

  function buildXlsTables(state){
    const flatAll=flattenTree(state.fields);
    const flatNoEnd=flatAll.filter(f=>f.kind!=='end');
    const lang=String(state.langSuffix||'').trim();
    const lblCol=lang?`label::${lang}`:'label';
    const hintCol=lang?`hint::${lang}`:'hint';
    const consMsgCol=lang?`constraint_message::${lang}`:'constraint_message';
    const reqMsgCol=lang?`required_message::${lang}`:'required_message';

    const surveyRows=[];
    const choiceRows=[];
    const usedLists=new Set();

    (state.metaFields||[]).forEach(m=>{
      surveyRows.push({type:m.type, name:m.name||m.type});
    });

    flatAll.forEach(f=>{
      if(f.kind==='end'){
        surveyRows.push({type:f._rowType, name:f.name});
        return;
      }
      if(f.kind==='group'||f.kind==='repeat'){
        const row={type:f._rowType, name:f.name, [lblCol]:f.label||''};
        if(f.hint) row[hintCol]=f.hint;
        if(f.appearance) row.appearance=f.appearance;
        if(f.relevant) row.relevant=f.relevant;
        if(f.kind==='repeat'&&f.repeatCount) row.repeat_count=f.repeatCount;
        surveyRows.push(row);
        return;
      }
      let typeStr=f.type;
      let listName=f.listName||`lista_${f.name}`;
      if(f.geo?.mode==='csv'){
        typeStr=`select_one_from_file ${f.geo.csvFile||'comunidades.csv'}`;
      } else if(f.type==='select_one'||f.type==='select_multiple'){
        typeStr=`${f.type} ${listName}${f.orOther?' or_other':''}`;
      }
      const cf=f.geo?CK_GEO.autoChoiceFilter(f,flatNoEnd):(f.choiceFilter||'');
      const row={
        type:typeStr,
        name:f.name,
        [lblCol]:f.kind==='meta'?'':(f.label||''),
        [hintCol]:f.hint||'',
        required:f.required?'yes':'',
        [reqMsgCol]:f.required&&f.requiredMsg?f.requiredMsg:'',
        relevant:f.relevant||'',
        constraint:f.constraint||'',
        [consMsgCol]:f.constraint&&f.constraintMsg?f.constraintMsg:'',
        appearance:f.appearance||'',
        parameters:f.parameters||'',
        calculation:f.calculation||'',
        choice_filter:cf,
        default:f.default||'',
        read_only:f.readOnly?'yes':''
      };
      surveyRows.push(row);

      if((f.type==='select_one'||f.type==='select_multiple')&&f.geo?.mode!=='csv'&&!usedLists.has(listName)){
        usedLists.add(listName);
        if(f.geo){
          const gRows=CK_GEO.buildGeoChoices({...f,listName},flatNoEnd);
          gRows.forEach(gr=>{
            const cRow={list_name:gr.list_name,name:gr.name,[lblCol]:gr.label};
            if(gr.state) cRow.state=gr.state;
            if(gr.municipality) cRow.municipality=gr.municipality;
            if(gr.parish) cRow.parish=gr.parish;
            choiceRows.push(cRow);
          });
        } else {
          (f.options||[]).forEach(o=>{
            choiceRows.push({list_name:listName, name:o.code||snake(o.label), [lblCol]:o.label||''});
          });
        }
      }
    });

    /* Determinar columnas activas para mantener el Excel limpio */
    const coreSurveyCols=['type','name',lblCol,hintCol,'required','relevant','constraint',consMsgCol,'appearance'];
    const optSurveyCols=[reqMsgCol,'parameters','calculation','choice_filter','default','read_only','repeat_count'];
    const surveyCols=[...coreSurveyCols,...optSurveyCols.filter(c=>surveyRows.some(r=>r[c]))];

    const choiceCols=['list_name','name',lblCol];
    ['state','municipality','parish'].forEach(c=>{
      if(choiceRows.some(r=>r[c])) choiceCols.push(c);
    });

    const settingsCols=['form_title','form_id','style','allow_choice_duplicates','version'];
    const settingsRows=[{
      form_title:state.formTitle||'Formulario Kobo',
      form_id:snake(state.formId||state.formTitle||'formulario_kobo'),
      style:state.formStyle!==undefined?state.formStyle:'theme-grid',
      allow_choice_duplicates:'yes',
      version:new Date().toISOString().slice(0,10).replace(/-/g,'')+'01'
    }];

    return {surveyCols, surveyRows, choiceCols, choiceRows, settingsCols, settingsRows};
  }

  async function exportXlsx(state){
    const {surveyCols,surveyRows,choiceCols,choiceRows,settingsCols,settingsRows}=buildXlsTables(state);
    const wb=new ExcelJS.Workbook();
    wb.creator='Herramientas M&E · OIM Venezuela';
    wb.created=new Date();

    const addSheet=(name, cols, rows)=>{
      const ws=wb.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});
      ws.addRow(cols);
      const hdr=ws.getRow(1);
      hdr.height=24;
      hdr.eachCell(c=>{
        c.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
        c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0033A0'}};
        c.alignment={vertical:'middle',horizontal:'left'};
      });
      rows.forEach(r=>{
        ws.addRow(cols.map(c=>r[c]??''));
      });
      cols.forEach((c,i)=>{
        let max=c.length+4;
        rows.slice(0,120).forEach(r=>{
          const len=String(r[c]??'').length;
          if(len+3>max) max=Math.min(52,len+3);
        });
        ws.getColumn(i+1).width=Math.max(14,max);
      });
    };

    addSheet('survey',surveyCols,surveyRows);
    addSheet('choices',choiceCols,choiceRows);
    addSheet('settings',settingsCols,settingsRows);

    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${snake(state.formId||state.formTitle||'kobo_xlsform')}.xlsx`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  }

  return {
    uid,
    flattenTree,
    findById,
    importXlsx,
    validateForm,
    buildXlsTables,
    exportXlsx
  };
})();
