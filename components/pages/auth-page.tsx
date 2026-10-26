"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  ListTodo,
  Target,
  Wallet,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";

export type AuthMode = "login" | "signup" | "recover" | "reset";

type Feedback = { tone: "error" | "success" | "info"; message: string };

const TITLES: Record<
  AuthMode,
  { eyebrow: string; title: string; subtitle: string }
> = {
  login: {
    eyebrow: "ACESSO AO SEU ESPAÇO",
    title: "Bom ter você aqui.",
    subtitle: "Sincronize tarefas, finanças e metas entre seus dispositivos.",
  },
  signup: {
    eyebrow: "Crie sua conta",
    title: "Começar a sincronizar",
    subtitle: "O modo local continua funcionando; a conta é opcional.",
  },
  recover: {
    eyebrow: "Recuperar acesso",
    title: "Esqueci minha senha",
    subtitle: "Enviaremos um link seguro para você criar uma nova senha.",
  },
  reset: {
    eyebrow: "Nova senha",
    title: "Definir uma nova senha",
    subtitle: "Este link é temporário e só pode ser usado uma vez.",
  },
};

function AuthBrand() {
  return (
    <div className="auth-brand">
      <Link href="/" className="auth-wordmark">
        <BrandMark />
        <span>
          dashboard<span>pessoal</span>
        </span>
      </Link>
      <div className="auth-editorial">
        <span className="section-kicker">
          <i /> SUA VIDA, BEM ORGANIZADA
        </span>
        <p>
          Menos dispersão.
          <br />
          Mais <em>direção.</em>
        </p>
        <span className="auth-brand-description">
          Um espaço para suas tarefas, suas finanças
          <br className="desktop-break" /> e tudo o que você quer conquistar.
        </span>
      </div>
      <div
        className="product-preview"
        aria-label="Prévia das áreas do dashboard"
      >
        <div className="preview-topline">
          <span className="preview-tag">SEU ESPAÇO PESSOAL</span>
          <span className="preview-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="preview-heading">
          <strong>Tudo no lugar.</strong>
          <span>Mais clareza para o próximo passo.</span>
        </div>
        <div className="preview-modules">
          <div>
            <span className="preview-icon">
              <ListTodo size={20} />
            </span>
            <strong>Tarefas</strong>
            <span>Priorize o que importa.</span>
            <div className="preview-lines" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div>
            <span className="preview-icon">
              <Wallet size={20} />
            </span>
            <strong>Finanças</strong>
            <span>Enxergue cada escolha.</span>
            <div className="preview-bars" aria-hidden="true">
              {[24, 45, 34, 65, 50, 80, 70].map((height, i) => (
                <i key={i} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div>
            <span className="preview-icon">
              <Target size={20} />
            </span>
            <strong>Metas</strong>
            <span>Dê forma aos planos.</span>
            <div className="preview-goal" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
      <div className="auth-brand-bottom">
        <span>PLANEJE. ORGANIZE. CONQUISTE.</span>
        <span>Seu próximo passo começa aqui.</span>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "Mínimo de 8 caracteres",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-password">
        <input
          id={id}
          className="input"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          minLength={8}
        />
        <button
          type="button"
          className="auth-eye"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const {
    configured,
    loading,
    user,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    resendConfirmation,
  } = useAuth();
  const { signOut, syncNow, pendingCount, online } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const copy = TITLES[mode];
  const isReset = mode === "reset";
  const showAccount = Boolean(user) && !isReset && !sent;

  if (!configured) {
    return (
      <main className="auth-page">
        <div className="auth-frame">
          <AuthBrand />
          <section className="auth-card">
            <span className="auth-icon is-warning">
              <TriangleAlert size={22} />
            </span>
            <span className="auth-eyebrow">Nuvem não configurada</span>
            <h1>O modo local já está funcionando</h1>
            <p className="auth-subtitle">
              Para ativar login e sincronização, preencha as variáveis públicas
              do Supabase no ambiente de build. Nenhuma chave secreta deve ir
              para o navegador.
            </p>
            <pre className="auth-code">
              <code>
                {`NEXT_PUBLIC_SUPABASE_URL=...\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...\nNEXT_PUBLIC_APP_URL=https://seu-dominio.com`}
              </code>
            </pre>
            <p className="auth-hint">
              No desenvolvimento, use <code>.env.local</code>. Na Vercel,
              cadastre as mesmas variáveis em{" "}
              <strong>Settings → Environment Variables</strong> e gere um novo
              deploy.
            </p>
            <Link className="btn btn-primary btn-block" href="/">
              Continuar no modo local
            </Link>
          </section>
          <AuthFooter />
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="auth-page">
        <div className="auth-frame">
          <AuthBrand />
          <section className="auth-card auth-loading" role="status">
            <LoaderCircle className="spin" size={26} />
            <span>Verificando sua sessão...</span>
          </section>
        </div>
      </main>
    );
  }

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.ok) {
      router.replace("/");
      return;
    }
    setFeedback({ tone: "error", message: result.message });
  };

  const submitSignup = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({
        tone: "error",
        message: "Informe seu nome para criar a conta.",
      });
      return;
    }
    if (password.length < 8) {
      setFeedback({
        tone: "error",
        message: "Use pelo menos 8 caracteres na senha.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ tone: "error", message: "As senhas não coincidem." });
      return;
    }

    setBusy(true);
    const result = await signUp(name.trim(), email, password);
    setBusy(false);

    if (!result.ok) {
      setFeedback({ tone: "error", message: result.message });
      return;
    }
    if (result.alreadyRegistered) {
      setFeedback({ tone: "info", message: result.message });
      return;
    }
    if (result.needsConfirmation) {
      setSent(true);
      setFeedback({ tone: "success", message: result.message });
      return;
    }
    setFeedback({ tone: "success", message: result.message });
    router.replace("/");
  };

  const submitRecover = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    const result = await resetPassword(email);
    setBusy(false);
    if (!result.ok) {
      setFeedback({ tone: "error", message: result.message });
      return;
    }
    setSent(true);
    setFeedback({ tone: "success", message: result.message });
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (password.length < 8) {
      setFeedback({
        tone: "error",
        message: "Use pelo menos 8 caracteres na senha.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ tone: "error", message: "As senhas não coincidem." });
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (!result.ok) {
      setFeedback({ tone: "error", message: result.message });
      return;
    }
    setPasswordUpdated(true);
  };

  const resend = async () => {
    if (!email.trim()) {
      setFeedback({
        tone: "error",
        message:
          mode === "recover"
            ? "Informe seu e-mail para reenviar o link de recuperação."
            : "Informe seu e-mail para reenviar a confirmação.",
      });
      return;
    }
    setBusy(true);
    const result =
      mode === "recover"
        ? await resetPassword(email)
        : await resendConfirmation(email);
    setBusy(false);
    setFeedback({
      tone: result.ok ? "success" : "error",
      message: result.message,
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setFeedback(null);

    if (pendingCount > 0) {
      if (!online) {
        setSigningOut(false);
        setFeedback({
          tone: "error",
          message:
            "Existem alterações pendentes e você está offline. Abra Configurações para sair sem sincronizar ou volte quando estiver online.",
        });
        return;
      }
      const synced = await syncNow();
      if (!synced.ok) {
        setSigningOut(false);
        setFeedback({
          tone: "error",
          message: `${synced.message} Abra Configurações para sair sem sincronizar.`,
        });
        return;
      }
    }

    const result = await signOut();
    setSigningOut(false);
    setFeedback({
      tone: result.ok ? "success" : "error",
      message: result.message,
    });
  };

  return (
    <main className="auth-page">
      <div className="auth-frame">
        <AuthBrand />

        <section className="auth-card">
          <Link className="auth-back" href="/">
            <ArrowLeft size={14} />
            Voltar ao dashboard
          </Link>

          {showAccount ? (
            <div className="auth-result">
              <span className="auth-icon is-success">
                <CheckCircle2 size={24} />
              </span>
              <span className="auth-eyebrow">Sessão ativa</span>
              <h1>Você já está conectado</h1>
              <p className="auth-subtitle">
                A conta <strong>{user?.email}</strong> está pronta para
                sincronizar. Abra o dashboard para carregar seus dados.
              </p>
              <Link className="btn btn-primary btn-block" href="/">
                Abrir dashboard
                <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
              >
                {signingOut ? (
                  <LoaderCircle className="spin" size={15} />
                ) : null}
                Sair desta conta
              </button>
            </div>
          ) : mode === "reset" ? (
            passwordUpdated ? (
              <div className="auth-result">
                <span className="auth-icon is-success">
                  <CheckCircle2 size={24} />
                </span>
                <span className="auth-eyebrow">Tudo certo</span>
                <h1>Senha atualizada</h1>
                <p className="auth-subtitle">
                  Use a nova senha na próxima vez que entrar. Sua sessão atual
                  continua ativa.
                </p>
                <Link className="btn btn-primary btn-block" href="/">
                  Abrir dashboard
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                <span className="auth-icon">
                  <LockKeyhole size={22} />
                </span>
                <span className="auth-eyebrow">{copy.eyebrow}</span>
                <h1>{copy.title}</h1>
                <p className="auth-subtitle">{copy.subtitle}</p>

                {!user ? (
                  <div className="auth-result auth-result-compact">
                    <div className="auth-note is-warning">
                      <TriangleAlert size={16} />
                      <span>
                        Este link expirou ou a sessão de recuperação não foi
                        encontrada. Solicite um novo link para continuar.
                      </span>
                    </div>
                    <Link
                      className="btn btn-primary btn-block"
                      href="/recuperar-senha"
                    >
                      Pedir novo link
                    </Link>
                  </div>
                ) : (
                  <form
                    className="auth-form"
                    onSubmit={(event) => void submitReset(event)}
                  >
                    <PasswordField
                      id="new-password"
                      label="Nova senha"
                      value={password}
                      onChange={setPassword}
                      autoComplete="new-password"
                    />
                    <PasswordField
                      id="confirm-new-password"
                      label="Confirmar nova senha"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                    />
                    {feedback ? <AuthFeedback feedback={feedback} /> : null}
                    <button
                      className="btn btn-primary btn-block"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}
                      Salvar nova senha
                    </button>
                  </form>
                )}
              </>
            )
          ) : sent ? (
            <div className="auth-result">
              <span className="auth-icon is-success">
                <Mail size={24} />
              </span>
              <span className="auth-eyebrow">Verifique seu e-mail</span>
              <h1>
                {mode === "recover"
                  ? "Link de recuperação enviado"
                  : "Confirme seu cadastro"}
              </h1>
              <p className="auth-subtitle">
                Enviamos as instruções para <strong>{email}</strong>. Abra o
                link no mesmo dispositivo ou em outro navegador. Confira também
                a pasta de spam.
              </p>
              {feedback ? <AuthFeedback feedback={feedback} /> : null}
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => void resend()}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Mail size={15} />
                )}
                Reenviar e-mail
              </button>
              <Link className="btn btn-ghost btn-block" href="/entrar">
                Voltar para entrar
              </Link>
            </div>
          ) : (
            <>
              <span className="auth-icon">
                {mode === "login" ? (
                  <Cloud size={22} />
                ) : mode === "signup" ? (
                  <UserRound size={22} />
                ) : (
                  <Mail size={22} />
                )}
              </span>
              <span className="auth-eyebrow">{copy.eyebrow}</span>
              <h1>{copy.title}</h1>
              <p className="auth-subtitle">{copy.subtitle}</p>

              {mode === "login" ? (
                <form
                  className="auth-form"
                  onSubmit={(event) => void submitLogin(event)}
                >
                  <div className="field">
                    <label className="label" htmlFor="login-email">
                      E-mail
                    </label>
                    <input
                      id="login-email"
                      className="input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="voce@exemplo.com"
                      required
                    />
                  </div>
                  <PasswordField
                    id="login-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                  />
                  <div className="auth-links">
                    <Link href="/recuperar-senha">Esqueci minha senha</Link>
                  </div>
                  {feedback ? <AuthFeedback feedback={feedback} /> : null}
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <ArrowRight size={15} />
                    )}
                    Entrar
                  </button>
                  {feedback?.message.toLowerCase().includes("confirme") ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-block"
                      onClick={() => void resend()}
                      disabled={busy}
                    >
                      Reenviar confirmação
                    </button>
                  ) : null}
                </form>
              ) : mode === "signup" ? (
                <form
                  className="auth-form"
                  onSubmit={(event) => void submitSignup(event)}
                >
                  <div className="field">
                    <label className="label" htmlFor="signup-name">
                      Nome
                    </label>
                    <input
                      id="signup-name"
                      className="input"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="Como devemos chamar você?"
                      maxLength={60}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="signup-email">
                      E-mail
                    </label>
                    <input
                      id="signup-email"
                      className="input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="voce@exemplo.com"
                      required
                    />
                  </div>
                  <PasswordField
                    id="signup-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    id="signup-confirm"
                    label="Confirmar senha"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                  />
                  {feedback ? <AuthFeedback feedback={feedback} /> : null}
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <UserRound size={15} />
                    )}
                    Criar conta
                  </button>
                </form>
              ) : (
                <form
                  className="auth-form"
                  onSubmit={(event) => void submitRecover(event)}
                >
                  <div className="field">
                    <label className="label" htmlFor="recover-email">
                      E-mail da conta
                    </label>
                    <input
                      id="recover-email"
                      className="input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="voce@exemplo.com"
                      required
                    />
                  </div>
                  {feedback ? <AuthFeedback feedback={feedback} /> : null}
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <Mail size={15} />
                    )}
                    Enviar link de recuperação
                  </button>
                </form>
              )}

              <div className="auth-switch">
                {mode === "login" ? (
                  <>
                    Ainda não tem conta?{" "}
                    <Link href="/criar-conta">Criar conta</Link>
                  </>
                ) : (
                  <>
                    Já tem conta? <Link href="/entrar">Entrar</Link>
                  </>
                )}
              </div>
            </>
          )}
        </section>

        <AuthFooter />
      </div>
    </main>
  );
}

function AuthFeedback({ feedback }: { feedback: Feedback }) {
  return (
    <div className={`auth-feedback is-${feedback.tone}`} role="status">
      {feedback.tone === "error" ? (
        <TriangleAlert size={16} />
      ) : feedback.tone === "info" ? (
        <Info size={16} />
      ) : (
        <CheckCircle2 size={16} />
      )}
      <span>{feedback.message}</span>
    </div>
  );
}

function AuthFooter() {
  return (
    <footer className="auth-footer">
      <Link href="/">Continuar no modo local</Link>
    </footer>
  );
}
