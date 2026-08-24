import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: number; label?: string } | null;
  tone?: "brand" | "good" | "warn" | "bad" | "info" | "neutral";
}

const TONE_STYLES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-700",
  good: "bg-good-50 text-good-700",
  warn: "bg-warn-50 text-warn-700",
  bad: "bg-bad-50 text-bad-700",
  info: "bg-info-50 text-info-700",
  neutral: "bg-ink-100 text-ink-600",
};

export function KpiCard({ label, value, icon: Icon, hint, trend, tone = "brand" }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONE_STYLES[tone]}`}>
          <Icon size={15} strokeWidth={2} />
        </div>
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink-500">{label}</p>
      </div>
      <p
        className="mt-2 text-lg font-semibold leading-tight tracking-tight text-ink-900 sm:text-xl"
        style={{ overflowWrap: "anywhere" }}
      >
        {value}
      </p>
      {(hint || trend) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend.value >= 0 ? "text-good-600" : "text-bad-600"
              }`}
            >
              {trend.value >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-ink-400">{hint}</span>}
        </div>
      )}
    </div>
  );
}
