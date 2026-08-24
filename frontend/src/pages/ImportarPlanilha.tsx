import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Stepper } from "../components/ui/Stepper";
import { importarPlanilhaApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import type { ImportarPlanilhaResponse } from "../api/types";

const STEPS = [
  { label: "Selecionar arquivo" },
  { label: "Revisar dados" },
  { label: "Confirmar" },
];

export function ImportarPlanilha() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ImportarPlanilhaResponse | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [criadas, setCriadas] = useState<number | null>(null);

  const linhasDuplicadas = new Set((resultado?.duplicidadesDetectadas ?? []).map((d) => d.linha));

  async function handleEnviarArquivo() {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await importarPlanilhaApi.enviar(arquivo);
      setResultado(resp);
      const duplicadas = new Set(resp.duplicidadesDetectadas.map((d) => d.linha));
      setSelecionadas(new Set(resp.linhasValidas.filter((l) => !duplicadas.has(l.linha)).map((l) => l.linha)));
      setStep(1);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao processar a planilha.");
    } finally {
      setEnviando(false);
    }
  }

  function toggleLinha(linha: number) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(linha)) next.delete(linha);
      else next.add(linha);
      return next;
    });
  }

  async function handleConfirmar() {
    if (!resultado) return;
    setConfirmando(true);
    setErro(null);
    try {
      const linhas = resultado.linhasValidas.filter((l) => selecionadas.has(l.linha)).map((l) => l.dados);
      const resp = await importarPlanilhaApi.confirmar(linhas);
      setCriadas(resp.criadas);
      setStep(2);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao confirmar a importação.");
    } finally {
      setConfirmando(false);
    }
  }

  function reiniciar() {
    setStep(0);
    setArquivo(null);
    setResultado(null);
    setSelecionadas(new Set());
    setCriadas(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Importar planilha" subtitle="Carregue um arquivo .xlsx no formato da planilha original." />

      <Card>
        <CardBody>
          <Stepper steps={STEPS} current={step} />
        </CardBody>
      </Card>

      {erro && (
        <div className="rounded-xl border border-bad-200 bg-bad-50 px-4 py-3 text-sm font-medium text-bad-700">{erro}</div>
      )}

      {step === 0 && (
        <Card>
          <CardHeader title="Selecionar arquivo" subtitle="Formatos aceitos: .xlsx" />
          <CardBody>
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-300 bg-ink-50 px-6 py-14 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <UploadCloud size={32} className="text-brand-500" />
              <div>
                <p className="text-sm font-medium text-ink-700">
                  {arquivo ? arquivo.name : "Clique para selecionar ou arraste o arquivo aqui"}
                </p>
                <p className="mt-1 text-xs text-ink-400">Arquivo Excel (.xlsx) com as colunas de empresa, produto, valores e status</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleEnviarArquivo} disabled={!arquivo} loading={enviando} icon={<FileUp size={15} />}>
                Processar arquivo
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === 1 && resultado && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResumoBox
              cor="good"
              titulo="Linhas válidas"
              valor={resultado.linhasValidas.length}
              descricao="Prontas para importar"
            />
            <ResumoBox
              cor="bad"
              titulo="Linhas com erro"
              valor={resultado.linhasComErro.length}
              descricao="Serão ignoradas"
            />
            <ResumoBox
              cor="warn"
              titulo="Duplicidades detectadas"
              valor={resultado.duplicidadesDetectadas.length}
              descricao="Desmarcadas por padrão"
            />
          </div>

          {resultado.linhasComErro.length > 0 && (
            <Card>
              <CardHeader title="Linhas com erro" subtitle="Não serão importadas" />
              <CardBody className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                      <th className="px-2 py-1.5">Linha</th>
                      <th className="px-2 py-1.5">Empresa</th>
                      <th className="px-2 py-1.5">Produto</th>
                      <th className="px-2 py-1.5">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bad-100">
                    {resultado.linhasComErro.map((l) => (
                      <tr key={l.linha} className="bg-bad-50/50">
                        <td className="px-2 py-1.5 text-ink-600">{l.linha}</td>
                        <td className="px-2 py-1.5 text-ink-600">{String(l.dados.empresa ?? "—")}</td>
                        <td className="px-2 py-1.5 text-ink-600">{String(l.dados.produto ?? "—")}</td>
                        <td className="px-2 py-1.5 font-medium text-bad-700">{l.motivos.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Linhas válidas"
              subtitle="Desmarque as linhas que não devem ser importadas (duplicidades vêm desmarcadas)"
            />
            <CardBody className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-2 py-1.5"></th>
                    <th className="px-2 py-1.5">Linha</th>
                    <th className="px-2 py-1.5">Empresa</th>
                    <th className="px-2 py-1.5">Produto</th>
                    <th className="px-2 py-1.5 text-right">Quantidade</th>
                    <th className="px-2 py-1.5 text-right">Invoice</th>
                    <th className="px-2 py-1.5">Status</th>
                    <th className="px-2 py-1.5">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {resultado.linhasValidas.map((l) => {
                    const duplicada = linhasDuplicadas.has(l.linha);
                    return (
                      <tr key={l.linha} className={duplicada ? "bg-warn-50/60" : ""}>
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={selecionadas.has(l.linha)}
                            onChange={() => toggleLinha(l.linha)}
                            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-ink-600">{l.linha}</td>
                        <td className="px-2 py-1.5 text-ink-700">{String(l.dados.empresa ?? "—")}</td>
                        <td className="px-2 py-1.5 text-ink-700">{String(l.dados.produto ?? "—")}</td>
                        <td className="px-2 py-1.5 text-right text-ink-700">{String(l.dados.quantidade ?? "—")}</td>
                        <td className="px-2 py-1.5 text-right text-ink-700">{String(l.dados.invoiceValor ?? "—")}</td>
                        <td className="px-2 py-1.5 text-ink-700">{String(l.dados.status ?? "—")}</td>
                        <td className="px-2 py-1.5 text-warn-700">
                          {duplicada && (
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle size={12} /> Possível duplicidade
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={reiniciar}>
              Cancelar / novo arquivo
            </Button>
            <Button
              onClick={handleConfirmar}
              loading={confirmando}
              disabled={selecionadas.size === 0}
              icon={<CheckCircle2 size={15} />}
            >
              Confirmar importação de {selecionadas.size} linha(s)
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <CheckCircle2 size={36} className="text-good-600" />
            <div>
              <p className="text-lg font-semibold text-ink-800">Importação concluída</p>
              <p className="mt-1 text-sm text-ink-500">
                {criadas} importaç{criadas === 1 ? "ão foi criada" : "ões foram criadas"} com sucesso.
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={reiniciar}>
                Importar outro arquivo
              </Button>
              <Button onClick={() => navigate("/importacoes")}>Ver importações</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function ResumoBox({
  cor,
  titulo,
  valor,
  descricao,
}: {
  cor: "good" | "bad" | "warn";
  titulo: string;
  valor: number;
  descricao: string;
}) {
  const estilos = {
    good: "border-good-200 bg-good-50 text-good-700",
    bad: "border-bad-200 bg-bad-50 text-bad-700",
    warn: "border-warn-200 bg-warn-50 text-warn-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${estilos[cor]}`}>
      <p className="text-2xl font-semibold">{valor}</p>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="text-xs opacity-80">{descricao}</p>
    </div>
  );
}
