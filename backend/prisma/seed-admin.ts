// Cria o PRIMEIRO usuario administrador do sistema, a partir das variaveis
// de ambiente ADMIN_EMAIL / ADMIN_SENHA_INICIAL / ADMIN_NOME.
//
// IMPORTANTE (leia antes de mexer): ao contrario de prisma/seed.ts, este
// script e 100% NAO destrutivo e idempotente - ele so insere um admin
// quando a tabela "usuarios" esta VAZIA. Se ja existir qualquer usuario
// (por exemplo porque alguem ja trocou a senha ou criou outras contas),
// o script nao faz nada. Por isso e seguro deixar rodando em todo
// deploy (dentro do startCommand), igual ao migrate.ts - ele nunca vai
// apagar ou resetar contas depois da primeira execucao.
import { db } from "../src/lib/db";
import { hashSenha } from "../src/lib/auth";

async function main() {
  const jaTemUsuario = await db.selectFrom("usuarios").select("id").executeTakeFirst();
  if (jaTemUsuario) {
    console.log("Seed-admin: ja existe pelo menos um usuario cadastrado, nada a fazer.");
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA_INICIAL;
  const nome = process.env.ADMIN_NOME || "Administrador";

  if (!email || !senha) {
    console.warn(
      "Seed-admin: ADMIN_EMAIL/ADMIN_SENHA_INICIAL nao configurados - " +
        "nenhum usuario admin foi criado. Configure essas variaveis e faca " +
        "um novo deploy, ou crie o primeiro admin manualmente."
    );
    return;
  }

  const senhaHash = await hashSenha(senha);
  const agora = new Date().toISOString();

  await db
    .insertInto("usuarios")
    .values({
      nome,
      email: email.trim().toLowerCase(),
      senhaHash,
      papel: "admin",
      ativo: 1,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .execute();

  console.log(`Seed-admin: usuario administrador '${email}' criado com sucesso.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.destroy();
  });
