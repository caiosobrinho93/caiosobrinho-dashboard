# Dashboard pessoal

Painel pessoal mobile-first com visual em grafite e prata, tipografia Manrope e detalhes elétricos. Navegação lateral com rótulos no desktop e barra inferior no celular. Reúne tarefas,
lista de compras, finanças, metas, notas e uma midiateca de vídeos e músicas em um único lugar.

O app funciona **local-first**: sem conta, tudo fica no `localStorage` do navegador ou do WebView.
Com o Supabase configurado, é possível criar uma conta, manter os dados sincronizados entre
dispositivos e continuar trabalhando offline com uma fila de alterações.

O mesmo build também é empacotado como app Android com Capacitor 8. O Next.js gera arquivos
estáticos em `out/`, que são sincronizados para o projeto nativo em `android/`.

## O que já funciona

- **Início** — saudação, resumo do dia, indicadores, tarefas, finanças, compras, metas e links recentes.
- **Tarefas** — criação rápida, prioridade, lista, prazo, filtros, busca, conclusão e edição.
- **Compras** — itens por categoria, quantidade, unidade, preço, total estimado e carrinho.
- **Finanças** — receitas e despesas por mês, saldo, orçamento, gráfico de categorias e histórico de 6 meses. Exportação CSV respeita o mês, busca e tipo selecionados; inclui proteção contra fórmulas em campos de texto.
- **Mídia** — vídeos e músicas separados por abas, prévias do YouTube, favoritos, tags, busca e edição.
- **Metas** — valor-alvo, progresso, prazo, unidade, contribuições e destaque por cor.
- **Notas** — grade estilo mural, busca, fixação no topo, cores e edição.
- **Mais** — atalhos para as seções secundárias e diagnóstico do workspace.
- **Configurações** — nome, orçamento, cor de destaque, exportação/importação JSON, demo e limpeza.
- **Conta** — cadastro, confirmação de e-mail, login, recuperação/redefinição de senha e logout.
- **Sincronização** — cache por conta, fila offline, retry automático, importação do dispositivo e
  escolha entre dados locais ou da nuvem no primeiro acesso.
- **Command palette** — `Ctrl/Cmd + K` para navegar e criar itens (`#nova` nas rotas).
- **PWA básica** — manifest, ícones e suporte a instalação no celular.
- **App Android** — splash e ícones próprios, status bar escura, botão voltar nativo, haptics e safe areas.
- **Movimento** — View Transitions entre rotas, entradas em cascata, feedback de toque e respeito a
  `prefers-reduced-motion`.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router) + React 19, com exportação estática
