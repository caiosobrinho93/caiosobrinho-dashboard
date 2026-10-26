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

Sem migração do banco ou alteração das chaves de armazenamento. O build continua estático, com o mesmo subcaminho do GitHub Pages e o mesmo fluxo Android. A entrega web não inclui alteração do APK ou uma auditoria completa do mecanismo de sincronização. Testes locais não substituem a verificação de login e RLS com contas reais.

Publicação pelo workflow existente `.github/workflows/pages.yml`, acionado por push na main. As variáveis Supabase existentes permanecem nas configurações do GitHub; não devem ser copiadas para o repositório.

## Segunda entrega — recuperação e listas na nuvem

- Consultas de tarefas, compras, movimentações, mídias, metas e notas percorrem páginas por ID, mantendo o filtro da conta. O carregamento continua até uma página vazia, inclusive se o servidor limitar a resposta abaixo de 500 registros. Falha em uma página cancela o resultado, evitando tratar uma lista incompleta como uma sincronização concluída. Isso não constitui um snapshot transacional entre dispositivos.
- Antes de importar um JSON, a tela mostra contagens por seção e pede confirmação. Cancelar não substitui dados. Trocar de conta fecha a confirmação pendente.
- Backups sem versão continuam compatíveis com o formato legado; versão 1 é aceita e versões desconhecidas são rejeitadas.
- Testes de regressão cobrem limite de paginação, escopo de conta, falha de rede, cursor travado e versões de backup. Teste de navegador mobile cobre cancelar, rejeitar arquivo incompatível e confirmar restauração com persistência após recarregar.
- Nenhuma migração do Supabase é necessária. A paginação foi validada com cliente simulado; não foram usados dados ou contas reais de produção.

## Revisão visual — grafite e prata

A identidade atual usa `app/design-system.css`, com fonte Manrope variável hospedada no próprio app (licença em `public/fonts/OFL-Manrope.txt`). A composição prioriza hierarquia tipográfica, superfícies neutras e detalhes de cor.

- Navegação desktop com nomes de seções, contagens e perfil.
- Barra inferior mobile com destinos diretos e acesso às áreas secundárias em Mais.
- Abertura com próxima tarefa e percentual calculado a partir dos registros reais.
- Tela de conta com prévia das áreas do produto e formulário revisado.
- Rodapé com estado real de sincronização, sem informações de código.
- Ícones PWA coerentes com o novo símbolo.

A revisão não modifica armazenamento, dados, políticas do banco nem autenticação. A publicação continua pelo GitHub Pages; o APK nativo não é regenerado nesta entrega.

Verificação desta revisão: build estático e checagem TypeScript aprovados; 10 testes automatizados aprovados. Navegador em 320, 390, 768, 1024 e 1440 px validou navegação, carregamento da fonte, comandos de teclado e abertura de formulário. Em contexto local isolado, criar/concluir tarefa persistiu após recarregar; exportação financeira e importação/cancelamento de backup continuaram funcionando. Login inspecionado em 320, 390, 768 e 1440 px com configuração pública fictícia; não foi realizado login em conta real.
