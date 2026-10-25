"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DonutChart, DonutLegend } from "@/components/charts/donut-chart";
import { MonthBars } from "@/components/charts/month-bars";
import { TransactionFormModal } from "@/components/finance/transaction-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { categoryColor } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Transaction, TransactionType } from "@/lib/types";
import { useOpenOnHash } from "@/lib/use-hash-modal";
import {
  addMonths,
  currentMonthKey,
  formatCurrency,
  formatDayLabel,
  monthKey,
  monthLabel,
  monthShort,
  percent,
  sortTransactions,
  sum,
} from "@/lib/utils";

type TypeFilter = "todas" | TransactionType;

export function FinancasPage() {
  const { data } = useStore();
  const [monthOffset, setMonthOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todas");
  const [search, setSearch] = useState("");

  const activeDate = addMonths(new Date(), monthOffset);
  const activeMonth = monthKey(activeDate);
  const isCurrentMonth = activeMonth === currentMonthKey();

  const monthTransactions = useMemo(
    () => data.transactions.filter((transaction) => transaction.date.slice(0, 7) === activeMonth),
    [data.transactions, activeMonth],
  );

  const income = sum(
    monthTransactions.filter((transaction) => transaction.type === "receita").map((t) => t.amount),
  );
  const expense = sum(
    monthTransactions.filter((transaction) => transaction.type === "despesa").map((t) => t.amount),
  );
  const balance = income - expense;
  const budget = data.settings.monthlyBudget;
  const budgetUsage = budget > 0 ? percent(expense, budget) : 0;
  const budgetTone = budgetUsage >= 100 ? "red" : budgetUsage >= 75 ? "yellow" : "green";

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

  const chartMonths = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const date = addMonths(activeDate, -(5 - index));
        const key = monthKey(date);
        const rows = data.transactions.filter((transaction) => transaction.date.slice(0, 7) === key);
        return {
          key,
          label: monthShort(date),
          income: sum(rows.filter((row) => row.type === "receita").map((row) => row.amount)),
          expense: sum(rows.filter((row) => row.type === "despesa").map((row) => row.amount)),
        };
      }),
    [activeDate, data.transactions],
  );

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortTransactions(
      monthTransactions.filter((transaction) => {
        if (typeFilter !== "todas" && transaction.type !== typeFilter) return false;
        if (!term) return true;
        return `${transaction.description} ${transaction.category}`.toLowerCase().includes(term);
      }),
    );
  }, [monthTransactions, typeFilter, search]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const transaction of filteredTransactions) {
      const list = groups.get(transaction.date) ?? [];
      list.push(transaction);
      groups.set(transaction.date, list);
    }
    return [...groups.entries()];
  }, [filteredTransactions]);

  useOpenOnHash("nova", () => {
    setEditing(null);
    setFormOpen(true);
  });

  const filterOptions: { key: TypeFilter; label: string; count: number }[] = [
    { key: "todas", label: "Todas", count: monthTransactions.length },
    {
      key: "receita",
      label: "Receitas",
      count: monthTransactions.filter((transaction) => transaction.type === "receita").length,
    },
    {
      key: "despesa",
      label: "Despesas",
      count: monthTransactions.filter((transaction) => transaction.type === "despesa").length,
    },
  ];

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-heading">
          <div className="breadcrumb">
            <span>~</span>
            <span className="slash">/</span>
            <span>dashboard</span>
            <span className="slash">/</span>
            <span className="current">financas.db</span>
          </div>
          <h1 className="page-title">Finanças</h1>
          <p className="page-subtitle">
            {balance >= 0
              ? `Você fechou ${monthLabel(activeDate)} com saldo positivo.`
              : `Atenção: ${monthLabel(activeDate)} está no negativo.`}{" "}
            {monthTransactions.length} movimentaç{monthTransactions.length === 1 ? "ão" : "ões"} no
            período.
          </p>
        </div>
        <div className="page-actions">
          <div className="month-switcher">
            <button
              type="button"
              onClick={() => setMonthOffset((offset) => offset - 1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="month-label">{monthLabel(activeDate)}</span>
            <button
              type="button"
              onClick={() => setMonthOffset((offset) => Math.min(0, offset + 1))}
              disabled={isCurrentMonth}
              aria-label="Próximo mês"
            >
              <ChevronRight size={14} />
            </button>
            {!isCurrentMonth ? (
              <button
                type="button"
                className="month-reset"
                onClick={() => setMonthOffset(0)}
              >
                Hoje
              </button>
            ) : null}
          </div>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={14} />
            Nova movimentação
          </button>
        </div>
      </div>

      <div className="content-grid">
        <div className="col-5">
          <Panel title="Resumo do mês" dotColor="var(--teal)">
            <div className="finance-summary">
              <div>
                <div className="balance-label">
                  <Wallet size={11} />
                  saldo em {monthShort(activeDate)}
                </div>
                <div className={`balance-value${balance < 0 ? " negative" : ""}`}>
                  {formatCurrency(balance)}
                </div>
              </div>

              <div className="finance-kpis">
                <div className="finance-kpi">
                  <div className="finance-kpi-label">
                    <ArrowDownLeft size={10} style={{ color: "var(--green)" }} />
                    Receitas
                  </div>
                  <div className="finance-kpi-value positive">{formatCurrency(income)}</div>
                </div>
                <div className="finance-kpi">
                  <div className="finance-kpi-label">
                    <ArrowUpRight size={10} style={{ color: "var(--red)" }} />
                    Despesas
                  </div>
                  <div className="finance-kpi-value negative">{formatCurrency(expense)}</div>
                </div>
              </div>

              {budget > 0 ? (
                <div className="budget-block">
                  <div className="budget-top">
                    <span>Orçamento mensal</span>
                    <strong>
                      {formatCurrency(expense)} / {formatCurrency(budget)}
                    </strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(budgetUsage)}
                    aria-label={`Orçamento usado: ${Math.round(budgetUsage)}%`}
                  >
                    <div
                      className={`progress-fill ${budgetTone}`}
                      style={{ width: `${Math.min(100, budgetUsage)}%` }}
                    />
                  </div>
                  <div className="budget-top">
                    <span>{Math.round(budgetUsage)}% usado</span>
                    <span>
                      {expense <= budget
                        ? `${formatCurrency(budget - expense)} disponível`
                        : `${formatCurrency(expense - budget)} acima`}
                    </span>
                  </div>
                </div>
              ) : (
                <Link href="/configuracoes" className="link-btn">
                  Definir orçamento mensal <ChevronRight size={11} />
                </Link>
              )}
            </div>
          </Panel>
        </div>

        <div className="col-7">
          <Panel
            title="Gastos por categoria"
            subtitle={monthLabel(activeDate)}
            dotColor="var(--red)"
          >
            {expenseSlices.length > 0 ? (
              <div className="donut-layout">
                <DonutChart
                  data={expenseSlices}
                  centerValue={formatCurrency(expense)}
                  centerLabel="despesas"
                />
                <DonutLegend data={expenseSlices} maxItems={7} />
              </div>
            ) : (
              <EmptyState
                icon={<ChartPie size={17} />}
                title="Sem despesas neste mês"
                text="Seus gastos aparecem aqui separados por categoria."
                action={
                  <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                    <Plus size={12} /> Lançar despesa
                  </button>
                }
              />
            )}
          </Panel>
        </div>

        <div className="col-12">
          <Panel title="Últimos 6 meses" subtitle="receitas vs. despesas" dotColor="var(--blue)">
            <MonthBars months={chartMonths} />
          </Panel>
        </div>
      </div>

      <div className="media-toolbar">
        <div className="chips scroll" role="group" aria-label="Filtrar movimentações">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`chip${typeFilter === option.key ? " active" : ""}`}
              onClick={() => setTypeFilter(option.key)}
              aria-pressed={typeFilter === option.key}
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
            placeholder="Buscar movimentação..."
            aria-label="Buscar movimentação"
          />
        </div>
      </div>

      <Panel
        title="Movimentações"
        subtitle={`${filteredTransactions.length} ${filteredTransactions.length === 1 ? "registro" : "registros"}`}
        dotColor="var(--accent)"
        action={
          <button type="button" className="panel-action" onClick={openNew}>
            <Plus size={11} />
            Nova
          </button>
        }
      >
        {groupedTransactions.length > 0 ? (
          <div className="tx-groups">
            {groupedTransactions.map(([date, transactions]) => {
              const dayNet = sum(
                transactions.map((transaction) =>
                  transaction.type === "receita" ? transaction.amount : -transaction.amount,
                ),
              );
              return (
                <div className="tx-group" key={date}>
                  <div className="tx-day-label">
                    <span>{formatDayLabel(date)}</span>
                    <span className={dayNet >= 0 ? "positive" : "negative"}>
                      {dayNet >= 0 ? "+" : "−"} {formatCurrency(Math.abs(dayNet))}
                    </span>
                  </div>
                  {transactions.map((transaction) => (
                    <button
                      type="button"
                      className="tx-row"
                      key={transaction.id}
                      onClick={() => {
                        setEditing(transaction);
                        setFormOpen(true);
                      }}
                      aria-label={`Editar movimentação: ${transaction.description}`}
                    >
                      <span
                        className="tx-icon"
                        style={{ "--cat-color": categoryColor(transaction.category) } as React.CSSProperties}
                      >
                        {transaction.type === "receita" ? (
                          <ArrowDownLeft size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}
                      </span>
                      <span className="tx-main">
                        <span className="tx-description">{transaction.description}</span>
                        <span className="tx-meta">
                          <span
                            className="cat-dot"
                            style={{ "--cat-color": categoryColor(transaction.category) } as React.CSSProperties}
                          />
                          {transaction.category}
                        </span>
                      </span>
                      <span className={`tx-amount${transaction.type === "receita" ? " income" : ""}`}>
                        {transaction.type === "receita" ? "+" : "−"}{" "}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Receipt size={17} />}
            title={search || typeFilter !== "todas" ? "Nada encontrado" : "Mês sem movimentações"}
            text={
              search || typeFilter !== "todas"
                ? "Ajuste o filtro ou limpe a busca."
                : "Lance a primeira receita ou despesa deste mês."
            }
            action={
              <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                <Plus size={12} /> Nova movimentação
              </button>
            }
          />
        )}
      </Panel>

      <TransactionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        transaction={editing}
        defaultType="despesa"
      />
    </div>
  );
}
