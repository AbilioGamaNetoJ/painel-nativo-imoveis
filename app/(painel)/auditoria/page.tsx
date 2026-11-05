"use client";

import { Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { FichaLead } from "@/components/ficha-lead";
import { Pagina } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Selecao, type Opcao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Filtros = {
  periodo: Periodo;
  corretor: string;
  area: Area | "todas";
  nivel: Nivel | "todos";
  origem: OrigemLead | "todas";
  tipo: "todos" | "novos" | "atualizacoes";
};

const FILTROS_INICIAIS: Filtros = {
  periodo: "14",
  corretor: "todos",
  area: "todas",
  nivel: "todos",
  origem: "todas",
  tipo: "todos",
};

function filtrosAtivos(f: Filtros, ehAdmin: boolean) {
  return [
    f.periodo !== "14",
    ehAdmin && f.corretor !== "todos",
    f.area !== "todas",
    f.nivel !== "todos",
    f.origem !== "todas",
    f.tipo !== "todos",
  ].filter(Boolean).length;
}

function CamposFiltro({
  valor,
  aoMudar,
  ehAdmin,
  corretores,
  comRotulo = false,
}: {
  valor: Filtros;
  aoMudar: (filtros: Filtros) => void;
  ehAdmin: boolean;
  corretores: Opcao<string>[];
  comRotulo?: boolean;
}) {
  const set = <K extends keyof Filtros>(chave: K, v: Filtros[K]) => aoMudar({ ...valor, [chave]: v });
  const campo = (rotulo: string, controle: ReactNode) =>
    comRotulo ? (
      <div className="space-y-1.5">
        <Label>{rotulo}</Label>
        {controle}
      </div>
    ) : (
      controle
    );
  const largura = comRotulo ? "w-full sm:w-full" : undefined;

  return (
    <>
      {campo("Período", <Selecao valor={valor.periodo} aoMudar={(v) => set("periodo", v)} opcoes={PERIODOS} rotuloAcessivel="Período" className={largura} />)}
      {ehAdmin
        ? campo(
            "Corretor",
            <Selecao
              valor={valor.corretor}
              aoMudar={(v) => set("corretor", v)}
              opcoes={[{ valor: "todos", rotulo: "Todos os corretores" }, ...corretores]}
              rotuloAcessivel="Corretor"
              className={largura}
            />,
          )
        : null}
      {campo(
        "Área",
        <Selecao
          valor={valor.area}
          aoMudar={(v) => set("area", v)}
          opcoes={[{ valor: "todas", rotulo: "Todas as áreas" }, ...AREAS.map((a) => ({ valor: a, rotulo: ROTULO_AREA[a] }))]}
          rotuloAcessivel="Área"
          className={largura}
        />,
      )}
      {campo(
        "Nível",
        <Selecao
          valor={valor.nivel}
          aoMudar={(v) => set("nivel", v)}
          opcoes={[{ valor: "todos", rotulo: "Todos os níveis" }, ...(["quente", "morno", "frio"] as Nivel[]).map((n) => ({ valor: n, rotulo: ROTULO_NIVEL[n] }))]}
          rotuloAcessivel="Nível"
          className={largura}
        />,
      )}
      {campo(
        "Origem",
        <Selecao
          valor={valor.origem}
          aoMudar={(v) => set("origem", v)}
          opcoes={[{ valor: "todas", rotulo: "Todas as origens" }, ...ORIGENS.map((o) => ({ valor: o, rotulo: ROTULO_ORIGEM[o] }))]}
          rotuloAcessivel="Origem"
          className={largura}
        />,
      )}
      {campo(
        "Encaminhamento",
        <Selecao
          valor={valor.tipo}
          aoMudar={(v) => set("tipo", v)}
          opcoes={[
            { valor: "todos", rotulo: "Novos e atualizações" },
            { valor: "novos", rotulo: "Só novos" },
            { valor: "atualizacoes", rotulo: "Só atualizações" },
          ]}
          rotuloAcessivel="Tipo de encaminhamento"
          className={largura}
        />,
      )}
    </>
  );
}

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
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [rascunho, setRascunho] = useState<Filtros>(FILTROS_INICIAIS);
  const [filtrosAberto, setFiltrosAberto] = useState(false);

  const idAberto = params.get("lead");
  const aberto = leads.find((l) => l.id === idAberto);
  // o foco vai para o pop-up e não para o primeiro botão da ficha (o do telefone, que ficaria com contorno)
  const popupRef = useRef<HTMLDivElement>(null);

  const nomeDoCorretor = (id: string) => porId.get(id)?.nome ?? "Sem corretor";
  const corretoresComLead = useMemo(() => [...new Set(leads.map((l) => l.colaboradorId))].map((id) => ({ valor: id, rotulo: nomeDoCorretor(id) })), [leads, porId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    const { periodo, corretor, area, nivel, origem, tipo } = filtros;
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
  }, [leads, busca, filtros, agora]);

  const quentes = filtrados.filter((l) => l.nivel === "quente").length;
  const naRecepcao = filtrados.filter((l) => l.criterio === "recepcao").length;
  const ativos = filtrosAtivos(filtros, ehAdmin);
  const abrir = (id: string | null) => router.replace(id ? `/auditoria?lead=${id}` : "/auditoria", { scroll: false });
  const abrirFiltros = () => {
    setRascunho(filtros);
    setFiltrosAberto(true);
  };

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
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-8" aria-label="Buscar leads" />
          </div>
          <Button variant="outline" onClick={abrirFiltros} aria-haspopup="dialog">
            <SlidersHorizontal />
            Filtros
            {ativos > 0 ? (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">{ativos}</span>
            ) : null}
          </Button>
        </div>

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-8" aria-label="Buscar leads" />
          </div>
          <CamposFiltro valor={filtros} aoMudar={setFiltros} ehAdmin={ehAdmin} corretores={corretoresComLead} />
        </div>

        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground tabular-nums">{filtrados.length}</strong> encaminhamentos · <span className="tabular-nums">{quentes}</span> quentes
          {ehAdmin ? (
            <>
              {" "}
              · <span className="tabular-nums">{naRecepcao}</span> foram para a recepção por falta de corretor de plantão
            </>
          ) : null}
        </p>

        <ul className="flex flex-col gap-3 md:hidden">
          {filtrados.map((l) => (
            <li key={l.id} className="rounded-xl border bg-card">
              <button type="button" onClick={() => abrir(l.id)} className="flex w-full flex-col gap-2.5 rounded-xl p-4 text-left outline-none active:bg-muted/60 focus-visible:bg-muted/60">
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
                      {l.criterio === "recepcao" ? <span className="shrink-0 rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">Sem plantão</span> : null}
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
          {filtrados.length === 0 ? <li className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">Nenhum encaminhamento com esses filtros.</li> : null}
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
                        {l.criterio === "recepcao" ? <span className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">Sem plantão</span> : null}
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

      <Dialog open={filtrosAberto} onOpenChange={setFiltrosAberto}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filtrar encaminhamentos</DialogTitle>
            <DialogDescription>A lista muda depois de filtrar.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <CamposFiltro valor={rascunho} aoMudar={setRascunho} ehAdmin={ehAdmin} corretores={corretoresComLead} comRotulo />
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => { setFiltros(rascunho); setFiltrosAberto(false); }}>
              Filtrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* pop-up no centro da tela, igual no desktop, no tablet e no celular */}
      <Dialog open={Boolean(aberto)} onOpenChange={(o) => !o && abrir(null)}>
        <DialogContent ref={popupRef} initialFocus={popupRef} className="max-h-[90svh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle>Lead encaminhado</DialogTitle>
            <DialogDescription>Ficha completa e conversas do contato.</DialogDescription>
          </DialogHeader>
          <div className="p-4">{aberto ? <FichaLead lead={aberto} /> : null}</div>
        </DialogContent>
      </Dialog>
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
