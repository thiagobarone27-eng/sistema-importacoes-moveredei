import { Router } from "express";
import { db, nowIso } from "../lib/db";

export const fornecedoresRouter = Router();

fornecedoresRouter.get("/", async (_req, res) => {
  const fornecedores = await db.selectFrom("fornecedores").selectAll().orderBy("nome", "asc").execute();
  res.json(fornecedores);
});

fornecedoresRouter.post("/", async (req, res) => {
  const { nome, pais } = req.body;
  if (!nome || typeof nome !== "string") return res.status(400).json({ erro: "Campo 'nome' e obrigatorio." });

  const criado = await db
    .insertInto("fornecedores")
    .values({ nome, pais: pais ?? null, criadoEm: nowIso() })
    .returningAll()
    .executeTakeFirstOrThrow();
  res.status(201).json(criado);
});

fornecedoresRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome, pais } = req.body;

  const atualizado = await db
    .updateTable("fornecedores")
    .set({ ...(nome !== undefined ? { nome } : {}), ...(pais !== undefined ? { pais } : {}) })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  if (!atualizado) return res.status(404).json({ erro: "Fornecedor nao encontrado." });
  res.json(atualizado);
});

fornecedoresRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const emUso = await db.selectFrom("importacoes").select("id").where("fornecedorId", "=", id).executeTakeFirst();
  if (emUso) {
    return res.status(409).json({ erro: "Nao e possivel excluir: existem importacoes vinculadas a este fornecedor." });
  }

  const deletado = await db.deleteFrom("fornecedores").where("id", "=", id).executeTakeFirst();
  if (Number(deletado.numDeletedRows) === 0) return res.status(404).json({ erro: "Fornecedor nao encontrado." });
  res.status(204).send();
});
