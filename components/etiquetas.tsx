import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ROTULO_AREA, ROTULO_NIVEL, type AcessoPainel, type Area, type Nivel, type StatusWhatsApp } from "@/lib/tipos";

// Etiquetas pequenas com ponto colorido, como as do Chatwoot.

export function Etiqueta({ cor, children, className, titulo }: { cor: string; children: ReactNode; className?: string; titulo?: string }) {
  return (
    <span
      title={titulo}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-foreground/80",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", cor)} />
      {children}
    </span>
  );
}

const COR_NIVEL: Record<Nivel, string> = { quente: "bg-red-500", morno: "bg-amber-500", frio: "bg-sky-500" };
const COR_AREA: Record<Area, string> = { vendas: "bg-emerald-600", locacao: "bg-violet-500", captacao: "bg-orange-500", recepcao: "bg-slate-400" };

export function EtiquetaNivel({ nivel, className }: { nivel: Nivel; className?: string }) {
  return (
    <Etiqueta cor={COR_NIVEL[nivel]} className={className}>
      {ROTULO_NIVEL[nivel]}
    </Etiqueta>
  );
}

export function EtiquetaArea({ area, className }: { area: Area | null; className?: string }) {
  if (!area) return <span className="text-xs text-muted-foreground">A definir</span>;
  return (
    <Etiqueta cor={COR_AREA[area]} className={className}>
      {ROTULO_AREA[area]}
    </Etiqueta>
  );
}

export function EtiquetaWhatsApp({ status, caiu }: { status: StatusWhatsApp; caiu?: boolean }) {
  if (status === "conectado") return <Etiqueta cor="bg-emerald-500">Conectado</Etiqueta>;
  if (status === "aguardando_qr") return <Etiqueta cor="bg-amber-500">Aguardando QR</Etiqueta>;
  return <Etiqueta cor={caiu ? "bg-red-500" : "bg-slate-400"}>{caiu ? "Sessão caiu" : "Desconectado"}</Etiqueta>;
}

export function EtiquetaAcesso({ acesso }: { acesso: AcessoPainel }) {
  if (acesso === "ativo") return <Etiqueta cor="bg-emerald-500">Com acesso</Etiqueta>;
  if (acesso === "convite_pendente") return <Etiqueta cor="bg-amber-500">Convite pendente</Etiqueta>;
  return <Etiqueta cor="bg-slate-400">Sem acesso ao painel</Etiqueta>;
}
