"use client";

import { useSyncExternalStore } from "react";

// "Agora" estável durante a renderização (o React não deixa chamar Date.now() direto),
// atualizado a cada 30 segundos para os rótulos de tempo e o bot pausado se renovarem.
const PASSO = 30_000;

function inscrever(aviso: () => void) {
  const t = setInterval(aviso, PASSO);
  return () => clearInterval(t);
}

const ler = () => Math.floor(Date.now() / PASSO) * PASSO;

export function useAgora(): number {
  return useSyncExternalStore(inscrever, ler, ler);
}
