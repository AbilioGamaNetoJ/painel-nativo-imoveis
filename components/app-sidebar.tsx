"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { rotaAtiva, useMenu, type ItemMenu } from "@/components/menu";
import { MarcaNativo } from "@/components/marca";
import { OPCOES_TEMA } from "@/components/opcoes-tema";
import { AvatarPessoa } from "@/components/pessoa";
import { SimularLead } from "@/components/simular-lead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAcoesSessao } from "@/lib/sessao";
import { useTema } from "@/lib/tema";
import { cn } from "@/lib/utils";
import { useVisao } from "@/lib/visao";

function GrupoDeItens({ titulo, itens, pathname }: { titulo: string; itens: ItemMenu[]; pathname: string }) {
  if (!itens.length) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{titulo}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {itens.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton isActive={rotaAtiva(pathname, item.href)} tooltip={item.rotulo} render={<Link href={item.href} />}>
                <item.icone />
                <span>{item.rotulo}</span>
              </SidebarMenuButton>
              {item.badge > 0 ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { eu, ehAdmin, estado } = useVisao();
  const { entrar, sair } = useAcoesSessao();
  const { tema, definirTema } = useTema();
  const { atendimento, gestao } = useMenu();
  const { state, isMobile, toggleSidebar } = useSidebar();

  // No celular não há menu lateral: a navegação é a barra inferior (NavegacaoInferior)
  if (isMobile) return null;

  const recolhido = state === "collapsed";
  const perfis = estado.colaboradores.filter((c) => c.ativo && c.acesso === "ativo");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={cn("h-14 justify-center border-b", recolhido ? "px-2" : "px-3")}>
        <MarcaNativo mostrarNome={!recolhido} />
      </SidebarHeader>

      <SidebarContent>
        {ehAdmin ? (
          <div className="px-2 pt-3">
            <SimularLead compacto={recolhido} />
          </div>
        ) : null}

        <GrupoDeItens titulo="Atendimento" itens={atendimento} pathname={pathname} />
        <GrupoDeItens titulo="Gestão" itens={gestao} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-[popup-open]:bg-sidebar-accent" />}>
                <AvatarPessoa nome={eu?.nome ?? "?"} />
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{eu?.nome ?? "Perfil"}</span>
                  <span className="truncate text-xs text-muted-foreground">{ehAdmin ? "Administrador" : "Corretor"}</span>
                </span>
                <ChevronsUpDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side={recolhido ? "right" : "top"} align="start" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/perfil")}>
                    <UserRound />
                    Meu perfil
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Tema</DropdownMenuLabel>
                  {OPCOES_TEMA.map((t) => (
                    <DropdownMenuItem key={t.valor} onClick={() => definirTema(t.valor)}>
                      <t.icone />
                      <span className="flex-1">{t.rotulo}</span>
                      {tema === t.valor ? <Check className="size-4 text-primary" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ver o painel como</DropdownMenuLabel>
                  {perfis.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => {
                        entrar({ papel: p.papel, colaboradorId: p.id });
                        router.push("/inicio");
                      }}
                    >
                      <AvatarPessoa nome={p.nome} tamanho="sm" />
                      <span className="flex-1 truncate">{p.nome}</span>
                      <span className="text-xs text-muted-foreground">{p.papel === "admin" ? "Admin" : "Corretor"}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    sair();
                    router.push("/login");
                  }}
                >
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={recolhido ? "Expandir o menu" : "Minimizar o menu"}
        title={recolhido ? "Expandir o menu" : "Minimizar o menu"}
        className="absolute top-1/2 -right-3.5 z-20 grid size-7 -translate-y-1/2 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {recolhido ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>
    </Sidebar>
  );
}
