# Fase 2 — Supabase

Este documento descreve a evolução do dashboard de “local-first” para uma aplicação com login e
sincronização entre dispositivos. O frontend atual já foi modelado para essa transição.

## Estado atual

- `lib/store.tsx` concentra estado, CRUD e persistência.
- `lib/types.ts` define o contrato usado pelas telas.
- `lib/normalize.ts` valida dados locais/importados.
- `lib/seed.ts` fornece demonstração e estado vazio.
- Não existe SDK, sessão, rota de API ou chamada de rede para dados.

A regra de ouro da migração: **as telas não devem importar o Supabase diretamente**. Elas continuam
consumindo `useStore()`. O provider passa a escolher entre repositório local e remoto.

## Arquitetura alvo

```text
Componentes / páginas
        │
        ▼
   useStore() / StoreProvider
        │
        ├── repositório local (localStorage, offline)
        └── repositório Supabase (auth + Postgres)
                  │
                  ▼
         Supabase Auth / RLS / Postgres
```

Fluxo recomendado:

1. Autenticar com Supabase Auth.
2. Ao entrar, carregar o perfil e os dados do usuário.
3. Se a conta estiver vazia e existir um backup local, oferecer importação única.
4. Manter uma cópia em `localStorage` como cache e fila de escrita offline.
5. Sincronizar em background; indicar estado em Configurações e na status bar.
6. Sair deve limpar o cache específico daquele usuário, não o dispositivo inteiro.

## Configuração do projeto

1. Crie um projeto em <https://supabase.com>.
2. Rode `supabase/schema.sql` no SQL Editor (ou via CLI/migração).
3. Em **Authentication → Providers**, habilite e-mail/senha e, se quiser, magic link ou OAuth.
4. Em **Project Settings → API**, copie URL e chave pública para `.env.local`.
5. Em **Authentication → URL Configuration**, configure a URL da Vercel e `http://localhost:3000`.
6. Aplique o schema também no banco de produção quando a fase 2 for liberada.

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Projetos criados antes das chaves publicáveis ainda podem usar a chave `anon` legada:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> A chave publicável (`sb_publishable_...`) ou a `anon` legada pode ir para o cliente. **Nunca**
> coloque a `service_role` no frontend, em `NEXT_PUBLIC_*` ou no repositório. Toda autorização
> depende das políticas RLS.

### Dependências previstas

```bash
npm install @supabase/supabase-js @supabase/ssr
```

O `@supabase/ssr` é necessário para cookies de sessão no App Router caso o servidor precise ler o
usuário em Server Components/rotas. Se toda a leitura continuar no cliente, `supabase-js` basta.

## Modelo de dados

O schema em `supabase/schema.sql` é a versão relacional do contrato local.

| Local (`DashboardData`) | Supabase | Observações |
| --- | --- | --- |
| `settings` | `dashboard_settings` | uma linha por `user_id` |
| `tasks` | `tasks` | `due` → `due_date`; soft delete não incluído |
| `shopping` | `shopping_items` | `price` numérico opcional |
| `transactions` | `transactions` | `date` → `date` |
| `media` | `media_links` | `tags` → `text[]`; `kind` com check |
| `goals` | `goals` | progresso em `current_amount`/`target_amount` |
| `notes` | `notes` | `updated_at` controlado por trigger |

Convenções:

- IDs são UUIDs no banco; o frontend já usa strings.
- Datas locais (`YYYY-MM-DD`) viram `date`.
- Timestamps viram `timestamptz` e são serializados em ISO no cliente.
- `created_at` e `updated_at` são gerados no banco.
- `user_id` tem `default auth.uid()` e relação com `auth.users(id) on delete cascade`.
- Cores são strings hexadecimais validadas por check.
- RLS está habilitada em todas as tabelas: cada usuário só lê/escreve as próprias linhas.

### Mapeamento no cliente

Sugestão de adaptadores em `lib/supabase/`:

