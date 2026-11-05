"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DadosProvider } from "@/lib/dados";
import { useSessao } from "@/lib/sessao";

// A ficha do lead é a tela que o corretor abre no celular, pelo link do aviso.
// Fora do painel principal: sem menu lateral, em largura de celular.
export default function LeadLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { carregando, sessao } = useSessao();

  useEffect(() => {
    if (!carregando && !sessao) router.replace("/login");
  }, [carregando, sessao, router]);

  if (carregando || !sessao) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }
  return <DadosProvider>{children}</DadosProvider>;
}
