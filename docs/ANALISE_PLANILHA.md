# Análise da planilha original (`IMPORTACAO_MOVEREDEI_CORRIGIDO.xlsx`)

Este documento registra a análise técnica feita sobre a planilha antes de construir o sistema, para que fique claro **o que foi herdado, o que foi corrigido e por quê**. A planilha tinha 7 abas: `📋 Dados`, `📦 Por Produto`, `🏢 Por Empresa`, `✅ Status`, `📊 Dashboard`, `📈 Eficiência`, `📊 Eficiência Visual`. Nenhuma delas tinha validação de dados (dropdowns) ou formatação condicional real — toda cor era preenchimento estático aplicado célula a célula.

## Estrutura da aba `📋 Dados` (fonte única de verdade)

19 importações reais, com estas colunas: Empresa, Produto, Qtd, Valor Unitário, Câmbio Dólar, Invoice, Transporte China, Serv. Administrativo, II, IPI, PIS, COFINS, ICMS, Armazenagem, Taxa DTA, Frete Internacional, Frete Rodoviário, Taxas/Seguro, Siscomex, SDA, Agenciamento, e as colunas calculadas Total de Impostos, Total de Frete, Custos Aduaneiros, Valor Total, Valor Unitário Final e Status.

Totais gerais da planilha original (usados para validar o novo sistema): Invoice **R$ 1.653.823,37**, Impostos **R$ 842.830,76**, Frete **R$ 380.095,35**, Custos Aduaneiros **R$ 11.508,08**, Serv. Administrativo **R$ 45.142,28**, Valor Total **R$ 2.933.399,84**. O seed do novo sistema reproduz esse total exatamente.

## Fórmulas identificadas (e reaproveitadas no sistema novo)

```
Total de Impostos    = II + IPI + PIS + COFINS + ICMS
Total de Frete        = Transp. China + Armazenagem + Taxa DTA + Frete Int. + Frete Rod. + Taxas/Seguro
Custos Aduaneiros     = Siscomex + SDA + Agenciamento
Valor Total            = Invoice + Serv. Adm. + Total Impostos + Total Frete + Custos Aduaneiros
Valor Unitário Final   = Valor Total / Quantidade

① Carga Tributária    = Impostos / Invoice
② Carga de Frete       = Frete / Invoice
③ Custo Aduaneiro      = Aduaneiro / Invoice
④ Overhead %           = (Impostos + Frete + Aduaneiro + Serv.Adm.) / Invoice
⑤ Markup               = Valor Total / Invoice
⑥ Invoice % do Total   = Invoice / Valor Total
⑦ Nacionalização/un.   = Overhead Total / Quantidade
```

A classificação de eficiência original comparava `Overhead %` e `Markup` contra dois limiares (Eficiente / Regular / Alto custo). O sistema novo manteve a mesma lógica, mas ampliou para 5 níveis (Muito eficiente, Eficiente, Atenção, Ineficiente, Muito ineficiente) e tornou os 8 limiares totalmente configuráveis pela tela **Configurações → Eficiência**, em vez de fixos na fórmula.

## Bugs e inconsistências encontrados (e como foram corrigidos)

