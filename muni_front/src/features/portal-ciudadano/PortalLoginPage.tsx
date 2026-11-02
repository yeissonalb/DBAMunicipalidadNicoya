import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Eye, EyeOff, IdCard, KeyRound, Loader2, Lock, Mail, UserPlus } from 'lucide-react';
import { usePortalAuth } from './PortalAuth';
import { portalAuthApi } from '@/services/portalApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/FormField';

const loginSchema = z.object({
  identificacion: z.string().trim().min(1, 'Ingrese su número de cédula.').max(50),
  password: z.string().min(1, 'Ingrese su contraseña.').max(200),
});

const activarSchema = z
  .object({
    identificacion: z.string().trim().min(1, 'Ingrese su número de cédula.').max(50),
    codigoActivacion: z.string().trim().min(4, 'Ingrese el PIN o código de activación de un solo uso emitido por el funcionario.').max(64),
    correoElectronico: z.string().trim().email('Correo electrónico no válido.').max(100).optional().or(z.literal('')),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(200),
    confirmar: z.string(),
  })
  .refine((v) => v.password === v.confirmar, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmar'],
  });

type LoginValues = z.infer<typeof loginSchema>;
type ActivarValues = z.infer<typeof activarSchema>;

export function PortalLoginPage() {
  const { isAuthenticated, login } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modo, setModo] = useState<'login' | 'activar'>('login');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activada, setActivada] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identificacion: '', password: '' },
  });
  const activarForm = useForm<ActivarValues>({
    resolver: zodResolver(activarSchema),
    defaultValues: { identificacion: '', codigoActivacion: '', correoElectronico: '', password: '', confirmar: '' },
  });

  if (isAuthenticated) return <Navigate to="/portal" replace />;

  const onLogin = async (v: LoginValues) => {
    setError(null);
    try {
      const c = await login(v);
      toast.success(`Bienvenido(a), ${c.nombreORazonSocial ?? c.identificacion}`);
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      navigate(from && from.startsWith('/portal') && from !== '/portal/login' ? from : '/portal', {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    }
  };

  const onActivar = async (v: ActivarValues) => {
    setError(null);
    try {
      const res = await portalAuthApi.activar({
        identificacion: v.identificacion,
        codigoActivacion: v.codigoActivacion,
        correoElectronico: v.correoElectronico || undefined,
        password: v.password,
      });
      toast.success(res.message || 'Cuenta ciudadana activada exitosamente.');
      setActivada(true);
      loginForm.reset({ identificacion: v.identificacion, password: '' });
      activarForm.reset();
      setModo('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible activar la cuenta.');
    }
  };

  const enviando = loginForm.formState.isSubmitting || activarForm.formState.isSubmitting;

  const campoPassword = (registro: UseFormRegisterReturn, id: string, auto: string) => (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
      <Input
        id={id}
        type={verPassword ? 'text' : 'password'}
        autoComplete={auto}
        placeholder="••••••••"
        className="pl-9 pr-10"
        {...registro}
      />
      <button
        type="button"
        onClick={() => setVerPassword((s) => !s)}
        className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#1D4ED8]"
        aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div
      className="relative flex min-h-screen w-full flex-col justify-between bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/iglesia-nicoya.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-[2px]" />
      <header className="relative z-10 border-b border-white/10 bg-[#0F172A]/80 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/images/escudo-nicoya.jpg" alt="" className="h-10 w-10 rounded-[10px] border border-white/20 bg-white object-contain p-0.5" />
            <img src="/images/nicoya-azul.jpg" alt="Nicoya Azul" className="hidden h-9 w-auto max-w-[130px] rounded-[6px] object-contain sm:block" />
            <div className="border-l border-white/20 pl-3">
              <p className="text-sm font-bold text-white">Portal de Contribuyentes</p>
              <p className="text-[11px] text-[#93C5FD]">Municipalidad de Nicoya · Guanacaste</p>
            </div>
          </div>
          <Link to="/login" className="text-xs font-semibold text-white/80 hover:text-white hover:underline">
            Acceso Funcionarios &rarr;
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-2xl">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-[12px] border border-[#CBD5E1] bg-[#F1F5F9] p-1.5 text-sm font-bold shadow-xs">
            {(['login', 'activar'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setModo(m);
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-[9px] py-2.5 px-3 text-xs font-bold transition-all ${
                  modo === m
                    ? 'bg-[#1D4ED8] text-white shadow-md ring-1 ring-[#1D4ED8]'
                    : 'bg-white text-[#374151] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#1D4ED8]'
                }`}
              >
                {m === 'login' ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Iniciar sesión</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Activar mi cuenta</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {activada && modo === 'login' && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Su cuenta quedó activa. Ingrese con su cédula y la contraseña que acaba de crear.
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          {modo === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" noValidate>
              <FormField
                label="Número de cédula"
                htmlFor="p-ident"
                required
                error={loginForm.formState.errors.identificacion?.message}
              >
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
                  <Input
                    id="p-ident"
                    autoComplete="username"
                    placeholder="Ej. 5-0321-0456"
                    className="pl-9"
                    {...loginForm.register('identificacion')}
                  />
                </div>
              </FormField>
              <FormField
                label="Contraseña"
                htmlFor="p-pass"
                required
                error={loginForm.formState.errors.password?.message}
              >
                {campoPassword(loginForm.register('password'), 'p-pass', 'current-password')}
              </FormField>
              <Button type="submit" className="h-11 w-full bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white font-bold" disabled={enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar al Portal'}
              </Button>
              <p className="text-center text-xs text-[#6B7280]">
                ¿Tiene un código de activación emitido en ventanilla?{' '}
                <button type="button" className="font-semibold text-[#1D4ED8] hover:underline" onClick={() => setModo('activar')}>
                  Active su cuenta
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={activarForm.handleSubmit(onActivar)} className="space-y-4" noValidate>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-blue-700" /> Activación asistida y segura
                </p>
                <p>
                  Para activar su cuenta ingrese su número de identificación oficial y el código PIN de un solo uso
                  emitido por un funcionario autorizado en ventanilla municipal.
                </p>
              </div>
              <FormField
                label="Número de cédula oficial"
                htmlFor="a-ident"
                required
                error={activarForm.formState.errors.identificacion?.message}
              >
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
                  <Input id="a-ident" className="pl-9" placeholder="Ej. 5-0321-0456" {...activarForm.register('identificacion')} />
                </div>
              </FormField>
              <FormField
                label="Código o PIN de activación asistida"
                htmlFor="a-token"
                required
                error={activarForm.formState.errors.codigoActivacion?.message}
              >
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
                  <Input id="a-token" className="pl-9 uppercase font-mono tracking-wider font-semibold" placeholder="Ej. ACT-NIC-A1B2C3D4" {...activarForm.register('codigoActivacion')} />
                </div>
              </FormField>
              <FormField
                label="Correo de contacto (Opcional)"
                htmlFor="a-mail"
                error={activarForm.formState.errors.correoElectronico?.message}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
                  <Input id="a-mail" type="email" className="pl-9" placeholder="correo@ejemplo.com" {...activarForm.register('correoElectronico')} />
                </div>
              </FormField>
              <FormField
                label="Establecer contraseña personal"
                htmlFor="a-pass"
                required
                error={activarForm.formState.errors.password?.message}
              >
                {campoPassword(activarForm.register('password'), 'a-pass', 'new-password')}
              </FormField>
              <FormField
                label="Confirmar contraseña"
                htmlFor="a-conf"
                required
                error={activarForm.formState.errors.confirmar?.message}
              >
                {campoPassword(activarForm.register('confirmar'), 'a-conf', 'new-password')}
              </FormField>
              <Button type="submit" className="h-11 w-full bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white font-bold" disabled={enviando}>
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Activar mi Cuenta Ciudadana
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-[#E5E7EB] pt-4 text-center text-[11px] text-[#6B7280]">
            ¿Es funcionario municipal?{' '}
            <Link to="/login" className="font-semibold text-[#1D4ED8] hover:underline">
              Acceso institucional
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
