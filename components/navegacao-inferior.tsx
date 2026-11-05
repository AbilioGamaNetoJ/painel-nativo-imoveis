"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { rotaAtiva, useMenu } from "@/components/menu";
import { cn } from "@/lib/utils";

/** Barra de navegação fixa no rodapé do celular; no tablet e no desktop vale o menu lateral */
export function NavegacaoInferior() {
  const pathname = usePathname();
  const { atendimento, gestao } = useMenu();
  const itens = [...atendimento, ...gestao];

  return (
    <nav aria-label="Navegação principal" className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
        {itens.map((item) => {
          const ativo = rotaAtiva(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] leading-none font-medium transition-colors active:bg-accent",
                  ativo ? "text-primary" : "text-muted-foreground",
                )}
              >
                {ativo ? <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-primary" /> : null}
                <span className="relative">
                  <item.icone className="size-5" strokeWidth={ativo ? 2.25 : 1.75} />
                  {item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-3 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </span>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
