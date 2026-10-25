"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { SHOPPING_CATEGORIES, SHOPPING_UNITS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { ShoppingCategory, ShoppingItem, ShoppingUnit } from "@/lib/types";
import { formatAmountInput, parseAmount } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type ShoppingFormModalProps = {
  open: boolean;
  onClose: () => void;
  item?: ShoppingItem | null;
  defaultCategory?: ShoppingCategory;
};

export function ShoppingFormModal({
  open,
  onClose,
  item = null,
  defaultCategory = "Mercado",
}: ShoppingFormModalProps) {
  const { addShoppingItem, updateShoppingItem, deleteShoppingItem } = useStore();
  const formId = useId();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<ShoppingUnit>("un");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>(defaultCategory);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setQuantity(item ? String(item.quantity).replace(".", ",") : "1");
    setUnit(item?.unit ?? "un");
    setPrice(item?.price != null ? formatAmountInput(item.price) : "");
    setCategory(item?.category ?? defaultCategory);
    setError("");
    setConfirmDelete(false);
  }, [open, item, defaultCategory]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Informe o item que você quer comprar.");
      return;
    }
    const parsedQuantity = parseAmount(quantity);
    if (!parsedQuantity || parsedQuantity <= 0) {
      setError("A quantidade precisa ser maior que zero.");
      return;
    }

    const draft = {
      name: cleanName,
      quantity: parsedQuantity,
      unit,
      price: price.trim() ? parseAmount(price) : null,
      category,
    };

    if (item) {
      updateShoppingItem(item.id, draft);
    } else {
      addShoppingItem(draft);
    }
    onClose();
  }

  function handleDelete() {
    if (!item) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteShoppingItem(item.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Editar item" : "Novo item de compra"}
      subtitle={item ? "Ajuste quantidade, preço ou categoria." : "Adicione à lista e marque quando comprar."}
      footer={
        <>
          {item ? (
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
            {item ? "Salvar" : "Adicionar"}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="shop-name">
            Item
          </label>
          <input
            id="shop-name"
            className="input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Ex.: café em grãos"
            data-autofocus
            maxLength={120}
            required
          />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="shop-quantity">
              Quantidade
            </label>
            <input
              id="shop-quantity"
              className="input"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="1"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="shop-unit">
              Unidade
            </label>
            <select
              id="shop-unit"
              className="input"
              value={unit}
              onChange={(event) => setUnit(event.target.value as ShoppingUnit)}
            >
              {SHOPPING_UNITS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="shop-category">
              Categoria
            </label>
            <select
              id="shop-category"
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value as ShoppingCategory)}
            >
              {SHOPPING_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="shop-price">
              Preço <span className="optional">opcional</span>
            </label>
            <div className="input-affix">
              <span className="affix">R$</span>
              <input
                id="shop-price"
                className="input"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        <p className="field-hint">
          O preço é por unidade. O total estimado da lista multiplica pela quantidade.
        </p>
      </form>
    </Modal>
  );
}
