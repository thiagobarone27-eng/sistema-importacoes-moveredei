import { useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";
import type { CodigoEficiencia, FiltrosImportacoes } from "../api/types";

const CHAVES_NUMERICAS = ["empresaId", "produtoId", "statusId", "fornecedorId", "valorMin", "valorMax"] as const;

/**
 * Sincroniza os filtros globais (empresa, produto, status, periodo etc) com
 * a URL (query params), para que o estado de filtro seja compartilhavel e
 * sobreviva a navegacao/recarregamento. Usado no Dashboard, Importacoes e
 * Eficiencia.
 */
export function useFiltrosUrl() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtros: FiltrosImportacoes = useMemo(() => {
    const obj: FiltrosImportacoes = {};
    const empresaId = searchParams.get("empresaId");
    const produtoId = searchParams.get("produtoId");
    const statusId = searchParams.get("statusId");
    const fornecedorId = searchParams.get("fornecedorId");
    const valorMin = searchParams.get("valorMin");
    const valorMax = searchParams.get("valorMax");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const eficiencia = searchParams.get("eficiencia");
    const pais = searchParams.get("pais");
    const q = searchParams.get("q");
    const statusCategoria = searchParams.get("statusCategoria");
    const incluirArquivadas = searchParams.get("incluirArquivadas");

    if (empresaId) obj.empresaId = Number(empresaId);
    if (produtoId) obj.produtoId = Number(produtoId);
    if (statusId) obj.statusId = Number(statusId);
    if (fornecedorId) obj.fornecedorId = Number(fornecedorId);
    if (valorMin) obj.valorMin = Number(valorMin);
    if (valorMax) obj.valorMax = Number(valorMax);
    if (dataInicio) obj.dataInicio = dataInicio;
    if (dataFim) obj.dataFim = dataFim;
    if (eficiencia) obj.eficiencia = eficiencia as CodigoEficiencia;
    if (pais) obj.pais = pais;
    if (q) obj.q = q;
    if (statusCategoria) obj.statusCategoria = statusCategoria;
    if (incluirArquivadas === "true") obj.incluirArquivadas = true;

    return obj;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const setFiltro = useCallback(
    (chave: keyof FiltrosImportacoes, valor: string | number | boolean | undefined | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (valor === undefined || valor === null || valor === "" || valor === false) {
          next.delete(chave);
        } else {
          next.set(chave, String(valor));
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setFiltros = useCallback(
    (patch: Partial<Record<keyof FiltrosImportacoes, string | number | boolean | undefined | null>>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [chave, valor] of Object.entries(patch)) {
          if (valor === undefined || valor === null || valor === "" || valor === false) {
            next.delete(chave);
          } else {
            next.set(chave, String(valor));
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const limparFiltros = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const temFiltrosAtivos = useMemo(() => Array.from(searchParams.keys()).length > 0, [searchParams]);

  return { filtros, setFiltro, setFiltros, limparFiltros, temFiltrosAtivos };
}

export { CHAVES_NUMERICAS };
