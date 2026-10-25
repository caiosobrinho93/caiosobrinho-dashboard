"use client";

import { useEffect } from "react";
import {
  hapticTap,
  hideNativeSplash,
  isNativeApp,
  prepareNativeShell,
} from "@/lib/native";

const HAPTIC_TARGETS = [
  ".mobile-nav-item",
  ".activity-item",
  ".quick-action",
  ".btn-primary",
  ".segmented button",
  ".accent-swatch",
].join(", ");

export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;

    void prepareNativeShell();
    document.documentElement.classList.add("is-native");

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(":disabled, [aria-disabled='true']")) return;
      if (!event.target.closest(HAPTIC_TARGETS)) return;
      void hapticTap();
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    const splashFallback = window.setTimeout(() => {
      void hideNativeSplash();
    }, 4500);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.clearTimeout(splashFallback);
      document.documentElement.classList.remove("is-native");
      delete document.documentElement.dataset.platform;
    };
  }, []);

  return null;
}
