import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, ClipboardList, History, Pencil } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { StatusFlow } from "../../components/importacoes/StatusFlow";
import { StatusChanger } from "../../components/importacoes/StatusChanger";
import { IndicadoresGrid } from "../../components/importacoes/IndicadoresGrid";
import { EfficiencyBadge } from "../../components/ui/EfficiencyBadge";
import { Modal } from "../../components/ui/Modal";
import { useAsync } from "../../lib/useAsync";
import { useAuth } from "../../lib/AuthContext";
import { importacoesApi, statusApi } from "../../api/endpoints";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "../../lib/format";

type Aba = "status" | "alteracoes";

const CAMPO_LABEL: Record<string, string> = {
  numeroProcesso: "Número do processo",
  empresaId: "Empresa",
  produtoId: "Produto",
  fornecedorId: "Fornecedor",
  statusId: "Status",
  quantidade: "Quantidade",
  unidade: "Unidade",
  valorUnitarioOriginal: "Valor unitário original",
  cambioDolar: "Câmbio (USD)",
  invoiceValor: "Invoice",
  transporteChina: "Transporte China",
  servicoAdmin: "Serviço administrativo",
  impostoII: "II",
  impostoIPI: "IPI",
  impostoPIS: "PIS",
  impostoCOFINS: "COFINS",
  impostoICMS: "ICMS",
  armazenagem: "Armazenagem",
  taxaDta: "Taxa DTA",
  freteInternacional: "Frete internacional",
  freteRodoviario: "Rodoviário",
  taxasSeguro: "Taxas/seguro",
  siscomex: "TX Siscomex",
  sda: "S.D.A.",
  agenciamento: "Agenciamento",
  outrasDespesas: "Outras despesas",
  cambioFrete: "Câmbio do dia do frete",
  airFreight: "Air freight",
  desconsolidacao: "Desconsolidação",
  taxaLiberacao: "Taxa de liberação",
  docFeeOrigin: "Doc fee origin",
  customsOrigin: "Customs origin",
  pickUp: "Pick up",
  palletFee: "Pallet fee",
  exportLicense: "Export license",
  devolucaoVazio: "Devolução vazio",
  lavagem: "Lavagem",
  fichaEmergencia: "Ficha de emergência",
  impostosFederais: "Impostos federais",
  afrmm: "AFRMM",
  honorarios: "Honorários",
  licenciamento: "Licenciamento",
  dataCompra: "Data de compra",
  dataPrevistaEmbarque: "Data prevista de embarque",
  dataEmbarque: "Data de embarque",
  dataChegada: "Data de chegada",
  dataNacionalizacao: "Data de nacionalização",
  paisOrigem: "País de origem",
  observacoes: "Observações",
  arquivadoEm: "Arquivado em",
};

