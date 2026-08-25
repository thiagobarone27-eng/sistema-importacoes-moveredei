import fs from "node:fs";
import path from "node:path";
import { db, nowIso } from "../src/lib/db";

// Le o seed-data.json copiado para dentro de prisma/ (prisma/seed-data.json).
// Mantemos uma copia local em vez de ler o caminho absoluto original
// (/root/project/seed-data.json) para que o backend continue seedavel
// mesmo se movido para outra maquina/repositorio; se precisar re-importar
// os dados originais, basta copiar o arquivo de novo para este caminho.
const SEED_DATA_PATH = path.join(__dirname, "seed-data.json");

interface ImportacaoSeed {
  empresa: string;
  produto: string;
  quantidade: number;
  valorUnitarioOriginal: number;
  cambioDolar: number;
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
  statusOriginal: string;
}

interface SeedData {
  empresas: string[];
  produtos: string[];
  statusesEncontrados: string[];
  totalRegistros: number;
  importacoes: ImportacaoSeed[];
}

const MAPA_STATUS_ORIGINAL: Record<string, string> = {
  "CONCLUÍDO ✓": "CONCLUIDO",
  "CONCLUÍDO c/ pendências ⚠": "CONCLUIDO_PENDENCIAS",
  "PENDENTE ✗": "PENDENTE",
  "EM FABRICAÇÃO": "EM_FABRICACAO",
};

// Lista completa de status do sistema: os 4 vindos da planilha original +
// o fluxo normal completo + os estados de excecao, cada um com cor,
// icone, categoria e ordem (para a tela de fluxo visual).
// NOTA IMPORTANTE: na planilha original "EM FABRICAÇÃO" usava a MESMA cor
// verde de "CONCLUÍDO ✓" (bug visual). Aqui corrigimos dando a
// EM_FABRICACAO uma cor azul propria, nunca igual a de concluido.
const STATUS_SEED: Array<{
  codigo: string;
  label: string;
  corHex: string;
  icone: string;
  categoria: "fluxo" | "excecao";
  ordem: number;
}> = [
  // --- fluxo normal ---
  { codigo: "PLANEJAMENTO", label: "Planejamento", corHex: "#94A3B8", icone: "📋", categoria: "fluxo", ordem: 1 },
  { codigo: "PEDIDO_REALIZADO", label: "Pedido Realizado", corHex: "#6366F1", icone: "🧾", categoria: "fluxo", ordem: 2 },
  { codigo: "PRODUCAO", label: "Em Produção", corHex: "#0EA5E9", icone: "⚙️", categoria: "fluxo", ordem: 3 },
  { codigo: "EM_FABRICACAO", label: "Em Fabricação", corHex: "#2563EB", icone: "🏭", categoria: "fluxo", ordem: 4 },
  { codigo: "PRONTO_EMBARQUE", label: "Pronto p/ Embarque", corHex: "#8B5CF6", icone: "📦", categoria: "fluxo", ordem: 5 },
  { codigo: "EM_TRANSITO", label: "Em Trânsito", corHex: "#06B6D4", icone: "🚢", categoria: "fluxo", ordem: 6 },
  { codigo: "CHEGADA_BRASIL", label: "Chegada no Brasil", corHex: "#14B8A6", icone: "🛬", categoria: "fluxo", ordem: 7 },
  { codigo: "DESEMBARACO", label: "Desembaraço Aduaneiro", corHex: "#F97316", icone: "🛃", categoria: "fluxo", ordem: 8 },
  { codigo: "NACIONALIZADA", label: "Nacionalizada", corHex: "#22C55E", icone: "🏛️", categoria: "fluxo", ordem: 9 },
  { codigo: "CONCLUIDA", label: "Concluída", corHex: "#15803D", icone: "✅", categoria: "fluxo", ordem: 10 },
  { codigo: "CONCLUIDO", label: "Concluído", corHex: "#16A34A", icone: "✔️", categoria: "fluxo", ordem: 11 },
  { codigo: "CONCLUIDO_PENDENCIAS", label: "Concluído c/ Pendências", corHex: "#F59E0B", icone: "⚠️", categoria: "fluxo", ordem: 12 },
  // --- excecao ---
  { codigo: "PENDENTE", label: "Pendente", corHex: "#DC2626", icone: "✗", categoria: "excecao", ordem: 1 },
  { codigo: "AGUARDANDO_INFORMACAO", label: "Aguardando Informação", corHex: "#A855F7", icone: "❓", categoria: "excecao", ordem: 2 },
  { codigo: "ATRASADA", label: "Atrasada", corHex: "#B91C1C", icone: "⏰", categoria: "excecao", ordem: 3 },
  { codigo: "PROBLEMA_DOCUMENTAL", label: "Problema Documental", corHex: "#EA580C", icone: "📄", categoria: "excecao", ordem: 4 },
  { codigo: "PROBLEMA_ADUANEIRO", label: "Problema Aduaneiro", corHex: "#C2410C", icone: "🚫", categoria: "excecao", ordem: 5 },
  { codigo: "CANCELADA", label: "Cancelada", corHex: "#6B7280", icone: "❌", categoria: "excecao", ordem: 6 },
];

