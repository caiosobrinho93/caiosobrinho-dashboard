"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { NativeBridge } from "@/components/native-bridge";
import { StoreProvider } from "@/lib/store";
import { AUTH_PATHS } from "@/components/nav";
import { usePathname } from "next/navigation";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <NativeBridge />
        <AuthGuard>{children}</AuthGuard>
      </StoreProvider>
    </AuthProvider>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!loading && !user && !AUTH_PATHS.includes(pathname)) {
      router.replace("/entrar");
    }
  }, [loading, user, router, pathname]);
  if (loading) return null;
  return <>{children}</>;
}
