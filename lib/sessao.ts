"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Papel } from "./tipos";

// Na prévia o "login" é a escolha de um perfil, guardada no navegador.
// Depois do contrato isto vira a sessão do Supabase Auth (convite por e-mail).

const CHAVE = "nativo-previa:sessao";
const EVENTO = "nativo-sessao";

export interface Sessao {
  papel: Papel;
  colaboradorId: string;
}

function inscrever(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

function lerBruto(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

/** undefined enquanto o navegador ainda não respondeu (servidor e hidratação) */
export function useSessao(): { carregando: boolean; sessao: Sessao | null } {
  const bruto = useSyncExternalStore<string | null | undefined>(inscrever, lerBruto, () => undefined);
  return useMemo(() => {
    if (bruto === undefined) return { carregando: true, sessao: null };
    if (!bruto) return { carregando: false, sessao: null };
    try {
      return { carregando: false, sessao: JSON.parse(bruto) as Sessao };
    } catch {
      return { carregando: false, sessao: null };
    }
  }, [bruto]);
}

export function useAcoesSessao() {
  const entrar = useCallback((sessao: Sessao) => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(sessao));
    } catch {
      /* navegador sem armazenamento: a prévia continua sem lembrar o perfil */
    }
    window.dispatchEvent(new Event(EVENTO));
  }, []);
  const sair = useCallback(() => {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* idem */
    }
    window.dispatchEvent(new Event(EVENTO));
  }, []);
  return { entrar, sair };
}
