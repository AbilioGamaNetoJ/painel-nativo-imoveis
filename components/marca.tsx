import { cn } from "@/lib/utils";

/** Marca provisória: troca pelo logo em alta da Nativo quando a imobiliária enviar */
export function MarcaNativo({ className, mostrarNome = true }: { className?: string; mostrarNome?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9h13v-9" />
          <path d="M10 19v-5h4v5" />
        </svg>
      </span>
      {mostrarNome ? (
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Nativo Imóveis</span>
          <span className="block text-[11px] text-muted-foreground">Painel de atendimento</span>
        </span>
      ) : null}
    </span>
  );
}
