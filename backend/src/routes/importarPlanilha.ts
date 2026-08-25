import { Router } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { db, nowIso } from "../lib/db";
import { gerarNumeroProcesso } from "../lib/numeroProcesso";

export const importarPlanilhaRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Cada campo interno mapeia para uma lista de possiveis nomes de coluna
// (ja normalizados - sem acento, minusculo) encontrados na planilha.
const ALIASES: Record<string, string[]> = {
  empresa: ["empresa", "cliente", "empresa/cliente"],
  produto: ["produto", "item", "descricao"],
  quantidade: ["quantidade", "qtd", "qtde"],
  valorUnitarioOriginal: ["valor unitario", "vl unitario", "preco unitario", "valor unit"],
  cambioDolar: ["cambio", "dolar", "cambio dolar", "cotacao dolar"],
  invoiceValor: ["invoice", "valor invoice", "invoice valor"],
  transporteChina: ["transporte china", "frete china"],
  servicoAdmin: ["servico admin", "servico administrativo"],
  impostoII: ["ii", "imposto ii"],
  impostoIPI: ["ipi", "imposto ipi"],
  impostoPIS: ["pis", "imposto pis"],
  impostoCOFINS: ["cofins", "imposto cofins"],
  impostoICMS: ["icms", "imposto icms"],
  armazenagem: ["armazenagem"],
  taxaDta: ["dta", "taxa dta"],
  freteInternacional: ["frete internacional"],
  freteRodoviario: ["frete rodoviario"],
  taxasSeguro: ["seguro", "taxas seguro", "taxa seguro"],
  siscomex: ["siscomex", "tx siscomex"],
  sda: ["sda", "s.d.a", "s d a"],
  agenciamento: ["agenciamento"],
  cambioFrete: ["cambio do dia do frete", "cambio frete"],
  airFreight: ["air freight"],
  desconsolidacao: ["desconsolidacao"],
  taxaLiberacao: ["taxa de liberacao", "taxa liberacao"],
  docFeeOrigin: ["doc fee origin", "doc fee"],
  customsOrigin: ["customs origin"],
  pickUp: ["pick up", "pickup"],
  palletFee: ["pallet fee"],
  exportLicense: ["export license"],
  devolucaoVazio: ["devolucao vazio", "devolucao de vazio"],
  lavagem: ["lavagem"],
  fichaEmergencia: ["ficha de emergencia", "ficha emergencia"],
  impostosFederais: ["impostos federais"],
  afrmm: ["afrmm"],
  honorarios: ["honorarios"],
  licenciamento: ["licenciamento"],
  status: ["status", "situacao"],
};

const CAMPOS_OBRIGATORIOS = ["empresa", "produto", "quantidade", "invoiceValor"];
const CAMPOS_NUMERICOS = [
  "quantidade",
  "valorUnitarioOriginal",
  "cambioDolar",
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
  "cambioFrete",
  "airFreight",
  "desconsolidacao",
  "taxaLiberacao",
  "docFeeOrigin",
  "customsOrigin",
  "pickUp",
  "palletFee",
  "exportLicense",
  "devolucaoVazio",
  "lavagem",
  "fichaEmergencia",
  "impostosFederais",
  "afrmm",
  "honorarios",
  "licenciamento",
];

function encontrarAba(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const porNome = workbook.worksheets.find((ws) => normalizarTexto(ws.name).includes("dados"));
  return porNome || workbook.worksheets[0];
}

function mapearColunas(headerRow: ExcelJS.Row): Map<number, string> {
  const mapa = new Map<number, string>();
  headerRow.eachCell((cell, colNumber) => {
    const texto = normalizarTexto(String(cell.value ?? ""));
    if (!texto) return;
    for (const [campo, aliases] of Object.entries(ALIASES)) {
      if (aliases.some((a) => texto === a || texto.includes(a))) {
        mapa.set(colNumber, campo);
        break;
      }
    }
  });
  return mapa;
}

function paraNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return valor;
  const limpo = String(valor).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(limpo || valor);
  return Number.isNaN(n) ? null : n;
}

interface LinhaProcessada {
  linha: number;
  dados: Record<string, unknown>;
  erros: string[];
}

