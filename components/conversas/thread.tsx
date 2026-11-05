"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Eraser, Info, LockKeyhole, MessageCircle, PanelRight, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { AvatarPessoa } from "@/components/pessoa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bolha, SeparadorDia } from "@/components/conversas/bolha";
import { useAgora } from "@/lib/agora";
import { NOME_BOT, useDados } from "@/lib/dados";
import { dataHora, mesmoDia, rotuloDia } from "@/lib/datas";
import { formatarTelefone, primeiroNome } from "@/lib/telefone";
import type { Colaborador, Conversa, Mensagem } from "@/lib/tipos";

interface Props {
  conversa: Conversa;
  mensagens: Mensagem[];
  dono?: Colaborador;
  ehAdmin: boolean;
  /** conteúdo do painel lateral, mostrado em Sheet nas telas estreitas */
  painel: ReactNode;
}

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

function Aviso({ children, tom = "neutro" }: { children: ReactNode; tom?: "neutro" | "alerta" }) {
  return (
    <div
      className={
        tom === "alerta"
          ? "flex items-center gap-2 border-b bg-amber-50 dark:bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:text-amber-200"
          : "flex items-center gap-2 border-b bg-muted/60 px-4 py-2 text-xs text-muted-foreground"
      }
    >
      {children}
    </div>
  );
}

export function ThreadConversa({ conversa, mensagens, dono, ehAdmin, painel }: Props) {
  const { pausarBot } = useDados();
  const agora = useAgora();
  const rolagem = useRef<HTMLDivElement>(null);
  const [limpando, setLimpando] = useState(false);

  // sempre abre na mensagem mais recente
  useEffect(() => {
    const el = rolagem.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversa.id, mensagens.length]);

  const ehBot = conversa.canal === "bot";
  const pausado = Boolean(conversa.botPausadoAte && new Date(conversa.botPausadoAte).getTime() > agora);

  const nomeAutor = (m: Mensagem) =>
    m.autor === "cliente" ? primeiroNome(conversa.nomeCliente) : m.autor === "bot" ? `${NOME_BOT} · bot` : primeiroNome(dono?.nome ?? "Corretor");

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:gap-3 sm:px-3 md:px-4">
        <Button variant="ghost" size="icon-sm" className="md:hidden" render={<Link href="/conversas" />} nativeButton={false} aria-label="Voltar para a lista">
          <ArrowLeft />
        </Button>
        <AvatarPessoa nome={conversa.nomeCliente} tamanho="md" className="hidden min-[400px]:inline-flex" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversa.nomeCliente}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            {formatarTelefone(conversa.telefoneCliente)}
          </p>
        </div>

        {ehBot && ehAdmin ? (
          <div className="flex shrink-0 items-center gap-1">
            {pausado ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  pausarBot(conversa.id, null);
                  toast.success("Bot reativado", { description: `${NOME_BOT} volta a responder ${primeiroNome(conversa.nomeCliente)}.` });
                }}
              >
                <Play />
                <span className="hidden sm:inline">Reativar bot</span>
                <span className="sr-only sm:hidden">Reativar bot</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  pausarBot(conversa.id, new Date(Date.now() + SETE_DIAS).toISOString());
                  toast.success("Bot pausado por 7 dias", { description: "As mensagens deste contato não serão respondidas pelo bot." });
                }}
              >
                <Pause />
                <span className="hidden sm:inline">Pausar bot</span>
                <span className="sr-only sm:hidden">Pausar bot</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLimpando(true)}>
              <Eraser />
              <span className="hidden lg:inline">Limpar memória</span>
              <span className="sr-only lg:hidden">Limpar memória</span>
            </Button>
          </div>
        ) : null}

        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="xl:hidden" aria-label="Ver ficha do contato" />}>
            <PanelRight />
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Contato</SheetTitle>
              <SheetDescription className="sr-only">Ficha e histórico do contato</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">{painel}</div>
          </SheetContent>
        </Sheet>
      </header>

      {ehBot && pausado ? (
        <Aviso tom="alerta">
          <Pause className="size-3.5 shrink-0" />
          Bot pausado até {dataHora(conversa.botPausadoAte!)}. Um corretor já assumiu a conversa.
        </Aviso>
      ) : null}
      {!ehBot ? (
        <Aviso>
          <MessageCircle className="size-3.5 shrink-0" />
          Espelho do WhatsApp de {dono?.nome ?? "corretor"}. Somente leitura: nada é enviado a partir do painel.
        </Aviso>
      ) : null}
      {conversa.emAndamento ? (
        <Aviso>
          <Bot className="size-3.5 shrink-0" />
          Conversa em andamento: {NOME_BOT} ainda está qualificando este contato.
        </Aviso>
      ) : null}

      <div ref={rolagem} className="min-h-0 flex-1 overflow-y-auto bg-chat px-3 py-4 md:px-6">
        {mensagens.map((m, i) => {
          const anterior = mensagens[i - 1];
          const novoDia = !anterior || !mesmoDia(anterior.enviadaEm, m.enviadaEm);
          const mudouAutor = !anterior || anterior.autor !== m.autor || novoDia || new Date(m.enviadaEm).getTime() - new Date(anterior.enviadaEm).getTime() > 10 * 60000;
          return (
            <div key={m.id}>
              {novoDia ? <SeparadorDia rotulo={rotuloDia(m.enviadaEm)} /> : null}
              <Bolha mensagem={m} mostrarAutor={mudouAutor} nomeAutor={nomeAutor(m)} />
            </div>
          );
        })}
        {mensagens.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</p> : null}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t bg-background px-4 py-3 text-xs text-muted-foreground">
        <LockKeyhole className="size-3.5 shrink-0" />
        <span>
          {ehBot
            ? "Conversa do bot, só para leitura. O corretor chama o cliente pelo WhatsApp dele."
            : "O corretor responde pelo próprio WhatsApp. O painel só espelha a conversa."}
        </span>
        <Info className="ml-auto hidden size-3.5 shrink-0 sm:block" aria-hidden />
      </footer>

      <Dialog open={limpando} onOpenChange={setLimpando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar a memória do bot para este contato?</DialogTitle>
            <DialogDescription>
              {NOME_BOT} esquece o que já conversou com {primeiroNome(conversa.nomeCliente)} e recomeça do zero na próxima mensagem. O histórico continua guardado aqui no painel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimpando(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setLimpando(false);
                toast.success("Memória do bot apagada", { description: "O histórico da conversa foi mantido." });
              }}
            >
              <Eraser />
              Limpar memória
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
