"use client";

import { Mail } from "lucide-react";
import { toast } from "sonner";
import { MarcaNativo } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  para: string;
  convidadoPor: string;
  papel: "admin" | "corretor";
}

/** O e-mail que a pessoa receberia. Na prévia nada é enviado. */
export function EmailConvite({ aberto, aoFechar, para, convidadoPor, papel }: Props) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Convite enviado</DialogTitle>
        <DialogDescription className="sr-only">Prévia do e-mail de convite que {para} recebe.</DialogDescription>
        <div className="flex items-start gap-3 border-b bg-muted/50 px-5 py-3 text-xs">
          <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <dl className="grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-0.5">
            <dt className="text-muted-foreground">Para</dt>
            <dd className="font-medium">{para}</dd>
            <dt className="text-muted-foreground">Assunto</dt>
            <dd className="font-medium">{convidadoPor} convidou você para o painel da Nativo Imóveis</dd>
          </dl>
        </div>
        <div className="bg-secondary/60 p-5">
          <div className="mx-auto max-w-md rounded-2xl border bg-background p-6 shadow-sm">
            <MarcaNativo />
            <p className="mt-5 text-[11px] font-semibold tracking-wide text-primary uppercase">Convite para o painel</p>
            <h2 className="mt-1 text-xl leading-snug font-semibold">Você foi convidado para o painel da Nativo Imóveis</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {convidadoPor} convidou você para entrar como <strong className="text-foreground">{papel === "admin" ? "administrador" : "corretor"}</strong>. Crie a sua senha para
              começar a acompanhar as conversas e os leads.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
              <div>
                <p className="text-muted-foreground uppercase">Convidado por</p>
                <p className="mt-0.5 text-sm font-medium">{convidadoPor}</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase">Espaço de trabalho</p>
                <p className="mt-0.5 text-sm font-medium">Nativo Imóveis</p>
              </div>
            </div>
            <Button className="mt-5 h-10 w-full" onClick={() => toast.info("Na demonstração o aceite não faz nada", { description: "No sistema real, este botão abre a criação de senha." })}>
              Aceitar convite
            </Button>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">Este convite só funciona para este e-mail. Se não era para você, ignore esta mensagem.</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">Prévia do e-mail. Na demonstração nenhuma mensagem é enviada.</p>
          <Button size="sm" onClick={aoFechar}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
