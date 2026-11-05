"use client";

import { useEffect, type ReactNode } from "react";
import { useTema } from "@/lib/tema";

/** Mantém a classe `dark` do <html> em dia com a escolha de tema */
export function ProvedorTema({ children }: { children: ReactNode }) {
  const { escuro } = useTema();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", escuro);
  }, [escuro]);
  return children;
}
