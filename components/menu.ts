"use client";

import { CalendarDays, ClipboardList, Home, MessageSquare, Users, type LucideIcon } from "lucide-react";
import { useAgora } from "@/lib/agora";
import { useVisao } from "@/lib/visao";

export interface ItemMenu {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  badge: number;
}

/** Itens de navegação do perfil logado, usados no menu lateral e na barra inferior do celular */
export function useMenu() {
  const { ehAdmin, conversas, leads } = useVisao();
  const agora = useAgora();
  const ativas24h = conversas.filter((c) => agora - new Date(c.ultimaMensagemEm).getTime() < 86400000).length;
  const leadsHoje = leads.filter((l) => new Date(l.encaminhadoEm).toDateString() === new Date(agora).toDateString()).length;

  const atendimento: ItemMenu[] = [
    { href: "/inicio", rotulo: "Início", icone: Home, badge: 0 },
    { href: "/conversas", rotulo: "Conversas", icone: MessageSquare, badge: ativas24h },
    { href: "/auditoria", rotulo: ehAdmin ? "Auditoria" : "Meus leads", icone: ClipboardList, badge: leadsHoje },
  ];
  const gestao: ItemMenu[] = ehAdmin
    ? [
        { href: "/escala", rotulo: "Escala", icone: CalendarDays, badge: 0 },
        { href: "/equipe", rotulo: "Equipe", icone: Users, badge: 0 },
      ]
    : [];
  return { atendimento, gestao };
}

export function rotaAtiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
