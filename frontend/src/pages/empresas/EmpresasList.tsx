import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useAsync } from "../../lib/useAsync";
import { dashboardApi, empresasApi } from "../../api/endpoints";
import { formatCurrency, formatNumber } from "../../lib/format";

export function EmpresasList() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const empresas = useAsync(() => empresasApi.listar(), []);
  const dashboard = useAsync(() => dashboardApi.obter(), []);

  const linhas = useMemo(() => {
    const resumoPorId = new Map(
      (dashboard.data?.series.porEmpresa ?? []).map((e) => [
        e.empresaId,
        { valorTotal: e.valorTotal, invoiceValor: e.invoiceValor, quantidadeImportacoes: e.quantidadeImportacoes },
      ])
    );
    return (empresas.data ?? [])
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        resumo: resumoPorId.get(e.id) ?? { valorTotal: 0, invoiceValor: 0, quantidadeImportacoes: 0 },
      }))
      .filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()))
      .sort((a, b) => b.resumo.valorTotal - a.resumo.valorTotal);
  }, [empresas.data, dashboard.data, busca]);

  const loading = empresas.loading || dashboard.loading;
  const error = empresas.error || dashboard.error;

  return (
    <div className="space-y-6">
      <PageHeader title="Empresas" subtitle="Análise consolidada por empresa/cliente." />

      <Card>
        <CardBody>
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar empresa..." className="pl-9" />
          </div>
        </CardBody>
      </Card>

      {loading && <LoadingState label="Carregando empresas..." />}
      {error && <ErrorState message={error} />}

      {!loading && linhas.length === 0 && <EmptyState title="Nenhuma empresa encontrada" />}

      {!loading && linhas.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {linhas.map((e) => (
            <button
              key={e.id}
              onClick={() => navigate(`/empresas/${e.id}`)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{e.nome}</p>
                  <p className="text-xs text-ink-500">
                    {formatNumber(e.resumo.quantidadeImportacoes)} importaç{e.resumo.quantidadeImportacoes === 1 ? "ão" : "ões"}
                    {" · "}
                    {formatCurrency(e.resumo.valorTotal)}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-ink-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
