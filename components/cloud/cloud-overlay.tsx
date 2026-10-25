"use client";

import {
  Cloud,
  Database,
  HardDrive,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";

type Busy = "device" | "cloud" | "retry" | "signout" | null;

export function CloudOverlay() {
  const {
    cloudPhase,
    cloudChoice,
    cloudError,
    online,
    resolveCloudChoice,
    retryCloud,
    signOut,
  } = useStore();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (cloudPhase === "connecting") return;
    setBusy(null);
    if (cloudPhase === "ready" || cloudPhase === "guest") setLocalError(null);
  }, [cloudPhase]);

  useEffect(() => {
    if (!mounted || cloudPhase === "guest" || cloudPhase === "ready") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted, cloudPhase]);

  if (!mounted || cloudPhase === "guest" || cloudPhase === "ready") return null;

  const choose = async (mode: "device" | "cloud") => {
    setBusy(mode);
    setLocalError(null);
    const result = await resolveCloudChoice(mode);
    if (!result.ok) setLocalError(result.message);
    setBusy(null);
  };

  const handleRetry = () => {
    setBusy("retry");
    setLocalError(null);
    retryCloud();
  };

  const handleSignOut = async () => {
    setBusy("signout");
    setLocalError(null);
    const result = await signOut();
    if (!result.ok) setLocalError(result.message);
    setBusy(null);
  };

  const isChoice = cloudPhase === "choice" && Boolean(cloudChoice);
  const isError = cloudPhase === "error";

  return createPortal(
    <div className="cloud-overlay" role="dialog" aria-modal="true" aria-labelledby="cloud-title">
      <div className="cloud-dialog">
        <div className="cloud-dialog-head">
          <span className={`cloud-mark${isError ? " is-error" : ""}`}>
            {isError ? <TriangleAlert size={22} /> : <Cloud size={22} />}
          </span>
          <div>
            <span className="cloud-eyebrow">Conta e sincronização</span>
            <h2 id="cloud-title">
              {isError
                ? "Não foi possível abrir a nuvem"
                : isChoice
                  ? "Sua conta está pronta"
                  : "Conectando à nuvem"}
            </h2>
            {user?.email ? <p className="cloud-email">{user.email}</p> : null}
          </div>
        </div>

        {isError ? (
          <div className="cloud-body">
            <p className="cloud-copy">
              {cloudError ??
                "Os dados continuam salvos neste dispositivo. Você pode tentar novamente ou voltar ao modo local."}
            </p>
            <div className="cloud-note">
              <ShieldCheck size={16} />
              <span>
                Sua sessão continua ativa. Nenhuma alteração local foi apagada por causa deste erro.
              </span>
            </div>
          </div>
        ) : isChoice ? (
          <div className="cloud-body">
            <p className="cloud-copy">
              {cloudChoice?.kind === "both"
                ? "Encontramos registros neste dispositivo e também na sua conta. Escolha como começar; o modo local continuará guardado."
                : "Sua conta ainda não tem registros. Você pode enviar os dados deste dispositivo ou começar com a nuvem vazia."}
            </p>

            <div className="cloud-options">
              <button
                type="button"
                className="cloud-option"
                onClick={() => void choose("device")}
                disabled={busy !== null || !online}
              >
                <span className="cloud-option-icon">
                  <HardDrive size={20} />
                </span>
                <span className="cloud-option-text">
                  <strong>
                    {cloudChoice?.kind === "both" ? "Mesclar este dispositivo" : "Importar este dispositivo"}
                  </strong>
                  <small>
                    {cloudChoice?.localRecords ?? 0} registro(s) locais
                    {cloudChoice?.kind === "both" ? " serão adicionados à nuvem." : " serão enviados para a nuvem."}
                  </small>
                </span>
                {busy === "device" ? <LoaderCircle className="spin" size={18} /> : null}
              </button>

              <button
                type="button"
                className="cloud-option"
                onClick={() => void choose("cloud")}
                disabled={busy !== null || !online}
              >
                <span className="cloud-option-icon">
                  <Database size={20} />
                </span>
                <span className="cloud-option-text">
                  <strong>
                    {cloudChoice?.remoteRecords ? "Usar os dados da nuvem" : "Começar com a nuvem vazia"}
                  </strong>
                  <small>
                    {cloudChoice?.remoteRecords
                      ? `${cloudChoice.remoteRecords} registro(s) da conta serão carregados.`
                      : "Os dados locais continuam disponíveis se você sair da conta."}
                  </small>
                </span>
                {busy === "cloud" ? <LoaderCircle className="spin" size={18} /> : null}
              </button>
            </div>

            {!online ? (
              <div className="cloud-note is-warning">
                <TriangleAlert size={16} />
                <span>Conecte-se à internet para concluir a configuração da nuvem.</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="cloud-body cloud-loading">
            <LoaderCircle className="spin" size={26} />
            <div>
              <strong>{busy === "retry" ? "Tentando novamente..." : "Preparando seus dados..."}</strong>
              <p>
                {busy === "device"
                  ? "Mesclando os registros deste dispositivo com a nuvem."
                  : busy === "cloud"
                    ? "Carregando os registros da sua conta."
                    : "Verificando a sessão e carregando os registros da conta."}
              </p>
            </div>
          </div>
        )}

        {localError ? (
          <div className="cloud-note is-error" role="alert">
            <TriangleAlert size={16} />
            <span>{localError}</span>
          </div>
        ) : null}

        <div className="cloud-actions">
          {isError ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRetry}
                disabled={busy !== null}
              >
                <RefreshCw size={15} className={busy === "retry" ? "spin" : undefined} />
                Tentar novamente
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void handleSignOut()}
                disabled={busy !== null}
              >
                <LogOut size={15} />
                Sair e usar o modo local
              </button>
            </>
          ) : (
            <button
              type="button"
              className="cloud-signout"
              onClick={() => void handleSignOut()}
              disabled={busy !== null}
            >
              <LogOut size={14} />
              Sair da conta
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
