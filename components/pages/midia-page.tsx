"use client";

import {
  ExternalLink,
  MoreHorizontal,
  Music2,
  Plus,
  Search,
  Star,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MediaFormModal } from "@/components/media/media-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useStore } from "@/lib/store";
import type { MediaKind, MediaLink } from "@/lib/types";
import { useOpenOnHash } from "@/lib/use-hash-modal";
import {
  formatRelativeTime,
  getDomain,
  getMediaThumbnail,
} from "@/lib/utils";

type TagFilter = string | null;

function VideoCard({
  item,
  onEdit,
  onToggleFavorite,
}: {
  item: MediaLink;
  onEdit: () => void;
  onToggleFavorite: () => void;
}) {
  const thumbnail = getMediaThumbnail(item.url);

  return (
    <article className="media-card">
      <div className="media-thumb">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <span className="media-thumb-fallback" aria-hidden="true">
          <Video size={22} />
        </span>
        <a
          className="media-open-layer"
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Abrir vídeo: ${item.title}`}
        >
          <span className="media-play">
            <span>
              <PlayGlyph />
            </span>
          </span>
        </a>
        <div className="media-card-actions">
          <button
            type="button"
            className={`media-mini-btn${item.favorite ? " favorite" : ""}`}
            onClick={onToggleFavorite}
            aria-label={item.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={item.favorite}
          >
            <Star size={12} fill={item.favorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="media-mini-btn"
            onClick={onEdit}
            aria-label={`Editar link: ${item.title}`}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      <a
        className="media-body"
        href={item.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        <span className="media-title">{item.title}</span>
        <span className="media-meta">
          <Video size={9} />
          {getDomain(item.url)}
          {item.favorite ? <Star size={8} fill="currentColor" style={{ color: "var(--yellow)" }} /> : null}
        </span>
        {item.tags.length > 0 ? (
          <span className="media-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span className="media-tag" key={tag}>
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </a>
    </article>
  );
}

function PlayGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  );
}

function MusicRow({
  item,
  onEdit,
  onToggleFavorite,
}: {
  item: MediaLink;
  onEdit: () => void;
  onToggleFavorite: () => void;
}) {
  const thumbnail = getMediaThumbnail(item.url);

  return (
    <div className="music-row">
      <span className="music-art" aria-hidden="true">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Music2 size={16} />
        )}
      </span>
      <a
        className="music-info"
        href={item.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        <span className="music-title">{item.title}</span>
        <span className="music-sub">
          {getDomain(item.url)} · {formatRelativeTime(item.createdAt)}
          {item.tags.length > 0 ? ` · ${item.tags.slice(0, 2).join(" · ")}` : ""}
        </span>
      </a>
      <div className="music-actions">
        <button
          type="button"
          className={`icon-btn${item.favorite ? " favorite" : ""}`}
          onClick={onToggleFavorite}
          aria-label={item.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={item.favorite}
        >
          <Star size={14} fill={item.favorite ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onEdit}
          aria-label={`Editar link: ${item.title}`}
        >
          <MoreHorizontal size={15} />
        </button>
        <a
          className="icon-btn"
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Abrir link: ${item.title}`}
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

export function MidiaPage() {
  const { data, toggleMediaFavorite } = useStore();
  const [kind, setKind] = useState<MediaKind>("video");
  const [search, setSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [tagFilter, setTagFilter] = useState<TagFilter>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MediaLink | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  useOpenOnHash("nova", openNew);

  const videos = data.media.filter((item) => item.kind === "video");
  const musics = data.media.filter((item) => item.kind === "musica");
  const source = kind === "video" ? videos : musics;

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of source) {
      for (const tag of item.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [source]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return source
      .filter((item) => {
        if (onlyFavorites && !item.favorite) return false;
        if (tagFilter && !item.tags.includes(tagFilter)) return false;
        if (!term) return true;
        return `${item.title} ${item.tags.join(" ")} ${getDomain(item.url)}`
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [source, search, onlyFavorites, tagFilter]);

  function switchKind(nextKind: MediaKind) {
    setKind(nextKind);
    setSearch("");
    setTagFilter(null);
    setOnlyFavorites(false);
  }

  const favoriteCount = source.filter((item) => item.favorite).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <Breadcrumb segments={[{ label: "midia.json" }]} />
          <h1 className="page-title">Mídia</h1>
          <p className="page-subtitle">
            {videos.length} vídeo{videos.length === 1 ? "" : "s"} e {musics.length} música
            {musics.length === 1 ? "" : "s"} salvos para depois.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={14} />
            Salvar link
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Tipo de mídia">
        <button
          type="button"
          role="tab"
          aria-selected={kind === "video"}
          className={`tab${kind === "video" ? " active" : ""}`}
          onClick={() => switchKind("video")}
        >
          <Video size={13} />
          Vídeos
          <span className="tab-count">{videos.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === "musica"}
          className={`tab${kind === "musica" ? " active" : ""}`}
          onClick={() => switchKind("musica")}
        >
          <Music2 size={13} />
          Músicas
          <span className="tab-count">{musics.length}</span>
        </button>
      </div>

      <div className="media-toolbar">
        <div className="search-field">
          <Search size={13} />
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={kind === "video" ? "Buscar vídeo..." : "Buscar música..."}
            aria-label="Buscar mídia"
          />
        </div>
      </div>

      <div className="chips scroll" role="group" aria-label="Filtrar mídia">
        <button
          type="button"
          className={`chip${!onlyFavorites && !tagFilter ? " active" : ""}`}
          onClick={() => {
            setOnlyFavorites(false);
            setTagFilter(null);
          }}
        >
          Todos
          <span className="chip-count">{source.length}</span>
        </button>
        <button
          type="button"
          className={`chip${onlyFavorites ? " active" : ""}`}
          onClick={() => {
            setOnlyFavorites((value) => !value);
            setTagFilter(null);
          }}
          aria-pressed={onlyFavorites}
        >
          <Star size={11} fill={onlyFavorites ? "currentColor" : "none"} />
          Favoritos
          <span className="chip-count">{favoriteCount}</span>
        </button>
        {tags.map(([tag, count]) => (
          <button
            key={tag}
            type="button"
            className={`chip${tagFilter === tag ? " active" : ""}`}
            onClick={() => {
              setTagFilter((current) => (current === tag ? null : tag));
              setOnlyFavorites(false);
            }}
            aria-pressed={tagFilter === tag}
          >
            {tag}
            <span className="chip-count">{count}</span>
          </button>
        ))}
      </div>

      {kind === "video" ? (
        filtered.length > 0 ? (
          <div className="media-grid">
            {filtered.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                onEdit={() => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onToggleFavorite={() => toggleMediaFavorite(item.id)}
              />
            ))}
          </div>
        ) : (
          <Panel title="Vídeos" dotColor="var(--purple)">
            <EmptyState
              icon={<Video size={17} />}
              title={search || onlyFavorites || tagFilter ? "Nenhum vídeo encontrado" : "Nenhum vídeo salvo"}
              text={
                search || onlyFavorites || tagFilter
                  ? "Ajuste a busca ou limpe os filtros."
                  : "Cole um link do YouTube e deixe a prévia aparecer automaticamente."
              }
              action={
                search || onlyFavorites || tagFilter ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setSearch("");
                      setOnlyFavorites(false);
                      setTagFilter(null);
                    }}
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                    <Plus size={12} /> Salvar primeiro vídeo
                  </button>
                )
              }
            />
          </Panel>
        )
      ) : filtered.length > 0 ? (
        <Panel title="Músicas e playlists" subtitle={`${filtered.length} links`} dotColor="var(--purple)">
          <div className="panel-body flush">
            <div className="media-list">
              {filtered.map((item) => (
                <MusicRow
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setEditing(item);
                    setFormOpen(true);
                  }}
                  onToggleFavorite={() => toggleMediaFavorite(item.id)}
                />
              ))}
            </div>
          </div>
        </Panel>
      ) : (
        <Panel title="Músicas e playlists" dotColor="var(--purple)">
          <EmptyState
            icon={<Music2 size={17} />}
            title={search || onlyFavorites || tagFilter ? "Nenhuma música encontrada" : "Nenhuma música salva"}
            text={
              search || onlyFavorites || tagFilter
                ? "Ajuste a busca ou limpe os filtros."
                : "Guarde playlists, álbuns e músicas para o próximo momento de foco."
            }
            action={
              search || onlyFavorites || tagFilter ? (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setOnlyFavorites(false);
                    setTagFilter(null);
                  }}
                >
                  Limpar filtros
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                  <Plus size={12} /> Salvar primeira música
                </button>
              )
            }
          />
        </Panel>
      )}

      <MediaFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        media={editing}
        defaultKind={kind}
      />
    </div>
  );
}
