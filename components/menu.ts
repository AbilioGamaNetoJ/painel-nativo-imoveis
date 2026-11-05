"use client";

import { Bot, ClipboardList, Home, MessageSquare, UserRound, UserRoundCheck, Users, type LucideIcon } from "lucide-react";
import { useAgora } from "@/lib/agora";
import { useVisao } from "@/lib/visao";

export interface ItemMenu {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  badge: number;
}

/**
 * Itens de navegação do perfil logado.
 * - `atendimento` e `gestao`: menu lateral (tablet e desktop).
 * - `barra` e `configuracoes`: celular. A barra inferior mostra `barra` e, no fim, o botão
 *   Configurações, que abre `configuracoes`. No celular não existe menu lateral.
 */
export function useMenu() {
  const { ehAdmin, conversas, leads } = useVisao();
  const agora = useAgora();
  const ativas24h = conversas.filter((c) => agora - new Date(c.ultimaMensagemEm).getTime() < 86400000).length;
  const leadsHoje = leads.filter((l) => new Date(l.encaminhadoEm).toDateString() === new Date(agora).toDateString()).length;

  const inicio: ItemMenu = { href: "/inicio", rotulo: "Início", icone: Home, badge: 0 };
  const agentes: ItemMenu = { href: "/agentes", rotulo: "Agentes", icone: Bot, badge: 0 };
  const conversasItem: ItemMenu = { href: "/conversas", rotulo: "Conversas", icone: MessageSquare, badge: ativas24h };
  // o corretor não tem Gestão: a lista dos leads dele continua entre os itens de atendimento
  const leadsItem: ItemMenu = { href: "/auditoria", rotulo: ehAdmin ? "Auditoria" : "Meus leads", icone: ClipboardList, badge: leadsHoje };
  const plantao: ItemMenu = { href: "/plantao", rotulo: "Plantão", icone: UserRoundCheck, badge: 0 };
  const equipe: ItemMenu = { href: "/equipe", rotulo: "Equipe", icone: Users, badge: 0 };
  const perfil: ItemMenu = { href: "/perfil", rotulo: "Perfil", icone: UserRound, badge: 0 };

  if (!ehAdmin) {
    return {
      atendimento: [inicio, conversasItem, leadsItem],
      gestao: [] as ItemMenu[],
      barra: [inicio, conversasItem, leadsItem],
      configuracoes: [perfil],
    };
  }
  return {
    atendimento: [inicio, agentes, conversasItem],
    gestao: [plantao, equipe, leadsItem],
    barra: [inicio, agentes, conversasItem, plantao],
    configuracoes: [perfil, equipe, leadsItem],
  };
}

export function rotaAtiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
