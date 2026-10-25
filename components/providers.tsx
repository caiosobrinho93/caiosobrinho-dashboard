"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AUTH_PATHS } from "@/components/app-shell";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { NativeBridge } from "@/components/native-bridge";
import { stripBasePath } from "@/lib/base-path";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <NativeBridge />
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </StoreProvider>
    </AuthProvider>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPath = stripBasePath(pathname).replace(/\/+$/, "") || "/";
  const isAuthRoute = AUTH_PATHS.includes(normalizedPath);

  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      router.replace("/entrar");
    }
  }, [loading, user, router, isAuthRoute]);

  if (loading) return null;
  if (!user && !isAuthRoute) return null;

  return <>{children}</>;
}
