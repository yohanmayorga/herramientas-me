/* Herramientas M&E · Datos unificados de Formularios Kobo (recolección + enlaces API).
   Campos de cada formulario:
   - proyecto:   Nombre corto del proyecto ('JAPÓN', 'ECHO', 'GERP', 'DHR', 'PRM', 'EMERGENCIA' o '' si es general)
   - area:       Área temática ('SMAPS', 'Protección', 'Varias', 'NFIs', 'Salud', 'CCCM' o '' si no especifica)
   - formulario: Nombre visible del formulario
   - tipo:       'Regular' o 'Emergencia'
   - url:        Enlace de recolección en KoboToolbox (https://ee.kobo.iom.int/x/... o '' si no tiene)
   - csv:        URL de exportación CSV en KoboToolbox ('' si aún no tiene API)
   - xlsx:       URL de exportación XLSX en KoboToolbox ('' si aún no tiene API) */

const FORMULARIOS=[
  {
    proyecto:'JAPÓN',
    area:'SMAPS',
    formulario:'Reporte de actividades SMAPS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/ihQbcATG',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aA3rh9gtWDziQ5Tnpc8giD/export-settings/esjWeuEQjmvrxRWbh6n4hHP/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aA3rh9gtWDziQ5Tnpc8giD/export-settings/esjWeuEQjmvrxRWbh6n4hHP/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    area:'Protección',
    formulario:'Formulario de Orientación Legal',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/FdikvMtL',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aAWnwT932etnxySWnKYVLz/export-settings/esJ3hRnBBxF8JBhLbUti4p5/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aAWnwT932etnxySWnKYVLz/export-settings/esJ3hRnBBxF8JBhLbUti4p5/data.xlsx'
  },
  {
    proyecto:'ECHO',
    area:'Varias',
    formulario:'Registro de Asistencia en CAT-PAM-EAS V4',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/DpylznVZ',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aKZDcHdHpZHYcTFuU8xYha/export-settings/esLhuRat3wKCEUhLymu92F7/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aKZDcHdHpZHYcTFuU8xYha/export-settings/esLhuRat3wKCEUhLymu92F7/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    area:'Varias',
    formulario:'Formulario Capacitaciones en Medios de Vida - HIAS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/CbdD51ws',
    csv:'https://kf.kobo.iom.int/api/v2/assets/a9Rp2CJGQK2BEhAvPYn4Ms/export-settings/esjmynGsqizKgdcDBoojJtm/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/a9Rp2CJGQK2BEhAvPYn4Ms/export-settings/esjmynGsqizKgdcDBoojJtm/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    area:'Protección',
    formulario:'Ventanilla Informativa – Registro de atenciones y actividades',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/7G6Lcwyk',
    csv:'https://kf.kobo.iom.int/api/v2/assets/acbxiZq5FJYyerheephxUH/export-settings/esn7DmZkWAEto4VxyB6rwtp/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/acbxiZq5FJYyerheephxUH/export-settings/esn7DmZkWAEto4VxyB6rwtp/data.xlsx'
  },
  {
    proyecto:'',
    area:'SMAPS',
    formulario:'Pre-Test y Post-Test',
    tipo:'Emergencia',
    url:'https://ee.kobo.iom.int/x/rJ29Z2h5',
    csv:'https://kf.kobo.iom.int/api/v2/assets/acV7Tn6MJkGGXiTKRPm38c/export-settings/es2cQMNaHKvafcXB5hbpPas/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/acV7Tn6MJkGGXiTKRPm38c/export-settings/es2cQMNaHKvafcXB5hbpPas/data.xlsx'
  },
  {
    proyecto:'GERP',
    area:'',
    formulario:'Encuesta de satisfacción',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/LQulkGAv',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aLo9vrWZUjkgpCskyvQy8r/export-settings/esFUsjkmgsmtEPWxXBvRiYz/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aLo9vrWZUjkgpCskyvQy8r/export-settings/esFUsjkmgsmtEPWxXBvRiYz/data.xlsx'
  },
  {
    proyecto:'GERP',
    area:'SMAPS',
    formulario:'Salud Mental 2026',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/Z9mlbSX7',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aLRLhk3hz2kdWxg5b4nhyA/export-settings/esGZoZXENxJphgvRmcwnp3u/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aLRLhk3hz2kdWxg5b4nhyA/export-settings/esGZoZXENxJphgvRmcwnp3u/data.xlsx'
  },
  {
    proyecto:'GERP',
    area:'NFIs',
    formulario:'VDTM entrega de NFIS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/iayXZSUS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aejYKXSzPfgXaHdobKuqLV/export-settings/es8nQGTvncmEHmtjbzyFceX/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aejYKXSzPfgXaHdobKuqLV/export-settings/es8nQGTvncmEHmtjbzyFceX/data.xlsx'
  },
  {
    proyecto:'',
    area:'Varias',
    formulario:'Encuesta de Satisfacción a Beneficiarios',
    tipo:'Emergencia',
    url:'https://ee.kobo.iom.int/x/acQ8UMYT',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aNfbwDrSVuggE4qy4SVc4s/export-settings/eskBMY2NC2ahbZaeVUG2JXw/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aNfbwDrSVuggE4qy4SVc4s/export-settings/eskBMY2NC2ahbZaeVUG2JXw/data.xlsx'
  },
  {
    proyecto:'ECHO',
    area:'Protección',
    formulario:'Formulario de Orientación Legal',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/ruY6f8jQ',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aD2K5J27dbNijpsfrviYaN/export-settings/eswPPfb8YYdzRKtJyWENiRk/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aD2K5J27dbNijpsfrviYaN/export-settings/eswPPfb8YYdzRKtJyWENiRk/data.xlsx'
  },
  {
    proyecto:'JAPÓN',
    area:'Varias',
    formulario:'Registro de asistencia en CAT y EAS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/W4eDKQcF',
    csv:'https://kf.kobo.iom.int/api/v2/assets/asKqAW4E5Lm6CWWKfB96tS/export-settings/eshpcHn7iw8C96nXRDbD2Fe/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/asKqAW4E5Lm6CWWKfB96tS/export-settings/eshpcHn7iw8C96nXRDbD2Fe/data.xlsx'
  },
  {
    proyecto:'ECHO',
    area:'Varias',
    formulario:'Conteo de Flujos',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/BZ1si09e',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aSLLYRUqsfmxJ2Q3wfP9no/export-settings/esHS9XxQzvFWGW8nGZb4Rsu/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aSLLYRUqsfmxJ2Q3wfP9no/export-settings/esHS9XxQzvFWGW8nGZb4Rsu/data.xlsx'
  },
  {
    proyecto:'DHR',
    area:'Salud',
    formulario:'Jornadas de Salud 2026',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/7BS4yTxF',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aH6h2qXW7eKei5VKYZyYKy/export-settings/es3s8yj8CQhCaYPxQB7B9QV/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aH6h2qXW7eKei5VKYZyYKy/export-settings/es3s8yj8CQhCaYPxQB7B9QV/data.xlsx'
  },
  {
    proyecto:'ECHO',
    area:'SMAPS',
    formulario:'PAP+ 2026',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/zjXaacmD',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aabAqyoQwEuLNhbwdRx2Qc/export-settings/esHhWFxBTBWcp2G2DMSDy7f/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aabAqyoQwEuLNhbwdRx2Qc/export-settings/esHhWFxBTBWcp2G2DMSDy7f/data.xlsx'
  },
  {
    proyecto:'DHR',
    area:'Varias',
    formulario:'Encuesta de satisfacción',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/vdY3NgVI',
    csv:'',
    xlsx:''
  },
  {
    proyecto:'',
    area:'CCCM',
    formulario:'Sistematización Capacitaciones CCCM',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/GMAmwX7q',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aKE6WxbNfa6XJDD3kfLvBU/export-settings/ess5dvaRgCY4ZfAEu68BEf5/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aKE6WxbNfa6XJDD3kfLvBU/export-settings/ess5dvaRgCY4ZfAEu68BEf5/data.xlsx'
  },
  {
    proyecto:'DHR',
    area:'SMAPS',
    formulario:'Salud Mental',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/Bs0XSt1D',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aws3dUy8gL9XvxcNfzKbHB/export-settings/es6Z2eQfFpGWqXz7SDFtMBQ/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aws3dUy8gL9XvxcNfzKbHB/export-settings/es6Z2eQfFpGWqXz7SDFtMBQ/data.xlsx'
  },
  {
    proyecto:'DHR',
    area:'SMAPS',
    formulario:'PSS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/8Is9RD2l',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aEi8JorJHx6QahzRDes6SX/export-settings/esBaSMzfomkiDrjyz6m7PmE/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aEi8JorJHx6QahzRDes6SX/export-settings/esBaSMzfomkiDrjyz6m7PmE/data.xlsx'
  },
  {
    proyecto:'DHR',
    area:'Protección',
    formulario:'Orientación legal',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/sHrfInfS',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aRzvTMf6H3XhsVNAYu7C9k/export-settings/ese2HCUXQ4wY5hCZzH6MDHJ/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aRzvTMf6H3XhsVNAYu7C9k/export-settings/ese2HCUXQ4wY5hCZzH6MDHJ/data.xlsx'
  },
  {
    proyecto:'GERP',
    area:'Salud',
    formulario:'Kobo Salud 2026',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/Z6jIBoNg',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aHooRWRr2QcuDNPuCdCQoA/export-settings/esTZKn8647VyvBZuLFXRAaj/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aHooRWRr2QcuDNPuCdCQoA/export-settings/esTZKn8647VyvBZuLFXRAaj/data.xlsx'
  },
  {
    proyecto:'GERP',
    area:'SMAPS',
    formulario:'Kobo PSS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/KwnfQqyW',
    csv:'https://kf.kobo.iom.int/api/v2/assets/aDtP9rwpeiduHhH3isgJYc/export-settings/esNGT2s3t3KJL4m664ua2Gv/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/aDtP9rwpeiduHhH3isgJYc/export-settings/esNGT2s3t3KJL4m664ua2Gv/data.xlsx'
  },
  {
    proyecto:'ECHO',
    area:'Salud',
    formulario:'Kobo Salud 2026',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/LGmsYwTh',
    csv:'https://kf.kobo.iom.int/api/v2/assets/akmgDSoUBkygdWjdXEXCAc/export-settings/esdkFgK5gSyHMynmFeCc3PK/data.csv',
    xlsx:'https://kf.kobo.iom.int/api/v2/assets/akmgDSoUBkygdWjdXEXCAc/export-settings/esdkFgK5gSyHMynmFeCc3PK/data.xlsx'
  },
  {
    proyecto:'',
    area:'Salud',
    formulario:'Encuesta para medidas de protección de salud en emergencias',
    tipo:'Emergencia',
    url:'https://ee.kobo.iom.int/x/CgPPKDeh',
    csv:'',
    xlsx:''
  }
];
