"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarPlus, Copy, Info } from "lucide-react";
import { ptBR } from "react-day-picker/locale";
import { toast } from "sonner";
import { EtiquetaArea } from "@/components/etiquetas";
import { Pagina, SemPermissao } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Selecao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useDados } from "@/lib/dados";
import { dataDoDia, diaISO, diaLongo, diaSemanaCurto, hojeISO, somarDias } from "@/lib/datas";
import { areasObrigatorias, diasSemEscala } from "@/lib/regras";
import { primeiroNome } from "@/lib/telefone";
import { AREAS, ROTULO_AREA, type Area } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";
import { cn } from "@/lib/utils";

const curto = (dia: string) => {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
};

function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {descricao ? <p className="text-xs text-muted-foreground">{descricao}</p> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function Escala() {
  const { ehAdmin, estado, porId } = useVisao();
  const { alternarEscala, copiarEscala } = useDados();
  const hoje = hojeISO();
  const [dias, setDias] = useState<string[]>([hoje]);
  const [copiarDe, setCopiarDe] = useState("");

  const selecionadas = useMemo(() => dias.map(dataDoDia), [dias]);
  const ativos = estado.colaboradores.filter((c) => c.ativo);
  const recepcao = ativos.find((c) => c.area === "recepcao");

  const lacunas = useMemo(() => diasSemEscala(estado.escala, estado.colaboradores, hoje, 14), [estado.escala, estado.colaboradores, hoje]);
  const diasComLacuna = useMemo(() => lacunas.map((l) => dataDoDia(l.dia)), [lacunas]);
  const diasComEscala = useMemo(() => [...new Set(estado.escala.map((i) => i.data))].sort(), [estado.escala]);

  if (!ehAdmin) return <SemPermissao />;

  const escolher = (novos: string[]) => setDias([...novos].sort());
  const proximos = (n: number) => escolher(Array.from({ length: n }, (_, i) => somarDias(hoje, i)));

  const cobertura = (colaboradorId: string, area: Area) => {
    const marcados = dias.filter((d) => estado.escala.some((i) => i.data === d && i.colaboradorId === colaboradorId && i.area === area)).length;
    return { checked: marcados === dias.length && dias.length > 0, indeterminate: marcados > 0 && marcados < dias.length };
  };

  const rotuloDias = dias.length === 1 ? diaLongo(dias[0]) : `${dias.length} dias selecionados`;
  const origensCopia = diasComEscala.filter((d) => !dias.includes(d) || dias.length > 1);

  return (
    <Pagina titulo="Escala de atendimento" descricao="Quem recebe os leads do bot em cada dia, por área">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-2">
            <Calendar
              mode="multiple"
              locale={ptBR}
              selected={selecionadas}
              onSelect={(d) => escolher((d ?? []).map(diaISO))}
              modifiers={{ semEscala: diasComLacuna }}
              modifiersClassNames={{
                semEscala:
                  "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-red-500",
              }}
              className="mx-auto"
            />
            <div className="flex flex-wrap gap-1.5 border-t p-2">
              <Button variant="outline" size="xs" onClick={() => escolher([hoje])}>
                Hoje
              </Button>
              <Button variant="outline" size="xs" onClick={() => proximos(7)}>
                Próximos 7 dias
              </Button>
              <Button variant="outline" size="xs" onClick={() => proximos(14)}>
                Próximos 14 dias
              </Button>
            </div>
            <p className="flex items-center gap-1.5 px-2 pb-2 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-red-500" /> dia com área sem corretor escalado
            </p>
          </section>

          {lacunas.length ? (
            <section className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-amber-950 dark:text-amber-200">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4" />
                Próximos dias sem corretor escalado
              </p>
              <p className="mt-0.5 text-xs">Os leads dessas áreas vão para a recepção{recepcao ? ` (${recepcao.nome})` : ""}.</p>
              <ul className="mt-2 space-y-1">
                {lacunas.map((l) => (
                  <li key={l.dia}>
                    <button
                      type="button"
                      onClick={() => escolher([l.dia])}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-amber-100 dark:hover:bg-amber-500/20"
                    >
                      <span className="capitalize">
                        {diaSemanaCurto(l.dia)}, {curto(l.dia)}
                      </span>
                      <span className="font-medium">{l.areas.map((a) => ROTULO_AREA[a]).join(", ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Bloco titulo={rotuloDias} descricao="Marque quem atende os leads. A alteração vale para todos os dias selecionados.">
            {dias.length > 1 ? (
              <p className="mb-3 flex flex-wrap gap-1.5">
                {dias.slice(0, 10).map((d) => (
                  <span key={d} className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                    {curto(d)}
                  </span>
                ))}
                {dias.length > 10 ? <span className="text-xs text-muted-foreground">+{dias.length - 10}</span> : null}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {AREAS.map((area) => {
                const doTime = ativos.filter((c) => c.area === area && c.papel === "corretor");
                // só conta o dia em que a área exige corretor escalado (fim de semana é só vendas)
                const faltando = dias.some(
                  (d) => areasObrigatorias(d).includes(area) && !estado.escala.some((i) => i.data === d && i.area === area && porId.get(i.colaboradorId)?.ativo),
                );
                return (
                  <div key={area} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <EtiquetaArea area={area} />
                      {faltando ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="size-3" /> sem escala
                        </span>
                      ) : null}
                    </div>
                    {doTime.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum colaborador nesta área.</p> : null}
                    <ul className="space-y-1">
                      {doTime.map((c) => {
                        const estadoMarca = cobertura(c.id, area);
                        const item = dias.length === 1 ? estado.escala.find((i) => i.data === dias[0] && i.colaboradorId === c.id && i.area === area) : undefined;
                        return (
                          <li key={c.id}>
                            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60">
                              <Checkbox
                                checked={estadoMarca.checked}
                                indeterminate={estadoMarca.indeterminate}
                                onCheckedChange={() => alternarEscala(dias, c.id, area, !estadoMarca.checked)}
                                className="data-[indeterminate]:border-primary data-[indeterminate]:bg-primary/60 data-[indeterminate]:text-primary-foreground"
                              />
                              <AvatarPessoa nome={c.nome} tamanho="sm" />
                              <span className="flex-1 text-sm">{c.nome}</span>
                              {item ? (
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {item.recebidos} {item.recebidos === 1 ? "lead" : "leads"}
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <Copy className="size-4 text-muted-foreground" />
              <span className="text-sm">Copiar a escala de</span>
              <Selecao
                valor={copiarDe || "nenhum"}
                aoMudar={(v) => setCopiarDe(v === "nenhum" ? "" : v)}
                opcoes={[
                  { valor: "nenhum", rotulo: "Escolha um dia" },
                  ...origensCopia.map((d) => ({ valor: d, rotulo: `${diaSemanaCurto(d)}, ${curto(d)}` })),
                ]}
                tamanho="sm"
                className="min-w-40"
                rotuloAcessivel="Dia de origem"
              />
              <span className="text-sm">para os dias selecionados</span>
              <Button
                size="sm"
                disabled={!copiarDe || dias.filter((d) => d !== copiarDe).length === 0}
                onClick={() => {
                  const alvo = dias.filter((d) => d !== copiarDe);
                  copiarEscala(copiarDe, alvo);
                  toast.success("Escala copiada", { description: `${curto(copiarDe)} → ${alvo.length} dia${alvo.length > 1 ? "s" : ""}.` });
                }}
              >
                <CalendarPlus />
                Copiar
              </Button>
            </div>
          </Bloco>

          <Bloco titulo="Próximos 14 dias" descricao="Clique em um dia para editar.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Dia</th>
                    {AREAS.map((a) => (
                      <th key={a} className="pb-2 font-medium">
                        {ROTULO_AREA[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Array.from({ length: 14 }, (_, i) => somarDias(hoje, i)).map((dia) => {
                    const falta = areasObrigatorias(dia);
                    return (
                      <tr key={dia} onClick={() => escolher([dia])} className={cn("cursor-pointer hover:bg-muted/50", dias.includes(dia) && "bg-accent/60")}>
                        <td className="py-2 pr-3 whitespace-nowrap capitalize tabular-nums">
                          {diaSemanaCurto(dia)}, {curto(dia)}
                          {dia === hoje ? <span className="ml-1.5 rounded bg-primary px-1 py-0.5 text-[10px] text-primary-foreground normal-case">hoje</span> : null}
                        </td>
                        {AREAS.map((area) => {
                          const nomes = estado.escala
                            .filter((i) => i.data === dia && i.area === area && porId.get(i.colaboradorId)?.ativo)
                            .map((i) => primeiroNome(porId.get(i.colaboradorId)?.nome ?? ""));
                          return (
                            <td key={area} className="py-2 pr-3">
                              {nomes.length ? (
                                nomes.join(", ")
                              ) : falta.includes(area) && area !== "recepcao" ? (
                                <span className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">Sem escala</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Fim de semana só exige corretor escalado em vendas. Quem já falou com o contato nos últimos 7 dias continua recebendo o lead, mesmo fora da escala.
            </p>
          </Bloco>
        </div>
      </div>
    </Pagina>
  );
}
