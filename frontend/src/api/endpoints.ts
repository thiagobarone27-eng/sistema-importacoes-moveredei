import { api, downloadFile, uploadFile } from "./client";
import type {
  Alerta,
  AnaliseEmpresa,
  AnaliseProduto,
  ComparacaoResponse,
  ConfigEficiencia,
  DashboardResponse,
  EficienciaResponse,
  Empresa,
  FiltrosImportacoes,
  Fornecedor,
  HistoricoAlteracaoItem,
  HistoricoStatusItem,
  Importacao,
  ImportarPlanilhaResponse,
  Produto,
  RelatorioDados,
  StatusImportacao,
  TipoRelatorio,
} from "./types";

function filtrosParaParams(filtros: FiltrosImportacoes = {}): Record<string, unknown> {
  return {
    empresaId: filtros.empresaId,
    produtoId: filtros.produtoId,
    statusId: filtros.statusId,
    statusCategoria: filtros.statusCategoria,
    pais: filtros.pais,
    fornecedorId: filtros.fornecedorId,
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim,
    valorMin: filtros.valorMin,
    valorMax: filtros.valorMax,
    eficiencia: filtros.eficiencia,
    q: filtros.q,
    incluirArquivadas: filtros.incluirArquivadas ? "true" : undefined,
  };
}

export const empresasApi = {
  listar: () => api.get<Empresa[]>("/empresas"),
  criar: (nome: string) => api.post<Empresa>("/empresas", { nome }),
  atualizar: (id: number, nome: string) => api.put<Empresa>(`/empresas/${id}`, { nome }),
  remover: (id: number) => api.delete<void>(`/empresas/${id}`),
  analise: (id: number) => api.get<AnaliseEmpresa>(`/empresas/${id}/analise`),
};

export const produtosApi = {
  listar: () => api.get<Produto[]>("/produtos"),
  criar: (nome: string) => api.post<Produto>("/produtos", { nome }),
  atualizar: (id: number, nome: string) => api.put<Produto>(`/produtos/${id}`, { nome }),
  remover: (id: number) => api.delete<void>(`/produtos/${id}`),
  analise: (id: number) => api.get<AnaliseProduto>(`/produtos/${id}/analise`),
};

export const fornecedoresApi = {
  listar: () => api.get<Fornecedor[]>("/fornecedores"),
  criar: (nome: string, pais?: string | null) => api.post<Fornecedor>("/fornecedores", { nome, pais }),
  atualizar: (id: number, dados: Partial<Pick<Fornecedor, "nome" | "pais">>) =>
    api.put<Fornecedor>(`/fornecedores/${id}`, dados),
  remover: (id: number) => api.delete<void>(`/fornecedores/${id}`),
};

export const statusApi = {
  listar: () => api.get<StatusImportacao[]>("/status"),
};

export const importacoesApi = {
  listar: (filtros?: FiltrosImportacoes) =>
    api.get<Importacao[]>("/importacoes", filtrosParaParams(filtros)),
  obter: (id: number) => api.get<Importacao>(`/importacoes/${id}`),
  historicoStatus: (id: number) => api.get<HistoricoStatusItem[]>(`/importacoes/${id}/historico-status`),
  historicoAlteracoes: (id: number) =>
    api.get<HistoricoAlteracaoItem[]>(`/importacoes/${id}/historico-alteracoes`),
  criar: (dados: Record<string, unknown>) => api.post<Importacao>("/importacoes", dados),
  atualizar: (id: number, dados: Record<string, unknown>) =>
    api.put<Importacao>(`/importacoes/${id}`, dados),
  mudarStatus: (id: number, statusId: number, observacao?: string) =>
    api.patch<Importacao>(`/importacoes/${id}/status`, { statusId, observacao }),
  arquivar: (id: number) => api.delete<void>(`/importacoes/${id}`),
};

export const dashboardApi = {
  obter: (filtros?: FiltrosImportacoes) =>
    api.get<DashboardResponse>("/dashboard", filtrosParaParams(filtros)),
};

export const eficienciaApi = {
  listar: (filtros?: FiltrosImportacoes) =>
    api.get<EficienciaResponse>("/eficiencia", filtrosParaParams(filtros)),
  obterConfig: () => api.get<ConfigEficiencia>("/eficiencia/config"),
  atualizarConfig: (dados: Partial<ConfigEficiencia>) =>
    api.put<ConfigEficiencia>("/eficiencia/config", dados),
};

export const comparacaoApi = {
  comparar: (ids: number[]) => api.get<ComparacaoResponse>("/comparacao", { ids: ids.join(",") }),
};

export const alertasApi = {
  listar: (filtros?: FiltrosImportacoes) => api.get<Alerta[]>("/alertas", filtrosParaParams(filtros)),
};

export const relatoriosApi = {
  obter: (tipo: TipoRelatorio, filtros?: FiltrosImportacoes) =>
    api.get<RelatorioDados>(`/relatorios/${tipo}`, filtrosParaParams(filtros)),
  baixarXlsx: (tipo: TipoRelatorio, filtros?: FiltrosImportacoes) =>
    downloadFile(`/relatorios/${tipo}`, { ...filtrosParaParams(filtros), formato: "xlsx" }),
};

export const importarPlanilhaApi = {
  enviar: (file: File) => uploadFile<ImportarPlanilhaResponse>("/importar-planilha", file),
  confirmar: (linhas: Array<Record<string, unknown>>) =>
    api.post<{ criadas: number }>("/importar-planilha/confirmar", { linhas }),
};
