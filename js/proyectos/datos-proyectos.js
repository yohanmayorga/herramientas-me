/* Herramientas M&E · Datos de la sección Proyectos.
   Para agregar o editar un proyecto, modifica solo esta lista.
   Fechas en formato AAAA-MM-DD. `carpeta` y `matriz` aceptan:
   - una ruta dentro de "M&E NUEVA/Proyectos New" con el prefijo 'ruta:' (se completa el enlace de SharePoint), o
   - un enlace completo (https://...), o
   - null si no existe. */
const SP_BASE='https://iomint.sharepoint.com/teams/MEOIMVenezuela';
const SP_DOC=id=>`${SP_BASE}/_layouts/15/Doc.aspx?sourcedoc=%7B${id.split('|')[0]}%7D&file=${id.split('|')[1]}&action=default&mobileredirect=true&wdwpf=doclib-c`.replace(SP_BASE,'https://iomint.sharepoint.com/:x:/r/teams/MEOIMVenezuela');
const SP_DIR=ruta=>`${SP_BASE}/Documentos%20compartidos/Forms/AllItems.aspx?id=%2Fteams%2FMEOIMVenezuela%2FDocumentos%20compartidos%2FM%26E%2FM%26E%20NUEVA%2FProyectos%20New%2F${ruta}&viewid=c035bdcb%2D4350%2D46fb%2Db817%2Dc4ff056cdb24&newTargetListUrl=%2Fteams%2FMEOIMVenezuela%2FDocumentos%20compartidos&viewpath=%2Fteams%2FMEOIMVenezuela%2FDocumentos%20compartidos%2FForms%2FAllItems%2Easpx`;
const PRIMA=(region,id)=>`https://primaforall.iom.int/sites/${region}/${id}/Pages/Home.aspx`;

