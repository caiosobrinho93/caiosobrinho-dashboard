"use client";

import { App as CapacitorApp } from "@capacitor/app";
import {
  Check,
  CircleCheck,
  Cloud,
  GitBranch,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BootScreen, useIntroDelay } from "@/components/boot-screen";
import { CommandPalette } from "@/components/command-palette";
import {
  isActivePath,
  MOBILE_NAV,
  NAV_ITEMS,
  SECONDARY_PATHS,
  SETTINGS_ITEM,
} from "@/components/nav";
import { hideNativeSplash, isNativeApp } from "@/lib/native";
import { useStore } from "@/lib/store";

const TITLES: Record<string, string> = {
  "/": "Início",
  "/tarefas": "Tarefas",
  "/compras": "Compras",
  "/financas": "Finanças",
  "/midia": "Mídia",
  "/metas": "Metas",
  "/notas": "Notas",
  "/mais": "Mais",
  "/configuracoes": "Configurações",
};

function formatCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

function TitleBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <div className="window-dots" aria-hidden="true">
          <span className="window-dot red" />
          <span className="window-dot yellow" />
          <span className="window-dot green" />
        </div>
        <span className="titlebar-title">
          dashboard-pessoal <span>— Visual Studio Code</span>
        </span>
      </div>

      <button
        type="button"
        className="titlebar-command"
        onClick={onOpenPalette}
        aria-label="Buscar ou executar comando"
      >
        <Search size={12} />
        <span className="command-text">Buscar ou executar comando...</span>
        <span className="kbd">Ctrl K</span>
      </button>

      <div className="titlebar-actions">
        <button
          type="button"
          className="icon-btn mobile-only"
          onClick={onOpenPalette}
          aria-label="Buscar ou executar comando"
        >
          <Search size={17} />
        </button>
        <Link className="icon-btn" href="/configuracoes" aria-label="Configurações">
          <Settings size={16} />
        </Link>
      </div>
    </header>
  );
}

function ActivityBar({
  pathname,
  pendingTasks,
  pendingShopping,
}: {
  pathname: string;
  pendingTasks: number;
  pendingShopping: number;
}) {
  return (
    <nav className="activity-bar" aria-label="Navegação do workspace">
      <Link href="/" className="activity-logo" aria-label="Início">
        <img src="/icon.svg" alt="" />
      </Link>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        const badge =
          item.href === "/tarefas"
            ? pendingTasks
            : item.href === "/compras"
              ? pendingShopping
              : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`activity-item${active ? " active" : ""}`}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            title={item.label}
          >
            <Icon size={19} strokeWidth={1.8} />
            {badge > 0 ? <span className="activity-badge">{formatCount(badge)}</span> : null}
          </Link>
        );
      })}

      <div className="activity-spacer" />
      <Link
        href={SETTINGS_ITEM.href}
        className={`activity-item${isActivePath(pathname, SETTINGS_ITEM.href) ? " active" : ""}`}
        aria-label="Configurações"
        title="Configurações"
      >
        <Settings size={19} strokeWidth={1.8} />
      </Link>
    </nav>
  );
}

function MobileNav({
  pathname,
  pendingTasks,
  pendingShopping,
}: {
  pathname: string;
  pendingTasks: number;
  pendingShopping: number;
}) {
  return (
    <nav className="mobile-nav" aria-label="Navegação principal">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const isMore = item.href === "/mais";
        const active = isMore
          ? SECONDARY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
          : isActivePath(pathname, item.href);
        const badge =
          "badge" in item && item.badge === "tasks"
            ? pendingTasks
            : "badge" in item && item.badge === "shopping"
              ? pendingShopping
              : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.7} />
            <span>{item.label}</span>
            {badge > 0 ? <span className="mobile-nav-badge">{formatCount(badge)}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return <span>{time}</span>;
}

function StatusBar() {
  return (
    <footer className="status-bar" aria-label="Status do workspace">
      <div className="status-group">
        <span className="status-item" title="Branch principal">
          <GitBranch size={11} />
          main*
        </span>
        <span className="status-item" title="Nenhum problema encontrado">
          <CircleCheck size={11} />0 problemas
        </span>
        <span className="status-item">
          <Cloud size={11} />
          Supabase: fase 2
        </span>
      </div>
      <div className="status-group">
        <span className="status-item" title="Dados salvos no navegador">
          local
        </span>
        <span className="status-item">UTF-8</span>
        <span className="status-item">TypeScript</span>
        <span className="status-item" title="Hora local">
          <Clock />
        </span>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, hydrated } = useStore();
  const introReady = useIntroDelay(280);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const pendingTasks = data.tasks.filter((task) => !task.done).length;
  const pendingShopping = data.shopping.filter((item) => !item.done).length;
  const normalizedPath =
    pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  const pageTitle = TITLES[normalizedPath] ?? "Dashboard";

  useEffect(() => {
    document.title = `${pageTitle} · Dashboard pessoal`;
  }, [pageTitle]);

  useEffect(() => {
    setPaletteOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!hydrated || !introReady) return;
    void hideNativeSplash();
  }, [hydrated, introReady]);

  useEffect(() => {
    if (!isNativeApp()) return;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (document.querySelector(".palette-overlay")) {
        setPaletteOpen(false);
        return;
      }

      if (document.querySelector(".overlay")) {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        return;
      }

      if (pathname !== "/") {
        if (canGoBack) router.back();
        else router.push("/");
        return;
      }

      void CapacitorApp.exitApp();
    }).then((handle) => {
      if (disposed) void handle.remove();
      else listener = handle;
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [pathname, router]);

  if (!hydrated || !introReady) {
    return <BootScreen />;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <TitleBar onOpenPalette={() => setPaletteOpen(true)} />

      <div className="app-body">
        <ActivityBar
          pathname={pathname}
          pendingTasks={pendingTasks}
          pendingShopping={pendingShopping}
        />
        <main className="app-main" id="conteudo" ref={mainRef}>
          <div className="content">{children}</div>
        </main>
      </div>

      <StatusBar />
      <MobileNav
        pathname={pathname}
        pendingTasks={pendingTasks}
        pendingShopping={pendingShopping}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
