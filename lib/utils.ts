import type { Goal, Task, Transaction } from "./types";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return bytesToUuid(randomBytes(16));
}

function hash32(input: string, seed: number): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Converte IDs antigos (`seed-task-1`, `id-...`) em UUIDs determinísticos.
 * O Supabase usa `uuid` como chave primária; o mesmo ID antigo sempre gera o
 * mesmo UUID, então atualizações e exclusões continuam apontando para a linha certa.
 */
export function stableUuid(value: string): string {
  const trimmed = value.trim();
  if (UUID_PATTERN.test(trimmed)) return trimmed.toLowerCase();

  const first = hash32(trimmed, 0x9e3779b9).toString(16).padStart(8, "0");
  const second = hash32(trimmed, 0x85ebca6b).toString(16).padStart(8, "0");
  const third = hash32(trimmed, 0xc2b2ae35).toString(16).padStart(8, "0");
  const fourth = hash32(trimmed, 0x27d4eb2f).toString(16).padStart(8, "0");
  const variant = ((parseInt(fourth.slice(0, 2), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");

  return [
    first,
    second.slice(0, 4),
    `4${second.slice(4, 7)}`,
    `${variant}${third.slice(0, 2)}`,
    `${third.slice(2, 6)}${fourth.slice(2, 10)}`,
  ].join("-");
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return clamp((part / total) * 100, 0, 100);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isoDate(year: number, monthIndex: number, day: number): string {
  return toISODate(new Date(year, monthIndex, day));
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function monthKey(input: string | Date = new Date()): string {
  if (typeof input === "string") return input.slice(0, 7);
  return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

export function monthShort(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

export function getLastMonths(count: number): { key: string; label: string; date: Date }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = addMonths(now, -(count - 1 - index));
    return { key: monthKey(date), label: monthShort(date), date };
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatGoalValue(value: number, unit: string): string {
  if (unit === "R$") return formatCurrency(value);
  return `${formatNumber(value)} ${unit}`.trim();
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(parseISODate(iso))
    .replace(".", "");
}

export function formatDateLong(iso: string = todayISO()): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISODate(iso));
  return capitalize(formatted);
}

export function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseISODate(iso));
}

export function daysFromToday(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const target = Date.UTC(year, (month ?? 1) - 1, day ?? 1);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86_400_000);
}

export type DueMeta = {
  label: string;
  tone: "overdue" | "today" | "soon" | "future";
  days: number;
};

export function getDueMeta(iso: string | null): DueMeta | null {
  if (!iso) return null;
  const days = daysFromToday(iso);
  if (days < 0) {
    return {
      label: days === -1 ? "Atrasada 1 dia" : `Atrasada ${Math.abs(days)} dias`,
      tone: "overdue",
      days,
    };
  }
  if (days === 0) return { label: "Hoje", tone: "today", days };
  if (days === 1) return { label: "Amanhã", tone: "soon", days };
  if (days <= 7) return { label: `Em ${days} dias`, tone: "soon", days };
  return { label: formatDateShort(iso), tone: "future", days };
}

export function isOverdue(iso: string | null): boolean {
  return Boolean(iso && daysFromToday(iso) < 0);
}

export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "");
}

export function formatDayLabel(iso: string): string {
  const days = daysFromToday(iso);
  if (days === 0) return "Hoje";
  if (days === -1) return "Ontem";
  return formatDateShort(iso);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function parseAmount(input: string): number {
  const clean = input.replace(/R\$\s?/gi, "").replace(/\s/g, "").trim();
  if (!clean) return 0;
  let normalized = clean;
  if (clean.includes(",")) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    normalized = clean.replace(/\./g, "");
  }
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function formatAmountInput(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (host.endsWith("youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      const match = parsed.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

export function getMediaThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done && b.done) {
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    }
    if (a.due && b.due && a.due !== b.due) return a.due.localeCompare(b.due);
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    return a.priority.localeCompare(b.priority);
  });
}

export function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const aDone = a.current >= a.target;
    const bDone = b.current >= b.target;
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function isDoneToday(task: Task): boolean {
  if (!task.done || !task.completedAt) return false;
  return task.completedAt.slice(0, 10) === todayISO();
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
