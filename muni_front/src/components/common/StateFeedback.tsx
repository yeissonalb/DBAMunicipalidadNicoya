import { AlertTriangle, Database, Inbox, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/services/httpClient';

export function LoadingState({ message = 'Consultando datos en SQL Server...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-sigemun-border bg-white p-12 text-center shadow-card">
      <Loader2 className="h-8 w-8 animate-spin text-sigemun-primary" />
      <p className="mt-3 text-sm font-medium text-sigemun-text">{message}</p>
      <p className="mt-1 text-xs text-sigemun-muted">Municipalidad de Nicoya — SIGEMUN</p>
    </div>
  );
}

export function EmptyState({
  title = 'No se encontraron registros',
  description = 'No existen datos que coincidan con los criterios de consulta actuales.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sigemun-border bg-white/80 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sigemun-sky-muted text-sigemun-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-sigemun-text">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-sigemun-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'Error al consultar el backend',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const apiError = error instanceof ApiClientError ? error : null;
  const message =
    error instanceof Error
      ? error.message
      : 'Ocurrió un error inesperado al comunicarse con la API.';
  const isForbidden = apiError?.status === 403;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/80 p-6 text-red-900 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
          {isForbidden ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-red-900">
              {isForbidden ? 'Acceso restringido por Rol en Backend (HTTP 403)' : title}
            </h3>
            {apiError?.sqlErrorCode && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-200/70 px-2 py-0.5 text-xs font-mono font-semibold text-red-900">
                <Database className="h-3 w-3" /> SQL #{apiError.sqlErrorCode}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-red-800">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-800 hover:bg-red-100">
                <RefreshCw className="h-3.5 w-3.5" /> Reintentar consulta
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

