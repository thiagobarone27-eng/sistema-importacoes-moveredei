import { Check } from "lucide-react";

export interface StepDef {
  label: string;
  description?: string;
}

export function Stepper({ steps, current }: { steps: StepDef[]; current: number }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center">
        {steps.map((step, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex items-center gap-2.5" style={{ minWidth: 160 }}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    active
                      ? "bg-brand-700 text-white"
                      : done
                        ? "bg-good-500 text-white"
                        : "bg-ink-200 text-ink-500"
                  }`}
                >
                  {done ? <Check size={15} /> : idx + 1}
                </div>
                <div className="leading-tight">
                  <p className={`text-sm font-medium ${active ? "text-ink-900" : "text-ink-600"}`}>{step.label}</p>
                  {step.description && <p className="text-xs text-ink-400">{step.description}</p>}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`mx-3 h-0.5 w-10 shrink-0 ${done ? "bg-good-400" : "bg-ink-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
