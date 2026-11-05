"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { hojeISO } from "../datas";
import { chaveTelefone, normalizarTelefone } from "../telefone";
import type {
  Area,
  Colaborador,
  Conversa,
  Estado,
  ItemEscala,
  Lead,
  Mensagem,
  OrigemLead,
  CamposLead,
  Papel,
  StatusWhatsApp,
} from "../tipos";
import { gerarDemonstracao } from "./ficticio";

// Camada de dados das telas. Na prévia o estado nasce de gerarDemonstracao() e as
// alterações ficam no navegador. Depois do contrato, as mesmas funções passam a ler e
// gravar no Supabase (a RLS decide o que cada perfil enxerga) sem mudar as telas.

const CHAVE = "nativo-previa:estado:v5";

export interface NovoColaborador {
  nome: string;
  email: string;
  telefone: string;
  area: Area | null;
  papel: Papel;
  darAcesso: boolean;
}

export interface NovoEncaminhamento {
  lead: Lead;
  conversa: Conversa;
  mensagens: Mensagem[];
  itemEscalaId: string | null;
}

interface Acoes {
  /** liga ou desliga um corretor na escala de vários dias de uma vez */
  alternarEscala: (dias: string[], colaboradorId: string, area: Area, ligar: boolean) => void;
  copiarEscala: (deDia: string, paraDias: string[]) => void;
  cadastrarColaborador: (dados: NovoColaborador) => Colaborador;
  convidar: (email: string, papel: Papel) => Colaborador;
  definirAtivo: (id: string, ativo: boolean) => void;
  /** colaborador já cadastrado, sem login: manda o convite para criar a senha */
  darAcessoAoPainel: (id: string) => void;
  atualizarWhatsApp: (id: string, status: StatusWhatsApp) => void;
  pausarBot: (conversaId: string, ate: string | null) => void;
  registrarEncaminhamento: (n: NovoEncaminhamento) => void;
  /** o próprio colaborador edita nome e WhatsApp; o e-mail (login) e a área só o administrador muda */
  atualizarPerfil: (id: string, dados: { nome: string; telefone: string }) => void;
  /** o corretor registra de onde o contato veio; vale para todos os leads do mesmo telefone */
  definirOrigem: (chave: string, origem: OrigemLead, porId: string) => void;
  /** o corretor ou o administrador corrige a ficha do lead; o registro do encaminhamento não muda */
  atualizarLead: (id: string, dados: CamposLead) => void;
  /** liga ou desliga um agente. Na prévia só muda o estado; depois do contrato ativa ou desativa o fluxo no n8n. */
  alternarAgente: (id: string, ativo: boolean, porId: string) => void;
  restaurar: () => void;
}

interface Contexto extends Acoes {
  estado: Estado;
}

const Dados = createContext<Contexto | null>(null);

function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const salvo = JSON.parse(bruto) as Estado;
      // outro dia: gera de novo, para as datas relativas continuarem fazendo sentido
      if (salvo.semente === hojeISO()) return salvo;
    }
  } catch {
    /* sem armazenamento ou JSON inválido: começa do zero */
  }
  return gerarDemonstracao();
}

