"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, type LucideIcon } from "lucide-react";
import { rotaAtiva, useMenu } from "@/components/menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function classesDoItem(ativo: boolean) {
  return cn(
    "relative flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] leading-none font-medium transition-colors outline-none focus-visible:bg-accent active:bg-accent",
    ativo ? "text-primary" : "text-muted-foreground",
  );
}

function ConteudoDoItem({ ativo, icone: Icone, rotulo, badge = 0 }: { ativo: boolean; icone: LucideIcon; rotulo: string; badge?: number }) {
  return (
    <>
      {ativo ? <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-primary" /> : null}
      <span className="relative">
        <Icone className="size-5" strokeWidth={ativo ? 2.25 : 1.75} />
        {badge > 0 ? (
          <span className="absolute -top-1.5 -right-3 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      {rotulo}
    </>
  );
}

/**
 * Barra de navegação fixa no rodapé do celular; no tablet e no desktop vale o menu lateral.
 * O último botão, Configurações, abre uma folha com as telas de uso menos frequente.
 */
export function NavegacaoInferior() {
  const pathname = usePathname();
  const { barra, configuracoes } = useMenu();
  const [aberto, setAberto] = useState(false);

  const configuracoesAtiva = configuracoes.some((item) => rotaAtiva(pathname, item.href));
  // com uma tela só (o corretor tem apenas o perfil) uma folha de um item não ajuda: vai direto
  const direto = configuracoes.length === 1 ? configuracoes[0] : null;

  return (
    <nav aria-label="Navegação principal" className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {/* "Configurações" é o rótulo mais longo: com colunas iguais estoura em telas de 360 px, então a última coluna é um pouco mais larga */}
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${barra.length}, minmax(0, 1fr)) minmax(0, 1.3fr)` }}>
        {barra.map((item) => {
          const ativo = rotaAtiva(pathname, item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={ativo ? "page" : undefined} className={classesDoItem(ativo)}>
                <ConteudoDoItem ativo={ativo} icone={item.icone} rotulo={item.rotulo} badge={item.badge} />
              </Link>
            </li>
          );
        })}

        <li>
          {direto ? (
            <Link href={direto.href} aria-current={configuracoesAtiva ? "page" : undefined} className={classesDoItem(configuracoesAtiva)}>
              <ConteudoDoItem ativo={configuracoesAtiva} icone={Settings} rotulo="Configurações" />
            </Link>
          ) : (
            <Sheet open={aberto} onOpenChange={setAberto}>
              <SheetTrigger className={classesDoItem(configuracoesAtiva || aberto)}>
                <ConteudoDoItem ativo={configuracoesAtiva || aberto} icone={Settings} rotulo="Configurações" />
              </SheetTrigger>
              <SheetContent side="bottom" className="gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
                <SheetHeader className="pr-12">
                  <SheetTitle>Configurações</SheetTitle>
                  <SheetDescription>Perfil, equipe e auditoria dos leads.</SheetDescription>
                </SheetHeader>
                <ul className="divide-y border-t">
                  {configuracoes.map((item) => {
                    const ativo = rotaAtiva(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setAberto(false)}
                          aria-current={ativo ? "page" : undefined}
                          className={cn(
                            "flex h-13 items-center gap-3 px-4 text-sm font-medium transition-colors outline-none focus-visible:bg-accent active:bg-accent",
                            ativo ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                          )}
                        >
                          <item.icone className="size-5" strokeWidth={ativo ? 2.25 : 1.75} />
                          <span className="flex-1">{item.rotulo}</span>
                          {item.badge > 0 ? (
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </SheetContent>
            </Sheet>
          )}
        </li>
      </ul>
    </nav>
  );
}
