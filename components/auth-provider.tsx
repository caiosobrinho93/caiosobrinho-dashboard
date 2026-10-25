"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BASE_PATH } from "@/lib/base-path";
import { isNativeApp } from "@/lib/native";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthActionResult = {
  ok: boolean;
  message: string;
  needsConfirmation?: boolean;
  alreadyRegistered?: boolean;
};

type AuthValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  resendConfirmation: (email: string) => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthValue | null>(null);

function authRedirect(path: string): string | undefined {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configured) {
    return `${configured}${path.startsWith("/") ? path : `/${path}`}`;
  }
  if (typeof window === "undefined") return undefined;
  // No WebView do Android, `window.location.origin` é https://localhost e o
  // link de confirmação abriria no navegador externo. Sem uma URL pública
  // configurada, deixamos o Supabase usar a Site URL do projeto.
  if (isNativeApp()) return undefined;
  return `${window.location.origin}${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  }
  if (normalized.includes("user already registered")) {
    return "Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.";
  }
  if (normalized.includes("password should be at least")) {
    const match = message.match(/at least (\d+)/i);
    return match
      ? `A senha precisa ter pelo menos ${match[1]} caracteres.`
      : "A senha informada é muito curta.";
  }
  if (normalized.includes("new password should be different")) {
    return "Escolha uma senha diferente da atual.";
  }
  if (normalized.includes("signups not allowed")) {
    return "O cadastro está desativado no Supabase.";
  }
  if (
    normalized.includes("rate limit") ||
    normalized.includes("for security purposes") ||
    normalized.includes("too many requests")
  ) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }
  if (normalized.includes("unable to validate email") || normalized.includes("invalid email")) {
    return "Informe um e-mail válido.";
  }
  if (normalized.includes("auth session missing") || normalized.includes("session not found")) {
    return "Este link expirou. Solicite um novo e-mail de recuperação.";
  }
  if (normalized.includes("email link is invalid or has expired")) {
    return "Este link expirou ou já foi usado. Solicite um novo e-mail.";
  }
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "Sem conexão com o serviço de autenticação. Verifique sua internet.";
  }

  return message || "Não foi possível concluir a operação. Tente novamente.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;

    const subscription = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    }).data.subscription;

    void client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(() => {
    const unavailable: AuthActionResult = {
      ok: false,
      message: "Supabase não configurado. Preencha as variáveis de ambiente para usar a conta.",
    };

    return {
      configured,
      loading,
      user,
      session,
      signIn: async (email, password) => {
        const client = getSupabaseClient();
        if (!client) return unavailable;
        const { error } = await client.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) return { ok: false, message: translateAuthError(error.message) };
        return { ok: true, message: "Login realizado." };
      },
      signUp: async (name, email, password) => {
        const client = getSupabaseClient();
        if (!client) return unavailable;
        const { data, error } = await client.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name:
                name.trim() ||
                email.trim().split("@")[0]?.trim() ||
                "Você",
            },
            emailRedirectTo: authRedirect("/entrar/"),
          },
        });
        if (error) return { ok: false, message: translateAuthError(error.message) };

        const alreadyRegistered =
          Boolean(data.user) && Array.isArray(data.user?.identities) && data.user.identities.length === 0;

        if (alreadyRegistered) {
          return {
            ok: true,
            alreadyRegistered: true,
            message:
              "Este e-mail já tem uma conta. Use “Entrar” ou “Esqueci minha senha” para acessar.",
          };
        }

        if (data.session) {
          return { ok: true, message: "Conta criada e sessão iniciada." };
        }

        return {
          ok: true,
          message:
            "Conta criada. Enviamos um link de confirmação para o seu e-mail. Abra o link antes de entrar.",
          needsConfirmation: true,
        };
      },
      signOut: async () => {
        const client = getSupabaseClient();
        if (!client) return unavailable;
        const { error } = await client.auth.signOut();
        if (error) return { ok: false, message: translateAuthError(error.message) };
        return { ok: true, message: "Você saiu da conta." };
      },
      resetPassword: async (email) => {
        const client = getSupabaseClient();
        if (!client) return unavailable;
        const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: authRedirect("/redefinir-senha/"),
        });
        if (error) return { ok: false, message: translateAuthError(error.message) };
        return {
          ok: true,
          message:
            "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Confira também o spam.",
        };
      },
      updatePassword: async (password) => {
        const client = getSupabaseClient();
        if (!client) return unavailable;
        const { error } = await client.auth.updateUser({ password });
        if (error) return { ok: false, message: translateAuthError(error.message) };
        return { ok: true, message: "Senha atualizada. Você já pode usar a nova senha." };
      },
      resendConfirmation: async (email) => {
        const client = getSupabaseClient();
        if (!client) return unavailable;
        const { error } = await client.auth.resend({
          type: "signup",
          email: email.trim().toLowerCase(),
          options: { emailRedirectTo: authRedirect("/entrar/") },
        });
        if (error) return { ok: false, message: translateAuthError(error.message) };
        return {
          ok: true,
          message: "Reenviamos o link de confirmação. Confira a caixa de entrada e o spam.",
        };
      },
    };
  }, [configured, loading, user, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider");
  }
  return context;
}
