"use client";

import {
  Check,
  Cloud,
  Database,
  Download,
  HardDrive,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Panel } from "@/components/ui/panel";
import { ACCENTS } from "@/lib/constants";
import { useStore } from "@/lib/store";
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

export function ConfiguracoesPage() {
  const {
    data,
    saveError,
    updateSettings,
    importData,
    loadDemo,
    clearAll,
  } = useStore();
  const settings = data.settings;
  const [name, setName] = useState(settings.name);
  const [budget, setBudget] = useState(formatAmountInput(settings.monthlyBudget));
  const [accent, setAccent] = useState<AccentKey>(settings.accent);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
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
    notify("Preferências salvas neste navegador.");
  }

  function handleAccent(key: AccentKey, label: string) {
    setAccent(key);
    updateSettings({ accent: key });
    notify(`Cor de destaque “${label}” aplicada.`);
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
      if (!importData(payload)) {
        notify("Backup inválido: faltam listas ou o formato não é reconhecido.", "error");
        return;
      }
      notify("Backup importado. Seus dados foram substituídos.");
    } catch {
      notify("Não foi possível ler o arquivo. Verifique se é um JSON válido.", "error");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <div className="breadcrumb">
            <span>~</span>
            <span className="slash">/</span>
            <span>dashboard</span>
            <span className="slash">/</span>
            <span className="current">settings.json</span>
          </div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">
            Preferências, backup local e o caminho para a futura sincronização na nuvem.
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
          <div className="shop-summary-value small">Local · fase 1</div>
        </div>
      </div>

      <div className="settings-stack">
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
                <span className="settings-hint">Tudo fica apenas neste navegador.</span>
              </div>
            </form>
          </div>
        </Panel>

        <Panel title="Dados e backup" subtitle="JSON local" dotColor="var(--blue)">
          <div
            className="panel-body"
            style={{ display: "flex", flexDirection: "column", gap: 11 }}
          >
            <p className="settings-hint">
              Exporte um arquivo JSON antes de trocar de navegador, limpar o cache ou testar
              mudanças grandes. A importação substitui todos os dados atuais.
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
                <span className="status-dot online" aria-hidden="true" />
                Persistência
              </span>
              <span className="system-row-value">localStorage · v{data.version}</span>
            </div>
          </div>
        </Panel>

        <Panel
          title="Supabase"
          subtitle="sincronização planejada"
          dotColor="var(--purple)"
          action={
            <span className="badge badge-warning">
              <Cloud size={10} /> fase 2
            </span>
          }
        >
          <div
            className="panel-body"
            style={{ display: "flex", flexDirection: "column", gap: 11 }}
          >
            <div className="backend-status">
              <span className="badge badge-accent">Auth</span>
              <span className="badge">Postgres</span>
              <span className="badge">RLS por usuário</span>
              <span className="badge">Vercel</span>
            </div>
            <p className="settings-hint">
              O frontend já usa um modelo de dados compatível com tabelas relacionais. Na próxima
              fase, login e sincronização entram sem refazer as telas: o armazenamento local passa
              a ser cache e a fonte da verdade vai para o Supabase.
            </p>
            <div className="backend-code">
              <span className="token-comment"># .env.local — quando a fase 2 começar</span>
              {"\n"}
              <span className="token-key">NEXT_PUBLIC_SUPABASE_URL</span>=
              <span className="token-string">https://seu-projeto.supabase.co</span>
              {"\n"}
              <span className="token-key">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=
              <span className="token-string">sua-chave-publica</span>
            </div>
          </div>
        </Panel>

        <Panel title="Zona de risco" className="danger-zone">
          <div
            className="panel-body"
            style={{ display: "flex", flexDirection: "column", gap: 11 }}
          >
            <p className="settings-hint">
              Recarregar a demonstração ou apagar tudo substitui os dados atuais deste navegador.
              Exporte um backup antes se quiser guardar o que existe agora.
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

      <ConfirmDialog
        open={confirmation === "demo"}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          loadDemo();
          notify("Dados de demonstração restaurados.");
        }}
        title="Restaurar demonstração?"
        description="As tarefas, compras, finanças, mídia, metas e notas atuais serão substituídas pelos dados de exemplo. Seu nome, orçamento e cor de destaque são mantidos."
        confirmLabel="Restaurar demo"
      />

      <ConfirmDialog
        open={confirmation === "clear"}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          clearAll();
          notify("Todos os registros foram apagados. Seu perfil foi mantido.");
        }}
        title="Apagar todos os dados?"
        description="Tarefas, compras, movimentações, links, metas e notas serão removidos deste navegador. Nome, orçamento e cor de destaque continuam salvos."
        confirmLabel="Apagar dados"
      />
    </div>
  );
}
