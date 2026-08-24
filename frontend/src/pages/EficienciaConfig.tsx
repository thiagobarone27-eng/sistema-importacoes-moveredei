import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Field";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useAsync } from "../lib/useAsync";
import { eficienciaApi } from "../api/endpoints";
import { EFICIENCIA_ESTILOS } from "../lib/eficienciaColors";
import { ApiError } from "../api/client";
import type { ConfigEficiencia } from "../api/types";

type CamposNumericos = Omit<ConfigEficiencia, "id" | "atualizadoEm">;

const TIERS: Array<{
  codigo: "MUITO_EFICIENTE" | "EFICIENTE" | "REGULAR" | "INEFICIENTE";
  label: string;
  descricao: string;
  overheadKey: keyof CamposNumericos;
  markupKey: keyof CamposNumericos;
}> = [
  {
    codigo: "MUITO_EFICIENTE",
    label: "Muito eficiente",
    descricao: "Overhead e markup abaixo destes limites.",
    overheadKey: "muitoEficienteOverheadMax",
    markupKey: "muitoEficienteMarkupMax",
  },
  {
    codigo: "EFICIENTE",
    label: "Eficiente",
    descricao: "Dentro da faixa esperada de custo de nacionalização.",
    overheadKey: "eficienteOverheadMax",
    markupKey: "eficienteMarkupMax",
  },
  {
    codigo: "REGULAR",
    label: "Atenção",
    descricao: "Merece acompanhamento — overhead começa a pesar no custo final.",
    overheadKey: "regularOverheadMax",
    markupKey: "regularMarkupMax",
  },
  {
    codigo: "INEFICIENTE",
    label: "Ineficiente",
    descricao: "Overhead alto — investigar causas (frete, impostos, agenciamento).",
    overheadKey: "ineficienteOverheadMax",
    markupKey: "ineficienteMarkupMax",
  },
];

export function EficienciaConfig() {
  const config = useAsync(() => eficienciaApi.obterConfig(), []);
  const [form, setForm] = useState<CamposNumericos | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (config.data) {
      const d = config.data;
      setForm({
        muitoEficienteOverheadMax: d.muitoEficienteOverheadMax,
        muitoEficienteMarkupMax: d.muitoEficienteMarkupMax,
        eficienteOverheadMax: d.eficienteOverheadMax,
        eficienteMarkupMax: d.eficienteMarkupMax,
        regularOverheadMax: d.regularOverheadMax,
        regularMarkupMax: d.regularMarkupMax,
        ineficienteOverheadMax: d.ineficienteOverheadMax,
        ineficienteMarkupMax: d.ineficienteMarkupMax,
        diasSemAtualizacaoAlerta: d.diasSemAtualizacaoAlerta,
      });
    }
  }, [config.data]);

  if (config.loading) return <LoadingState label="Carregando configuração..." />;
  if (config.error) return <ErrorState message={config.error} onRetry={config.reload} />;
  if (!form) return null;

  function setCampo(key: keyof CamposNumericos, value: number) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSalvar() {
    if (!form) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      await eficienciaApi.atualizarConfig(form);
      setSucesso(true);
      config.reload();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar configuração.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/eficiencia" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
          <ArrowLeft size={15} /> Voltar para eficiência
        </Link>
        <PageHeader
          title="Configurações de eficiência"
          subtitle="Defina os limiares que classificam cada importação nos 5 níveis de eficiência."
        />
      </div>

      <Card>
        <CardHeader
          title="Limiares por nível"
          subtitle="Uma importação cai no primeiro nível cujos limites de overhead E markup ela não ultrapassa."
        />
        <CardBody className="space-y-4">
          {TIERS.map((tier) => {
            const estilo = EFICIENCIA_ESTILOS[tier.codigo];
            return (
              <div key={tier.codigo} className={`rounded-xl border p-4 ${estilo.border} ${estilo.bg}`}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${estilo.dot}`} />
                  <p className={`text-sm font-semibold ${estilo.text}`}>{tier.label}</p>
                </div>
                <p className="mb-3 text-xs text-ink-500">{tier.descricao}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label hint="ex: 0.4 = 40%">Overhead máximo (fração da invoice)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form[tier.overheadKey]}
                      onChange={(e) => setCampo(tier.overheadKey, Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label hint="ex: 1.4 = custo final até 1,4x a invoice">Markup máximo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form[tier.markupKey]}
                      onChange={(e) => setCampo(tier.markupKey, Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className={`rounded-xl border p-4 ${EFICIENCIA_ESTILOS.MUITO_INEFICIENTE.border} ${EFICIENCIA_ESTILOS.MUITO_INEFICIENTE.bg}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${EFICIENCIA_ESTILOS.MUITO_INEFICIENTE.dot}`} />
              <p className={`text-sm font-semibold ${EFICIENCIA_ESTILOS.MUITO_INEFICIENTE.text}`}>Muito ineficiente</p>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Automático: qualquer importação acima dos limites de "Ineficiente" definidos acima.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Alertas" subtitle="Regras gerais de acompanhamento" />
        <CardBody>
          <div className="max-w-sm">
            <Label hint="dias sem nenhuma atualização de status/campos">Alerta de inatividade</Label>
            <Input
              type="number"
              min="1"
              value={form.diasSemAtualizacaoAlerta}
              onChange={(e) => setCampo("diasSemAtualizacaoAlerta", Number(e.target.value))}
            />
          </div>
        </CardBody>
      </Card>

      {erro && (
        <div className="rounded-xl border border-bad-200 bg-bad-50 px-4 py-3 text-sm font-medium text-bad-700">{erro}</div>
      )}
      {sucesso && (
        <div className="rounded-xl border border-good-200 bg-good-50 px-4 py-3 text-sm font-medium text-good-700">
          Configuração salva com sucesso.
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSalvar} loading={salvando} icon={salvando ? <Loader2 size={15} /> : <Check size={15} />}>
          Salvar configuração
        </Button>
      </div>
    </div>
  );
}
