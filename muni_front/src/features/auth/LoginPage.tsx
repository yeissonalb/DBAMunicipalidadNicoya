import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound, Lock, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { getDefaultRouteForRoles } from '@/features/auth/permissions';
import {
  consultarCedulaHacienda,
  type HaciendaContribuyenteInfo,
} from '@/services/haciendaCedulaApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/forms/FormField';

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Ingrese su nombre de usuario institucional')
    .max(100),
  password: z
    .string()
    .min(1, 'Ingrese su contraseña')
    .max(200),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Modal de Consulta Rápida de Cédula (API Ministerio de Hacienda)
  const [openHaciendaModal, setOpenHaciendaModal] = useState(false);
  const [cedulaConsulta, setCedulaConsulta] = useState('');
  const [consultandoHacienda, setConsultandoHacienda] = useState(false);
  const [haciendaResult, setHaciendaResult] = useState<HaciendaContribuyenteInfo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const usuario = await login(values);
      toast.success(
        `Bienvenido(a), ${usuario.nombreFuncionario || usuario.nombreCompleto || usuario.userName}`
      );
      const targetRoute = getDefaultRouteForRoles(usuario.roles ?? []);
      navigate(targetRoute, { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo autenticar contra el servidor municipal.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConsultarHacienda = async () => {
    if (!cedulaConsulta.trim()) return;
    setConsultandoHacienda(true);
    try {
      const info = await consultarCedulaHacienda(cedulaConsulta);
      setHaciendaResult(info);
      toast.success(`Contribuyente verificado en Hacienda: ${info.nombreCompleto}`);
    } catch (err) {
      setHaciendaResult(null);
      toast.error(
        err instanceof Error ? err.message : 'Error al consultar la API del Ministerio de Hacienda.'
      );
    } finally {
      setConsultandoHacienda(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col justify-between bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/iglesia-nicoya.jpg')",
      }}
    >
      {/* Capa de contraste institucional sobre la fotografía de la Iglesia Colonial de San Blas de Nicoya */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0F172A]/65 via-[#0F172A]/45 to-[#0F172A]/75" />

      {/* Encabezado Superior Institucional */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <img
            src="/images/escudo-nicoya.jpg"
            alt="Escudo Oficial de Nicoya"
            className="h-12 w-12 rounded-[10px] border border-white/30 bg-white object-contain p-0.5 shadow-md"
          />
          <div className="text-white drop-shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#93C5FD]">
              República de Costa Rica · Provincia de Guanacaste
            </p>
            <p className="text-base font-bold tracking-tight text-white sm:text-lg">
              Municipalidad de Nicoya — SIGEMUN
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpenHaciendaModal(true)}
          className="hidden sm:inline-flex"
        >
          <Search className="h-4 w-4 text-[#1D4ED8]" />
          Verificar Cédula Hacienda
        </Button>
      </header>

      {/* Tarjeta Central de Inicio de Sesión sobre la imagen */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[430px] rounded-[12px] border border-white/40 bg-white/95 p-7 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/images/escudo-nicoya.jpg"
              alt="Escudo Municipalidad de Nicoya"
              className="h-16 w-16 rounded-[12px] border border-[#E5E7EB] bg-white object-contain p-1 shadow-xs"
            />
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-[8px] border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
              <Lock className="h-3 w-3 text-[#1D4ED8]" /> Acceso Oficial SIGEMUN
            </span>
            <h1 className="mt-2.5 text-xl font-bold tracking-tight text-[#171717]">
              Iniciar Sesión Institucional
            </h1>
            <p className="mt-1 text-xs text-[#4B5563]">
              Sistema de Gestión Municipal de Nicoya
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              label="Usuario Institucional"
              htmlFor="username"
              required
              error={errors.username?.message}
            >
              <Input
                id="username"
                placeholder="Ingrese su usuario"
                autoComplete="username"
                error={Boolean(errors.username)}
                {...register('username')}
              />
            </FormField>

            <FormField
              label="Contraseña"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                {...register('password')}
              />
            </FormField>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                <KeyRound className="h-4 w-4" />
                {submitting ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
              </Button>
            </div>
          </form>

          <div className="mt-5 border-t border-[#E5E7EB] pt-4 text-center">
            <button
              type="button"
              onClick={() => setOpenHaciendaModal(true)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:text-[#1E3A8A] hover:underline"
            >
              <Search className="h-3.5 w-3.5" />
              Consultar Cédula en Ministerio de Hacienda (API en línea)
            </button>
          </div>
        </div>
      </main>

      {/* Pie de Página Institucional sobre la imagen */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-white/90 drop-shadow-xs">
        <p className="font-semibold">
          Municipalidad de Nicoya · De la Patria por Nuestra Voluntad (1848)
        </p>
      </footer>

      {/* MODAL: CONSULTA EN VIVO A LA API DE CÉDULAS DEL MINISTERIO DE HACIENDA */}
      <Modal
        open={openHaciendaModal}
        onClose={() => setOpenHaciendaModal(false)}
        title="Consulta Oficial de Cédula — Ministerio de Hacienda CR"
        description="Conexión en tiempo real con https://api.hacienda.go.cr/fe/ae para verificar personas físicas y jurídicas."
      >
        <div className="space-y-4">
          <FormField label="Número de Cédula (Física, Jurídica o DIMEX)" required>
            <div className="flex gap-2">
              <Input
                placeholder="Ej. 508570485 o 3101042026"
                value={cedulaConsulta}
                onChange={(e) => setCedulaConsulta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConsultarHacienda();
                  }
                }}
              />
              <Button
                type="button"
                disabled={consultandoHacienda || !cedulaConsulta.trim()}
                onClick={handleConsultarHacienda}
              >
                <Search className="h-4 w-4" />
                {consultandoHacienda ? 'Consultando...' : 'Consultar'}
              </Button>
            </div>
          </FormField>

          {haciendaResult && (
            <div className="rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#BFDBFE] pb-2">
                <span className="flex items-center gap-1.5 font-bold text-[#1E3A8A]">
                  <ShieldCheck className="h-4 w-4 text-[#1D4ED8]" />
                  Registro Oficial Ministerio de Hacienda
                </span>
                <Badge variant={haciendaResult.moroso ? 'danger' : 'success'}>
                  {haciendaResult.estadoTributario}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-[#4B5563]">Nombre / Razón Social:</p>
                  <p className="text-sm font-bold text-[#171717]">
                    {haciendaResult.nombreCompleto}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4B5563]">Identificación:</p>
                  <p className="font-mono font-bold text-[#171717]">
                    {haciendaResult.identificacionLimpia} (Tipo {haciendaResult.codigoTipoIdentificacion})
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4B5563]">Régimen Tributario:</p>
                  <p className="font-semibold text-[#171717]">
                    {haciendaResult.regimenDescripcion}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4B5563]">Moroso / Omiso:</p>
                  <p className="font-semibold text-[#171717]">
                    Moroso: {haciendaResult.moroso ? 'SÍ' : 'NO'} · Omiso:{' '}
                    {haciendaResult.omiso ? 'SÍ' : 'NO'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4B5563]">Administración:</p>
                  <p className="font-semibold text-[#171717]">
                    {haciendaResult.administracionTributaria}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setOpenHaciendaModal(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
