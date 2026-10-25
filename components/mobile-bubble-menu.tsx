"use client";

import {
  Home,
  ListTodo,
  MoreHorizontal,
  Settings,
  ShoppingCart,
  StickyNote,
  Target,
  Video,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hapticTap } from "@/lib/native";

type BubbleItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  color: string;
  badge?: number;
};

const BUBBLE_ITEMS: BubbleItem[] = [
  { href: "/", label: "Início", icon: Home, color: "#3794ff" },
  { href: "/tarefas", label: "Tarefas", icon: ListTodo, color: "#dcdcaa" },
  { href: "/compras", label: "Compras", icon: ShoppingCart, color: "#89d185" },
  { href: "/financas", label: "Finanças", icon: Wallet, color: "#4ec9b0" },
  { href: "/midia", label: "Mídia", icon: Video, color: "#c586c0" },
  { href: "/metas", label: "Metas", icon: Target, color: "#ce9178" },
  { href: "/notas", label: "Notas", icon: StickyNote, color: "#dcdcaa" },
  { href: "/configuracoes", label: "Ajustes", icon: Settings, color: "#9d9d9d" },
];

const BUTTON_SIZE = 52;
const BUBBLE_SIZE = 46;
const STORAGE_KEY = "dashboard_mobile_bubble_pos";

type Position = { x: number; y: number };

