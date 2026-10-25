"use client";

import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  GoalContributionModal,
  GoalFormModal,
} from "@/components/goals/goal-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { useStore } from "@/lib/store";
import type { Goal } from "@/lib/types";
import { useOpenOnHash } from "@/lib/use-hash-modal";
import {
  daysFromToday,
  formatDateShort,
  formatGoalValue,
  percent,
  sortGoals,
  sum,
} from "@/lib/utils";

type GoalFilter = "todas" | "andamento" | "concluidas";

function deadlineLabel(deadline: string): string {
  const days = daysFromToday(deadline);
  if (days < 0) return `Atrasada · ${formatDateShort(deadline)}`;
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `${formatDateShort(deadline)} · ${days} dias`;
}

function GoalCard({
  goal,
  onEdit,
  onContribute,
}: {
  goal: Goal;
  onEdit: () => void;
  onContribute: () => void;
}) {
  const progress = Math.round(percent(goal.current, goal.target));
  const complete = goal.current >= goal.target;
  const remaining = Math.max(0, goal.target - goal.current);
  const deadline = goal.deadline ? deadlineLabel(goal.deadline) : null;
  const overdue = Boolean(goal.deadline && daysFromToday(goal.deadline) < 0 && !complete);

  return (
    <article
      className="goal-card"
      style={{ "--goal-color": goal.color } as React.CSSProperties}
      aria-label={`Meta: ${goal.title}, ${progress}% concluída`}
    >
      <div className="goal-top">
        <div className="goal-heading">
          <h2 className="goal-title">{goal.title}</h2>
          <div
            className="goal-deadline"
            style={overdue ? { color: "var(--red)" } : undefined}
          >
            {complete ? (
              <>
                <CheckCircle2 size={10} />
                Meta conquistada
              </>
            ) : deadline ? (
              <>
                <CalendarDays size={10} />
                {deadline}
              </>
            ) : (
              <>
                <CalendarDays size={10} />
                Sem prazo definido
              </>
            )}
          </div>
        </div>
        <div className="goal-menu">
          <button
            type="button"
            className="icon-btn"
            onClick={onEdit}
            aria-label={`Editar meta: ${goal.title}`}
            title="Editar meta"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      <div className="goal-values">
        <span className="goal-current">
          <strong>{formatGoalValue(goal.current, goal.unit)}</strong>
          <span className="goal-target"> de {formatGoalValue(goal.target, goal.unit)}</span>
        </span>
        <span className="goal-percent">{progress}%</span>
      </div>

      <div
        className="progress-goal"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`${goal.title}: ${progress}%`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="goal-foot">
        <span className="goal-remaining" style={complete ? { color: "var(--green)" } : undefined}>
          {complete
            ? "Objetivo alcançado"
            : `Faltam ${formatGoalValue(remaining, goal.unit)}`}
        </span>
        {complete ? (
          <span className="badge badge-success">
            <CheckCircle2 size={9} />
            Concluída
          </span>
        ) : (
          <button type="button" className="goal-add" onClick={onContribute}>
            <Plus size={11} />
            Progresso
          </button>
        )}
      </div>
    </article>
  );
}

export function MetasPage() {
  const { data } = useStore();
  const [filter, setFilter] = useState<GoalFilter>("todas");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  const goals = useMemo(() => sortGoals(data.goals), [data.goals]);
  const completedCount = goals.filter((goal) => goal.current >= goal.target).length;
  const activeCount = goals.length - completedCount;
  const averageProgress =
    goals.length > 0
      ? Math.round(sum(goals.map((goal) => percent(goal.current, goal.target))) / goals.length)
      : 0;

  const filterOptions: { key: GoalFilter; label: string; count: number }[] = [
    { key: "todas", label: "Todas", count: goals.length },
    { key: "andamento", label: "Em andamento", count: activeCount },
    { key: "concluidas", label: "Concluídas", count: completedCount },
  ];

  const visibleGoals = useMemo(() => {
    const term = search.trim().toLowerCase();
    return goals.filter((goal) => {
      const complete = goal.current >= goal.target;
      if (filter === "andamento" && complete) return false;
      if (filter === "concluidas" && !complete) return false;
      if (!term) return true;
      return goal.title.toLowerCase().includes(term);
    });
  }, [goals, filter, search]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  useOpenOnHash("nova", openNew);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <div className="breadcrumb">
            <span>~</span>
            <span className="slash">/</span>
            <span>dashboard</span>
            <span className="slash">/</span>
            <span className="current">metas.goals</span>
          </div>
          <h1 className="page-title">Metas</h1>
          <p className="page-subtitle">
            {goals.length === 0
              ? "Escolha o que quer conquistar e transforme o desejo em progresso visível."
              : `${activeCount} em andamento · ${completedCount} concluída${
                  completedCount === 1 ? "" : "s"
                } · ${averageProgress}% de progresso médio.`}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={14} />
            Nova meta
          </button>
        </div>
      </div>

      <div className="goals-summary">
        <div className="goals-summary-item">
          <div className="goals-summary-label">Em andamento</div>
          <div className="goals-summary-value">
            {activeCount} {activeCount === 1 ? "meta" : "metas"}
          </div>
        </div>
        <div className="goals-summary-item">
          <div className="goals-summary-label">Progresso médio</div>
          <div className="goals-summary-value">{averageProgress}%</div>
        </div>
        <div className="goals-summary-item">
          <div className="goals-summary-label">Concluídas</div>
          <div className="goals-summary-value">{completedCount}</div>
        </div>
      </div>

      <div className="media-toolbar">
        <div className="chips scroll" role="group" aria-label="Filtrar metas">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`chip${filter === option.key ? " active" : ""}`}
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
            >
              {option.label}
              <span className="chip-count">{option.count}</span>
            </button>
          ))}
        </div>
        <div className="search-field">
          <Search size={13} />
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar meta..."
            aria-label="Buscar meta"
          />
        </div>
      </div>

      {visibleGoals.length > 0 ? (
        <div className="goals-grid">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {
                setEditing(goal);
                setFormOpen(true);
              }}
              onContribute={() => {
                setContributionGoal(goal);
                setContributionOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <Panel title="Metas" dotColor="var(--orange)">
          <EmptyState
            icon={<Target size={17} />}
            title={
              search || filter !== "todas"
                ? "Nenhuma meta encontrada"
                : "Nenhuma meta ainda"
            }
            text={
              search || filter !== "todas"
                ? "Ajuste a busca, troque o filtro ou crie uma nova meta."
                : "Dinheiro, quilômetros, livros ou horas: escolha uma unidade e acompanhe de perto."
            }
            action={
              search || filter !== "todas" ? (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setFilter("todas");
                  }}
                >
                  Limpar filtros
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                  <Plus size={12} /> Criar primeira meta
                </button>
              )
            }
          />
        </Panel>
      )}

      <GoalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        goal={editing}
      />
      <GoalContributionModal
        open={contributionOpen}
        onClose={() => setContributionOpen(false)}
        goal={contributionGoal}
      />
    </div>
  );
}
