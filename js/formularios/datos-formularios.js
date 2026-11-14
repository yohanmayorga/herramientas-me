/* Herramientas M&E · Datos del Repositorio de formularios (KoboToolbox).
   Para agregar o editar un formulario de Kobo, modifica solo esta lista.
   Campos de cada formulario:
   - proyecto:   Nombre corto del proyecto ('JAPÓN', 'ECHO', 'GERP', 'DHR' o '' si es general/sin proyecto)
   - area:       Área temática ('SMAPS', 'Protección', 'Varias', 'NFIs', 'Salud', 'CCCM' o '' si no especifica)
   - formulario: Nombre visible del formulario
   - tipo:       'Regular' o 'Emergencia'
   - url:        Enlace de recolección en KoboToolbox (https://ee.kobo.iom.int/x/...) */

const FORMULARIOS=[
  {
    proyecto:'JAPÓN',
    area:'SMAPS',
    formulario:'Reporte de actividades SMAPS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/ihQbcATG'
  },
  {
    proyecto:'JAPÓN',
    area:'Protección',
    formulario:'Formulario de Orientación Legal',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/FdikvMtL'
  },
  {
    proyecto:'ECHO',
    area:'Varias',
    formulario:'Registro de Asistencia en CAT-PAM-EAS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/DpylznVZ'
  },
  {
    proyecto:'JAPÓN',
    area:'Varias',
    formulario:'Formulario Capacitaciones en Medios de Vida - HIAS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/CbdD51ws'
  },
  {
    proyecto:'JAPÓN',
    area:'Protección',
    formulario:'Ventanilla Informativa',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/7G6Lcwyk'
  },
  {
    proyecto:'',
    area:'SMAPS',
    formulario:'Pre-Test y Post-Test',
    tipo:'Emergencia',
    url:'https://ee.kobo.iom.int/x/rJ29Z2h5'
  },
  {
    proyecto:'GERP',
    area:'',
    formulario:'Encuesta de satisfacción',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/LQulkGAv'
  },
  {
    proyecto:'GERP',
    area:'SMAPS',
    formulario:'Salud Mental',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/Z9mlbSX7'
  },
  {
    proyecto:'GERP',
    area:'NFIs',
    formulario:'VDTM entrega de NFIS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/iayXZSUS'
  },
  {
    proyecto:'',
    area:'Varias',
    formulario:'Encuesta de Satisfacción a Beneficiarios',
    tipo:'Emergencia',
    url:'https://ee.kobo.iom.int/x/acQ8UMYT'
  },
  {
    proyecto:'ECHO',
    area:'Protección',
    formulario:'Orientación Legal',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/ruY6f8jQ'
  },
  {
    proyecto:'JAPÓN',
    area:'Varias',
    formulario:'Registro de asistencia en CAT y EAS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/W4eDKQcF'
  },
  {
    proyecto:'ECHO',
    area:'Varias',
    formulario:'Conteo de Flujos',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/BZ1si09e'
  },
  {
    proyecto:'DHR',
    area:'Salud',
    formulario:'Jornadas de Salud',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/7BS4yTxF'
  },
  {
    proyecto:'ECHO',
    area:'SMAPS',
    formulario:'PAP+',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/zjXaacmD'
  },
  {
    proyecto:'DHR',
    area:'Varias',
    formulario:'Encuesta de satisfacción',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/vdY3NgVI'
  },
  {
    proyecto:'',
    area:'CCCM',
    formulario:'Capacitaciones CCCM',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/GMAmwX7q'
  },
  {
    proyecto:'DHR',
    area:'SMAPS',
    formulario:'Salud Mental',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/Bs0XSt1D'
  },
  {
    proyecto:'DHR',
    area:'SMAPS',
    formulario:'PSS',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/8Is9RD2l'
  },
  {
    proyecto:'DHR',
    area:'Protección',
    formulario:'Orientación legal',
    tipo:'Regular',
    url:'https://ee.kobo.iom.int/x/sHrfInfS'
  }
];
