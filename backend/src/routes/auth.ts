import { Router } from "express";
import { db, nowIso } from "../lib/db";
import { gerarToken, hashSenha, requireAdmin, requireAuth, verificarSenha, type Papel } from "../lib/auth";

export const authRouter = Router();

function paraUsuarioPublico(u: {
  id: number;
  nome: string;
  email: string;
  papel: string;
  ativo: number;
  criadoEm: string;
  atualizadoEm: string;
}) {
  // Nunca devolve senhaHash pro frontend.
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    ativo: !!u.ativo,
    criadoEm: u.criadoEm,
    atualizadoEm: u.atualizadoEm,
  };
}

/** POST /api/auth/login - publico. Recebe { email, senha }, devolve { token, usuario }. */
authRouter.post("/login", async (req, res) => {
  const { email, senha } = req.body ?? {};
  if (!email || !senha || typeof email !== "string" || typeof senha !== "string") {
    return res.status(400).json({ erro: "Informe email e senha." });
  }

  const usuario = await db
    .selectFrom("usuarios")
    .selectAll()
    .where("email", "=", email.trim().toLowerCase())
    .executeTakeFirst();

  // Mensagem generica de proposito (nao revela se o email existe ou nao).
  const credenciaisInvalidas = () => res.status(401).json({ erro: "Email ou senha incorretos." });

  if (!usuario) return credenciaisInvalidas();
  if (!usuario.ativo) {
    return res.status(403).json({ erro: "Este usuario foi desativado. Fale com um administrador." });
  }

  const ok = await verificarSenha(senha, usuario.senhaHash);
  if (!ok) return credenciaisInvalidas();

  const token = gerarToken({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel as Papel,
  });

  res.json({ token, usuario: paraUsuarioPublico(usuario) });
});

/** GET /api/auth/me - devolve o usuario dono do token atual (revalida que ainda existe/esta ativo). */
authRouter.get("/me", requireAuth, async (req, res) => {
  const usuario = await db
    .selectFrom("usuarios")
    .selectAll()
    .where("id", "=", req.usuario!.id)
    .executeTakeFirst();

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: "Sessao invalida. Faca login novamente." });
  }

  res.json(paraUsuarioPublico(usuario));
});

/** GET /api/auth/usuarios - lista a equipe (somente admin). */
authRouter.get("/usuarios", requireAuth, requireAdmin, async (_req, res) => {
  const usuarios = await db.selectFrom("usuarios").selectAll().orderBy("nome", "asc").execute();
  res.json(usuarios.map(paraUsuarioPublico));
});

/** POST /api/auth/usuarios - cria um novo usuario da equipe (somente admin). */
authRouter.post("/usuarios", requireAuth, requireAdmin, async (req, res) => {
  const { nome, email, senha, papel } = req.body ?? {};

  if (!nome || typeof nome !== "string") return res.status(400).json({ erro: "Campo 'nome' e obrigatorio." });
  if (!email || typeof email !== "string") return res.status(400).json({ erro: "Campo 'email' e obrigatorio." });
  if (!senha || typeof senha !== "string" || senha.length < 8) {
    return res.status(400).json({ erro: "A senha deve ter pelo menos 8 caracteres." });
  }
  const papelFinal: Papel = papel === "admin" ? "admin" : "visualizador";

  try {
    const senhaHash = await hashSenha(senha);
    const agora = nowIso();
    const criado = await db
      .insertInto("usuarios")
      .values({
        nome,
        email: email.trim().toLowerCase(),
        senhaHash,
        papel: papelFinal,
        ativo: 1,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    res.status(201).json(paraUsuarioPublico(criado));
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) {
      return res.status(409).json({ erro: `Ja existe um usuario com o email '${email}'.` });
    }
    throw e;
  }
});

/**
 * PATCH /api/auth/usuarios/:id - edita papel/ativo/nome, ou redefine a
 * senha (se 'senha' for enviada), de um usuario existente. Somente admin.
 */
authRouter.patch("/usuarios/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { nome, papel, ativo, senha } = req.body ?? {};

  if (id === req.usuario!.id && (papel === "visualizador" || ativo === false)) {
    return res.status(400).json({ erro: "Voce nao pode remover seu proprio acesso de administrador." });
  }

  const patch: Record<string, unknown> = { atualizadoEm: nowIso() };
  if (typeof nome === "string" && nome.trim()) patch.nome = nome.trim();
  if (papel === "admin" || papel === "visualizador") patch.papel = papel;
  if (typeof ativo === "boolean") patch.ativo = ativo ? 1 : 0;
  if (typeof senha === "string" && senha.length > 0) {
    if (senha.length < 8) return res.status(400).json({ erro: "A senha deve ter pelo menos 8 caracteres." });
    patch.senhaHash = await hashSenha(senha);
  }

  const atualizado = await db
    .updateTable("usuarios")
    .set(patch as any)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  if (!atualizado) return res.status(404).json({ erro: "Usuario nao encontrado." });
  res.json(paraUsuarioPublico(atualizado));
});

/** DELETE /api/auth/usuarios/:id - remove um usuario da equipe. Somente admin. */
authRouter.delete("/usuarios/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.usuario!.id) {
    return res.status(400).json({ erro: "Voce nao pode excluir a propria conta enquanto estiver logado." });
  }

  const deletado = await db.deleteFrom("usuarios").where("id", "=", id).executeTakeFirst();
  if (Number(deletado.numDeletedRows) === 0) return res.status(404).json({ erro: "Usuario nao encontrado." });
  res.status(204).send();
});