async function main() {
  console.log("Seed: iniciando...");

  const raw = fs.readFileSync(SEED_DATA_PATH, "utf-8");
  const data: SeedData = JSON.parse(raw);

  // 1) Status (upsert manual: insere se nao existir, senao atualiza)
  for (const s of STATUS_SEED) {
    const existente = await db
      .selectFrom("statusImportacao")
      .select("id")
      .where("codigo", "=", s.codigo)
      .executeTakeFirst();

    if (existente) {
      await db
        .updateTable("statusImportacao")
        .set({ label: s.label, corHex: s.corHex, icone: s.icone, categoria: s.categoria, ordem: s.ordem })
        .where("id", "=", existente.id)
        .execute();
    } else {
      await db.insertInto("statusImportacao").values(s).execute();
    }
  }
  console.log(`Seed: ${STATUS_SEED.length} status cadastrados.`);

  // 2) Empresas
  const empresasMap = new Map<string, number>();
  for (const nome of data.empresas) {
    const existente = await db.selectFrom("empresas").select("id").where("nome", "=", nome).executeTakeFirst();
    if (existente) {
      empresasMap.set(nome, existente.id);
    } else {
      const criado = await db
        .insertInto("empresas")
        .values({ nome, criadoEm: nowIso() })
        .returning("id")
        .executeTakeFirstOrThrow();
      empresasMap.set(nome, criado.id);
    }
  }
  console.log(`Seed: ${empresasMap.size} empresas cadastradas.`);

  // 3) Produtos
  const produtosMap = new Map<string, number>();
  for (const nome of data.produtos) {
    const existente = await db.selectFrom("produtos").select("id").where("nome", "=", nome).executeTakeFirst();
    if (existente) {
      produtosMap.set(nome, existente.id);
    } else {
      const criado = await db
        .insertInto("produtos")
        .values({ nome, criadoEm: nowIso() })
        .returning("id")
        .executeTakeFirstOrThrow();
      produtosMap.set(nome, criado.id);
    }
  }
  console.log(`Seed: ${produtosMap.size} produtos cadastrados.`);

  // 4) Configuracao de eficiencia (singleton com defaults do enunciado)
  const configExistente = await db.selectFrom("configuracaoEficiencia").select("id").executeTakeFirst();
  if (!configExistente) {
    await db
      .insertInto("configuracaoEficiencia")
      .values({
        muitoEficienteOverheadMax: 0.4,
        muitoEficienteMarkupMax: 1.4,
        eficienteOverheadMax: 0.7,
        eficienteMarkupMax: 1.8,
        regularOverheadMax: 1.0,
        regularMarkupMax: 2.2,
        ineficienteOverheadMax: 1.5,
        ineficienteMarkupMax: 3.0,
        diasSemAtualizacaoAlerta: 15,
        atualizadoEm: nowIso(),
      })
      .execute();
    console.log("Seed: ConfiguracaoEficiencia criada (singleton).");
  } else {
    console.log("Seed: ConfiguracaoEficiencia ja existia, mantida.");
  }

  // 5) Importacoes reais (19 registros)
  const statusCodigos = await db.selectFrom("statusImportacao").select(["id", "codigo"]).execute();
  const statusPorCodigo = new Map(statusCodigos.map((s) => [s.codigo, s.id]));

  const anoSeed = new Date().getFullYear();
  let seq = 1;

  // Limpa importacoes anteriores para permitir re-seed idempotente sem
  // duplicar os 19 registros a cada `npm run prisma:seed`.
  await db.deleteFrom("historicoAlteracoes").execute();
  await db.deleteFrom("historicoStatus").execute();
  await db.deleteFrom("importacoes").execute();

  for (const item of data.importacoes) {
    const empresaId = empresasMap.get(item.empresa);
    const produtoId = produtosMap.get(item.produto);
    const codigoStatus = MAPA_STATUS_ORIGINAL[item.statusOriginal];
    const statusId = codigoStatus ? statusPorCodigo.get(codigoStatus) : undefined;

    if (!empresaId) throw new Error(`Empresa nao encontrada no seed: ${item.empresa}`);
    if (!produtoId) throw new Error(`Produto nao encontrado no seed: ${item.produto}`);
    if (!statusId) throw new Error(`Status nao mapeado no seed: ${item.statusOriginal}`);

    const numeroProcesso = `IMP-${anoSeed}-${String(seq).padStart(4, "0")}`;
    seq += 1;

    const agora = nowIso();
    const criada = await db
      .insertInto("importacoes")
      .values({
        numeroProcesso,
        empresaId,
        produtoId,
        fornecedorId: null,
        statusId,
        quantidade: item.quantidade,
        unidade: "un",
        valorUnitarioOriginal: item.valorUnitarioOriginal,
        cambioDolar: item.cambioDolar,
        invoiceValor: item.invoiceValor,
        transporteChina: item.transporteChina,
        servicoAdmin: item.servicoAdmin,
        impostoII: item.impostoII,
        impostoIPI: item.impostoIPI,
        impostoPIS: item.impostoPIS,
        impostoCOFINS: item.impostoCOFINS,
        impostoICMS: item.impostoICMS,
        armazenagem: item.armazenagem,
        taxaDta: item.taxaDta,
        freteInternacional: item.freteInternacional,
        freteRodoviario: item.freteRodoviario,
        taxasSeguro: item.taxasSeguro,
        siscomex: item.siscomex,
        sda: item.sda,
        agenciamento: item.agenciamento,
        outrasDespesas: 0,
        // Campos novos (pedido de ago/2026): nao existem na planilha
        // historica original, entao ficam zerados/nulos - usuario preenche
        // depois pela interface se quiser retroagir algum registro antigo.
        cambioFrete: null,
        airFreight: 0,
        desconsolidacao: 0,
        taxaLiberacao: 0,
        docFeeOrigin: 0,
        customsOrigin: 0,
        pickUp: 0,
        palletFee: 0,
        exportLicense: 0,
        devolucaoVazio: 0,
        lavagem: 0,
        fichaEmergencia: 0,
        impostosFederais: 0,
        afrmm: 0,
        honorarios: 0,
        licenciamento: 0,
        // Nenhuma data existia na planilha original - fica NULL, usuario
        // preenche depois pela interface.
        dataCompra: null,
        dataPrevistaEmbarque: null,
        dataEmbarque: null,
        dataChegada: null,
        dataNacionalizacao: null,
        paisOrigem: null,
        observacoes: `Importado do historico da planilha original. Status original: "${item.statusOriginal}".`,
        arquivadoEm: null,
        criadoEm: agora,
        atualizadoEm: agora,
        criadoPor: "Thiago",
        atualizadoPor: "Thiago",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    await db
      .insertInto("historicoStatus")
      .values({
        importacaoId: criada.id,
        statusAnteriorId: null,
        statusNovoId: statusId,
        alteradoPor: "Thiago",
        alteradoEm: agora,
        observacao: "Status inicial importado da planilha original.",
      })
      .execute();
  }

  console.log(`Seed: ${data.importacoes.length} importacoes criadas.`);

  // 6) Conferencia de totais
  const linhas = await db
    .selectFrom("importacoes")
    .select([
      "invoiceValor",
      "transporteChina",
      "servicoAdmin",
      "impostoII",
      "impostoIPI",
      "impostoPIS",
      "impostoCOFINS",
      "impostoICMS",
      "armazenagem",
      "taxaDta",
      "freteInternacional",
      "freteRodoviario",
      "taxasSeguro",
      "siscomex",
      "sda",
      "agenciamento",
    ])
    .execute();

  let somaInvoice = 0;
  let somaGeral = 0;
  for (const l of linhas) {
    somaInvoice += l.invoiceValor;
    somaGeral +=
      l.invoiceValor +
      l.transporteChina +
      l.servicoAdmin +
      l.impostoII +
      l.impostoIPI +
      l.impostoPIS +
      l.impostoCOFINS +
      l.impostoICMS +
      l.armazenagem +
      l.taxaDta +
      l.freteInternacional +
      l.freteRodoviario +
      l.taxasSeguro +
      l.siscomex +
      l.sda +
      l.agenciamento;
  }

  console.log("----- CONFERENCIA DE TOTAIS -----");
  console.log(`Total de registros: ${linhas.length}`);
  console.log(`Soma invoiceValor:  ${somaInvoice.toFixed(2)} (esperado 1653823.37)`);
  console.log(`Soma geral (valorTotal): ${somaGeral.toFixed(2)} (esperado 2933399.84)`);

  const okInvoice = Math.abs(somaInvoice - 1653823.37) < 0.05;
  const okGeral = Math.abs(somaGeral - 2933399.84) < 0.05;

  if (!okInvoice || !okGeral) {
    throw new Error(
      `CONFERENCIA FALHOU! invoice ok=${okInvoice} geral ok=${okGeral}. ` +
        `Ha um bug no seed ou nos calculos - os dados da planilha ja foram validados.`
    );
  }

  console.log("Conferencia OK: totais batem com os valores esperados da planilha original.");
  console.log("Seed concluido com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.destroy();
  });
