import * as React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Lock } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';

export interface SecurityWarningStep {
  title: string;
  description: string;
  warningNote?: string;
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  isPending?: boolean;
  /**
   * Si se activa `multiStepSecurity` (o se proveen `securitySteps`), el diálogo
   * exige superar 3 pasos secuenciales de advertencia de seguridad/integridad
   * antes de ejecutar la acción crítica (ej. Matriz RBAC, Cambio de Rol/Estado, Restauración DBA).
   */
  multiStepSecurity?: boolean;
  securitySteps?: SecurityWarningStep[];
  impactSummary?: React.ReactNode;
}

const DEFAULT_SECURITY_STEPS: SecurityWarningStep[] = [
  {
    title: 'Advertencia 1 de 3 — Impacto en la Seguridad Institucional',
    description:
      'Está a punto de modificar parámetros de control de acceso o integridad del Sistema de Gestión Municipal de Nicoya (SIGEMUN). Este cambio afectará de forma inmediata las capacidades operativas de los usuarios vinculados.',
    warningNote:
      'Verifique que la solicitud cuente con respaldo administrativo o autorización de Gobernanza TI / DBA.',
  },
  {
    title: 'Advertencia 2 de 3 — Principio de Mínimo Privilegio y Segregación',
    description:
      'De acuerdo con las políticas de seguridad de la Municipalidad de Nicoya, ningún rol operativo debe acumular privilegios incompatibles (como recaudar pagos y anular deudas simultáneamente, o administrar la matriz sin supervisión).',
    warningNote:
      'Esta operación quedará registrada de forma inmutable en la Bitácora de Auditoría Forense (dbo.Bitacora_Auditoria) junto con su usuario, fecha exacta y dirección IP.',
  },
  {
    title: 'Advertencia 3 de 3 — Confirmación Explícita e Irreversible',
    description:
      'Confirme por última vez que ha revisado el alcance del cambio y asume la responsabilidad funcional sobre la modificación en SQL Server.',
    warningNote:
      'Marque la casilla de verificación inferior para habilitar el botón de aplicación definitiva.',
  },
];

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar cambio',
  cancelLabel = 'Cancelar',
  variant = 'default',
  isPending = false,
  multiStepSecurity = false,
  securitySteps,
  impactSummary,
}: ConfirmDialogProps) {
  const steps = securitySteps && securitySteps.length > 0 ? securitySteps : DEFAULT_SECURITY_STEPS;
  const [currentStep, setCurrentStep] = React.useState(0);
  const [explicitCheck, setExplicitCheck] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setExplicitCheck(false);
    }
  }, [open]);

  if (!multiStepSecurity) {
    return (
      <Modal open={open} onClose={onClose} title={title} description={description}>
        <div className="space-y-4">
          {impactSummary && (
            <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-xs text-[#171717]">
              {impactSummary}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const totalSteps = steps.length;
  const activeStep = steps[currentStep] ?? steps[0];
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description || 'Protocolo obligatorio de verificación de seguridad en 3 pasos'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Indicador de progreso de los 3 pasos */}
        <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          {steps.map((_, idx) => {
            const done = idx < currentStep;
            const current = idx === currentStep;
            return (
              <div key={idx} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? 'bg-[#15803D] text-white'
                      : current
                      ? 'bg-[#171717] text-white ring-4 ring-[#1D4ED8]/15'
                      : 'border border-[#D1D5DB] bg-white text-[#6B7280]'
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs font-semibold ${
                      current ? 'text-[#171717]' : 'text-[#6B7280]'
                    }`}
                  >
                    Advertencia {idx + 1}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tarjeta del paso actual */}
        <div
          className={`rounded-[10px] border p-4 ${
            isLastStep
              ? 'border-[#FECACA] bg-[#FEF2F2]'
              : currentStep === 1
              ? 'border-[#BFDBFE] bg-[#EFF6FF]'
              : 'border-[#FDE68A] bg-[#FFFBEB]'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                isLastStep
                  ? 'bg-[#DC2626] text-white'
                  : currentStep === 1
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-[#B45309] text-white'
              }`}
            >
              {isLastStep ? (
                <Lock className="h-4 w-4" />
              ) : currentStep === 1 ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-[#171717]">{activeStep.title}</h4>
                <Badge variant={isLastStep ? 'danger' : currentStep === 1 ? 'blue' : 'warning'}>
                  Paso {currentStep + 1} de {totalSteps}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed text-[#171717]">{activeStep.description}</p>
              {activeStep.warningNote && (
                <p className="pt-1 text-xs font-semibold text-[#4B5563]">
                  • {activeStep.warningNote}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Resumen del impacto */}
        {impactSummary && (
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 text-xs text-[#171717]">
            <p className="mb-1.5 font-bold uppercase tracking-wider text-[#4B5563]">
              Detalle de la modificación solicitada:
            </p>
            {impactSummary}
          </div>
        )}

        {/* Casilla obligatoria en el paso 3 */}
        {isLastStep && (
          <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#D1D5DB] bg-[#F8FAFC] p-3.5 text-xs font-semibold text-[#171717]">
            <input
              type="checkbox"
              checked={explicitCheck}
              onChange={(e) => setExplicitCheck(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] accent-[#171717]"
            />
            <span>
              He leído las 3 advertencias de seguridad e integridad y confirmo que deseo ejecutar
              este cambio de manera definitiva en el sistema municipal.
            </span>
          </label>
        )}

        {/* Botones de navegación entre las 3 advertencias */}
        <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              >
                Paso anterior
              </Button>
            )}

            {!isLastStep ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
              >
                Entendido, siguiente advertencia ({currentStep + 2}/{totalSteps})
              </Button>
            ) : (
              <Button
                type="button"
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                disabled={!explicitCheck || isPending}
                onClick={onConfirm}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Aplicando cambio...
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

