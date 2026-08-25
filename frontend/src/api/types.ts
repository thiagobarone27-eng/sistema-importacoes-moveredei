// Tipos espelhando exatamente o formato de resposta observado no backend
// (ver src/lib/consultaImportacoes.ts, calculos.ts, dashboard.ts etc).

export type Papel = "admin" | "visualizador";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Empresa {
  id: number;
  nome: string;
  criadoEm: string;
}

export interface Produto {
  id: number;
  nome: string;
  criadoEm: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  pais: string | null;
  criadoEm: string;
}

export type CategoriaStatus = "fluxo" | "excecao";

export interface StatusImportacao {
  id: number;
  codigo: string;
  label: string;
  corHex: string;
  icone: string;
  categoria: CategoriaStatus;
  ordem: number;
}

export interface Indicadores {
  totalImpostos: number;
  totalFrete: number;
  custosAduaneiros: number;
  overheadTotal: number;
  valorTotal: number;
  valorUnitarioFinal: number | null;
  mercadoriaPorUnidade: number | null;
  nacionalizacaoPorUnidade: number | null;
  cargaTributariaPct: number | null;
  cargaFretePct: number | null;
  custoAduaneiroPct: number | null;
  overheadPct: number | null;
  markup: number | null;
  invoicePctDoTotal: number | null;
  pctNacionalizacao: number | null;
}

export type CodigoEficiencia =
  | "AGUARDANDO_DADOS"
  | "MUITO_EFICIENTE"
  | "EFICIENTE"
  | "REGULAR"
  | "INEFICIENTE"
  | "MUITO_INEFICIENTE";

export interface ClassificacaoEficiencia {
  codigo: CodigoEficiencia;
  label: string;
}

export interface Importacao {
  id: number;
  numeroProcesso: string | null;
  empresaId: number;
  produtoId: number;
  fornecedorId: number | null;
  statusId: number;
  quantidade: number;
  unidade: string;
  valorUnitarioOriginal: number | null;
  cambioDolar: number | null;
  invoiceValor: number;
  transporteChina: number;
  servicoAdmin: number;
  impostoII: number;
  impostoIPI: number;
  impostoPIS: number;
  impostoCOFINS: number;
  impostoICMS: number;
  armazenagem: number;
  taxaDta: number;
  freteInternacional: number;
  freteRodoviario: number;
  taxasSeguro: number;
  siscomex: number;
  sda: number;
  agenciamento: number;
  outrasDespesas: number;
  cambioFrete: number | null;
  airFreight: number;
  desconsolidacao: number;
  taxaLiberacao: number;
  docFeeOrigin: number;
  customsOrigin: number;
  pickUp: number;
  palletFee: number;
  exportLicense: number;
  devolucaoVazio: number;
  lavagem: number;
  fichaEmergencia: number;
  impostosFederais: number;
  afrmm: number;
  honorarios: number;
  licenciamento: number;
  dataCompra: string | null;
  dataPrevistaEmbarque: string | null;
  dataEmbarque: string | null;
  dataChegada: string | null;
  dataNacionalizacao: string | null;
  paisOrigem: string | null;
  observacoes: string | null;
  arquivadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string | null;
  atualizadoPor: string | null;
  empresa: Empresa;
  produto: Produto;
  fornecedor: Fornecedor | null;
  status: StatusImportacao;
  indicadores: Indicadores;
  classificacaoEficiencia: ClassificacaoEficiencia;
}

export interface HistoricoStatusItem {
  id: number;
  importacaoId: number;
  alteradoPor: string;
  alteradoEm: string;
  observacao: string | null;
  statusAnteriorId: number | null;
  statusAnteriorCodigo: string | null;
  statusAnteriorLabel: string | null;
  statusNovoId: number;
  statusNovoCodigo: string;
  statusNovoLabel: string;
}

export interface HistoricoAlteracaoItem {
  id: number;
  importacaoId: number;
  campo: string;
  valorAntigo: string | null;
  valorNovo: string | null;
  usuario: string;
  alteradoEm: string;
}

export interface ConfigEficiencia {
  id: number;
  muitoEficienteOverheadMax: number;
  muitoEficienteMarkupMax: number;
  eficienteOverheadMax: number;
  eficienteMarkupMax: number;
  regularOverheadMax: number;
  regularMarkupMax: number;
  ineficienteOverheadMax: number;
  ineficienteMarkupMax: number;
  diasSemAtualizacaoAlerta: number;
  atualizadoEm: string;
}

export interface AgregadoPonderado {
  somaInvoice: number;
  somaValorTotal: number;
  somaTotalImpostos: number;
  somaTotalFrete: number;
  somaCustosAduaneiros: number;
  somaOverheadTotal: number;
  overheadPonderado: number | null;
  markupPonderado: number | null;
  cargaTributariaPonderada: number | null;
  cargaFretePonderada: number | null;
  custoAduaneiroPonderado: number | null;
}

