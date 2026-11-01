import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { getDefaultRouteForRoles } from '@/features/auth/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: readonly string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    const fallbackRoute = getDefaultRouteForRoles(user.roles);
    return (
      <div className="mx-auto my-12 max-w-xl rounded-[12px] border border-[#E5E7EB] bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#171717]">
          Acceso Restringido por Rol Institucional
        </h2>
        <p className="mt-2 text-sm text-[#4B5563]">
          Su cuenta actual (<span className="font-semibold text-[#1E3A8A]">{user.userName}</span>) posee
          el rol <span className="font-semibold text-[#171717]">{user.roles.join(', ')}</span>.
        </p>
        <p className="mt-2 text-xs text-[#6B7280]">
          Este módulo requiere alguno de los siguientes roles autorizados:{' '}
          <span className="font-semibold text-[#171717]">{allowedRoles.join(' o ')}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to={fallbackRoute}>
              <ArrowLeft className="h-4 w-4" /> Ir a mi panel autorizado
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