```ts
// pseudocódigo
function toTaskRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    notes: task.notes,
    priority: task.priority,
    list: task.list,
    due_date: task.due,
    done: task.done,
    completed_at: task.completedAt,
  };
}

function fromTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? "",
    priority: row.priority,
    list: row.list,
    due: row.due_date,
    done: row.done,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
```

Mantenha `id` local para preservar referências e permitir escrita otimista. Em caso de conflito,
`updated_at` do banco define o vencedor; operações destrutivas podem gerar tombstones se necessário.

## Autenticação

Rotas sugeridas:

- `/entrar` — e-mail/senha ou magic link.
- `/criar-conta` — cadastro com nome.
- `/recuperar-senha` — envio de link.
- `middleware.ts` ou layout protegido para exigir sessão, mantendo uma prévia local opcional.

Fluxo de primeira entrada:

1. Usuário faz login.
2. Provider busca `dashboard_settings` e as listas.
3. Se não houver dados remotos, mostra um diálogo:
   - importar os dados deste navegador; ou
   - começar do zero; ou
   - carregar demonstração.
4. A importação deve ocorrer em uma transação/lote (`upsert`) e só então marcar o local como migrado.

Cuidados:

- Chame `supabase.auth.getSession()` no cliente e valide no servidor com `getUser()` quando houver rotas protegidas.
- Não confie em `user_id` vindo do formulário; o banco usa `auth.uid()` e RLS.
- Configure redirect URLs exatas na Supabase e na Vercel.
- Em logout, cancele subscrições/Realtime e remova o cache do usuário.

## Estratégia de sincronização

### Fase 2A — online simples

- Leitura completa ao entrar.
- CRUD direto via `supabase.from(...).insert/update/delete`.
- Atualização otimista no estado local e rollback em erro.
- `localStorage` deixa de ser fonte da verdade, mas permanece como cache.

### Fase 2B — offline-first

- Fila de mutações em IndexedDB ou `localStorage` com `id`, `table`, `op`, `payload`, `createdAt`.
- Envio em ordem; retry com backoff.
- Resolução de conflitos por `updated_at` + versão.
- Realtime opcional para atualizar outros dispositivos.
- Nunca apagar a fila sem confirmação do servidor.

O dashboard pessoal é single-user por conta, então a política de conflito pode ser simples. Ainda
assim, evite sobrescrever uma linha remota mais nova com um estado local antigo.

## Segurança e privacidade

- RLS habilitada e testada para `select`, `insert`, `update` e `delete`.
- A chave `service_role` só pode existir em jobs administrativos no servidor.
- Exportação JSON continua sendo um recurso local e deve avisar que o arquivo não é criptografado.
- Não registre conteúdo de notas ou finanças em logs de produção.
- Defina retenção e política de exclusão de conta antes de abrir para outros usuários.
- Rate limiting e captcha no cadastro são responsabilidade do Auth/edge, se necessário.

## Checklist de implementação

- [ ] Criar projeto Supabase e aplicar `supabase/schema.sql`.
- [ ] Configurar Auth, URLs de redirect e templates de e-mail.
- [ ] Instalar SDK e criar cliente browser/server.
- [ ] Criar `SupabaseStoreProvider` mantendo a interface de `useStore`.
- [ ] Adicionar rotas de login/cadastro/recuperação.
- [ ] Implementar carregamento inicial, cache e estados de erro/vazio.
- [ ] Implementar importação única do backup local.
- [ ] Migrar CRUD por domínio com escrita otimista.
- [ ] Cobrir RLS com testes de dois usuários distintos.
- [ ] Adicionar indicador de sync na status bar e em Configurações.
- [ ] Configurar variáveis na Vercel e testar preview/produção.
- [ ] Documentar rollback e exportação de dados antes do lançamento.

## Variáveis e deploy

- Desenvolvimento: `.env.local` (ignorado pelo git).
- Preview/produção: variáveis configuradas na Vercel.
- O build atual não exige variáveis; a fase 2 deve falhar de forma explícita se elas estiverem ausentes
  em produção, em vez de cair silenciosamente para dados locais.
- A Vercel detecta Next.js automaticamente; não é necessário `vercel.json` para o app atual.
