# Dashboard pessoal

Painel pessoal mobile-first com visual de editor de código (VS Code Dark Modern). Reúne tarefas,
lista de compras, finanças, metas, notas e uma midiateca de vídeos e músicas em um único lugar.

O frontend funciona 100% no navegador, com dados salvos em `localStorage`. Login e sincronização
com Supabase estão planejados para a fase 2, sem refazer as telas.

O mesmo build também é empacotado como app Android com Capacitor 8. O Next.js gera arquivos
estáticos em `out/`, que são sincronizados para o projeto nativo em `android/`.

## O que já funciona

- **Início** — saudação, resumo do dia, indicadores, tarefas, finanças, compras, metas e links recentes.
- **Tarefas** — criação rápida, prioridade, lista, prazo, filtros, busca, conclusão e edição.
- **Compras** — itens por categoria, quantidade, unidade, preço, total estimado e carrinho.
- **Finanças** — receitas e despesas por mês, saldo, orçamento, gráfico de categorias e histórico de 6 meses.
- **Mídia** — vídeos e músicas separados por abas, prévias do YouTube, favoritos, tags, busca e edição.
- **Metas** — valor-alvo, progresso, prazo, unidade, contribuições e destaque por cor.
- **Notas** — grade estilo mural, busca, fixação no topo, cores e edição.
- **Mais** — atalhos para as seções secundárias e diagnóstico do workspace.
- **Configurações** — nome, orçamento, cor de destaque, exportação/importação JSON, demo e limpeza.
- **Command palette** — `Ctrl/Cmd + K` para navegar e criar itens (`#nova` nas rotas).
- **PWA básica** — manifest, ícones e suporte a instalação no celular.
- **App Android** — splash e ícones próprios, status bar escura, botão voltar nativo, haptics e safe areas.
- **Movimento** — View Transitions entre rotas, entradas em cascata, feedback de toque e respeito a `prefers-reduced-motion`.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router) + React 19, com exportação estática
- TypeScript
- CSS custom properties e componentes próprios
- [lucide-react](https://lucide.dev/) para ícones
- `localStorage` como persistência atual
- [Capacitor 8](https://capacitorjs.com/) para o app Android
- Supabase + Vercel na fase 2

Não há dependência de biblioteca de gráficos nem de framework CSS: donut e barras são SVG/CSS.

## Rodando localmente

Requisitos web: Node.js 20.9 ou superior e npm. Para gerar o app Android, veja também
[JDK 21 e Android SDK 36](docs/ANDROID.md).

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

### Scripts

```bash
npm run dev          # servidor de desenvolvimento
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
`dashboard-pessoal-debug`. O workflow só roda depois que o projeto estiver em um repositório GitHub.

O WebView guarda os dados no `localStorage` do app. Desinstalar o app apaga esses dados; use
**Configurações → Dados e backup → Exportar JSON** antes de trocar de aparelho.

## Dados e privacidade

- Tudo é salvo em `localStorage` sob a chave `dashboard-pessoal.v1`.
- Na primeira visita, dados de demonstração aparecem para explorar o painel.
- O botão **Começar do zero** (ou **Apagar todos os dados**) remove os registros e mantém nome, orçamento e cor.
- **Configurações → Dados e backup** permite exportar e importar um JSON completo.
- Não há autenticação, telemetria ou chamadas de backend nesta fase.
- A importação valida o arquivo com `lib/normalize.ts` antes de substituir os dados.

### Formato do backup

O JSON exportado segue `DashboardData` em `lib/types.ts`: listas de tarefas, compras,
movimentações, mídia, metas, notas e o objeto `settings`. O campo `version` permite migrações futuras.

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
  nav.ts                 metadados de navegação
lib/
  types.ts               modelo de dados
  seed.ts                demonstração e estado vazio
  store.tsx              estado, CRUD e persistência
  normalize.ts           validação de importação/localStorage
  native.ts              bridge do Capacitor
  utils.ts               datas, moeda, URLs, ordenação
  constants.ts           categorias, cores, unidades
public/                  ícones, manifest
resources/               fonte do ícone e do splash do Android
scripts/                 assets, preview estático, pós-build RSC e Gradle
android/                 projeto nativo Capacitor (Gradle, manifest, recursos)
.github/workflows/       build do APK de debug no GitHub Actions
docs/ANDROID.md          build, execução, CI e assinatura Android
docs/BACKEND.md          plano de migração para Supabase
supabase/schema.sql      schema, RLS e triggers
```

## Deploy web

O build é estático, então pode ser publicado na Vercel ou em qualquer host de arquivos estáticos.
O repositório já inclui o workflow do APK Android; ele não interfere no deploy web.

1. Envie o projeto para um repositório no GitHub.
2. Importe o repositório na Vercel; o preset Next.js é detectado automaticamente.
3. Enquanto a fase 2 não começa, nenhuma variável de ambiente é obrigatória.
4. Faça o deploy. O dashboard continua salvando por navegador/dispositivo.

Para a fase 2, copie as variáveis de `.env.example` no painel da Vercel e siga
[`docs/BACKEND.md`](docs/BACKEND.md).

O APK de debug é independente do deploy web: veja [`docs/ANDROID.md`](docs/ANDROID.md).

## Supabase (fase 2)

O schema inicial está em [`supabase/schema.sql`](supabase/schema.sql), com tabelas por usuário,
RLS habilitada e trigger de criação do perfil. O plano completo — autenticação, migração do
`localStorage`, cache offline e checklist de deploy — está em [`docs/BACKEND.md`](docs/BACKEND.md).

## Decisões de interface

- Mobile-first: navegação inferior, modais em folha e áreas de toque confortáveis.
- Desktop: activity bar, status bar, command palette e layout em grid.
- Cada página tem URL própria e cria o item principal com `#nova`, o que permite atalhos da palette.
- Acessibilidade: foco visível, `aria-*`, fechamento por `Esc`, foco preso em modais e estados vazios claros.
- `prefers-reduced-motion` é respeitado.
