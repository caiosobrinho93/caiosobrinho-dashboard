import { ACCENTS, SHOPPING_CATEGORIES } from "./constants";
import { createEmptyData } from "./seed";
import type {
  DashboardData,
  MediaLink,
  Note,
  ShoppingItem,
  Task,
  Transaction,
  Goal,
} from "./types";
import { todayISO, toISODate, uid } from "./utils";

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function dateString(value: unknown, fallback: string): string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function timestamp(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function normalizeTask(raw: unknown): Task | null {
  if (!isRecord(raw)) return null;
  const title = text(raw.title).trim();
  if (!title) return null;
  const today = todayISO();
  return {
    id: text(raw.id, uid()),
    title,
    notes: text(raw.notes),
    priority: isOneOf(raw.priority, ["baixa", "media", "alta"] as const) ? raw.priority : "media",
    list: isOneOf(raw.list, ["Pessoal", "Trabalho", "Estudos", "Casa"] as const) ? raw.list : "Pessoal",
    due: raw.due === null || raw.due === "" ? null : dateString(raw.due, today),
    done: raw.done === true,
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
    completedAt: raw.completedAt ? timestamp(raw.completedAt, new Date().toISOString()) : null,
  };
}

function normalizeShoppingItem(raw: unknown): ShoppingItem | null {
  if (!isRecord(raw)) return null;
  const name = text(raw.name).trim();
  if (!name) return null;
  const category = isOneOf(raw.category, SHOPPING_CATEGORIES) ? raw.category : "Outros";
  const price = raw.price === null || raw.price === "" ? null : Math.max(0, number(raw.price));
  return {
    id: text(raw.id, uid()),
    name,
    quantity: Math.max(0.01, number(raw.quantity, 1)),
    unit: isOneOf(raw.unit, ["un", "kg", "g", "L", "ml", "cx", "pct"] as const) ? raw.unit : "un",
    price,
    category,
    done: raw.done === true,
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeTransaction(raw: unknown): Transaction | null {
  if (!isRecord(raw)) return null;
  const description = text(raw.description).trim();
  if (!description) return null;
  const type = raw.type === "receita" ? "receita" : "despesa";
  return {
    id: text(raw.id, uid()),
    description,
    amount: Math.max(0, number(raw.amount)),
    type,
    category: text(raw.category, "Outros"),
    date: dateString(raw.date, toISODate(new Date())),
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeMedia(raw: unknown): MediaLink | null {
  if (!isRecord(raw)) return null;
  const title = text(raw.title).trim();
  const url = text(raw.url).trim();
  if (!title || !url) return null;
  return {
    id: text(raw.id, uid()),
    title,
    url,
    kind: raw.kind === "musica" ? "musica" : "video",
    tags: array(raw.tags)
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8),
    favorite: raw.favorite === true,
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeGoal(raw: unknown): Goal | null {
  if (!isRecord(raw)) return null;
  const title = text(raw.title).trim();
  if (!title) return null;
  return {
    id: text(raw.id, uid()),
    title,
    target: Math.max(1, number(raw.target, 100)),
    current: Math.max(0, number(raw.current)),
    unit: text(raw.unit, "R$").trim() || "R$",
    deadline: raw.deadline === null || raw.deadline === "" ? null : dateString(raw.deadline, todayISO()),
    color: text(raw.color, "#569cd6"),
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeNote(raw: unknown): Note | null {
  if (!isRecord(raw)) return null;
  const title = text(raw.title).trim();
  if (!title) return null;
  const createdAt = timestamp(raw.createdAt, new Date().toISOString());
  return {
    id: text(raw.id, uid()),
    title,
    body: text(raw.body),
    color: text(raw.color, "#dcdcaa"),
    pinned: raw.pinned === true,
    createdAt,
    updatedAt: timestamp(raw.updatedAt, createdAt),
  };
}

export function normalizeDashboardData(
  raw: unknown,
  options: { requireArrays?: boolean } = {},
): DashboardData | null {
  if (!isRecord(raw)) return null;

  const arrayKeys = ["tasks", "shopping", "transactions", "media", "goals", "notes"] as const;
  if (options.requireArrays && !arrayKeys.every((key) => Array.isArray(raw[key]))) {
    return null;
  }

  const defaults = createEmptyData();
  const rawSettings = isRecord(raw.settings) ? raw.settings : {};
  const accent = isOneOf(rawSettings.accent, ["azul", "teal", "roxo", "laranja", "verde"] as const)
    ? rawSettings.accent
    : defaults.settings.accent;

  return {
    version: 1,
    tasks: array(raw.tasks)
      .map(normalizeTask)
      .filter((task): task is Task => task !== null),
    shopping: array(raw.shopping)
      .map(normalizeShoppingItem)
      .filter((item): item is ShoppingItem => item !== null),
    transactions: array(raw.transactions)
      .map(normalizeTransaction)
      .filter((item): item is Transaction => item !== null),
    media: array(raw.media)
      .map(normalizeMedia)
      .filter((item): item is MediaLink => item !== null),
    goals: array(raw.goals)
      .map(normalizeGoal)
      .filter((item): item is Goal => item !== null),
    notes: array(raw.notes)
      .map(normalizeNote)
      .filter((note): note is Note => note !== null),
    settings: {
      name: text(rawSettings.name, defaults.settings.name).trim() || defaults.settings.name,
      monthlyBudget: Math.max(0, number(rawSettings.monthlyBudget, defaults.settings.monthlyBudget)),
      accent,
      demoBannerDismissed:
        typeof rawSettings.demoBannerDismissed === "boolean"
          ? rawSettings.demoBannerDismissed
          : false,
    },
  };
}

export function isKnownAccent(value: unknown): boolean {
  return ACCENTS.some((accent) => accent.key === value);
}
