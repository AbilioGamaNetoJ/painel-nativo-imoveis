import type { ReactNode } from "react";
import { BotaoMenuMobile } from "@/components/botao-menu-mobile";
import { cn } from "@/lib/utils";

/** Cabeçalho + área rolável. No celular o avatar abre o menu do usuário; a navegação fica na barra inferior. */
export function Pagina({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b px-4 py-2 md:px-6">
        <BotaoMenuMobile />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{titulo}</h1>
          {descricao ? <p className="truncate text-xs text-muted-foreground">{descricao}</p> : null}
        </div>
        {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
      </header>
      <div className={cn("min-h-0 flex-1 overflow-y-auto p-4 md:p-6", className)}>{children}</div>
    </div>
  );
}

export function SemPermissao() {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-medium">Esta tela é só para administradores.</p>
        <p className="mt-1 text-xs text-muted-foreground">O corretor vê as próprias conversas e os leads que recebeu.</p>
      </div>
    </div>
  );
}
