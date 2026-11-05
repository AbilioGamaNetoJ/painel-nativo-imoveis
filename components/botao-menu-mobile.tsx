"use client";

import { AvatarPessoa } from "@/components/pessoa";
import { useSidebar } from "@/components/ui/sidebar";
import { useVisao } from "@/lib/visao";

/** No celular o menu do usuário abre pelo avatar; a navegação fica na barra inferior */
export function BotaoMenuMobile() {
  const { eu } = useVisao();
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Abrir menu do usuário"
      className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
    >
      <AvatarPessoa nome={eu?.nome ?? "?"} tamanho="md" />
    </button>
  );
}
