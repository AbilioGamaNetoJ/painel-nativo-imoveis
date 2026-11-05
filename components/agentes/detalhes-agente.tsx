"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { FlaskConical, Lock, MessageSquare, Pause, Power, ShieldCheck, Target, Send, Zap } from "lucide-react";
import { EtiquetaNivel } from "@/components/etiquetas";
import { fichaDoAgente } from "@/components/agentes/ficha";
import { Mascote } from "@/components/agentes/mascote";
import { PilulaStatus, Placar } from "@/components/agentes/pecas";
import { useAlternarAgente, useNumerosAgente } from "@/components/agentes/use-agente";
import { AvatarPessoa } from "@/components/pessoa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { haQuanto } from "@/lib/datas";
import { ROTULO_INTENCAO, ROTULO_TIPO_AGENTE, type Agente } from "@/lib/tipos";
import { cn } from "@/lib/utils";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

/** Card completo do agente: tudo o que ele faz, os números e os últimos encaminhamentos */
export function DetalhesAgente({ agente, aberto, aoMudar }: { agente: Agente; aberto: boolean; aoMudar: (aberto: boolean) => void }) {
  const numeros = useNumerosAgente();
  const alternar = useAlternarAgente(agente);
  const ficha = agente.bloqueado ? null : fichaDoAgente(agente);
  const alteradoPor = agente.alteradoPorId ? numeros.porId.get(agente.alteradoPorId)?.nome : undefined;
  // o foco vai para o card, não para o primeiro link da lista (que rolaria o card até o meio)
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent ref={cardRef} initialFocus={cardRef} className="max-h-[92svh] gap-0 overflow-y-auto rounded-[1.75rem] p-0 sm:max-w-lg">
        {/* topo: bichinho num palco colorido */}
        <div className="relative overflow-hidden px-5 pt-8 pb-5 text-center">
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 transition-colors duration-500",
              agente.ativo && !agente.bloqueado ? "bg-gradient-to-b from-emerald-400/25 via-emerald-400/5 to-transparent" : "bg-gradient-to-b from-slate-400/15 to-transparent",
            )}
          />
          <Mascote acordado={agente.ativo} bloqueado={agente.bloqueado} tamanho={120} className="relative" />
          <DialogTitle className="relative mt-3 text-xl font-bold">{agente.nome}</DialogTitle>
          <DialogDescription className="relative mt-1 text-xs">{ROTULO_TIPO_AGENTE[agente.tipo]}</DialogDescription>
          <div className="relative mt-3 flex justify-center">
            <PilulaStatus ativo={agente.ativo} bloqueado={agente.bloqueado} />
          </div>
        </div>

        <div className="space-y-5 border-t p-5">
          <p className="text-sm">{agente.descricao}</p>

          {agente.bloqueado ? (
            <p className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" />
              Este agente está bloqueado e ainda não pode ser ativado.
            </p>
          ) : agente.ativo ? null : (
            <p className="rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              Com {agente.nome} dormindo, os contatos novos não recebem resposta automática e nenhum lead é encaminhado para a escala.
            </p>
          )}

          {ficha ? (
            <>
              <Secao titulo="Placar">
                <div className="grid grid-cols-2 gap-2">
                  <Placar icone={<MessageSquare />} tom="azul" valor={numeros.conversas24h} rotulo="conversas em 24 h" />
                  <Placar icone={<Send />} tom="ambar" valor={numeros.leadsHoje} rotulo="leads hoje" />
                  <Placar icone={<Target />} tom="verde" valor={numeros.leadsTotal} rotulo="leads encaminhados" />
                  <Placar icone={<Pause />} tom="violeta" valor={numeros.pausadas} rotulo="conversas pausadas" />
                </div>
              </Secao>

              <Secao titulo="Como atende">
                <ol className="space-y-2.5">
                  {ficha.passos.map((passo, i) => (
                    <li key={passo.titulo} className="flex gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 font-medium">{passo.titulo}</p>
                        <p className="text-xs text-muted-foreground">{passo.detalhe}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Secao>

              <Secao titulo="Limites">
                <ul className="space-y-1.5">
                  {ficha.limites.map((limite) => (
                    <li key={limite} className="flex items-start gap-2 text-sm">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      {limite}
                    </li>
                  ))}
                </ul>
              </Secao>

              <Secao titulo="Últimos encaminhamentos">
                {numeros.recentes.length ? (
                  <ul className="divide-y rounded-xl border">
                    {numeros.recentes.map((lead) => (
                      <li key={lead.id}>
                        <Link href={`/auditoria?lead=${lead.id}`} onClick={() => aoMudar(false)} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60">
                          <AvatarPessoa nome={lead.nome} tamanho="sm" />
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block truncate text-sm font-medium">{lead.nome}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {ROTULO_INTENCAO[lead.intencao]} · para {numeros.porId.get(lead.colaboradorId)?.nome ?? "a recepção"}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <EtiquetaNivel nivel={lead.nivel} />
                            <span className="text-[11px] text-muted-foreground">{haQuanto(lead.encaminhadoEm)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum lead encaminhado ainda.</p>
                )}
              </Secao>

              <Secao titulo="Ficha técnica">
                <dl className="divide-y rounded-xl border text-sm">
                  {[
                    ["Canal", ficha.canal],
                    ["Fluxo no n8n", ficha.fluxo],
                    ["Última alteração", agente.alteradoEm ? `${agente.ativo ? "Ativado" : "Desativado"} ${haQuanto(agente.alteradoEm)}${alteradoPor ? ` por ${alteradoPor}` : ""}` : "Nenhuma"],
                  ].map(([nome, valor]) => (
                    <div key={nome} className="flex items-start justify-between gap-4 px-3 py-2">
                      <dt className="shrink-0 text-muted-foreground">{nome}</dt>
                      <dd className="text-right font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </Secao>

              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
                Demonstração: ativar ou desativar só muda o estado aqui no painel. No sistema real isso liga ou desliga o fluxo no n8n.
              </p>
            </>
          ) : null}
        </div>

        <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t bg-popover p-4">
          {agente.bloqueado ? (
            <Button size="lg" variant="outline" disabled className="h-10 rounded-xl font-semibold">
              <Lock />
              Bloqueado
            </Button>
          ) : (
            <Button size="lg" variant={agente.ativo ? "outline" : "default"} onClick={alternar} className="h-10 rounded-xl font-semibold">
              {agente.ativo ? <Power /> : <Zap />}
              {agente.ativo ? "Desativar" : "Ativar"}
            </Button>
          )}
          <DialogClose render={<Button size="lg" variant="secondary" className="h-10 rounded-xl font-semibold" />}>Fechar</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
