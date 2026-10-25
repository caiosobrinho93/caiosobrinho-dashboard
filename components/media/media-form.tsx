"use client";

import { Link2, Trash2, Video, Music2, Star } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useStore } from "@/lib/store";
import type { MediaKind, MediaLink } from "@/lib/types";
import { getMediaThumbnail, normalizeUrl } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type MediaFormModalProps = {
  open: boolean;
  onClose: () => void;
  media?: MediaLink | null;
  defaultKind?: MediaKind;
};

function UrlPreview({ url }: { url: string }) {
  const thumbnail = getMediaThumbnail(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!thumbnail || failed) {
    return (
      <div className="url-preview">
        <div className="url-preview-fallback">
          <Link2 size={14} />
          {thumbnail
            ? "Não foi possível carregar a prévia."
            : "A prévia aparece automaticamente para links do YouTube."}
        </div>
      </div>
    );
  }

  return (
    <div className="url-preview">
      <img src={thumbnail} alt="Prévia do vídeo" onError={() => setFailed(true)} />
    </div>
  );
}

export function MediaFormModal({
  open,
  onClose,
  media = null,
  defaultKind = "video",
}: MediaFormModalProps) {
  const { addMedia, updateMedia, deleteMedia } = useStore();
  const formId = useId();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<MediaKind>(defaultKind);
  const [tags, setTags] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(media?.title ?? "");
    setUrl(media?.url ?? "");
    setKind(media?.kind ?? defaultKind);
    setTags(media?.tags.join(", ") ?? "");
    setFavorite(media?.favorite ?? false);
    setError("");
    setConfirmDelete(false);
  }, [open, media, defaultKind]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const normalized = normalizeUrl(url);
    if (!cleanTitle) {
      setError("Dê um nome para encontrar depois.");
      return;
    }
    if (!normalized) {
      setError("Informe um link válido, como youtube.com/... ou open.spotify.com/...");
      return;
    }

    const parsedTags = Array.from(
      new Set(
        tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, 8);

    const draft = {
      title: cleanTitle,
      url: normalized,
      kind,
      tags: parsedTags,
      favorite,
    };

    if (media) {
      updateMedia(media.id, draft);
    } else {
      addMedia(draft);
    }
    onClose();
  }

  function handleDelete() {
    if (!media) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMedia(media.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={media ? "Editar link" : "Salvar link"}
      subtitle="Vídeos, playlists e músicas que você quer rever depois."
      footer={
        <>
          {media ? (
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
            {media ? "Salvar" : "Adicionar"}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="label">Tipo</span>
          <div className="segmented" role="group" aria-label="Tipo de mídia">
            <button
              type="button"
              className={`segment${kind === "video" ? " active" : ""}`}
              onClick={() => setKind("video")}
              aria-pressed={kind === "video"}
            >
              <Video size={13} />
              Vídeo
            </button>
            <button
              type="button"
              className={`segment${kind === "musica" ? " active" : ""}`}
              onClick={() => setKind("musica")}
              aria-pressed={kind === "musica"}
            >
              <Music2 size={13} />
              Música
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="media-title">
            Título
          </label>
          <input
            id="media-title"
            className="input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            placeholder="Ex.: documentário sobre design"
            data-autofocus
            maxLength={160}
            required
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <div className="field">
          <label className="label" htmlFor="media-url">
            Link
          </label>
          <div className="input-affix">
            <Link2 className="affix" size={13} />
            <input
              id="media-url"
              className="input"
              inputMode="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError("");
              }}
              placeholder="https://..."
              required
            />
          </div>
        </div>

        {url.trim() ? <UrlPreview url={url} /> : null}

        <div className="field">
          <label className="label" htmlFor="media-tags">
            Tags <span className="optional">separadas por vírgula</span>
          </label>
          <input
            id="media-tags"
            className="input"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="foco, estudo, dev"
          />
        </div>

        <button
          type="button"
          className="toggle-row"
          onClick={() => setFavorite((value) => !value)}
          aria-pressed={favorite}
        >
          <span className="toggle-label">
            <Star size={13} color={favorite ? "var(--yellow)" : "var(--muted)"} />
            Marcar como favorito
          </span>
          <span className={`toggle${favorite ? " on" : ""}`} aria-hidden="true" />
        </button>
      </form>
    </Modal>
  );
}
