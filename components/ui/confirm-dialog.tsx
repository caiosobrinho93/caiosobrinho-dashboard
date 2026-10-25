"use client";

import { TriangleAlert } from "lucide-react";
import { Modal } from "./modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Essa ação não pode ser desfeita."
      maxWidth={420}
      icon={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            flex: "none",
            borderRadius: 4,
            background: "rgba(244,135,113,0.1)",
            color: "var(--red)",
          }}
        >
          <TriangleAlert size={15} />
        </span>
      }
      footer={
        <>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className="btn btn-danger-solid"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-dim)" }}>{description}</p>
    </Modal>
  );
}
