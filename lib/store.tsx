"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import {
  appendMutation,
  readQueue,
  removeQueue,
  writeQueue,
  type CloudMutation,
  type MutationSeed,
} from "@/lib/cloud/queue";
import {
  cloudCacheKey,
  GUEST_STORAGE_KEY,
  readCloudCache,
  readCloudMeta,
  readGuestData,
  removeCloudCache,
  writeCloudCache,
  writeCloudMeta,
  writeGuestData,
} from "@/lib/cloud/storage";
import { normalizeDashboardData } from "@/lib/normalize";
import { createEmptyData, createSeedData } from "@/lib/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  applyMutation,
  describeRemoteError,
  fetchRemoteDashboard,
  importRemoteDashboard,
  saveRemoteSettings,
} from "@/lib/supabase/remote";
import {
  countRecords,
  hasDashboardContent,
  type CloudTable,
} from "@/lib/supabase/rows";
import type {
  DashboardData,
  GoalDraft,
  MediaDraft,
  NoteDraft,
  Settings,
  ShoppingItemDraft,
  TaskDraft,
  TransactionDraft,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export type SyncState = "local" | "connecting" | "syncing" | "synced" | "offline" | "error";
export type CloudPhase = "guest" | "connecting" | "choice" | "ready" | "error";
export type CloudActionResult = { ok: boolean; message: string };
export type CloudChoiceKind = "empty-local" | "both";
export type CloudChoiceInfo = {
  kind: CloudChoiceKind;
  localRecords: number;
  remoteRecords: number;
};

type CloudChoice = {
  kind: CloudChoiceKind;
  local: DashboardData;
  remote: DashboardData;
};

type StoreValue = {
  data: DashboardData;
  hydrated: boolean;
  saveError: boolean;
  online: boolean;
  cloudConfigured: boolean;
  cloudPhase: CloudPhase;
  cloudChoice: CloudChoiceInfo | null;
  cloudError: string | null;
  syncState: SyncState;
  syncError: string | null;
  pendingCount: number;
  lastSyncedAt: string | null;
  addTask: (draft: TaskDraft) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addShoppingItem: (draft: ShoppingItemDraft) => void;
  updateShoppingItem: (id: string, draft: ShoppingItemDraft) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  clearCompletedShopping: () => void;
  addTransaction: (draft: TransactionDraft) => void;
  updateTransaction: (id: string, draft: TransactionDraft) => void;
  deleteTransaction: (id: string) => void;
  addMedia: (draft: MediaDraft) => void;
  updateMedia: (id: string, draft: MediaDraft) => void;
  toggleMediaFavorite: (id: string) => void;
  deleteMedia: (id: string) => void;
  addGoal: (draft: GoalDraft) => void;
  updateGoal: (id: string, draft: GoalDraft) => void;
  contributeGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  addNote: (draft: NoteDraft) => void;
  updateNote: (id: string, draft: NoteDraft) => void;
  toggleNotePinned: (id: string) => void;
  deleteNote: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  dismissDemoBanner: () => void;
  clearAll: () => void;
  loadDemo: () => void;
  importData: (payload: unknown) => boolean;
  syncNow: () => Promise<CloudActionResult>;
  retryCloud: () => void;
  resolveCloudChoice: (mode: "device" | "cloud") => Promise<CloudActionResult>;
  importGuestDataToCloud: () => Promise<CloudActionResult>;
  signOut: () => Promise<CloudActionResult>;
};

const StoreContext = createContext<StoreValue | null>(null);

const now = () => new Date().toISOString();

const ENTITY_TABLES: CloudTable[] = [
  "tasks",
  "shopping",
  "transactions",
  "media",
  "goals",
  "notes",
];

function displayNameForUser(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";
  if (fullName) return fullName;
  return user.email?.split("@")[0]?.trim() || "Você";
}

function entityDiff<T extends { id: string }>(
  table: CloudTable,
  previous: T[],
  next: T[],
): MutationSeed[] {
  const nextIds = new Set(next.map((item) => item.id));
  const seeds: MutationSeed[] = [];

  for (const item of previous) {
    if (!nextIds.has(item.id)) {
      seeds.push({ table, op: "delete", rowId: item.id });
    }
  }
  for (const item of next) {
    seeds.push({ table, op: "upsert", rowId: item.id, payload: item });
  }

  return seeds;
}

function diffSeeds(previous: DashboardData, next: DashboardData): MutationSeed[] {
  return [
    { table: "settings", op: "upsert", rowId: "settings", payload: next.settings },
    ...entityDiff("tasks", previous.tasks, next.tasks),
    ...entityDiff("shopping", previous.shopping, next.shopping),
    ...entityDiff("transactions", previous.transactions, next.transactions),
    ...entityDiff("media", previous.media, next.media),
    ...entityDiff("goals", previous.goals, next.goals),
    ...entityDiff("notes", previous.notes, next.notes),
  ];
}

function fallbackGuestData(): DashboardData {
  return (
    normalizeDashboardData(createSeedData()) ??
    normalizeDashboardData(createEmptyData()) ??
    createEmptyData()
  );
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const {
    configured: cloudConfigured,
    loading: authLoading,
    user,
    signOut: authSignOut,
  } = useAuth();
  const authUserId = user?.id ?? null;

  const [data, setData] = useState<DashboardData>(() => createEmptyData());
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [online, setOnline] = useState(true);
  const [cloudPhase, setCloudPhase] = useState<CloudPhase>("guest");
  const [cloudChoice, setCloudChoice] = useState<CloudChoiceInfo | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [cloudAttempt, setCloudAttempt] = useState(0);

  const dataRef = useRef(data);
  const guestDataRef = useRef<DashboardData | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const queueRef = useRef<CloudMutation[]>([]);
  const queueActiveRef = useRef(false);
  const cloudChoiceRef = useRef<CloudChoice | null>(null);
  const fallbackNameRef = useRef("Você");
  const localRevisionRef = useRef(0);
  const runIdRef = useRef(0);
  const flushingRef = useRef(false);
  const syncNowRef = useRef<() => Promise<CloudActionResult>>(async () => ({
    ok: false,
    message: "Sincronização indisponível.",
  }));

  const applyChoiceState = useCallback((choice: CloudChoice | null) => {
    cloudChoiceRef.current = choice;
    setCloudChoice(
      choice
        ? {
            kind: choice.kind,
            localRecords: countRecords(choice.local),
            remoteRecords: countRecords(choice.remote),
          }
        : null,
    );
  }, []);

  const replaceRemoteData = useCallback((next: DashboardData, userId: string) => {
    dataRef.current = next;
    setData(next);
    if (!writeCloudCache(userId, next)) setSaveError(true);
    const stamp = new Date().toISOString();
    const meta = readCloudMeta(userId);
    if (!writeCloudMeta(userId, {
      initializedAt: meta?.initializedAt ?? stamp,
      lastSyncedAt: stamp,
    })) {
      setSaveError(true);
    }
    setLastSyncedAt(stamp);
  }, []);

  const applyCloudReady = useCallback(
    (next: DashboardData, userId: string) => {
      replaceRemoteData(next, userId);
      setStorageKey(cloudCacheKey(userId));
      queueActiveRef.current = true;
      setCloudPhase("ready");
      applyChoiceState(null);
      setCloudError(null);
      setSyncError(null);
      setSyncState(navigator.onLine ? "synced" : "offline");
    },
    [applyChoiceState, replaceRemoteData],
  );

  const enqueueMutations = useCallback(
    (seeds: MutationSeed[]) => {
      const userId = activeUserIdRef.current;
      const client = getSupabaseClient();
      if (!userId || !client || !queueActiveRef.current || seeds.length === 0) return;

      let nextQueue = queueRef.current;
      for (const seed of seeds) {
        nextQueue = appendMutation(nextQueue, seed);
      }

      queueRef.current = nextQueue;
      if (!writeQueue(userId, nextQueue)) setSaveError(true);
      setPendingCount(nextQueue.length);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSyncState("offline");
        return;
      }

      setSyncState("syncing");
      void flushQueueRef.current();
    },
    [],
  );

  const flushQueueRef = useRef<() => Promise<CloudActionResult>>(async () => ({
    ok: false,
    message: "Sincronização indisponível.",
  }));

  const flushQueue = useCallback(async (): Promise<CloudActionResult> => {
    const userId = activeUserIdRef.current;
    const client = getSupabaseClient();

    if (!userId || !client) {
      return { ok: false, message: "Entre na sua conta para sincronizar." };
    }
    if (!queueActiveRef.current) {
      return { ok: false, message: "A nuvem ainda está carregando. Tente novamente em instantes." };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncState("offline");
      return {
        ok: false,
        message: "Você está offline. As alterações ficarão na fila até a conexão voltar.",
      };
    }
    if (queueRef.current.length === 0) {
      setSyncState("synced");
      return { ok: true, message: "Tudo sincronizado." };
    }
    if (flushingRef.current) {
      return { ok: false, message: "Uma sincronização já está em andamento. Aguarde um instante." };
    }

    const runId = runIdRef.current;
    flushingRef.current = true;
    setSyncState("syncing");
    setSyncError(null);

    try {
      while (queueRef.current.length > 0) {
        if (runIdRef.current !== runId || activeUserIdRef.current !== userId) {
          return { ok: false, message: "A conta mudou durante a sincronização." };
        }

        const mutation = queueRef.current[0];
        try {
          await applyMutation(client, mutation, userId);
        } catch (error) {
          const message = describeRemoteError(error);
          setSyncError(message);
          setSyncState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
          return { ok: false, message };
        }

        if (runIdRef.current !== runId || activeUserIdRef.current !== userId) {
          return { ok: false, message: "A conta mudou durante a sincronização." };
        }

        queueRef.current = queueRef.current.filter((item) => item.id !== mutation.id);
        if (!writeQueue(userId, queueRef.current)) setSaveError(true);
        setPendingCount(queueRef.current.length);
      }

      const stamp = new Date().toISOString();
      const meta = readCloudMeta(userId);
      if (
        !writeCloudMeta(userId, {
          initializedAt: meta?.initializedAt ?? stamp,
          lastSyncedAt: stamp,
        })
      ) {
        setSaveError(true);
      }
      setLastSyncedAt(stamp);
      setSyncError(null);
      setSyncState("synced");
      return { ok: true, message: "Tudo sincronizado." };
    } finally {
      flushingRef.current = false;
    }
  }, []);

  flushQueueRef.current = flushQueue;

  const refreshFromCloud = useCallback(
    async (options: { silent?: boolean } = {}): Promise<CloudActionResult> => {
      const userId = activeUserIdRef.current;
      const client = getSupabaseClient();

      if (!userId || !client) {
        return { ok: false, message: "Entre na sua conta para acessar a nuvem." };
      }
      if (!queueActiveRef.current) {
        return { ok: false, message: "A nuvem ainda está carregando." };
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSyncState("offline");
        return {
          ok: false,
          message: "Você está offline. Os dados deste dispositivo continuam disponíveis.",
        };
      }

      if (queueRef.current.length > 0) {
        const flushed = await flushQueue();
        if (!flushed.ok) return flushed;
      }

      const runId = runIdRef.current;
      const revision = localRevisionRef.current;
      setSyncState("syncing");

      try {
        const remote = await fetchRemoteDashboard(client, userId, fallbackNameRef.current);
        if (runIdRef.current !== runId || activeUserIdRef.current !== userId) {
          return { ok: false, message: "A conta mudou durante a sincronização." };
        }

        if (localRevisionRef.current !== revision || queueRef.current.length > 0) {
          setSyncState(
            !navigator.onLine
              ? "offline"
              : queueRef.current.length > 0
                ? "syncing"
                : "synced",
          );
          return { ok: true, message: "Alterações locais preservadas." };
        }

        replaceRemoteData(remote, userId);
        setSyncError(null);
        setSyncState("synced");
        return { ok: true, message: "Dados atualizados." };
      } catch (error) {
        const message = describeRemoteError(error);
        setSyncError(message);
        setSyncState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        if (!options.silent) return { ok: false, message };
        return { ok: false, message };
      }
    },
    [flushQueue, replaceRemoteData],
  );

  const syncNow = useCallback(async (): Promise<CloudActionResult> => {
    const userId = activeUserIdRef.current;
    if (!userId) return { ok: false, message: "Entre na sua conta para sincronizar." };
    if (!queueActiveRef.current) {
      return { ok: false, message: "A nuvem ainda está carregando. Tente novamente em instantes." };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncState("offline");
      return {
        ok: false,
        message: "Você está offline. As alterações ficarão na fila até a conexão voltar.",
      };
    }

    const flushed = await flushQueue();
    if (!flushed.ok) return flushed;

    return refreshFromCloud();
  }, [flushQueue, refreshFromCloud]);

  syncNowRef.current = syncNow;

  useEffect(() => {
    fallbackNameRef.current = user ? displayNameForUser(user) : "Você";
  }, [user]);

  // Hidrata o modo local uma única vez. O Supabase pode restaurar a sessão
  // depois; nesse caso o efeito de conta troca a fonte de dados.
  useEffect(() => {
    let next: DashboardData;
    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
      next = raw
        ? normalizeDashboardData(JSON.parse(raw)) ?? fallbackGuestData()
        : fallbackGuestData();
    } catch {
      next = fallbackGuestData();
    }

    guestDataRef.current = next;
    dataRef.current = next;
    setData(next);
    setStorageKey(GUEST_STORAGE_KEY);
    setHydrated(true);
    setOnline(navigator.onLine);
  }, []);

  // O cache acompanha cada alteração, mas a fila é a fonte de verdade para o
  // que ainda não chegou ao servidor.
  useEffect(() => {
    if (!hydrated || !storageKey) return;

    if (storageKey === GUEST_STORAGE_KEY) {
      guestDataRef.current = data;
      if (!writeGuestData(data)) {
        setSaveError(true);
        return;
      }
      setSaveError(false);
      return;
    }

    const userId = activeUserIdRef.current;
    if (userId && storageKey === cloudCacheKey(userId)) {
      if (!writeCloudCache(userId, data)) {
        setSaveError(true);
        return;
      }
      setSaveError(false);
    }
  }, [data, hydrated, storageKey]);

  useEffect(() => {
    document.documentElement.dataset.accent = data.settings.accent;
    document.documentElement.style.colorScheme = "dark";
  }, [data.settings.accent]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      if (activeUserIdRef.current && queueActiveRef.current) {
        void syncNowRef.current();
      }
    };
    const handleOffline = () => {
      setOnline(false);
      if (activeUserIdRef.current) setSyncState("offline");
    };

    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!authUserId || pendingCount === 0 || !online) return;
    const interval = window.setInterval(() => {
      void flushQueueRef.current();
    }, 20_000);
    return () => window.clearInterval(interval);
  }, [authUserId, pendingCount, online]);

  useEffect(() => {
    if (!authUserId) return;

    let lastRefresh = 0;
    const maybeRefresh = () => {
      if (document.visibilityState !== "visible") return;
      if (!queueActiveRef.current) return;
      const timestamp = Date.now();
      if (timestamp - lastRefresh < 20_000) return;
      lastRefresh = timestamp;
      void syncNowRef.current();
    };

    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", maybeRefresh);
    return () => {
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", maybeRefresh);
    };
  }, [authUserId]);

  // Carrega a conta, decide a primeira importação e mantém a fila em dia.
  useEffect(() => {
    if (!hydrated || authLoading) return;

    const userId = authUserId;
    const previousUserId = previousUserIdRef.current;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    if (previousUserId && previousUserId !== userId) {
      removeCloudCache(previousUserId);
    }
    previousUserIdRef.current = userId;

    if (!userId) {
      activeUserIdRef.current = null;
      queueActiveRef.current = false;
      queueRef.current = [];
      const guest = readGuestData() ?? guestDataRef.current ?? fallbackGuestData();
      guestDataRef.current = guest;
      dataRef.current = guest;
      setData(guest);
      setStorageKey(GUEST_STORAGE_KEY);
      setCloudPhase("guest");
      applyChoiceState(null);
      setCloudError(null);
      setSyncState("local");
      setSyncError(null);
      setPendingCount(0);
      setLastSyncedAt(null);
      return;
    }

    const client = getSupabaseClient();
    activeUserIdRef.current = userId;
    queueActiveRef.current = false;
    setStorageKey(null);
    setCloudPhase("connecting");
    applyChoiceState(null);
    setCloudError(null);
    setSyncState("connecting");
    setSyncError(null);

    if (!client) {
      setCloudPhase("error");
      setCloudError(
        "A conta está conectada, mas o Supabase não está configurado. Preencha a URL e a chave pública para sincronizar.",
      );
      setSyncState("error");
      return;
    }

    const meta = readCloudMeta(userId);
    const cache = readCloudCache(userId);
    const queue = readQueue(userId);
    queueRef.current = queue;
    setPendingCount(queue.length);

    let cacheDisplayed = false;
    if (cache) {
      cacheDisplayed = true;
      dataRef.current = cache;
      setData(cache);
      setStorageKey(cloudCacheKey(userId));
      queueActiveRef.current = true;
      setCloudPhase("ready");
      setLastSyncedAt(meta?.lastSyncedAt ?? null);
      setSyncState(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "offline"
          : queue.length > 0
            ? "syncing"
            : "synced",
      );
    }

    void (async () => {
      try {
        if (!meta) {
          const remote = await fetchRemoteDashboard(client, userId, fallbackNameRef.current);
          if (runIdRef.current !== runId) return;

          const local = guestDataRef.current ?? fallbackGuestData();
          const remoteHasContent = hasDashboardContent(remote);
          const localHasContent = hasDashboardContent(local);

          if (remoteHasContent && localHasContent) {
            setStorageKey(null);
            queueActiveRef.current = false;
            applyChoiceState({ kind: "both", local, remote });
            setCloudPhase("choice");
            setSyncState("connecting");
            return;
          }

          if (!remoteHasContent && localHasContent) {
            setStorageKey(null);
            queueActiveRef.current = false;
            applyChoiceState({ kind: "empty-local", local, remote });
            setCloudPhase("choice");
            setSyncState("connecting");
            return;
          }

          if (!remoteHasContent) {
            await saveRemoteSettings(client, userId, remote.settings);
            if (runIdRef.current !== runId) return;
          }

          applyCloudReady(remote, userId);
          return;
        }

        if (!cache) {
          queueActiveRef.current = true;
          if (queueRef.current.length > 0) {
            const flushed = await flushQueue();
            if (runIdRef.current !== runId) return;
            if (!flushed.ok) {
              setCloudPhase("error");
              setCloudError(flushed.message);
              setSyncState("error");
              return;
            }
          }

          const remote = await fetchRemoteDashboard(client, userId, fallbackNameRef.current);
          if (runIdRef.current !== runId) return;
          applyCloudReady(remote, userId);
          return;
        }

        // Cache já visível: mantém a interface utilizável e sincroniza em
        // segundo plano. Se falhar, o cache continua sendo a fonte local.
        const flushed = await flushQueue();
        if (runIdRef.current !== runId) return;
        if (!flushed.ok && queueRef.current.length > 0) {
          if (flushed.message) setSyncError(flushed.message);
          setSyncState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
          return;
        }

        await refreshFromCloud({ silent: true });
        if (runIdRef.current !== runId) return;
        if (queueRef.current.length > 0) {
          setSyncState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        }
      } catch (error) {
        if (runIdRef.current !== runId) return;
        const message = describeRemoteError(error);
        setCloudError(message);
        setSyncError(message);
        if (cacheDisplayed) {
          setCloudPhase("ready");
          setSyncState(
            typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
          );
        } else {
          setCloudPhase("error");
          setSyncState("error");
        }
      }
    })();
  }, [
    authLoading,
    authUserId,
    cloudAttempt,
    flushQueue,
    hydrated,
    applyChoiceState,
    applyCloudReady,
    refreshFromCloud,
  ]);

  const retryCloud = useCallback(() => {
    setCloudAttempt((attempt) => attempt + 1);
  }, []);

  const resolveCloudChoice = useCallback(
    async (mode: "device" | "cloud"): Promise<CloudActionResult> => {
      const choice = cloudChoiceRef.current;
      const userId = activeUserIdRef.current;
      const client = getSupabaseClient();

      if (!choice || !userId || !client) {
        return { ok: false, message: "Não há uma escolha de nuvem pendente." };
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSyncState("offline");
        return { ok: false, message: "Você está offline. Conecte-se para concluir a configuração." };
      }

      setCloudPhase("connecting");
      setCloudError(null);
      setSyncError(null);
      setSyncState("syncing");

      try {
        if (mode === "cloud") {
          if (countRecords(choice.remote) === 0) {
            await saveRemoteSettings(client, userId, choice.remote.settings);
          }
          applyCloudReady(choice.remote, userId);
          return { ok: true, message: "Dados da nuvem carregados." };
        }

        await importRemoteDashboard(client, userId, choice.local);
        const remote = await fetchRemoteDashboard(client, userId, fallbackNameRef.current);
        if (activeUserIdRef.current !== userId) {
          return { ok: false, message: "A conta mudou durante a importação." };
        }
        applyCloudReady(remote, userId);
        return {
          ok: true,
          message: `${countRecords(choice.local)} registro(s) deste dispositivo foram enviados para a nuvem.`,
        };
      } catch (error) {
        const message = describeRemoteError(error);
        setCloudPhase("choice");
        setCloudError(message);
        setSyncError(message);
        setSyncState("error");
        return { ok: false, message };
      }
    },
    [applyCloudReady],
  );

  const importGuestDataToCloud = useCallback(async (): Promise<CloudActionResult> => {
    const userId = activeUserIdRef.current;
    const client = getSupabaseClient();
    if (!userId || !client) {
      return { ok: false, message: "Entre na sua conta para importar os dados locais." };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncState("offline");
      return { ok: false, message: "Você está offline. Conecte-se para importar os dados locais." };
    }

    const guest = readGuestData();
    if (!guest || countRecords(guest) === 0) {
      return { ok: false, message: "Não há registros locais para importar." };
    }

    if (queueRef.current.length > 0) {
      const flushed = await flushQueue();
      if (!flushed.ok) return flushed;
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      await importRemoteDashboard(client, userId, guest);
      const remote = await fetchRemoteDashboard(client, userId, fallbackNameRef.current);
      if (activeUserIdRef.current !== userId) {
        return { ok: false, message: "A conta mudou durante a importação." };
      }
      replaceRemoteData(remote, userId);
      setSyncState("synced");
      return {
        ok: true,
        message: `${countRecords(guest)} registro(s) locais foram mesclados na nuvem.`,
      };
    } catch (error) {
      const message = describeRemoteError(error);
      setSyncError(message);
      setSyncState("error");
      return { ok: false, message };
    }
  }, [flushQueue, replaceRemoteData]);

  const signOut = useCallback(async (): Promise<CloudActionResult> => {
    const userId = activeUserIdRef.current;
    const result = await authSignOut();
    if (result.ok) {
      if (userId) {
        removeCloudCache(userId);
        removeQueue(userId);
      }
      queueRef.current = [];
      setPendingCount(0);
    }
    return result;
  }, [authSignOut]);

  const commit = useCallback(
    (
      recipe: (current: DashboardData) => DashboardData,
      collect?: (previous: DashboardData, next: DashboardData) => MutationSeed[],
    ) => {
      const previous = dataRef.current;
      const next = recipe(previous);
      dataRef.current = next;
      localRevisionRef.current += 1;
      setData(next);

      if (collect) {
        const seeds = collect(previous, next);
        if (seeds.length > 0) enqueueMutations(seeds);
      }
    },
    [enqueueMutations],
  );

  const replaceDataWithSync = useCallback(
    (next: DashboardData) => {
      const previous = dataRef.current;
      dataRef.current = next;
      localRevisionRef.current += 1;
      setData(next);
      const seeds = diffSeeds(previous, next);
      if (seeds.length > 0) enqueueMutations(seeds);
    },
    [enqueueMutations],
  );

  const value = useMemo<StoreValue>(() => {
    const settingsSeed = (next: DashboardData): MutationSeed[] => [
      { table: "settings", op: "upsert", rowId: "settings", payload: next.settings },
    ];

    return {
      data,
      hydrated,
      saveError,
      online,
      cloudConfigured,
      cloudPhase,
      cloudChoice,
      cloudError,
      syncState,
      syncError,
      pendingCount,
      lastSyncedAt,
      addTask: (draft) => {
        const task = {
          ...draft,
          id: uid(),
          done: false,
          createdAt: now(),
          completedAt: null,
        };
        commit(
          (current) => ({ ...current, tasks: [task, ...current.tasks] }),
          () => [{ table: "tasks", op: "upsert", rowId: task.id, payload: task }],
        );
      },
      updateTask: (id, draft) =>
        commit(
          (current) => ({
            ...current,
            tasks: current.tasks.map((task) => (task.id === id ? { ...task, ...draft } : task)),
          }),
          (_previous, next) => {
            const task = next.tasks.find((item) => item.id === id);
            return task ? [{ table: "tasks", op: "upsert", rowId: id, payload: task }] : [];
          },
        ),
      toggleTask: (id) =>
        commit(
          (current) => ({
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === id
                ? { ...task, done: !task.done, completedAt: task.done ? null : now() }
                : task,
            ),
          }),
          (_previous, next) => {
            const task = next.tasks.find((item) => item.id === id);
            return task ? [{ table: "tasks", op: "upsert", rowId: id, payload: task }] : [];
          },
        ),
      deleteTask: (id) =>
        commit(
          (current) => ({
            ...current,
            tasks: current.tasks.filter((task) => task.id !== id),
          }),
          (previous) =>
            previous.tasks.some((task) => task.id === id)
              ? [{ table: "tasks", op: "delete", rowId: id }]
              : [],
        ),

      addShoppingItem: (draft) => {
        const item = { ...draft, id: uid(), done: false, createdAt: now() };
        commit(
          (current) => ({ ...current, shopping: [item, ...current.shopping] }),
          () => [{ table: "shopping", op: "upsert", rowId: item.id, payload: item }],
        );
      },
      updateShoppingItem: (id, draft) =>
        commit(
          (current) => ({
            ...current,
            shopping: current.shopping.map((item) =>
              item.id === id ? { ...item, ...draft } : item,
            ),
          }),
          (_previous, next) => {
            const item = next.shopping.find((entry) => entry.id === id);
            return item ? [{ table: "shopping", op: "upsert", rowId: id, payload: item }] : [];
          },
        ),
      toggleShoppingItem: (id) =>
        commit(
          (current) => ({
            ...current,
            shopping: current.shopping.map((item) =>
              item.id === id ? { ...item, done: !item.done } : item,
            ),
          }),
          (_previous, next) => {
            const item = next.shopping.find((entry) => entry.id === id);
            return item ? [{ table: "shopping", op: "upsert", rowId: id, payload: item }] : [];
          },
        ),
      deleteShoppingItem: (id) =>
        commit(
          (current) => ({
            ...current,
            shopping: current.shopping.filter((item) => item.id !== id),
          }),
          (previous) =>
            previous.shopping.some((item) => item.id === id)
              ? [{ table: "shopping", op: "delete", rowId: id }]
              : [],
        ),
      clearCompletedShopping: () =>
        commit(
          (current) => ({
            ...current,
            shopping: current.shopping.filter((item) => !item.done),
          }),
          (previous) =>
            previous.shopping
              .filter((item) => item.done)
              .map((item) => ({ table: "shopping" as const, op: "delete" as const, rowId: item.id })),
        ),

      addTransaction: (draft) => {
        const transaction = { ...draft, id: uid(), createdAt: now() };
        commit(
          (current) => ({
            ...current,
            transactions: [transaction, ...current.transactions],
          }),
          () => [
            {
              table: "transactions",
              op: "upsert",
              rowId: transaction.id,
              payload: transaction,
            },
          ],
        );
      },
      updateTransaction: (id, draft) =>
        commit(
          (current) => ({
            ...current,
            transactions: current.transactions.map((item) =>
              item.id === id ? { ...item, ...draft } : item,
            ),
          }),
          (_previous, next) => {
            const item = next.transactions.find((entry) => entry.id === id);
            return item
              ? [{ table: "transactions", op: "upsert", rowId: id, payload: item }]
              : [];
          },
        ),
      deleteTransaction: (id) =>
        commit(
          (current) => ({
            ...current,
            transactions: current.transactions.filter((item) => item.id !== id),
          }),
          (previous) =>
            previous.transactions.some((item) => item.id === id)
              ? [{ table: "transactions", op: "delete", rowId: id }]
              : [],
        ),

      addMedia: (draft) => {
        const link = { ...draft, id: uid(), createdAt: now() };
        commit(
          (current) => ({ ...current, media: [link, ...current.media] }),
          () => [{ table: "media", op: "upsert", rowId: link.id, payload: link }],
        );
      },
      updateMedia: (id, draft) =>
        commit(
          (current) => ({
            ...current,
            media: current.media.map((item) => (item.id === id ? { ...item, ...draft } : item)),
          }),
          (_previous, next) => {
            const item = next.media.find((entry) => entry.id === id);
            return item ? [{ table: "media", op: "upsert", rowId: id, payload: item }] : [];
          },
        ),
      toggleMediaFavorite: (id) =>
        commit(
          (current) => ({
            ...current,
            media: current.media.map((item) =>
              item.id === id ? { ...item, favorite: !item.favorite } : item,
            ),
          }),
          (_previous, next) => {
            const item = next.media.find((entry) => entry.id === id);
            return item ? [{ table: "media", op: "upsert", rowId: id, payload: item }] : [];
          },
        ),
      deleteMedia: (id) =>
        commit(
          (current) => ({
            ...current,
            media: current.media.filter((item) => item.id !== id),
          }),
          (previous) =>
            previous.media.some((item) => item.id === id)
              ? [{ table: "media", op: "delete", rowId: id }]
              : [],
        ),

      addGoal: (draft) => {
        const goal = { ...draft, id: uid(), createdAt: now() };
        commit(
          (current) => ({ ...current, goals: [goal, ...current.goals] }),
          () => [{ table: "goals", op: "upsert", rowId: goal.id, payload: goal }],
        );
      },
      updateGoal: (id, draft) =>
        commit(
          (current) => ({
            ...current,
            goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...draft } : goal)),
          }),
          (_previous, next) => {
            const goal = next.goals.find((entry) => entry.id === id);
            return goal ? [{ table: "goals", op: "upsert", rowId: id, payload: goal }] : [];
          },
        ),
      contributeGoal: (id, amount) =>
        commit(
          (current) => ({
            ...current,
            goals: current.goals.map((goal) =>
              goal.id === id ? { ...goal, current: Math.max(0, goal.current + amount) } : goal,
            ),
          }),
          (_previous, next) => {
            const goal = next.goals.find((entry) => entry.id === id);
            return goal ? [{ table: "goals", op: "upsert", rowId: id, payload: goal }] : [];
          },
        ),
      deleteGoal: (id) =>
        commit(
          (current) => ({
            ...current,
            goals: current.goals.filter((goal) => goal.id !== id),
          }),
          (previous) =>
            previous.goals.some((goal) => goal.id === id)
              ? [{ table: "goals", op: "delete", rowId: id }]
              : [],
        ),

      addNote: (draft) => {
        const stamp = now();
        const note = { ...draft, id: uid(), createdAt: stamp, updatedAt: stamp };
        commit(
          (current) => ({ ...current, notes: [note, ...current.notes] }),
          () => [{ table: "notes", op: "upsert", rowId: note.id, payload: note }],
        );
      },
      updateNote: (id, draft) =>
        commit(
          (current) => ({
            ...current,
            notes: current.notes.map((note) =>
              note.id === id ? { ...note, ...draft, updatedAt: now() } : note,
            ),
          }),
          (_previous, next) => {
            const note = next.notes.find((entry) => entry.id === id);
            return note ? [{ table: "notes", op: "upsert", rowId: id, payload: note }] : [];
          },
        ),
      toggleNotePinned: (id) =>
        commit(
          (current) => ({
            ...current,
            notes: current.notes.map((note) =>
              note.id === id ? { ...note, pinned: !note.pinned, updatedAt: now() } : note,
            ),
          }),
          (_previous, next) => {
            const note = next.notes.find((entry) => entry.id === id);
            return note ? [{ table: "notes", op: "upsert", rowId: id, payload: note }] : [];
          },
        ),
      deleteNote: (id) =>
        commit(
          (current) => ({
            ...current,
            notes: current.notes.filter((note) => note.id !== id),
          }),
          (previous) =>
            previous.notes.some((note) => note.id === id)
              ? [{ table: "notes", op: "delete", rowId: id }]
              : [],
        ),

      updateSettings: (patch) =>
        commit(
          (current) => ({
            ...current,
            settings: { ...current.settings, ...patch },
          }),
          (_previous, next) => settingsSeed(next),
        ),
      dismissDemoBanner: () =>
        commit(
          (current) => ({
            ...current,
            settings: { ...current.settings, demoBannerDismissed: true },
          }),
          (_previous, next) => settingsSeed(next),
        ),
      clearAll: () =>
        commit(
          (current) =>
            createEmptyData({
              ...current.settings,
              demoBannerDismissed: true,
            }),
          (previous, next) => diffSeeds(previous, next),
        ),
      loadDemo: () => {
        const next =
          normalizeDashboardData(
            createSeedData({
              name: dataRef.current.settings.name,
              monthlyBudget: dataRef.current.settings.monthlyBudget,
              accent: dataRef.current.settings.accent,
              demoBannerDismissed: true,
            }),
          ) ?? createEmptyData();
        replaceDataWithSync(next);
      },
      importData: (payload) => {
        const normalized = normalizeDashboardData(payload, { requireArrays: true });
        if (!normalized) return false;
        replaceDataWithSync(normalized);
        return true;
      },
      syncNow,
      retryCloud,
      resolveCloudChoice,
      importGuestDataToCloud,
      signOut,
    };
  }, [
    applyChoiceState,
    cloudChoice,
    cloudConfigured,
    cloudError,
    cloudPhase,
    commit,
    data,
    hydrated,
    importGuestDataToCloud,
    lastSyncedAt,
    online,
    pendingCount,
    replaceDataWithSync,
    resolveCloudChoice,
    retryCloud,
    saveError,
    signOut,
    syncError,
    syncNow,
    syncState,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore precisa ser usado dentro de StoreProvider");
  }
  return context;
}
