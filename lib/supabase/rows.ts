import { createEmptyData } from "@/lib/seed";
import type {
  AccentKey,
  DashboardData,
  Goal,
  MediaLink,
  Note,
  Priority,
  Settings,
  ShoppingCategory,
  ShoppingItem,
  ShoppingUnit,
  Task,
  TaskList,
  Transaction,
  TransactionType,
} from "@/lib/types";

export type CloudTable =
  | "settings"
  | "tasks"
  | "shopping"
  | "transactions"
  | "media"
  | "goals"
  | "notes";

export type RemoteTable =
  | "dashboard_settings"
  | "tasks"
  | "shopping_items"
  | "transactions"
  | "media_links"
  | "goals"
  | "notes";

export const TABLE_TO_REMOTE: Record<CloudTable, RemoteTable> = {
  settings: "dashboard_settings",
  tasks: "tasks",
  shopping: "shopping_items",
  transactions: "transactions",
  media: "media_links",
  goals: "goals",
  notes: "notes",
};

export type SettingsRow = {
  user_id: string;
  display_name: string;
  monthly_budget: number | string;
  accent: string;
  demo_banner_dismissed: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  priority: string;
  list: string;
  due_date: string | null;
  done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type ShoppingRow = {
  id: string;
  user_id: string;
  name: string;
  quantity: number | string;
  unit: string;
  price: number | string | null;
  category: string;
  done: boolean;
  created_at: string;
  updated_at?: string;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  description: string;
  amount: number | string;
  type: string;
  category: string;
  date: string;
  created_at: string;
  updated_at?: string;
};

export type MediaRow = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  kind: string;
  tags: string[] | null;
  favorite: boolean;
  created_at: string;
  updated_at?: string;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  target_amount: number | string;
  current_amount: number | string;
  unit: string;
  deadline: string | null;
  color: string;
  created_at: string;
  updated_at?: string;
};

export type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type RemoteSnapshot = {
  settings: SettingsRow | null;
  tasks: TaskRow[];
  shopping: ShoppingRow[];
  transactions: TransactionRow[];
  media: MediaRow[];
  goals: GoalRow[];
  notes: NoteRow[];
};

export type DashboardRows = {
  settings: SettingsRow;
  tasks: TaskRow[];
  shopping: ShoppingRow[];
  transactions: TransactionRow[];
  media: MediaRow[];
  goals: GoalRow[];
  notes: NoteRow[];
};

const ACCENTS: AccentKey[] = ["azul", "teal", "roxo", "laranja", "verde"];
const PRIORITIES: Priority[] = ["baixa", "media", "alta"];
const LISTS: TaskList[] = ["Pessoal", "Trabalho", "Estudos", "Casa"];
const UNITS: ShoppingUnit[] = ["un", "kg", "g", "L", "ml", "cx", "pct"];
const CATEGORIES: ShoppingCategory[] = ["Mercado", "Farmácia", "Casa", "Outros"];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function asTimestamp(value: unknown, fallback = new Date().toISOString()): string {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.includes(value as T) ? (value as T) : fallback;
}

export function toSettingsRow(settings: Settings, userId: string): SettingsRow {
  return {
    user_id: userId,
    display_name: settings.name.trim() || "Você",
    monthly_budget: Math.max(0, settings.monthlyBudget),
    accent: settings.accent,
    demo_banner_dismissed: settings.demoBannerDismissed,
  };
}

export function fromSettingsRow(row: SettingsRow): Settings {
  return {
    name: asString(row.display_name, "Você").trim() || "Você",
    monthlyBudget: Math.max(0, asNumber(row.monthly_budget)),
    accent: oneOf<AccentKey>(row.accent, ACCENTS, "azul"),
    demoBannerDismissed: asBoolean(row.demo_banner_dismissed, true),
  };
}

export function toTaskRow(task: Task, userId: string): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    notes: task.notes,
    priority: task.priority,
    list: task.list,
    due_date: task.due,
    done: task.done,
    completed_at: task.completedAt,
    created_at: task.createdAt,
  };
}

export function fromTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: asString(row.title),
    notes: asString(row.notes),
    priority: oneOf<Priority>(row.priority, PRIORITIES, "media"),
    list: oneOf<TaskList>(row.list, LISTS, "Pessoal"),
    due: asDate(row.due_date),
    done: asBoolean(row.done),
    createdAt: asTimestamp(row.created_at),
    completedAt: row.completed_at ? asTimestamp(row.completed_at, row.created_at) : null,
  };
}

