"use client";

import { Play, Minus, X } from "lucide-react";
import type { ReactNode } from "react";

export function WindowDots() {
  return (
    <div className="window-dots" aria-hidden="true">
      <span className="window-dot red" />
      <span className="window-dot yellow" />
      <span className="window-dot green" />
    </div>
  );
}

export function WindowMark({ children }: { children?: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 3,
        background: "linear-gradient(135deg, #3794ff, #0e639c)",
        color: "#fff",
        flex: "none",
      }}
    >
      {children ?? <Play size={10} fill="currentColor" strokeWidth={0} />}
    </span>
  );
}

export function TinyClose() {
  return <X size={12} />;
}

export function TinyMinus() {
  return <Minus size={12} />;
}
