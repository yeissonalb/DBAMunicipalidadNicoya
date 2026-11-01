# Arquitectura del Frontend — SIGEMUN (`muni_front`)

**Proyecto:** SIGEMUN — Sistema de Gestión para la Municipalidad de Nicoya  
**Stack Tecnológico:** React 18 + TypeScript 5.6 (Strict) + Vite 6 + Tailwind CSS 3.4 + shadcn/ui + React Router 6 + TanStack Query 5 + Axios + React Hook Form + Zod + Recharts + Lucide React + Sonner.

---

## 1. Principios Arquitectónicos

1. **Aislamiento Estricto (`muni_front/`):** Todo el código fuente, configuración, estilos y documentación técnica residen exclusivamente dentro de `muni_front/`. Ningún archivo de `muni-back/` ni `BaseDeDatos/` ha sido alterado.
2. **Fidelidad de Contratos y Delegación SQL:** El frontend no reproduce lógica de negocio financiera ni de integridad que pertenece a SQL Server (`sp_calcular_recargos_intereses`, `sp_generar_factura`, `sp_aplicar_pago_factura`, `trg_validar_porcentaje_copropiedad`, `trg_actualizar_saldo_factura`, `trg_historial_estado_tramite`).
3. **Control de Acceso Basado en Roles (RBAC):** Las rutas (`ProtectedRoute`) y el menú lateral (`AppLayout`) evalúan los roles reales devueltos en el JWT (`UsuarioTokenDto.roles`) y reflejan con exactitud los atributos `[Authorize(Roles = ...)]` de los 14 controladores de `muni-back`.
4. **Manejo Centralizado de Errores (`ApiClientError`):** El interceptor de Axios desempaqueta `BaseResponse<T>`, detecta diccionarios de validación `ModelState` (`HTTP 400`), extrae códigos de error de negocio de SQL Server (`sqlErrorCode` `50001`–`50080`, `547`, `2627`) y gestiona automáticamente sesiones expiradas (`HTTP 401`).

---

## 2. Estructura de Carpetas (`muni_front/`)

```text
muni_front/
├── docs/
│   ├── AUDITORIA_BACKEND.md
│   ├── MATRIZ_WIREFRAMES.md
│   ├── MATRIZ_CASOS_USO.md
│   ├── ARQUITECTURA_FRONTEND.md
│   ├── MAPA_RUTAS.md
│   ├── INTEGRACION_API.md
│   ├── MATRIZ_FUNCIONALIDADES.md
│   ├── PRUEBAS_FRONTEND.md
│   └── PENDIENTES_BACKEND.md
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx            # Sidebar #164B35, Header institucional y Footer
│   │   ├── providers/
│   │   │   └── AuthProvider.tsx         # Contexto JWT, expiración automática y verificación /auth/me
│   │   └── router/
│   │       ├── AppRouter.tsx            # Definición declarativa de rutas
│   │       └── ProtectedRoute.tsx       # Guard de autenticación y autorización por rol
│   ├── components/
│   │   ├── ui/                          # Primitivos shadcn/ui (Button, Card, Badge, Input, Select, Modal)
│   │   ├── common/                      # PageHeader, LoadingState, EmptyState, ErrorState
│   │   ├── forms/                       # FormField reutilizable con soporte React Hook Form + Zod
│   │   ├── tables/                      # DataTable tipada
│   │   └── charts/                      # ChartCard contenedor Recharts
│   ├── features/
│   │   ├── auth/                        # LoginPage.tsx y permissions.ts (constantes Roles.cs)
│   │   ├── dashboard/                   # DashboardPage.tsx adaptativo por rol
│   │   ├── portal-ciudadano/            # PortalCiudadanoPage.tsx (Wireframe 2 con bloqueo documentado)
│   │   ├── contribuyentes/              # ContribuyentesPage.tsx (Padrón físico, jurídico y rep. legal)
│   │   ├── inmuebles/                   # InmueblesPage.tsx (Catastro, distritos y copropiedad)
│   │   ├── tramites/                    # RadicacionTramitePage.tsx y CatalogoTramitesPage.tsx
│   │   ├── expedientes/                 # RevisionExpedientePage.tsx y SeguimientoExpedientePage.tsx
│   │   ├── tributos/                    # TributosDeudasPage.tsx (Deudas, recálculo BD y estado cuenta)
│   │   ├── facturacion-pagos/           # PagosMunicipalesPage.tsx (Facturas pendientes, cobro y aplicación)
│   │   ├── reportes/                    # ReportesAnalisisPage.tsx (Análisis tributario Recharts y CSV)
│   │   ├── usuarios/                    # UsuariosRolesPage.tsx (Panel RBAC de usuarios y roles)
│   │   ├── roles-permisos/              # MatrizPermisosPage.tsx (Centro de seguridad y matriz RBAC)
│   │   ├── auditoria/                   # AuditoriaForensePage.tsx (Audit Log y comparativa Before/After)
│   │   └── dba/                         # DbaPoliticasPage.tsx y DbaRespaldosPage.tsx (Consola DBA)
│   ├── hooks/
│   │   └── useDebounce.ts
│   ├── lib/
│   │   └── utils.ts                     # Formateadores CRC, fechas es-CR, TimeSpan y exportador CSV
│   ├── services/
│   │   ├── httpClient.ts                # Instancia Axios, interceptores JWT y ApiClientError
│   │   └── api.ts                       # Cliente tipado de los 14 controladores (63 endpoints)
│   ├── styles/
│   │   └── index.css                    # Tokens CSS institucionales SIGEMUN
│   ├── types/
│   │   └── api.ts                       # Contratos TypeScript de todas las vistas y SPs
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Identidad Visual Institucional (SIGEMUN — Nicoya)

| Token | Valor Hex | Uso en la Interfaz |
|---|---|---|
| `--sigemun-green` | `#164B35` | Sidebar principal, encabezados primarios, botones de acción institucional, barras principales en gráficos |
| `--sigemun-gold` | `#B6944A` | Indicadores de ruta activa, insignias de rol y SLA, bordes superiores destacados, series comparativas en gráficos |
| `--sigemun-bg` | `#F5F7F4` | Fondo general de la aplicación y encabezados de tabla |
| `--sigemun-card` | `#FFFFFF` | Contenedores de tarjetas, tablas, formularios y modales |
| `--sigemun-text` | `#26352D` | Tipografía principal de alta legibilidad |

