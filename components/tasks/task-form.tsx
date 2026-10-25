"use client";

import { CalendarDays, ListTodo, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { TASK_LISTS, PRIORITIES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Priority, Task, TaskList } from "@/lib/types";
import { Modal } from "@/components/ui/modal";

type TaskFormModalProps = {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultList?: TaskList;
};

export function TaskFormModal({ open, onClose, task = null, defaultList = "Pessoal" }: TaskFormModalProps) {
  const { addTask, updateTask, deleteTask } = useStore();
  const formId = useId();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [list, setList] = useState<TaskList>(defaultList);
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setPriority(task?.priority ?? "media");
    setList(task?.list ?? defaultList);
    setDue(task?.due ?? "");
    setError("");
    setConfirmDelete(false);
  }, [open, task, defaultList]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Dê um nome para a tarefa.");
      return;
    }

    const draft = {
      title: cleanTitle,
      notes: notes.trim(),
      priority,
      list,
      due: due || null,
    };

    if (task) {
      updateTask(task.id, draft);
    } else {
      addTask(draft);
    }
    onClose();
  }

  function handleDelete() {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTask(task.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Editar tarefa" : "Nova tarefa"}
      subtitle={task ? "Atualize os detalhes ou remova da lista." : "Capture o que precisa sair da cabeça."}
      footer={
        <>
          {task ? (
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
            {task ? "Salvar" : "Criar tarefa"}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="task-title">
            Tarefa
          </label>
          <input
            id="task-title"
            className="input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            placeholder="Ex.: revisar proposta do cliente"
            data-autofocus
            maxLength={140}
            required
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <div className="field">
          <label className="label" htmlFor="task-notes">
            Notas <span className="optional">opcional</span>
          </label>
          <textarea
            id="task-notes"
            className="input textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Detalhes, links, próximos passos..."
            rows={3}
          />
        </div>

        <div className="field">
          <span className="label">Prioridade</span>
          <div className="segmented" role="group" aria-label="Prioridade">
            {(["baixa", "media", "alta"] as Priority[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`segment${priority === value ? " active" : ""}`}
                data-tone={value}
                onClick={() => setPriority(value)}
                aria-pressed={priority === value}
              >
                {PRIORITIES[value].label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="task-list">
              Lista
            </label>
            <select
              id="task-list"
              className="input"
              value={list}
              onChange={(event) => setList(event.target.value as TaskList)}
            >
              {TASK_LISTS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="task-due">
              Prazo <span className="optional">opcional</span>
            </label>
            <div className="input-affix">
              <CalendarDays className="affix" size={13} />
              <input
                id="task-due"
                className="input"
                type="date"
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </div>
          </div>
        </div>

        <p className="field-hint">
          Dica: tarefas com prazo aparecem primeiro na sua lista. Você pode editar tudo depois.
        </p>
      </form>
    </Modal>
  );
}
