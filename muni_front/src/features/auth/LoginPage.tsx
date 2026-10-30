import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
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
      <div className="relative flex flex-col justify-between bg-[#164B35] p-8 text-white lg:w-5/12 xl:w-1/2 lg:p-12 overflow-hidden">
        {/* Decorative architectural silhouette inspired by Parroquia Colonial de San Blas de Nicoya */}
        <div className="pointer-events-none absolute -right-16 -bottom-16 opacity-10">
          <svg width="420" height="420" viewBox="0 0 200 200" fill="none">
            <path
              d="M100 15L135 55H65L100 15ZM60 55H140V185H60V55ZM85 110C85 101.716 91.7157 95 100 95C108.284 95 115 101.716 115 110V185H85V110ZM30 85H60V185H30V85ZM140 85H170V185H140V85Z"
              fill="#B6944A"
            />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B6944A] text-white shadow-md">
              <Landmark className="h-6 w-6" />
            </div>
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
              Acceso unificado con control de seguridad basado en roles (RBAC), trazabilidad de
              expedientes, padrón territorial y catastral, recaudación tributaria, auditoría forense
              y consola técnica de administración de base de datos SQL Server.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <p className="font-bold text-[#D4B872]">Seguridad Criptográfica</p>
            <p className="mt-1 text-white/75">
              Autenticación JWT (HS256) y verificación SHA-256 mediante{' '}
              <code className="text-white">sp_autenticar_usuario</code>.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <p className="font-bold text-[#D4B872]">Integridad Transaccional</p>
            <p className="mt-1 text-white/75">
              Reglas de negocio, copropiedad, facturación y respaldos gobernados por SQL Server.
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
              Ingrese sus credenciales de funcionario municipal autorizadas en{' '}
              <code className="font-mono text-[#164B35]">DB_Municipalidad_Nicoya</code>
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
                  tabIndex={-1}
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
              Conectado a <code className="font-mono text-[#164B35]">POST /api/auth/login</code> ·
              Token JWT con verificación de roles activos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

