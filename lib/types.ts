export type Priority = "baixa" | "media" | "alta";

export type TaskList = "Pessoal" | "Trabalho" | "Estudos" | "Casa";

export type Task = {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  list: TaskList;
  due: string | null;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
};

export type TaskDraft = Pick<Task, "title" | "notes" | "priority" | "list" | "due">;

export type ShoppingUnit = "un" | "kg" | "g" | "L" | "ml" | "cx" | "pct";

export type ShoppingCategory = "Mercado" | "Farmácia" | "Casa" | "Outros";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: ShoppingUnit;
  price: number | null;
  category: ShoppingCategory;
  done: boolean;
  createdAt: string;
};

export type ShoppingItemDraft = Pick<
  ShoppingItem,
  "name" | "quantity" | "unit" | "price" | "category"
>;

export type TransactionType = "receita" | "despesa";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  createdAt: string;
};

export type TransactionDraft = Pick<
  Transaction,
  "description" | "amount" | "type" | "category" | "date"
>;

export type MediaKind = "video" | "musica";

export type MediaLink = {
  id: string;
  title: string;
  url: string;
  kind: MediaKind;
  tags: string[];
  favorite: boolean;
  createdAt: string;
};

export type MediaDraft = Pick<MediaLink, "title" | "url" | "kind" | "tags" | "favorite">;

export type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string | null;
  color: string;
  createdAt: string;
};

export type GoalDraft = Pick<
  Goal,
  "title" | "target" | "current" | "unit" | "deadline" | "color"
>;

export type Note = {
  id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteDraft = Pick<Note, "title" | "body" | "color" | "pinned">;

export type AccentKey = "azul" | "teal" | "roxo" | "laranja" | "verde";

export type Settings = {
  name: string;
  monthlyBudget: number;
  accent: AccentKey;
  demoBannerDismissed: boolean;
};

export type DashboardData = {
  version: number;
  tasks: Task[];
  shopping: ShoppingItem[];
  transactions: Transaction[];
  media: MediaLink[];
  goals: Goal[];
  notes: Note[];
  settings: Settings;
};
