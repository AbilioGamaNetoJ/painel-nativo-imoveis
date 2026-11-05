import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { iniciais } from "@/lib/telefone";

function matiz(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

const TAMANHOS = {
  sm: "size-6 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
  xl: "size-16 text-xl",
} as const;

/** Avatar redondo com iniciais; a cor sai do nome, então a mesma pessoa tem sempre a mesma cor */
export function AvatarPessoa({ nome, tamanho = "md", className }: { nome: string; tamanho?: keyof typeof TAMANHOS; className?: string }) {
  const h = matiz(nome);
  return (
    <span
      aria-hidden
      className={cn("avatar-pessoa inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none", TAMANHOS[tamanho], className)}
      style={{ "--matiz": h } as React.CSSProperties}
    >
      {iniciais(nome)}
    </span>
  );
}

export function AvatarBot({ tamanho = "md", className }: { tamanho?: keyof typeof TAMANHOS; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground", TAMANHOS[tamanho], className)}
    >
      <Bot className="size-[55%]" />
    </span>
  );
}
