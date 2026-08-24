import { Router } from "express";
import { buscarImportacaoPorId, obterConfigEficiencia } from "../lib/consultaImportacoes";

export const comparacaoRouter = Router();

/** GET /api/comparacao?ids=1,2,3 */
comparacaoRouter.get("/", async (req, res) => {
  const idsParam = String(req.query.ids || "");
  const ids = idsParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));

  if (ids.length === 0) return res.status(400).json({ erro: "Informe ?ids=1,2,3" });

  const config = await obterConfigEficiencia();
  const importacoes = await Promise.all(ids.map((id) => buscarImportacaoPorId(id, config)));

  const naoEncontradas = ids.filter((id, idx) => importacoes[idx] === null);
  res.json({
    importacoes: importacoes.filter(Boolean),
    idsNaoEncontrados: naoEncontradas,
  });
});
