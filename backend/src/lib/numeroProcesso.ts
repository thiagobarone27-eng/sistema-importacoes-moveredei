import { db } from "./db";

/** Gera o proximo numero de processo no formato IMP-{ano}-{sequencial 4 digitos}. */
export async function gerarNumeroProcesso(ano: number = new Date().getFullYear()): Promise<string> {
  const prefixo = `IMP-${ano}-`;
  const ultimo = await db
    .selectFrom("importacoes")
    .select("numeroProcesso")
    .where("numeroProcesso", "like", `${prefixo}%`)
    .orderBy("numeroProcesso", "desc")
    .executeTakeFirst();

  let proximoSeq = 1;
  if (ultimo?.numeroProcesso) {
    const partes = ultimo.numeroProcesso.split("-");
    const seqAtual = Number(partes[partes.length - 1]);
    if (!Number.isNaN(seqAtual)) proximoSeq = seqAtual + 1;
  }

  return `${prefixo}${String(proximoSeq).padStart(4, "0")}`;
}
