import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FiltrosPanel } from "../../components/filters/FiltrosPanel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EfficiencyBadge } from "../../components/ui/EfficiencyBadge";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/States";
import { TableShell, Td, Th } from "../../components/ui/Table";
import { useAsync } from "../../lib/useAsync";
import { useFiltrosUrl } from "../../lib/useFiltros";
import { useCatalogos } from "../../lib/useCatalogos";
import { useSort } from "../../lib/useSort";
import { importacoesApi } from "../../api/endpoints";
import { formatCurrency, formatDate, formatMultiplier, formatNumber, formatPercent } from "../../lib/format";
import type { Importacao } from "../../api/types";

function valorOrdenavel(imp: Importacao, key: string): unknown {
  switch (key) {
    case "numeroProcesso":
      return imp.numeroProcesso;
    case "empresa":
      return imp.empresa.nome;
    case "produto":
      return imp.produto.nome;
    case "status":
      return imp.status.ordem;
    case "quantidade":
      return imp.quantidade;
    case "invoiceValor":
      return imp.invoiceValor;
    case "valorTotal":
      return imp.indicadores.valorTotal;
    case "overheadPct":
      return imp.indicadores.overheadPct;
    case "markup":
      return imp.indicadores.markup;
    case "eficiencia":
      return imp.classificacaoEficiencia.codigo;
    case "atualizadoEm":
      return imp.atualizadoEm;
    default:
      return null;
  }
}

export function ImportacoesList() {
  const navigate = useNavigate();
  const { filtros } = useFiltrosUrl();
  const catalogos = useCatalogos();

  const importacoes = useAsync(() => importacoesApi.listar(filtros), [JSON.stringify(filtros)]);

  const { sorted, sortKey, dir, onSort } = useSort<Importacao>(
    importacoes.data ?? [],
    valorOrdenavel,
    "atualizadoEm"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importações"
        subtitle="Todos os processos de importação cadastrados."
        actions={
          <Button icon={<PlusCircle size={16} />} onClick={() => navigate("/importacoes/nova")}>
            Nova importação
          </Button>
        }
      />

      <FiltrosPanel
        campos={["q", "empresa", "produto", "status", "fornecedor", "pais", "periodo", "valor", "eficiencia"]}
        empresas={catalogos.empresas}
        produtos={catalogos.produtos}
        status={catalogos.status}
        fornecedores={catalogos.fornecedores}
      />

      <Card>
        {importacoes.loading && <TableSkeleton rows={8} cols={9} />}
        {importacoes.error && (
          <div className="p-6">
            <ErrorState message={importacoes.error} onRetry={importacoes.reload} />
          </div>
        )}
        {importacoes.data && importacoes.data.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="Nenhuma importação encontrada com esses filtros"
              message="Tente ajustar ou limpar os filtros, ou cadastre uma nova importação."
              action={
                <Button size="sm" variant="outline" onClick={() => navigate("/importacoes/nova")}>
                  Nova importação
                </Button>
              }
            />
          </div>
        )}
        {importacoes.data && importacoes.data.length > 0 && (
          <>
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
              <p className="text-xs text-ink-500">
                {formatNumber(sorted.length)} importaç{sorted.length === 1 ? "ão" : "ões"} encontrada
                {sorted.length === 1 ? "" : "s"}
              </p>
            </div>
            <TableShell>
              <thead>
                <tr>
                  <Th sortKey="numeroProcesso" activeKey={sortKey} dir={dir} onSort={onSort}>
                    Processo
                  </Th>
                  <Th sortKey="empresa" activeKey={sortKey} dir={dir} onSort={onSort}>
                    Empresa
                  </Th>
                  <Th sortKey="produto" activeKey={sortKey} dir={dir} onSort={onSort}>
                    Produto
                  </Th>
                  <Th sortKey="status" activeKey={sortKey} dir={dir} onSort={onSort}>
                    Status
                  </Th>
                  <Th sortKey="quantidade" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                    Qtd.
                  </Th>
                  <Th sortKey="invoiceValor" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                    Invoice
                  </Th>
                  <Th sortKey="valorTotal" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                    Valor total
                  </Th>
                  <Th sortKey="overheadPct" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                    Overhead
                  </Th>
                  <Th sortKey="markup" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                    Markup
                  </Th>
                  <Th sortKey="eficiencia" activeKey={sortKey} dir={dir} onSort={onSort}>
                    Eficiência
                  </Th>
                  <Th sortKey="atualizadoEm" activeKey={sortKey} dir={dir} onSort={onSort}>
                    Atualizado
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {sorted.map((imp) => (
                  <tr
                    key={imp.id}
                    onClick={() => navigate(`/importacoes/${imp.id}`)}
                    className="cursor-pointer hover:bg-brand-50/60"
                  >
                    <Td className="font-medium text-ink-800">{imp.numeroProcesso ?? "—"}</Td>
                    <Td>{imp.empresa.nome}</Td>
                    <Td>{imp.produto.nome}</Td>
                    <Td>
                      <StatusBadge status={imp.status} size="sm" />
                    </Td>
                    <Td align="right">{formatNumber(imp.quantidade)}</Td>
                    <Td align="right">{formatCurrency(imp.invoiceValor)}</Td>
                    <Td align="right" className="font-medium text-ink-800">
                      {formatCurrency(imp.indicadores.valorTotal)}
                    </Td>
                    <Td align="right">{formatPercent(imp.indicadores.overheadPct)}</Td>
                    <Td align="right">{formatMultiplier(imp.indicadores.markup)}</Td>
                    <Td>
                      <EfficiencyBadge classificacao={imp.classificacaoEficiencia} size="sm" />
                    </Td>
                    <Td className="text-ink-500">{formatDate(imp.atualizadoEm)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </>
        )}
      </Card>
    </div>
  );
}
