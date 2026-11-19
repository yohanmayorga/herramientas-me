/* Herramientas M&E · Datos de Enlaces de API (KoboToolbox).
   Para agregar o editar una fuente de datos, modifica solo esta lista.
   Campos de cada entrada:
   - proyecto:   Nombre corto del proyecto ('JAPÓN', 'ECHO', 'GERP', 'DHR', 'PRM', 'EMERGENCIA' o '' si es general)
   - formulario: Nombre visible del formulario
   - csv:        URL de exportación CSV en KoboToolbox ('' si aún no tiene API)
   - xlsx:       URL de exportación XLSX en KoboToolbox ('' si aún no tiene API) */

const APIS=[
  {
    proyecto:'JAPÓN',
    formulario:'Formulario Capacitaciones en Medios de Vida - HIAS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/a9Rp2CJGQK2BEhAvPYn4Ms/export-settings/esjmynGsqizKgdcDBoojJtm/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/a9Rp2CJGQK2BEhAvPYn4Ms/export-settings/esjmynGsqizKgdcDBoojJtm/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    formulario:'Formulario de Orientación Legal',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aAWnwT932etnxySWnKYVLz/export-settings/esJ3hRnBBxF8JBhLbUti4p5/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aAWnwT932etnxySWnKYVLz/export-settings/esJ3hRnBBxF8JBhLbUti4p5/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    formulario:'Reporte de actividades SMAPS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aA3rh9gtWDziQ5Tnpc8giD/export-settings/esjWeuEQjmvrxRWbh6n4hHP/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aA3rh9gtWDziQ5Tnpc8giD/export-settings/esjWeuEQjmvrxRWbh6n4hHP/data.xlsx'
  },
  {
    proyecto:'EMERGENCIA',
    formulario:'Encuesta de Satisfacción a Beneficiarios',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aNfbwDrSVuggE4qy4SVc4s/export-settings/eskBMY2NC2ahbZaeVUG2JXw/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aNfbwDrSVuggE4qy4SVc4s/export-settings/eskBMY2NC2ahbZaeVUG2JXw/data.xlsx'
  },
  {
    proyecto:'ECHO',
    formulario:'Registro de Asistencia en CAT-PAM-EAS V4',
    csv:'https://kf.kobo.iom.int/api/v2/assets/amVZURJTA8NkXYPW4CbeNu/export-settings/esDdhTdWixV3rshoJasUePu/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/amVZURJTA8NkXYPW4CbeNu/export-settings/esDdhTdWixV3rshoJasUePu/data.xlsx'
  },
  {
    proyecto:'',
    formulario:'Encuesta para medidas de protección de salud en emergencias',
    csv:'',
    xlsx:''
  },
  {
    proyecto:'JAPÓN',
    formulario:'Ventanilla Informativa – Registro de atenciones y actividades',
    csv:'https://kf.kobo.iom.int/api/v2/assets/acbxiZq5FJYyerheephxUH/export-settings/esn7DmZkWAEto4VxyB6rwtp/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/acbxiZq5FJYyerheephxUH/export-settings/esn7DmZkWAEto4VxyB6rwtp/data.xlsx'
  },
  {
    proyecto:'GERP',
    formulario:'Encuesta de satisfacción',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aLo9vrWZUjkgpCskyvQy8r/export-settings/esFUsjkmgsmtEPWxXBvRiYz/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aLo9vrWZUjkgpCskyvQy8r/export-settings/esFUsjkmgsmtEPWxXBvRiYz/data.xlsx'
  },
  {
    proyecto:'GERP',
    formulario:'Kobo Salud Mental 2026',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aLRLhk3hz2kdWxg5b4nhyA/export-settings/esGZoZXENxJphgvRmcwnp3u/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aLRLhk3hz2kdWxg5b4nhyA/export-settings/esGZoZXENxJphgvRmcwnp3u/data.xlsx'
  },
  {
    proyecto:'GERP',
    formulario:'Kobo Salud 2026',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aHooRWRr2QcuDNPuCdCQoA/export-settings/esTZKn8647VyvBZuLFXRAaj/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aHooRWRr2QcuDNPuCdCQoA/export-settings/esTZKn8647VyvBZuLFXRAaj/data.xlsx'
  },
  {
    proyecto:'GERP',
    formulario:'Kobo PSS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aDtP9rwpeiduHhH3isgJYc/export-settings/esNGT2s3t3KJL4m664ua2Gv/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aDtP9rwpeiduHhH3isgJYc/export-settings/esNGT2s3t3KJL4m664ua2Gv/data.xlsx'
  },
  {
    proyecto:'GERP',
    formulario:'VDTM entrega de NFIS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aejYKXSzPfgXaHdobKuqLV/export-settings/es8nQGTvncmEHmtjbzyFceX/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aejYKXSzPfgXaHdobKuqLV/export-settings/es8nQGTvncmEHmtjbzyFceX/data.xlsx'
  },
  {
    proyecto:'ECHO',
    formulario:'Formulario de Orientación Legal',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aD2K5J27dbNijpsfrviYaN/export-settings/eswPPfb8YYdzRKtJyWENiRk/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aD2K5J27dbNijpsfrviYaN/export-settings/eswPPfb8YYdzRKtJyWENiRk/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    formulario:'Registro de asistencia en CAT y EAS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/asKqAW4E5Lm6CWWKfB96tS/export-settings/eshpcHn7iw8C96nXRDbD2Fe/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/asKqAW4E5Lm6CWWKfB96tS/export-settings/eshpcHn7iw8C96nXRDbD2Fe/data.xlsx'
  },
  {
    proyecto:'',
    formulario:'Formulario Kobo de Conteo de Flujos',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aSLLYRUqsfmxJ2Q3wfP9no/export-settings/esHS9XxQzvFWGW8nGZb4Rsu/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aSLLYRUqsfmxJ2Q3wfP9no/export-settings/esHS9XxQzvFWGW8nGZb4Rsu/data.xlsx'
  },
  {
    proyecto:'DHR',
    formulario:'KOBO Jornadas de Salud 2026',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aH6h2qXW7eKei5VKYZyYKy/export-settings/es3s8yj8CQhCaYPxQB7B9QV/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aH6h2qXW7eKei5VKYZyYKy/export-settings/es3s8yj8CQhCaYPxQB7B9QV/data.xlsx'
  },
  {
    proyecto:'ECHO',
    formulario:'Kobo Salud 2026',
    csv:'https://kf.kobo.iom.int/api/v2/assets/akmgDSoUBkygdWjdXEXCAc/export-settings/esdkFgK5gSyHMynmFeCc3PK/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/akmgDSoUBkygdWjdXEXCAc/export-settings/esdkFgK5gSyHMynmFeCc3PK/data.xlsx'
  },
  {
    proyecto:'ECHO',
    formulario:'Kobo PAP+ 2026',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aabAqyoQwEuLNhbwdRx2Qc/export-settings/esHhWFxBTBWcp2G2DMSDy7f/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aabAqyoQwEuLNhbwdRx2Qc/export-settings/esHhWFxBTBWcp2G2DMSDy7f/data.xlsx'
  },
  {
    proyecto:'PRM',
    formulario:'Encuesta de satisfacción 2026',
    csv:'',
    xlsx:''
  },
  {
    proyecto:'',
    formulario:'Sistematización Capacitaciones CCCM',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aKE6WxbNfa6XJDD3kfLvBU/export-settings/ess5dvaRgCY4ZfAEu68BEf5/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aKE6WxbNfa6XJDD3kfLvBU/export-settings/ess5dvaRgCY4ZfAEu68BEf5/data.xlsx'
  }
];
