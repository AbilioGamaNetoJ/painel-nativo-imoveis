"use client";

import { useMemo } from "react";
import { useDados } from "./dados";
import { useSessao } from "./sessao";
import type { Colaborador, Conversa, Lead, Mensagem } from "./tipos";

/**
 * O que o perfil logado enxerga. Na prévia é um filtro na tela; depois do contrato
 * quem decide é a RLS do Supabase, e este filtro vira só conveniência de interface.
 *
 * - Admin: tudo.
 * - Corretor: a conversa do WhatsApp dele, os leads que recebeu e a conversa do bot
 *   com esses leads (somente leitura).
 */
export function useVisao() {
  const { estado } = useDados();
  const { sessao } = useSessao();

  return useMemo(() => {
    const porId = new Map<string, Colaborador>(estado.colaboradores.map((c) => [c.id, c]));
    const eu = sessao ? (porId.get(sessao.colaboradorId) ?? null) : null;
    const ehAdmin = sessao?.papel === "admin";

    const leadsPorId = new Map<string, Lead>(estado.leads.map((l) => [l.id, l]));
    const mensagensPorConversa = new Map<string, Mensagem[]>();
    for (const m of estado.mensagens) {
      const lista = mensagensPorConversa.get(m.conversaId);
      if (lista) lista.push(m);
      else mensagensPorConversa.set(m.conversaId, [m]);
    }

    const meusLeadIds = new Set(estado.leads.filter((l) => l.colaboradorId === eu?.id).map((l) => l.id));
    const leads = ehAdmin ? estado.leads : estado.leads.filter((l) => meusLeadIds.has(l.id));
    const conversas: Conversa[] = ehAdmin
      ? estado.conversas
      : estado.conversas.filter((c) =>
          c.canal === "corretor" ? c.colaboradorId === eu?.id : c.leadId !== null && meusLeadIds.has(c.leadId),
        );

    return { eu, ehAdmin, porId, leadsPorId, mensagensPorConversa, leads, conversas, estado };
  }, [estado, sessao]);
}

export function nomeDe(porId: Map<string, Colaborador>, id: string | null | undefined) {
  return (id && porId.get(id)?.nome) || "Sem corretor";
}
