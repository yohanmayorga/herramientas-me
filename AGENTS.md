# Reglas Permanentes del Agente (AGENTS.md)

Este documento define las reglas obligatorias y permanentes que cualquier agente debe seguir **en cada conversación y en cada iteración** dentro de este proyecto (**Herramientas M&E · OIM Venezuela**).

---

## 1. Enlace directo al servidor de prueba (`http://127.0.0.1:5500`)

Cada vez que modifiques código de la aplicación (`index.html`, `css/**`, `js/**`):

1. **No inicies, reinicies ni mates ningún servidor en la terminal**: El usuario mantiene encendido su servidor local manualmente en `http://127.0.0.1:5500`. No ejecutes comandos para iniciar, reiniciar, verificar ni detener servidores.
2. **Incluye siempre los enlaces directos al final de tu respuesta**: Cierra **siempre** tu respuesta con los enlaces directos usando `http://127.0.0.1:5500/#/...` hacia las secciones modificadas para que el usuario pueda recargar y probar:
   - **Inicio / Portada (y panel de Novedades)**: `http://127.0.0.1:5500/#/inicio`
   - **Proyectos**: `http://127.0.0.1:5500/#/proyectos`
   - **Repositorio de tableros**: `http://127.0.0.1:5500/#/tableros`
   - **Depurador IMS**: `http://127.0.0.1:5500/#/depurador-ims` (o `#/depurador-ims/unico`, `#/depurador-ims/multiple`, `#/depurador-ims/guia`)
   - **Enlaces de API**: `http://127.0.0.1:5500/#/apis`

---

## 2. Registro automático en «Novedades»

Cada vez que realices un cambio, mejora o nueva funcionalidad en el proyecto, debes **registrar automáticamente una nueva entrada resumida** en la sección de **Novedades**.

### Ubicación exacta de los archivos
- **Archivo de datos (donde se agregan las entradas)**: `js/inicio.js` (constante `NOVEDADES`).
- **Renderizado**: `js/plataforma/navegacion.js`, en la función `viewSideNews()` (líneas 37–40), que se muestra en la portada (`#/inicio`) dentro del contenedor `<aside class="side-news" id="sideNews" aria-label="Novedades">` de `index.html` (línea 56).
- **Estilos**: `css/plataforma.css` (clases `.side-news` y `.p-news`).

### Estructura y formato de `NOVEDADES` en `js/inicio.js`
`NOVEDADES` es un arreglo de pares `[fecha, descripcion]`, ordenado del **más reciente al más antiguo** (las nuevas entradas se insertan siempre al principio del arreglo, en el índice `0`):

```javascript
/* Herramientas M&E · Novedades de la portada y arranque de la aplicación.
   Agrega cada mejora nueva al inicio de NOVEDADES (la más reciente primero). */
const NOVEDADES=[
  ['Mes Año','Nombre del módulo o sección: resumen claro y conciso de las mejoras o cambios realizados.'],
  // ... entradas anteriores
];
```

### Cómo se renderiza en el DOM (`viewSideNews`)
```javascript
function viewSideNews(){
  return `<div class="side-h">Novedades</div>
    <ol class="p-news">${NOVEDADES.map(([f,t])=>`<li><span>${esc(f)}</span>${esc(t)}</li>`).join('')}</ol>`;
}
```

### Convenciones al agregar una entrada
1. **Posición**: Inserta siempre la nueva tupla en la **primera posición** de `NOVEDADES` en `js/inicio.js`.
2. **Fecha (`f`)**: Usa el formato `'Mes Año'` en español con la primera letra en mayúscula (por ejemplo, `'Noviembre 2026'`).
3. **Texto (`t`)**: Comienza con el nombre de la sección o herramienta afectada seguido de dos puntos (por ejemplo, `'Proyectos: ...'`, `'Repositorio de tableros: ...'`, `'Depurador IMS: ...'`) y resume en una sola oración clara qué se agregó o mejoró.
