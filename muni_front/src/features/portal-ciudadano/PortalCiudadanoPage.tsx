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
 * Portal conceptual del wireframe 2. No consume endpoints administrativos ni presenta datos
 * simulados mientras el backend no ofrezca autenticación ciudadana segura.
 */
export function PortalCiudadanoPage() {
  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Portal Ciudadano en Línea"
        subtitle="Un espacio centralizado para consultar trámites, propiedades y obligaciones municipales."
        badge="Vista informativa"
        icon={<Globe className="h-6 w-6" />}
      />

      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white shadow-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-label text-amber-800">Estado del servicio</p>
                <h2 className="mt-1 text-base font-bold text-amber-950 sm:text-lg">
                  Acceso ciudadano pendiente de integración
                </h2>
              </div>
              <Badge variant="warning" className="w-fit">Servicio no habilitado</Badge>
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-amber-900/85">
              Las consultas personales permanecen deshabilitadas hasta contar con autenticación
              ciudadana segura. No se muestran datos ficticios ni información administrativa.
            </p>
            <details className="group mt-4 rounded-xl border border-amber-200/80 bg-white/70 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-amber-900 marker:text-amber-600">
                Ver detalle técnico de la dependencia
              </summary>
              <div className="mt-3 space-y-2 border-t border-amber-200 pt-3 text-xs leading-relaxed text-amber-900/85">
                <p>
                  El backend actual autentica únicamente funcionarios internos y no expone una
                  sesión para contribuyentes que filtre la información por identidad.
                </p>
                <p>
                  Por seguridad, este portal no reutiliza endpoints administrativos de trámites o
                  facturación. La dependencia está documentada en <strong>PENDIENTES_BACKEND.md</strong>.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE3DE] bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Servicios ciudadanos</p>
            <h2 className="mt-1 text-lg font-bold text-[#26352D]">¿Qué desea consultar?</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#607168]">
            <Lock className="h-3.5 w-3.5 text-[#967736]" />
            <span>Disponible cuando se habilite el acceso ciudadano</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3" style={{ marginTop: '1.5rem' }}>
          <ServiceOption
            active
            icon={<FileText className="h-4 w-4" />}
            title="Mis trámites"
            description="Seguimiento y requisitos"
          />
          <ServiceOption
            icon={<Building2 className="h-4 w-4" />}
            title="Mis inmuebles"
            description="Propiedades registradas"
          />
          <ServiceOption
            icon={<CreditCard className="h-4 w-4" />}
            title="Estado de cuenta"
            description="Tributos y facturas"
          />
        </div>
      </section>

      <div
        className="grid grid-cols-1 xl:grid-cols-2"
        style={{ columnGap: '2rem', rowGap: '2rem' }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EC] text-[#164B35]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Seguimiento de trámites</CardTitle>
                  <CardDescription className="mt-1">Consulte el avance y los requisitos de su gestión.</CardDescription>
                </div>
              </div>
              <Badge variant="warning" className="w-fit">Próximamente</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 sm:pt-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ProgressStep icon={<CheckCircle2 className="h-4 w-4" />} label="Radicado" state="done" />
              <ProgressStep icon={<Clock className="h-4 w-4" />} label="Revisión" state="current" />
              <ProgressStep icon={<Building2 className="h-4 w-4" />} label="Inspección" />
              <ProgressStep icon={<FileText className="h-4 w-4" />} label="Resolución" />
            </div>

            <div className="rounded-xl border border-dashed border-[#C8D5CE] bg-[#FAFCFB] p-4 text-sm text-[#607168]">
              <p className="font-semibold text-[#26352D]">Funcionalidad pendiente</p>
              <p className="mt-1 leading-relaxed">
                Requiere una sesión ciudadana y una consulta segura de expedientes asociados al contribuyente.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E5EBE7] pt-5 sm:flex-row">
              <Button variant="outline" size="sm" disabled title="No disponible en backend">
                <FileDown className="h-4 w-4" /> Descargar comprobante
              </Button>
              <Button variant="secondary" size="sm" disabled title="No disponible en backend">
                <Upload className="h-4 w-4" /> Subir requisito
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#DCE3DE] bg-[#FAFCFB]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBF7EE] text-[#967736]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Estado de cuenta y tributos</CardTitle>
                  <CardDescription className="mt-1">Revise saldos, facturas y obligaciones municipales.</CardDescription>
                </div>
              </div>
              <Badge variant="warning" className="w-fit">Próximamente</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-6 pt-6 sm:pt-6">
            <div className="rounded-xl border border-[#DCE3DE] bg-[#F7FAF8] p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#164B35]" />
                <div>
                  <p className="text-sm font-semibold text-[#26352D]">Protección de información personal</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#607168]">
                    Los estados de cuenta solo estarán disponibles después de validar la identidad
                    del contribuyente. El personal autorizado puede utilizar los módulos internos
                    de pagos y tributos.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E5EBE7] pt-5">
              <Button variant="gold" size="sm" disabled title="Pasarela ciudadana no expuesta en API">
                <CreditCard className="h-4 w-4" /> Pago en línea no disponible
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ServiceOption({
  active = false,
  icon,
  title,
  description,
}: {
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className={
        active
          ? 'flex items-center gap-3 rounded-xl border border-[#164B35]/25 bg-[#E8F0EC] p-4 text-[#164B35] ring-1 ring-[#164B35]/5'
          : 'flex items-center gap-3 rounded-xl border border-[#DCE3DE] bg-[#FAFCFB] p-4 text-[#42534A]'
      }
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">{icon}</div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-[#607168]">{description}</p>
      </div>
    </div>
  );
}

function ProgressStep({
  icon,
  label,
  state = 'pending',
}: {
  icon: React.ReactNode;
  label: string;
  state?: 'done' | 'current' | 'pending';
}) {
  const style =
    state === 'done'
      ? 'border-[#164B35]/25 bg-[#E8F0EC] text-[#164B35]'
      : state === 'current'
        ? 'border-[#B6944A]/40 bg-[#FBF7EE] text-[#8A6C2E]'
        : 'border-[#DCE3DE] bg-[#F7F9F8] text-[#607168]';

  return (
    <div className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-3 text-center ${style}`}>
      {icon}
      <p className="mt-2 text-xs font-semibold">{label}</p>
    </div>
  );
}
