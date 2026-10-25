"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { normalizeDashboardData } from "./normalize";
import { createEmptyData, createSeedData } from "./seed";
import type {
  DashboardData,
  GoalDraft,
  MediaDraft,
  NoteDraft,
  Settings,
  ShoppingItemDraft,
  TaskDraft,
  TransactionDraft,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "dashboard-pessoal.v1";

type StoreValue = {
  data: DashboardData;
  hydrated: boolean;
  saveError: boolean;
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
};

const StoreContext = createContext<StoreValue | null>(null);

const now = () => new Date().toISOString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(() => createEmptyData());
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let next: DashboardData;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        next = normalizeDashboardData(JSON.parse(raw)) ?? createSeedData();
      } else {
        next = createSeedData();
      }
    } catch {
      next = createSeedData();
    }
    setData(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.accent = data.settings.accent;
    document.documentElement.style.colorScheme = "dark";
  }, [data.settings.accent]);

  const value = useMemo<StoreValue>(() => {
    const update = (recipe: (current: DashboardData) => DashboardData) => {
      setData((current) => recipe(current));
    };

    return {
      data,
      hydrated,
      saveError,
      addTask: (draft) =>
        update((current) => ({
          ...current,
          tasks: [
            {
              ...draft,
              id: uid(),
              done: false,
              createdAt: now(),
              completedAt: null,
            },
            ...current.tasks,
          ],
        })),
      updateTask: (id, draft) =>
        update((current) => ({
          ...current,
          tasks: current.tasks.map((task) => (task.id === id ? { ...task, ...draft } : task)),
        })),
      toggleTask: (id) =>
        update((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === id
              ? { ...task, done: !task.done, completedAt: task.done ? null : now() }
              : task,
          ),
        })),
      deleteTask: (id) =>
        update((current) => ({
          ...current,
          tasks: current.tasks.filter((task) => task.id !== id),
        })),

      addShoppingItem: (draft) =>
        update((current) => ({
          ...current,
          shopping: [
            { ...draft, id: uid(), done: false, createdAt: now() },
            ...current.shopping,
          ],
        })),
      updateShoppingItem: (id, draft) =>
        update((current) => ({
          ...current,
          shopping: current.shopping.map((item) =>
            item.id === id ? { ...item, ...draft } : item,
          ),
        })),
      toggleShoppingItem: (id) =>
        update((current) => ({
          ...current,
          shopping: current.shopping.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        })),
      deleteShoppingItem: (id) =>
        update((current) => ({
          ...current,
          shopping: current.shopping.filter((item) => item.id !== id),
        })),
      clearCompletedShopping: () =>
        update((current) => ({
          ...current,
          shopping: current.shopping.filter((item) => !item.done),
        })),

      addTransaction: (draft) =>
        update((current) => ({
          ...current,
          transactions: [
            { ...draft, id: uid(), createdAt: now() },
            ...current.transactions,
          ],
        })),
      updateTransaction: (id, draft) =>
        update((current) => ({
          ...current,
          transactions: current.transactions.map((item) =>
            item.id === id ? { ...item, ...draft } : item,
          ),
        })),
      deleteTransaction: (id) =>
        update((current) => ({
          ...current,
          transactions: current.transactions.filter((item) => item.id !== id),
        })),

      addMedia: (draft) =>
        update((current) => ({
          ...current,
          media: [{ ...draft, id: uid(), createdAt: now() }, ...current.media],
        })),
      updateMedia: (id, draft) =>
        update((current) => ({
          ...current,
          media: current.media.map((item) => (item.id === id ? { ...item, ...draft } : item)),
        })),
      toggleMediaFavorite: (id) =>
        update((current) => ({
          ...current,
          media: current.media.map((item) =>
            item.id === id ? { ...item, favorite: !item.favorite } : item,
          ),
        })),
      deleteMedia: (id) =>
        update((current) => ({
          ...current,
          media: current.media.filter((item) => item.id !== id),
        })),

      addGoal: (draft) =>
        update((current) => ({
          ...current,
          goals: [{ ...draft, id: uid(), createdAt: now() }, ...current.goals],
        })),
      updateGoal: (id, draft) =>
        update((current) => ({
          ...current,
          goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...draft } : goal)),
        })),
      contributeGoal: (id, amount) =>
        update((current) => ({
          ...current,
          goals: current.goals.map((goal) =>
            goal.id === id
              ? { ...goal, current: Math.max(0, goal.current + amount) }
              : goal,
          ),
        })),
      deleteGoal: (id) =>
        update((current) => ({
          ...current,
          goals: current.goals.filter((goal) => goal.id !== id),
        })),

      addNote: (draft) =>
        update((current) => ({
          ...current,
          notes: [
            { ...draft, id: uid(), createdAt: now(), updatedAt: now() },
            ...current.notes,
          ],
        })),
      updateNote: (id, draft) =>
        update((current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === id ? { ...note, ...draft, updatedAt: now() } : note,
          ),
        })),
      toggleNotePinned: (id) =>
        update((current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === id ? { ...note, pinned: !note.pinned, updatedAt: now() } : note,
          ),
        })),
      deleteNote: (id) =>
        update((current) => ({
          ...current,
          notes: current.notes.filter((note) => note.id !== id),
        })),

      updateSettings: (patch) =>
        update((current) => ({
          ...current,
          settings: { ...current.settings, ...patch },
        })),
      dismissDemoBanner: () =>
        update((current) => ({
          ...current,
          settings: { ...current.settings, demoBannerDismissed: true },
        })),
      clearAll: () =>
        update((current) =>
          createEmptyData({
            ...current.settings,
            demoBannerDismissed: true,
          }),
        ),
      loadDemo: () =>
        update((current) =>
          createSeedData({
            name: current.settings.name,
            monthlyBudget: current.settings.monthlyBudget,
            accent: current.settings.accent,
            demoBannerDismissed: true,
          }),
        ),
      importData: (payload) => {
        const normalized = normalizeDashboardData(payload, { requireArrays: true });
        if (!normalized) return false;
        setData(normalized);
        return true;
      },
    };
  }, [data, hydrated, saveError]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore precisa ser usado dentro de StoreProvider");
  }
  return context;
}
