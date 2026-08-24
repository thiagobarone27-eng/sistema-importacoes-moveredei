import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import type { Empresa, Fornecedor, Produto, StatusImportacao } from "../../api/types";
import { useFiltrosUrl } from "../../lib/useFiltros";
import { Input, Select } from "../ui/Field";
import { Button } from "../ui/Button";
import { ORDEM_EFICIENCIA, EFICIENCIA_LABELS_LIMPOS } from "../../lib/eficienciaColors";

export type CampoFiltro =
  | "q"
  | "empresa"
  | "produto"
  | "status"
  | "fornecedor"
  | "pais"
  | "periodo"
  | "valor"
  | "eficiencia";

interface FiltrosPanelProps {
  campos: CampoFiltro[];
  empresas: Empresa[];
  produtos: Produto[];
  status: StatusImportacao[];
  fornecedores?: Fornecedor[];
}

export function FiltrosPanel({ campos, empresas, produtos, status, fornecedores = [] }: FiltrosPanelProps) {
  const { filtros, setFiltro, limparFiltros, temFiltrosAtivos } = useFiltrosUrl();
  const [busca, setBusca] = useState(filtros.q ?? "");

  const paisesDisponiveis = Array.from(
    new Set(fornecedores.map((f) => f.pais).filter((p): p is string => Boolean(p)))
  ).sort();

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <Filter size={15} className="text-brand-600" />
          Filtros
        </div>
        {temFiltrosAtivos && (
          <Button variant="ghost" size="sm" onClick={limparFiltros} icon={<X size={13} />}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {campos.includes("q") && (
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setFiltro("q", busca);
                }}
                onBlur={() => setFiltro("q", busca)}
                placeholder="Buscar por processo, empresa, produto, fornecedor..."
                className="pl-9"
              />
            </div>
          </div>
        )}

        {campos.includes("empresa") && (
          <Select
            value={filtros.empresaId ?? ""}
            onChange={(e) => setFiltro("empresaId", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas as empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </Select>
        )}

        {campos.includes("produto") && (
          <Select
            value={filtros.produtoId ?? ""}
            onChange={(e) => setFiltro("produtoId", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        )}

        {campos.includes("status") && (
          <Select
            value={filtros.statusId ?? ""}
            onChange={(e) => setFiltro("statusId", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todos os status</option>
            <optgroup label="Fluxo">
              {status
                .filter((s) => s.categoria === "fluxo")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Exceção">
              {status
                .filter((s) => s.categoria === "excecao")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </optgroup>
          </Select>
        )}

        {campos.includes("fornecedor") && (
          <Select
            value={filtros.fornecedorId ?? ""}
            onChange={(e) => setFiltro("fornecedorId", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todos os fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        )}

        {campos.includes("pais") && (
          <Select value={filtros.pais ?? ""} onChange={(e) => setFiltro("pais", e.target.value || undefined)}>
            <option value="">Todos os países</option>
            {paisesDisponiveis.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        )}

        {campos.includes("eficiencia") && (
          <Select
            value={filtros.eficiencia ?? ""}
            onChange={(e) => setFiltro("eficiencia", e.target.value || undefined)}
          >
            <option value="">Todos os níveis</option>
            {ORDEM_EFICIENCIA.map((codigo) => (
              <option key={codigo} value={codigo}>
                {EFICIENCIA_LABELS_LIMPOS[codigo]}
              </option>
            ))}
          </Select>
        )}

        {campos.includes("periodo") && (
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
            <Input
              type="date"
              value={filtros.dataInicio ?? ""}
              onChange={(e) => setFiltro("dataInicio", e.target.value || undefined)}
              aria-label="Data início"
            />
            <span className="shrink-0 text-xs text-ink-400">até</span>
            <Input
              type="date"
              value={filtros.dataFim ?? ""}
              onChange={(e) => setFiltro("dataFim", e.target.value || undefined)}
              aria-label="Data fim"
            />
          </div>
        )}

        {campos.includes("valor") && (
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Valor mín. (R$)"
              defaultValue={filtros.valorMin ?? ""}
              onBlur={(e) => setFiltro("valorMin", e.target.value ? Number(e.target.value) : undefined)}
            />
            <span className="shrink-0 text-xs text-ink-400">até</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Valor máx. (R$)"
              defaultValue={filtros.valorMax ?? ""}
              onBlur={(e) => setFiltro("valorMax", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { useFiltrosUrl };
