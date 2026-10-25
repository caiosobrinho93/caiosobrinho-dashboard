import { normalizeDashboardData } from "@/lib/normalize";
import type { DashboardData } from "@/lib/types";

export const GUEST_STORAGE_KEY = "dashboard-pessoal.v1";
const CLOUD_CACHE_PREFIX = "dashboard-pessoal.cloud.v1.";
const CLOUD_META_PREFIX = "dashboard-pessoal.cloud.meta.v1.";

export type CloudMeta = {
  initializedAt: string;
  lastSyncedAt: string | null;
};

export function cloudCacheKey(userId: string): string {
  return `${CLOUD_CACHE_PREFIX}${userId}`;
}

function cloudMetaKey(userId: string): string {
  return `${CLOUD_META_PREFIX}${userId}`;
}

export function readGuestData(): DashboardData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    return normalizeDashboardData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeGuestData(data: DashboardData): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function readCloudCache(userId: string): DashboardData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cloudCacheKey(userId));
    if (!raw) return null;
    return normalizeDashboardData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeCloudCache(userId: string, data: DashboardData): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(cloudCacheKey(userId), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function removeCloudCache(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(cloudCacheKey(userId));
  } catch {
    // A limpeza é melhor esforço; a sessão já foi encerrada.
  }
}

export function readCloudMeta(userId: string): CloudMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cloudMetaKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.initializedAt !== "string") return null;
    return {
      initializedAt: record.initializedAt,
      lastSyncedAt:
        typeof record.lastSyncedAt === "string" && record.lastSyncedAt
          ? record.lastSyncedAt
          : null,
    };
  } catch {
    return null;
  }
}

export function writeCloudMeta(userId: string, meta: CloudMeta): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(cloudMetaKey(userId), JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}
