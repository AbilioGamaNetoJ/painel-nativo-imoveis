"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { FaixaDemo } from "@/components/faixa-demo";
import { NavegacaoInferior } from "@/components/navegacao-inferior";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DadosProvider } from "@/lib/dados";
import { useSessao } from "@/lib/sessao";

/** Menu aberto por padrão só em telas largas; no tablet começa minimizado, só com os ícones */
const LARGURA_MENU_ABERTO = 1024;

export default function PainelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { carregando, sessao } = useSessao();

  useEffect(() => {
    if (!carregando && !sessao) router.replace("/login");
  }, [carregando, sessao, router]);

  if (carregando || !sessao) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }

  return (
    <DadosProvider>
      <SidebarProvider defaultOpen={window.innerWidth >= LARGURA_MENU_ABERTO} className="h-svh overflow-hidden">
        <AppSidebar />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <FaixaDemo />
          <div className="min-h-0 flex-1">{children}</div>
          <NavegacaoInferior />
        </SidebarInset>
      </SidebarProvider>
    </DadosProvider>
  );
}