export function toShoppingRow(item: ShoppingItem, userId: string): ShoppingRow {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    category: item.category,
    done: item.done,
    created_at: item.createdAt,
  };
}

export function fromShoppingRow(row: ShoppingRow): ShoppingItem {
  return {
    id: row.id,
    name: asString(row.name),
    quantity: Math.max(0.01, asNumber(row.quantity, 1)),
    unit: oneOf<ShoppingUnit>(row.unit, UNITS, "un"),
    price: row.price === null || row.price === undefined ? null : Math.max(0, asNumber(row.price)),
    category: oneOf<ShoppingCategory>(row.category, CATEGORIES, "Outros"),
    done: asBoolean(row.done),
    createdAt: asTimestamp(row.created_at),
  };
}

export function toTransactionRow(transaction: Transaction, userId: string): TransactionRow {
  return {
    id: transaction.id,
    user_id: userId,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    created_at: transaction.createdAt,
  };
}

export function fromTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: asString(row.description),
    amount: Math.max(0, asNumber(row.amount)),
    type: oneOf<TransactionType>(row.type, ["receita", "despesa"], "despesa"),
    category: asString(row.category, "Outros"),
    date: asDate(row.date) ?? new Date().toISOString().slice(0, 10),
    createdAt: asTimestamp(row.created_at),
  };
}

export function toMediaRow(link: MediaLink, userId: string): MediaRow {
  return {
    id: link.id,
    user_id: userId,
    title: link.title,
    url: link.url,
    kind: link.kind,
    tags: link.tags,
    favorite: link.favorite,
    created_at: link.createdAt,
  };
}

export function fromMediaRow(row: MediaRow): MediaLink {
  return {
    id: row.id,
    title: asString(row.title),
    url: asString(row.url),
    kind: row.kind === "musica" ? "musica" : "video",
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 8)
      : [],
    favorite: asBoolean(row.favorite),
    createdAt: asTimestamp(row.created_at),
  };
}

export function toGoalRow(goal: Goal, userId: string): GoalRow {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    target_amount: goal.target,
    current_amount: goal.current,
    unit: goal.unit,
    deadline: goal.deadline,
    color: goal.color,
    created_at: goal.createdAt,
  };
}

export function fromGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: asString(row.title),
    target: Math.max(1, asNumber(row.target_amount, 100)),
    current: Math.max(0, asNumber(row.current_amount)),
    unit: asString(row.unit, "R$").trim() || "R$",
    deadline: asDate(row.deadline),
    color: asString(row.color, "#569cd6"),
    createdAt: asTimestamp(row.created_at),
  };
}

export function toNoteRow(note: Note, userId: string): NoteRow {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    body: note.body,
    color: note.color,
    pinned: note.pinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

export function fromNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    title: asString(row.title),
    body: asString(row.body),
    color: asString(row.color, "#dcdcaa"),
    pinned: asBoolean(row.pinned),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at, row.created_at),
  };
}

export function snapshotToDashboard(
  snapshot: RemoteSnapshot,
  fallbackName = "Você",
): DashboardData {
  const empty = createEmptyData({
    name: fallbackName,
    monthlyBudget: 0,
    demoBannerDismissed: true,
  });

  const tasks = snapshot.tasks.map(fromTaskRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shopping = snapshot.shopping
    .map(fromShoppingRow)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const transactions = snapshot.transactions
    .map(fromTransactionRow)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  const media = snapshot.media.map(fromMediaRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const goals = snapshot.goals.map(fromGoalRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notes = snapshot.notes.map(fromNoteRow).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return {
    ...empty,
    settings: snapshot.settings ? fromSettingsRow(snapshot.settings) : empty.settings,
    tasks,
    shopping,
    transactions,
    media,
    goals,
    notes,
  };
}

export function dashboardToRows(data: DashboardData, userId: string): DashboardRows {
  return {
    settings: toSettingsRow(data.settings, userId),
    tasks: data.tasks.map((task) => toTaskRow(task, userId)),
    shopping: data.shopping.map((item) => toShoppingRow(item, userId)),
    transactions: data.transactions.map((item) => toTransactionRow(item, userId)),
    media: data.media.map((item) => toMediaRow(item, userId)),
    goals: data.goals.map((goal) => toGoalRow(goal, userId)),
    notes: data.notes.map((note) => toNoteRow(note, userId)),
  };
}

export function countRecords(data: DashboardData): number {
  return (
    data.tasks.length +
    data.shopping.length +
    data.transactions.length +
    data.media.length +
    data.goals.length +
    data.notes.length
  );
}

export function hasDashboardContent(data: DashboardData): boolean {
  return countRecords(data) > 0;
}
