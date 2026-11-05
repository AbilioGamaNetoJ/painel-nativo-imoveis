import type { Agente, TipoAgente } from "@/lib/tipos";

export interface FichaAgente {
  canal: string;
  /** nome do fluxo no n8n (n8n/montar-workflows.py) */
  fluxo: string;
  passos: { titulo: string; detalhe: string }[];
  limites: string[];
}

/**
 * O que cada tipo de agente faz, conforme o plano de implementação e o prompt do SDR.
 * Agente que ainda não existe de verdade (bloqueado) não tem ficha: nada é inventado sobre ele.
 */
export function fichaDoAgente(agente: Agente): FichaAgente | null {
  const fichas: Partial<Record<TipoAgente, FichaAgente>> = {
    sdr: {
      canal: "WhatsApp · API oficial da Meta",
      fluxo: "Nativo | SDR — Atendimento",
      passos: [
        { titulo: "Recebe a mensagem", detalhe: "Chega no número do bot pela API oficial da Meta e entra no n8n." },
        { titulo: `${agente.nome} qualifica o contato`, detalhe: "Uma pergunta por vez: o que a pessoa procura, onde, faixa de valor e prazo." },
        { titulo: "Classifica o lead", detalhe: "Quente, morno ou frio, por regra e não pela IA." },
        { titulo: "Sorteia o corretor escalado", detalhe: "Quem recebeu menos no dia entra no sorteio da área certa." },
        { titulo: "Grava na auditoria e nas conversas", detalhe: "Fica registrado para quem foi cada lead, com data e hora." },
        { titulo: "Avisa o corretor", detalhe: "Modelo oficial curto no WhatsApp; a ficha completa fica no painel." },
      ],
      limites: [
        "Não promete preço nem disponibilidade de imóvel.",
        "Não negocia nem agenda visita: isso é com o corretor.",
        "Se apresenta como assistente virtual e confirma que é uma IA se perguntarem.",
      ],
    },
  };
  return fichas[agente.tipo] ?? null;
}
