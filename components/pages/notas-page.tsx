"use client";

import { Pin, Plus, Search, StickyNote } from "lucide-react";
import { useMemo, useState } from "react";
import { NoteFormModal } from "@/components/notes/note-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { useOpenOnHash } from "@/lib/use-hash-modal";
import { formatRelativeTime } from "@/lib/utils";

type NoteFilter = "todas" | "fixadas" | "outras";

function NoteCard({
  note,
  onEdit,
  onTogglePinned,
}: {
  note: Note;
  onEdit: () => void;
  onTogglePinned: () => void;
}) {
  return (
    <article
      className="note-card"
      style={{ "--note-color": note.color } as React.CSSProperties}
    >
      <div className="note-head">
        <button
          type="button"
          className="note-title note-main"
          onClick={onEdit}
          aria-label={`Editar nota: ${note.title}`}
        >
          {note.title}
        </button>
        <button
          type="button"
          className={`note-pin${note.pinned ? " pinned" : ""}`}
          onClick={onTogglePinned}
          aria-label={note.pinned ? `Desafixar nota: ${note.title}` : `Fixar nota: ${note.title}`}
          aria-pressed={note.pinned}
          title={note.pinned ? "Desafixar" : "Fixar no topo"}
        >
          <Pin size={13} fill={note.pinned ? "currentColor" : "none"} />
        </button>
      </div>

      <button
        type="button"
        className="note-body note-main"
        onClick={onEdit}
        aria-label={`Abrir nota: ${note.title}`}
      >
        {note.body || (
          <span className="note-body-empty">Sem conteúdo. Toque para escrever.</span>
        )}
      </button>

      <div className="note-foot">
        <span>{formatRelativeTime(note.updatedAt)}</span>
        <span className="note-color" aria-hidden="true" />
      </div>
    </article>
  );
}

export function NotasPage() {
  const { data, toggleNotePinned } = useStore();
  const [filter, setFilter] = useState<NoteFilter>("todas");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const notes = useMemo(
    () =>
      [...data.notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [data.notes],
  );

  const pinnedCount = notes.filter((note) => note.pinned).length;
  const unpinnedCount = notes.length - pinnedCount;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const recentCount = notes.filter(
    (note) => new Date(note.updatedAt).getTime() >= weekAgo,
  ).length;

  const filterOptions: { key: NoteFilter; label: string; count: number }[] = [
    { key: "todas", label: "Todas", count: notes.length },
    { key: "fixadas", label: "Fixadas", count: pinnedCount },
    { key: "outras", label: "Outras", count: unpinnedCount },
  ];

  const visibleNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notes.filter((note) => {
      if (filter === "fixadas" && !note.pinned) return false;
      if (filter === "outras" && note.pinned) return false;
      if (!term) return true;
      return `${note.title} ${note.body}`.toLowerCase().includes(term);
    });
  }, [notes, filter, search]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  useOpenOnHash("nova", openNew);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <div className="breadcrumb">
            <span>~</span>
            <span className="slash">/</span>
            <span>dashboard</span>
            <span className="slash">/</span>
            <span className="current">notas.md</span>
          </div>
          <h1 className="page-title">Notas</h1>
          <p className="page-subtitle">
            {notes.length === 0
              ? "Um espaço livre para ideias, checklists e tudo que não pode se perder."
              : `${notes.length} nota${notes.length === 1 ? "" : "s"} · ${pinnedCount} fixada${
                  pinnedCount === 1 ? "" : "s"
                } no topo · ${recentCount} atualizada${recentCount === 1 ? "" : "s"} nos últimos 7 dias.`}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={14} />
            Nova nota
          </button>
        </div>
      </div>

      <div className="shop-summary">
        <div className="shop-summary-item">
          <div className="shop-summary-label">Notas</div>
          <div className="shop-summary-value">{notes.length}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Fixadas</div>
          <div className="shop-summary-value">{pinnedCount}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Recentes</div>
          <div className="shop-summary-value">{recentCount}</div>
        </div>
      </div>

      <div className="media-toolbar">
        <div className="chips scroll" role="group" aria-label="Filtrar notas">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`chip${filter === option.key ? " active" : ""}`}
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
            >
              {option.label}
              <span className="chip-count">{option.count}</span>
            </button>
          ))}
        </div>
        <div className="search-field">
          <Search size={13} />
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar em todas as notas..."
            aria-label="Buscar notas"
          />
        </div>
      </div>

      {visibleNotes.length > 0 ? (
        <div className="notes-grid">
          {visibleNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => {
                setEditing(note);
                setFormOpen(true);
              }}
              onTogglePinned={() => toggleNotePinned(note.id)}
            />
          ))}
        </div>
      ) : (
        <Panel title="Notas" dotColor="var(--yellow)">
          <EmptyState
            icon={<StickyNote size={17} />}
            title={
              search || filter !== "todas"
                ? "Nenhuma nota encontrada"
                : "Nenhuma nota ainda"
            }
            text={
              search || filter !== "todas"
                ? "Tente outro termo, troque o filtro ou crie uma nota nova."
                : "Capture uma ideia antes que ela fuja. Depois você organiza, fixa e edita."
            }
            action={
              search || filter !== "todas" ? (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setFilter("todas");
                  }}
                >
                  Limpar filtros
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                  <Plus size={12} /> Criar primeira nota
                </button>
              )
            }
          />
        </Panel>
      )}

      <NoteFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        note={editing}
      />
    </div>
  );
}