export function DadosProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const iniciou = useRef(false);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    // o estado só existe no navegador: gerar no servidor daria datas diferentes (hidratação)
    setEstado(carregar());
  }, []);

  useEffect(() => {
    if (!estado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      /* cota cheia: a prévia segue funcionando, só não lembra */
    }
  }, [estado]);

  const alterar = useCallback((fn: (e: Estado) => Estado) => setEstado((e) => (e ? fn(e) : e)), []);

  const acoes = useMemo<Acoes>(
    () => ({
      alternarEscala: (dias, colaboradorId, area, ligar) =>
        alterar((e) => {
          let escala = e.escala;
          for (const dia of dias) {
            const existe = escala.some((i) => i.data === dia && i.colaboradorId === colaboradorId && i.area === area);
            if (ligar && !existe) {
              const item: ItemEscala = {
                id: `esc-${dia}-${colaboradorId.replace("col-", "")}-${area}`,
                data: dia,
                colaboradorId,
                area,
                recebidos: 0,
              };
              escala = [...escala, item];
            } else if (!ligar && existe) {
              escala = escala.filter((i) => !(i.data === dia && i.colaboradorId === colaboradorId && i.area === area));
            }
          }
          return { ...e, escala };
        }),

      copiarEscala: (deDia, paraDias) =>
        alterar((e) => {
          const origem = e.escala.filter((i) => i.data === deDia);
          const alvo = new Set(paraDias.filter((d) => d !== deDia));
          const mantidos = e.escala.filter((i) => !alvo.has(i.data));
          const copias: ItemEscala[] = [...alvo].flatMap((dia) =>
            origem.map((i) => ({ ...i, id: `esc-${dia}-${i.colaboradorId.replace("col-", "")}-${i.area}`, data: dia, recebidos: 0 })),
          );
          return { ...e, escala: [...mantidos, ...copias] };
        }),

      cadastrarColaborador: (dados) => {
        const telefone = normalizarTelefone(dados.telefone);
        const novo: Colaborador = {
          id: `col-${Date.now().toString(36)}`,
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          telefone,
          chaveTelefone: chaveTelefone(telefone),
          area: dados.area,
          papel: dados.papel,
          ativo: true,
          acesso: dados.darAcesso ? "convite_pendente" : "sem_acesso",
          statusWhatsApp: "desconectado",
          sessaoCaiuEm: null,
          termoAceitoEm: null,
        };
        alterar((e) => ({ ...e, colaboradores: [...e.colaboradores, novo] }));
        return novo;
      },

      convidar: (email, papel) => {
        const prefixo = email.split("@")[0] ?? email;
        const nome = prefixo
          .split(/[._-]+/)
          .filter(Boolean)
          .map((p) => p[0].toUpperCase() + p.slice(1))
          .join(" ");
        const novo: Colaborador = {
          id: `col-${Date.now().toString(36)}`,
          nome,
          email: email.trim().toLowerCase(),
          telefone: "",
          chaveTelefone: "",
          area: null,
          papel,
          ativo: true,
          acesso: "convite_pendente",
          statusWhatsApp: "desconectado",
          sessaoCaiuEm: null,
          termoAceitoEm: null,
        };
        alterar((e) => ({ ...e, colaboradores: [...e.colaboradores, novo] }));
        return novo;
      },

      definirAtivo: (id, ativo) =>
        alterar((e) => ({ ...e, colaboradores: e.colaboradores.map((c) => (c.id === id ? { ...c, ativo } : c)) })),

      darAcessoAoPainel: (id) =>
        alterar((e) => ({
          ...e,
          colaboradores: e.colaboradores.map((c) => (c.id === id && c.acesso === "sem_acesso" ? { ...c, acesso: "convite_pendente" } : c)),
        })),

      atualizarWhatsApp: (id, status) =>
        alterar((e) => ({
          ...e,
          colaboradores: e.colaboradores.map((c) =>
            c.id === id
              ? {
                  ...c,
                  statusWhatsApp: status,
                  sessaoCaiuEm: status === "conectado" ? null : c.sessaoCaiuEm,
                  termoAceitoEm: status === "conectado" ? (c.termoAceitoEm ?? new Date().toISOString()) : c.termoAceitoEm,
                }
              : c,
          ),
        })),

      pausarBot: (conversaId, ate) =>
        alterar((e) => ({ ...e, conversas: e.conversas.map((c) => (c.id === conversaId ? { ...c, botPausadoAte: ate } : c)) })),

      registrarEncaminhamento: ({ lead, conversa, mensagens, itemEscalaId }) =>
        alterar((e) => ({
          ...e,
          leads: [...e.leads, lead],
          conversas: [...e.conversas.filter((c) => c.id !== conversa.id), conversa],
          mensagens: [...e.mensagens, ...mensagens],
          escala: itemEscalaId ? e.escala.map((i) => (i.id === itemEscalaId ? { ...i, recebidos: i.recebidos + 1 } : i)) : e.escala,
        })),

      atualizarPerfil: (id, { nome, telefone }) =>
        alterar((e) => {
          const tel = normalizarTelefone(telefone);
          return {
            ...e,
            colaboradores: e.colaboradores.map((c) =>
              c.id === id ? { ...c, nome: nome.trim(), telefone: tel, chaveTelefone: chaveTelefone(tel) } : c,
            ),
          };
        }),

      definirOrigem: (chave, origem, porId) =>
        alterar((e) => {
          const informada = origem !== "nao_informada";
          const em = new Date().toISOString();
          return {
            ...e,
            leads: e.leads.map((l) =>
              l.chaveTelefone === chave ? { ...l, origem, origemPorId: informada ? porId : null, origemEm: informada ? em : null } : l,
            ),
          };
        }),

      atualizarLead: (id, dados) =>
        alterar((e) => {
          const alvo = e.leads.find((l) => l.id === id);
          if (!alvo) return e;
          const campos: CamposLead = {
            nome: dados.nome.trim(),
            intencao: dados.intencao,
            finalidade: dados.finalidade.trim(),
            regiao: dados.regiao.trim(),
            tipoImovel: dados.tipoImovel.trim(),
            caracteristicas: dados.caracteristicas.trim(),
            faixaValor: dados.faixaValor.trim(),
            pagamento: dados.pagamento.trim(),
            prazo: dados.prazo.trim(),
            melhorHorario: dados.melhorHorario.trim(),
            imovelUrl: dados.imovelUrl.trim(),
            observacoes: dados.observacoes.trim(),
          };
          // o nome é do contato, não só desta ficha: vale para os outros leads e conversas do mesmo telefone
          const nomeNovo = campos.nome && campos.nome !== alvo.nome ? campos.nome : null;
          return {
            ...e,
            leads: e.leads.map((l) => (l.id === id ? { ...l, ...campos } : nomeNovo && l.chaveTelefone === alvo.chaveTelefone ? { ...l, nome: nomeNovo } : l)),
            conversas: nomeNovo ? e.conversas.map((c) => (c.chaveTelefone === alvo.chaveTelefone ? { ...c, nomeCliente: nomeNovo } : c)) : e.conversas,
          };
        }),

      alternarAgente: (id, ativo, porId) =>
        alterar((e) => ({
          ...e,
          // agente bloqueado não liga: a trava vale aqui, não só no botão
          agentes: e.agentes.map((a) => (a.id === id && !a.bloqueado ? { ...a, ativo, alteradoEm: new Date().toISOString(), alteradoPorId: porId } : a)),
        })),

      restaurar: () => setEstado(gerarDemonstracao()),
    }),
    [alterar],
  );

  const valor = useMemo<Contexto | null>(() => (estado ? { estado, ...acoes } : null), [estado, acoes]);

  if (!valor) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando a demonstração…</div>
    );
  }
  return <Dados.Provider value={valor}>{children}</Dados.Provider>;
}

export function useDados(): Contexto {
  const ctx = useContext(Dados);
  if (!ctx) throw new Error("useDados fora do DadosProvider");
  return ctx;
}
