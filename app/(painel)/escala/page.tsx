"use client";

import { AlertTriangle, CheckCircle2, Power, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { EtiquetaArea } from "@/components/etiquetas";
import { Pagina, SemPermissao } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Switch } from "@/components/ui/switch";
import { useDados } from "@/lib/dados";
import { hojeISO } from "@/lib/datas";
import { AREAS, ROTULO_AREA, type Area, type Colaborador } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { useVisao } from "@/lib/visao";

const DESCRICAO_AREA: Record<Area, string> = {
  vendas: "Compra e permuta de imóveis",
  locacao: "Aluguel anual e temporada",
  captacao: "Proprietários que querem anunciar",
  recepcao: "Assuntos gerais e apoio quando uma área está desligada",
};

interface LinhaCorretorProps {
  colaborador: Colaborador;
  area: Area;
  ligado: boolean;
  recebidosHoje: number;
  aoAlternar: (novoEstado: boolean) => void;
}

function LinhaCorretor({ colaborador, area, ligado, recebidosHoje, aoAlternar }: LinhaCorretorProps) {
  return (
    <li>
      <label
        className={cn(
          "group flex cursor-pointer items-center gap-3.5 rounded-xl border p-3.5 transition-all select-none",
          ligado
            ? "border-primary/35 bg-primary/[0.04] shadow-2xs hover:border-primary/50 hover:bg-primary/[0.07] dark:border-primary/30 dark:bg-primary/[0.08] dark:hover:bg-primary/[0.12]"
            : "border-border/70 bg-muted/20 opacity-75 hover:bg-muted/40 hover:opacity-100",
        )}
      >
        <div className="relative shrink-0">
          <AvatarPessoa nome={colaborador.nome} tamanho="md" className={cn("transition-all", !ligado && "grayscale-[35%]")} />
          <span
            aria-hidden
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card transition-colors",
              ligado ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-semibold", !ligado && "text-foreground/80")}>{colaborador.nome}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {ligado ? (
              <>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Recebendo leads</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">
                  {recebidosHoje} {recebidosHoje === 1 ? "lead hoje" : "leads hoje"}
                </span>
              </>
            ) : (
              <span>Não recebe leads</span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={cn(
              "hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-block",
              ligado
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-foreground/8 text-muted-foreground",
            )}
          >
            {ligado ? "Ligado" : "Desligado"}
          </span>
          <Switch
            checked={ligado}
            onCheckedChange={aoAlternar}
            aria-label={`${ligado ? "Desligar" : "Ligar"} ${colaborador.nome} em ${ROTULO_AREA[area]}`}
          />
        </div>
      </label>
    </li>
  );
}

export default function Escala() {
  const { ehAdmin, estado } = useVisao();
  const { alternarEscala } = useDados();
  const hoje = hojeISO();

  if (!ehAdmin) return <SemPermissao />;

  const corretoresAtivos = estado.colaboradores.filter((c) => c.ativo && c.papel === "corretor");
  const recepcao = corretoresAtivos.find((c) => c.area === "recepcao");

  const itemDeHoje = (colaboradorId: string, area: Area) =>
    estado.escala.find((i) => i.data === hoje && i.colaboradorId === colaboradorId && i.area === area);

  const estaLigado = (colaboradorId: string, area: Area) => Boolean(itemDeHoje(colaboradorId, area));

  const alternar = (c: Colaborador, area: Area, ligar: boolean) => {
    alternarEscala([hoje], c.id, area, ligar);
    toast(ligar ? `${c.nome} ligado` : `${c.nome} desligado`, {
      description: ligar
        ? `Passa a receber leads de ${ROTULO_AREA[area]}.`
        : `Pausado em ${ROTULO_AREA[area]}. Não entra no sorteio de novos leads.`,
    });
  };

  const totalLigados = corretoresAtivos.filter((c) => c.area && estaLigado(c.id, c.area)).length;
  const areasPrincipais: Area[] = ["vendas", "locacao", "captacao"];
  const areasDescobertas = areasPrincipais.filter(
    (area) => !corretoresAtivos.some((c) => c.area === area && estaLigado(c.id, area)),
  );

  return (
    <Pagina titulo="Escala de atendimento" descricao="Ligue ou desligue quem recebe os leads do bot em cada área">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* Resumo objetivo no topo */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <div>
              <p className="font-medium">
                <strong className="tabular-nums">{totalLigados}</strong> de{" "}
                <span className="tabular-nums">{corretoresAtivos.length}</span> corretores ligados
              </p>
              <p className="text-xs text-muted-foreground">
                O bot divide os leads igualmente entre quem estiver ligado na área.
              </p>
            </div>
          </div>

          {areasDescobertas.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" />
              Todas as áreas atendendo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="size-3.5" />
              {areasDescobertas.map((a) => ROTULO_AREA[a]).join(", ")} sem corretor ligado
            </span>
          )}
        </div>

        {/* Cartões por área */}
        <div className="grid gap-4 md:grid-cols-2">
          {AREAS.map((area) => {
            const doTime = corretoresAtivos.filter((c) => c.area === area);
            const ligados = doTime.filter((c) => estaLigado(c.id, area));
            const semNinguem = doTime.length > 0 && ligados.length === 0;

            return (
              <section key={area} className="flex flex-col rounded-2xl border bg-card shadow-2xs">
                <header className="flex items-center justify-between gap-2 border-b px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <EtiquetaArea area={area} />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {ligados.length}/{doTime.length} {ligados.length === 1 ? "ligado" : "ligados"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{DESCRICAO_AREA[area]}</p>
                  </div>

                  {doTime.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ligarTodos = ligados.length < doTime.length;
                        for (const c of doTime) {
                          alternarEscala([hoje], c.id, area, ligarTodos);
                        }
                        toast(
                          ligarTodos
                            ? `Todos ligados em ${ROTULO_AREA[area]}`
                            : `Todos desligados em ${ROTULO_AREA[area]}`,
                        );
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Power className="size-3" />
                      {ligados.length < doTime.length ? "Ligar todos" : "Desligar todos"}
                    </button>
                  ) : null}
                </header>

                <div className="flex flex-1 flex-col justify-between p-3.5">
                  {doTime.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Nenhum corretor cadastrado nesta área.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {doTime.map((c) => {
                        const item = itemDeHoje(c.id, area);
                        return (
                          <LinhaCorretor
                            key={c.id}
                            colaborador={c}
                            area={area}
                            ligado={Boolean(item)}
                            recebidosHoje={item?.recebidos ?? 0}
                            aoAlternar={(novo) => alternar(c, area, novo)}
                          />
                        );
                      })}
                    </ul>
                  )}

                  {semNinguem && area !== "recepcao" ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        Ninguém ligado — os leads de <strong>{ROTULO_AREA[area]}</strong> vão para a recepção
                        {recepcao ? ` (${recepcao.nome})` : ""}.
                      </span>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Pagina>
  );
}
