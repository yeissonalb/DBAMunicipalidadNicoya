import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/app/layouts/AppLayout';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { MODULE_PERMISSIONS } from '@/features/auth/permissions';

import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PortalCiudadanoPage } from '@/features/portal-ciudadano/PortalCiudadanoPage';
import { ContribuyentesPage } from '@/features/contribuyentes/ContribuyentesPage';
import { InmueblesPage } from '@/features/inmuebles/InmueblesPage';
import { RadicacionTramitePage } from '@/features/tramites/RadicacionTramitePage';
import { CatalogoTramitesPage } from '@/features/tramites/CatalogoTramitesPage';
import { RevisionExpedientePage } from '@/features/expedientes/RevisionExpedientePage';
import { SeguimientoExpedientePage } from '@/features/expedientes/SeguimientoExpedientePage';
import { TributosDeudasPage } from '@/features/tributos/TributosDeudasPage';
import { PagosMunicipalesPage } from '@/features/facturacion-pagos/PagosMunicipalesPage';
import { ReportesAnalisisPage } from '@/features/reportes/ReportesAnalisisPage';
import { AuditoriaForensePage } from '@/features/auditoria/AuditoriaForensePage';
import { UsuariosRolesPage } from '@/features/usuarios/UsuariosRolesPage';
import { MatrizPermisosPage } from '@/features/roles-permisos/MatrizPermisosPage';
import { DbaPoliticasPage } from '@/features/dba/DbaPoliticasPage';
import { DbaRespaldosPage } from '@/features/dba/DbaRespaldosPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: Inicio de sesión institucional (Wireframe 1) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas bajo el layout institucional SIGEMUN */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.DASHBOARD}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal-ciudadano"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.PORTAL_CIUDADANO}>
                <PortalCiudadanoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contribuyentes"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.CONTRIBUYENTES}>
                <ContribuyentesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inmuebles"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.INMUEBLES}>
                <InmueblesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tramites/radicar"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES}>
                <RadicacionTramitePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tramites/catalogo"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES}>
                <CatalogoTramitesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expedientes/revision"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES}>
                <RevisionExpedientePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expedientes/seguimiento"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.TRAMITES_EXPEDIENTES}>
                <SeguimientoExpedientePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pagos"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.TRIBUTOS_PAGOS}>
                <PagosMunicipalesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tributos"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.TRIBUTOS_PAGOS}>
                <TributosDeudasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.REPORTES}>
                <ReportesAnalisisPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/auditoria"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.AUDITORIA}>
                <AuditoriaForensePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dba/auditoria"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.AUDITORIA}>
                <AuditoriaForensePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seguridad/usuarios"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.USUARIOS_ROLES}>
                <UsuariosRolesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seguridad/matriz"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.USUARIOS_ROLES}>
                <MatrizPermisosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dba/politicas"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.DBA_CONSOLA}>
                <DbaPoliticasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dba/respaldos"
            element={
              <ProtectedRoute allowedRoles={MODULE_PERMISSIONS.DBA_CONSOLA}>
                <DbaRespaldosPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

