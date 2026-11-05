"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Copy, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AvatarPessoa } from "@/components/pessoa";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { Selecao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { useDados } from "@/lib/dados";
import { dataHora, haQuanto } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { ORIGENS, ROTULO_CRITERIO, ROTULO_INTENCAO, ROTULO_ORIGEM, type Lead } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";
import { cn } from "@/lib/utils";

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function FichaLead({ lead, className }: { lead: Lead; className?: string }) {
  const { porId, conversas, eu } = useVisao();
  const { definirOrigem } = useDados();
  const corretor = porId.get(lead.colaboradorId);
  const doContato = conversas.filter((c) => c.leadId === lead.id || c.chaveTelefone === lead.chaveTelefone);
  const nome = lead.nome || lead.nomeWhatsApp;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`+${lead.telefone}`);
      toast.success("Telefone copiado");
    } catch {
      toast.error("Não consegui copiar o telefone");
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start gap-3">
        <AvatarPessoa nome={nome} tamanho="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{nome}</p>
          <button type="button" onClick={copiar} className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            {formatarTelefone(lead.telefone)}
            <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <EtiquetaNivel nivel={lead.nivel} />
            <EtiquetaArea area={lead.area} />
            {lead.atualizacao ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                <RefreshCw className="size-3" />
                Atualização
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-3">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Encaminhamento</h3>
        <div className="flex items-center gap-2.5">
          <AvatarPessoa nome={corretor?.nome ?? "?"} tamanho="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{corretor?.nome ?? "Sem corretor"}</p>
            <p className="text-xs text-muted-foreground">
              {dataHora(lead.encaminhadoEm)} · {haQuanto(lead.encaminhadoEm)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{ROTULO_CRITERIO[lead.criterio]}</p>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ficha do lead</h3>
        <dl className="divide-y">
          <Linha rotulo="Intenção">{ROTULO_INTENCAO[lead.intencao]}</Linha>
          <Linha rotulo="Origem">
            <div className="flex flex-col gap-1">
              <Selecao
                valor={lead.origem}
                aoMudar={(o) => {
                  definirOrigem(lead.chaveTelefone, o, eu?.id ?? "");
                  toast.success(o === "nao_informada" ? "Origem removida" : `Origem registrada: ${ROTULO_ORIGEM[o]}`);
                }}
                opcoes={ORIGENS.map((o) => ({ valor: o, rotulo: ROTULO_ORIGEM[o] }))}
                tamanho="sm"
                className="w-full max-w-52"
                rotuloAcessivel="Origem do lead"
              />
              <span className="text-xs text-muted-foreground">
                {lead.origemPorId && lead.origemEm
                  ? `Informada por ${porId.get(lead.origemPorId)?.nome ?? "—"} · ${dataHora(lead.origemEm)}`
                  : "Pergunte ao cliente como conheceu a Nativo e registre aqui."}
              </span>
            </div>
          </Linha>
          <Linha rotulo="Imóvel de interesse">{lead.imovelUrl ? <span className="text-primary">{lead.imovelUrl}</span> : null}</Linha>
          <Linha rotulo="Finalidade">{lead.finalidade}</Linha>
          <Linha rotulo="Região">{lead.regiao}</Linha>
          <Linha rotulo="Tipo">{lead.tipoImovel}</Linha>
          <Linha rotulo="Características">{lead.caracteristicas}</Linha>
          <Linha rotulo="Faixa de valor">{lead.faixaValor}</Linha>
          <Linha rotulo="Pagamento">{lead.pagamento}</Linha>
          <Linha rotulo="Prazo">{lead.prazo}</Linha>
          <Linha rotulo="Melhor horário">{lead.melhorHorario}</Linha>
          <Linha rotulo="Observações">{lead.observacoes}</Linha>
        </dl>
      </section>

      {doContato.length ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Conversas deste contato</h3>
          <div className="flex flex-col gap-1.5">
            {doContato.map((c) => (
              <Button key={c.id} variant="outline" size="sm" className="justify-start" render={<Link href={`/conversas?c=${c.id}`} />} nativeButton={false}>
                {c.canal === "bot" ? <Bot /> : <MessageSquare />}
                {c.canal === "bot" ? "Conversa com o bot" : `WhatsApp de ${porId.get(c.colaboradorId ?? "")?.nome ?? "corretor"}`}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
