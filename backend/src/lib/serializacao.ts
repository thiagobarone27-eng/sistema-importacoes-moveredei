import { calcularIndicadores, classificarEficiencia, ConfigEficienciaLimiares } from "./calculos";

// Formato "cru" que vem do Prisma (Importacao com relations opcionalmente
// incluidas). Usamos `any` propositalmente aqui para nao acoplar este
// arquivo aos tipos gerados pelo Prisma Client (que variam conforme os
// `include` usados em cada rota).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function comIndicadores(imp: any, config?: ConfigEficienciaLimiares) {
  const indicadores = calcularIndicadores({
    quantidade: imp.quantidade,
    invoiceValor: imp.invoiceValor,
    transporteChina: imp.transporteChina,
    servicoAdmin: imp.servicoAdmin,
    impostoII: imp.impostoII,
    impostoIPI: imp.impostoIPI,
    impostoPIS: imp.impostoPIS,
    impostoCOFINS: imp.impostoCOFINS,
    impostoICMS: imp.impostoICMS,
    armazenagem: imp.armazenagem,
    taxaDta: imp.taxaDta,
    freteInternacional: imp.freteInternacional,
    freteRodoviario: imp.freteRodoviario,
    taxasSeguro: imp.taxasSeguro,
    siscomex: imp.siscomex,
    sda: imp.sda,
    agenciamento: imp.agenciamento,
    outrasDespesas: imp.outrasDespesas,
  });

  const classificacao = config
    ? classificarEficiencia(indicadores.overheadPct, indicadores.markup, config)
    : undefined;

  return {
    ...imp,
    indicadores,
    ...(classificacao ? { classificacaoEficiencia: classificacao } : {}),
  };
}