async function processarPlanilha(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const aba = encontrarAba(workbook);
  const headerRow = aba.getRow(1);
  const colunas = mapearColunas(headerRow);

  const linhasValidas: LinhaProcessada[] = [];
  const linhasComErro: LinhaProcessada[] = [];

  aba.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const valores: Record<string, unknown> = {};
    let temAlgumValor = false;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const campo = colunas.get(colNumber);
      if (!campo) return;
      let valor: unknown = cell.value;
      if (valor && typeof valor === "object" && "result" in (valor as any)) valor = (valor as any).result;
      if (valor !== null && valor !== undefined && valor !== "") temAlgumValor = true;

      if (campo === "status" || campo === "empresa" || campo === "produto") {
        valores[campo] = valor !== null && valor !== undefined ? String(valor).trim() : null;
      } else if (CAMPOS_NUMERICOS.includes(campo)) {
        valores[campo] = paraNumero(valor);
      } else {
        valores[campo] = valor;
      }
    });

    if (!temAlgumValor) return; // linha em branco, ignora

    const erros: string[] = [];
    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (valores[campo] === null || valores[campo] === undefined || valores[campo] === "") {
        erros.push(`Campo obrigatorio ausente: ${campo}`);
      }
    }
    for (const campo of CAMPOS_NUMERICOS) {
      if (campo in valores && valores[campo] === null && CAMPOS_OBRIGATORIOS.includes(campo)) {
        erros.push(`Valor nao numerico no campo obrigatorio: ${campo}`);
      }
    }

    const item: LinhaProcessada = { linha: rowNumber, dados: valores, erros };
    if (erros.length > 0) linhasComErro.push(item);
    else linhasValidas.push(item);
  });

  return { linhasValidas, linhasComErro };
}

async function detectarDuplicidades(linhas: LinhaProcessada[]) {
  const existentes = await db
    .selectFrom("importacoes as i")
    .innerJoin("empresas as e", "e.id", "i.empresaId")
    .innerJoin("produtos as p", "p.id", "i.produtoId")
    .select(["i.id", "e.nome as empresa", "p.nome as produto", "i.invoiceValor", "i.quantidade"])
    .where("i.arquivadoEm", "is", null)
    .execute();

  const chaveDe = (empresa: string, produto: string, invoiceValor: number, quantidade: number) =>
    `${normalizarTexto(empresa)}|${normalizarTexto(produto)}|${invoiceValor}|${quantidade}`;

  const chavesExistentes = new Set(existentes.map((e) => chaveDe(e.empresa, e.produto, e.invoiceValor, e.quantidade)));

  const duplicidadesDetectadas: Array<{ linha: number; motivo: string }> = [];
  const vistasNoLote = new Set<string>();

  for (const item of linhas) {
    const chave = chaveDe(
      String(item.dados.empresa),
      String(item.dados.produto),
      Number(item.dados.invoiceValor),
      Number(item.dados.quantidade)
    );
    if (chavesExistentes.has(chave)) {
      duplicidadesDetectadas.push({ linha: item.linha, motivo: "Ja existe uma importacao com mesma empresa+produto+invoice+quantidade." });
    } else if (vistasNoLote.has(chave)) {
      duplicidadesDetectadas.push({ linha: item.linha, motivo: "Linha duplicada dentro da propria planilha enviada." });
    }
    vistasNoLote.add(chave);
  }

  return duplicidadesDetectadas;
}

importarPlanilhaRouter.post("/", upload.single("arquivo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: "Envie o arquivo no campo 'arquivo' (multipart/form-data)." });

  const { linhasValidas, linhasComErro } = await processarPlanilha(req.file.buffer);
  const duplicidadesDetectadas = await detectarDuplicidades(linhasValidas);

  res.json({
    linhasValidas: linhasValidas.map((l) => ({ linha: l.linha, dados: l.dados })),
    linhasComErro: linhasComErro.map((l) => ({ linha: l.linha, dados: l.dados, motivos: l.erros })),
    duplicidadesDetectadas,
  });
});

