/* Herramientas M&E · Datos del Repositorio de tableros.
   Para agregar o editar un tablero de Power BI, modifica solo esta lista.
   Campos de cada tablero:
   - nombre:        Título visible del tablero (ej. 'ECHO - General')
   - proyecto:      Nombre corto del proyecto (ej. 'ECHO')
   - tipo:          'Regular' o 'Emergencia'
   - alcance:       'General' (consolidado del proyecto) o 'Socio' (socio implementador)
   - socio:         Nombre del socio implementador o 'Consolidado general'
   - estado:        'Activo' o 'Finalizado'
   - actualizacion: Tipo de actualización ('Automática' o 'Manual')
   - frecuencia:    Frecuencia de actualización (ej. 'Cada 4 horas', 'Una vez al día')
   - descripcion:   Descripción breve del propósito y características del tablero
   - url:           Enlace público de visualización en Power BI */

const TABLEROS=[
  {
    nombre:'ECHO - General',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular (consolidado general). Tablero activo con actualizaciones automáticas cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiZGQ5YjA4OWMtOGRkMS00ZDhlLTk2YTQtMTRjZDhlMjlkZDI3IiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'ECHO - Cruz Roja Caracas',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'Socio',
    socio:'Cruz Roja Caracas',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular · seguimiento de Cruz Roja Caracas. Tablero activo con actualizaciones cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiMWI0MzRlZmEtODYzYy00YmNhLWE2MjYtMjcxODc0MTM4NjIzIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'ECHO - Cruz Roja Maracaibo',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'Socio',
    socio:'Cruz Roja Maracaibo',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular · seguimiento de Cruz Roja Maracaibo. Tablero activo con actualizaciones cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiNmNkYjZiMzMtZjkwZi00NGY0LTg5YzgtMmVjNjdjZGJlZTFiIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'ECHO - Cáritas Guasdualito',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'Socio',
    socio:'Cáritas Guasdualito',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular · seguimiento de Cáritas Guasdualito. Tablero activo con actualizaciones cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiYWFmOWMyOGQtN2FjYS00ZjYzLWJiNWMtZWQzNjhlMzE3NDJkIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'ECHO - Cáritas de San Cristóbal',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'Socio',
    socio:'Cáritas de San Cristóbal',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular · seguimiento de Cáritas de San Cristóbal. Tablero activo con actualizaciones cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiMTQwMTgzNTUtYjYyMC00Zjg4LWI1MjctMzQ4OWUyYmYzOWJhIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'ECHO - Fundación Proyecto Maniapure',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'Socio',
    socio:'Fundación Proyecto Maniapure',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular · seguimiento de Fundación Proyecto Maniapure. Tablero activo con actualizaciones cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiMTg1YjU4MmYtNTk0ZC00ZGJkLThhZjAtN2RjMGVmNGRkMDczIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'ECHO - ODISEF',
    proyecto:'ECHO',
    tipo:'Regular',
    alcance:'Socio',
    socio:'ODISEF',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Cada 4 horas',
    descripcion:'Proyecto ECHO regular · seguimiento de ODISEF. Tablero activo con actualizaciones cada 4 horas.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiZGQ4YmI3ODAtZGIzNS00MmU4LWE1NGItYzBiOGFmMzVhOGMwIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'Seguimiento de la emergencia',
    proyecto:'DHR',
    tipo:'Emergencia',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Tres veces al día',
    descripcion:'Proyecto DHR emergencia (consolidado general). Tablero activo con actualización automática tres veces al día.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiNDBkYTRlZjEtMTg5NS00MjZjLTk5YjMtOGY2ZjRlMzg3NWZjIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'Gran Misión Vuelta a la Patria',
    proyecto:'No Aplica',
    tipo:'Regular',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Manual',
    frecuencia:'Eventual',
    descripcion:'Tablero general regular de la Gran Misión Vuelta a la Patria. Tablero activo con actualización manual eventual.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiN2Q4ZWZjOGQtNWUzOC00OWU2LTkxYWItYjdlNzVhYThmMzgxIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'Retorno Voluntario Asistido y Reintegración',
    proyecto:'AVR',
    tipo:'Regular',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Manual',
    frecuencia:'Semanal',
    descripcion:'Proyecto AVR regular (consolidado general). Tablero activo con actualización manual semanal.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiNzg2OGJjMjYtMTFmZi00NmMwLWFkZjktZWJmYmI0YjE0OTk3IiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'Encuesta de satisfacción a beneficiarios',
    proyecto:'No Aplica',
    tipo:'Emergencia',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Dos veces al día',
    descripcion:'Tablero general de emergencia de la encuesta de satisfacción a beneficiarios. Tablero activo con actualización automática dos veces al día.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiMWM5MjlmY2MtNGY4Yy00ODFhLTgyODQtNzY3OTg4MDE1NzcxIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'JAPÓN - General',
    proyecto:'JAPÓN',
    tipo:'Regular',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Tres veces al día',
    descripcion:'Proyecto JAPÓN regular (consolidado general). Tablero activo con actualización automática tres veces al día.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiNzdlNmY3YTctM2FhMy00ZjZiLTk5MGYtMzBmM2E1ZDgwNTQwIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'DHR - General',
    proyecto:'DHR',
    tipo:'Regular',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Una vez al día',
    descripcion:'Proyecto DHR regular (consolidado general). Tablero activo con actualización automática una vez al día.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiNGM0NWNiM2ItZDhhNy00MDdjLWIwMGItODVjNmU3ZjVhYTgwIiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  },
  {
    nombre:'Matriz Global de Monitoreo',
    proyecto:'Varios',
    tipo:'Regular',
    alcance:'General',
    socio:'Consolidado general',
    estado:'Activo',
    actualizacion:'Automática',
    frecuencia:'Dos veces al día',
    descripcion:'Tablero general de la Matriz Global de Monitoreo (varios proyectos). Tablero activo con actualización automática dos veces al día.',
    url:'https://app.powerbi.com/view?r=eyJrIjoiM2RhZDVkMTQtZDgxMi00NjAxLTkxOTgtN2YyMmU5MjBmNTg5IiwidCI6IjE1ODgyNjJkLTIzZmItNDNiNC1iZDZlLWJjZTQ5YzhlNjE4NiIsImMiOjh9'
  }
];
