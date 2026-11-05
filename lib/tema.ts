"use client";

import { useCallback, useSyncExternalStore } from "react";

// Tema da prévia: claro, escuro ou o do sistema. Fica no navegador; o script do layout
// aplica a classe `dark` antes da tela aparecer, para não piscar.

export type Tema = "claro" | "escuro" | "sistema";

export const CHAVE_TEMA = "nativo-previa:tema";
const EVENTO = "nativo-tema";
const CONSULTA = "(prefers-color-scheme: dark)";

export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CHAVE_TEMA}')||'claro';var d=t==='escuro'||(t==='sistema'&&matchMedia('${CONSULTA}').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

function lerTema(): Tema {
  try {
    const t = localStorage.getItem(CHAVE_TEMA);
    return t === "escuro" || t === "sistema" ? t : "claro";
  } catch {
    return "claro";
  }
}

function inscreverTema(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

function inscreverSistema(aviso: () => void) {
  const m = window.matchMedia(CONSULTA);
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
}

const sistemaEscuro = () => window.matchMedia(CONSULTA).matches;

export function useTema() {
  const tema = useSyncExternalStore<Tema>(inscreverTema, lerTema, () => "claro");
  const doSistema = useSyncExternalStore(inscreverSistema, sistemaEscuro, () => false);
  const escuro = tema === "escuro" || (tema === "sistema" && doSistema);

  const definirTema = useCallback((novo: Tema) => {
    try {
      localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      /* sem armazenamento: o tema vale até recarregar */
    }
    window.dispatchEvent(new Event(EVENTO));
  }, []);

  return { tema, escuro, definirTema };
}