export interface DashboardTotais {
  valorTotalImportado: number;
  totalImportacoes: number;
  totalProdutosDistintos: number;
  totalUnidades: number;
  totalImpostos: number;
  totalFrete: number;
  totalCustosAduaneiros: number;
  totalDespesasAdmin: number;
  custoTotalNacionalizacao: number;
  custoMedioPorUnidade: number | null;
  overheadMedioPonderadoPct: number | null;
  importacoesEmAndamento: number;
  importacoesConcluidas: number;
  importacoesAtrasadas: number;
}

export interface DashboardResponse {
  totais: DashboardTotais;
  series: {
    evolucaoMensal: Array<{ mes: string; qtdImportacoes: number; valorImportado: number }>;
    impostosXInvoice: Array<{
      importacaoId: number;
      numeroProcesso: string | null;
      invoiceValor: number;
      totalImpostos: number;
    }>;
    freteXInvoice: Array<{
      importacaoId: number;
      numeroProcesso: string | null;
      invoiceValor: number;
      totalFrete: number;
    }>;
    porEmpresa: Array<{
      empresaId: number;
      empresaNome: string;
      valorTotal: number;
      invoiceValor: number;
      quantidadeImportacoes: number;
    }>;
    porProduto: Array<{
      produtoId: number;
      produtoNome: string;
      valorTotal: number;
      invoiceValor: number;
      quantidadeImportacoes: number;
    }>;
    composicaoCustos: {
      invoice: number;
      impostos: number;
      frete: number;
      aduaneiro: number;
      servicoAdmin: number;
      outras: number;
    };
    evolucaoEficiencia: Array<{ mes: string; overheadPonderado: number | null }>;
  };
}

export type SeveridadeAlerta = "info" | "atencao" | "critico";

export interface Alerta {
  tipo: string;
  importacaoId: number;
  numeroProcesso: string | null;
  severidade: SeveridadeAlerta;
  mensagem: string;
}

export interface EficienciaResponse {
  importacoes: Importacao[];
  consolidado: AgregadoPonderado;
}

export interface ComparacaoResponse {
  importacoes: Importacao[];
  idsNaoEncontrados: number[];
}

export interface AnaliseProduto {
  produto: Produto;
  quantidadeTotal: number;
  numeroImportacoes: number;
  empresas: string[];
  invoiceTotal: number;
  totalImpostos: number;
  totalFrete: number;
  custosAduaneiros: number;
  valorTotal: number;
  custoMedioPorUnidade: number | null;
  overheadMedioPonderado: number | null;
  evolucaoHistorica: Array<{
    importacaoId: number;
    numeroProcesso: string | null;
    empresa: string;
    data: string;
    quantidade: number;
    invoiceValor: number;
    valorTotal: number;
    valorUnitarioFinal: number | null;
    overheadPct: number | null;
    markup: number | null;
  }>;
}

export interface AnaliseEmpresa {
  empresa: Empresa;
  produtos: string[];
  numeroImportacoes: number;
  quantidadeTotal: number;
  invoiceTotal: number;
  totalImpostos: number;
  totalFrete: number;
  custosAduaneiros: number;
  valorTotal: number;
  custoMedioPorUnidade: number | null;
  overheadMedioPonderado: number | null;
  evolucaoHistorica: Array<{
    importacaoId: number;
    numeroProcesso: string | null;
    produto: string;
    data: string;
    quantidade: number;
    invoiceValor: number;
    valorTotal: number;
    valorUnitarioFinal: number | null;
    overheadPct: number | null;
    markup: number | null;
  }>;
}

export interface RelatorioColuna {
  header: string;
  key: string;
  width?: number;
}

export interface RelatorioDados {
  titulo: string;
  colunas: RelatorioColuna[];
  linhas: Record<string, unknown>[];
}

export type TipoRelatorio =
  | "geral"
  | "eficiencia"
  | "custos"
  | "por-produto"
  | "por-empresa"
  | "em-andamento"
  | "concluidas"
  | "atrasadas"
  | "comparativo-periodos"
  | "evolucao-custos";

export interface LinhaImportadaPlanilha {
  linha: number;
  dados: Record<string, unknown>;
}

export interface LinhaComErroPlanilha extends LinhaImportadaPlanilha {
  motivos: string[];
}

export interface DuplicidadePlanilha {
  linha: number;
  motivo: string;
}

export interface ImportarPlanilhaResponse {
  linhasValidas: LinhaImportadaPlanilha[];
  linhasComErro: LinhaComErroPlanilha[];
  duplicidadesDetectadas: DuplicidadePlanilha[];
}

export interface FiltrosImportacoes {
  empresaId?: number;
  produtoId?: number;
  statusId?: number;
  statusCategoria?: string;
  pais?: string;
  fornecedorId?: number;
  dataInicio?: string;
  dataFim?: string;
  valorMin?: number;
  valorMax?: number;
  eficiencia?: CodigoEficiencia;
  q?: string;
  incluirArquivadas?: boolean;
}
