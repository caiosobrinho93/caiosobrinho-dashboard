"use client";

import { useEffect, useState } from "react";

export function BootScreen() {
  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-window">
        <div className="boot-titlebar">
          <div className="window-dots" aria-hidden="true">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
          </div>
          <span>dashboard-pessoal — workspace local</span>
        </div>
        <div className="boot-code">
          <div>
            <span className="c-teal">const</span> workspace ={" "}
            <span className="c-blue">await</span> abrir(
            <span className="c-orange">&quot;dashboard-pessoal&quot;</span>);
          </div>
          <div>
            <span className="c-muted">// carregando tarefas, finanças e metas...</span>
          </div>
          <div>
            <span className="c-teal">✓</span> dados encontrados no dispositivo
          </div>
        </div>
        <div className="boot-progress" aria-hidden="true">
          <span />
        </div>
        <div className="boot-foot">
          <span className="status-dot" />
          <span>armazenamento local · sem servidor</span>
        </div>
      </div>
    </div>
  );
}

export function useIntroDelay(ms = 260): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);

  return ready;
}
