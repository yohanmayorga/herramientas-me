/* Herramientas M&E · Escritor XLSX ligero con estilos */
/* Escritor XLSX ligero con estilos (para archivos grandes): genera el XML directamente y lo comprime con el ZIP de SheetJS */
const XW_STYLES=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="9"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FF8A1C24"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF8A3B00"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF0033A0"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF5A4A00"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0F2E12"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF3A2400"/><name val="Calibri"/></font></fonts>
<fills count="10"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${['FFF8D3D7','FFFFF2B8','FFFFE0B2','FF0033A0','FFBFE5C2','FFF4A23C','FFC62828','FFF1F3F6'].map(c=>`<fill><patternFill patternType="solid"><fgColor rgb="${c}"/><bgColor indexed="64"/></patternFill></fill>`).join('')}</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="18">${[[0,0,0,0],[1,5,0,1],[2,2,0,0],[2,2,164,0],[0,3,0,0],[0,3,164,0],[0,0,164,0],[2,2,0,1],[0,3,0,1],[3,4,0,1],[0,0,0,1],[7,6,0,1],[8,7,0,1],[1,8,0,1],[6,3,0,1],[4,0,0,0],[5,0,0,0],[0,9,0,0]]
  .map(([f,fi,n,w])=>`<xf numFmtId="${n}" fontId="${f}" fillId="${fi}" borderId="0" xfId="0"${f?' applyFont="1"':''}${fi?' applyFill="1"':''}${n?' applyNumberFormat="1"':''}${w?' applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>':'/>'}`).join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
/* Estilos: 0 normal · 1 encabezado · 2 rojo · 3 rojo fecha · 4 amarillo · 5 amarillo fecha · 6 fecha · 7 texto rojo · 8 texto amarillo · 9 pendiente naranja · 10 texto · 11 verde · 12 ámbar · 13 rojo fuerte · 14 corregir · 15 negrita · 16 título · 17 gris */
const xwEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
function xwSheet(sh){ // sh: {cols:[ancho], rows:[[[valor,estilo]]], freeze:{x,y}, filter:n}
  const out=[], nc=Math.max(1,...sh.rows.map(r=>r.length)), last=XLSX.utils.encode_col(nc-1);
  out.push(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`);
  if(sh.freeze){ const {x=0,y=0}=sh.freeze; out.push(`<sheetViews><sheetView workbookViewId="0"><pane${x?` xSplit="${x}"`:''}${y?` ySplit="${y}"`:''} topLeftCell="${XLSX.utils.encode_col(x)}${y+1}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>`); }
  if(sh.cols) out.push(`<cols>${sh.cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`);
  out.push('<sheetData>');
  sh.rows.forEach((r,ri)=>{ const cells=[]; r.forEach((c,ci)=>{ if(!c) return; const [v,s]=c; if((v==null||v==='')&&!s) return; const ref=XLSX.utils.encode_col(ci)+(ri+1), st=s?` s="${s}"`:'';
      if(v==null||v==='') cells.push(`<c r="${ref}"${st}/>`); else if(typeof v==='number'&&isFinite(v)) cells.push(`<c r="${ref}"${st}><v>${v}</v></c>`); else cells.push(`<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${xwEsc(v)}</t></is></c>`); });
    out.push(`<row r="${ri+1}"${sh.hidden&&sh.hidden.has(ri+1)?' hidden="1"':''}>${cells.join('')}</row>`); });
  out.push('</sheetData>');
  if(sh.filter) out.push(`<autoFilter ref="A${sh.filterRow||1}:${last}${sh.rows.length}"/>`);
  out.push('</worksheet>'); return out;
}
/* ZIP mínimo con compresión nativa del navegador (CompressionStream); respaldo: ZIP de SheetJS */
const CRC_T=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(b){ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=CRC_T[(c^b[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
async function deflateRaw(b){ const cs=new CompressionStream('deflate-raw'); return new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(cs)).arrayBuffer()); }
function concatU8(chunks){ const len=chunks.reduce((t,c)=>t+c.length,0), out=new Uint8Array(len); let o=0; chunks.forEach(c=>{ out.set(c,o); o+=c.length; }); return out; }
async function zipParts(parts){ // parts: [{name, data:Uint8Array}] (se genera de a uno para ahorrar memoria)
  const enc=new TextEncoder(), out=[], cd=[]; let off=0;
  const u16=v=>[v&255,(v>>>8)&255], u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  for(const p of parts){ const data=typeof p.data==='function'?p.data():p.data, name=enc.encode(p.name), crc=crc32(data), comp=await deflateRaw(data);
    const head=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(8),...u16(0),...u16(0x21),...u32(crc),...u32(comp.length),...u32(data.length),...u16(name.length),...u16(0)]);
    out.push(head,name,comp);
    cd.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(8),...u16(0),...u16(0x21),...u32(crc),...u32(comp.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),name);
    off+=head.length+name.length+comp.length; }
  const cdSize=cd.reduce((t,c)=>t+c.length,0);
  out.push(...cd,new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(parts.length),...u16(parts.length),...u32(cdSize),...u32(off),...u16(0)]));
  return new Blob(out,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function xwBook(sheets){
  const enc=new TextEncoder(), S2=s=>enc.encode(s);
  const meta=[
    ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xwEsc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets>${sheets.some(s=>s.filter)?`<definedNames>${sheets.map((s,i)=>s.filter?`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xwEsc(s.name)}'!$A$${s.filterRow||1}:$${XLSX.utils.encode_col(Math.max(1,...s.rows.map(r=>r.length))-1)}$${s.rows.length}</definedName>`:'').join('')}</definedNames>`:''}</workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',XW_STYLES]].map(([n,x])=>({name:n,data:S2(x)}));
  const sheetParts=sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:()=>concatU8(xwSheet(s).map(S2))}));
  if(typeof CompressionStream!=='undefined'){ try{ new CompressionStream('deflate-raw'); return await zipParts([...meta,...sheetParts]); }catch(e){ console.warn('CompressionStream deflate-raw no disponible',e); } }
  const cfb=XLSX.CFB.utils.cfb_new(); [...meta,...sheetParts].forEach(p=>XLSX.CFB.utils.cfb_add(cfb,p.name,typeof p.data==='function'?p.data():p.data));
  return new Blob([XLSX.CFB.write(cfb,{type:'array',fileType:'zip',compression:true})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
