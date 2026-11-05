"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
}

interface Props<T extends string> {
  valor: T;
  aoMudar: (valor: T) => void;
  opcoes: Opcao<T>[];
  className?: string;
  tamanho?: "sm" | "default";
  rotuloAcessivel?: string;
}

/** Select com rótulos legíveis: o Base UI mostra o valor cru se não receber `items` */
export function Selecao<T extends string>({ valor, aoMudar, opcoes, className, tamanho = "default", rotuloAcessivel }: Props<T>) {
  return (
    <Select
      value={valor}
      onValueChange={(v) => {
        if (v != null) aoMudar(v as T);
      }}
      items={opcoes.map((o) => ({ value: o.valor, label: o.rotulo }))}
    >
      <SelectTrigger size={tamanho} className={cn("w-full min-w-32 sm:w-auto", className)} aria-label={rotuloAcessivel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
