"use client";

import {
  Check,
  Cloud,
  CloudUpload,
  Database,
  Download,
  HardDrive,
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ACCENTS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { normalizeDashboardData } from "@/lib/normalize";
import type { DashboardData } from "@/lib/types";
import type { AccentKey } from "@/lib/types";
import {
  downloadTextFile,
  formatAmountInput,
  formatBytes,
  parseAmount,
  todayISO,
} from "@/lib/utils";

type Feedback = { tone: "success" | "error"; message: string };
type Confirmation = "demo" | "clear" | null;

function formatSyncTime(value: string | null): string {
  if (!value) return "Ainda não sincronizado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda não sincronizado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ConfiguracoesPage() {
  const {
    data,
    saveError,
    online,
    cloudConfigured,
    cloudPhase,
    syncState,
    syncError,
    pendingCount,
    lastSyncedAt,
    updateSettings,
    importData,
    loadDemo,
    clearAll,
    syncNow,
    importGuestDataToCloud,
    signOut,
  } = useStore();
  const { user } = useAuth();
  const settings = data.settings;
  const [name, setName] = useState(settings.name);
  const [budget, setBudget] = useState(formatAmountInput(settings.monthlyBudget));
  const [accent, setAccent] = useState<AccentKey>(settings.accent);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingImport, setPendingImport] = useState<DashboardData | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [guestImportOpen, setGuestImportOpen] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    setName(settings.name);
  }, [settings.name]);

  useEffect(() => {
    setBudget(formatAmountInput(settings.monthlyBudget));
  }, [settings.monthlyBudget]);

  useEffect(() => {
    setAccent(settings.accent);
  }, [settings.accent]);

  useEffect(() => { setPendingImport(null); }, [user?.id]);

  useEffect(() => {
    if (user) return;
    setSignOutOpen(false);
    setGuestImportOpen(false);
    setSignOutBusy(false);
  }, [user]);

  useEffect(
    () => () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  function notify(message: string, tone: Feedback["tone"] = "success") {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    setFeedback({ message, tone });
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4200);
  }

  const storageBytes = useMemo(
    () => new TextEncoder().encode(JSON.stringify(data)).length,
    [data],
  );

  const recordCount =
    data.tasks.length +
    data.shopping.length +
    data.transactions.length +
    data.media.length +
    data.goals.length +
    data.notes.length;

  const syncSummary = !user
    ? "Somente local"
    : cloudPhase === "choice"
      ? "Aguardando escolha"
      : syncState === "connecting"
        ? "Conectando"
        : syncState === "syncing"
          ? pendingCount > 0
            ? `Sincronizando ${pendingCount}`
            : "Sincronizando"
          : syncState === "offline"
            ? pendingCount > 0
              ? `Offline · ${pendingCount}`
              : "Offline"
            : syncState === "error"
              ? "Erro de sincronização"
              : syncState === "synced"
                ? "Nuvem em dia"
                : "Somente local";

  const syncBadgeClass =
    !user || !cloudConfigured
      ? "badge"
      : syncState === "error"
        ? "badge badge-danger"
        : syncState === "synced"
          ? "badge badge-success"
          : "badge badge-warning";

  async function handleSyncNow() {
    setSyncBusy(true);
    const result = await syncNow();
    setSyncBusy(false);
    notify(result.message, result.ok ? "success" : "error");
  }

  async function handleImportGuest() {
    setGuestImportOpen(false);
    setSyncBusy(true);
    const result = await importGuestDataToCloud();
    setSyncBusy(false);
    notify(result.message, result.ok ? "success" : "error");
  }

  async function handleSignOut(discard: boolean) {
    setSignOutBusy(true);
    if (!discard && pendingCount > 0) {
      const result = await syncNow();
      if (!result.ok) {
        setSignOutBusy(false);
        notify(result.message, "error");
        return;
      }
    }
    const result = await signOut();
    setSignOutBusy(false);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    setSignOutOpen(false);
    notify("Você saiu da conta. O modo local continua disponível.");
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      notify("Informe seu nome para personalizar o dashboard.", "error");
      return;
    }
    const parsedBudget = Math.max(0, parseAmount(budget));
    updateSettings({
      name: cleanName,
      monthlyBudget: parsedBudget,
      accent,
    });
    setName(cleanName);
    setBudget(formatAmountInput(parsedBudget));
    notify(
      user
        ? "Preferências salvas. A alteração será sincronizada com a nuvem."
        : "Preferências salvas neste dispositivo.",
    );
  }

  function handleAccent(key: AccentKey, label: string) {
    setAccent(key);
    updateSettings({ accent: key });
    notify(
      user
        ? `Cor de destaque “${label}” aplicada e enviada para a nuvem.`
        : `Cor de destaque “${label}” aplicada.`,
    );
  }

  function handleExport() {
    downloadTextFile(
      `dashboard-pessoal-${todayISO()}.json`,
      JSON.stringify(data, null, 2),
      "application/json",
    );
    notify("Backup exportado. Guarde o arquivo em um lugar seguro.");
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      notify("Arquivo muito grande. Use um backup de até 4 MB.", "error");
      return;
    }

    try {
      const raw = await file.text();
      const payload: unknown = JSON.parse(raw);
      const normalized = normalizeDashboardData(payload, { requireArrays: true });
      if (!normalized) {
        notify("Backup inválido ou de uma versão não suportada. Seus dados foram mantidos.", "error");
        return;
      }
      setPendingImport(normalized);
    } catch {
      notify("Não foi possível ler o arquivo. Verifique se é um JSON válido.", "error");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <Breadcrumb segments={[{ label: "settings.json" }]} />
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">
            Preferências, conta, backup e sincronização entre dispositivos.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} />
            Exportar backup
          </button>
        </div>
      </div>

      {saveError ? (
        <div className="settings-feedback error" role="alert">
          <TriangleAlert size={14} />
          Não foi possível gravar no armazenamento local. Exporte um backup antes de fechar.
        </div>
      ) : feedback ? (
        <div className={`settings-feedback ${feedback.tone}`} role="status" aria-live="polite">
          {feedback.tone === "success" ? <Check size={14} /> : <TriangleAlert size={14} />}
          {feedback.message}
        </div>
      ) : null}

      <div className="shop-summary">
        <div className="shop-summary-item">
          <div className="shop-summary-label">Registros salvos</div>
          <div className="shop-summary-value">{recordCount}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Espaço local</div>
          <div className="shop-summary-value small">{formatBytes(storageBytes)}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Sincronização</div>
          <div className="shop-summary-value small">{syncSummary}</div>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-column">
          <Panel title="Preferências" subtitle="perfil local" dotColor="var(--accent)">
            <div className="panel-body">
              <form className="settings-form" onSubmit={handleSave} noValidate>
                <div className="settings-row">
                  <label className="label" htmlFor="settings-name">
                    Seu nome
                  </label>
                  <input
                    id="settings-name"
                    className="input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Como você quer ser chamado?"
                    maxLength={60}
                    autoComplete="name"
                  />
                  <p className="settings-hint">
                    Aparece na saudação da tela inicial e ajuda a deixar o painel com a sua cara.
                  </p>
                </div>

                <div className="settings-row">
                  <label className="label" htmlFor="settings-budget">
                    Orçamento mensal
                  </label>
                  <div className="input-affix">
                    <span className="affix">R$</span>
                    <input
                      id="settings-budget"
                      className="input"
                      inputMode="decimal"
                      value={budget}
                      onChange={(event) => setBudget(event.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <p className="settings-hint">
                    Usado para calcular quanto do orçamento de despesas já foi consumido em Finanças.
                    Deixe 0 para ocultar a barra.
                  </p>
                </div>

                <div className="settings-row">
                  <span className="label">Cor de destaque</span>
                  <div className="accent-swatches" role="group" aria-label="Cor de destaque">
                    {ACCENTS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={`accent-swatch${accent === option.key ? " active" : ""}`}
                        style={{ "--swatch": option.color } as React.CSSProperties}
                        onClick={() => handleAccent(option.key, option.label)}
                        aria-label={`Usar cor ${option.label}`}
                        aria-pressed={accent === option.key}
                        title={option.label}
                      >
                        {accent === option.key ? <Check size={11} strokeWidth={3} /> : null}
                      </button>
                    ))}
                  </div>
                  <p className="settings-hint">
                    A cor é aplicada na hora em botões, links, gráficos e na barra de status.
                  </p>
                </div>

                <div className="settings-save-row">
                  <button type="submit" className="btn btn-primary">
                    <Save size={14} />
                    Salvar preferências
                  </button>
                  <span className="settings-hint">
                    {user
                      ? "Salvo neste dispositivo e sincronizado com a nuvem."
                      : "Tudo fica apenas neste navegador até você entrar em uma conta."}
                  </span>
                </div>
              </form>
            </div>
          </Panel>

          <Panel title="Dados e backup" subtitle="json local + nuvem" dotColor="var(--blue)">
            <div
              className="panel-body"
              style={{ display: "flex", flexDirection: "column", gap: 11 }}
            >
              <p className="settings-hint">
                Exporte um arquivo JSON antes de trocar de navegador, limpar o cache ou testar
                mudanças grandes. A importação substitui todos os dados atuais
                {user ? " neste dispositivo e agenda a sincronização com a nuvem." : "."}
              </p>

              <div className="data-actions">
                <button type="button" className="btn btn-secondary" onClick={handleExport}>
                  <Download size={13} />
                  Exportar JSON
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} />
                  Importar backup
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImport}
                  hidden
                />
              </div>

              <div className="system-row">
                <span className="system-row-label">
                  <Database size={13} />
                  Conteúdo do backup
                </span>
                <span className="system-row-value">
                  {recordCount} registro{recordCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="system-row">
                <span className="system-row-label">
                  <HardDrive size={13} />
                  Tamanho aproximado
                </span>
                <span className="system-row-value">{formatBytes(storageBytes)}</span>
              </div>
              <div className="system-row">
                <span className="system-row-label">
                  <span className={`status-dot ${online ? "online" : "offline"}`} aria-hidden="true" />
                  Persistência
                </span>
                <span className="system-row-value">
                  {user ? "localStorage + Supabase" : `localStorage · v${data.version}`}
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="settings-column">
          <Panel
            title="Conta e sincronização"
            subtitle={user ? "conta conectada" : "a nuvem é opcional"}
            dotColor="var(--purple)"
            action={
              <span className={syncBadgeClass}>
                {!cloudConfigured ? <HardDrive size={10} /> : <Cloud size={10} />}
                {!cloudConfigured ? "modo local" : user ? syncSummary : "modo local"}
              </span>
            }
          >
            <div
              className="panel-body"
              style={{ display: "flex", flexDirection: "column", gap: 11 }}
            >
              {!cloudConfigured ? (
                <>
                  <div className="account-status is-warning">
                    <TriangleAlert size={18} />
                    <div>
                      <strong>Supabase não configurado neste build</strong>
                      <p>
                        O dashboard continua funcionando com dados locais. Para ativar login e
                        sincronização, cadastre as variáveis públicas abaixo e gere um novo build.
                      </p>
                    </div>
                  </div>
                  <div className="backend-code">
                    <span className="token-comment"># .env.local</span>
                    {"\n"}
                    <span className="token-key">NEXT_PUBLIC_SUPABASE_URL</span>=
                    <span className="token-string">https://seu-projeto.supabase.co</span>
                    {"\n"}
                    <span className="token-key">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span>=
                    <span className="token-string">sb_publishable_...</span>
                    {"\n"}
                    <span className="token-comment"># opcional: URL pública usada nos e-mails</span>
                    {"\n"}
                    <span className="token-key">NEXT_PUBLIC_APP_URL</span>=
                    <span className="token-string">https://seu-dominio.com</span>
                  </div>
                  <p className="settings-hint">
                    Use somente a chave publicável (ou a anon key). A chave{" "}
                    <code>service_role</code> nunca deve ser colocada no cliente. A Vercel precisa
                    dessas mesmas variáveis em <strong>Settings → Environment Variables</strong>.
                  </p>
                </>
              ) : !user ? (
                <>
                  <div className="account-status">
                    <HardDrive size={18} />
                    <div>
                      <strong>Você está no modo local</strong>
                      <p>
                        Tarefas, compras, finanças e demais registros ficam neste navegador. Entre
                        para manter os mesmos dados em outros dispositivos.
                      </p>
                    </div>
                  </div>
                  <div className="data-actions">
                    <Link className="btn btn-primary" href="/entrar">
                      <LogIn size={14} />
                      Entrar
                    </Link>
                    <Link className="btn btn-secondary" href="/criar-conta">
                      <UserRound size={14} />
                      Criar conta
                    </Link>
                  </div>
                  <p className="settings-hint">
                    No primeiro acesso, você poderá importar os dados deste dispositivo para a conta
                    ou começar com a nuvem. Você pode sair da conta e voltar ao modo local quando
                    quiser.
                  </p>
                </>
              ) : (
                <>
                  <div className="account-identity">
                    <span className="account-avatar" aria-hidden="true">
                      <UserRound size={17} />
                    </span>
                    <div className="account-identity-text">
                      <strong>{data.settings.name || "Sua conta"}</strong>
                      <span>{user.email}</span>
                    </div>
                    <span className="badge badge-success">
                      <ShieldCheck size={10} />
                      RLS ativo
                    </span>
                  </div>

                  <div
                    className={`account-status${
                      syncState === "error"
                        ? " is-error"
                        : syncState === "offline"
                          ? " is-warning"
                          : ""
                    }`}
                  >
                    {syncState === "error" ? (
                      <TriangleAlert size={18} />
                    ) : syncState === "offline" ? (
                      <WifiOff size={18} />
                    ) : syncState === "syncing" || syncState === "connecting" ? (
                      <LoaderCircle className="spin" size={18} />
                    ) : (
                      <Cloud size={18} />
                    )}
                    <div>
                      <strong>
                        {cloudPhase === "choice"
                          ? "Escolha pendente para ativar a nuvem"
                          : syncState === "connecting"
                            ? "Conectando à nuvem"
                            : syncState === "syncing"
                              ? "Sincronizando alterações"
                              : syncState === "offline"
                                ? "Você está offline"
                                : syncState === "error"
                                  ? "Falha na sincronização"
                                  : "Seus dados estão na nuvem"}
                      </strong>
                      <p>
                        {syncState === "error"
                          ? syncError ?? "Tente sincronizar novamente em instantes."
                          : syncState === "offline"
                            ? pendingCount > 0
                              ? `${pendingCount} alteração(ões) aguardam a conexão voltar.`
                              : "Os dados deste dispositivo continuam disponíveis."
                            : syncState === "syncing" && pendingCount > 0
                              ? `${pendingCount} alteração(ões) na fila de envio.`
                              : "Alterações são enviadas automaticamente e ficam em cache local."}
                      </p>
                    </div>
                  </div>

                  <div className="system-row">
                    <span className="system-row-label">
                      <RefreshCw size={13} />
                      Última sincronização
                    </span>
                    <span className="system-row-value">{formatSyncTime(lastSyncedAt)}</span>
                  </div>
                  <div className="system-row">
                    <span className="system-row-label">
                      <CloudUpload size={13} />
                      Alterações pendentes
                    </span>
                    <span className="system-row-value">
                      {pendingCount === 0 ? "Nenhuma" : `${pendingCount} na fila`}
                    </span>
                  </div>
                  <div className="system-row">
                    <span className="system-row-label">
                      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
                      Conexão
                    </span>
                    <span className="system-row-value">{online ? "Online" : "Offline"}</span>
                  </div>

                  {syncError && syncState !== "error" ? (
                    <div className="auth-note is-warning" role="status">
                      <TriangleAlert size={15} />
                      <span>{syncError}</span>
                    </div>
                  ) : null}

                  <div className="data-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => void handleSyncNow()}
                      disabled={syncBusy || !online || cloudPhase !== "ready"}
                    >
                      {syncBusy ? (
                        <LoaderCircle className="spin" size={13} />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      Sincronizar agora
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setGuestImportOpen(true)}
                      disabled={syncBusy || !online || cloudPhase !== "ready"}
                    >
                      <CloudUpload size={13} />
                      Mesclar modo local
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setSignOutOpen(true)}
                    >
                      <LogOut size={13} />
                      Sair
                    </button>
                  </div>

                  <p className="settings-hint">
                    “Mesclar modo local” envia os registros que ficaram salvos no navegador antes do
                    login. É útil ao entrar pela primeira vez em um dispositivo que já tinha dados.
                  </p>
                </>
              )}
            </div>
          </Panel>

          <Panel title="Zona de risco" className="danger-zone">
            <div
              className="panel-body"
              style={{ display: "flex", flexDirection: "column", gap: 11 }}
            >
              <p className="settings-hint">
                Recarregar a demonstração ou apagar tudo substitui os dados atuais
                {user ? " neste dispositivo e na nuvem." : " deste navegador."} Exporte um backup
                antes se quiser guardar o que existe agora.
              </p>
              <div className="data-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmation("demo")}
                >
                  <RotateCcw size={13} />
                  Restaurar demonstração
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setConfirmation("clear")}
                >
                  <Trash2 size={13} />
                  Apagar todos os dados
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Substituir dados pelo backup?"
        description={pendingImport
          ? `O backup contém ${pendingImport.tasks.length} tarefas, ${pendingImport.shopping.length} itens de compras, ${pendingImport.transactions.length} movimentações, ${pendingImport.media.length} mídias, ${pendingImport.goals.length} metas e ${pendingImport.notes.length} notas. Os dados atuais serão substituídos${user ? " e a alteração será sincronizada com sua conta" : " neste dispositivo"}. Exporte um backup antes de continuar.`
          : ""}
        confirmLabel="Importar e substituir"
        onConfirm={() => {
          if (!pendingImport) return;
          if (!importData(pendingImport)) {
            notify("Não foi possível importar o backup. Seus dados foram mantidos.", "error");
            return;
          }
          setPendingImport(null);
          notify(user ? "Backup importado. A alteração será sincronizada com sua conta." : "Backup importado neste dispositivo.");
        }}
      />
      <ConfirmDialog
        open={confirmation === "demo"}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          loadDemo();
          notify(
            user
              ? "Demonstração restaurada neste dispositivo. A sincronização foi agendada."
              : "Dados de demonstração restaurados.",
          );
        }}
        title="Restaurar demonstração?"
        description={
          user
            ? "As tarefas, compras, finanças, mídia, metas e notas atuais serão substituídas pelos dados de exemplo neste dispositivo e na nuvem. Seu nome, orçamento e cor de destaque são mantidos."
            : "As tarefas, compras, finanças, mídia, metas e notas atuais serão substituídas pelos dados de exemplo. Seu nome, orçamento e cor de destaque são mantidos."
        }
        confirmLabel="Restaurar demo"
      />

      <ConfirmDialog
        open={confirmation === "clear"}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          clearAll();
          notify(
            user
              ? "Registros apagados neste dispositivo. A exclusão será sincronizada com a nuvem."
              : "Todos os registros foram apagados. Seu perfil foi mantido.",
          );
        }}
        title="Apagar todos os dados?"
        description={
          user
            ? "Tarefas, compras, movimentações, links, metas e notas serão removidos deste dispositivo e da nuvem. Nome, orçamento e cor de destaque continuam salvos."
            : "Tarefas, compras, movimentações, links, metas e notas serão removidos deste navegador. Nome, orçamento e cor de destaque continuam salvos."
        }
        confirmLabel="Apagar dados"
      />

      <Modal
        open={guestImportOpen}
        onClose={() => setGuestImportOpen(false)}
        title="Mesclar dados do modo local?"
        subtitle="Registros com o mesmo identificador serão atualizados."
        maxWidth={440}
        icon={
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              flex: "none",
              borderRadius: 4,
              background: "rgba(86,156,214,0.12)",
              color: "var(--blue)",
            }}
          >
            <CloudUpload size={16} />
          </span>
        }
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setGuestImportOpen(false)}
              disabled={syncBusy}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void handleImportGuest()}
              disabled={syncBusy || !online}
            >
              {syncBusy ? <LoaderCircle className="spin" size={14} /> : <CloudUpload size={14} />}
              Mesclar na nuvem
            </button>
          </>
        }
      >
        <p className="settings-hint" style={{ margin: 0 }}>
          Os registros que estavam no navegador antes deste login serão enviados para a conta. A
          nuvem não será apagada: os dados serão combinados. Se você não reconhece esses dados,
          cancele e exporte um backup do modo local antes.
        </p>
      </Modal>

      <Modal
        open={signOutOpen}
        onClose={() => {
          if (!signOutBusy) setSignOutOpen(false);
        }}
        title="Sair da conta?"
        subtitle="O modo local continua disponível neste dispositivo."
        maxWidth={440}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setSignOutOpen(false)}
              disabled={signOutBusy}
            >
              Cancelar
            </button>
            {pendingCount > 0 ? (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => void handleSignOut(false)}
                  disabled={signOutBusy || !online}
                >
                  {signOutBusy ? <LoaderCircle className="spin" size={14} /> : <RefreshCw size={14} />}
                  Sincronizar e sair
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => void handleSignOut(true)}
                  disabled={signOutBusy}
                >
                  Sair e descartar
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => void handleSignOut(true)}
                disabled={signOutBusy}
              >
                {signOutBusy ? <LoaderCircle className="spin" size={14} /> : <LogOut size={14} />}
                Sair da conta
              </button>
            )}
          </>
        }
      >
        <p className="settings-hint" style={{ margin: 0 }}>
          {pendingCount > 0
            ? `Existem ${pendingCount} alteração(ões) ainda não sincronizada(s). Sair sem sincronizar descarta essa fila. O cache da conta neste dispositivo também será removido; os dados da nuvem continuam intactos.`
            : "O cache desta conta será removido do dispositivo. Seus dados continuam na nuvem e podem ser baixados no próximo login."}
        </p>
      </Modal>
    </div>
  );
}