- TypeScript
- CSS custom properties e componentes próprios
- [lucide-react](https://lucide.dev/) para ícones
- `localStorage` para o modo local, cache e fila de sincronização
- [Supabase](https://supabase.com/) (Auth + Postgres + RLS) para a conta opcional
- [Capacitor 8](https://capacitorjs.com/) para o app Android
- Vercel ou qualquer host estático para o deploy web

Não há dependência de biblioteca de gráficos nem de framework CSS: donut e barras são SVG/CSS.

## Rodando localmente

Requisitos web: Node.js 20.9 ou superior e npm. Para gerar o app Android, veja também
[JDK 21 e Android SDK 36](docs/ANDROID.md).

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

O modo local não exige nenhuma variável. Para habilitar a conta e a nuvem, copie `.env.example`
para `.env.local` e preencha os valores do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Opcional; no Android é necessário para os links de e-mail abrirem no app/site certo.
NEXT_PUBLIC_APP_URL=https://dashboard-pessoal.vercel.app
```

Projetos antigos também podem usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` no lugar da publishable key.
**Nunca** use a `service_role` no cliente, em variáveis `NEXT_PUBLIC_*` ou no repositório.

### Scripts

```bash
npm run dev          # servidor de desenvolvimento
npm test             # regressões de valores, datas, links, backups e CSV
npm run typecheck    # checagem de tipos
npm run build        # exportação estática em out/ + payloads RSC para uso offline
npm run preview      # serve o build estático em http://localhost:4173
npm run start        # alias de preview
npm run icons        # regenera os PNGs web a partir de public/icon.svg
npm run android:sync # build web + sincroniza out/ com android/
npm run android:open # abre o projeto no Android Studio
npm run android:run  # sync + roda em um dispositivo/emulador conectado
npm run android:apk  # sync + gera o APK de debug via Gradle
npm run android:assets # regenera ícones e splash do Android
```

No PowerShell do Windows, use `npm.cmd` se a execução de `npm.ps1` estiver bloqueada.

## Build estático e preview

`next.config.ts` usa `output: "export"` e `trailingSlash: true`. O comando `npm run build`
gera `out/` e executa um pós-build que achata os payloads RSC usados pelo roteador do Next.
Isso é necessário porque o app é servido por arquivos estáticos, inclusive dentro do WebView
do Android. `npm run preview` sobe um servidor local sem cache de HTML na porta `4173`.

## Conta e sincronização

Como o app é exportado estaticamente, a autenticação é **100% client-side**. O cliente Supabase usa
o fluxo implícito para que os links de confirmação e recuperação criem a sessão diretamente no
navegador, sem cookies de servidor.

Rotas de conta:

- `/entrar` — login por e-mail e senha.
- `/criar-conta` — nome, e-mail e senha; a confirmação de e-mail precisa estar habilitada no Supabase.
- `/recuperar-senha` — envio do link de recuperação.
- `/redefinir-senha` — criação da nova senha a partir do link.

Comportamento:

1. Sem conta, o app continua no modo local com a chave `dashboard-pessoal.v1`.
2. Ao entrar, o app carrega o cache específico daquela conta e busca a versão da nuvem. As listas são paginadas por identificador para carregar também contas acima do limite de uma resposta do Supabase.
3. No primeiro acesso, se houver dados dos dois lados, você escolhe importar o dispositivo ou usar a nuvem.
4. Cada alteração é aplicada de forma otimista e entra em uma fila local.
5. A fila é enviada em ordem, deduplicada por tabela + registro, e tenta novamente quando a conexão volta.
6. Ao sair, o cache e a fila daquela conta são removidos; os dados de convidado continuam no dispositivo.
7. O Supabase é opcional. Se as variáveis não existirem, o app mostra o estado “modo local”.

O schema, as políticas RLS e os detalhes de operação estão em
[`supabase/schema.sql`](supabase/schema.sql) e [`docs/BACKEND.md`](docs/BACKEND.md).

## Dados e privacidade

- O modo de convidado fica em `localStorage` sob `dashboard-pessoal.v1`.
- Cada conta tem cache, fila e metadados próprios, com prefixos `dashboard-pessoal.cloud.*`.
- Na primeira visita, dados de demonstração aparecem para explorar o painel.
- O botão **Começar do zero** (ou **Apagar todos os dados**) remove os registros e mantém nome,
  orçamento e cor.
- **Configurações → Dados e backup** permite exportar e importar um JSON completo.
- A importação valida o arquivo com `lib/normalize.ts`, rejeita versões não suportadas e mostra um resumo para confirmação antes de substituir os dados. Cancelar mantém os dados atuais.
- Não há telemetria. Notas e finanças não são enviadas para nenhum serviço além do Supabase da sua conta.
- A chave pública do Supabase pode ficar no cliente; a autorização real é feita pelas políticas RLS.

### Formato do backup

O JSON exportado segue `DashboardData` em `lib/types.ts`: listas de tarefas, compras, movimentações,
mídia, metas, notas e o objeto `settings`. O campo `version` permite migrações futuras.

## App Android

O projeto nativo já está em `android/`, com application ID `com.caiosobrinho.dashboardpessoal`
e nome **Dashboard Pessoal**. Para compilar você precisa de JDK 21, Android Studio e SDK 36.
O passo a passo completo, incluindo APK, instalação por ADB e assinatura de release, está em
[`docs/ANDROID.md`](docs/ANDROID.md).

Fluxo resumido:

```bash
npm install
npm run android:sync
npm run android:open  # Android Studio → Run
# ou
npm run android:apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

O workflow [`.github/workflows/android-debug.yml`](.github/workflows/android-debug.yml) compila
um APK de debug no GitHub Actions a cada push na `main` ou por execução manual. Baixe o artifact
`dashboard-pessoal-debug`.

O WebView guarda os dados no `localStorage` do app. Desinstalar o app apaga os dados locais; use
**Configurações → Dados e backup → Exportar JSON** antes de trocar de aparelho. Com uma conta, os
dados também podem ser recuperados da nuvem após o login.

No Android, os links de confirmação e recuperação precisam de uma URL pública. Configure
`NEXT_PUBLIC_APP_URL` no build ou a **Site URL** do Supabase; `https://localhost` do WebView não
abre fora do app.

## Estrutura

```text
app/                     rotas do App Router, layout, metadata e CSS global
components/
  pages/                 telas por seção
  tasks/ shopping/       formulários de domínio
  finance/ media/ goals/ notes/
  ui/                    modal, painel, empty state, confirmação
  app-shell.tsx          título, activity bar, status bar, nav mobile
  native-bridge.tsx      status bar, splash, haptics e teclado
  page-transition.tsx    View Transitions entre rotas
  command-palette.tsx    Ctrl/Cmd + K
  auth-provider.tsx      sessão e ações de autenticação
  cloud-overlay.tsx      onboarding de importação/sincronização
  nav.ts                 metadados de navegação
lib/
  types.ts               modelo de dados
  seed.ts                demonstração e estado vazio
  store.tsx              estado, CRUD, persistência e sincronização
  normalize.ts           validação de importação/localStorage
  native.ts              bridge do Capacitor
  utils.ts               datas, moeda, URLs, ordenação
  constants.ts           categorias, cores, unidades
  cloud/                 cache, fila e metadados locais por conta
  supabase/              cliente, mapeamento de linhas e operações remotas
public/                  ícones, manifest
resources/               fonte do ícone e do splash do Android
scripts/                 assets, preview estático, pós-build RSC e Gradle
android/                 projeto nativo Capacitor (Gradle, manifest, recursos)
.github/workflows/       deploy web no GitHub Pages e build do APK de debug
docs/ANDROID.md          build, execução, CI e assinatura Android
docs/BACKEND.md          Supabase, auth, RLS e sincronização
supabase/schema.sql      schema, RLS e triggers
```

## Deploy web

O build é estático. O repositório inclui dois caminhos de publicação:

### GitHub Pages (incluído)

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica o site a cada push
na `main`, usando o subcaminho do repositório. Ele define `NEXT_PUBLIC_BASE_PATH` e
`NEXT_PUBLIC_APP_URL` automaticamente. Neste repositório, a URL é:

```text
https://caiosobrinho93.github.io/caiosobrinho-dashboard/
```

Para habilitar em outro fork, vá em **Settings → Pages → Source** e escolha **GitHub Actions**.
Cadastre as variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e,
se quiser, `NEXT_PUBLIC_APP_URL` em **Settings → Secrets and variables → Actions → Variables**.

### Vercel (opcional)

A Vercel também publica o mesmo build, sem `basePath`:

1. Importe o repositório na Vercel; o preset Next.js é detectado automaticamente.
2. Cadastre `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e
   `NEXT_PUBLIC_APP_URL` em **Settings → Environment Variables**.
3. Faça o deploy e copie a URL final para `NEXT_PUBLIC_APP_URL`.
4. Não defina `NEXT_PUBLIC_BASE_PATH` na Vercel: ela é usada apenas no GitHub Pages.

### Configuração do Supabase

Em **Authentication → URL Configuration**, use a URL publicada como **Site URL** e adicione as
duas rotas às **Redirect URLs**:

```text
https://SEU-DOMINIO/entrar/
https://SEU-DOMINIO/redefinir-senha/
```

No GitHub Pages, o domínio inclui o repositório:

```text
https://caiosobrinho93.github.io/caiosobrinho-dashboard/entrar/
https://caiosobrinho93.github.io/caiosobrinho-dashboard/redefinir-senha/
```

Sem as variáveis do Supabase, o deploy continua funcionando no modo local. O APK de debug é
independente do deploy web: veja [`docs/ANDROID.md`](docs/ANDROID.md).

## Decisões de interface

- Mobile-first: navegação inferior, modais em folha e áreas de toque confortáveis.
- Desktop: activity bar, status bar, command palette, grid de 12 colunas e Configurações em duas colunas.
- Cada página tem URL própria e cria o item principal com `#nova`, o que permite atalhos da palette.
- Acessibilidade: foco visível, `aria-*`, fechamento por `Esc`, foco preso em modais, contraste
  revisado e estados vazios claros.
- `prefers-reduced-motion` é respeitado.
