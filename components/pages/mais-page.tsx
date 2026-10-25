"use client";

import {
  ArrowUpRight,
  Cloud,
  Database,
  HardDrive,
  Settings,
  StickyNote,
  Target,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Panel } from "@/components/ui/panel";
import { useStore } from "@/lib/store";
import { formatBytes, percent, sum } from "@/lib/utils";

export function MaisPage() {
  const { data } = useStore();

  const videos = data.media.filter((item) => item.kind === "video").length;
  const musics = data.media.filter((item) => item.kind === "musica").length;
  const pinnedNotes = data.notes.filter((note) => note.pinned).length;
  const completedGoals = data.goals.filter((goal) => goal.current >= goal.target).length;
  const goalsAverage =
    data.goals.length > 0
      ? Math.round(
          sum(data.goals.map((goal) => percent(goal.current, goal.target))) / data.goals.length,
        )
      : 0;

  const recordCount =
    data.tasks.length +
    data.shopping.length +
    data.transactions.length +
    data.media.length +
    data.goals.length +
    data.notes.length;

  const storageBytes = useMemo(
    () => new TextEncoder().encode(JSON.stringify(data)).length,
    [data],
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <div className="breadcrumb">
            <span>~</span>
            <span className="slash">/</span>
            <span>dashboard</span>
            <span className="slash">/</span>
            <span className="current">mais.tsx</span>
          </div>
          <h1 className="page-title">Mais</h1>
          <p className="page-subtitle">
            Atalhos para o que não cabe na barra inferior, preferências e o estado do seu
            workspace local.
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
            concluída{completedGoals === 1 ? "" : "s"} · {goalsAverage}% médio
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
            Nome, orçamento, cor de destaque, backup e dados
          </span>
        </Link>
      </div>

      <Panel title="Estado do workspace" dotColor="var(--green)" className="system-panel">
        <div className="panel-body">
          <div className="system-row">
            <span className="system-row-label">
              <span className="status-dot online" aria-hidden="true" />
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
              <Cloud size={13} />
              Sincronização
            </span>
            <span className="system-row-value" style={{ color: "var(--yellow)" }}>
              Supabase · fase 2
            </span>
          </div>
        </div>
      </Panel>

      <Panel title="Próxima fase" dotColor="var(--accent)">
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="backend-status">
            <span className="badge badge-warning">
              <Cloud size={10} /> planejado
            </span>
            <span className="badge">Supabase</span>
            <span className="badge">Vercel</span>
            <span className="badge">Auth</span>
          </div>
          <p className="settings-hint">
            Hoje tudo fica salvo apenas neste navegador. A próxima fase adiciona login,
            sincronização entre dispositivos e backup na nuvem sem mudar a experiência do painel.
          </p>
          <Link href="/configuracoes" className="link-btn">
            Ver detalhes em Configurações <ArrowUpRight size={11} />
          </Link>
        </div>
      </Panel>
    </div>
  );
}
