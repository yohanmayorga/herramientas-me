/* Herramientas M&E · Catálogo de herramientas y novedades.
   Para incorporar una herramienta nueva: agrega una entrada aquí y, cuando esté lista,
   cambia su estado a 'disponible'. `vista` y `enlazar` son las funciones que dibujan la página
   (las herramientas sin `vista` propia, como el Depurador IMS, se conectan en navegacion.js).
   `grupo` define el bloque del menú lateral donde aparece. */
const ICONOS={
  proyectos:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  inicio:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
  depurador:'<path d="M4 4h16l-6 8v6l-4 2v-8z"/>',
  tableros:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  apis:'<path d="M9 7V3M15 7V3"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  contraer:'<path d="M15 6l-6 6 6 6"/>',
  expandir:'<path d="M9 6l6 6-6 6"/>',
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
  { id:'depurador-ims', nombre:'Depurador IMS', icono:'depurador', estado:'disponible', grupo:'Herramientas',
    resumen:'Valida y limpia las descargas del IMS y genera reportes, Power BI, informes PDF, tablero y SITREP.',
    puntos:['Registro de Familias, atenciones, actividades comunitarias y kits','Reporte de errores y limpieza avanzada del Registro','Excel para Power BI, informe PDF, tablero interactivo y SITREP'],
    accesos:[['Archivo único','#/depurador-ims/unico'],['Depurador múltiple','#/depurador-ims/multiple'],['Guía de uso','#/depurador-ims/guia']] },
  { id:'tableros', nombre:'Repositorio de tableros', icono:'tableros', estado:'desarrollo', grupo:'Herramientas',
    resumen:'Catálogo de los tableros de Power BI del área, con su enlace, propósito y fuente de datos.',
    puntos:['Búsqueda y filtros por sector, proyecto o socio','Ficha de cada tablero: fuente, frecuencia de actualización y responsable','Acceso directo al tablero publicado'] },
  { id:'apis', nombre:'Enlaces de API', icono:'apis', estado:'desarrollo', grupo:'Herramientas',
    resumen:'Directorio de conexiones a fuentes de datos (por ejemplo, KoboToolbox) para Power BI y Power Query.',
    puntos:['Enlaces de exportación por formulario y proyecto','Instrucciones de conexión desde Power BI','Sin credenciales: los tokens nunca se guardan en la herramienta'] }
];

/* Novedades: la más reciente primero */
const NOVEDADES=[
  ['Noviembre 2026','Nueva sección Proyectos: plazo, presupuesto, avance y enlaces de cada proyecto, con filtros.'],
  ['Noviembre 2026','Nueva portada de Herramientas M&E con menú lateral para reunir todas las herramientas del área.'],
  ['Noviembre 2026','Depurador IMS: limpieza avanzada del Registro de Familias, con duplicados entre familias, nivel de severidad y filas alineadas con el archivo del IMS.'],
  ['Noviembre 2026','Depurador IMS: mapa de Venezuela en los informes y el tablero, y exportación del SITREP.']
];
