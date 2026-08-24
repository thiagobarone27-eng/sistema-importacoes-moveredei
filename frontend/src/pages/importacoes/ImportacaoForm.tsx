import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select, Textarea } from "../../components/ui/Field";
import { Stepper } from "../../components/ui/Stepper";
import { EntityPicker, type EntityOption } from "../../components/ui/EntityPicker";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { useCatalogos } from "../../lib/useCatalogos";
import { empresasApi, fornecedoresApi, importacoesApi, produtosApi } from "../../api/endpoints";
import { calcularIndicadores } from "../../lib/calculos";
import { formatCurrency, formatMultiplier, formatPercent, isoToDateInput, dateInputToIso } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { ApiError } from "../../api/client";

interface FormState {
  empresaId: number | null;
  produtoId: number | null;
  fornecedorId: number | null;
  numeroProcesso: string;
  paisOrigem: string;
  statusId: number | null;
  dataCompra: string;
  dataPrevistaEmbarque: string;
  dataEmbarque: string;
  dataChegada: string;
  dataNacionalizacao: string;

  quantidade: string;
  unidade: string;
  fonteValor: "invoice" | "unitario";
  invoiceValor: string;
  valorUnitarioOriginal: string;
  cambioDolar: string;

  transporteChina: string;
  servicoAdmin: string;
  impostoII: string;
  impostoIPI: string;
  impostoPIS: string;
  impostoCOFINS: string;
  impostoICMS: string;
  armazenagem: string;
  taxaDta: string;
  freteInternacional: string;
  freteRodoviario: string;
  taxasSeguro: string;
  siscomex: string;
  sda: string;
  agenciamento: string;
  outrasDespesas: string;

  observacoes: string;
}

const ESTADO_INICIAL: FormState = {
  empresaId: null,
  produtoId: null,
  fornecedorId: null,
  numeroProcesso: "",
  paisOrigem: "China",
  statusId: null,
  dataCompra: "",
  dataPrevistaEmbarque: "",
  dataEmbarque: "",
  dataChegada: "",
  dataNacionalizacao: "",

  quantidade: "",
  unidade: "un",
  fonteValor: "invoice",
  invoiceValor: "",
  valorUnitarioOriginal: "",
  cambioDolar: "",

  transporteChina: "",
  servicoAdmin: "",
  impostoII: "",
  impostoIPI: "",
  impostoPIS: "",
  impostoCOFINS: "",
  impostoICMS: "",
  armazenagem: "",
  taxaDta: "",
  freteInternacional: "",
  freteRodoviario: "",
  taxasSeguro: "",
  siscomex: "",
  sda: "",
  agenciamento: "",
  outrasDespesas: "",

  observacoes: "",
};

