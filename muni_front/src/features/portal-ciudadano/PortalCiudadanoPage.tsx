import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileDown,
  FileText,
  Globe,
  Info,
  Lock,
  Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Wireframe 2 (PDF Página 113): "PORTAL CIUDADANO EN LÍNEA - Oficina virtual municipal"
 *
 * Cumplimiento estricto de la regla de auditoría:
 * "IMPORTANTE: revisar si el backend permite autenticar ciudadanos y acceder a información propia de forma segura.
 * No utilizar endpoints administrativos para simular un portal ciudadano.
 * Si el portal ciudadano requiere una autenticación que no está implementada, documentar el bloqueo."
 */
export function PortalCiudadanoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Ciudadano en Línea — Oficina Virtual Municipal"
        subtitle="Referencia conceptual del Wireframe #2 (Página 113 de la documentación académica Hito 2)"
        badge="Wireframe p. 113 · Bloqueado en Backend"
        icon={<Globe className="h-6 w-6" />}
      />

      {/* Explicit Technical Blocker Banner */}
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5 text-amber-950 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-amber-950">
                Estado de Integración: Bloqueado por Dependencia de Autenticación Ciudadana en Backend
              </h3>
              <Badge variant="warning">Documentado en PENDIENTES_BACKEND.md</Badge>
            </div>
            <p className="text-xs leading-relaxed text-amber-900">
              Tras auditar <code className="font-mono font-bold">muni-back</code> y{' '}
              <code className="font-mono font-bold">BaseDeDatos/</code>, se verificó que la tabla{' '}
              <code className="font-mono">dbo.Usuario</code> y el procedimiento{' '}
              <code className="font-mono">dbo.sp_autenticar_usuario</code> autentican exclusivamente
              a <strong>funcionarios internos</strong> (vinculados a <code className="font-mono">dbo.Departamento</code>{' '}
              y a los 5 roles de <code className="font-mono">Roles.cs</code>). No existe en la API un
              endpoint de autenticación de contribuyentes ni endpoints de autoservicio filtrados por
              el ciudadano en sesión.
            </p>
            <p className="text-xs font-semibold text-amber-950">
              Por directriz expresa de arquitectura y seguridad, este módulo NO invoca endpoints
              administrativos (<code className="font-mono">/api/tramite</code>,{' '}
              <code className="font-mono">/api/facturacionpago</code>) para simular consultas
              ciudadanas ni presenta datos ficticios como si provinieran de la base de datos.
            </p>
          </div>
        </div>
      </div>

      {/* Top Navigation Concept from Wireframe 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE3DE] bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="px-3 py-1">
            Mis Trámites
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Mis Inmuebles
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Estado de Cuenta y Facturas
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5A6B61]">
          <Lock className="h-3.5 w-3.5 text-[#B6944A]" />
          <span>Controles deshabilitados hasta que exista autenticación ciudadana en la API</span>
        </div>
      </div>

      {/* Two Column Wireframe Layout (Page 113) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: Mi Trámite en Curso */}
        <Card className="opacity-95">
          <CardHeader className="border-b border-[#DCE3DE] bg-[#F5F7F4]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#164B35]" /> Seguimiento de Mi Trámite en Curso
                </CardTitle>
                <CardDescription className="mt-1">
                  Estructura conceptual según Wireframe #2 (p. 113)
                </CardDescription>
              </div>
              <Badge variant="warning">Requiere Endpoint Ciudadano</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Stepper conceptual del wireframe */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg border border-[#164B35]/30 bg-[#E8F0EC] p-2.5">
                <CheckCircle2 className="mx-auto h-4 w-4 text-[#164B35]" />
                <p className="mt-1 font-semibold text-[#164B35]">1. Radicado</p>
              </div>
              <div className="rounded-lg border border-[#B6944A]/40 bg-[#FBF7EE] p-2.5">
                <Clock className="mx-auto h-4 w-4 text-[#967736]" />
                <p className="mt-1 font-semibold text-[#967736]">2. Revisión Técnica</p>
              </div>
              <div className="rounded-lg border border-[#DCE3DE] bg-[#F5F7F4] p-2.5 text-[#5A6B61]">
                <Building2 className="mx-auto h-4 w-4" />
                <p className="mt-1 font-medium">3. Inspección</p>
              </div>
              <div className="rounded-lg border border-[#DCE3DE] bg-[#F5F7F4] p-2.5 text-[#5A6B61]">
                <FileText className="mx-auto h-4 w-4" />
                <p className="mt-1 font-medium">4. Resolución</p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-[#DCE3DE] bg-[#F5F7F4]/60 p-4 text-xs text-[#5A6B61]">
              <p className="font-semibold text-[#26352D]">
                Contrato requerido en Backend para habilitar esta sección:
              </p>
              <ul className="mt-1.5 list-disc pl-5 space-y-1">
                <li>
                  Autenticación de ciudadano (<code className="font-mono">Claim: id_contribuyente</code>)
                </li>
                <li>
                  Endpoint seguro <code className="font-mono">GET /api/portal/mis-tramites</code> que
                  filtre por el <code className="font-mono">id_contribuyente</code> del token JWT.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" size="sm" disabled title="No disponible en backend">
                <FileDown className="h-4 w-4" /> Descargar Comprobante PDF
              </Button>
              <Button variant="secondary" size="sm" disabled title="No disponible en backend">
                <Upload className="h-4 w-4" /> Subir Requisito Faltante
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Card: Estado de Cuenta y Tributos */}
        <Card className="opacity-95">
          <CardHeader className="border-b border-[#DCE3DE] bg-[#F5F7F4]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#164B35]" /> Estado de Cuenta y Tributos
                </CardTitle>
                <CardDescription className="mt-1">
                  Consulta de saldos, factura electrónica Hacienda y pago en línea
                </CardDescription>
              </div>
              <Badge variant="warning">Requiere Endpoint Ciudadano</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="rounded-lg border border-dashed border-[#DCE3DE] bg-[#F5F7F4]/60 p-4 text-xs text-[#5A6B61]">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-[#164B35] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#26352D]">
                    Separación de privilegios (Seguridad de Aplicaciones Web)
                  </p>
                  <p className="mt-1">
                    Para consultar estados de cuenta y registrar pagos en caja como funcionario
                    autorizado (<code className="font-mono">Cajero de Recaudación</code> o{' '}
                    <code className="font-mono">Administrador del Sistema</code>), utilice los
                    módulos administrativos reales en{' '}
                    <a href="/pagos" className="font-bold text-[#164B35] underline">
                      /pagos
                    </a>{' '}
                    y{' '}
                    <a href="/tributos" className="font-bold text-[#164B35] underline">
                      /tributos
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="gold" size="sm" disabled title="Pasarela SINPE ciudadano no expuesta en API">
                <CreditCard className="h-4 w-4" /> Pagar en Línea (SINPE Móvil) — No disponible en API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

