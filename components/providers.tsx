"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import { NativeBridge } from "@/components/native-bridge";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <NativeBridge />
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </AuthProvider>
  );
}