function num(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

const CAMPOS_CUSTO: Array<{ key: keyof FormState; label: string; grupo: string }> = [
  { key: "transporteChina", label: "Transporte China", grupo: "Frete" },
  { key: "freteInternacional", label: "Frete internacional", grupo: "Frete" },
  { key: "freteRodoviario", label: "Frete rodoviário", grupo: "Frete" },
  { key: "armazenagem", label: "Armazenagem", grupo: "Frete" },
  { key: "taxaDta", label: "Taxa DTA", grupo: "Frete" },
  { key: "taxasSeguro", label: "Taxas/seguro", grupo: "Frete" },
  { key: "impostoII", label: "Imposto II", grupo: "Impostos" },
  { key: "impostoIPI", label: "Imposto IPI", grupo: "Impostos" },
  { key: "impostoPIS", label: "Imposto PIS", grupo: "Impostos" },
  { key: "impostoCOFINS", label: "Imposto COFINS", grupo: "Impostos" },
  { key: "impostoICMS", label: "Imposto ICMS", grupo: "Impostos" },
  { key: "siscomex", label: "Siscomex", grupo: "Custos aduaneiros" },
  { key: "sda", label: "SDA", grupo: "Custos aduaneiros" },
  { key: "agenciamento", label: "Agenciamento", grupo: "Custos aduaneiros" },
  { key: "servicoAdmin", label: "Serviço administrativo", grupo: "Outros" },
  { key: "outrasDespesas", label: "Outras despesas", grupo: "Outros" },
];

const GRUPOS_CUSTO = ["Frete", "Impostos", "Custos aduaneiros", "Outros"];

const STEPS = [
  { label: "Identificação", description: "Empresa, produto e datas" },
  { label: "Produto/Quantidade", description: "Quantidade e valor" },
  { label: "Custos", description: "Impostos, frete e taxas" },
];

function toOptions(list: Array<{ id: number; nome: string }>): EntityOption[] {
  return list.map((i) => ({ id: i.id, nome: i.nome }));
}

export function ImportacaoForm() {
  const { id } = useParams();
  const isEdicao = Boolean(id);
  const navigate = useNavigate();
  const catalogos = useCatalogos();

  const existente = useAsync(
    () => (isEdicao ? importacoesApi.obter(Number(id)) : Promise.resolve(null)),
    [id]
  );

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [carregouExistente, setCarregouExistente] = useState(false);

  useEffect(() => {
    if (!isEdicao) {
      // Define status inicial padrao (Planejamento) assim que os status carregarem.
      if (!form.statusId && catalogos.status.length > 0) {
        const planejamento = catalogos.status.find((s) => s.codigo === "PLANEJAMENTO");
        setForm((f) => ({ ...f, statusId: planejamento?.id ?? catalogos.status[0].id }));
      }
      return;
    }
    if (existente.data && !carregouExistente) {
      const imp = existente.data;
      setForm({
        empresaId: imp.empresaId,
        produtoId: imp.produtoId,
        fornecedorId: imp.fornecedorId,
        numeroProcesso: imp.numeroProcesso ?? "",
        paisOrigem: imp.paisOrigem ?? "",
        statusId: imp.statusId,
        dataCompra: isoToDateInput(imp.dataCompra),
        dataPrevistaEmbarque: isoToDateInput(imp.dataPrevistaEmbarque),
        dataEmbarque: isoToDateInput(imp.dataEmbarque),
        dataChegada: isoToDateInput(imp.dataChegada),
        dataNacionalizacao: isoToDateInput(imp.dataNacionalizacao),
        quantidade: String(imp.quantidade ?? ""),
        unidade: imp.unidade ?? "un",
        fonteValor: "invoice",
        invoiceValor: String(imp.invoiceValor ?? ""),
        valorUnitarioOriginal: imp.valorUnitarioOriginal !== null ? String(imp.valorUnitarioOriginal) : "",
        cambioDolar: imp.cambioDolar !== null ? String(imp.cambioDolar) : "",
        transporteChina: String(imp.transporteChina ?? 0),
        servicoAdmin: String(imp.servicoAdmin ?? 0),
        impostoII: String(imp.impostoII ?? 0),
        impostoIPI: String(imp.impostoIPI ?? 0),
        impostoPIS: String(imp.impostoPIS ?? 0),
        impostoCOFINS: String(imp.impostoCOFINS ?? 0),
        impostoICMS: String(imp.impostoICMS ?? 0),
        armazenagem: String(imp.armazenagem ?? 0),
        taxaDta: String(imp.taxaDta ?? 0),
        freteInternacional: String(imp.freteInternacional ?? 0),
        freteRodoviario: String(imp.freteRodoviario ?? 0),
        taxasSeguro: String(imp.taxasSeguro ?? 0),
        siscomex: String(imp.siscomex ?? 0),
        sda: String(imp.sda ?? 0),
        agenciamento: String(imp.agenciamento ?? 0),
        outrasDespesas: String(imp.outrasDespesas ?? 0),
        observacoes: imp.observacoes ?? "",
      });
      setCarregouExistente(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdicao, existente.data, catalogos.status]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // --- Calculo automatico invoice <-> valor unitario ---
  const quantidadeNum = num(form.quantidade);

  function handleInvoiceChange(value: string) {
    set("invoiceValor", value);
    set("fonteValor", "invoice");
    if (quantidadeNum > 0) {
      const unit = num(value) / quantidadeNum;
      set("valorUnitarioOriginal", unit ? String(Number(unit.toFixed(4))) : "");
    }
  }

  function handleUnitarioChange(value: string) {
    set("valorUnitarioOriginal", value);
    set("fonteValor", "unitario");
    if (quantidadeNum > 0) {
      const invoice = num(value) * quantidadeNum;
      set("invoiceValor", invoice ? String(Number(invoice.toFixed(2))) : "");
    }
  }

  function handleQuantidadeChange(value: string) {
    set("quantidade", value);
    const qtd = num(value);
    if (qtd > 0) {
      if (form.fonteValor === "invoice" && form.invoiceValor) {
        const unit = num(form.invoiceValor) / qtd;
        set("valorUnitarioOriginal", unit ? String(Number(unit.toFixed(4))) : "");
      } else if (form.fonteValor === "unitario" && form.valorUnitarioOriginal) {
        const invoice = num(form.valorUnitarioOriginal) * qtd;
        set("invoiceValor", invoice ? String(Number(invoice.toFixed(2))) : "");
      }
    }
  }

  const indicadores = useMemo(
    () =>
      calcularIndicadores({
        quantidade: quantidadeNum,
        invoiceValor: num(form.invoiceValor),
        transporteChina: num(form.transporteChina),
        servicoAdmin: num(form.servicoAdmin),
        impostoII: num(form.impostoII),
        impostoIPI: num(form.impostoIPI),
        impostoPIS: num(form.impostoPIS),
        impostoCOFINS: num(form.impostoCOFINS),
        impostoICMS: num(form.impostoICMS),
        armazenagem: num(form.armazenagem),
        taxaDta: num(form.taxaDta),
        freteInternacional: num(form.freteInternacional),
        freteRodoviario: num(form.freteRodoviario),
        taxasSeguro: num(form.taxasSeguro),
        siscomex: num(form.siscomex),
        sda: num(form.sda),
        agenciamento: num(form.agenciamento),
        outrasDespesas: num(form.outrasDespesas),
      }),
    [form]
  );

  const empresaOptions = toOptions(catalogos.empresas);
  const produtoOptions = toOptions(catalogos.produtos);
  const fornecedorOptions = toOptions(catalogos.fornecedores);

  async function criarEmpresa(nome: string): Promise<EntityOption> {
    const criada = await empresasApi.criar(nome);
    catalogos.reload();
    return { id: criada.id, nome: criada.nome };
  }
  async function criarProduto(nome: string): Promise<EntityOption> {
    const criado = await produtosApi.criar(nome);
    catalogos.reload();
    return { id: criado.id, nome: criado.nome };
  }
  async function criarFornecedor(nome: string): Promise<EntityOption> {
    const criado = await fornecedoresApi.criar(nome, form.paisOrigem || null);
    catalogos.reload();
    return { id: criado.id, nome: criado.nome };
  }

  function validarStep(atual: number): string | null {
    if (atual === 0) {
      if (!form.empresaId) return "Selecione a empresa.";
      if (!form.produtoId) return "Selecione o produto.";
      if (!form.statusId) return "Selecione o status inicial.";
    }
    if (atual === 1) {
      if (!form.quantidade || quantidadeNum <= 0) return "Informe uma quantidade válida.";
      if (!form.invoiceValor || num(form.invoiceValor) <= 0) return "Informe o valor de invoice ou o valor unitário.";
    }
    return null;
  }

  function avancar() {
    const erroValidacao = validarStep(step);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    setErro(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function voltar() {
    setErro(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const erroValidacao = validarStep(0) || validarStep(1);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    setErro(null);
    setEnviando(true);

    const payload = {
      empresaId: form.empresaId,
      produtoId: form.produtoId,
      fornecedorId: form.fornecedorId,
      numeroProcesso: form.numeroProcesso || undefined,
      paisOrigem: form.paisOrigem || null,
      statusId: form.statusId,
      dataCompra: dateInputToIso(form.dataCompra),
      dataPrevistaEmbarque: dateInputToIso(form.dataPrevistaEmbarque),
      dataEmbarque: dateInputToIso(form.dataEmbarque),
      dataChegada: dateInputToIso(form.dataChegada),
      dataNacionalizacao: dateInputToIso(form.dataNacionalizacao),
      quantidade: quantidadeNum,
      unidade: form.unidade || "un",
      valorUnitarioOriginal: form.valorUnitarioOriginal ? num(form.valorUnitarioOriginal) : null,
      cambioDolar: form.cambioDolar ? num(form.cambioDolar) : null,
      invoiceValor: num(form.invoiceValor),
      transporteChina: num(form.transporteChina),
      servicoAdmin: num(form.servicoAdmin),
      impostoII: num(form.impostoII),
      impostoIPI: num(form.impostoIPI),
      impostoPIS: num(form.impostoPIS),
      impostoCOFINS: num(form.impostoCOFINS),
      impostoICMS: num(form.impostoICMS),
      armazenagem: num(form.armazenagem),
      taxaDta: num(form.taxaDta),
      freteInternacional: num(form.freteInternacional),
      freteRodoviario: num(form.freteRodoviario),
      taxasSeguro: num(form.taxasSeguro),
      siscomex: num(form.siscomex),
      sda: num(form.sda),
      agenciamento: num(form.agenciamento),
      outrasDespesas: num(form.outrasDespesas),
      observacoes: form.observacoes || null,
    };

    try {
      if (isEdicao) {
        const atualizado = await importacoesApi.atualizar(Number(id), payload);
        navigate(`/importacoes/${atualizado.id}`);
      } else {
        const criada = await importacoesApi.criar(payload);
        navigate(`/importacoes/${criada.id}`);
      }
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro inesperado ao salvar a importação.");
    } finally {
      setEnviando(false);
    }
  }

  if (isEdicao && existente.loading) return <LoadingState label="Carregando importação..." />;
  if (isEdicao && existente.error) return <ErrorState message={existente.error} onRetry={existente.reload} />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={isEdicao ? `/importacoes/${id}` : "/importacoes"}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft size={15} /> Voltar
        </Link>
        <PageHeader title={isEdicao ? "Editar importação" : "Nova importação"} />
      </div>

      <Card>
        <CardBody>
          <Stepper steps={STEPS} current={step} />
        </CardBody>
      </Card>

      {erro && (
        <div className="rounded-xl border border-bad-200 bg-bad-50 px-4 py-3 text-sm font-medium text-bad-700">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={STEPS[step].label} subtitle={STEPS[step].description} />
          <CardBody>
            {step === 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label required>Empresa</Label>
                  <EntityPicker
                    options={empresaOptions}
                    value={form.empresaId}
                    onChange={(v) => set("empresaId", v)}
                    onCreate={criarEmpresa}
                    placeholder="Buscar empresa..."
                    createLabel="Cadastrar empresa"
                  />
                </div>
                <div>
                  <Label required>Produto</Label>
                  <EntityPicker
                    options={produtoOptions}
                    value={form.produtoId}
                    onChange={(v) => set("produtoId", v)}
                    onCreate={criarProduto}
                    placeholder="Buscar produto..."
                    createLabel="Cadastrar produto"
                  />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <EntityPicker
                    options={fornecedorOptions}
                    value={form.fornecedorId}
                    onChange={(v) => set("fornecedorId", v)}
                    onCreate={criarFornecedor}
                    placeholder="Buscar fornecedor..."
                    createLabel="Cadastrar fornecedor"
                  />
                </div>
                <div>
                  <Label hint="deixe em branco para gerar automaticamente">Número do processo</Label>
                  <Input
                    value={form.numeroProcesso}
                    onChange={(e) => set("numeroProcesso", e.target.value)}
                    placeholder="IMP-2026-0001"
                  />
                </div>
                <div>
                  <Label>País de origem</Label>
                  <Input value={form.paisOrigem} onChange={(e) => set("paisOrigem", e.target.value)} placeholder="China" />
                </div>
                <div>
                  <Label required>Status inicial</Label>
                  <Select value={form.statusId ?? ""} onChange={(e) => set("statusId", Number(e.target.value))}>
                    <option value="" disabled>
                      Selecione...
                    </option>
                    <optgroup label="Fluxo">
                      {catalogos.status
                        .filter((s) => s.categoria === "fluxo")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Exceção">
                      {catalogos.status
                        .filter((s) => s.categoria === "excecao")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                    </optgroup>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                      <Label>Data de compra</Label>
                      <Input type="date" value={form.dataCompra} onChange={(e) => set("dataCompra", e.target.value)} />
                    </div>
                    <div>
                      <Label>Previsão de embarque</Label>
                      <Input
                        type="date"
                        value={form.dataPrevistaEmbarque}
                        onChange={(e) => set("dataPrevistaEmbarque", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data de embarque</Label>
                      <Input type="date" value={form.dataEmbarque} onChange={(e) => set("dataEmbarque", e.target.value)} />
                    </div>
                    <div>
                      <Label>Data de chegada</Label>
                      <Input type="date" value={form.dataChegada} onChange={(e) => set("dataChegada", e.target.value)} />
                    </div>
                    <div>
                      <Label>Data de nacionalização</Label>
                      <Input
                        type="date"
                        value={form.dataNacionalizacao}
                        onChange={(e) => set("dataNacionalizacao", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label required>Quantidade</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={form.quantidade}
                      onChange={(e) => handleQuantidadeChange(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input value={form.unidade} onChange={(e) => set("unidade", e.target.value)} placeholder="un" />
                  </div>
                  <div>
                    <Label hint="opcional, para referência">Câmbio (USD)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={form.cambioDolar}
                      onChange={(e) => set("cambioDolar", e.target.value)}
                      placeholder="5.20"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                  <p className="mb-3 text-xs font-medium text-brand-700">
                    Digite o Invoice (valor total) <strong>ou</strong> o valor unitário — o outro campo é calculado
                    automaticamente. O campo em destaque é a fonte atual.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label required>Invoice (valor total)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={form.invoiceValor}
                        onChange={(e) => handleInvoiceChange(e.target.value)}
                        placeholder="0,00"
                        className={form.fonteValor === "invoice" ? "border-brand-500 ring-2 ring-brand-100" : ""}
                      />
                    </div>
                    <div>
                      <Label>Valor unitário</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={form.valorUnitarioOriginal}
                        onChange={(e) => handleUnitarioChange(e.target.value)}
                        placeholder="0,00"
                        className={form.fonteValor === "unitario" ? "border-brand-500 ring-2 ring-brand-100" : ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {GRUPOS_CUSTO.map((grupo) => (
                  <div key={grupo}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">{grupo}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {CAMPOS_CUSTO.filter((c) => c.grupo === grupo).map((campo) => (
                        <div key={campo.key}>
                          <Label>{campo.label}</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={form[campo.key] as string}
                            onChange={(e) => set(campo.key, e.target.value as never)}
                            placeholder="0,00"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    rows={3}
                    value={form.observacoes}
                    onChange={(e) => set("observacoes", e.target.value)}
                    placeholder="Observações gerais sobre o processo..."
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
              <Button variant="secondary" onClick={voltar} disabled={step === 0} icon={<ArrowLeft size={15} />}>
                Voltar
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={avancar} icon={<ArrowRight size={15} />}>
                  Avançar
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={enviando} icon={<Check size={15} />}>
                  {isEdicao ? "Salvar alterações" : "Criar importação"}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Painel resumo fixo com totais calculados ao vivo */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader title="Resumo calculado" subtitle="Atualizado em tempo real" />
            <CardBody className="space-y-2.5">
              <ResumoLinha label="Total impostos" value={formatCurrency(indicadores.totalImpostos)} />
              <ResumoLinha label="Total frete" value={formatCurrency(indicadores.totalFrete)} />
              <ResumoLinha label="Custos aduaneiros" value={formatCurrency(indicadores.custosAduaneiros)} />
              <ResumoLinha label="Overhead total" value={formatCurrency(indicadores.overheadTotal)} />
              <div className="my-1 border-t border-dashed border-ink-200" />
              <ResumoLinha label="Valor total" value={formatCurrency(indicadores.valorTotal)} destaque />
              <ResumoLinha label="Custo unitário final" value={formatCurrency(indicadores.valorUnitarioFinal)} destaque />
              <ResumoLinha label="Nacionalização/unidade" value={formatCurrency(indicadores.nacionalizacaoPorUnidade)} />
              <div className="my-1 border-t border-dashed border-ink-200" />
              <ResumoLinha label="% impostos s/ invoice" value={formatPercent(indicadores.cargaTributariaPct)} />
              <ResumoLinha label="% frete s/ invoice" value={formatPercent(indicadores.cargaFretePct)} />
              <ResumoLinha label="% custos aduaneiros" value={formatPercent(indicadores.custoAduaneiroPct)} />
              <ResumoLinha label="% overhead total" value={formatPercent(indicadores.overheadPct)} destaque />
              <ResumoLinha label="Markup" value={formatMultiplier(indicadores.markup)} destaque />
            </CardBody>
          </Card>
          {enviando && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-400">
              <Loader2 size={13} className="animate-spin" /> Salvando...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumoLinha({ label, value, destaque }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={`text-sm ${destaque ? "font-semibold text-brand-700" : "text-ink-700"}`}>{value}</span>
    </div>
  );
}