1. **Nenhuma validação de dados.** Empresa, Produto e Status eram texto livre em todas as abas — risco real de grafias divergentes ("MOVEREDEI" vs "Moveredei"). *Corrigido*: agora são entidades cadastradas (`empresas`, `produtos`, `status_importacao`) com nome único, selecionadas por busca/autocomplete no formulário.
2. **Nenhuma formatação condicional real.** Toda cor de status/eficiência era preenchimento manual, já dessincronizado em vários pontos da planilha (ex. `Eficiência!R12:R16` todas cinza, independente do resultado real da fórmula). *Corrigido*: cor e classificação são sempre calculadas em tempo real a partir dos dados, nunca armazenadas.
3. **Status "EM FABRICAÇÃO" usava a mesma cor verde de "CONCLUÍDO".** *Corrigido*: `EM_FABRICACAO` agora tem cor própria (azul).
4. **Duplicação de produto na aba `Por Produto`** ("PLACA DC Prototipo" aparecia em duas linhas separadas em vez de uma linha consolidada). *Corrigido*: todo agrupamento por produto no sistema novo é feito por `GROUP BY produto_id`, nunca por cópia manual de células.
5. **Campos manuais redundantes que dessincronizavam** (`Por Produto!Nº Embarques`, `!Empresas`, `Por Empresa!Produtos` eram texto digitado, não fórmula). *Corrigido*: essas informações agora são sempre calculadas a partir da tabela de importações.
6. **Bug de vínculo no Dashboard**: a coluna rotulada "Valor Total" no gráfico de produtos na verdade referenciava a coluna de Serv. Administrativo, não a de Valor Total — o gráfico mostrava o dado errado sob o rótulo certo. *Corrigido*: os gráficos do dashboard novo usam sempre os totais calculados corretamente por produto/empresa.
7. **Fórmula incompleta em `Por Empresa` para a empresa 7VOLT**, que somava apenas uma das duas importações dessa empresa em algumas colunas de custo — inofensivo por acaso (a outra linha estava vazia nesses campos), mas quebraria silenciosamente se preenchida. *Corrigido*: agregação sempre soma 100% das importações da empresa, sem seleção manual de células.
8. **Seleção manual e incompleta de linhas na aba `Eficiência`**: a tabela de eficiência cobria só 12 das 19 importações (excluía protótipos e itens "Em Fabricação" por escolha manual, sem critério consistente — uma importação sem nenhum custo detalhado foi incluída mesmo assim, enquanto casos parecidos foram excluídos). *Corrigido*: o módulo de Eficiência do sistema novo calcula e classifica **todas** as importações, retornando "Aguardando dados" automaticamente quando a invoice ou os custos ainda não estão preenchidos, em vez de omitir a linha.
9. **Duas metodologias de agregação coexistindo**: uma aba usava `AVERAGE()` de percentuais individuais (média simples) e outra usava soma/soma (ponderado) para a "mesma" métrica consolidada, gerando números diferentes. *Corrigido*: o sistema novo usa **sempre** a fórmula ponderada (soma dos valores absolutos, dividida no final) em qualquer agregação — por produto, por empresa, ou geral — nunca média simples de percentuais.
10. **Redundância interna na aba Eficiência** (um bloco de colunas repetia exatamente os mesmos indicadores já calculados em outro bloco da mesma linha). *Corrigido*: cada indicador é calculado uma única vez, em uma função compartilhada (`calculos.ts`), consumida por todos os módulos.
11. **Sem histórico/auditoria.** A planilha só guardava o estado atual — nenhuma trilha de quem alterou o quê e quando. *Corrigido*: toda alteração de campo e toda mudança de status agora gera uma linha em `historico_alteracoes` / `historico_status`, visível na tela de detalhe de cada importação.
12. **Fragilidade de manutenção**: adicionar 1 importação na planilha exigia editar fórmulas manualmente em pelo menos 5 abas diferentes, todas referenciando endereços de célula fixos (não nomes/SOMASE). *Corrigido*: no sistema novo, cadastrar uma importação atualiza automaticamente todos os módulos (dashboard, por produto, por empresa, eficiência, relatórios) porque tudo lê da mesma tabela normalizada.
13. **Não existia entidade "Fornecedor"** (só Empresa = cliente/tomador do serviço, e Produto). *Adicionado*: nova entidade `fornecedores`, com país de origem, pronta para uso (nenhum fornecedor existia nos dados originais, então o campo fica disponível para preenchimento nas próximas importações).
14. **Direção de cálculo inconsistente entre Valor Unitário e Invoice** (em algumas linhas um era digitado e o outro derivado, e vice-versa, sem regra fixa). *Corrigido*: o sistema define a Invoice como o dado de origem digitado pelo usuário, e o valor unitário final é sempre um resultado calculado (nunca uma segunda fonte de verdade concorrente).

## Dados que a planilha não tinha e o sistema agora suporta

A planilha original não registrava fornecedor, país de origem, nem nenhuma das datas do processo (compra, embarque previsto, embarque, chegada, nacionalização). Esses campos existem no cadastro do sistema novo, mas ficaram em branco para as 19 importações herdadas — o usuário pode preenchê-los a qualquer momento editando cada importação.