importarPlanilhaRouter.post("/confirmar", async (req, res) => {
  const linhas: Array<Record<string, unknown>> = req.body.linhas || [];
  if (!Array.isArray(linhas) || linhas.length === 0) {
    return res.status(400).json({ erro: "Envie { linhas: [...] } com as linhas ja validadas." });
  }

  const statusTodos = await db.selectFrom("statusImportacao").select(["id", "codigo", "label"]).execute();

  const MAPA_STATUS_TEXTO: Record<string, string> = {
    "concluido": "CONCLUIDO",
    "concluido c pendencias": "CONCLUIDO_PENDENCIAS",
    "pendente": "PENDENTE",
    "em fabricacao": "EM_FABRICACAO",
  };

  function resolverStatusId(statusTexto: unknown): number {
    const chave = normalizarTexto(String(statusTexto ?? "")).replace(/[✓✗⚠./]/g, "").trim();
    const codigo = MAPA_STATUS_TEXTO[chave];
    const encontrado = statusTodos.find((s) => s.codigo === codigo);
    return encontrado ? encontrado.id : statusTodos.find((s) => s.codigo === "PLANEJAMENTO")!.id;
  }

  let criadas = 0;
  const agora = nowIso();

  for (const linha of linhas) {
    const nomeEmpresa = String(linha.empresa).trim();
    const nomeProduto = String(linha.produto).trim();

    let empresa = await db.selectFrom("empresas").select("id").where("nome", "=", nomeEmpresa).executeTakeFirst();
    if (!empresa) {
      empresa = await db.insertInto("empresas").values({ nome: nomeEmpresa, criadoEm: agora }).returning("id").executeTakeFirstOrThrow();
    }

    let produto = await db.selectFrom("produtos").select("id").where("nome", "=", nomeProduto).executeTakeFirst();
    if (!produto) {
      produto = await db.insertInto("produtos").values({ nome: nomeProduto, criadoEm: agora }).returning("id").executeTakeFirstOrThrow();
    }

    const statusId = resolverStatusId(linha.status);

    const numToNum = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
    const numeroProcesso = await gerarNumeroProcesso();

    const criada = await db
      .insertInto("importacoes")
      .values({
        numeroProcesso,
        empresaId: empresa.id,
        produtoId: produto.id,
        fornecedorId: null,
        statusId,
        quantidade: numToNum(linha.quantidade),
        unidade: "un",
        valorUnitarioOriginal: linha.valorUnitarioOriginal !== undefined ? numToNum(linha.valorUnitarioOriginal) : null,
        cambioDolar: linha.cambioDolar !== undefined ? numToNum(linha.cambioDolar) : null,
        invoiceValor: numToNum(linha.invoiceValor),
        transporteChina: numToNum(linha.transporteChina),
        servicoAdmin: numToNum(linha.servicoAdmin),
        impostoII: numToNum(linha.impostoII),
        impostoIPI: numToNum(linha.impostoIPI),
        impostoPIS: numToNum(linha.impostoPIS),
        impostoCOFINS: numToNum(linha.impostoCOFINS),
        impostoICMS: numToNum(linha.impostoICMS),
        armazenagem: numToNum(linha.armazenagem),
        taxaDta: numToNum(linha.taxaDta),
        freteInternacional: numToNum(linha.freteInternacional),
        freteRodoviario: numToNum(linha.freteRodoviario),
        taxasSeguro: numToNum(linha.taxasSeguro),
        siscomex: numToNum(linha.siscomex),
        sda: numToNum(linha.sda),
        agenciamento: numToNum(linha.agenciamento),
        outrasDespesas: 0,
        cambioFrete: linha.cambioFrete !== undefined ? numToNum(linha.cambioFrete) : null,
        airFreight: numToNum(linha.airFreight),
        desconsolidacao: numToNum(linha.desconsolidacao),
        taxaLiberacao: numToNum(linha.taxaLiberacao),
        docFeeOrigin: numToNum(linha.docFeeOrigin),
        customsOrigin: numToNum(linha.customsOrigin),
        pickUp: numToNum(linha.pickUp),
        palletFee: numToNum(linha.palletFee),
        exportLicense: numToNum(linha.exportLicense),
        devolucaoVazio: numToNum(linha.devolucaoVazio),
        lavagem: numToNum(linha.lavagem),
        fichaEmergencia: numToNum(linha.fichaEmergencia),
        impostosFederais: numToNum(linha.impostosFederais),
        afrmm: numToNum(linha.afrmm),
        honorarios: numToNum(linha.honorarios),
        licenciamento: numToNum(linha.licenciamento),
        dataCompra: null,
        dataPrevistaEmbarque: null,
        dataEmbarque: null,
        dataChegada: null,
        dataNacionalizacao: null,
        paisOrigem: null,
        observacoes: "Importado via upload de planilha.",
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
        observacao: "Status inicial importado via upload de planilha.",
      })
      .execute();

    criadas += 1;
  }

  res.status(201).json({ criadas });
});
