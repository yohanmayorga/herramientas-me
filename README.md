# Herramientas M&E

Plataforma de herramientas de Monitoreo y Evaluación · OIM Venezuela.
Todo el procesamiento ocurre en el navegador: los archivos cargados no salen del equipo.

## Módulos
| Módulo | Estado | Carpeta |
|---|---|---|
| Depurador IMS | En uso | `js/depurador-ims/` |
| Repositorio de tableros | Planificado | — |
| Enlaces de API | Planificado | — |

## Estructura
```
index.html                 Estructura de la página y orden de carga de los scripts
css/estilos.css            Estilos (tema claro y oscuro, diseño responsive)
js/comun/                  Piezas reutilizables por cualquier módulo
  utilidades.js            Funciones generales (DOM, formato, fechas, descarga de archivos)
  selector-fechas.js       Calendario de selección de fechas
  mapa.js                  Mapa coroplético de Venezuela (SVG y PDF)
  datos/venezuela-estados.js  Geometría simplificada de los estados
  xlsx-escritor.js         Generador de Excel con estilos para archivos grandes
  tema.js                  Modo claro / oscuro
js/depurador-ims/          Módulo Depurador IMS
  estado.js, interfaz.js, eventos.js, lectura.js ...   Núcleo del módulo
  formularios/             Un archivo por familia de formularios del IMS
  multiple.js, tablero.js, sitrep.js, limpieza-registro*.js
js/inicio.js               Arranque (debe ser el último script)
```

## Reglas de mantenimiento
1. **El orden de los `<script>` en `index.html` importa**: cada archivo puede usar lo definido en los anteriores. `js/inicio.js` siempre va al final.
2. Para probar en local, abrir la carpeta con un servidor sencillo (por ejemplo, la extensión *Live Server* de VS Code). Abrir `index.html` con doble clic también funciona.
