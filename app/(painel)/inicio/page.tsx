"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, MessageSquare, Power, Send, WifiOff } from "lucide-react";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { Pagina } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Button } from "@/components/ui/button";
import { useAgora } from "@/lib/agora";
import { diaLongo, haQuanto, hojeISO } from "@/lib/datas";
import { primeiroNome } from "@/lib/telefone";
import { ROTULO_AREA, ROTULO_INTENCAO, type Area } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { useVisao } from "@/lib/visao";

const TONS = {
  verde: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  ambar: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  azul: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
} as const;

function Numero({
  icone,
  tom,
  rotulo,
  valor,
}: {
  icone: ReactNode;
  tom: keyof typeof TONS;
  rotulo: string;
  valor: number;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-3 shadow-2xs sm:flex-row sm:items-center sm:gap-3.5 sm:p-4">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl [&_svg]:size-4 sm:size-10 sm:[&_svg]:size-5", TONS[tom])}>
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-xl leading-none font-bold tabular-nums sm:text-2xl">{valor}</p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">{rotulo}</p>
      </div>
    </div>
  );
}

function Bloco({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-2xs">
      <header className="flex items-center justify-between gap-2 border-b px-3.5 py-3 sm:px-4">
        <h2 className="truncate text-sm font-semibold">{titulo}</h2>
        {acao}
      </header>
      <div className="min-w-0 flex-1 p-3.5 sm:p-4">{children}</div>
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

  const escaladosHoje = estado.escala.filter((i) => i.data === hoje && porId.get(i.colaboradorId)?.ativo);
  const areasSemCorretor: Area[] = ehAdmin
    ? (["vendas", "locacao", "captacao"] as Area[]).filter((area) => !escaladosHoje.some((i) => i.area === area))
    : [];
  const desconectados = ehAdmin
    ? estado.colaboradores.filter((c) => c.ativo && c.papel === "corretor" && c.statusWhatsApp !== "conectado" && c.sessaoCaiuEm)
    : [];
  const recentes = [...leads].sort((a, b) => b.encaminhadoEm.localeCompare(a.encaminhadoEm)).slice(0, 6);

  const estouLigado = estado.escala.some((i) => i.data === hoje && i.colaboradorId === eu?.id);
  const equipeAtendendo = estado.colaboradores.filter((c) => c.ativo && c.papel === "corretor");

  return (
    <Pagina titulo={`Olá, ${primeiroNome(eu?.nome ?? "")}`} descricao={diaLongo(hoje)}>
      <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-3.5 sm:gap-4">
        {/* Alertas críticos de conexão */}
        {desconectados.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 sm:text-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <WifiOff className="size-4 shrink-0" />
            <p className="min-w-0 flex-1">
              WhatsApp de <strong>{c.nome}</strong> desconectado {c.sessaoCaiuEm ? haQuanto(c.sessaoCaiuEm) : ""}.
            </p>
            <Button size="xs" variant="outline" render={<Link href={`/equipe/${c.id}`} />} nativeButton={false}>
              Reconectar
            </Button>
          </div>
        ))}

        {/* Status rápido para o perfil de corretor */}
        {!ehAdmin ? (
          <div className="flex items-center gap-2.5 rounded-2xl border bg-card px-3.5 py-3 text-xs shadow-2xs sm:text-sm">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                estouLigado ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
              )}
            />
            <p className="min-w-0 flex-1">
              {estouLigado ? (
                <>
                  Você está <strong>de plantão</strong> e recebendo novos leads.
                </>
              ) : (
                <>
                  Você está <strong>fora do plantão</strong> no momento.
                </>
              )}
            </p>
          </div>
        ) : null}

        {/* 3 indicadores essenciais lado a lado mesmo no celular */}
        <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          <Numero
            icone={<Send />}
            tom="verde"
            rotulo={ehAdmin ? "Leads hoje" : "Meus leads"}
            valor={leadsHoje.length}
          />
          <Numero icone={<Flame />} tom="ambar" rotulo="Quentes hoje" valor={quentesHoje} />
          <Numero icone={<MessageSquare />} tom="azul" rotulo="Conversas 24h" valor={ativas} />
        </div>

        {/* Conteúdo principal: Últimos leads + Equipe (unificada) */}
        <div className={cn("grid min-w-0 gap-3.5 sm:gap-4", ehAdmin && "lg:grid-cols-[1.25fr_1fr]")}>
          <Bloco
            titulo={ehAdmin ? "Últimos leads" : "Meus últimos leads"}
            acao={
              <Button variant="ghost" size="xs" render={<Link href="/auditoria" />} nativeButton={false}>
                Ver todos <ArrowRight />
              </Button>
            }
          >
            <ul className="divide-y">
              {recentes.map((l) => (
                <li key={l.id} className="min-w-0">
                  <Link
                    href={`/auditoria?lead=${l.id}`}
                    className="-mx-1.5 flex min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-2.5 transition-colors hover:bg-muted/50 sm:gap-3"
                  >
                    <AvatarPessoa nome={l.nome || l.nomeWhatsApp} tamanho="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{l.nome || l.nomeWhatsApp}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {ROTULO_INTENCAO[l.intencao]}
                        {l.regiao ? ` · ${l.regiao}` : ""}
                        {ehAdmin ? ` → ${primeiroNome(porId.get(l.colaboradorId)?.nome ?? "")}` : ""}
                      </span>
                    </span>
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <EtiquetaNivel nivel={l.nivel} />
                      <span className="text-[11px] text-muted-foreground tabular-nums sm:w-20 sm:text-right sm:text-xs">
                        {haQuanto(l.encaminhadoEm)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {recentes.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted-foreground">Nenhum lead ainda.</li>
              ) : null}
            </ul>
          </Bloco>

          {ehAdmin ? (
            <Bloco
              titulo="Equipe de plantão"
              acao={
                <Button variant="ghost" size="xs" render={<Link href="/plantao" />} nativeButton={false}>
                  Gerenciar <ArrowRight />
                </Button>
              }
            >
              <ul className="divide-y">
                {equipeAtendendo.map((c) => {
                  const ligado = escaladosHoje.some((i) => i.colaboradorId === c.id);
                  const hojeCount = leadsHoje.filter((l) => l.colaboradorId === c.id).length;
                  return (
                    <li key={c.id} className={cn("flex min-w-0 items-center gap-2.5 py-2.5", !ligado && "opacity-60")}>
                      <div className="relative shrink-0">
                        <AvatarPessoa nome={c.nome} tamanho="sm" />
                        <span
                          aria-hidden
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 size-2 rounded-full border border-card",
                            ligado ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
                          )}
                        />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.nome}</span>
                      {c.area ? <EtiquetaArea area={c.area} /> : null}
                      <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:w-16">
                        {ligado ? `${hojeCount} hoje` : "Desligado"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {areasSemCorretor.length ? (
                <Link
                  href="/plantao"
                  className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    <strong>{areasSemCorretor.map((a) => ROTULO_AREA[a]).join(", ")}</strong> sem ninguém ligado.
                  </span>
                  <Power className="size-3.5 shrink-0 opacity-70" />
                </Link>
              ) : null}
            </Bloco>
          ) : null}
        </div>
      </div>
    </Pagina>
  );
}
