"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarCheck, Flame, MessageSquare, PauseCircle, Send, WifiOff } from "lucide-react";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { Pagina } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Button } from "@/components/ui/button";
import { useAgora } from "@/lib/agora";
import { diaLongo, haQuanto, hojeISO } from "@/lib/datas";
import { diasSemEscala } from "@/lib/regras";
import { primeiroNome } from "@/lib/telefone";
import { AREAS, ROTULO_AREA, ROTULO_INTENCAO } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";

function Numero({ icone, rotulo, valor, detalhe }: { icone: ReactNode; rotulo: string; valor: number; detalhe?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icone}
        {rotulo}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{valor}</p>
      {detalhe ? <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

function Bloco({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {acao}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function Inicio() {
  const { eu, ehAdmin, leads, conversas, estado, porId } = useVisao();
  const hoje = hojeISO();
  const agora = useAgora();
  const leadsHoje = leads.filter((l) => new Date(l.encaminhadoEm).toDateString() === new Date(agora).toDateString());
  const quentesHoje = leadsHoje.filter((l) => l.nivel === "quente").length;
  const ativas = conversas.filter((c) => agora - new Date(c.ultimaMensagemEm).getTime() < 86400000).length;
  const pausadas = conversas.filter((c) => c.canal === "bot" && c.botPausadoAte && new Date(c.botPausadoAte).getTime() > agora).length;

  const escaladosHoje = estado.escala.filter((i) => i.data === hoje && porId.get(i.colaboradorId)?.ativo);
  const semEscala = ehAdmin ? diasSemEscala(estado.escala, estado.colaboradores, hoje, 14) : [];
  const desconectados = ehAdmin
    ? estado.colaboradores.filter((c) => c.ativo && c.papel === "corretor" && c.statusWhatsApp !== "conectado" && c.sessaoCaiuEm)
    : [];
  const recentes = [...leads].sort((a, b) => b.encaminhadoEm.localeCompare(a.encaminhadoEm)).slice(0, 6);

  const minhaEscala = estado.escala.filter((i) => i.data === hoje && i.colaboradorId === eu?.id);
  const equipeAtendendo = estado.colaboradores.filter((c) => c.ativo && c.papel === "corretor");

  return (
    <Pagina titulo={`Olá, ${primeiroNome(eu?.nome ?? "")}`} descricao={diaLongo(hoje)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {desconectados.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-200">
            <WifiOff className="size-4 shrink-0" />
            <p className="flex-1">
              O WhatsApp de <strong>{c.nome}</strong> desconectou {c.sessaoCaiuEm ? haQuanto(c.sessaoCaiuEm) : ""}. As conversas dele pararam de aparecer.
            </p>
            <Button size="sm" variant="outline" render={<Link href={`/equipe/${c.id}`} />} nativeButton={false}>
              Reconectar
            </Button>
          </div>
        ))}

        {!ehAdmin ? (
          <div className="flex items-center gap-3 rounded-xl border bg-accent/50 px-4 py-3 text-sm">
            <CalendarCheck className="size-4 shrink-0 text-primary" />
            {minhaEscala.length ? (
              <p>
                Você está <strong>escalado hoje</strong> em {minhaEscala.map((i) => ROTULO_AREA[i.area]).join(" e ")}. Os leads sorteados chegam no seu WhatsApp e aparecem aqui.
              </p>
            ) : (
              <p>Você não está na escala de hoje. Leads de contatos que você já atendeu nos últimos 7 dias continuam indo para você.</p>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero icone={<Send className="size-3.5" />} rotulo={ehAdmin ? "Leads hoje" : "Meus leads hoje"} valor={leadsHoje.length} detalhe={ehAdmin ? "encaminhados a corretores" : "recebidos por você"} />
          <Numero icone={<Flame className="size-3.5" />} rotulo="Leads quentes hoje" valor={quentesHoje} detalhe="prontos para o corretor" />
          <Numero icone={<MessageSquare className="size-3.5" />} rotulo="Conversas nas últimas 24 h" valor={ativas} />
          <Numero icone={<PauseCircle className="size-3.5" />} rotulo="Bot pausado" valor={pausadas} detalhe="corretor já assumiu" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {ehAdmin ? (
            <Bloco
              titulo="Escala de hoje"
              acao={
                <Button variant="ghost" size="xs" render={<Link href="/escala" />} nativeButton={false}>
                  Abrir escala <ArrowRight />
                </Button>
              }
            >
              <ul className="space-y-3">
                {AREAS.map((area) => {
                  const nomes = escaladosHoje.filter((i) => i.area === area);
                  return (
                    <li key={area} className="flex items-start gap-3">
                      <span className="w-20 shrink-0 pt-0.5">
                        <EtiquetaArea area={area} />
                      </span>
                      {nomes.length ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {nomes.map((i) => (
                            <span key={i.id} className="flex items-center gap-1.5 text-sm">
                              <AvatarPessoa nome={porId.get(i.colaboradorId)?.nome ?? "?"} tamanho="sm" />
                              {porId.get(i.colaboradorId)?.nome}
                              <span className="text-xs text-muted-foreground tabular-nums">· {i.recebidos} hoje</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Ninguém escalado: os leads vão para a recepção.</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {semEscala.length ? (
                <Link href="/escala" className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <strong>{semEscala.length} dias</strong> dos próximos 14 têm área sem corretor escalado. Os leads dessas áreas vão para a recepção.
                  </span>
                </Link>
              ) : null}
            </Bloco>
          ) : null}

          {ehAdmin ? (
            <Bloco titulo="Leads por corretor">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Corretor</th>
                    <th className="pb-2 text-right font-medium">Hoje</th>
                    <th className="pb-2 text-right font-medium">14 dias</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {equipeAtendendo.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          <AvatarPessoa nome={c.nome} tamanho="sm" />
                          {c.nome}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{leadsHoje.filter((l) => l.colaboradorId === c.id).length}</td>
                      <td className="py-2 text-right tabular-nums">{leads.filter((l) => l.colaboradorId === c.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Bloco>
          ) : null}

          <div className={ehAdmin ? "lg:col-span-2" : "lg:col-span-2"}>
            <Bloco
              titulo={ehAdmin ? "Últimos encaminhamentos" : "Meus últimos leads"}
              acao={
                <Button variant="ghost" size="xs" render={<Link href="/auditoria" />} nativeButton={false}>
                  Ver todos <ArrowRight />
                </Button>
              }
            >
              <ul className="divide-y">
                {recentes.map((l) => (
                  <li key={l.id}>
                    <Link href={`/auditoria?lead=${l.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-muted/40">
                      <AvatarPessoa nome={l.nome || l.nomeWhatsApp} tamanho="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{l.nome || l.nomeWhatsApp}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ROTULO_INTENCAO[l.intencao]}
                          {l.regiao ? ` · ${l.regiao}` : ""}
                        </span>
                      </span>
                      <EtiquetaNivel nivel={l.nivel} />
                      {ehAdmin ? <span className="hidden w-36 truncate text-xs text-muted-foreground sm:block">{porId.get(l.colaboradorId)?.nome}</span> : null}
                      <span className="w-24 text-right text-xs text-muted-foreground">{haQuanto(l.encaminhadoEm)}</span>
                    </Link>
                  </li>
                ))}
                {recentes.length === 0 ? <li className="py-6 text-center text-sm text-muted-foreground">Nenhum lead ainda.</li> : null}
              </ul>
            </Bloco>
          </div>
        </div>
      </div>
    </Pagina>
  );
}
