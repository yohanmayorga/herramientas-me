/* Herramientas M&E · Novedades de la portada y arranque de la aplicación.
   Agrega cada mejora nueva al inicio de NOVEDADES (la más reciente primero). */
const NOVEDADES=[
  ['Noviembre 2026','Reportes · Matriz de monitoreo: imputación jerárquica de Estado, Municipio, Parroquia y Comunidad según mismo socio y fecha más cercana (sombreado en amarillo pastel al rellenar y rojo pastel si queda vacío).'],
  ['Noviembre 2026','Depurador IMS: nueva exportación «Matriz de monitoreo» para entregas de kits NFI, con fecha en la primera columna, selección de Proyecto (ECHO ALERT, DHR Emergencia u Otro) y Tipo (NFI o WASH) por kit, omisión de socios marcados como errados, desagregación geográfica, separación de recurrentes (SI/NO) y cruce por edad, sexo y condiciones específicas.'],
  ['Noviembre 2026','Depurador IMS: optimización de la pestaña «Atenciones» del SITREP (agregación diaria y bloques contiguos sin COUNTIFS acumulativos) para que el Excel abra de forma instantánea con más de 100 000 registros.'],
  ['Noviembre 2026','Depurador IMS: incorporación en el Excel del SITREP de la pestaña consolidada «Kits» (NFI y WASH) y de un cuadro de kits entregados en la pestaña principal con filtros dinámicos por tipo de kit y rango de fechas.'],
  ['Noviembre 2026','Repositorio de tableros: incorporación del tablero DHR - General, nueva columna de tipo de actualización (Automática o Manual) y ajuste de la columna de frecuencia manteniendo las acciones de abrir y copiar.'],
  ['Noviembre 2026','Repositorio de tableros: eliminación de las tarjetas de resumen en la parte superior para mostrar directamente el listado o las tarjetas de tableros.'],
  ['Noviembre 2026','Repositorio de formularios: incorporación de los formularios regulares del proyecto DHR para Salud Mental (SMAPS), PSS (SMAPS) y Orientación legal (Protección).'],
  ['Noviembre 2026','Repositorio de formularios: nueva sección en el bloque de Herramientas con el catálogo de formularios de KoboToolbox clasificados por proyecto, área temática y tipo (regular o emergencia), con filtros laterales, vista limpia sin tarjetas de resumen superior ni columna de enlace crudo, y botones para abrir o copiar cada formulario.'],
  ['Noviembre 2026','Depurador IMS: rediseño de la página de inicio al estilo del resto de la plataforma, con acceso directo al IMS (ims.iom.int) junto al botón «Guía de uso», tarjetas de modo a ancho completo y listado de formularios configurados.'],
  ['Noviembre 2026','Repositorio de tableros: incorporación de los tableros generales de Seguimiento de la emergencia (DHR), Gran Misión Vuelta a la Patria, Retorno Voluntario Asistido y Reintegración (AVR), Encuesta de satisfacción a beneficiarios y JAPÓN - General.'],
  ['Noviembre 2026','Repositorio de tableros: eliminación de la columna de descripción en la tabla y de los botones de vista previa.'],
  ['Noviembre 2026','Proyectos y Repositorio de tableros: filtros ubicados en el panel lateral derecho en versión web (al estilo de Novedades), panel deslizable oculto por defecto bajo el botón «Filtros» en pantallas pequeñas y teléfonos, y menú lateral izquierdo oculto por defecto en teléfonos en orientación horizontal.'],
  ['Noviembre 2026','Repositorio de tableros: nueva sección con el catálogo de tableros de Power BI del proyecto ECHO (general y por socio implementador), con filtros por proyecto, tipo, alcance, estado y frecuencia de actualización, vista en tarjetas o lista, y vista previa integrada.'],
  ['Noviembre 2026','Proyectos: cambio automático de vista Lista a Tarjetas cuando el ancho de pantalla requeriría desplazamiento lateral (manteniendo siempre el selector manual de vista), columna de Días restantes junto a Plazo transcurrido, estado unificado «Vigente» y sombreado gris en proyectos finalizados (excluidos de las tarjetas de resumen activo).'],
  ['Noviembre 2026','Nueva sección Proyectos: plazo, presupuesto, avance y enlaces de cada proyecto, con filtros.'],
  ['Noviembre 2026','Nueva portada de Herramientas M&E con menú lateral para reunir todas las herramientas del área.'],
  ['Noviembre 2026','Depurador IMS: limpieza avanzada del Registro de Familias, con duplicados entre familias, nivel de severidad y filas alineadas con el archivo del IMS.'],
  ['Noviembre 2026','Depurador IMS: mapa de Venezuela en los informes y el tablero, y exportación del SITREP.']
];

navInit();
