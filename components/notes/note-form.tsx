"use client";

import { Pin, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { NOTE_COLORS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { Modal } from "@/components/ui/modal";

type NoteFormModalProps = {
  open: boolean;
  onClose: () => void;
  note?: Note | null;
};

export function NoteFormModal({ open, onClose, note = null }: NoteFormModalProps) {
  const { addNote, updateNote, deleteNote } = useStore();
  const formId = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0].value);
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setColor(note?.color ?? NOTE_COLORS[0].value);
    setPinned(note?.pinned ?? false);
    setError("");
    setConfirmDelete(false);
  }, [open, note]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Dê um título para a nota.");
      return;
    }

    const draft = {
      title: cleanTitle,
      body: body.trim(),
      color,
      pinned,
    };

    if (note) {
      updateNote(note.id, draft);
    } else {
      addNote(draft);
    }
    onClose();
  }

  function handleDelete() {
    if (!note) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteNote(note.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? "Editar nota" : "Nova nota"}
      subtitle="Um lugar livre para ideias, listas e coisas que não podem se perder."
      footer={
        <>
          {note ? (
            <div className="footer-left">
              <button
                type="button"
                className={`btn btn-sm ${confirmDelete ? "btn-danger-solid" : "btn-danger"}`}
                onClick={handleDelete}
              >
                <Trash2 size={13} />
                {confirmDelete ? "Confirmar?" : "Excluir"}
              </button>
            </div>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {note ? "Salvar" : "Criar nota"}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="note-title">
            Título
          </label>
          <input
            id="note-title"
            className="input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            placeholder="Ex.: ideias para o fim de semana"
            data-autofocus
            maxLength={140}
            required
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <div className="field">
          <label className="label" htmlFor="note-body">
            Conteúdo
          </label>
          <textarea
            id="note-body"
            className="input textarea"
            style={{ minHeight: 170 }}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Escreva sem cerimônia..."
            rows={7}
          />
        </div>

        <div className="field">
          <span className="label">Cor</span>
          <div className="color-picker">
            {NOTE_COLORS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`color-swatch${color === option.value ? " active" : ""}`}
                style={{ "--swatch": option.value } as React.CSSProperties}
                onClick={() => setColor(option.value)}
                aria-label={`Cor ${option.label}`}
                aria-pressed={color === option.value}
              >
                {color === option.value ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="toggle-row"
          onClick={() => setPinned((value) => !value)}
          aria-pressed={pinned}
        >
          <span className="toggle-label">
            <Pin size={13} color={pinned ? "var(--yellow)" : "var(--muted)"} />
            Fixar no topo
          </span>
          <span className={`toggle${pinned ? " on" : ""}`} aria-hidden="true" />
        </button>
      </form>
    </Modal>
  );
}
