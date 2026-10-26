import { fetchUserRows } from "./paginated-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudMutation } from "@/lib/cloud/queue";
import type { DashboardData, Settings } from "@/lib/types";
import {
  dashboardToRows,
  snapshotToDashboard,
  TABLE_TO_REMOTE,
  toGoalRow,
  toMediaRow,
  toNoteRow,
  toSettingsRow,
  toShoppingRow,
  toTaskRow,
  toTransactionRow,
  type GoalRow,
  type MediaRow,
  type NoteRow,
  type RemoteSnapshot,
  type SettingsRow,
  type ShoppingRow,
  type TaskRow,
  type TransactionRow,
} from "./rows";

type SupabaseErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as SupabaseErrorLike;
    if (typeof record.message === "string") return record.message;
  }
  return "";
}

function throwIfError(error: unknown): void {
  if (error) throw error;
}

async function runRequests(requests: Array<PromiseLike<unknown>>): Promise<void> {
  const results = await Promise.all(requests);
  for (const result of results) {
    const error =
      result && typeof result === "object" && "error" in result
        ? (result as { error?: unknown }).error
        : null;
    throwIfError(error);
  }
}

export async function fetchRemoteDashboard(
  client: SupabaseClient,
  userId: string,
  fallbackName = "Você",
): Promise<DashboardData> {
  const [settings, tasks, shopping, transactions, media, goals, notes] = await Promise.all([
    client.from("dashboard_settings").select("*").eq("user_id", userId).maybeSingle(),
    fetchUserRows(client, "tasks", userId),
    fetchUserRows(client, "shopping_items", userId),
    fetchUserRows(client, "transactions", userId),
    fetchUserRows(client, "media_links", userId),
    fetchUserRows(client, "goals", userId),
    fetchUserRows(client, "notes", userId),
  ]);

  throwIfError(settings.error);

  const snapshot: RemoteSnapshot = {
    settings: (settings.data as SettingsRow | null) ?? null,
    tasks: (tasks as TaskRow[] | null) ?? [],
    shopping: (shopping as ShoppingRow[] | null) ?? [],
    transactions: (transactions as TransactionRow[] | null) ?? [],
    media: (media as MediaRow[] | null) ?? [],
    goals: (goals as GoalRow[] | null) ?? [],
    notes: (notes as NoteRow[] | null) ?? [],
  };

  return snapshotToDashboard(snapshot, fallbackName);
}

export async function importRemoteDashboard(
  client: SupabaseClient,
  userId: string,
  data: DashboardData,
): Promise<void> {
  const rows = dashboardToRows(data, userId);

  const requests: Array<PromiseLike<unknown>> = [
    client
      .from(TABLE_TO_REMOTE.settings)
      .upsert(rows.settings, { onConflict: "user_id" }),
  ];

  if (rows.tasks.length > 0) {
    requests.push(client.from(TABLE_TO_REMOTE.tasks).upsert(rows.tasks, { onConflict: "id" }));
  }
  if (rows.shopping.length > 0) {
    requests.push(
      client.from(TABLE_TO_REMOTE.shopping).upsert(rows.shopping, { onConflict: "id" }),
    );
  }
  if (rows.transactions.length > 0) {
    requests.push(
      client.from(TABLE_TO_REMOTE.transactions).upsert(rows.transactions, { onConflict: "id" }),
    );
  }
  if (rows.media.length > 0) {
    requests.push(client.from(TABLE_TO_REMOTE.media).upsert(rows.media, { onConflict: "id" }));
  }
  if (rows.goals.length > 0) {
    requests.push(client.from(TABLE_TO_REMOTE.goals).upsert(rows.goals, { onConflict: "id" }));
  }
  if (rows.notes.length > 0) {
    requests.push(client.from(TABLE_TO_REMOTE.notes).upsert(rows.notes, { onConflict: "id" }));
  }

  await runRequests(requests);
}

export async function saveRemoteSettings(
  client: SupabaseClient,
  userId: string,
  settings: Settings,
): Promise<void> {
  const { error } = await client
    .from(TABLE_TO_REMOTE.settings)
    .upsert(toSettingsRow(settings, userId), { onConflict: "user_id" });
  throwIfError(error);
}

export async function applyMutation(
  client: SupabaseClient,
  mutation: CloudMutation,
  userId: string,
): Promise<void> {
  const table = TABLE_TO_REMOTE[mutation.table];

  if (mutation.op === "delete") {
    if (mutation.table === "settings") {
      const { error } = await client.from(table).delete().eq("user_id", userId);
      throwIfError(error);
      return;
    }

    const { error } = await client
      .from(table)
      .delete()
      .eq("id", mutation.rowId)
      .eq("user_id", userId);
    throwIfError(error);
    return;
  }

  if (!mutation.payload || typeof mutation.payload !== "object") {
    throw new Error("Registro pendente sem conteúdo para sincronizar.");
  }

  let row: unknown;
  switch (mutation.table) {
    case "settings":
      row = toSettingsRow(mutation.payload as Settings, userId);
      break;
    case "tasks":
      row = toTaskRow(mutation.payload as Parameters<typeof toTaskRow>[0], userId);
      break;
    case "shopping":
      row = toShoppingRow(mutation.payload as Parameters<typeof toShoppingRow>[0], userId);
      break;
    case "transactions":
      row = toTransactionRow(
        mutation.payload as Parameters<typeof toTransactionRow>[0],
        userId,
      );
      break;
    case "media":
      row = toMediaRow(mutation.payload as Parameters<typeof toMediaRow>[0], userId);
      break;
    case "goals":
      row = toGoalRow(mutation.payload as Parameters<typeof toGoalRow>[0], userId);
      break;
    case "notes":
      row = toNoteRow(mutation.payload as Parameters<typeof toNoteRow>[0], userId);
      break;
  }

  const { error } = await client
    .from(table)
    .upsert(row as Record<string, unknown>, {
      onConflict: mutation.table === "settings" ? "user_id" : "id",
    });
  throwIfError(error);
}

export function describeRemoteError(error: unknown): string {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("network error") ||
    normalized.includes("load failed") ||
    normalized.includes("fetch")
  ) {
    return "Sem conexão com a nuvem. As alterações continuam salvas neste dispositivo.";
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("session") ||
    normalized.includes("token") ||
    normalized.includes("not authenticated")
  ) {
    return "Sua sessão expirou. Entre novamente para continuar sincronizando.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("not authorized")
  ) {
    return "O servidor não autorizou esta alteração. Confira se a conta ainda está ativa.";
  }

  if (normalized.includes("check constraint") || normalized.includes("violates check")) {
    return "O servidor recusou um valor inválido. Revise o registro e tente novamente.";
  }

  if (normalized.includes("duplicate key") || normalized.includes("already exists")) {
    return "Já existe um registro com este identificador na nuvem.";
  }

  if (normalized.includes("invalid input syntax for type uuid")) {
    return "Um registro antigo não pôde ser sincronizado. Exporte um backup e entre em contato.";
  }

  if (!message) {
    return "Não foi possível sincronizar com a nuvem. Tente novamente.";
  }

  return `Não foi possível sincronizar: ${message}`;
}
