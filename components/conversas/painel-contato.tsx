"use client";

import { ArrowRightLeft, Bot, MessageCircle } from "lucide-react";
import { AvatarPessoa } from "@/components/pessoa";
import { FichaLead } from "@/components/ficha-lead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dataHora } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { ROTULO_CRITERIO, type Conversa, type Lead } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";

function Historico({ conversa }: { conversa: Conversa }) {
  const { leads, conversas, mensagensPorConversa, porId } = useVisao();

  const eventos = [
    ...leads
      .filter((l) => l.chaveTelefone === conversa.chaveTelefone)
      .map((l) => ({
        quando: l.encaminhadoEm,
        icone: ArrowRightLeft,
        titulo: `${l.atualizacao ? "Atualização enviada" : "Encaminhado"} para ${porId.get(l.colaboradorId)?.nome ?? "corretor"}`,
        detalhe: ROTULO_CRITERIO[l.criterio],
      })),
    ...conversas
      .filter((c) => c.chaveTelefone === conversa.chaveTelefone)
      .map((c) => {
        const msgs = mensagensPorConversa.get(c.id) ?? [];
        return {
          quando: msgs[0]?.enviadaEm ?? c.ultimaMensagemEm,
          icone: c.canal === "bot" ? Bot : MessageCircle,
          titulo: c.canal === "bot" ? "Conversa com o bot" : `WhatsApp de ${porId.get(c.colaboradorId ?? "")?.nome ?? "corretor"}`,
          detalhe: `${msgs.length} mensagens`,
        };
      }),
  ].sort((a, b) => b.quando.localeCompare(a.quando));

  return (
    <ol className="relative ml-2 space-y-4 border-l pl-5">
      {eventos.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute top-0.5 -left-[31px] grid size-5 place-items-center rounded-full border bg-background text-muted-foreground">
            <e.icone className="size-3" />
          </span>
          <p className="text-sm font-medium">{e.titulo}</p>
          <p className="text-xs text-muted-foreground">{e.detalhe}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{dataHora(e.quando)}</p>
        </li>
      ))}
    </ol>
  );
}

export function PainelContato({ conversa, lead }: { conversa: Conversa; lead?: Lead }) {
  return (
    <Tabs defaultValue="ficha" className="gap-4">
      <TabsList variant="line" className="w-full justify-start border-b">
        <TabsTrigger value="ficha">Ficha</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
      </TabsList>
      <TabsContent value="ficha">
        {lead ? (
          <FichaLead lead={lead} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <AvatarPessoa nome={conversa.nomeCliente} tamanho="lg" />
              <div>
                <p className="text-base font-semibold">{conversa.nomeCliente}</p>
                <p className="text-sm text-muted-foreground">{formatarTelefone(conversa.telefoneCliente)}</p>
              </div>
            </div>
            <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              {conversa.emAndamento
                ? "O bot ainda está qualificando este contato. A ficha aparece quando ele for encaminhado."
                : "O bot não encaminhou este contato para um corretor: não houve intenção de compra, aluguel ou anúncio, ou o imóvel estava fora da área de atuação."}
            </p>
          </div>
        )}
      </TabsContent>
      <TabsContent value="historico">
        <Historico conversa={conversa} />
      </TabsContent>
    </Tabs>
  );
}
