# SIGEMUN — Sistema de Gestión para la Municipalidad de Nicoya (`muni_front`)

Aplicación web frontend desarrollada para el **Hito 3** del curso **Administración de Bases de Datos** de la **Universidad Nacional de Costa Rica (UNA), Campus Nicoya**.

Conectada a la Web API existente en `muni-back/` (**.NET 9 / ASP.NET Core Web API**) y a la base de datos **Microsoft SQL Server** (`MunicipalidadNicoya2026`).

---

## 1. Tecnologías Utilizadas

- **React 18** + **TypeScript 5.6** (modo estricto)
- **Vite 6** (servidor de desarrollo en puerto `5173`, compatible con la política CORS `"ReactApp"` del backend)
- **Tailwind CSS 3.4** + primitivos **shadcn/ui** con la paleta institucional de Nicoya (`#164B35` Verde Oscuro, `#B6944A` Dorado, `#F5F7F4` Fondo, `#FFFFFF` Tarjetas, `#26352D` Texto)
- **React Router 6** con protección de rutas por rol (`ProtectedRoute`)
- **TanStack Query v5** + **Axios** con interceptores JWT y traducción centralizada de errores de negocio de SQL Server (`SqlExceptionMiddleware`)
- **React Hook Form** + **Zod** para validación tipada de formularios
- **Recharts** para visualización analítica de recaudación por distrito y tributo
- **Lucide React** (iconografía) y **Sonner** (notificaciones toast)

---

## 2. Requisitos Previos e Instalación

### 2.1 Base de Datos y Backend (`muni-back`)
1. Asegúrese de tener ejecutados en su instancia de SQL Server los scripts de `BaseDeDatos/`, incluyendo obligatoriamente:
   - `BaseDeDatos/Database_Backend/13_sp_autenticar_usuario.sql`
   - `BaseDeDatos/Database_Backend/14_mejoras_catalogos_output.sql`
   - `BaseDeDatos/Database_Backend/15_portal_ciudadano_dw_monitoreo.sql` (portal ciudadano, revocaciones, Data Warehouse y monitoreo DBA)
   - Opcional: `BaseDeDatos/DataWareHouse/DWH_Structure.sql`, `DWH_ETL.sql`, `DWH_Vistas_Analiticas.sql` (pantalla Data Warehouse) y `BaseDeDatos/PlanDeMantenimientoBD/01`–`04` (historial de mantenimiento)
2. Inicie el backend desde otra terminal:
   ```bash
   cd muni-back/MunicipalidadAPI
   dotnet run
   ```
   El backend escuchará por defecto en `http://localhost:5080` (`Swagger` en `http://localhost:5080/swagger`).

### 2.2 Instalación y Ejecución del Frontend (`muni_front`)
```bash
cd muni_front
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 2.3 Variables de Entorno
El archivo `.env.example` (y `.env`) define la URL base del backend:
```env
VITE_API_BASE_URL=http://localhost:5080/api
```

### 2.4 Compilación para Producción
```bash
cd muni_front
npm run build
```

---

## 3. Usuarios de Prueba Documentados en el Backend (`muni-back/README.md`)

*(Nota de seguridad: Ninguna credencial está embebida ni quemada en el código fuente del frontend).*

| Usuario (`user_name`) | Contraseña Semilla | Rol Principal en BD (`Roles.cs`) | Ruta Inicial |
|---|---|---|---|
| `admin_nicoya` | `password` | `Administrador del Sistema` | `/dashboard` (acceso a todos los módulos internos) |
| `analista_curb` | `4` | `Analista de Plataforma y Trámites` | `/expedientes/seguimiento` |
| `cajero_caja1` | `password123` | `Cajero de Recaudación` | `/pagos` |
| `auditor_muni` | `admin` | `Auditor Interno` | `/reportes` |
| `dba_sys` | `password` *(tras ejecutar el `UPDATE` de `13_sp_autenticar_usuario.sql`)* | `DBA Administrador de Base de Datos` | `/dba/politicas` |

### 3.1 Portal ciudadano (`/portal/login`)

El contribuyente no usa `dbo.Usuario`: activa su cuenta en **«Activar mi cuenta»** con su cédula, el correo registrado en el padrón y una contraseña nueva (mínimo 8 caracteres), y luego inicia sesión con cédula y contraseña. Ejemplo con los datos semilla: cédula `5-0321-0456`, correo `maria.gonzalez@gmail.com`.

La sesión del portal es independiente de la institucional (otra clave en `sessionStorage` y otro cliente HTTP), por lo que se pueden tener abiertas ambas en el mismo navegador.

---

## 4. Documentación Técnica Incluida en `muni_front/docs/`

- [`docs/AUDITORIA_BACKEND.md`](./docs/AUDITORIA_BACKEND.md) — Auditoría completa de los 14 controladores, 63 endpoints, DTOs, roles y manejo de errores SQL.
- [`docs/MATRIZ_WIREFRAMES.md`](./docs/MATRIZ_WIREFRAMES.md) — Cobertura de los wireframes de las páginas 113–120 del documento académico.
- [`docs/MATRIZ_CASOS_USO.md`](./docs/MATRIZ_CASOS_USO.md) — Trazabilidad desde los casos de uso (`CU-01`..`CU-DBA-06`) hasta los componentes React y endpoints.
- [`docs/ARQUITECTURA_FRONTEND.md`](./docs/ARQUITECTURA_FRONTEND.md) — Diseño modular, tokens visuales y estructura de carpetas.
- [`docs/MAPA_RUTAS.md`](./docs/MAPA_RUTAS.md) — Mapa de rutas y permisos por rol.
- [`docs/INTEGRACION_API.md`](./docs/INTEGRACION_API.md) — Detalles de comunicación HTTP, JWT, `TimeSpan` y subida de archivos.
- [`docs/MATRIZ_FUNCIONALIDADES.md`](./docs/MATRIZ_FUNCIONALIDADES.md) — Correspondencia entre cada función de `api.ts` y su endpoint REST.
- [`docs/PRUEBAS_FRONTEND.md`](./docs/PRUEBAS_FRONTEND.md) — Resultados de compilación TypeScript/Vite y pruebas de integración.
- [`docs/PENDIENTES_BACKEND.md`](./docs/PENDIENTES_BACKEND.md) — Estado de los pendientes del backend (todos resueltos con el script 15) y requisitos de despliegue.

