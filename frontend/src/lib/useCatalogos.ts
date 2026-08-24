import { useAsync } from "./useAsync";
import { empresasApi, fornecedoresApi, produtosApi, statusApi } from "../api/endpoints";

/** Carrega os catalogos base (empresas, produtos, fornecedores, status) usados
 * em filtros e formularios por toda a aplicacao. */
export function useCatalogos() {
  const empresas = useAsync(() => empresasApi.listar(), []);
  const produtos = useAsync(() => produtosApi.listar(), []);
  const fornecedores = useAsync(() => fornecedoresApi.listar(), []);
  const status = useAsync(() => statusApi.listar(), []);

  return {
    empresas: empresas.data ?? [],
    produtos: produtos.data ?? [],
    fornecedores: fornecedores.data ?? [],
    status: status.data ?? [],
    loading: empresas.loading || produtos.loading || fornecedores.loading || status.loading,
    reload: () => {
      empresas.reload();
      produtos.reload();
      fornecedores.reload();
      status.reload();
    },
  };
}
