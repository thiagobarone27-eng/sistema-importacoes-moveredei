import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect, Generated } from "kysely";
import "dotenv/config";

// -----------------------------------------------------------------------
// NOTA IMPORTANTE SOBRE ESTA CAMADA DE DADOS
// -----------------------------------------------------------------------
// O enunciado original pedia Prisma como ORM. O ambiente sandbox onde este
// backend foi construido bloqueia por politica de rede TODO acesso a
// binaries.prisma.sh (o unico host de onde o Prisma CLI baixa os
// executaveis de query-engine/schema-engine) - inclusive `prisma -v` e
// `prisma --help` falham com 403, entao literalmente nenhum comando do
// Prisma CLI roda neste ambiente, em nenhuma versao testada (5.x e 7.x).
//
// Para nao travar o projeto, a camada de acesso a dados foi implementada
// com Kysely (query builder TypeScript, sem binarios nativos) sobre
// better-sqlite3. O arquivo prisma/schema.prisma foi mantido como
// documentacao formal do modelo de dados (e pode ser usado de verdade
// assim que o projeto rodar num ambiente com acesso a internet liberado -
// basta `prisma migrate dev` + adaptar os imports do zero, o modelo é
// idêntico ao implementado aqui). DATABASE_URL continua sendo a fonte de
// configuracao da conexao, no mesmo formato usado pelo Prisma
// ("file:./dev.db"), justamente para facilitar essa futura migracao.
// -----------------------------------------------------------------------

function resolveSqliteFile(databaseUrl: string): string {
  // Aceita o mesmo formato usado pelo Prisma: "file:./dev.db"
  const semPrefixo = databaseUrl.replace(/^file:/, "");
  return path.isAbsolute(semPrefixo) ? semPrefixo : path.join(process.cwd(), semPrefixo);
}

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const sqliteFile = resolveSqliteFile(databaseUrl);

// Garante que o diretorio existe (ex: prisma/dev.db)
fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });

export const sqlite = new Database(sqliteFile);
// NOTA: journal_mode WAL depende de locking/mmap de arquivo compartilhado
// (arquivos -wal/-shm) que nao funcionam de forma confiavel em volumes de
// rede como os usados por provedores cloud (Railway inclusive) - gravacoes
// podem ficar "presas" no -wal e sumir quando o container e substituido em
// um novo deploy, mesmo com o volume persistente corretamente montado.
// journal_mode DELETE (o padrao do SQLite) grava tudo direto no arquivo
// principal do banco, sem depender de memoria compartilhada entre
// processos/containers, o que e seguro nesse tipo de armazenamento.
sqlite.pragma("journal_mode = DELETE");
sqlite.pragma("foreign_keys = ON");


export interface EmpresaTable {
  id: Generated<number>;
  nome: string;
  criadoEm: string;
}

export interface ProdutoTable {
  id: Generated<number>;
  nome: string;
  criadoEm: string;
}

export interface FornecedorTable {
  id: Generated<number>;
  nome: string;
  pais: string | null;
  criadoEm: string;
}

export interface StatusImportacaoTable {
  id: Generated<number>;
  codigo: string;
  label: string;
  corHex: string;
  icone: string;
  categoria: string; // "fluxo" | "excecao"
  ordem: number;
}

export interface ImportacaoTable {
  id: Generated<number>;
  numeroProcesso: string | null;
  empresaId: number;
  produtoId: number;
  fornecedorId: number | null;
  statusId: number;
  quantidade: number;
  unidade: Generated<string>;
  valorUnitarioOriginal: number | null;
  cambioDolar: number | null;
  invoiceValor: number;
  transporteChina: Generated<number>;
  servicoAdmin: Generated<number>;
  impostoII: Generated<number>;
  impostoIPI: Generated<number>;
  impostoPIS: Generated<number>;
  impostoCOFINS: Generated<number>;
  impostoICMS: Generated<number>;
  armazenagem: Generated<number>;
  taxaDta: Generated<number>;
  freteInternacional: Generated<number>;
  freteRodoviario: Generated<number>;
  taxasSeguro: Generated<number>;
  siscomex: Generated<number>;
  sda: Generated<number>;
  agenciamento: Generated<number>;
  outrasDespesas: Generated<number>;
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
}

export interface HistoricoStatusTable {
  id: Generated<number>;
  importacaoId: number;
  statusAnteriorId: number | null;
  statusNovoId: number;
  alteradoPor: Generated<string>;
  alteradoEm: string;
  observacao: string | null;
}

export interface HistoricoAlteracaoTable {
  id: Generated<number>;
  importacaoId: number;
  campo: string;
  valorAntigo: string | null;
  valorNovo: string | null;
  usuario: Generated<string>;
  alteradoEm: string;
}

export interface UsuarioTable {
  id: Generated<number>;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Generated<string>; // "admin" | "visualizador"
  ativo: Generated<number>; // 1 = ativo, 0 = desativado
  criadoEm: Generated<string>;
  atualizadoEm: Generated<string>;
}

export interface ConfiguracaoEficienciaTable {
  id: Generated<number>;
  muitoEficienteOverheadMax: Generated<number>;
  muitoEficienteMarkupMax: Generated<number>;
  eficienteOverheadMax: Generated<number>;
  eficienteMarkupMax: Generated<number>;
  regularOverheadMax: Generated<number>;
  regularMarkupMax: Generated<number>;
  ineficienteOverheadMax: Generated<number>;
  ineficienteMarkupMax: Generated<number>;
  diasSemAtualizacaoAlerta: Generated<number>;
  atualizadoEm: string;
}

export interface Database {
  empresas: EmpresaTable;
  produtos: ProdutoTable;
  fornecedores: FornecedorTable;
  statusImportacao: StatusImportacaoTable;
  importacoes: ImportacaoTable;
  historicoStatus: HistoricoStatusTable;
  historicoAlteracoes: HistoricoAlteracaoTable;
  configuracaoEficiencia: ConfiguracaoEficienciaTable;
  usuarios: UsuarioTable;
}

export const db = new Kysely<Database>({
  dialect: new SqliteDialect({
    database: sqlite,
  }),
});

export function nowIso(): string {
  return new Date().toISOString();
}