export function ImportacaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const importacaoId = Number(id);
  const [aba, setAba] = useState<Aba>("status");
  const [confirmandoArquivar, setConfirmandoArquivar] = useState(false);
  const [arquivando, setArquivando] = useState(false);

  const importacao = useAsync(() => importacoesApi.obter(importacaoId), [importacaoId]);
  const todosStatus = useAsync(() => statusApi.listar(), []);
  const historicoStatus = useAsync(() => importacoesApi.historicoStatus(importacaoId), [importacaoId]);
  const historicoAlteracoes = useAsync(() => importacoesApi.historicoAlteracoes(importacaoId), [importacaoId]);

  async function handleMudarStatus(statusId: number, observacao?: string) {
    await importacoesApi.mudarStatus(importacaoId, statusId, observacao);
    importacao.reload();
    historicoStatus.reload();
  }

  async function handleArquivar() {
    setArquivando(true);
    try {
      await importacoesApi.arquivar(importacaoId);
      navigate("/importacoes");
    } finally {
      setArquivando(false);
      setConfirmandoArquivar(false);
    }
  }

  if (importacao.loading || todosStatus.loading) {
    return <LoadingState label="Carregando importação..." />;
  }
  if (importacao.error) {
    return <ErrorState message={importacao.error} onRetry={importacao.reload} />;
  }
  const imp = importacao.data;
  if (!imp) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/importacoes" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
          <ArrowLeft size={15} /> Voltar para importações
        </Link>
        <PageHeader
          title={imp.numeroProcesso ?? `Importação #${imp.id}`}
          subtitle={`${imp.empresa.nome} · ${imp.produto.nome}${imp.fornecedor ? ` · ${imp.fornecedor.nome}` : ""}`}
          actions={
            <>
              <EfficiencyBadge classificacao={imp.classificacaoEficiencia} />
              {isAdmin && (
                <Button variant="outline" icon={<Pencil size={15} />} onClick={() => navigate(`/importacoes/${imp.id}/editar`)}>
                  Editar
                </Button>
              )}
              {isAdmin && !imp.arquivadoEm && (
                <Button variant="danger" icon={<Archive size={15} />} onClick={() => setConfirmandoArquivar(true)}>
                  Arquivar
                </Button>
              )}
            </>
          }
        />
      </div>

      {imp.arquivadoEm && (
        <div className="rounded-xl border border-ink-300 bg-ink-100 px-4 py-2.5 text-sm text-ink-600">
          Esta importação foi arquivada em {formatDateTime(imp.arquivadoEm)}.
        </div>
      )}

      <Card>
        <CardHeader title="Fluxo do processo" subtitle="Etapas do processo de importação" />
        <CardBody>
          {todosStatus.data && (
            <StatusFlow
              statusAtual={imp.status}
              todosStatus={todosStatus.data}
              historico={historicoStatus.data ?? []}
            />
          )}
        </CardBody>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader title="Status e exceções" subtitle="Aplique mudanças de status a qualquer momento" />
          <CardBody>
            {todosStatus.data && (
              <StatusChanger statusAtual={imp.status} todosStatus={todosStatus.data} onAplicar={handleMudarStatus} />
            )}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Indicadores calculados" />
          <CardBody>
            <IndicadoresGrid indicadores={imp.indicadores} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Identificação" />
          <CardBody className="space-y-2 text-sm">
            <InfoRow label="Empresa" value={imp.empresa.nome} />
            <InfoRow label="Produto" value={imp.produto.nome} />
            <InfoRow label="Fornecedor" value={imp.fornecedor?.nome ?? "—"} />
            <InfoRow label="País de origem" value={imp.paisOrigem ?? "—"} />
            <InfoRow label="Quantidade" value={`${formatNumber(imp.quantidade)} ${imp.unidade}`} />
            <InfoRow label="Câmbio (USD)" value={imp.cambioDolar ? formatNumber(imp.cambioDolar) : "—"} />
            <InfoRow label="Data de compra" value={formatDate(imp.dataCompra)} />
            <InfoRow label="Previsão de embarque" value={formatDate(imp.dataPrevistaEmbarque)} />
            <InfoRow label="Data de embarque" value={formatDate(imp.dataEmbarque)} />
            <InfoRow label="Data de chegada" value={formatDate(imp.dataChegada)} />
            <InfoRow label="Data de nacionalização" value={formatDate(imp.dataNacionalizacao)} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Custos detalhados" subtitle="Valores brutos lançados no processo" />
        <CardBody>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
            <InfoRow label="Invoice" value={formatCurrency(imp.invoiceValor)} strong />
            <InfoRow label="Câmbio do dia do frete" value={imp.cambioFrete ? formatNumber(imp.cambioFrete) : "—"} />
            <InfoRow label="Transporte China" value={formatCurrency(imp.transporteChina)} />
            <InfoRow label="Frete internacional" value={formatCurrency(imp.freteInternacional)} />
            <InfoRow label="Air freight" value={formatCurrency(imp.airFreight)} />
            <InfoRow label="Rodoviário" value={formatCurrency(imp.freteRodoviario)} />
            <InfoRow label="Armazenagem" value={formatCurrency(imp.armazenagem)} />
            <InfoRow label="Taxa DTA" value={formatCurrency(imp.taxaDta)} />
            <InfoRow label="Taxas/seguro" value={formatCurrency(imp.taxasSeguro)} />
            <InfoRow label="Desconsolidação" value={formatCurrency(imp.desconsolidacao)} />
            <InfoRow label="Taxa de liberação" value={formatCurrency(imp.taxaLiberacao)} />
            <InfoRow label="Doc fee origin" value={formatCurrency(imp.docFeeOrigin)} />
            <InfoRow label="Customs origin" value={formatCurrency(imp.customsOrigin)} />
            <InfoRow label="Pick up" value={formatCurrency(imp.pickUp)} />
            <InfoRow label="Pallet fee" value={formatCurrency(imp.palletFee)} />
            <InfoRow label="Export license" value={formatCurrency(imp.exportLicense)} />
            <InfoRow label="Devolução vazio" value={formatCurrency(imp.devolucaoVazio)} />
            <InfoRow label="Lavagem" value={formatCurrency(imp.lavagem)} />
            <InfoRow label="Ficha de emergência" value={formatCurrency(imp.fichaEmergencia)} />
            <InfoRow label="II" value={formatCurrency(imp.impostoII)} />
            <InfoRow label="IPI" value={formatCurrency(imp.impostoIPI)} />
            <InfoRow label="PIS" value={formatCurrency(imp.impostoPIS)} />
            <InfoRow label="COFINS" value={formatCurrency(imp.impostoCOFINS)} />
            <InfoRow label="ICMS" value={formatCurrency(imp.impostoICMS)} />
            <InfoRow label="Impostos federais" value={formatCurrency(imp.impostosFederais)} />
            <InfoRow label="AFRMM" value={formatCurrency(imp.afrmm)} />
            <InfoRow label="TX Siscomex" value={formatCurrency(imp.siscomex)} />
            <InfoRow label="S.D.A." value={formatCurrency(imp.sda)} />
            <InfoRow label="Agenciamento" value={formatCurrency(imp.agenciamento)} />
            <InfoRow label="Honorários" value={formatCurrency(imp.honorarios)} />
            <InfoRow label="Licenciamento" value={formatCurrency(imp.licenciamento)} />
            <InfoRow label="Serviço administrativo" value={formatCurrency(imp.servicoAdmin)} />
            <InfoRow label="Outras despesas" value={formatCurrency(imp.outrasDespesas)} />
          </div>
          {imp.observacoes && (
            <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2.5 text-sm text-ink-600">{imp.observacoes}</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="flex border-b border-ink-100 px-2">
          <TabButton active={aba === "status"} onClick={() => setAba("status")} icon={<History size={14} />}>
            Histórico de status
          </TabButton>
          <TabButton active={aba === "alteracoes"} onClick={() => setAba("alteracoes")} icon={<ClipboardList size={14} />}>
            Histórico de alterações
          </TabButton>
        </div>
        <CardBody>
          {aba === "status" && (
            <HistoricoStatusTimeline
              loading={historicoStatus.loading}
              error={historicoStatus.error}
              itens={historicoStatus.data ?? []}
            />
          )}
          {aba === "alteracoes" && (
            <HistoricoAlteracoesTable
              loading={historicoAlteracoes.loading}
              error={historicoAlteracoes.error}
              itens={historicoAlteracoes.data ?? []}
            />
          )}
        </CardBody>
      </Card>

      <Modal
        open={confirmandoArquivar}
        onClose={() => setConfirmandoArquivar(false)}
        title="Arquivar importação"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmandoArquivar(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={arquivando} onClick={handleArquivar}>
              Arquivar
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Isso remove a importação das listagens e relatórios ativos (soft delete). Os dados continuam preservados e
          podem ser consultados incluindo arquivadas. Deseja continuar?
        </p>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-ink-100 py-1 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className={strong ? "font-semibold text-ink-800" : "text-ink-700"}>{value}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-700"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function HistoricoStatusTimeline({
  loading,
  error,
  itens,
}: {
  loading: boolean;
  error: string | null;
  itens: import("../../api/types").HistoricoStatusItem[];
}) {
  if (loading) return <LoadingState label="Carregando histórico..." />;
  if (error) return <ErrorState message={error} />;
  if (itens.length === 0) return <p className="py-6 text-center text-sm text-ink-400">Sem histórico de status.</p>;

  return (
    <ol className="space-y-4">
      {[...itens].reverse().map((h) => (
        <li key={h.id} className="flex gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0 flex-1 border-b border-ink-100 pb-4 last:border-0">
            <p className="text-sm text-ink-700">
              {h.statusAnteriorLabel ? (
                <>
                  <span className="font-medium">{h.statusAnteriorLabel}</span> → <span className="font-medium">{h.statusNovoLabel}</span>
                </>
              ) : (
                <>
                  Status inicial definido: <span className="font-medium">{h.statusNovoLabel}</span>
                </>
              )}
            </p>
            {h.observacao && <p className="mt-0.5 text-sm text-ink-500">{h.observacao}</p>}
            <p className="mt-1 text-xs text-ink-400">
              {formatDateTime(h.alteradoEm)} · {h.alteradoPor}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function HistoricoAlteracoesTable({
  loading,
  error,
  itens,
}: {
  loading: boolean;
  error: string | null;
  itens: import("../../api/types").HistoricoAlteracaoItem[];
}) {
  if (loading) return <LoadingState label="Carregando histórico..." />;
  if (error) return <ErrorState message={error} />;
  if (itens.length === 0) return <p className="py-6 text-center text-sm text-ink-400">Sem alterações registradas.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
            <th className="px-3 py-2">Campo</th>
            <th className="px-3 py-2">De</th>
            <th className="px-3 py-2">Para</th>
            <th className="px-3 py-2">Quando</th>
            <th className="px-3 py-2">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {[...itens].reverse().map((h) => (
            <tr key={h.id}>
              <td className="px-3 py-2 font-medium text-ink-700">{CAMPO_LABEL[h.campo] ?? h.campo}</td>
              <td className="px-3 py-2 text-ink-500">{h.valorAntigo ?? "—"}</td>
              <td className="px-3 py-2 text-ink-700">{h.valorNovo ?? "—"}</td>
              <td className="px-3 py-2 text-ink-500">{formatDateTime(h.alteradoEm)}</td>
              <td className="px-3 py-2 text-ink-500">{h.usuario}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
