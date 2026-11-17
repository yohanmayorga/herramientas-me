/* Herramientas M&E · Catálogo de herramientas.
   Para incorporar una herramienta nueva: agrega una entrada aquí y, cuando esté lista,
   cambia su estado a 'disponible'. `vista` y `enlazar` son las funciones que dibujan la página
   (las herramientas sin `vista` propia, como el Depurador IMS, se conectan en navegacion.js).
   `grupo` define el bloque del menú lateral donde aparece. */
const ICONOS={
  proyectos:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  inicio:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
  depurador:'<path d="M4 4h16l-6 8v6l-4 2v-8z"/>',
  tableros:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  formularios:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
  matriz:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/>',
  apis:'<path d="M9 7V3M15 7V3"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  contraer:'<path d="M15 6l-6 6 6 6"/>',
  expandir:'<path d="M9 6l6 6-6 6"/>',
  abajo:'<path d="M6 9l6 6 6-6"/>',
  candado:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  rayo:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  archivo:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  flecha:'<path d="M5 12h14M13 6l6 6-6 6"/>'
};
const icono=(n,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONOS[n]||''}</svg>`;

const HERRAMIENTAS=[
  { id:'proyectos', nombre:'Proyectos', icono:'proyectos', estado:'disponible', grupo:'Información',
    resumen:'Proyectos de la oficina con su plazo, presupuesto y avance, y enlaces a PRIMA, matrices y carpetas.',
    puntos:['Avance del plazo calculado a la fecha del día','Filtros por tipo, moneda, estado y búsqueda','Enlaces a PRIMA, matriz de monitoreo y carpeta en SharePoint'],
    vista:viewProyectos, enlazar:bindProyectos },
  { id:'tableros', nombre:'Repositorio de tableros', icono:'tableros', estado:'disponible', grupo:'Información',
    resumen:'Catálogo de los tableros de Power BI desarrollados para el seguimiento de los proyectos y socios de la organización.',
    puntos:['Filtros por proyecto, tipo, alcance (general o por socio), estado y frecuencia de actualización','Estado y frecuencia de actualización de cada tablero','Acceso directo a Power BI y copia rápida de enlace'],
    vista:viewTableros, enlazar:bindTableros },
  { id:'formularios', nombre:'Formularios Kobo', icono:'formularios', estado:'disponible', grupo:'Información',
    resumen:'Catálogo unificado de formularios en KoboToolbox: enlaces de recolección, exportación API (CSV/XLSX) y verificación de disponibilidad.',
    puntos:['Filtros por proyecto, área temática, tipo y disponibilidad de API','Acceso directo al formulario en KoboToolbox y copia rápida de enlaces CSV/XLSX','Verificación en tiempo real de descarga API'],
    vista:viewFormularios, enlazar:bindFormularios },
  { id:'depurador-ims', nombre:'Depurador IMS', icono:'depurador', estado:'disponible', grupo:'Herramientas',
    resumen:'Valida y limpia las descargas del IMS y genera reportes, Power BI, informes PDF, tablero y SITREP.',
    puntos:['Registro de Familias, atenciones, actividades comunitarias y kits','Reporte de errores y limpieza avanzada del Registro','Excel para Power BI, informe PDF, tablero interactivo y SITREP'],
    accesos:[['Archivo único','/depurador-ims/unico'],['Depurador múltiple','/depurador-ims/multiple'],['Guía de uso','/depurador-ims/guia']] },
  { id:'matriz-monitoreo', nombre:'Matriz de monitoreo', icono:'matriz', estado:'disponible', grupo:'Herramientas',
    resumen:'Genera el Excel de la Matriz de monitoreo y un resumen listo para correo a partir de descargas del IMS, KoboToolbox o Excel.',
    puntos:['Configuración por fuente de datos (IMS, Kobo y EXCEL)','En IMS (NFI): selección de Proyecto y Tipo por kit, omisión de socios errados y separación de recurrentes (SI/NO)','Resumen automático de personas por sexo/edad, periodo y registros omitidos'],
    vista:viewMatrizMonitoreo, enlazar:bindMatrizMonitoreo }
];
