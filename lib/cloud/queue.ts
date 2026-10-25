import type { CloudTable } from "@/lib/supabase/rows";
import { uid } from "@/lib/utils";

const QUEUE_PREFIX = "dashboard-pessoal.cloud.queue.v1.";

export type MutationOp = "upsert" | "delete";

export type CloudMutation = {
  id: string;
  table: CloudTable;
  op: MutationOp;
  rowId: string;
  payload?: unknown;
  createdAt: string;
};

export type MutationSeed = Omit<CloudMutation, "id" | "createdAt">;

export function queueStorageKey(userId: string): string {
  return `${QUEUE_PREFIX}${userId}`;
}

function isMutation(value: unknown): value is CloudMutation {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.table === "string" &&
    (record.op === "upsert" || record.op === "delete") &&
    typeof record.rowId === "string" &&
    typeof record.createdAt === "string"
  );
}

export function readQueue(userId: string): CloudMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(queueStorageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMutation);
  } catch {
    return [];
  }
}

export function writeQueue(userId: string, queue: CloudMutation[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(queueStorageKey(userId));
    } else {
      window.localStorage.setItem(queueStorageKey(userId), JSON.stringify(queue));
    }
    return true;
  } catch {
    return false;
  }
}

export function removeQueue(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(queueStorageKey(userId));
  } catch {
    // Melhor esforço: o logout não pode falhar por causa do cache.
  }
}

/**
 * Uma linha só precisa da última intenção pendente. Ao atualizar a mesma
 * tarefa duas vezes, a versão antiga sai da fila e a nova é anexada ao final,
 * preservando a ordem entre operações de linhas diferentes.
 */
export function appendMutation(
  queue: CloudMutation[],
  seed: MutationSeed,
  now = new Date().toISOString(),
): CloudMutation[] {
  const withoutSameRow = queue.filter(
    (mutation) => !(mutation.table === seed.table && mutation.rowId === seed.rowId),
  );
  return [
    ...withoutSameRow,
    {
      ...seed,
      id: uid(),
      createdAt: now,
    },
  ];
}
