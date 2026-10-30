import { Navigate, useLocation } from 'react-router-dom';
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
      <div className="mx-auto my-12 max-w-xl rounded-xl border border-[#DCE3DE] bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#26352D]">
          Acceso Restringido por Rol Institucional
        </h2>
        <p className="mt-2 text-sm text-[#5A6B61]">
          Su cuenta actual (<span className="font-semibold text-[#164B35]">{user.userName}</span>) posee
          el rol <span className="font-semibold text-[#26352D]">{user.roles.join(', ')}</span>.
        </p>
        <p className="mt-2 text-xs text-[#5A6B61]">
          Este módulo requiere alguno de los siguientes roles autorizados en el backend:{' '}
          <span className="font-medium text-[#26352D]">{allowedRoles.join(' o ')}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="default">
            <a href={fallbackRoute}>
              <ArrowLeft className="h-4 w-4" /> Ir a mi panel autorizado
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

