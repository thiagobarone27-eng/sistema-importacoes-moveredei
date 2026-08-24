# Guia de uso — onde encontrar cada funcionalidade pedida

Mapa rápido entre o que foi pedido e onde está implementado no sistema.

| Necessidade | Onde está |
|---|---|
| Cadastrar nova importação | `Importações → Nova importação` — formulário em 3 etapas (Identificação, Produto/Quantidade, Custos) com totais calculados ao vivo na lateral. |
| Editar importação existente | Tela de detalhe da importação → botão **Editar** (mesmo formulário em 3 etapas, pré-preenchido). |
| Acompanhar status | Tela de detalhe → **Fluxo do processo** (linha do tempo com as 9 etapas) + **Status e exceções** (aplica a qualquer momento um dos 5 status de exceção). Toda mudança é registrada e some no histórico. |
| Registrar todos os custos | Etapa 3 do cadastro (Custos): frete, impostos (II/IPI/PIS/COFINS/ICMS), custos aduaneiros (Siscomex/SDA/Agenciamento), administrativos e "outras despesas" (campo novo, catch-all). |
| Cálculo automático do custo final | Painel **Resumo calculado**, ao vivo, na tela de cadastro/edição, e painel **Indicadores calculados** na tela de detalhe. |
| Medir eficiência | Módulo **Eficiência** — tabela com os 7 indicadores e classificação em 5 níveis por importação, mais o consolidado ponderado no topo. |
| Comparar importações | Módulo **Comparação** — seleciona 2+ importações e vê todos os indicadores lado a lado, com destaque de melhor/pior. |
| Comparar produtos e empresas | Módulos **Por Produto** e **Por Empresa** — cada um com análise agregada e evolução histórica. |
| Relatórios gerenciais | Módulo **Relatórios** — os 10 relatórios pedidos, com filtros combinados e exportação em Excel/PDF. |
| Dashboards | **Dashboard** (visão executiva geral) + os próprios módulos de Eficiência/Produto/Empresa/Relatórios têm seus indicadores visuais. |
| Histórico das importações | Abas **Histórico de status** e **Histórico de alterações** na tela de detalhe de cada importação. |
| Filtros por período, empresa, produto, status etc. | Painel de filtros no topo de Importações, Eficiência, Dashboard e Relatórios — todos combináveis. |
| Eliminar fórmulas manuais no Excel | Todo cálculo é feito pelo backend, sempre a partir dos valores brutos — nenhuma fórmula para o usuário manter. |

## Fluxo de status

Fluxo normal (linha do tempo, uma etapa de cada vez):

```
Planejamento → Pedido realizado → Produção → Pronto para embarque → Em trânsito
→ Chegada ao Brasil → Desembaraço → Nacionalizada → Concluída
```

Status de exceção (podem ser aplicados a qualquer momento, sem quebrar o fluxo normal): Aguardando informação, Atrasada, Problema documental, Problema aduaneiro, Cancelada.

## Classificação de eficiência (5 níveis, limiares configuráveis)

🟢 Muito eficiente → 🟢 Eficiente → 🟡 Atenção → 🟠 Ineficiente → 🔴 Muito ineficiente, com um estado neutro ⏳ "Aguardando dados" quando a importação ainda não tem custos suficientes lançados. Os 8 limiares (overhead % e markup de cada faixa) ficam em **Configurações → Eficiência**; os valores default reproduzem os limiares originais da planilha.

## Importação de novas planilhas

`Importar planilha` faz upload de um `.xlsx`, mostra um preview com linhas válidas / linhas com erro (e o motivo) / duplicidades detectadas (desmarcadas por padrão), e só grava no banco depois da confirmação do usuário — nada é importado silenciosamente.

## O que fica para uma fase futura (arquitetura já preparada)

Autenticação/permissões por usuário, multiempresa, integrações com ERP/financeiro, notificações por e-mail/WhatsApp, anexos de documentos (invoice, packing list, B/L, documentos aduaneiros), controle de pagamentos e de estoque. O campo `Configurações` do sistema já reserva o espaço de navegação para essas telas, e o banco de dados normalizado (ver `docs/ANALISE_PLANILHA.md`) foi desenhado para crescer nessa direção sem precisar de retrabalho estrutural.
