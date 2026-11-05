"use client";

import { Bot, MessageCircle, PauseCircle, RefreshCw, Search } from "lucide-react";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { AvatarPessoa } from "@/components/pessoa";
import { Input } from "@/components/ui/input";
import { BotaoMenuMobile } from "@/components/botao-menu-mobile";
import { useAgora } from "@/lib/agora";
import { rotuloLista } from "@/lib/datas";
import { primeiroNome } from "@/lib/telefone";
import type { Colaborador, Conversa, Lead, Mensagem } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface ItemConversa {
  conversa: Conversa;
  ultima?: Mensagem;
  lead?: Lead;
  /** corretor da conversa; na conversa do bot, quem recebeu o lead */
  dono?: Colaborador;
}

export type FiltroCanal = "todas" | "bot" | "corretor";

function previa(m?: Mensagem) {
  if (!m) return "Sem mensagens";
  if (m.tipo === "imagem") return `📷 ${m.texto || "Foto"}`;
  if (m.tipo === "audio") return `🎤 Áudio ${Math.floor((m.duracao ?? 0) / 60)}:${String((m.duracao ?? 0) % 60).padStart(2, "0")}`;
  return m.texto.replace(/\*/g, "");
}

function autorDaPrevia(item: ItemConversa) {
  const m = item.ultima;
  if (!m || m.direcao === "entrada") return "";
  if (m.autor === "bot") return "Bot: ";
  return `${primeiroNome(item.dono?.nome ?? "Corretor")}: `;
}

interface Props {
  itens: ItemConversa[];
  selecionadaId: string | null;
  aoSelecionar: (id: string) => void;
  filtro: FiltroCanal;
  aoFiltrar: (f: FiltroCanal) => void;
  contagem: Record<FiltroCanal, number>;
  busca: string;
  aoBuscar: (v: string) => void;
  /** esconde a coluna no celular quando uma conversa está aberta */
  escondidaNoCelular: boolean;
  podeFiltrarCanal: boolean;
}

const ABAS: { valor: FiltroCanal; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "bot", rotulo: "Bot" },
  { valor: "corretor", rotulo: "Corretores" },
];

export function ListaConversas({ itens, selecionadaId, aoSelecionar, filtro, aoFiltrar, contagem, busca, aoBuscar, escondidaNoCelular, podeFiltrarCanal }: Props) {
  const agora = useAgora();
  return (
    <section className={cn("min-h-0 w-full flex-col border-r md:flex md:w-[340px] md:shrink-0", escondidaNoCelular ? "hidden" : "flex")}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <BotaoMenuMobile />
        <h1 className="text-base font-semibold">Conversas</h1>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">{contagem.todas}</span>
      </header>

      <div className="shrink-0 space-y-2 border-b px-3 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => aoBuscar(e.target.value)} placeholder="Buscar por nome ou telefone" className="h-8 pl-8" aria-label="Buscar conversas" />
        </div>
        {podeFiltrarCanal ? (
          <div className="flex gap-4 text-sm" role="tablist" aria-label="Tipo de conversa">
            {ABAS.map((a) => (
              <button
                key={a.valor}
                type="button"
                role="tab"
                aria-selected={filtro === a.valor}
                onClick={() => aoFiltrar(a.valor)}
                className={cn(
                  "-mb-2.5 border-b-2 pb-2 transition-colors",
                  filtro === a.valor ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {a.rotulo}
                <span className={cn("ml-1.5 rounded-md px-1.5 py-0.5 text-xs tabular-nums", filtro === a.valor ? "bg-accent text-primary" : "bg-muted")}>{contagem[a.valor]}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {itens.length === 0 ? <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</li> : null}
        {itens.map((item) => {
          const { conversa: c, lead } = item;
          const ativa = c.id === selecionadaId;
          const pausado = c.botPausadoAte && new Date(c.botPausadoAte).getTime() > agora;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => aoSelecionar(c.id)}
                aria-current={ativa ? "true" : undefined}
                className={cn("flex w-full gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/60", ativa && "bg-accent/70 hover:bg-accent/70")}
              >
                <AvatarPessoa nome={c.nomeCliente} tamanho="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1">
                      {c.canal === "bot" ? <Bot className="size-3 shrink-0" /> : <MessageCircle className="size-3 shrink-0" />}
                      <span className="truncate">{c.canal === "bot" ? "Bot" : (item.dono?.nome ?? "Corretor")}</span>
                      {c.canal === "bot" && item.dono ? <span className="truncate">→ {primeiroNome(item.dono.nome)}</span> : null}
                    </span>
                    <span className="shrink-0 tabular-nums">{rotuloLista(c.ultimaMensagemEm)}</span>
                  </div>
                  <p className="truncate text-sm font-semibold">{c.nomeCliente}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    <span className="text-foreground/60">{autorDaPrevia(item)}</span>
                    {previa(item.ultima)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {lead ? <EtiquetaNivel nivel={lead.nivel} /> : null}
                    {lead ? <EtiquetaArea area={lead.area} /> : null}
                    {c.emAndamento ? <span className="rounded-md bg-sky-50 dark:bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">Em andamento</span> : null}
                    {!lead && !c.emAndamento && c.canal === "bot" ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Sem encaminhamento</span> : null}
                    {lead?.atualizacao ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <RefreshCw className="size-3" />
                        Atualização
                      </span>
                    ) : null}
                    {pausado ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                        <PauseCircle className="size-3" />
                        Bot pausado
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
