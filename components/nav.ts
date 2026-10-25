import {
  Home,
  ListTodo,
  MoreHorizontal,
  Settings,
  ShoppingCart,
  StickyNote,
  Target,
  Video,
  Wallet,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    href: "/",
    label: "Início",
    file: "inicio.tsx",
    icon: Home,
    color: "#3794ff",
    keywords: "home dashboard painel",
  },
  {
    href: "/tarefas",
    label: "Tarefas",
    file: "tarefas.md",
    icon: ListTodo,
    color: "#dcdcaa",
    keywords: "todo afazeres pendências",
  },
  {
    href: "/compras",
    label: "Compras",
    file: "compras.md",
    icon: ShoppingCart,
    color: "#89d185",
    keywords: "mercado lista supermercado",
  },
  {
    href: "/financas",
    label: "Finanças",
    file: "financas.db",
    icon: Wallet,
    color: "#4ec9b0",
    keywords: "dinheiro gastos receitas orçamento",
  },
  {
    href: "/midia",
    label: "Mídia",
    file: "midia.json",
    icon: Video,
    color: "#c586c0",
    keywords: "vídeos música links youtube spotify",
  },
  {
    href: "/metas",
    label: "Metas",
    file: "metas.goals",
    icon: Target,
    color: "#ce9178",
    keywords: "objetivos progresso metas",
  },
  {
    href: "/notas",
    label: "Notas",
    file: "notas.md",
    icon: StickyNote,
    color: "#dcdcaa",
    keywords: "anotações ideias rascunhos",
  },
] as const;

export const SETTINGS_ITEM = {
  href: "/configuracoes",
  label: "Configurações",
  file: "settings.json",
  icon: Settings,
  color: "#9d9d9d",
  keywords: "ajustes preferências tema dados",
} as const;

export const MOBILE_NAV = [
  { ...NAV_ITEMS[0], label: "Início" },
  { ...NAV_ITEMS[1], label: "Tarefas", badge: "tasks" as const },
  { ...NAV_ITEMS[2], label: "Compras", badge: "shopping" as const },
  { ...NAV_ITEMS[3], label: "Finanças" },
  { href: "/mais", label: "Mais", file: "mais", icon: MoreHorizontal, color: "#9d9d9d" },
] as const;

export const SECONDARY_PATHS = ["/midia", "/metas", "/notas", "/configuracoes", "/mais"];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
