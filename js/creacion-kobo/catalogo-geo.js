/* Herramientas M&E · Creación de Kobo: Catálogo geográfico (INE en memoria + Manual + Híbrido) */
const CK_GEO=(()=>{
  let _idx=null;

  function titleCase(s){
    return String(s||'').replace(/\b\w+/g,w=>{
      const lw=w.toLowerCase();
      if(['de','del','la','las','el','los','y','e','en'].includes(lw)) return lw;
      return lw.charAt(0).toUpperCase()+lw.slice(1);
    }).replace(/^./,c=>c.toUpperCase());
  }

  function buildIndex(){
    if(_idx) return _idx;
    const emp=(typeof GEO_INE_EMP!=='undefined'&&Array.isArray(GEO_INE_EMP))?GEO_INE_EMP:[];
    const com=(typeof GEO_INE_COM!=='undefined'&&GEO_INE_COM)?GEO_INE_COM:{};
    const estadosSet=new Set();
    const munByEst=new Map();
    const parByEstMun=new Map();
    const empParts=emp.map(line=>line.split('|'));
    empParts.forEach(([est,mun,par])=>{
      if(!est) return;
      estadosSet.add(est);
      if(mun){
        if(!munByEst.has(est)) munByEst.set(est,new Set());
        munByEst.get(est).add(mun);
        const key=`${est}|${mun}`;
        if(par){
          if(!parByEstMun.has(key)) parByEstMun.set(key,new Set());
          parByEstMun.get(key).add(par);
        }
      }
    });
    const comByIdx=new Map();
    Object.entries(com).forEach(([nombre,idx])=>{
      if(!comByIdx.has(idx)) comByIdx.set(idx,[]);
      comByIdx.get(idx).push(titleCase(nombre));
    });
    comByIdx.forEach(arr=>arr.sort((a,b)=>a.localeCompare(b,'es')));
    _idx={
      estados:[...estadosSet].sort((a,b)=>a.localeCompare(b,'es')),
      munByEst,
      parByEstMun,
      empParts,
      comByIdx
    };
    return _idx;
  }

  function getEstados(){ return buildIndex().estados; }

  function getMunicipios(estado){
    const s=buildIndex().munByEst.get(estado);
    return s?[...s].sort((a,b)=>a.localeCompare(b,'es')):[];
  }

  function getParroquias(estado,municipio){
    const s=buildIndex().parByEstMun.get(`${estado}|${municipio}`);
    return s?[...s].sort((a,b)=>a.localeCompare(b,'es')):[];
  }

  function getComunidades(estado,municipio,parroquia){
    const idx=buildIndex();
    const target=`${estado}|${municipio}|${parroquia}`;
    const empIdx=(typeof GEO_INE_EMP!=='undefined')?GEO_INE_EMP.indexOf(target):-1;
    if(empIdx<0) return [];
    return idx.comByIdx.get(empIdx)||[];
  }

  /* Genera filas de choices para un campo geográfico (o cascada) según su configuración:
     geoCfg = { level:'estado'|'municipio'|'parroquia'|'comunidad', mode:'ine'|'manual'|'hibrido',
                estadosFilter:[...], manual:[{name,label,estado,municipio,parroquia}],
                parentField:{estado,municipio,parroquia} } */
  function buildGeoChoices(field, allFields){
    const g=field.geo||{};
    const level=g.level||'estado';
    const mode=g.mode||'ine';
    const listName=field.listName||`lista_${field.name}`;
    const estFilter=Array.isArray(g.estadosFilter)&&g.estadosFilter.length?new Set(g.estadosFilter):null;
    const rows=[];
    const usedCodes=new Set();

    const makeCode=(label,prefix='')=>{
      let base=snake(label);
      if(!usedCodes.has(base)){ usedCodes.add(base); return base; }
      let c=prefix?`${snake(prefix)}_${base}`:`${base}_2`;
      let n=2;
      while(usedCodes.has(c)){ c=`${base}_${n++}`; }
      usedCodes.add(c);
      return c;
    };

    const idx=buildIndex();

    if(mode==='ine'||mode==='hibrido'){
      if(level==='estado'){
        idx.estados.filter(e=>!estFilter||estFilter.has(e)).forEach(est=>{
          rows.push({list_name:listName,name:makeCode(est),label:est});
        });
      } else if(level==='municipio'){
        idx.estados.filter(e=>!estFilter||estFilter.has(e)).forEach(est=>{
          getMunicipios(est).forEach(mun=>{
            rows.push({list_name:listName,name:makeCode(mun,est),label:mun,state:snake(est)});
          });
        });
      } else if(level==='parroquia'){
        idx.estados.filter(e=>!estFilter||estFilter.has(e)).forEach(est=>{
          getMunicipios(est).forEach(mun=>{
            getParroquias(est,mun).forEach(par=>{
              rows.push({list_name:listName,name:makeCode(par,mun),label:par,state:snake(est),municipality:snake(mun)});
            });
          });
        });
      } else if(level==='comunidad'){
        idx.empParts.forEach(([est,mun,par],empIdx)=>{
          if(estFilter&&!estFilter.has(est)) return;
          const coms=idx.comByIdx.get(empIdx);
          if(!coms||!coms.length) return;
          coms.forEach(com=>{
            rows.push({list_name:listName,name:makeCode(com,par),label:com,state:snake(est),municipality:snake(mun),parish:snake(par)});
          });
        });
      }
    }

    if(mode==='manual'||mode==='hibrido'){
      const manual=Array.isArray(g.manual)?g.manual:[];
      manual.forEach(item=>{
        const lbl=String(item.label||'').trim();
        if(!lbl) return;
        const row={list_name:listName,name:item.code?snake(item.code):makeCode(lbl,item.parroquia||item.municipio||item.estado),label:lbl};
        if(level==='municipio'&&item.estado) row.state=snake(item.estado);
        if(level==='parroquia'){
          if(item.estado) row.state=snake(item.estado);
          if(item.municipio) row.municipality=snake(item.municipio);
        }
        if(level==='comunidad'){
          if(item.estado) row.state=snake(item.estado);
          if(item.municipio) row.municipality=snake(item.municipio);
          if(item.parroquia) row.parish=snake(item.parroquia);
        }
        rows.push(row);
      });
    }

    return rows;
  }

  /* Calcula el choice_filter automático si hay un campo padre arriba en el formulario */
  function autoChoiceFilter(field, allFields){
    const g=field.geo;
    if(!g) return field.choiceFilter||'';
    if(field.choiceFilterManual) return field.choiceFilter||'';
    const level=g.level;
    const findParent=(lvl)=>{
      const pName=g.parentField?.[lvl];
      if(pName&&allFields.some(f=>f.name===pName)) return pName;
      const idx=allFields.findIndex(f=>f.id===field.id);
      for(let i=idx-1;i>=0;i--){
        if(allFields[i].geo?.level===lvl) return allFields[i].name;
      }
      return '';
    };
    if(level==='municipio'){
      const est=findParent('estado');
      return est?`state=\${${est}}`:'';
    }
    if(level==='parroquia'){
      const mun=findParent('municipio');
      const est=findParent('estado');
      const parts=[];
      if(est) parts.push(`state=\${${est}}`);
      if(mun) parts.push(`municipality=\${${mun}}`);
      return parts.join(' and ');
    }
    if(level==='comunidad'){
      const par=findParent('parroquia');
      const mun=findParent('municipio');
      const est=findParent('estado');
      const parts=[];
      if(est) parts.push(`state=\${${est}}`);
      if(mun) parts.push(`municipality=\${${mun}}`);
      if(par) parts.push(`parish=\${${par}}`);
      return parts.join(' and ');
    }
    return '';
  }

  function downloadComunidadesCsv(field){
    const rows=buildGeoChoices({...field, geo:{...field.geo, mode:'ine'}}, []);
    const manual=(field.geo?.manual||[]).map(m=>({
      name:m.code||snake(m.label),
      label:m.label,
      state:snake(m.estado||''),
      municipality:snake(m.municipio||''),
      parish:snake(m.parroquia||'')
    }));
    const all=[...rows,...manual];
    const csvEsc=v=>{
      const s=String(v??'');
      return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
    };
    const lines=['name,label,state,municipality,parish'];
    all.forEach(r=>{
      lines.push([r.name,r.label,r.state||'',r.municipality||'',r.parish||''].map(csvEsc).join(','));
    });
    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=field.geo?.csvFile||'comunidades.csv';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    return all.length;
  }

  return {
    getEstados,
    getMunicipios,
    getParroquias,
    getComunidades,
    buildGeoChoices,
    autoChoiceFilter,
    downloadComunidadesCsv
  };
})();
