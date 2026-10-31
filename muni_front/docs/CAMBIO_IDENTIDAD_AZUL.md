# SIGEMUN — Migración de identidad visual azul

## Alcance

La identidad institucional del frontend fue migrada de verde oscuro y dorado a la siguiente paleta azul:

- Azul marino: `#102A43`
- Azul principal: `#1E5A9C`
- Azul medio: `#3E8FD6`
- Celeste: `#BFE3FA`
- Azul muy claro: `#F1F8FE`
- Blanco: `#FFFFFF`
- Texto principal: `#243746`
- Bordes: `#D9E6F2`

La migración comprende componentes compartidos, layout administrativo, login institucional, dashboard, Portal Ciudadano y todas las pantallas operativas y técnicas dentro de `src/features`.

## Implementación

- Variables CSS institucionales centralizadas en `src/styles/index.css`.
- Tokens semánticos `sigemun.*` centralizados en `tailwind.config.js`.
- Componentes base actualizados: botones, badges, inputs, tarjetas, tablas, modales, estados y encabezados.
- Sidebar en azul marino con selección activa en azul medio.
- Gráficos y series de reportes migrados a la escala azul.
- Colores de éxito, advertencia y error conservados como estados semánticos.
- `logo2.png` utilizado como isotipo compacto en sidebar, dashboard, Portal Ciudadano y favicon.
- `logo1.png` utilizado como firma completa en el acceso institucional.

## Verificación realizada

- `npm run lint`: completado sin errores; permanecen cuatro advertencias preexistentes de Fast Refresh.
- `npm run build`: completado correctamente con Vite; permanece la advertencia informativa por un chunk superior a 500 kB.
- Auditoría estática de los antiguos hexadecimales y tokens verdes/dorados: sin coincidencias.
- Revisión de clases responsive (`sm`, `md`, `lg`, `xl`) y contenedores horizontales de tablas: presente en componentes y rutas operativas.
- No se modificaron rutas, endpoints, autenticación, permisos, roles ni lógica funcional.

## Limitación de la sesión

La inspección visual automatizada mediante navegador no pudo ejecutarse porque el host de acceso al navegador no estaba disponible. El build de producción y la auditoría estructural sí fueron completados. Se recomienda realizar una pasada manual final con backend activo en anchos aproximados de 390 px, 768 px y 1440 px.
