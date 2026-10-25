"use client";

import {
  Check,
  MoreHorizontal,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ShoppingFormModal } from "@/components/shopping/shopping-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import {
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_COLORS,
} from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { ShoppingCategory, ShoppingItem } from "@/lib/types";
import { useOpenOnHash } from "@/lib/use-hash-modal";
import { formatCurrency, sum } from "@/lib/utils";

type CategoryFilter = "todos" | ShoppingCategory;

export function ComprasPage() {
  const {
    data,
    addShoppingItem,
    toggleShoppingItem,
    clearCompletedShopping,
  } = useStore();
  const [filter, setFilter] = useState<CategoryFilter>("todos");
  const [quickName, setQuickName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [confirmClearDone, setConfirmClearDone] = useState(false);

  const pending = data.shopping.filter((item) => !item.done);
  const done = data.shopping.filter((item) => item.done);
  const estimate = sum(pending.map((item) => (item.price ?? 0) * item.quantity));

  const visiblePending = useMemo(
    () => pending.filter((item) => filter === "todos" || item.category === filter),
    [pending, filter],
  );
  const visibleDone = useMemo(
    () => done.filter((item) => filter === "todos" || item.category === filter),
    [done, filter],
  );

  const groups = useMemo(
    () =>
      SHOPPING_CATEGORIES.map((category) => ({
        category,
        items: visiblePending.filter((item) => item.category === category),
      })).filter((group) => group.items.length > 0),
    [visiblePending],
  );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  useOpenOnHash("nova", openNew);

  const filterOptions: { key: CategoryFilter; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: pending.length },
    ...SHOPPING_CATEGORIES.map((category) => ({
      key: category,
      label: category,
      count: pending.filter((item) => item.category === category).length,
    })),
  ];

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const name = quickName.trim();
    if (!name) return;
    addShoppingItem({
      name,
      quantity: 1,
      unit: "un",
      price: null,
      category: filter === "todos" ? "Mercado" : filter,
    });
    setQuickName("");
    setFilter("todos");
  }

  function handleClearDone() {
    if (!confirmClearDone) {
      setConfirmClearDone(true);
      return;
    }
    clearCompletedShopping();
    setConfirmClearDone(false);
  }

  function renderItem(item: ShoppingItem) {
    return (
      <div className={`shop-row${item.done ? " done" : ""}`} key={item.id}>
        <button
          type="button"
          className={`shop-check${item.done ? " checked" : ""}`}
          onClick={() => toggleShoppingItem(item.id)}
          aria-label={
            item.done ? `Devolver para a lista: ${item.name}` : `Marcar como comprado: ${item.name}`
          }
          aria-pressed={item.done}
        >
          <Check size={12} strokeWidth={3} />
        </button>
        <button
          type="button"
          className="shop-main"
          onClick={() => {
            setEditing(item);
            setFormOpen(true);
          }}
          aria-label={`Editar item: ${item.name}`}
        >
          <span className="shop-name">{item.name}</span>
          <span className="shop-details">
            {item.quantity.toLocaleString("pt-BR")} {item.unit}
            {item.price != null ? ` × ${formatCurrency(item.price)}` : ""} · {item.category}
          </span>
        </button>
        <span className="shop-price">
          {item.price != null ? formatCurrency(item.price * item.quantity) : "—"}
        </span>
        <button
          type="button"
          className="shop-kebab"
          onClick={() => {
            setEditing(item);
            setFormOpen(true);
          }}
          aria-label={`Mais opções para ${item.name}`}
        >
          <MoreHorizontal size={15} />
        </button>
      </div>
    );
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
            <span className="current">compras.md</span>
          </div>
          <h1 className="page-title">Compras</h1>
          <p className="page-subtitle">
            {pending.length === 0
              ? "Nada na lista. Bom momento para repor a despensa."
              : `${pending.length} item${pending.length === 1 ? "" : "s"} para comprar · estimado ${formatCurrency(
                  estimate,
                )}`}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={14} />
            Adicionar item
          </button>
        </div>
      </div>

      <div className="shop-summary">
        <div className="shop-summary-item">
          <div className="shop-summary-label">Para comprar</div>
          <div className="shop-summary-value">{pending.length}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">Estimado</div>
          <div className="shop-summary-value small">{formatCurrency(estimate)}</div>
        </div>
        <div className="shop-summary-item">
          <div className="shop-summary-label">No carrinho</div>
          <div className="shop-summary-value">{done.length}</div>
        </div>
      </div>

      <form className="quick-add" onSubmit={handleQuickAdd}>
        <Plus size={15} />
        <input
          value={quickName}
          onChange={(event) => setQuickName(event.target.value)}
          placeholder="Adicionar item rápido e pressionar Enter..."
          aria-label="Adicionar item rápido"
          maxLength={120}
        />
        <button type="submit" className="quick-add-submit" disabled={!quickName.trim()}>
          <span>Adicionar</span>
          <span className="kbd">↵</span>
        </button>
      </form>

      <div className="media-toolbar">
        <div className="chips scroll" role="group" aria-label="Filtrar lista de compras">
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
      </div>

      {data.shopping.length === 0 ? (
        <Panel title="Lista de compras" dotColor="var(--green)">
          <EmptyState
            icon={<ShoppingCart size={17} />}
            title="Sua lista está vazia"
            text="Adicione o que falta em casa. O total estimado é calculado automaticamente."
            action={
              <button type="button" className="btn btn-sm btn-secondary" onClick={openNew}>
                <Plus size={12} /> Adicionar primeiro item
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="shop-lists">
          {groups.map((group) => (
            <Panel
              key={group.category}
              title={group.category}
              subtitle={`${group.items.length} ${group.items.length === 1 ? "item" : "itens"}`}
              dotColor={SHOPPING_CATEGORY_COLORS[group.category]}
            >
              <div className="panel-body flush">
                <div className="shop-list">{group.items.map(renderItem)}</div>
              </div>
            </Panel>
          ))}

          {visibleDone.length > 0 ? (
            <Panel
              title="No carrinho"
              subtitle={`${visibleDone.length} ${visibleDone.length === 1 ? "item" : "itens"}`}
              dotColor="var(--green)"
              action={
                <button
                  type="button"
                  className="panel-action"
                  onClick={handleClearDone}
                >
                  <Trash2 size={11} />
                  {confirmClearDone ? "Confirmar?" : "Limpar"}
                </button>
              }
            >
              <div className="panel-body flush">
                <div className="shop-list">{visibleDone.map(renderItem)}</div>
              </div>
            </Panel>
          ) : null}

          {groups.length === 0 && visibleDone.length === 0 ? (
            <Panel title="Lista" dotColor="var(--green)">
              <EmptyState
                icon={<ShoppingCart size={17} />}
                title="Nada nesta categoria"
                text="Troque o filtro para ver os outros itens da lista."
                action={
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setFilter("todos")}
                  >
                    Ver todos os itens
                  </button>
                }
              />
            </Panel>
          ) : null}
        </div>
      )}

      <ShoppingFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editing}
        defaultCategory={filter === "todos" ? "Mercado" : filter}
      />
    </div>
  );
}
