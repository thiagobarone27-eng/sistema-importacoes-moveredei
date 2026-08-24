import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export interface MultiOption {
  id: number;
  label: string;
  hint?: string;
}

interface MultiPickerProps {
  options: MultiOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  maxSelecionados?: number;
}

export function MultiPicker({ options, value, onChange, placeholder = "Buscar e selecionar...", maxSelecionados }: MultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [termo, setTermo] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtrados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    const base = options.filter((o) => !value.includes(o.id));
    if (!t) return base;
    return base.filter((o) => o.label.toLowerCase().includes(t) || o.hint?.toLowerCase().includes(t));
  }, [options, termo, value]);

  const selecionados = value
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is MultiOption => Boolean(o));

  const atingiuLimite = maxSelecionados !== undefined && value.length >= maxSelecionados;

  return (
    <div ref={rootRef} className="relative">
      <div
        onClick={() => !atingiuLimite && setOpen(true)}
        className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-2.5 py-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100"
      >
        {selecionados.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
          >
            {s.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((v) => v !== s.id));
              }}
              className="rounded-full hover:bg-brand-100"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {!atingiuLimite && (
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={selecionados.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 border-none text-sm text-ink-800 outline-none placeholder:text-ink-400"
          />
        )}
      </div>

      {open && !atingiuLimite && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg">
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-ink-400">
            <Search size={13} />
            <span className="text-[11px]">{filtrados.length} disponíveis</span>
          </div>
          {filtrados.length === 0 && <p className="px-3 py-2.5 text-sm text-ink-400">Nenhum resultado.</p>}
          {filtrados.map((opt) => (
            <button
              type="button"
              key={opt.id}
              onClick={() => {
                onChange([...value, opt.id]);
                setTermo("");
              }}
              className="flex w-full flex-col px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50"
            >
              <span className="truncate">{opt.label}</span>
              {opt.hint && <span className="truncate text-xs text-ink-400">{opt.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
