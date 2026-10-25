"use client";

import { CalendarDays, Target, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { GOAL_COLORS, GOAL_UNITS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Goal } from "@/lib/types";
import { formatAmountInput, parseAmount } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type GoalFormModalProps = {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
};

export function GoalFormModal({ open, onClose, goal = null }: GoalFormModalProps) {
  const { addGoal, updateGoal, deleteGoal } = useStore();
  const formId = useId();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [unit, setUnit] = useState("R$");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0].value);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? "");
    setTarget(goal ? formatAmountInput(goal.target) : "");
    setCurrent(goal ? formatAmountInput(goal.current) : "");
    setUnit(goal?.unit ?? "R$");
    setDeadline(goal?.deadline ?? "");
    setColor(goal?.color ?? GOAL_COLORS[0].value);
    setError("");
    setConfirmDelete(false);
  }, [open, goal]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const parsedTarget = parseAmount(target);
    const parsedCurrent = current.trim() ? parseAmount(current) : 0;

    if (!cleanTitle) {
      setError("Dê um nome para a meta.");
      return;
    }
    if (!parsedTarget || parsedTarget <= 0) {
      setError("A meta precisa de um valor-alvo maior que zero.");
      return;
    }
    if (parsedCurrent < 0) {
      setError("O progresso não pode ser negativo.");
      return;
    }

    const draft = {
      title: cleanTitle,
      target: parsedTarget,
      current: parsedCurrent,
      unit: unit.trim() || "R$",
      deadline: deadline || null,
      color,
    };

    if (goal) {
      updateGoal(goal.id, draft);
    } else {
      addGoal(draft);
    }
    onClose();
  }

  function handleDelete() {
    if (!goal) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteGoal(goal.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? "Editar meta" : "Nova meta"}
      subtitle="Defina um número, acompanhe o progresso e celebre quando chegar lá."
      footer={
        <>
          {goal ? (
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
            {goal ? "Salvar" : "Criar meta"}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="goal-title">
            Meta
          </label>
          <input
            id="goal-title"
            className="input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            placeholder="Ex.: reserva de emergência"
            data-autofocus
            maxLength={140}
            required
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="goal-target">
              Objetivo
            </label>
            <input
              id="goal-target"
              className="input"
              inputMode="decimal"
              value={target}
              onChange={(event) => {
                setTarget(event.target.value);
                setError("");
              }}
              placeholder="0,00"
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="goal-current">
              Já conquistado
            </label>
            <input
              id="goal-current"
              className="input"
              inputMode="decimal"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="goal-unit">
              Unidade
            </label>
            <input
              id="goal-unit"
              className="input"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              list="goal-units"
              maxLength={20}
            />
            <datalist id="goal-units">
              {GOAL_UNITS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label className="label" htmlFor="goal-deadline">
              Prazo <span className="optional">opcional</span>
            </label>
            <div className="input-affix">
              <CalendarDays className="affix" size={13} />
              <input
                id="goal-deadline"
                className="input"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="field">
          <span className="label">
            <Target size={11} />
            Cor de destaque
          </span>
          <div className="color-picker">
            {GOAL_COLORS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`color-swatch${color === option.value ? " active" : ""}`}
                style={{ "--swatch": option.value } as React.CSSProperties}
                onClick={() => setColor(option.value)}
                aria-label={`Cor ${option.label}`}
                aria-pressed={color === option.value}
              >
                {color === option.value ? <CheckDot /> : null}
              </button>
            ))}
          </div>
        </div>

        <p className="field-hint">
          Use a unidade “R$” para metas de dinheiro; “km”, “livros” ou o que fizer sentido para as
          outras.
        </p>
      </form>
    </Modal>
  );
}

function CheckDot() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

type GoalContributionModalProps = {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
};

export function GoalContributionModal({ open, onClose, goal }: GoalContributionModalProps) {
  const { contributeGoal } = useStore();
  const formId = useId();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setError("");
  }, [open, goal]);

  if (!goal) return null;

  const remaining = Math.max(0, goal.target - goal.current);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (!parsed || parsed <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!goal) return;
    contributeGoal(goal.id, parsed);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar progresso"
      subtitle={goal.title}
      maxWidth={420}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            Adicionar
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 12px",
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-input)",
            fontSize: 11,
          }}
        >
          <span style={{ color: "var(--muted)" }}>Falta para concluir</span>
          <strong style={{ color: "var(--text-strong)", fontWeight: 600 }}>
            {goal.unit === "R$" ? remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : `${remaining.toLocaleString("pt-BR")} ${goal.unit}`}
          </strong>
        </div>

        <div className="field">
          <label className="label" htmlFor="goal-contribution">
            Quanto você avançou?
          </label>
          <div className="input-affix">
            <span className="affix">{goal.unit === "R$" ? "R$" : goal.unit}</span>
            <input
              id="goal-contribution"
              className="input"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="0,00"
              data-autofocus
              required
            />
          </div>
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <p className="field-hint">
          O valor é somado ao progresso atual. Você também pode editar o total direto na meta.
        </p>
      </form>
    </Modal>
  );
}
