import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({ label = "Carregando dados..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <Loader2 size={26} className="animate-spin text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-bad-200 bg-bad-50 px-6 py-12 text-center">
      <AlertTriangle size={26} className="text-bad-600" />
      <div>
        <p className="text-sm font-medium text-bad-700">Não foi possível carregar os dados</p>
        <p className="mt-1 text-sm text-bad-600">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw size={14} />}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Nenhum resultado encontrado",
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-ink-50 px-6 py-14 text-center">
      <Inbox size={28} className="text-ink-400" />
      <p className="text-sm font-medium text-ink-600">{title}</p>
      {message && <p className="max-w-sm text-sm text-ink-400">{message}</p>}
      {action}
    </div>
  );
}

/** Skeleton simples reutilizavel (linhas cinza pulsando). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ink-200 ${className}`} />;
}

export function KpiSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-28" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
