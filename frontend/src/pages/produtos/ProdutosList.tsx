import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useAsync } from "../../lib/useAsync";
import { dashboardApi, produtosApi } from "../../api/endpoints";
import { formatCurrency, formatNumber } from "../../lib/format";

export function ProdutosList() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const produtos = useAsync(() => produtosApi.listar(), []);
  const dashboard = useAsync(() => dashboardApi.obter(), []);

  const linhas = useMemo(() => {
    const resumoPorId = new Map(
      (dashboard.data?.series.porProduto ?? []).map((p) => [
        p.produtoId,
        { valorTotal: p.valorTotal, invoiceValor: p.invoiceValor, quantidadeImportacoes: p.quantidadeImportacoes },
      ])
    );
    return (produtos.data ?? [])
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        resumo: resumoPorId.get(p.id) ?? { valorTotal: 0, invoiceValor: 0, quantidadeImportacoes: 0 },
      }))
      .filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase()))
      .sort((a, b) => b.resumo.valorTotal - a.resumo.valorTotal);
  }, [produtos.data, dashboard.data, busca]);

  const loading = produtos.loading || dashboard.loading;
  const error = produtos.error || dashboard.error;

  return (
    <div className="space-y-6">
      <PageHeader title="Produtos" subtitle="Análise consolidada por produto importado." />

      <Card>
        <CardBody>
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
          </div>
        </CardBody>
      </Card>

      {loading && <LoadingState label="Carregando produtos..." />}
      {error && <ErrorState message={error} />}

      {!loading && linhas.length === 0 && <EmptyState title="Nenhum produto encontrado" />}

      {!loading && linhas.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {linhas.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/produtos/${p.id}`)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Boxes size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{p.nome}</p>
                  <p className="text-xs text-ink-500">
                    {formatNumber(p.resumo.quantidadeImportacoes)} importaç{p.resumo.quantidadeImportacoes === 1 ? "ão" : "ões"}
                    {" · "}
                    {formatCurrency(p.resumo.valorTotal)}
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
