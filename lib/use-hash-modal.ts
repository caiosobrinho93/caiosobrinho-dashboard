"use client";

import { useEffect, useRef } from "react";

export function useOpenOnHash(hash: string, open: () => void) {
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const check = () => {
      if (window.location.hash.replace("#", "") !== hash) return;
      openRef.current();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    };

    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [hash]);
}
