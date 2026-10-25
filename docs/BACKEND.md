# Backend, conta e sincronização

O dashboard é **local-first**. O Supabase é opcional e adiciona autenticação, backup remoto e
sincronização entre dispositivos. Sem as variáveis de ambiente, todas as telas continuam
funcionando com o `localStorage`.

## Estado atual

- `lib/store.tsx` concentra estado, CRUD, persistência local, cache por conta, fila e sincronização.
- `lib/cloud/` guarda cache, metadados e fila no `localStorage`.
- `lib/supabase/` contém o cliente, o mapeamento entre o modelo local e as tabelas e as chamadas remotas.
- `components/auth-provider.tsx` mantém a sessão e as ações de autenticação.
- `components/cloud/cloud-overlay.tsx` conduz o onboarding de importação/escolha de dados.
- `supabase/schema.sql` cria as 7 tabelas, índices, triggers e políticas RLS.
- O schema foi aplicado no projeto Supabase usado no desenvolvimento. O acesso anônimo às tabelas
  retorna `401`, como esperado com RLS.

As telas continuam consumindo apenas `useStore()` e `useAuth()`. Elas não importam o Supabase
diretamente.

## Arquitetura

```text
Componentes / páginas
        │
        ├── useAuth() ────── Supabase Auth (sessão no navegador)
        │
        └── useStore()
                │
                ├── convidado: localStorage `dashboard-pessoal.v1`
                └── conta:
                      ├── cache + metadados por user_id
                      ├── fila de mutações offline
                      └── Supabase Postgres + RLS
```

### Por que o auth é client-side

O Next.js usa `output: "export"`. Não há servidor Next para trocar cookies de sessão. Por isso o
cliente Supabase é criado no navegador com:

- `persistSession: true`;
- `autoRefreshToken: true`;
- `detectSessionInUrl: true`;
- `flowType: "implicit"`.

O link de confirmação ou recuperação devolve os tokens no fragmento da URL e o SDK cria a sessão.
A chave usada é sempre a pública (`publishable` ou `anon`). A autorização real vem das políticas
RLS, não do cliente.

## Configuração

1. Crie um projeto em <https://supabase.com>.
2. Execute [`supabase/schema.sql`](../supabase/schema.sql) no SQL Editor.
3. Em **Authentication → Providers**, habilite e-mail/senha.
4. Em **Authentication → URL Configuration**, configure a **Site URL** e as **Redirect URLs**.
5. Copie URL e chave pública para `.env.local` ou para as variáveis da Vercel.

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Opcional na web; recomendada no Android e em produção.
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

Projetos antigos podem usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` no lugar da publishable key.

### URLs de autenticação

O app usa dois destinos:

- confirmação de cadastro e reenvio: `/entrar/`;
- recuperação de senha: `/redefinir-senha/`.

Cadastre a URL de produção como Site URL e adicione as duas rotas completas em Redirect URLs, por
exemplo:

```text
https://seu-dominio.com/entrar/
https://seu-dominio.com/redefinir-senha/
```

Para desenvolvimento, adicione também `http://localhost:3000/entrar/` e
`http://localhost:3000/redefinir-senha/` (e a porta usada no preview, se necessário).

### `NEXT_PUBLIC_APP_URL`

- **Web:** se estiver vazia, o app usa `window.location.origin`.
- **Android/Capacitor:** `window.location.origin` é `https://localhost`, que não serve para abrir
  um link no navegador. Sem `NEXT_PUBLIC_APP_URL`, o app deixa o Supabase usar a Site URL do projeto.
  Para uma experiência correta, defina a URL pública no build do APK.
- O app não abre a rota de callback dentro do WebView quando o link é entregue ao navegador externo;
  a sessão pode ser criada no navegador e o usuário pode voltar ao app. O fluxo Android completo
  ainda precisa ser validado em aparelho com conta confirmada.

## Modelo de dados

| Modelo local | Tabela Supabase | Campos principais |
| --- | --- | --- |
| `settings` | `dashboard_settings` | `display_name`, `monthly_budget`, `accent`, `demo_banner_dismissed` |
| `tasks` | `tasks` | `title`, `notes`, `priority`, `list`, `due_date`, `done`, `completed_at` |
| `shopping` | `shopping_items` | `name`, `quantity`, `unit`, `price`, `category`, `done` |
| `transactions` | `transactions` | `description`, `amount`, `type`, `category`, `date` |
| `media` | `media_links` | `title`, `url`, `kind`, `tags[]`, `favorite` |
| `goals` | `goals` | `title`, `target_amount`, `current_amount`, `unit`, `deadline`, `color` |
| `notes` | `notes` | `title`, `body`, `color`, `pinned` |

Convenções:

- IDs são UUIDs. IDs antigos do modo local são convertidos de forma determinística para UUID antes
  de irem para a nuvem.
- Datas locais `YYYY-MM-DD` viram `date`.
- Timestamps viram `timestamptz` e são serializados em ISO.
- `user_id` tem `default auth.uid()` e relação com `auth.users(id) on delete cascade`.
- `created_at`/`updated_at` são gerados no banco; triggers atualizam `updated_at`.
- Cores hex e enums (`priority`, `list`, `unit`, `category`, `kind`) têm check constraints.
- RLS está habilitada em todas as tabelas; cada usuário só lê e escreve as próprias linhas.

