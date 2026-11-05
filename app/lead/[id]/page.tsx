"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { FichaLead } from "@/components/ficha-lead";
import { MarcaNativo } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { dataHora } from "@/lib/datas";
import { primeiroNome } from "@/lib/telefone";
import { useVisao } from "@/lib/visao";

const aviso = (acao: string) =>
  toast.info(`${acao}: só na demonstração`, { description: "No sistema real, este botão abre o WhatsApp com o cliente." });

export default function FichaNoCelular({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { leadsPorId, leads, porId } = useVisao();
  const lead = leads.find((l) => l.id === id) ?? undefined;
  const existe = leadsPorId.has(id);
  // é a tela do corretor que recebeu o lead, mesmo quando o admin abre para conferir
  const responsavel = lead ? porId.get(lead.colaboradorId) : undefined;

  return (
    <main className="min-h-screen bg-secondary md:py-6">
      <p className="mx-auto mb-3 hidden max-w-md items-center justify-between gap-2 px-1 text-xs text-muted-foreground md:flex">
        <span className="flex items-center gap-1.5">
          <FlaskConical className="size-3.5" />
          Visão do corretor no celular · dados fictícios
        </span>
        <Link href="/conversas" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="size-3.5" />
          Voltar ao painel
        </Link>
      </p>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background md:h-[820px] md:min-h-0 md:rounded-[2.5rem] md:border-[10px] md:border-neutral-900 dark:md:border-neutral-600 md:shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
          <MarcaNativo className="[&_span]:text-primary-foreground [&_span.bg-primary]:bg-primary-foreground/15" mostrarNome={false} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold">Ficha do lead</p>
            <p className="truncate text-[11px] opacity-80">{responsavel ? `Olá, ${primeiroNome(responsavel.nome)}` : "Painel da Nativo"}</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {lead ? (
            <div className="space-y-4 p-4">
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">Encaminhado em {dataHora(lead.encaminhadoEm)}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-11" onClick={() => aviso("Chamar no WhatsApp")}>
                  <MessageCircle />
                  WhatsApp
                </Button>
                <Button variant="outline" className="h-11" onClick={() => aviso("Ligar")}>
                  <Phone />
                  Ligar
                </Button>
              </div>
              <FichaLead lead={lead} />
            </div>
          ) : (
            <div className="grid h-full place-items-center p-4 text-center">
              <div>
                <p className="text-sm font-medium">{existe ? "Este lead é de outro corretor." : "Lead não encontrado."}</p>
                <p className="mt-1 text-xs text-muted-foreground">O corretor só vê os leads que recebeu.</p>
                <Button className="mt-4" variant="outline" render={<Link href="/auditoria" />} nativeButton={false}>
                  Ver meus leads
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
