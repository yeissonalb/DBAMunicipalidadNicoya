import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Eye, EyeOff, IdCard, Loader2, Lock, Mail, UserPlus } from 'lucide-react';
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
    correoElectronico: z.string().trim().email('Correo electrónico no válido.').max(100),
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
    defaultValues: { identificacion: '', correoElectronico: '', password: '', confirmar: '' },
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
        correoElectronico: v.correoElectronico,
        password: v.password,
      });
      toast.success(res.message || 'Cuenta activada.');
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
      <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
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
        className="absolute right-3 top-2.5 text-[#5A6B61] hover:text-[#164B35]"
        aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F4]">
      <header className="bg-[#123F2D] text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <img src="/images/logo2.png" alt="" className="h-10 w-10 rounded-xl object-contain ring-1 ring-white/25" />
          <div>
            <p className="text-base font-extrabold tracking-wide">Portal Ciudadano</p>
            <p className="text-[11px] text-[#D4B872]">Municipalidad de Nicoya · Guanacaste</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-[#DCE3DE] bg-white p-7 shadow-elevated">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[#F4F7F5] p-1 text-sm font-semibold">
            {(['login', 'activar'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setModo(m);
                  setError(null);
                }}
                className={`rounded-lg px-3 py-2 transition-colors ${
                  modo === m ? 'bg-white text-[#164B35] shadow-sm' : 'text-[#5A6B61] hover:text-[#164B35]'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Activar mi cuenta'}
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
                  <IdCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
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
              <Button type="submit" className="h-11 w-full" disabled={enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar'}
              </Button>
              <p className="text-center text-xs text-[#5A6B61]">
                ¿Primera vez?{' '}
                <button type="button" className="font-semibold text-[#164B35] hover:underline" onClick={() => setModo('activar')}>
                  Active su cuenta
                </button>{' '}
                con la cédula y el correo registrados en la Municipalidad.
              </p>
            </form>
          ) : (
            <form onSubmit={activarForm.handleSubmit(onActivar)} className="space-y-4" noValidate>
              <p className="text-xs text-[#5A6B61]">
                Verificaremos que su cédula y correo coincidan con el padrón municipal. Si su correo
                cambió, actualícelo primero en la plataforma de servicio al cliente.
              </p>
              <FormField
                label="Número de cédula"
                htmlFor="a-ident"
                required
                error={activarForm.formState.errors.identificacion?.message}
              >
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                  <Input id="a-ident" className="pl-9" placeholder="Ej. 5-0321-0456" {...activarForm.register('identificacion')} />
                </div>
              </FormField>
              <FormField
                label="Correo registrado"
                htmlFor="a-mail"
                required
                error={activarForm.formState.errors.correoElectronico?.message}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                  <Input id="a-mail" type="email" className="pl-9" {...activarForm.register('correoElectronico')} />
                </div>
              </FormField>
              <FormField
                label="Nueva contraseña"
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
              <Button type="submit" className="h-11 w-full" disabled={enviando}>
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Activar cuenta
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-[#DCE3DE] pt-4 text-center text-[11px] text-[#5A6B61]">
            ¿Es funcionario municipal?{' '}
            <Link to="/login" className="font-semibold text-[#164B35] hover:underline">
              Acceso institucional
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
