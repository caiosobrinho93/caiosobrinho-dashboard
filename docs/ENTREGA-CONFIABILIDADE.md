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

## Segunda entrega — recuperação e listas na nuvem

- Consultas de tarefas, compras, movimentações, mídias, metas e notas percorrem páginas por ID, mantendo o filtro da conta. O carregamento continua até uma página vazia, inclusive se o servidor limitar a resposta abaixo de 500 registros. Falha em uma página cancela o resultado, evitando tratar uma lista incompleta como uma sincronização concluída. Isso não constitui um snapshot transacional entre dispositivos.
- Antes de importar um JSON, a tela mostra contagens por seção e pede confirmação. Cancelar não substitui dados. Trocar de conta fecha a confirmação pendente.
- Backups sem versão continuam compatíveis com o formato legado; versão 1 é aceita e versões desconhecidas são rejeitadas.
- Testes de regressão cobrem limite de paginação, escopo de conta, falha de rede, cursor travado e versões de backup. Teste de navegador mobile cobre cancelar, rejeitar arquivo incompatível e confirmar restauração com persistência após recarregar.
- Nenhuma migração do Supabase é necessária. A paginação foi validada com cliente simulado; não foram usados dados ou contas reais de produção.

## Identidade visual Orbit

Nova camada visual em `app/orbit.css`, com tokens compartilhados, tipografia, superfícies, botões, formulários, navegação e cartões. Login com composição orbital responsiva e tela inicial com saudação, progresso real de tarefas e acesso ao dia. Ilustração CSS sem recursos externos; animação desativada com movimento reduzido. Ícones web e tema da PWA atualizados. Nenhuma alteração do formato dos dados ou migração de banco.

Validação visual de login em 320, 390 e 1440 px, sem overflow horizontal; controles de senha e preferência de movimento reduzido conferidos. Testes mobile de CSV, navegação e restauração de backup preservados. O formulário de login foi inspecionado com configuração pública fictícia de teste, sem autenticação real; o deploy usa as variáveis existentes do GitHub. Corrigida também a tela inicial em modo local, que ainda mostrava o acesso à conta apesar da nuvem estar desativada.