Os conversores ficam em `lib/supabase/rows.ts`. O carregamento e as mutações ficam em
`lib/supabase/remote.ts`.

## Primeiro acesso e escolha de dados

Depois do login, o provider:

1. Carrega o cache daquela conta, se existir, para deixar a interface utilizável.
2. Busca as 7 tabelas no Supabase.
3. Se houver dados locais **e** remotos, mostra o onboarding com duas opções:
   - **Usar este dispositivo:** envia os registros locais para a nuvem e recarrega o resultado.
   - **Usar a nuvem:** substitui a visão local pelos dados remotos.
4. Se só houver dados locais, oferece importar ou começar com a nuvem.
5. Se a conta estiver vazia e não houver dados locais, começa com estado vazio.

Os dados de convidado nunca são apagados automaticamente. A importação e o logout não removem
`dashboard-pessoal.v1`.

## Armazenamento local

| Chave | Conteúdo |
| --- | --- |
| `dashboard-pessoal.v1` | dados do modo convidado |
| `dashboard-pessoal.cloud.v1.<userId>` | cache do dashboard da conta |
| `dashboard-pessoal.cloud.meta.v1.<userId>` | `initializedAt` e `lastSyncedAt` |
| `dashboard-pessoal.cloud.queue.v1.<userId>` | fila de mutações pendentes |

A fila guarda `id`, `table`, `op` (`upsert`/`delete`), `rowId`, `payload` e `createdAt`.

## Sincronização e offline

- Toda alteração é aplicada de forma otimista no estado e no cache.
- A mutação é enfileirada por tabela + linha. Se a mesma linha mudar novamente, a intenção antiga é
  substituída pela mais recente, preservando a ordem entre linhas diferentes.
- A fila é enviada em ordem; cada item só é removido depois de o servidor confirmar.
- Se a conexão cair, a fila permanece e o app mostra `Offline`/`Erro de sincronização`.
- Ao voltar a conexão, no foco da janela ou a cada 20 segundos com fila pendente, o app tenta novamente.
- A sincronização manual está em Configurações (“Sincronizar agora”) e na status bar.
- Antes de recarregar a nuvem, o app esvazia a fila para não perder alterações locais.
- Em caso de erro, a fila não é descartada sem confirmação do servidor.

Estados exibidos: `local`, `connecting`, `syncing`, `synced`, `offline` e `error`.

## Segurança e privacidade

- A chave `service_role` nunca pode ir para o frontend, variáveis `NEXT_PUBLIC_*` ou Git.
- Toda autorização depende de RLS. O cliente envia `user_id`, mas o banco usa `auth.uid()` nas políticas.
- O acesso anônimo às tabelas deve falhar. Validado no projeto de desenvolvimento com resposta `401`.
- Não registre conteúdo de notas ou finanças em logs de produção.
- O backup JSON não é criptografado. Avise o usuário ao exportar em um dispositivo compartilhado.
- Antes de abrir para outras pessoas, defina retenção, exclusão de conta e rate limiting/captcha no Auth.
- Sessões e tokens ficam no `localStorage` do navegador/WebView, gerenciados pelo SDK do Supabase.

## Checklist de validação

- [x] Schema aplicado e 7 tabelas confirmadas.
- [x] RLS habilitada e acesso anônimo bloqueado.
- [x] Cliente browser, auth, rotas e tradução de erros implementados.
- [x] Cache por conta, fila offline, deduplicação, retry e logout implementados.
- [x] Onboarding de importação do dispositivo/nuvem implementado.
- [x] Build estático e preview validados sem variáveis obrigatórias.
- [ ] Teste ponta a ponta com um e-mail confirmado: cadastro → confirmação → login → onboarding.
- [ ] Validar importação, sincronização real e fila offline com uma conta confirmada.
- [ ] Configurar Site URL/Redirect URLs de produção no painel do Supabase.
- [ ] Executar o teste de RLS com dois usuários distintos.
- [ ] Cadastrar as variáveis na Vercel e testar o deploy de produção.
- [ ] Testar login e links de e-mail no APK Android em um aparelho real.

## Deploy

- **Desenvolvimento:** `.env.local` (ignorado pelo Git).
- **Produção:** variáveis no host (GitHub Pages Actions ou Vercel); a URL final também deve ir para
  `NEXT_PUBLIC_APP_URL`.
- **GitHub Pages:** o workflow `pages.yml` define `NEXT_PUBLIC_BASE_PATH` e publica em
  `https://caiosobrinho93.github.io/caiosobrinho-dashboard/`.
- **Supabase:** Site URL e Redirect URLs precisam incluir as rotas de confirmação e recuperação.
- **Build:** `npm run build` gera `out/`; a Vercel detecta Next.js e o Pages publica o export
  estático com o prefixo de subcaminho.
- **Sem variáveis:** o deploy continua em modo local, sem login nem sincronização.

Consulte também o [README](../README.md) e o [guia Android](ANDROID.md).
