"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  ExternalLink,
  Info,
  ListTodo,
  Music2,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  Video,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { OrbitMark } from "@/components/orbit-mark";
import { useMemo, useState } from "react";
import { DonutChart, DonutLegend } from "@/components/charts/donut-chart";
import { TransactionFormModal } from "@/components/finance/transaction-form";
import { MediaFormModal } from "@/components/media/media-form";
import { ShoppingFormModal } from "@/components/shopping/shopping-form";
import { TaskFormModal } from "@/components/tasks/task-form";
import { TaskRow } from "@/components/tasks/task-row";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { useAuth } from "@/components/auth-provider";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { hapticTap } from "@/lib/native";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { categoryColor, SHOPPING_CATEGORY_COLORS } from "@/lib/constants";
import {
  addMonths,
  formatCurrency,
  formatDateLong,
  formatGoalValue,
  formatRelativeTime,
  getDomain,
  getGreeting,
  isDoneToday,
  monthKey,
  percent,
  sortGoals,
  sortTasks,
  sum,
} from "@/lib/utils";

type HomeModal =
  | { type: "task"; task?: Task }
  | { type: "expense" }
  | { type: "shopping" }
  | { type: "media" }
  | null;

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function HomePage() {
  const {
    data,
    toggleTask,
    toggleShoppingItem,
    dismissDemoBanner,
    clearAll,
    syncNow,
    cloudConfigured,
  } = useStore();
  const { user } = useAuth();
  const [modal, setModal] = useState<HomeModal>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    void hapticTap();
    try {
      if (cloudConfigured && user) {
        await syncNow();
      }
    } catch {
      // Ignora
    } finally {
      window.location.reload();
    }
  };

  const firstName = data.settings.name.trim().split(/\s+/)[0] || "por aí";
  const greeting = getGreeting();
  const now = new Date();
  const month = monthKey(now);
  const previousMonth = monthKey(addMonths(now, -1));

  const pendingTasks = useMemo(() => data.tasks.filter((task) => !task.done), [data.tasks]);
  const doneToday = useMemo(() => data.tasks.filter(isDoneToday).length, [data.tasks]);
  const totalTasks = useMemo(() => data.tasks.length, [data.tasks]);
  const doneTasks = useMemo(() => data.tasks.filter((task) => task.done).length, [data.tasks]);
  const taskProgress = useMemo(
    () => (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0),
    [doneTasks, totalTasks],
  );
  const topTasks = useMemo(() => sortTasks(pendingTasks).slice(0, 4), [pendingTasks]);

  const monthTransactions = useMemo(
    () => data.transactions.filter((transaction) => transaction.date.slice(0, 7) === month),
    [data.transactions, month],
  );
  const previousTransactions = useMemo(
    () =>
      data.transactions.filter((transaction) => transaction.date.slice(0, 7) === previousMonth),
    [data.transactions, previousMonth],
  );
  const income = sum(
    monthTransactions.filter((transaction) => transaction.type === "receita").map((t) => t.amount),
  );
  const expenses = sum(
    monthTransactions.filter((transaction) => transaction.type === "despesa").map((t) => t.amount),
  );
  const balance = income - expenses;
  const previousExpenses = sum(
    previousTransactions
      .filter((transaction) => transaction.type === "despesa")
      .map((t) => t.amount),
  );
  const expenseDelta =
    previousExpenses > 0 ? Math.round(((expenses - previousExpenses) / previousExpenses) * 100) : null;

  const expenseSlices = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const transaction of monthTransactions) {
      if (transaction.type !== "despesa") continue;
      grouped.set(transaction.category, (grouped.get(transaction.category) ?? 0) + transaction.amount);
    }
    return [...grouped.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: categoryColor(label) }));
  }, [monthTransactions]);

  const pendingShopping = useMemo(() => data.shopping.filter((item) => !item.done), [data.shopping]);
  const shoppingEstimate = useMemo(
    () => sum(pendingShopping.map((item) => (item.price ?? 0) * item.quantity)),
    [pendingShopping],
  );
  const recentMedia = useMemo(
    () =>
      [...data.media]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3),
    [data.media],
  );
  const goals = useMemo(() => sortGoals(data.goals), [data.goals]);
  const goalsAverage = useMemo(
    () =>
      goals.length > 0
        ? Math.round(sum(goals.map((goal) => percent(goal.current, goal.target))) / goals.length)
        : 0,
    [goals],
  );
  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.current >= goal.target).length,
    [goals],
  );

  const closeModal = () => setModal(null);
  const taskBeingEdited = modal?.type === "task" ? modal.task ?? null : null;

  return (
    <div className="page">
      <header className="home-hero">
        <div className="orbit-hero-label"><span /> SEU UNIVERSO, EM ORDEM <span className="orbit-edition">PERSONAL SPACE / 01</span></div>
        <div className="orbit-hero-copy">
        <div className="home-hero-top">
          <Breadcrumb segments={[{ label: "inicio.tsx" }]} />
          <button
            type="button"
            className={`home-refresh-chip${refreshing ? " refreshing" : ""}`}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Atualizar dados do feed"
            title="Atualizar dados e sincronizar"
          >
            <RefreshCw size={12} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </div>
        <h1 className="home-title">
          <span>{greeting},</span>
          <span className="name">{firstName}.</span>
          <span className="caret" aria-hidden="true" />
        </h1>
        <p className="home-date">
          <CalendarDays
            size={12}
            style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }}
          />
          {formatDateLong()}
          <span className="mono"> · {pluralize(pendingTasks.length, "pendência", "pendências")} no radar</span>
        </p>
        <div className="orbit-hero-footer">
          <Link href="/tarefas" className="orbit-focus-link">Explorar meu dia <ChevronRight size={16} /></Link>
          <span>{taskProgress}% das tarefas concluídas</span>
        </div>
        </div>
        <OrbitMark />
      </header>

      {!data.settings.demoBannerDismissed ? (
        <div className="demo-banner">
          <Info size={15} />
          <div className="demo-banner-content">
            <p>
              <strong>Modo demonstração.</strong> Estes dados são exemplos para você explorar o
              dashboard. Tudo que você criar fica salvo neste navegador.
            </p>
            <div className="demo-banner-actions">
              <button type="button" className="link-btn" onClick={() => setConfirmClear(true)}>
                Começar do zero
              </button>
              <span className="muted" style={{ fontSize: 10 }}>
                ·
              </span>
              <button
                type="button"
                className="link-btn"
                style={{ color: "var(--muted)", fontWeight: 400 }}
                onClick={dismissDemoBanner}
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="quick-actions" aria-label="Ações rápidas">
        <button
          type="button"
          className="quick-action"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Atualizar feed e dados"
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} style={{ color: "var(--teal)" }} />
          Atualizar feed
        </button>
        <button
          type="button"
          className="quick-action"
          onClick={() => setModal({ type: "task" })}
        >
          <ListTodo size={14} style={{ color: "var(--yellow)" }} />
          Nova tarefa
        </button>
        <button
          type="button"
          className="quick-action"
          onClick={() => setModal({ type: "expense" })}
        >
          <Receipt size={14} style={{ color: "var(--red)" }} />
          Novo gasto
        </button>
        <button
          type="button"
          className="quick-action"
          onClick={() => setModal({ type: "shopping" })}
        >
          <ShoppingCart size={14} style={{ color: "var(--green)" }} />
          Item de compras
        </button>
        <button
          type="button"
          className="quick-action"
          onClick={() => setModal({ type: "media" })}
        >
          <Video size={14} style={{ color: "var(--purple)" }} />
          Salvar link
        </button>
      </div>

      <div className="stats-grid">
        <Link href="/tarefas" className="stat-card" style={{ "--stat-color": "var(--yellow)" } as React.CSSProperties}>
          <div className="stat-top">
            <span className="stat-label">Tarefas abertas</span>
            <span className="stat-icon">
              <ListTodo size={13} />
            </span>
          </div>
          <strong className="stat-value">{pendingTasks.length}</strong>
          <span className="stat-meta">
            {doneToday > 0 ? (
              <>
                <span className="positive">{doneToday}</span> concluída{doneToday === 1 ? "" : "s"} hoje
              </>
            ) : (
              "nada concluído hoje"
            )}
          </span>
        </Link>

        <Link href="/financas" className="stat-card" style={{ "--stat-color": "var(--teal)" } as React.CSSProperties}>
          <div className="stat-top">
            <span className="stat-label">Saldo do mês</span>
            <span className="stat-icon">
              <Wallet size={13} />
            </span>
          </div>
          <strong className={`stat-value small ${balance >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(balance)}
          </strong>
          <span className="stat-meta">{formatCurrency(expenses)} em gastos</span>
        </Link>

        <Link href="/compras" className="stat-card" style={{ "--stat-color": "var(--green)" } as React.CSSProperties}>
          <div className="stat-top">
            <span className="stat-label">Lista de compras</span>
            <span className="stat-icon">
              <ShoppingCart size={13} />
            </span>
          </div>
          <strong className="stat-value">{pendingShopping.length}</strong>
          <span className="stat-meta">
            {pendingShopping.length > 0
              ? `estimado ${formatCurrency(shoppingEstimate)}`
              : "lista em dia"}
          </span>
        </Link>

        <Link href="/metas" className="stat-card" style={{ "--stat-color": "var(--orange)" } as React.CSSProperties}>
          <div className="stat-top">
            <span className="stat-label">Progresso das metas</span>
            <span className="stat-icon">
              <Target size={13} />
            </span>
          </div>
          <strong className="stat-value">{goalsAverage}%</strong>
          <span className="stat-meta">
            {goals.length > 0
              ? `${completedGoals} de ${goals.length} concluídas`
              : "defina sua primeira meta"}
          </span>
        </Link>
      </div>

      <div className="content-grid">
        <div className="col-7">
          <Panel
            title="A fazer"
            subtitle={pluralize(pendingTasks.length, "pendente", "pendentes")}
            dotColor="var(--yellow)"
            action={
              <Link href="/tarefas" className="panel-action">
                Ver todas <ChevronRight size={11} />
              </Link>
            }
            footer={
              totalTasks > 0 ? (
                <>
                  <span>{doneToday} concluída{doneToday === 1 ? "" : "s"} hoje</span>
                  <Link href="/tarefas" className="link-btn">
                    Abrir tarefas <ChevronRight size={11} />
                  </Link>
                </>
              ) : undefined
            }
          >
            {totalTasks > 0 ? (
              <div className="task-progress-line" aria-hidden="true">
                <span style={{ width: `${taskProgress}%` }} />
              </div>
            ) : null}
            {topTasks.length > 0 ? (
              <div className="task-list">
                {topTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={(selected) => setModal({ type: "task", task: selected })}
                    showChevron
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ListTodo size={17} />}
                title="Nada pendente"
                text="Sua lista está limpa. Aproveite ou capture a próxima ideia."
                action={
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setModal({ type: "task" })}
                  >
                    <Plus size={12} /> Nova tarefa
                  </button>
                }
              />
            )}
          </Panel>
        </div>

        <div className="col-5">
          <Panel
            title="Finanças do mês"
            subtitle={now.toLocaleDateString("pt-BR", { month: "long" })}
            dotColor="var(--teal)"
            action={
              <Link href="/financas" className="panel-action">
                Detalhes <ChevronRight size={11} />
              </Link>
            }
            footer={
              <>
                {expenseDelta != null && expenses > 0 ? (
                  <span
                    className={expenseDelta <= 0 ? "positive" : "negative"}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    {expenseDelta <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    {Math.abs(expenseDelta)}% vs. mês anterior
                  </span>
                ) : (
                  <span>Saldo {formatCurrency(balance)}</span>
                )}
                <Link href="/financas" className="link-btn">
                  Finanças <ChevronRight size={11} />
                </Link>
              </>
            }
          >
            {expenseSlices.length > 0 ? (
              <div className="donut-layout">
                <DonutChart
                  data={expenseSlices}
                  centerValue={formatCurrency(expenses)}
                  centerLabel="gastos"
                />
                <DonutLegend data={expenseSlices} maxItems={4} />
              </div>
            ) : (
              <EmptyState
                icon={<Wallet size={17} />}
                title="Sem gastos neste mês"
                text="Quando você lançar despesas, a distribuição por categoria aparece aqui."
                action={
                  <Link className="btn btn-sm btn-secondary" href="/financas#nova">
                    <Plus size={12} /> Lançar gasto
                  </Link>
                }
              />
            )}
          </Panel>
        </div>

        <div className="col-7">
          <Panel
            title="Metas"
            subtitle={goals.length > 0 ? `${goals.length} ativas` : "primeiro passo"}
            dotColor="var(--orange)"
            action={
              <Link href="/metas" className="panel-action">
                Ver metas <ChevronRight size={11} />
              </Link>
            }
            footer={
              goals.length > 0 ? (
                <>
                  <span>{goalsAverage}% de progresso médio</span>
                  <Link href="/metas" className="link-btn">
                    Abrir metas <ChevronRight size={11} />
                  </Link>
                </>
              ) : undefined
            }
          >
            {goals.length > 0 ? (
              <div className="goal-mini-list">
                {goals.slice(0, 3).map((goal) => {
                  const progress = Math.round(percent(goal.current, goal.target));
                  return (
                    <Link
                      key={goal.id}
                      className="goal-mini"
                      href="/metas"
                      style={{ "--goal-color": goal.color } as React.CSSProperties}
                    >
                      <div className="goal-mini-top">
                        <span className="goal-mini-title">{goal.title}</span>
                        <span className="goal-mini-meta">
                          {progress}% · {formatGoalValue(goal.current, goal.unit)}
                        </span>
                      </div>
                      <div className="progress-goal">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Target size={17} />}
                title="Nenhuma meta ainda"
                text="Dinheiro, quilômetros, livros... escolha o que quer conquistar."
                action={
                  <Link className="btn btn-sm btn-secondary" href="/metas#nova">
                    <Plus size={12} /> Criar meta
                  </Link>
                }
              />
            )}
          </Panel>
        </div>

        <div className="col-5">
          <Panel
            title="Compras"
            subtitle={pendingShopping.length > 0 ? pluralize(pendingShopping.length, "item", "itens") : "tudo comprado"}
            dotColor="var(--green)"
            action={
              <Link href="/compras" className="panel-action">
                Abrir <ChevronRight size={11} />
              </Link>
            }
            footer={
              pendingShopping.length > 0 ? (
                <>
                  <span>estimado {formatCurrency(shoppingEstimate)}</span>
                  <Link href="/compras" className="link-btn">
                    Ver lista <ChevronRight size={11} />
                  </Link>
                </>
              ) : undefined
            }
          >
            {pendingShopping.length > 0 ? (
              <div className="shop-list">
                {pendingShopping.slice(0, 3).map((item) => (
                  <div className="shop-row" key={item.id}>
                    <button
                      type="button"
                      className="shop-check"
                      onClick={() => toggleShoppingItem(item.id)}
                      aria-label={`Marcar como comprado: ${item.name}`}
                      aria-pressed={false}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div className="shop-main">
                      <span className="shop-name">{item.name}</span>
                      <span className="shop-details">
                        <span className="cat-dot" style={{ "--cat-color": SHOPPING_CATEGORY_COLORS[item.category] } as React.CSSProperties} />
                        {item.quantity.toLocaleString("pt-BR")} {item.unit} · {item.category}
                      </span>
                    </div>
                    <span className="shop-price">
                      {item.price != null ? formatCurrency(item.price * item.quantity) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ShoppingCart size={17} />}
                title="Lista vazia"
                text="Adicione o que falta na despensa e marque no mercado."
                action={
                  <Link className="btn btn-sm btn-secondary" href="/compras#nova">
                    <Plus size={12} /> Adicionar item
                  </Link>
                }
              />
            )}
          </Panel>
        </div>

        <div className="col-12">
          <Panel
            title="Midiateca"
            subtitle={`${data.media.length} links salvos`}
            dotColor="var(--purple)"
            action={
              <Link href="/midia" className="panel-action">
                Abrir midiateca <ChevronRight size={11} />
              </Link>
            }
          >
            {recentMedia.length > 0 ? (
              <div className="panel-body flush">
                {recentMedia.map((item) => (
                  <a
                    key={item.id}
                    className="music-row"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span className="music-art">
                      {item.kind === "video" ? <Video size={16} /> : <Music2 size={16} />}
                    </span>
                    <span className="music-info">
                      <span className="music-title">{item.title}</span>
                      <span className="music-sub">
                        {getDomain(item.url)} · {formatRelativeTime(item.createdAt)}
                        {item.tags.length > 0 ? ` · ${item.tags.slice(0, 2).join(" · ")}` : ""}
                      </span>
                    </span>
                    <ExternalLink size={13} className="muted" style={{ flex: "none" }} />
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Video size={17} />}
                title="Nenhum link salvo"
                text="Guarde aquele vídeo ou playlist que você sempre esquece onde viu."
                action={
                  <button
                    className="btn btn-sm btn-secondary"
                    type="button"
                    onClick={() => setModal({ type: "media" })}
                  >
                    <Plus size={12} /> Salvar link
                  </button>
                }
              />
            )}
          </Panel>
        </div>
      </div>

      <TaskFormModal
        open={modal?.type === "task"}
        onClose={closeModal}
        task={taskBeingEdited}
      />
      <TransactionFormModal
        open={modal?.type === "expense"}
        onClose={closeModal}
        defaultType="despesa"
      />
      <ShoppingFormModal
        open={modal?.type === "shopping"}
        onClose={closeModal}
      />
      <MediaFormModal open={modal?.type === "media"} onClose={closeModal} />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          closeModal();
        }}
        title="Começar do zero?"
        description="Isso remove as tarefas, compras, finanças, metas, notas e links de exemplo. Seu nome, orçamento e cor de destaque são mantidos."
        confirmLabel="Limpar dados"
      />
    </div>
  );
}
