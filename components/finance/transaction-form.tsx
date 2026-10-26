"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Transaction, TransactionType } from "@/lib/types";
import { formatAmountInput, isISODate, parseAmount, todayISO } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type TransactionFormModalProps = {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  defaultType?: TransactionType;
};

export function TransactionFormModal({
  open,
  onClose,
  transaction = null,
  defaultType = "despesa",
}: TransactionFormModalProps) {
  const { addTransaction, updateTransaction, deleteTransaction } = useStore();
  const formId = useId();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentação");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextType = transaction?.type ?? defaultType;
    const categories = nextType === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const nextCategory =
      transaction?.category && categories.some((item) => item.name === transaction.category)
        ? transaction.category
        : categories[0].name;

    setType(nextType);
    setDescription(transaction?.description ?? "");
    setAmount(transaction ? formatAmountInput(transaction.amount) : "");
    setCategory(nextCategory);
    setDate(transaction?.date ?? todayISO());
    setError("");
    setConfirmDelete(false);
  }, [open, transaction, defaultType]);

  function changeType(nextType: TransactionType) {
    setType(nextType);
    const categories = nextType === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!categories.some((item) => item.name === category)) {
      setCategory(categories[0].name);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanDescription = description.trim();
    const parsedAmount = parseAmount(amount);

    if (!cleanDescription) {
      setError("Descreva a movimentação.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    if (date && !isISODate(date)) {
      setError("Informe uma data válida.");
      return;
    }

    const draft = {
      description: cleanDescription,
      amount: parsedAmount,
      type,
      category,
      date: date || todayISO(),
    };

    if (transaction) {
      updateTransaction(transaction.id, draft);
    } else {
      addTransaction(draft);
    }
    onClose();
  }

  function handleDelete() {
    if (!transaction) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTransaction(transaction.id);
    onClose();
  }

  const categories = type === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? "Editar movimentação" : "Nova movimentação"}
      subtitle="Receitas entram, despesas saem. O saldo é recalculado na hora."
      footer={
        <>
          {transaction ? (
            <div className="footer-left">
              <button
                type="button"
                className={`btn btn-sm ${confirmDelete ? "btn-danger-solid" : "btn-danger"}`}
                onClick={handleDelete}
              >
                <Trash2 size={13} />
                {confirmDelete ? "Confirmar?" : "Excluir"}
              </button>
            </div>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {transaction ? "Salvar" : "Lançar"}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="label">Tipo</span>
          <div className="segmented" role="group" aria-label="Tipo de movimentação">
            <button
              type="button"
              className={`segment${type === "despesa" ? " active" : ""}`}
              data-tone="despesa"
              onClick={() => changeType("despesa")}
              aria-pressed={type === "despesa"}
            >
              Despesa
            </button>
            <button
              type="button"
              className={`segment${type === "receita" ? " active" : ""}`}
              data-tone="receita"
              onClick={() => changeType("receita")}
              aria-pressed={type === "receita"}
            >
              Receita
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="tx-description">
              Descrição
            </label>
            <input
              id="tx-description"
              className="input"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError("");
              }}
              placeholder={type === "receita" ? "Ex.: salário" : "Ex.: supermercado"}
              data-autofocus
              maxLength={120}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="tx-amount">
              Valor
            </label>
            <div className="input-affix">
              <span className="affix">R$</span>
              <input
                id="tx-amount"
                className="input"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                placeholder="0,00"
                required
              />
            </div>
          </div>
        </div>
        {error ? <p className="field-error">{error}</p> : null}

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="tx-category">
              Categoria
            </label>
            <select
              id="tx-category"
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="tx-date">
              Data
            </label>
            <div className="input-affix">
              <CalendarDays className="affix" size={13} />
              <input
                id="tx-date"
                className="input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
