import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { getDefaultRouteForRoles } from '@/features/auth/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/FormField';

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Ingrese su nombre de usuario institucional.')
    .max(50, 'Máximo 50 caracteres.'),
  password: z
    .string()
    .min(1, 'Ingrese su contraseña.')
    .max(200, 'Máximo 200 caracteres.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  if (isAuthenticated && user) {
    const target = getDefaultRouteForRoles(user.roles);
    return <Navigate to={target} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const authenticatedUser = await login(values);
      toast.success(
        `Bienvenido(a), ${authenticatedUser.nombreCompleto || authenticatedUser.userName}`
      );
      const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const target =
        fromPath && fromPath !== '/login'
          ? fromPath
          : getDefaultRouteForRoles(authenticatedUser.roles);
      navigate(target, { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No fue posible iniciar sesión. Verifique sus credenciales.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#F5F7F4]">
      {/* Left Institutional Panel — Identidad Nicoya */}
      <div className="relative flex min-h-[34rem] flex-col justify-between overflow-hidden bg-[#123F2D] p-8 text-white lg:min-h-screen lg:w-5/12 lg:p-12 xl:w-1/2">
        <img
          src="/images/IglesiaNicoya.png"
          alt="Iglesia colonial de San Blas de Nicoya"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0A2A1E]/95 via-[#123F2D]/85 to-[#164B35]/45" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071F16]/95 via-[#123F2D]/25 to-[#071F16]/35" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo2.png"
              alt="Identidad visual de la Municipalidad de Nicoya"
              className="h-14 w-14 shrink-0 rounded-2xl object-contain shadow-lg ring-1 ring-white/25"
            />
            <div>
              <span className="text-xl font-extrabold tracking-wider text-white">SIGEMUN</span>
              <p className="text-xs font-medium text-[#D4B872]">
                Municipalidad de Nicoya · Guanacaste, Costa Rica
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B6944A]/40 bg-[#B6944A]/15 px-3 py-1 text-xs font-semibold text-[#D4B872]">
              <ShieldCheck className="h-3.5 w-3.5" /> Plataforma Integrada de Gestión Municipal
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Sistema de Gestión para la Municipalidad de Nicoya
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Una plataforma segura para gestionar trámites, expedientes, catastro, recaudación y
              servicios municipales desde una experiencia institucional integrada.
            </p>
          </div>
        </div>

      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md rounded-2xl border border-[#DCE3DE] bg-white p-8 shadow-elevated">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F0EC] text-[#164B35]">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#26352D]">Inicio de Sesión Institucional</h2>
            <p className="mt-1 text-xs text-[#5A6B61]">
              Ingrese las credenciales asignadas a su cuenta institucional.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Error de autenticación</p>
                <p className="mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              label="Usuario Institucional"
              htmlFor="username"
              required
              error={errors.username?.message}
            >
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Ej. nombre_usuario"
                  className="pl-9"
                  {...register('username')}
                />
              </div>
            </FormField>

            <FormField
              label="Contraseña"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5A6B61]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-2.5 text-[#5A6B61] hover:text-[#164B35]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Autenticando contra SQL Server...
                </>
              ) : (
                'Ingresar al Sistema SIGEMUN'
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-[#DCE3DE] pt-4 text-center">
            <p className="text-[11px] text-[#5A6B61]">
              Acceso exclusivo para personal autorizado de la Municipalidad de Nicoya.
            </p>
            <p className="mt-2 text-xs text-[#5A6B61]">
              ¿Es contribuyente?{' '}
              <Link to="/portal/login" className="font-semibold text-[#164B35] hover:underline">
                Ingrese al Portal Ciudadano
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

