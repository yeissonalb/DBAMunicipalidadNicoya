# Auditoría visual de SIGEMUN

Fecha: 30 de octubre de 2026  
Alcance: `muni_front/`  
Referencia funcional: `docs/MATRIZ_WIREFRAMES.md` y rutas existentes.

## Método y limitaciones

Se inspeccionaron el layout, router, autenticación, estilos, componentes compartidos, servicios y las 15 áreas funcionales documentadas. El PDF del Hito 2 está disponible en la raíz del repositorio; sin embargo, el entorno de ejecución no dispone de Poppler ni de un runtime PDF accesible para renderizar visualmente las páginas 113-120. Por ello, la correspondencia se verificó provisionalmente contra la matriz trazable. Esta matriz no sustituye una revisión visual final del PDF.

La auditoría no altera endpoints, DTO, permisos, JWT, consultas, mutaciones ni reglas de negocio.

## Hallazgos transversales

- La paleta institucional existe, pero muchos componentes repiten colores hexadecimales en JSX en vez de consumir tokens.
- La escala tipográfica era pequeña para tablas, ayudas y etiquetas; esto afecta lectura en proyector.
- Existían referencias técnicas visibles (`WF-*`, vistas SQL, procedimientos y endpoints) que no aportan a la tarea del funcionario.
- Sidebar, header y componentes base eran funcionales, aunque necesitaban mayor jerarquía, contraste de foco y adaptación táctil.
- Las pantallas extensas dependen de tablas y formularios densos; requieren scroll localizado, agrupación y estados vacíos consistentes.
- La interfaz usa datos reales y conserva estados de carga/error, una base adecuada para modernización incremental.

## Auditoría por pantalla

| # | Pantalla | Problemas detectados | Mejora propuesta | Prioridad | Criterio de verificación |
|---|---|---|---|---|---|
| 1 | Login | Texto técnico expuesto, jerarquía densa y control de contraseña sin nombre accesible. | Simplificar mensajes, reforzar identidad y accesibilidad del formulario. | Alta | Utilizable a 360 px; errores cercanos; mostrar/ocultar operable con teclado y lector. |
| 2 | Portal ciudadano | Gran cantidad de información informativa puede confundirse con acciones habilitadas. | Diferenciar claramente consulta disponible, aviso y acción bloqueada por backend. | Alta | Ninguna acción aparenta funcionar si la API no la respalda. |
| 3 | Políticas DBA | Formularios y estados técnicos compiten visualmente; riesgo de acciones críticas poco diferenciadas. | Agrupar configuración, estado y acciones; usar confirmaciones y badges semánticos. | Alta | Acción crítica distinguible y confirmada; datos reales preservados. |
| 4 | Respaldos DBA | Historial ancho y controles técnicos densos. | Barra de acciones consistente, tabla con scroll localizado y resumen de estado. | Alta | FULL/DIFF, verificación y simulación conservan contratos y confirmaciones. |
| 5 | Auditoría | Tabla extensa, filtros densos y comparación de cambios requieren escaneo rápido. | Jerarquizar filtros, tabla y panel de detalle; conservar comparativa anterior/nuevo. | Alta | Filtros y detalle accesibles; ningún dato de auditoría se trunca sin alternativa. |
| 6 | Usuarios y roles | Varias operaciones administrativas comparten peso visual. | Separar búsqueda/listado de alta, edición, estado y asignación de rol. | Alta | Crear, editar, activar/desactivar y asignar rol siguen disponibles según permiso. |
| 7 | Matriz RBAC | Matriz crece horizontalmente y puede perder contexto. | Encabezados claros, scroll localizado y celdas de estado no dependientes solo del color. | Alta | Legible a 1024 px; permisos y roles identificables durante scroll. |
| 8 | Radicación | Formulario largo con alta carga cognitiva. | Secciones numeradas, resumen de requisitos y acciones persistentes sin cambiar secuencia de API. | Alta | Campos, validaciones, requisitos y adjuntos originales presentes. |
| 9 | Revisión | Selección, detalle y resolución compiten en una sola vista. | Maestro-detalle con estado destacado y zona de decisión claramente separada. | Alta | Cambio de estado y resolución exigen confirmación y respetan permisos. |
| 10 | Seguimiento | Timeline, documentos y búsqueda necesitan mejor jerarquía responsive. | Resumen de expediente, progreso y línea de tiempo con etiquetas textuales. | Media | Estados, fechas, historial y adjuntos son legibles a 360 px. |
| 11 | Contribuyentes e inmuebles | Formularios complejos, pestañas y tablas densas; acciones repetidas. | Patrones comunes para búsqueda, registro, edición y detalle; tablas adaptables. | Alta | Persona física/jurídica, representantes, fincas y copropiedad se conservan. |
| 12 | Pagos y tributos | Riesgo de confundir consulta, cálculo y ejecución de cobro. | Secuencia visual consulta > selección > confirmación > resultado; totales prominentes. | Alta | No se recalculan importes en frontend; cobro y aplicación mantienen confirmación. |
| 13 | Reportes | Muchos reportes y filtros en una vista extensa. | Resumen ejecutivo, filtros compactos y tarjetas de gráfico con estados vacíos. | Media | Leyendas, periodo, exportación y reportes existentes siguen accesibles. |
| 14 | Dashboard | Cuadrícula extensa y etiquetas técnicas en KPIs/módulos. | KPIs por permiso, accesos claros y actividad reciente sin nomenclatura interna. | Alta | Cada rol ve solo endpoints y accesos autorizados; no aparecen `WF-*`. |
| 15 | Catálogo | Mantenimiento de tipos y requisitos comparte contexto visual. | Separar catálogo, requisitos y formularios de mantenimiento con selección visible. | Media | Altas, ediciones y asociaciones originales continúan funcionando. |

## Criterios responsive comunes

- 360 px: navegación mediante drawer, formularios a una columna, modales tipo hoja y sin overflow de página.
- 768 px: acciones envuelven correctamente y las tablas desplazan solo dentro de su contenedor.
- 1024 px: sidebar y contenido no compiten por ancho; filtros complejos siguen visibles.
- 1440 px: contenido limitado a un ancho de lectura útil, sin estiramiento excesivo.

## Estado de implementación derivado de la auditoría

Se aplicó la capa transversal de design system, layout y componentes compartidos; se modernizaron específicamente login y dashboard. Las pantallas operativas heredan las mejoras globales sin reemplazar su lógica. La revisión visual interactiva autenticada sigue pendiente de un backend y usuarios de prueba autorizados disponibles durante la sesión.
