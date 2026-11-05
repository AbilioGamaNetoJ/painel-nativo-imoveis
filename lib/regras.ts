import { diaDaSemana, somarDias } from "./datas";
import type {
  Area,
  Colaborador,
  Intencao,
  ItemEscala,
  Lead,
  MotivoEncaminhamento,
  Nivel,
} from "./tipos";

// Regras do bot (n8n/code/preparar-lead.js) e do sorteio (docs/rodizio-vendedores.md)
// escritas como funções puras. Na prévia rodam no navegador; depois do contrato
// o mesmo critério roda no n8n, sobre o Supabase.

interface CamposNivel {
  intencao: Intencao;
  nome: string;
  regiao: string;
  tipoImovel: string;
  faixaValor: string;
  prazo: string;
  finalidade: string;
}

/** Mesma classificação do preparar-lead.js: feita por código, não pela IA */
export function classificarNivel(l: CamposNivel): Nivel {
  if (l.intencao === "anunciar") {
    if (l.nome && l.tipoImovel && l.regiao && l.finalidade && (l.faixaValor || l.prazo)) return "quente";
    if (l.nome && (l.tipoImovel || l.regiao)) return "morno";
    return "frio";
  }
  if (l.intencao === "outro") return "frio";
  if (l.nome && l.regiao && l.tipoImovel && l.faixaValor && l.prazo) return "quente";
  if (l.nome && (l.regiao || l.tipoImovel)) return "morno";
  return "frio";
}

export function areaDoLead(intencao: Intencao, motivo: MotivoEncaminhamento): Area {
  if (motivo === "reclamacao") return "recepcao";
  const porIntencao: Partial<Record<Intencao, Area>> = {
    comprar: "vendas",
    permuta: "vendas",
    alugar: "locacao",
    temporada: "locacao",
    anunciar: "captacao",
  };
  return porIntencao[intencao] ?? "recepcao";
}

/** Áreas que precisam de plantão em cada dia: fim de semana só vendas (regra da prévia) */
export function areasObrigatorias(dia: string): Area[] {
  const d = diaDaSemana(dia);
  return d === 0 || d === 6 ? ["vendas"] : ["vendas", "locacao", "captacao"];
}

export interface DiaSemPlantao {
  dia: string;
  areas: Area[];
}

export function diasSemPlantao(escala: ItemEscala[], colaboradores: Colaborador[], de: string, quantos: number): DiaSemPlantao[] {
  const ativos = new Set(colaboradores.filter((c) => c.ativo).map((c) => c.id));
  const saida: DiaSemPlantao[] = [];
  for (let i = 0; i < quantos; i++) {
    const dia = somarDias(de, i);
    const faltam = areasObrigatorias(dia).filter(
      (area) => !escala.some((e) => e.data === dia && e.area === area && ativos.has(e.colaboradorId)),
    );
    if (faltam.length) saida.push({ dia, areas: faltam });
  }
  return saida;
}

export interface ResultadoSorteio {
  colaboradorId: string;
  criterio: Lead["criterio"];
  /** linha da escala que ganhou +1 no contador; nula no reuso e na recepção */
  itemEscalaId: string | null;
  atualizacao: boolean;
}

interface EntradaSorteio {
  colaboradores: Colaborador[];
  escala: ItemEscala[];
  leads: Pick<Lead, "chaveTelefone" | "colaboradorId" | "encaminhadoEm">[];
  area: Area;
  chaveTelefone: string;
  dia: string;
  agora: Date;
  aleatorio: () => number;
}

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 1. mesmo contato nos últimos 7 dias → mesmo corretor, se ainda ativo
 * 2. senão, entre os plantonistas de hoje na área, os que receberam menos
 * 3. sem plantão → colaborador da recepção
 */
export function sortearCorretor(e: EntradaSorteio): ResultadoSorteio {
  const ativos = new Map(e.colaboradores.filter((c) => c.ativo).map((c) => [c.id, c]));

  const anterior = e.leads
    .filter(
      (l) =>
        l.chaveTelefone === e.chaveTelefone &&
        e.agora.getTime() - new Date(l.encaminhadoEm).getTime() <= SETE_DIAS_MS &&
        ativos.has(l.colaboradorId),
    )
    .sort((a, b) => b.encaminhadoEm.localeCompare(a.encaminhadoEm))[0];
  if (anterior) {
    return { colaboradorId: anterior.colaboradorId, criterio: "reuso_7_dias", itemEscalaId: null, atualizacao: true };
  }

  const candidatos = e.escala.filter((i) => i.data === e.dia && i.area === e.area && ativos.has(i.colaboradorId));
  if (candidatos.length) {
    const menor = Math.min(...candidatos.map((c) => c.recebidos));
    const empatados = candidatos.filter((c) => c.recebidos === menor);
    const escolhido = empatados[Math.floor(e.aleatorio() * empatados.length)];
    return { colaboradorId: escolhido.colaboradorId, criterio: "plantao", itemEscalaId: escolhido.id, atualizacao: false };
  }

  const recepcao = [...ativos.values()].find((c) => c.area === "recepcao");
  const fallback = recepcao ?? [...ativos.values()].find((c) => c.papel === "admin");
  return {
    colaboradorId: fallback?.id ?? "",
    criterio: "recepcao",
    itemEscalaId: null,
    atualizacao: false,
  };
}
