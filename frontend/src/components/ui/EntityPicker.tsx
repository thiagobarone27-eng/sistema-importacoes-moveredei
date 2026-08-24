import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";

export interface EntityOption {
  id: number;
  nome: string;
  hint?: string | null;
}

interface EntityPickerProps {
  options: EntityOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  onCreate?: (nome: string) => Promise<EntityOption>;
  placeholder?: string;
  disabled?: boolean;
  creating?: boolean;
  createLabel?: string;
}

/**
 * Campo de busca/autocomplete que permite selecionar um registro existente
 * (empresa, produto, fornecedor) OU criar um novo inline via callback
 * `onCreate`, sem sair da tela.
 */
export function EntityPicker({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Buscar...",
  disabled,
  createLabel = "Cadastrar",
}: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [termo, setTermo] = useState("");
  const [criando, setCriando] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selecionado = options.find((o) => o.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTermo("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtrados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => o.nome.toLowerCase().includes(t));
  }, [options, termo]);

  const podeCriar =
    Boolean(onCreate) &&
    termo.trim().length > 0 &&
    !options.some((o) => o.nome.toLowerCase() === termo.trim().toLowerCase());

  async function handleCriar() {
    if (!onCreate) return;
    setCriando(true);
    try {
      const criado = await onCreate(termo.trim());
      onChange(criado.id);
      setOpen(false);
      setTermo("");
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-ink-300 bg-white px-3 py-2 text-left text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-100 disabled:text-ink-400"
      >
        <span className={`truncate ${selecionado ? "" : "text-ink-400"}`}>
          {selecionado ? selecionado.nome : placeholder}
        </span>
        <ChevronDown size={15} className="shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-ink-100 px-2.5 py-2">
            <Search size={14} className="shrink-0 text-ink-400" />
            <input
              autoFocus
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Digite para buscar ou criar..."
              className="w-full text-sm text-ink-800 outline-none placeholder:text-ink-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtrados.length === 0 && !podeCriar && (
              <p className="px-3 py-2.5 text-sm text-ink-400">Nenhum resultado.</p>
            )}
            {filtrados.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setTermo("");
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50"
              >
                <span className="min-w-0">
                  <span className="block truncate">{opt.nome}</span>
                  {opt.hint && <span className="block truncate text-xs text-ink-400">{opt.hint}</span>}
                </span>
                {opt.id === value && <Check size={15} className="shrink-0 text-brand-600" />}
              </button>
            ))}
            {podeCriar && (
              <button
                type="button"
                onClick={handleCriar}
                disabled={criando}
                className="flex w-full items-center gap-2 border-t border-ink-100 px-3 py-2.5 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                {criando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {createLabel} "{termo.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
