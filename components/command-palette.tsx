"use client";

import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/components/nav";
import { useStore } from "@/lib/store";
import { downloadTextFile } from "@/lib/utils";

type PaletteItem = {
  id: string;
  label: string;
  group: string;
  hint: string;
  icon: LucideIcon;
  href?: string;
  keywords?: string;
  action?: () => void;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const navigation = [...NAV_ITEMS, SETTINGS_ITEM].map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: "Ir para",
      hint: `~${item.href === "/" ? "/dashboard" : item.href}`,
      icon: item.icon,
      href: item.href,
      keywords: item.keywords,
    }));

    const create: PaletteItem[] = [
      {
        id: "new-task",
        label: "Nova tarefa",
        group: "Criar",
        hint: "tarefas.md",
        icon: Plus,
        href: "/tarefas#nova",
        keywords: "adicionar todo",
      },
      {
        id: "new-expense",
        label: "Novo gasto ou receita",
        group: "Criar",
        hint: "financas.db",
        icon: Plus,
        href: "/financas#nova",
        keywords: "transação dinheiro receita despesa",
      },
      {
        id: "new-shopping",
        label: "Novo item de compras",
        group: "Criar",
        hint: "compras.md",
        icon: Plus,
        href: "/compras#nova",
        keywords: "mercado supermercado lista",
      },
      {
        id: "new-media",
        label: "Salvar vídeo ou música",
        group: "Criar",
        hint: "midia.json",
        icon: Plus,
        href: "/midia#nova",
        keywords: "link youtube spotify",
      },
      {
        id: "new-goal",
        label: "Nova meta",
        group: "Criar",
        hint: "metas.goals",
        icon: Plus,
        href: "/metas#nova",
        keywords: "objetivo progresso",
      },
      {
        id: "new-note",
        label: "Nova nota",
        group: "Criar",
        hint: "notas.md",
        icon: Plus,
        href: "/notas#nova",
        keywords: "anotação ideia",
      },
    ];

    const system: PaletteItem[] = [
      {
        id: "export",
        label: "Exportar backup (.json)",
        group: "Sistema",
        hint: "download",
        icon: Download,
        action: () => {
          downloadTextFile(
            `dashboard-pessoal-${new Date().toISOString().slice(0, 10)}.json`,
            JSON.stringify(data, null, 2),
            "application/json",
          );
        },
        keywords: "baixar dados backup",
      },
    ];

    return [...navigation, ...create, ...system];
  }, [data]);

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return items;
    return items.filter((item) =>
      normalize(`${item.label} ${item.group} ${item.keywords ?? ""}`).includes(term),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector<HTMLElement>(".palette-item.active");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  function run(item: PaletteItem) {
    onClose();
    if (item.action) {
      item.action();
      return;
    }
    if (item.href) router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[activeIndex];
      if (item) run(item);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  let lastGroup = "";

  return (
    <div
      className="palette-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input-row">
          <Search size={15} />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, comandos e ações..."
            aria-label="Buscar comandos"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kbd">esc</span>
        </div>

        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="palette-empty">Nenhum comando encontrado para “{query}”.</p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {showGroup ? <div className="palette-group-label">{item.group}</div> : null}
                  <button
                    type="button"
                    className={`palette-item${index === activeIndex ? " active" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => run(item)}
                  >
                    <Icon className="palette-icon" size={14} />
                    <span className="palette-label">{item.label}</span>
                    <span className="palette-hint">{item.hint}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="palette-foot">
          <span>
            <ArrowUp size={9} />
            <ArrowDown size={9} />
            navegar
          </span>
          <span>
            <CornerDownLeft size={9} />
            abrir
          </span>
          <span className="mono" style={{ marginLeft: "auto" }}>
            dashboard-pessoal
          </span>
        </div>
      </div>
    </div>
  );
}
