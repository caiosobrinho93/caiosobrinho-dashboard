"use client";

import { ListTodo, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TaskFormModal } from "@/components/tasks/task-form";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { useOpenOnHash } from "@/lib/use-hash-modal";
import { daysFromToday, sortTasks, todayISO } from "@/lib/utils";

type Filter = "pendentes" | "hoje" | "concluidas" | "todas";

type TaskGroup = {
  key: string;
  label: string;
  color: string;
  tasks: Task[];
};

function buildGroups(tasks: Task[]): TaskGroup[] {
  const overdue = tasks.filter((task) => !task.done && task.due && daysFromToday(task.due) < 0);
  const today = tasks.filter((task) => !task.done && task.due && daysFromToday(task.due) === 0);
  const upcoming = tasks.filter((task) => !task.done && task.due && daysFromToday(task.due) > 0);
  const noDue = tasks.filter((task) => !task.done && !task.due);
  const done = tasks.filter((task) => task.done);

  return [
    { key: "overdue", label: "Atrasadas", color: "#f48771", tasks: sortTasks(overdue) },
    { key: "today", label: "Hoje", color: "#3794ff", tasks: sortTasks(today) },
    { key: "upcoming", label: "Próximas", color: "#569cd6", tasks: sortTasks(upcoming) },
    { key: "nodue", label: "Sem prazo", color: "#858585", tasks: sortTasks(noDue) },
    { key: "done", label: "Concluídas", color: "#89d185", tasks: sortTasks(done) },
  ].filter((group) => group.tasks.length > 0);
}

export function TarefasPage() {
  const { data, addTask, toggleTask } = useStore();
  const [filter, setFilter] = useState<Filter>("pendentes");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const pending = data.tasks.filter((task) => !task.done);
  const done = data.tasks.filter((task) => task.done);
  const dueToday = data.tasks.filter(
    (task) => !task.done && task.due && daysFromToday(task.due) <= 0,
  );
  const overdue = data.tasks.filter(
    (task) => !task.done && task.due && daysFromToday(task.due) < 0,
  );

  const openNewTask = () => {
    setEditing(null);
    setFormOpen(true);
  };

  useOpenOnHash("nova", openNewTask);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.tasks.filter((task) => {
      if (filter === "pendentes" && task.done) return false;
      if (filter === "concluidas" && !task.done) return false;
      if (filter === "hoje") {
        if (task.done) return false;
        if (!task.due) return false;
        if (daysFromToday(task.due) > 0) return false;
      }
      if (!term) return true;
      return `${task.title} ${task.notes} ${task.list}`
        .toLowerCase()
        .includes(term);
    });
  }, [data.tasks, filter, search]);

  const groups = useMemo(() => {
    if (filter === "concluidas") {
      return buildGroups(visibleTasks).filter((group) => group.key === "done");
    }
    if (filter === "hoje") {
      return buildGroups(visibleTasks).filter(
        (group) => group.key === "overdue" || group.key === "today",
      );
    }
    if (filter === "todas") return buildGroups(visibleTasks);
    return buildGroups(visibleTasks).filter((group) => group.key !== "done");
  }, [filter, visibleTasks]);

  const filterOptions: { key: Filter; label: string; count: number }[] = [
    { key: "pendentes", label: "Pendentes", count: pending.length },
    { key: "hoje", label: "Hoje", count: dueToday.length },
    { key: "concluidas", label: "Concluídas", count: done.length },
    { key: "todas", label: "Todas", count: data.tasks.length },
  ];

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    addTask({
      title,
      notes: "",
      priority: "media",
      list: "Pessoal",
      due: filter === "hoje" ? todayISO() : null,
    });
    setQuickTitle("");
    setSearch("");
    if (filter === "concluidas") setFilter("pendentes");
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <Breadcrumb segments={[{ label: "tarefas.md" }]} />
          <h1 className="page-title">Tarefas</h1>
          <p className="page-subtitle">
            {pending.length === 0
              ? "Tudo em ordem. Sua lista está limpa."
              : `${pending.length} pendente${pending.length === 1 ? "" : "s"} · ${
                  overdue.length
                } atrasada${overdue.length === 1 ? "" : "s"} · ${done.length} concluída${
                  done.length === 1 ? "" : "s"
                }`}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openNewTask}>
            <Plus size={14} />
            Nova tarefa
          </button>
        </div>
      </div>

      <div className="shop-summary">
        <div className="shop-summary-item">
          <div className="shop-summary-label">Pendentes</div>
          <div className="shop-summary-value">{pending.length}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Para hoje</div>
          <div className="shop-summary-value">{dueToday.length}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Atrasadas</div>
          <div className={`shop-summary-value${overdue.length > 0 ? " negative" : ""}`}>
            {overdue.length}
          </div>
        </div>
      </div>

      <form className="quick-add" onSubmit={handleQuickAdd}>
        <Plus size={15} />
        <input
          value={quickTitle}
          onChange={(event) => setQuickTitle(event.target.value)}
          placeholder="Adicionar tarefa rápida e pressionar Enter..."
          aria-label="Adicionar tarefa rápida"
          maxLength={140}
        />
        <button type="submit" className="quick-add-submit" disabled={!quickTitle.trim()}>
          <span>Adicionar</span>
          <span className="kbd">↵</span>
        </button>
      </form>

      <div className="media-toolbar">
        <div className="chips scroll" role="group" aria-label="Filtrar tarefas">
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
            placeholder="Buscar tarefa..."
            aria-label="Buscar tarefa"
          />
        </div>
      </div>

      <Panel
        title={filterOptions.find((option) => option.key === filter)?.label ?? "Tarefas"}
        subtitle={`${visibleTasks.length} ${visibleTasks.length === 1 ? "tarefa" : "tarefas"}`}
        dotColor="var(--yellow)"
      >
        {groups.length > 0 ? (
          <div>
            {groups.map((group) => (
              <div className="task-group" key={group.key}>
                <div className="task-group-head">
                  <span className="task-group-dot" style={{ background: group.color }} />
                  <span>{group.label}</span>
                  <span className="task-group-count">{group.tasks.length}</span>
                </div>
                <div className="task-list">
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={(selected) => {
                        setEditing(selected);
                        setFormOpen(true);
                      }}
                      showChevron
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ListTodo size={17} />}
            title={search ? "Nenhuma tarefa encontrada" : "Tudo limpo por aqui"}
            text={
              search
                ? "Tente outro termo ou troque o filtro."
                : filter === "concluidas"
                  ? "Conclua uma tarefa e ela aparece aqui."
                  : "Capture a próxima tarefa. Cinco segundos agora economizam uma lembrança depois."
            }
            action={
              !search ? (
                <button type="button" className="btn btn-sm btn-secondary" onClick={openNewTask}>
                  <Plus size={12} /> Nova tarefa
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSearch("")}>
                  Limpar busca
                </button>
              )
            }
          />
        )}
      </Panel>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editing}
      />
    </div>
  );
}
