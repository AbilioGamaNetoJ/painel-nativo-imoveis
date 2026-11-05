import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bolinha de status: pulsa quando o agente está online */
export function PilulaStatus({ ativo, bloqueado = false, className }: { ativo: boolean; bloqueado?: boolean; className?: string }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-4 font-semibold";

  if (bloqueado) {
    return (
      <span className={cn(base, "bg-foreground/8 text-muted-foreground", className)}>
        <Lock className="size-3" />
        Bloqueado
      </span>
    );
  }

  return (
    <span className={cn(base, ativo ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-foreground/8 text-muted-foreground", className)}>
      <span className="relative flex size-1.5">
        {ativo ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" /> : null}
        <span className={cn("relative size-1.5 rounded-full", ativo ? "bg-emerald-500" : "bg-slate-400")} />
      </span>
      {ativo ? "Online" : "Dormindo"}
    </span>
  );
}

const TONS = {
  azul: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  ambar: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  verde: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  violeta: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
} as const;

/** Mini placar com ícone colorido, no estilo de "conquista" */
export function Placar({ icone, tom, valor, rotulo, className }: { icone: ReactNode; tom: keyof typeof TONS; valor: number; rotulo: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-2.5 py-2 shadow-sm shadow-black/[0.03] dark:border-white/10 dark:bg-white/5 dark:shadow-none", className)}>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl [&_svg]:size-4", TONS[tom])}>{icone}</span>
      <span className="min-w-0 leading-tight">
        <span className="block text-lg font-bold tabular-nums">{valor}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{rotulo}</span>
      </span>
    </div>
  );
}
