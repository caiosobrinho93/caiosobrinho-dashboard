import type { Transaction } from "./types";

function cell(value: string): string {
  // Prevent spreadsheets from treating user-provided labels as formulas.
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '\"\"')}"`;
}

/** UTF-8 BOM, semicolon delimiter and decimal comma for Brazilian spreadsheets. */
export function transactionsToCsv(transactions: Transaction[]): string {
  const rows = [
    ["Data", "Descrição", "Tipo", "Categoria", "Valor (R$)"],
    ...transactions.map((item) => [
      item.date, item.description, item.type === "receita" ? "Receita" : "Despesa",
      item.category, item.amount.toFixed(2).replace(".", ","),
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}
