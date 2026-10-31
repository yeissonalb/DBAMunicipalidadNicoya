import { Building2, CreditCard, ExternalLink, FileText, Globe, IdCard, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Página informativa para funcionarios. El portal real vive en /portal con sesión propia del
 * contribuyente (POST /api/auth/ciudadano/login), de modo que ningún endpoint administrativo
 * queda expuesto a los ciudadanos.
 */
export function PortalCiudadanoPage() {
  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      <PageHeader
        title="Portal Ciudadano en Línea"
        subtitle="Autoservicio para que los contribuyentes consulten trámites, propiedades y obligaciones."
        badge="Servicio habilitado"
        icon={<Globe className="h-6 w-6" />}
        actions={
          <Button size="sm" asChild>
            <a href="/portal/login" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Abrir portal ciudadano
            </a>
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          [<FileText key="i" className="h-5 w-5" />, 'Mis trámites', 'Avance (Radicado → Resolución), historial, requisitos y subida de documentos faltantes.'],
          [<Building2 key="i" className="h-5 w-5" />, 'Mis inmuebles', 'Fincas a su nombre, porcentaje de participación y valor fiscal.'],
          [<CreditCard key="i" className="h-5 w-5" />, 'Estado de cuenta', 'Obligaciones, facturas, comprobante imprimible y pago en línea con SINPE Móvil.'],
        ].map(([icon, titulo, desc]) => (
          <Card key={titulo as string}>
            <CardHeader className="flex flex-row items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EC] text-[#164B35]">
                {icon}
              </div>
              <div>
                <CardTitle className="text-base">{titulo}</CardTitle>
                <CardDescription className="mt-1">{desc}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Cómo ingresa un contribuyente?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[#42534A]">
          <p className="flex items-start gap-2">
            <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-[#164B35]" />
            La primera vez elige <strong>«Activar mi cuenta»</strong> e indica su cédula y el correo
            que tiene registrado en el padrón municipal, y define una contraseña (mínimo 8 caracteres).
          </p>
          <p className="flex items-start gap-2">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#164B35]" />
            Luego inicia sesión con cédula y contraseña. Si el correo del padrón está desactualizado,
            actualícelo en <strong>Padrón de Contribuyentes</strong> antes de que active la cuenta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
