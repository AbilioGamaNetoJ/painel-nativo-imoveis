"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, RefreshCw, Search } from "lucide-react";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { FichaLead } from "@/components/ficha-lead";
import { Pagina } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Selecao, type Opcao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgora } from "@/lib/agora";
import { dataHora } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import {
  AREAS,
  ORIGENS,
  ROTULO_AREA,
  ROTULO_CRITERIO,
  ROTULO_INTENCAO,
  ROTULO_NIVEL,
  ROTULO_ORIGEM,
  type Area,
  type Lead,
  type Nivel,
  type OrigemLead,
} from "@/lib/tipos";
import { useVisao } from "@/lib/visao";

type Periodo = "hoje" | "7" | "14" | "tudo";
const PERIODOS: Opcao<Periodo>[] = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7", rotulo: "Últimos 7 dias" },
  { valor: "14", rotulo: "Últimos 14 dias" },
  { valor: "tudo", rotulo: "Todo o período" },
];

function baixarCsv(leads: Lead[], nomeDoCorretor: (id: string) => string) {
  const cab = ["Data e hora", "Cliente", "Telefone", "Nível", "Área", "Intenção", "Corretor", "Como foi escolhido", "Atualização", "Origem"];
  const linhas = leads.map((l) => [
    dataHora(l.encaminhadoEm),
    l.nome || l.nomeWhatsApp,
    formatarTelefone(l.telefone),
    ROTULO_NIVEL[l.nivel],
    ROTULO_AREA[l.area],
    ROTULO_INTENCAO[l.intencao],
    nomeDoCorretor(l.colaboradorId),
    ROTULO_CRITERIO[l.criterio],
    l.atualizacao ? "Sim" : "Não",
    ROTULO_ORIGEM[l.origem],
  ]);
  const csv = [cab, ...linhas].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "auditoria-leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads, ehAdmin, porId, eu } = useVisao();
  const agora = useAgora();
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("14");
  const [corretor, setCorretor] = useState("todos");
  const [area, setArea] = useState<Area | "todas">("todas");
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [origem, setOrigem] = useState<OrigemLead | "todas">("todas");
  const [tipo, setTipo] = useState<"todos" | "novos" | "atualizacoes">("todos");

  const idAberto = params.get("lead");
  const aberto = leads.find((l) => l.id === idAberto);

  const nomeDoCorretor = (id: string) => porId.get(id)?.nome ?? "Sem corretor";
  const corretoresComLead = useMemo(() => [...new Set(leads.map((l) => l.colaboradorId))].map((id) => ({ valor: id, rotulo: nomeDoCorretor(id) })), [leads, porId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");
    const inicioDoDia = new Date(agora).setHours(0, 0, 0, 0);
    const limite = periodo === "tudo" ? 0 : periodo === "hoje" ? inicioDoDia : agora - Number(periodo) * 86400000;
    return [...leads]
      .filter((l) => new Date(l.encaminhadoEm).getTime() >= limite)
      .filter((l) => corretor === "todos" || l.colaboradorId === corretor)
      .filter((l) => area === "todas" || l.area === area)
      .filter((l) => nivel === "todos" || l.nivel === nivel)
      .filter((l) => origem === "todas" || l.origem === origem)
      .filter((l) => tipo === "todos" || (tipo === "atualizacoes") === l.atualizacao)
      .filter((l) => !termo || (l.nome || l.nomeWhatsApp).toLowerCase().includes(termo) || (digitos.length > 2 && l.telefone.includes(digitos)))
      .sort((a, b) => b.encaminhadoEm.localeCompare(a.encaminhadoEm));
  }, [leads, busca, periodo, corretor, area, nivel, origem, tipo, agora]);

  const quentes = filtrados.filter((l) => l.nivel === "quente").length;
  const naRecepcao = filtrados.filter((l) => l.criterio === "recepcao").length;
  const abrir = (id: string | null) => router.replace(id ? `/auditoria?lead=${id}` : "/auditoria", { scroll: false });

  return (
    <Pagina
      titulo={ehAdmin ? "Auditoria de leads" : "Meus leads"}
      descricao={ehAdmin ? "Para qual corretor cada lead foi encaminhado, com data e hora" : `Leads encaminhados para ${eu?.nome ?? "você"}`}
      acoes={
        ehAdmin ? (
          <Button variant="outline" size="sm" onClick={() => baixarCsv(filtrados, nomeDoCorretor)} disabled={!filtrados.length}>
            <Download />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        ) : null
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="relative col-span-2 w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-8" aria-label="Buscar leads" />
          </div>
          <Selecao valor={periodo} aoMudar={setPeriodo} opcoes={PERIODOS} rotuloAcessivel="Período" />
          {ehAdmin ? (
            <Selecao valor={corretor} aoMudar={setCorretor} opcoes={[{ valor: "todos", rotulo: "Todos os corretores" }, ...corretoresComLead]} rotuloAcessivel="Corretor" />
          ) : null}
          <Selecao
            valor={area}
            aoMudar={setArea}
            opcoes={[{ valor: "todas", rotulo: "Todas as áreas" }, ...AREAS.map((a) => ({ valor: a, rotulo: ROTULO_AREA[a] }))]}
            rotuloAcessivel="Área"
          />
          <Selecao
            valor={nivel}
            aoMudar={setNivel}
            opcoes={[{ valor: "todos", rotulo: "Todos os níveis" }, ...(["quente", "morno", "frio"] as Nivel[]).map((n) => ({ valor: n, rotulo: ROTULO_NIVEL[n] }))]}
            rotuloAcessivel="Nível"
          />
          <Selecao
            valor={origem}
            aoMudar={setOrigem}
            opcoes={[{ valor: "todas", rotulo: "Todas as origens" }, ...ORIGENS.map((o) => ({ valor: o, rotulo: ROTULO_ORIGEM[o] }))]}
            rotuloAcessivel="Origem"
          />
          <Selecao
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[
              { valor: "todos", rotulo: "Novos e atualizações" },
              { valor: "novos", rotulo: "Só novos" },
              { valor: "atualizacoes", rotulo: "Só atualizações" },
            ]}
            rotuloAcessivel="Tipo de encaminhamento"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground tabular-nums">{filtrados.length}</strong> encaminhamentos · <span className="tabular-nums">{quentes}</span> quentes
          {ehAdmin ? (
            <>
              {" "}
              · <span className="tabular-nums">{naRecepcao}</span> foram para a recepção por falta de corretor escalado
            </>
          ) : null}
        </p>

        <ul className="divide-y rounded-xl border bg-card md:hidden">
          {filtrados.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => abrir(l.id)} className="flex w-full flex-col gap-2.5 p-4 text-left outline-none active:bg-muted/60 focus-visible:bg-muted/60">
                <div className="flex items-center gap-3">
                  <AvatarPessoa nome={l.nome || l.nomeWhatsApp} tamanho="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{l.nome || l.nomeWhatsApp}</span>
                      {l.atualizacao ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                          <RefreshCw className="size-3" />
                          Atualização
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatarTelefone(l.telefone)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <EtiquetaNivel nivel={l.nivel} />
                  <EtiquetaArea area={l.area} />
                  <span className="text-xs text-muted-foreground">{ROTULO_INTENCAO[l.intencao]}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  {ehAdmin ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <AvatarPessoa nome={nomeDoCorretor(l.colaboradorId)} tamanho="sm" />
                      <span className="truncate">{nomeDoCorretor(l.colaboradorId)}</span>
                      {l.criterio === "recepcao" ? <span className="shrink-0 rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">Sem escala</span> : null}
                    </span>
                  ) : (
                    <span>Origem: {ROTULO_ORIGEM[l.origem]}</span>
                  )}
                  <span className="shrink-0 tabular-nums">{dataHora(l.encaminhadoEm)}</span>
                </div>
                {ehAdmin ? <p className="text-xs text-muted-foreground">Origem: {ROTULO_ORIGEM[l.origem]}</p> : null}
              </button>
            </li>
          ))}
          {filtrados.length === 0 ? <li className="py-12 text-center text-sm text-muted-foreground">Nenhum encaminhamento com esses filtros.</li> : null}
        </ul>

        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Data e hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Intenção</TableHead>
                {ehAdmin ? <TableHead>Corretor</TableHead> : null}
                <TableHead title="Quem registra é o corretor, na ficha do lead. O bot não pergunta de onde a pessoa veio.">Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((l) => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => abrir(l.id)}>
                  <TableCell className="tabular-nums">{dataHora(l.encaminhadoEm)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <AvatarPessoa nome={l.nome || l.nomeWhatsApp} tamanho="md" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium">
                          <span className="truncate">{l.nome || l.nomeWhatsApp}</span>
                          {l.atualizacao ? (
                            <span title="Mesmo contato encaminhado de novo em até 7 dias" className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                              <RefreshCw className="size-3" />
                              Atualização
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatarTelefone(l.telefone)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <EtiquetaNivel nivel={l.nivel} />
                  </TableCell>
                  <TableCell>
                    <EtiquetaArea area={l.area} />
                  </TableCell>
                  <TableCell>{ROTULO_INTENCAO[l.intencao]}</TableCell>
                  {ehAdmin ? (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AvatarPessoa nome={nomeDoCorretor(l.colaboradorId)} tamanho="sm" />
                        <span>{nomeDoCorretor(l.colaboradorId)}</span>
                        {l.criterio === "recepcao" ? <span className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">Sem escala</span> : null}
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell className={l.origem === "nao_informada" ? "text-muted-foreground/70" : undefined}>{ROTULO_ORIGEM[l.origem]}</TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={ehAdmin ? 7 : 6} className="py-12 text-center text-muted-foreground">
                    Nenhum encaminhamento com esses filtros.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={Boolean(aberto)} onOpenChange={(o) => !o && abrir(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Lead encaminhado</SheetTitle>
            <SheetDescription>Ficha completa e conversas do contato.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">{aberto ? <FichaLead lead={aberto} /> : null}</div>
        </SheetContent>
      </Sheet>
    </Pagina>
  );
}

export default function PaginaAuditoria() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
