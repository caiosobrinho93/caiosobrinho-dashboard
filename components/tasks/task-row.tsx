"use client";

import { CalendarDays, Check, ChevronRight } from "lucide-react";
import { PRIORITIES } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { getDueMeta } from "@/lib/utils";

type TaskRowProps = {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  showChevron?: boolean;
};

export function TaskRow({ task, onToggle, onEdit, showChevron = false }: TaskRowProps) {
  const due = getDueMeta(task.due);
  const priority = PRIORITIES[task.priority];

  return (
    <div className={`task-row${task.done ? " done" : ""}`}>
      <button
        type="button"
        className={`task-check${task.done ? " checked" : ""}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? `Reabrir tarefa: ${task.title}` : `Concluir tarefa: ${task.title}`}
        aria-pressed={task.done}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      <button
        type="button"
        className="task-content"
        onClick={() => onEdit(task)}
        aria-label={`Editar tarefa: ${task.title}`}
      >
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className="task-meta-item" title={`Prioridade ${priority.label.toLowerCase()}`}>
            <span
              className="priority-dot"
              style={{ "--priority-color": priority.color } as React.CSSProperties}
            />
            {priority.label}
          </span>
          <span className="task-meta-item">{task.list}</span>
          {due ? (
            <span className={`due-chip ${due.tone}`}>
              <CalendarDays size={9} />
              {due.label}
            </span>
          ) : null}
        </span>
      </button>

      {showChevron ? <ChevronRight className="task-edit-chevron" size={14} /> : null}
    </div>
  );
}
