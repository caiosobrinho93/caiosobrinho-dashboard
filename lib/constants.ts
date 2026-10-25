import type {
  AccentKey,
  Priority,
  ShoppingCategory,
  ShoppingUnit,
  TaskList,
} from "./types";

export const ACCENTS: { key: AccentKey; label: string; color: string }[] = [
  { key: "azul", label: "Azul VS Code", color: "#3794ff" },
  { key: "teal", label: "Verde-água", color: "#4ec9b0" },
  { key: "roxo", label: "Roxo", color: "#c586c0" },
  { key: "laranja", label: "Laranja", color: "#ce9178" },
  { key: "verde", label: "Verde", color: "#89d185" },
];

export const PRIORITIES: Record<
  Priority,
  { label: string; color: string; order: number }
> = {
  alta: { label: "Alta", color: "#f48771", order: 0 },
  media: { label: "Média", color: "#dcdcaa", order: 1 },
  baixa: { label: "Baixa", color: "#569cd6", order: 2 },
};

export const TASK_LISTS: { name: TaskList; color: string }[] = [
  { name: "Pessoal", color: "#4ec9b0" },
  { name: "Trabalho", color: "#569cd6" },
  { name: "Estudos", color: "#c586c0" },
  { name: "Casa", color: "#dcdcaa" },
];

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  "Mercado",
  "Farmácia",
  "Casa",
  "Outros",
];

export const SHOPPING_UNITS: ShoppingUnit[] = ["un", "kg", "g", "L", "ml", "cx", "pct"];

export const SHOPPING_CATEGORY_COLORS: Record<ShoppingCategory, string> = {
  Mercado: "#89d185",
  Farmácia: "#f48771",
  Casa: "#569cd6",
  Outros: "#858585",
};

export type CategoryMeta = { name: string; color: string };

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { name: "Alimentação", color: "#ce9178" },
  { name: "Moradia", color: "#569cd6" },
  { name: "Transporte", color: "#dcdcaa" },
  { name: "Saúde", color: "#f48771" },
  { name: "Lazer", color: "#c586c0" },
  { name: "Educação", color: "#4ec9b0" },
  { name: "Compras", color: "#b5cea8" },
  { name: "Contas", color: "#9cdcfe" },
  { name: "Outros", color: "#a0a0a0" },
];

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { name: "Salário", color: "#89d185" },
  { name: "Freela", color: "#4ec9b0" },
  { name: "Investimentos", color: "#dcdcaa" },
  { name: "Outros", color: "#a0a0a0" },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function categoryColor(name: string): string {
  return ALL_CATEGORIES.find((category) => category.name === name)?.color ?? "#a0a0a0";
}

export const GOAL_COLORS = [
  { label: "Verde", value: "#89d185" },
  { label: "Verde-água", value: "#4ec9b0" },
  { label: "Azul", value: "#569cd6" },
  { label: "Roxo", value: "#c586c0" },
  { label: "Laranja", value: "#ce9178" },
  { label: "Amarelo", value: "#dcdcaa" },
];

export const NOTE_COLORS = [
  { label: "Amarelo", value: "#dcdcaa" },
  { label: "Azul", value: "#569cd6" },
  { label: "Verde-água", value: "#4ec9b0" },
  { label: "Roxo", value: "#c586c0" },
  { label: "Laranja", value: "#ce9178" },
];

export const GOAL_UNITS = ["R$", "km", "kg", "h", "livros", "páginas", "min", "un"];
