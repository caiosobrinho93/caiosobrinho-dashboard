"use client";

import { App as CapacitorApp } from "@capacitor/app";
import {
  Check,
  CircleCheck,
  Cloud,
  GitBranch,
  RefreshCw,
  Search,
  Settings,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { BootScreen, useIntroDelay } from "@/components/boot-screen";
import { CloudOverlay } from "@/components/cloud/cloud-overlay";
import { CommandPalette } from "@/components/command-palette";
import { MobileBubbleMenu } from "@/components/mobile-bubble-menu";
import {
  isActivePath,
  NAV_ITEMS,
  SETTINGS_ITEM,
} from "@/components/nav";
import { stripBasePath, withBasePath } from "@/lib/base-path";
import { hideNativeSplash, hapticTap, isNativeApp } from "@/lib/native";
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
  "/entrar": "Entrar",
  "/criar-conta": "Criar conta",
  "/recuperar-senha": "Recuperar senha",
  "/redefinir-senha": "Redefinir senha",
};

export const AUTH_PATHS = ["/entrar", "/criar-conta", "/recuperar-senha", "/redefinir-senha"];

function formatCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

function TitleBar({
  onOpenPalette,
  onRefresh,
  refreshing,
}: {
  onOpenPalette: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="titlebar">
      <div className="titlebar-left">
        {/* 3 dots removed */}
        <span className="titlebar-title">
          dashboard-pessoal <span>— Visual Studio Code</span>
        </span>
      </div>

      <button
        type="button"
        className="titlebar-command"
        onClick={onOpenPalette}
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
        <button
          type="button"
          className={`titlebar-refresh-btn${refreshing ? " refreshing" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Atualizar dados do app"
          title="Atualizar dados e sincronizar"
        >
          <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          <span className="titlebar-refresh-text">
            {refreshing ? "Atualizando..." : "Atualizar"}
          </span>
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
        <img src={withBasePath("/icon.svg")} alt="" />
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
            aria-label={badge > 0 ? `${item.label}, ${badge} em aberto` : item.label}
            aria-current={active ? "page" : undefined}
            title={item.label}
          >
            <Icon size={19} strokeWidth={1.8} />
            {badge > 0 ? (
              <span className="activity-badge" aria-hidden="true">
                {formatCount(badge)}
              </span>
            ) : null}
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
  const { cloudConfigured, cloudPhase, syncState, syncError, pendingCount, lastSyncedAt } =
    useStore();
  const { user } = useAuth();

  let label = "Local";
  let detail = "Dados salvos neste dispositivo";
  let tone = "";

  if (!cloudConfigured) {
    label = "Nuvem não configurada";
    detail = "Preencha as variáveis públicas do Supabase para ativar a sincronização.";
    tone = "warning";
  } else if (cloudPhase === "choice") {
    label = "Configurar nuvem";
    detail = "Escolha como combinar os dados deste dispositivo com a conta.";
    tone = "warning";
  } else if (syncState === "connecting") {
    label = "Conectando à nuvem";
    detail = "Verificando sua conta e carregando os dados.";
  } else if (!user) {
    label = "Local";
    detail = "Entre na sua conta para sincronizar entre dispositivos.";
  } else if (syncState === "syncing") {
    label = pendingCount > 0 ? `Sincronizando (${pendingCount})` : "Sincronizando";
    detail = "Enviando alterações para a nuvem.";
  } else if (syncState === "offline") {
    label = pendingCount > 0 ? `Offline (${pendingCount})` : "Offline";
    detail = "As alterações ficam neste dispositivo até a conexão voltar.";
    tone = "warning";
  } else if (syncState === "error") {
    label = "Erro de sincronização";
    detail = syncError ?? "Abra Configurações para tentar novamente.";
    tone = "danger";
  } else if (syncState === "synced") {
    label = "Nuvem sincronizada";
    detail = lastSyncedAt
      ? `Última sincronização às ${new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(lastSyncedAt))}.`
      : "Seus dados estão atualizados.";
  }

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
        <span className={`status-item status-cloud ${tone}`} title={detail}>
          {tone === "danger" ? <TriangleAlert size={11} /> : <Cloud size={11} />}
          {label}
        </span>
      </div>
      <div className="status-group">
        <span className="status-item" title={user ? "Dados sincronizados na nuvem" : "Dados salvos no navegador"}>
          {user ? <UserRound size={11} /> : null}
          {user ? "nuvem" : "local"}
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
  const { data, hydrated, syncNow, cloudConfigured } = useStore();
  const { user, loading: authLoading } = useAuth();
  const normalizedPath = stripBasePath(pathname).replace(/\/+$/, "") || "/";
  const isAuthRoute = AUTH_PATHS.includes(normalizedPath);
  const introReady = useIntroDelay(isAuthRoute ? 0 : 280);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    void hapticTap();
    try {
      if (cloudConfigured && user) {
        await syncNow();
      }
    } catch {
      // Ignora erro
    } finally {
      window.location.reload();
    }
  };

  const pendingTasks = data.tasks.filter((task) => !task.done).length;
  const pendingShopping = data.shopping.filter((item) => !item.done).length;
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

      if (normalizedPath !== "/") {
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
  }, [normalizedPath, router]);

  if (!hydrated || authLoading || !introReady) {
    return <BootScreen />;
  }

  if (isAuthRoute) {
    return <div className="auth-app">{children}</div>;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <TitleBar
        onOpenPalette={() => setPaletteOpen(true)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <div className="app-body">
        <ActivityBar
          pathname={normalizedPath}
          pendingTasks={pendingTasks}
          pendingShopping={pendingShopping}
        />
        <main className="app-main" id="conteudo" ref={mainRef}>
          <div className="content">{children}</div>
        </main>
      </div>

      <StatusBar />
      <MobileBubbleMenu
        pathname={normalizedPath}
        pendingTasks={pendingTasks}
        pendingShopping={pendingShopping}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <CloudOverlay />
    </div>
  );
}
