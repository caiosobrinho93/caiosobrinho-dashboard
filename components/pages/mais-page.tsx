"use client";

import {
  ArrowUpRight,
  Cloud,
  Database,
  HardDrive,
  LoaderCircle,
  LogIn,
  Settings,
  ShieldCheck,
  StickyNote,
  Target,
  UserRound,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Panel } from "@/components/ui/panel";
import { useStore } from "@/lib/store";
import { formatBytes, percent, sum } from "@/lib/utils";

export function MaisPage() {
  const {
    data,
    cloudConfigured,
    syncState,
    syncError,
    pendingCount,
    online,
  } = useStore();
  const { user } = useAuth();

  const videos = useMemo(() => data.media.filter((item) => item.kind === "video").length, [data.media]);
  const musics = useMemo(() => data.media.filter((item) => item.kind === "musica").length, [data.media]);
  const pinnedNotes = useMemo(() => data.notes.filter((note) => note.pinned).length, [data.notes]);
  const completedGoals = useMemo(
    () => data.goals.filter((goal) => goal.current >= goal.target).length,
    [data.goals],
  );
  const goalsAverage = useMemo(
    () =>
      data.goals.length > 0
        ? Math.round(
            sum(data.goals.map((goal) => percent(goal.current, goal.target))) / data.goals.length,
          )
        : 0,
    [data.goals],
  );

  const recordCount = useMemo(
    () =>
      data.tasks.length +
      data.shopping.length +
      data.transactions.length +
      data.media.length +
      data.goals.length +
      data.notes.length,
    [data],
  );

  const storageBytes = useMemo(
    () => new TextEncoder().encode(JSON.stringify(data)).length,
    [data],
  );

  const syncLabel = !cloudConfigured
    ? "Nuvem não configurada"
    : !user
      ? "Modo local"
      : syncState === "connecting"
        ? "Conectando"
        : syncState === "syncing"
          ? pendingCount > 0
            ? `Sincronizando (${pendingCount})`
            : "Sincronizando"
          : syncState === "offline"
            ? pendingCount > 0
              ? `Offline (${pendingCount})`
              : "Offline"
            : syncState === "error"
              ? "Erro de sincronização"
              : "Nuvem sincronizada";

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <Breadcrumb segments={[{ label: "mais.tsx" }]} />
          <h1 className="page-title">Mais</h1>
          <p className="page-subtitle">
            Atalhos, preferências e o estado do seu workspace.
          </p>
        </div>
      </div>

      <div className="hub-grid">
        <Link
          href="/midia"
          className="hub-card"
          style={{ "--hub-color": "var(--purple)" } as React.CSSProperties}
        >
          <span className="hub-icon">
            <Video size={15} />
          </span>
          <span className="hub-card-title">
            Mídia
            <ArrowUpRight size={12} className="hub-arrow" />
          </span>
          <span className="hub-card-meta">
            {videos} vídeo{videos === 1 ? "" : "s"} · {musics} música
            {musics === 1 ? "" : "s"} salvos
          </span>
        </Link>

        <Link
          href="/metas"
          className="hub-card"
          style={{ "--hub-color": "var(--orange)" } as React.CSSProperties}
        >
          <span className="hub-icon">
            <Target size={15} />
          </span>
          <span className="hub-card-title">
            Metas
            <ArrowUpRight size={12} className="hub-arrow" />
          </span>
          <span className="hub-card-meta">
            {data.goals.length} meta{data.goals.length === 1 ? "" : "s"} · {completedGoals}{" "}
            concluída{completedGoals === 1 ? "" : "s"} · {goalsAverage}% de média
          </span>
        </Link>

        <Link
          href="/notas"
          className="hub-card"
          style={{ "--hub-color": "var(--yellow)" } as React.CSSProperties}
        >
          <span className="hub-icon">
            <StickyNote size={15} />
          </span>
          <span className="hub-card-title">
            Notas
            <ArrowUpRight size={12} className="hub-arrow" />
          </span>
          <span className="hub-card-meta">
            {data.notes.length} nota{data.notes.length === 1 ? "" : "s"} · {pinnedNotes} fixada
            {pinnedNotes === 1 ? "" : "s"}
          </span>
        </Link>

        <Link
          href="/configuracoes"
          className="hub-card"
          style={{ "--hub-color": "var(--text-dim)" } as React.CSSProperties}
        >
          <span className="hub-icon">
            <Settings size={15} />
          </span>
          <span className="hub-card-title">
            Configurações
            <ArrowUpRight size={12} className="hub-arrow" />
          </span>
          <span className="hub-card-meta">
            Conta, preferências, backup e sincronização
          </span>
        </Link>
      </div>

      <Panel title="Estado do workspace" dotColor="var(--green)" className="system-panel">
        <div className="panel-body">
          <div className="system-row">
            <span className="system-row-label">
              <span className={`status-dot ${online ? "online" : "offline"}`} aria-hidden="true" />
              Armazenamento local
            </span>
            <span className="system-row-value">{formatBytes(storageBytes)}</span>
          </div>
          <div className="system-row">
            <span className="system-row-label">
              <HardDrive size={13} />
              Registros salvos
            </span>
            <span className="system-row-value">{recordCount}</span>
          </div>
          <div className="system-row">
            <span className="system-row-label">
              <Database size={13} />
              Versão dos dados
            </span>
            <span className="system-row-value">v{data.version}</span>
          </div>
          <div className="system-row">
            <span className="system-row-label">
              <UserRound size={13} />
              Conta
            </span>
            <span className="system-row-value">{user?.email ?? "Modo local"}</span>
          </div>
          <div className="system-row">
            <span className="system-row-label">
              {syncState === "syncing" || syncState === "connecting" ? (
                <LoaderCircle className="spin" size={13} />
              ) : (
                <Cloud size={13} />
              )}
              Sincronização
            </span>
            <span
              className="system-row-value"
              style={{
                color:
                  syncState === "error"
                    ? "var(--red)"
                    : syncState === "offline"
                      ? "var(--yellow)"
                      : syncState === "synced"
                        ? "var(--green)"
                        : "var(--text-dim)",
              }}
            >
              {syncLabel}
            </span>
          </div>
          {pendingCount > 0 ? (
            <div className="system-row">
              <span className="system-row-label">
                <Cloud size={13} />
                Fila offline
              </span>
              <span className="system-row-value">{pendingCount} alteração(ões)</span>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Conta e nuvem" dotColor="var(--accent)">
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!cloudConfigured ? (
            <>
              <div className="backend-status">
                <span className="badge badge-warning">
                  <Cloud size={10} /> modo local
                </span>
              </div>
              <p className="settings-hint">
                Este build não tem as variáveis públicas do Supabase. O dashboard continua
                funcionando localmente. Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> para ativar a conta.
              </p>
            </>
          ) : user ? (
            <>
              <div className="backend-status">
                <span className="badge badge-success">
                  <ShieldCheck size={10} /> conta conectada
                </span>
                <span className={syncState === "synced" ? "badge badge-success" : "badge"}>
                  {syncLabel}
                </span>
              </div>
              <p className="settings-hint">
                {syncError
                  ? syncError
                  : "Os dados são sincronizados automaticamente e também ficam em cache neste dispositivo para uso offline."}
              </p>
            </>
          ) : (
            <>
              <div className="backend-status">
                <span className="badge badge-warning">
                  <HardDrive size={10} /> dados só neste navegador
                </span>
              </div>
              <p className="settings-hint">
                Crie uma conta para acessar as mesmas tarefas, compras e finanças em outros
                dispositivos. O modo local continua funcionando se você sair.
              </p>
              <div className="data-actions">
                <Link href="/entrar" className="btn btn-primary">
                  <LogIn size={13} />
                  Entrar
                </Link>
                <Link href="/criar-conta" className="btn btn-secondary">
                  Criar conta
                </Link>
              </div>
            </>
          )}
          <Link href="/configuracoes" className="link-btn">
            Ver detalhes em Configurações <ArrowUpRight size={11} />
          </Link>
        </div>
      </Panel>
    </div>
  );
}