const PROYECTOS=[
  {nombre:'DHR Emergencia', tipo:'Emergencia', codigo:'DP5771', inicio:'2026-07-02', fin:'2027-02-28', monto:17000000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0584'), matriz:SP_DOC('8568C330-ED7E-45D4-A14D-9887CCFFD61C|MatrizMonitoreoDHR.xlsx'), carpeta:SP_DIR('10%2E%20DP5771%5FDHR%20%28Emergencia%29')},
  {nombre:'ECHO ALERT', tipo:'Emergencia', codigo:'DP2842', inicio:'2026-08-07', fin:'2027-01-15', monto:120000, moneda:'EUR',
   prima:PRIMA('SouthAmerica','VE10P0542'), matriz:SP_DOC('BEFF4DED-1FEB-472F-85B6-10975C3B6691|DP2842_MMR_ECHO.xlsx'), carpeta:SP_DIR('11%2E%20DP2842%5FECHO%20Alert%20%28Emergencia%29')},
  {nombre:'CERF', tipo:'Emergencia', codigo:'SN0341', inicio:'2026-07-25', fin:'2027-01-24', monto:2000000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0591'), matriz:SP_DOC('A574915B-BD5A-4337-BEB3-384D58F552A4|MMR%20CERF.xlsx'), carpeta:SP_DIR('12%2E%20SN0341%5FEQ%20CERF%20%28Emergencia%29')},
  {nombre:'JAPÓN', tipo:'Emergencia', codigo:'DP5778', inicio:'2026-07-10', fin:'2027-01-09', monto:1000000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0586'), matriz:SP_DOC('7BBD1431-9BB6-4D4F-AF59-454E51EB3F1A|MatrizMonitoreo%20Japon%20Emergencia.xlsx'), carpeta:SP_DIR('13%2E%20DP5778%5FJap%C3%B3n%20%28Emergencia%29')},
  {nombre:'Multidonor - Zurich', tipo:'Emergencia', codigo:'DP5789', inicio:'2026-07-01', fin:'2027-06-30', monto:225538.72, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0585'), matriz:SP_DOC('5FC3A946-A497-4401-B0AF-155A0B18B194|MMR%20Zurich.xlsx'), carpeta:SP_DIR('14%2E%20DP5789%5FMulti%2DDonor%20%28Emergencia%29')},
  {nombre:'USA FOR OIM', tipo:'Emergencia', codigo:'DS0261', inicio:'2026-10-01', fin:'2027-03-31', monto:45000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0594'), matriz:SP_DIR('17%2E%20DS0261%5FUSAforIOM%2F2%2E%20MMR'), carpeta:SP_DIR('17%2E%20DS0261%5FUSAforIOM')},
  {nombre:'ECHO', tipo:'Regular', codigo:'DP2842', inicio:'2024-04-01', fin:'2027-05-31', monto:5700000, moneda:'EUR',
   prima:PRIMA('SouthAmerica','VE10P0542'), matriz:SP_DOC('69556B2C-45A5-4E64-9686-B4A19201069E|DP2842_MatrizMonitoreoECHO%20Copiar.xlsx'), carpeta:SP_DIR('01%20DP2842%5FECHO')},
  {nombre:'DHR', tipo:'Regular', codigo:'MP0727', inicio:'2026-02-13', fin:'2026-12-31', monto:3000000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0567'), matriz:null, carpeta:SP_DIR('04%2E%20MP0727%5FDHR%20%28No%20emergencia%29')},
  {nombre:'WHA', tipo:'Regular', codigo:'MP0629', inicio:'2024-04-22', fin:'2026-09-30', monto:11000000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0540'), matriz:null, carpeta:SP_DIR('02%2E%20MP0629%5FWHA%20%28No%20emergencia%29')},
  {nombre:'GERP', tipo:'Regular', codigo:'DP5689', inicio:'2026-01-01', fin:'2026-12-31', monto:3250000, moneda:'USD',
   prima:PRIMA('Europe','CH10P1593'), matriz:SP_DOC('9AD3FF59-A2F5-4C49-AEEB-FF9168C43FFE|MMR%20GERP%20DP5869.xlsx'), carpeta:SP_DIR('03%2E%20DP5689%5FGERP%20%28No%20emergencia%29')},
  {nombre:'JAPÓN', tipo:'Regular', codigo:'PX0722', inicio:'2026-03-31', fin:'2027-03-30', monto:1333333, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0563'), matriz:SP_DOC('B27133A6-F862-408F-8BB7-4F2FAB2DAEA5|MMR%20Japon%20PX0722.xlsx'), carpeta:SP_DIR('05%2E%20PX0722%5FJap%C3%B3n%20%28No%20emergencia%29')},
  {nombre:'AVR', tipo:'Regular', codigo:'RR0524', inicio:'2025-03-14', fin:'2027-03-31', monto:1104755, moneda:'USD',
   prima:PRIMA('NorthAmerica','US10P0557'), matriz:null, carpeta:SP_DIR('07%2E%20AVR%20%28No%20emergencia%29')},
  {nombre:'AECID', tipo:'Regular', codigo:'PX0748', inicio:'2026-02-01', fin:'2028-11-30', monto:312000, moneda:'EUR', // en la tabla original: 31/11/2028 (fecha inexistente)
   prima:PRIMA('NorthAmerica','PA99P0520'), matriz:SP_DOC('FAD31A46-D054-4B4B-A815-95E82EE0D27B|MMR%20AECID_Panam%C3%A1%20PX0748.xlsx'), carpeta:SP_DIR('18%2E%20PX0748%20AECID%5FPanam%C3%A1')},
  {nombre:'Países Bajos', tipo:'Regular', codigo:'PX0756', inicio:'2026-06-01', fin:'2028-06-30', monto:2900000, moneda:'EUR', // en la tabla original: 31/6/2028 (fecha inexistente)
   prima:PRIMA('SouthAmerica','VE10P0568'), matriz:SP_DIR('8%2E%20VE10P0568%20Pa%C3%ADses%20Bajos%2F2%2E%20MMR'), carpeta:SP_DIR('8%2E%20VE10P0568%20Pa%C3%ADses%20Bajos')},
  {nombre:'OCHA', tipo:'Regular', codigo:'DP5827', inicio:'2026-09-29', fin:'2027-09-28', monto:8000000, moneda:'USD',
   prima:PRIMA('SouthAmerica','VE10P0598'), matriz:SP_DIR('20%2E%20OCHA'), carpeta:SP_DIR('20%2E%20OCHA')}
];