export function MobileBubbleMenu({
  pathname,
  pendingTasks,
  pendingShopping,
}: {
  pathname: string;
  pendingTasks: number;
  pendingShopping: number;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
    pointerId: number | null;
  }>({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    hasMoved: false,
    pointerId: null,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calcula limites seguros da tela
  const getBounds = useCallback(() => {
    if (typeof window === "undefined") {
      return { minX: 16, maxX: 300, minY: 60, maxY: 600 };
    }
    const safeTop = 50;
    const safeBottom = 20;
    return {
      minX: 12,
      maxX: window.innerWidth - BUTTON_SIZE - 12,
      minY: safeTop,
      maxY: window.innerHeight - BUTTON_SIZE - safeBottom,
    };
  }, []);

  const clampPosition = useCallback(
    (pos: Position): Position => {
      const bounds = getBounds();
      return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
      };
    },
    [getBounds],
  );

  // Inicializa posição (carrega do localStorage ou canto inferior direito)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPosition(clampPosition(parsed));
          return;
        }
      }
    } catch {
      // Ignora falha de parse
    }

    const bounds = getBounds();
    setPosition({
      x: bounds.maxX,
      y: bounds.maxY,
    });
  }, [clampPosition, getBounds]);

  // Reajusta em caso de resize da tela ou rotação
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => (prev ? clampPosition(prev) : prev));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition]);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Pointer drag events
  const onPointerDown = (e: React.PointerEvent) => {
    // Botão primário apenas
    if (e.button !== 0) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const currentX = position?.x ?? (window.innerWidth - BUTTON_SIZE - 16);
    const currentY = position?.y ?? (window.innerHeight - BUTTON_SIZE - 24);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: currentX,
      originY: currentY,
      hasMoved: false,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (!dragRef.current.hasMoved && distance > 6) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
      if (open) setOpen(false);
    }

    if (dragRef.current.hasMoved) {
      const nextPos = clampPosition({
        x: dragRef.current.originX + deltaX,
        y: dragRef.current.originY + deltaY,
      });
      setPosition(nextPos);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignora erro se ponteiro já perdeu captura
    }

    if (dragRef.current.hasMoved) {
      setIsDragging(false);
      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // Ignora
        }
      }
    } else {
      // Foi um clique / tap!
      void hapticTap();
      setOpen((prev) => !prev);
    }

    dragRef.current.pointerId = null;
    dragRef.current.hasMoved = false;
  };

  const onPointerCancel = () => {
    dragRef.current.pointerId = null;
    dragRef.current.hasMoved = false;
    setIsDragging(false);
  };

  const totalBadges = pendingTasks + pendingShopping;

  // Calcula distribuição dos itens ao redor da bolinha conforme quadrante na tela
  const bubblePositions = useMemo(() => {
    if (typeof window === "undefined" || !position) return [];

    const cx = position.x + BUTTON_SIZE / 2;
    const cy = position.y + BUTTON_SIZE / 2;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Determina quadrante
    const isRight = cx > winW / 2;
    const isBottom = cy > winH / 2;

    // Ângulo central apontando para o meio da tela
    let startAngleDeg = 0;
    let endAngleDeg = 0;

    if (isRight && isBottom) {
      // Canto inferior direito -> leque voltado para cima e para a esquerda
      startAngleDeg = 175;
      endAngleDeg = 275;
    } else if (!isRight && isBottom) {
      // Canto inferior esquerdo -> leque para cima e para a direita
      startAngleDeg = 265;
      endAngleDeg = 365;
    } else if (isRight && !isBottom) {
      // Canto superior direito -> leque para baixo e para a esquerda
      startAngleDeg = 95;
      endAngleDeg = 195;
    } else {
      // Canto superior esquerdo -> leque para baixo e para a direita
      startAngleDeg = -5;
      endAngleDeg = 95;
    }

    // Dividimos os 8 itens em 2 arcos concêntricos de 4 itens cada para caber confortavelmente em qualquer tela
    const innerRadius = 72;
    const outerRadius = 126;

    return BUBBLE_ITEMS.map((item, index) => {
      const isInner = index < 4;
      const arcIndex = isInner ? index : index - 4;
      const count = 4;
      const fraction = count > 1 ? arcIndex / (count - 1) : 0.5;

      // Interpolação do ângulo
      const angleDeg = startAngleDeg + fraction * (endAngleDeg - startAngleDeg);
      const angleRad = (angleDeg * Math.PI) / 180;
      const radius = isInner ? innerRadius : outerRadius;

      const offsetX = Math.cos(angleRad) * radius;
      const offsetY = Math.sin(angleRad) * radius;

      const badgeCount =
        item.href === "/tarefas"
          ? pendingTasks
          : item.href === "/compras"
            ? pendingShopping
            : 0;

      const isActive =
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

      return {
        ...item,
        offsetX,
        offsetY,
        badgeCount,
        isActive,
        delayMs: index * 25,
      };
    });
  }, [position, pathname, pendingTasks, pendingShopping]);

  if (!position) return null;

  return (
    <div className="mobile-bubble-system">
      {/* Overlay escurecido quando aberto */}
      <div
        className={`mobile-bubble-backdrop${open ? " active" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Contêiner das bolhas satélites */}
      <div
        className={`mobile-bubble-orbit${open ? " active" : ""}`}
        style={{
          transform: `translate3d(${position.x + BUTTON_SIZE / 2}px, ${position.y + BUTTON_SIZE / 2}px, 0)`,
        }}
        aria-hidden={!open}
      >
        {bubblePositions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                void hapticTap();
                setOpen(false);
              }}
              className={`mobile-bubble-item${item.isActive ? " current-route" : ""}`}
              style={
                {
                  "--target-x": `${item.offsetX}px`,
                  "--target-y": `${item.offsetY}px`,
                  "--item-color": item.color,
                  "--delay": `${item.delayMs}ms`,
                } as React.CSSProperties
              }
              tabIndex={open ? 0 : -1}
              aria-label={item.label}
            >
              <span className="bubble-icon">
                <Icon size={20} strokeWidth={item.isActive ? 2.2 : 1.8} />
              </span>
              <span className="bubble-label">{item.label}</span>
              {item.badgeCount > 0 ? (
                <span className="bubble-badge" aria-hidden="true">
                  {item.badgeCount > 9 ? "9+" : item.badgeCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Botão flutuante principal (FAB arrastável) */}
      <button
        ref={buttonRef}
        type="button"
        className={`mobile-bubble-fab${open ? " is-open" : ""}${isDragging ? " is-dragging" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-label={open ? "Fechar menu" : "Abrir menu de navegação"}
        aria-expanded={open}
        title="Menu flutuante (arraste para mover)"
      >
        <span className="fab-icon-box">
          <span className={`fab-icon fab-menu${open ? " hidden" : ""}`}>
            <MoreHorizontal size={24} strokeWidth={2.2} />
          </span>
          <span className={`fab-icon fab-close${open ? " visible" : ""}`}>
            <X size={22} strokeWidth={2.4} />
          </span>
        </span>

        {/* Badge no FAB quando fechado */}
        {!open && totalBadges > 0 ? (
          <span className="fab-badge" aria-hidden="true">
            {totalBadges > 9 ? "9+" : totalBadges}
          </span>
        ) : null}
      </button>
    </div>
  );
}
