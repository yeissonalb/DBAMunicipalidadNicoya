# Reglas de Arquitectura del Backend - Municipalidad Nicoya 2026

## Principio Fundamental
- **Toda la lógica de negocio debe estar implementada en la base de datos** (Procedimientos Almacenados `dbo.sp_*`, Funciones `dbo.fn_*`, Triggers y Vistas `dbo.vw_*`).
- **El Backend es una capa delgada (Thin Wrapper / API Gateway)**. Su rol se limita a:
  1. Validar sintaxis y estructura básica de los payloads de entrada (DTOs).
  2. Declarar e invocar los Procedimientos Almacenados con sus parámetros (`IN` y `OUTPUT`).
  3. Mapear los resultados SQL a respuestas JSON.
  4. Manejar autenticación/autorización y pasar el identificador de usuario para auditoría.
  5. Atrapar excepciones de SQL Server (`THROW 50000+`) y mapearlas a códigos de estado HTTP apropiados.

## Prohibiciones en el Backend
- ❌ No realizar cálculos de recargos, intereses, montos de morosidad ni plazos en código de backend (usar los SPs y funciones de BD).
- ❌ No armar sentencias SQL directas con manipulación manual de tablas (`INSERT INTO`, `UPDATE`, `DELETE`) fuera de los SPs correspondientes.
- ❌ No omitir el manejo de parámetros `OUTPUT` para IDs autogenerados.
