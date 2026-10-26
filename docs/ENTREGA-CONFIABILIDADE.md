# Primeira entrega de confiabilidade e exportação

Esta entrega pertence ao `caiosobrinho-dashboard`, publicado no GitHub Pages. O relatório anterior de `dashboard-caio` analisa outro aplicativo e não descreve os riscos deste projeto.

## Alterações

- Corrigido o acesso local sem Supabase: a proteção de login só exige conta quando a nuvem está configurada; antes o link de modo local voltava para o login. A exigência de conta com Supabase configurado permanece.

- Exportar movimentações financeiras em CSV com mês, busca e tipo atuais. UTF-8 com BOM, valores em formato brasileiro e proteção contra interpretação de texto como fórmula em planilhas.
- Valores monetários com texto residual ou separadores inválidos não são mais aceitos parcialmente.
- Datas inexistentes são rejeitadas no formulário financeiro e corrigidas pelo fallback já existente ao normalizar backups/cache.
- Links de mídia importados passam pela mesma normalização HTTP/HTTPS do formulário.
- Domínios que só terminam com `youtube.com` sem pertencer ao YouTube não geram mais prévias.
- Contagem de tarefas concluídas hoje usa o calendário local em vez da data UTC.
- Testes automatizados de regressão executáveis com `npm test`.

## Compatibilidade e limites

Sem migração do banco ou alteração das chaves de armazenamento. O build continua estático, com o mesmo subcaminho do GitHub Pages e o mesmo fluxo Android. A entrega não inclui alteração do APK, redesign, novos projetos ou uma auditoria completa do mecanismo de sincronização. Testes locais não substituem a verificação de login e RLS com contas reais.

Publicação pelo workflow existente `.github/workflows/pages.yml`, acionado por push na main. As variáveis Supabase existentes permanecem nas configurações do GitHub; não devem ser copiadas para o repositório.
