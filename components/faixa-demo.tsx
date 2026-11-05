"use client";

import { FlaskConical, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDados } from "@/lib/dados";

/** Faixa fixa: a prévia nunca se passa por sistema real */
export function FaixaDemo() {
  const { restaurar } = useDados();
  return (
    <div className="flex min-h-9 shrink-0 items-center justify-center gap-2 border-b bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs text-amber-900 dark:text-amber-200 sm:gap-3">
      <span className="flex min-w-0 items-center gap-1.5 font-medium">
        <FlaskConical className="size-3.5 shrink-0" />
        <span className="truncate">
          <span className="sm:hidden">Demonstração · dados fictícios</span>
          <span className="hidden sm:inline">Ambiente de demonstração · dados fictícios</span>
        </span>
      </span>
      <Button
        variant="ghost"
        size="xs"
        className="h-6 shrink-0 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20"
        onClick={() => {
          restaurar();
          toast.success("Demonstração restaurada", { description: "Equipe, escala, leads e conversas voltaram ao início." });
        }}
      >
        <RotateCcw className="size-3" />
        <span className="sm:hidden">Restaurar</span>
        <span className="hidden sm:inline">Restaurar demonstração</span>
      </Button>
    </div>
  );
}
