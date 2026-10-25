"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { NativeBridge } from "@/components/native-bridge";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <NativeBridge />
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
