# Rediseño visual de SIGEMUN

Fecha: 30 de octubre de 2026

## Dirección visual

El sistema adopta una estética administrativa institucional contemporánea: verde profundo para navegación y confianza, dorado como acento municipal, superficies blancas, fondo de bajo contraste y tipografía Inter con alternativas del sistema.

## Sistema de diseño

- Tokens CSS para color institucional, fondo, superficie, texto, borde, foco y estados.
- Escala de radios de 8, 12 y 16 px; sombras suaves y transiciones discretas.
- Foco visible reforzado, selección de texto institucional y soporte `prefers-reduced-motion`.
- Campos con altura táctil de 44 px, etiquetas legibles y mensajes de error con `role="alert"`.
- Tablas con encabezados persistentes visualmente, filas alternas, scroll horizontal localizado y región enfocables.
- Modales responsive con semántica de diálogo, cierre por Escape, overlay y adaptación móvil.

## Cambios realizados

### Layout global

- Sidebar institucional oscuro, colapsable en escritorio y drawer en móvil.
- Navegación agrupada por dominio y filtrada por los roles existentes.
- Eliminación de etiquetas técnicas `WF-*` visibles.
- Header contextual, perfil, rol y contenido limitado a 1600 px.
- No se modificaron rutas ni reglas de autorización.

### Login

- Se conserva React Hook Form, Zod, JWT, redirección por rol y manejo real de errores.
- Se retiraron nombres de algoritmo, procedimiento, base de datos y endpoint de la pantalla pública.
- El control mostrar/ocultar contraseña ahora tiene nombre y estado accesibles.
- Se reforzó el lenguaje institucional y se mantuvo el diseño responsive.

### Dashboard

- KPIs mantienen sus consultas autorizadas pero usan títulos orientados a la tarea.
- Accesos rápidos ya no muestran referencias de wireframe.
- La actividad reciente deja de exponer el endpoint en la interfaz.
- La visibilidad continúa determinada exclusivamente por `MODULE_PERMISSIONS` y el JWT.

### Componentes compartidos

- `Card`: nueva superficie de 16 px y espaciado responsive.
- `Input`, `Select`, `Textarea`: contraste, foco, altura táctil y estados disabled.
- `FormField`: etiquetas más legibles y error anunciado.
- `DataTable`: región accesible, encabezados con `scope`, zebra sutil y scroll localizado.
- `PageHeader`: jerarquía institucional unificada.
- `Modal`: semántica de diálogo y presentación móvil.

Estas mejoras se propagan a contribuyentes, inmuebles, trámites, expedientes, pagos, tributos, usuarios, RBAC, auditoría, DBA, reportes, portal y catálogo sin reemplazar sus datos ni operaciones.

## Correspondencia con wireframes

La matriz existente mantiene el vínculo entre las 15 áreas, las rutas React, roles y endpoints. La revisión del PDF (sección 6, páginas 113-120) no pudo renderizarse en este entorno por ausencia de Poppler/runtime PDF, por lo que debe completarse visualmente antes de la demostración final.

## Verificación

- `npm.cmd run lint`: ejecutado; 0 errores y 3 advertencias preexistentes de Fast Refresh.
- `npx.cmd tsc -b`: ejecutado sin errores.
- `npm.cmd run build`: ejecutado correctamente fuera del sandbox; Vite transformó 2354 módulos y generó `dist/`. Se conserva una advertencia no bloqueante por un chunk JavaScript superior a 500 kB.
- No se realizaron commits ni pushes.
- No se modificaron backend, base de datos, endpoints, DTO, autenticación o reglas de negocio.

## Pendientes de validación visual

- Renderizar y comparar las páginas 113-120 del PDF cuando Poppler esté disponible.
- Ejecutar la aplicación con backend y usuarios de prueba autorizados para recorrer todos los roles.
- Verificar manualmente 360, 768, 1024 y 1440 px en navegador.
- Confirmar con datos de volumen real las tablas de auditoría, RBAC, contribuyentes e inmuebles.
