# Guía de Integración con la Web API — SIGEMUN (`muni_front` <-> `muni-back`)

---

## 1. Configuración de Entorno y CORS

- **Variable de entorno (`muni_front/.env`):**
  ```env
  VITE_API_BASE_URL=http://localhost:5080/api
  ```
- **Política CORS del Backend (`Program.cs`):**
  `muni-back` autoriza explícitamente los orígenes `http://localhost:5173` y `http://localhost:3000`. El script `npm run dev` en `muni_front` está configurado en el puerto `5173`.

---

## 2. Cliente HTTP e Interceptores (`src/services/httpClient.ts`)

1. **Inyección de Token JWT (`Authorization: Bearer <token>`):**
   - La sesión autenticada (`token`, `expiraUtc`, `usuario`) se almacena en `sessionStorage` bajo la clave `sigemun_auth_session_v1`.
   - En cada petición saliente, el interceptor lee la sesión, verifica que `expiraUtc` no haya vencido y adjunta la cabecera `Authorization: Bearer <token>`.
2. **Desempaquetado de `BaseResponse<T>`:**
   - Las funciones `unwrapResponse<T>` y `unwrapFullResponse<T>` validan que `response.data.success === true` y retornan el payload tipado.
3. **Traducción de Errores (`ApiClientError`):**
   - **Errores de validación (`HTTP 400` con diccionario `ModelState`):** Se concatenan los mensajes por campo para mostrarlos claramente al usuario.
   - **Excepciones de Negocio SQL (`SqlExceptionMiddleware`):** Se conserva el mensaje exacto del `THROW 50XXX` de SQL Server junto con el badge `SQL #<sqlErrorCode>`.
   - **Sesión Expirada (`HTTP 401`):** Dispara el evento global `sigemun:unauthorized`, limpiando la sesión y redirigiendo a `/login`.

---

## 3. Reglas Especiales de Serialización y Formatos

| Caso Técnico | Solución Implementada en `muni_front` |
|---|---|
| **`TimeSpan` en Políticas DBA (`HoraEjecucion`)** | `SvRespaldosDba` recibe `TimeSpan` en C#. La función `ensureTimeSpanFormat` en `src/lib/utils.ts` normaliza valores `"HH:mm"` de `<input type="time">` a `"HH:mm:ss"` antes de enviarlos en `POST` y `PUT /api/respaldosdba/configuracion`. |
| **Carga de Archivos (`multipart/form-data`)** | `tramiteApi.adjuntarArchivo` y `tramiteApi.requisitoPresentado` construyen un `FormData` con los nombres exactos de propiedad de `AdjuntarArchivoForm` y `RequisitoPresentadoForm` (`IdTramite`, `IdRequisito`, `Archivo`) y validan previamente las extensiones permitidas y el límite de `10 MB` de `ArchivoTramitePolicy`. |
| **Descarga de Archivos Estáticos** | Las rutas relativas devueltas en `ArchivoAdjuntadoDto.rutaRelativa` (`uploads/tramites/<guid>.<ext>`) se enlazan contra `BACKEND_ORIGIN` (`http://localhost:5080/uploads/tramites/...`). |
| **Parámetros Opcionales con `DEFAULT` en SQL** | Cuando la tasa de interés en `POST /api/tributodeuda/deuda/{id}/recalcular` o la carpeta en `POST /api/respaldosdba/backup-full` no se especifican, se envía `{}` para que el backend omita el parámetro SQL y respete el `DEFAULT` del procedimiento almacenado. |

