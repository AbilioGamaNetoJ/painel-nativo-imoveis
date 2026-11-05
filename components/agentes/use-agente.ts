"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAgora } from "@/lib/agora";
import { useDados } from "@/lib/dados";
import type { Agente } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";

/** Números do SDR, tirados dos mesmos dados do resto do painel */
export function useNumerosAgente() {
  const { estado, porId } = useVisao();
  const agora = useAgora();

  return useMemo(() => {
    const hoje = new Date(agora).toDateString();
    const conversas24h = estado.conversas.filter((c) => c.canal === "bot" && agora - new Date(c.ultimaMensagemEm).getTime() < 86400000).length;
    const pausadas = estado.conversas.filter((c) => c.canal === "bot" && c.botPausadoAte && new Date(c.botPausadoAte).getTime() > agora).length;
    const leadsHoje = estado.leads.filter((l) => new Date(l.encaminhadoEm).toDateString() === hoje).length;
    const recentes = [...estado.leads].sort((a, b) => b.encaminhadoEm.localeCompare(a.encaminhadoEm)).slice(0, 3);

    return { conversas24h, pausadas, leadsHoje, leadsTotal: estado.leads.length, recentes, porId };
  }, [estado.conversas, estado.leads, agora, porId]);
}

/** Liga ou desliga o agente. Na prévia só muda o estado; depois do contrato aqui entra a chamada ao n8n. */
export function useAlternarAgente(agente: Agente) {
  const { eu } = useVisao();
  const { alternarAgente } = useDados();

  return () => {
    if (agente.bloqueado) return;
    const ativo = !agente.ativo;
    alternarAgente(agente.id, ativo, eu?.id ?? "");
    if (ativo) toast.success(`${agente.nome} acordou`, { description: "Volta a responder os contatos novos." });
    else toast(`${agente.nome} foi dormir`, { description: "Na demonstração o fluxo do n8n não é alterado." });
  };
}
