"use client";

import { useState } from "react";
import { IdCard, Lock, MessageSquare, Power, Send, Zap } from "lucide-react";
import { DetalhesAgente } from "@/components/agentes/detalhes-agente";
import { Mascote } from "@/components/agentes/mascote";
import { PilulaStatus, Placar } from "@/components/agentes/pecas";
import { useAlternarAgente, useNumerosAgente } from "@/components/agentes/use-agente";
import { Button } from "@/components/ui/button";
import { ROTULO_TIPO_AGENTE, type Agente } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/** Cartão quase quadrado: bichinho em cima, informações embaixo e os dois botões */
export function CartaoAgente({ agente }: { agente: Agente }) {
  const [detalhes, setDetalhes] = useState(false);
  const numeros = useNumerosAgente();
  const alternar = useAlternarAgente(agente);

  return (
    <>
      <article className="cartao-agente relative flex aspect-square w-full flex-col overflow-hidden rounded-[2rem] p-4 transition duration-300 motion-safe:hover:-translate-y-1 hover:shadow-xl">
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <PilulaStatus ativo={agente.ativo} bloqueado={agente.bloqueado} className="absolute top-0 left-0" />
          <Mascote acordado={agente.ativo} bloqueado={agente.bloqueado} tamanho={112} />
        </div>

        <div className="mt-2 text-center">
          <h2 className="text-lg leading-tight font-bold">{agente.nome}</h2>
          <p className="text-xs text-muted-foreground">{ROTULO_TIPO_AGENTE[agente.tipo]}</p>
        </div>

        {agente.bloqueado ? (
          <p className="mt-3 flex min-h-[3.75rem] items-center justify-center px-2 text-center text-sm text-muted-foreground">{agente.descricao}</p>
        ) : (
          <div className={cn("mt-3 grid grid-cols-2 gap-2 transition-opacity", !agente.ativo && "opacity-55")}>
            <Placar icone={<MessageSquare />} tom="azul" valor={numeros.conversas24h} rotulo="conversas 24 h" />
            <Placar icone={<Send />} tom="ambar" valor={numeros.leadsHoje} rotulo="leads hoje" />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {agente.bloqueado ? (
            <Button size="lg" variant="outline" disabled className="h-10 rounded-xl font-semibold">
              <Lock />
              Bloqueado
            </Button>
          ) : (
            <Button
              size="lg"
              variant={agente.ativo ? "outline" : "default"}
              onClick={alternar}
              className={cn("h-10 rounded-xl font-semibold", agente.ativo && "border-white/60 bg-white/50 hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10")}
            >
              {agente.ativo ? <Power /> : <Zap />}
              {agente.ativo ? "Desativar" : "Ativar"}
            </Button>
          )}
          <Button size="lg" variant="secondary" onClick={() => setDetalhes(true)} className="h-10 rounded-xl bg-foreground/8 font-semibold hover:bg-foreground/14">
            <IdCard />
            Detalhes
          </Button>
        </div>
      </article>

      <DetalhesAgente agente={agente} aberto={detalhes} aoMudar={setDetalhes} />
    </>
  );
}
