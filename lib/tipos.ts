// Tipos espelham as tabelas do plano de implementação (colaboradores, escala,
// conversas, mensagens, nativo_leads). Na prévia os dados vêm de lib/dados;
// depois do contrato, a mesma camada passa a ler o Supabase.

export type Area = "vendas" | "locacao" | "captacao" | "recepcao";
export type Papel = "admin" | "corretor";
export type StatusWhatsApp = "desconectado" | "aguardando_qr" | "conectado";
export type AcessoPainel = "ativo" | "convite_pendente" | "sem_acesso";
export type Nivel = "quente" | "morno" | "frio";
export type Canal = "bot" | "corretor";
export type Autor = "cliente" | "bot" | "corretor";
export type TipoMensagem = "texto" | "imagem" | "audio";
export type Intencao = "comprar" | "alugar" | "temporada" | "permuta" | "anunciar" | "outro";
export type MotivoEncaminhamento = "qualificado" | "pedido_humano" | "duvida_fora_da_base" | "reclamacao";

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  /** DDI + DDD + número, só dígitos */
  telefone: string;
  /** DDD + 8 últimos dígitos */
  chaveTelefone: string;
  /** admin sem área de atendimento fica nulo */
  area: Area | null;
  papel: Papel;
  ativo: boolean;
  acesso: AcessoPainel;
  statusWhatsApp: StatusWhatsApp;
  /** quando a sessão do espelho caiu e ainda não voltou */
  sessaoCaiuEm: string | null;
  termoAceitoEm: string | null;
}

export interface ItemEscala {
  id: string;
  /** AAAA-MM-DD */
  data: string;
  colaboradorId: string;
  area: Area;
  /** contador do rodízio naquele dia */
  recebidos: number;
}

export interface Conversa {
  id: string;
  canal: Canal;
  nomeCliente: string;
  telefoneCliente: string;
  chaveTelefone: string;
  /** dono da conversa; nulo na conversa do bot */
  colaboradorId: string | null;
  botPausadoAte: string | null;
  ultimaMensagemEm: string;
  /** lead que nasceu desta conversa, quando houve encaminhamento */
  leadId: string | null;
  /** conversa do bot ainda sem encaminhamento */
  emAndamento?: boolean;
}

export interface Mensagem {
  id: string;
  conversaId: string;
  direcao: "entrada" | "saida";
  autor: Autor;
  tipo: TipoMensagem;
  texto: string;
  /** caminho da foto em public/ (tipo imagem) */
  midia?: string;
  /** duração em segundos (tipo audio) */
  duracao?: number;
  enviadaEm: string;
}

export type OrigemLead = "nao_informada" | "instagram" | "facebook" | "site" | "google" | "indicacao" | "placa" | "cliente_antigo" | "outro";

export const ROTULO_ORIGEM: Record<OrigemLead, string> = {
  nao_informada: "Não informada",
  instagram: "Instagram",
  facebook: "Facebook",
  site: "Site da Nativo",
  google: "Google",
  indicacao: "Indicação",
  placa: "Placa ou faixa",
  cliente_antigo: "Já era cliente",
  outro: "Outro",
};

export const ORIGENS = Object.keys(ROTULO_ORIGEM) as OrigemLead[];

export interface Lead {
  id: string;
  nome: string;
  nomeWhatsApp: string;
  telefone: string;
  chaveTelefone: string;
  nivel: Nivel;
  area: Area;
  intencao: Intencao;
  motivo: MotivoEncaminhamento;
  finalidade: string;
  regiao: string;
  tipoImovel: string;
  caracteristicas: string;
  faixaValor: string;
  pagamento: string;
  prazo: string;
  melhorHorario: string;
  observacoes: string;
  /** de onde o contato conheceu a Nativo; o corretor informa na ficha, o bot não pergunta */
  origem: OrigemLead;
  origemPorId: string | null;
  origemEm: string | null;
  /** link de imóvel do site que o contato mandou */
  imovelUrl: string;
  colaboradorId: string;
  encaminhadoEm: string;
  /** mesmo contato encaminhado de novo em até 7 dias */
  atualizacao: boolean;
  /** como o corretor foi escolhido */
  criterio: "escala" | "reuso_7_dias" | "recepcao";
  conversaBotId: string;
}

export type TipoAgente = "sdr" | "recuperacao";

/** Agente de IA que atende no WhatsApp. Cada um corresponde a um fluxo no n8n. */
export interface Agente {
  id: string;
  tipo: TipoAgente;
  nome: string;
  descricao: string;
  /** ligado: o fluxo do n8n responde os contatos novos; desligado: o fluxo fica parado */
  ativo: boolean;
  /** ainda não liberado para a Nativo: aparece no painel, mas não pode ser ligado */
  bloqueado: boolean;
  /** quando o agente foi ligado ou desligado pela última vez; nulo se nunca foi mexido */
  alteradoEm: string | null;
  alteradoPorId: string | null;
}

export const ROTULO_TIPO_AGENTE: Record<TipoAgente, string> = {
  sdr: "SDR · pré-qualificação",
  recuperacao: "Reengajamento",
};

export interface Estado {
  /** AAAA-MM-DD em que os dados foram gerados; muda o dia, a prévia gera de novo */
  semente: string;
  colaboradores: Colaborador[];
  escala: ItemEscala[];
  conversas: Conversa[];
  mensagens: Mensagem[];
  leads: Lead[];
  agentes: Agente[];
}

export const AREAS: Area[] = ["vendas", "locacao", "captacao", "recepcao"];

export const ROTULO_AREA: Record<Area, string> = {
  vendas: "Vendas",
  locacao: "Locação",
  captacao: "Captação",
  recepcao: "Recepção",
};

export const ROTULO_NIVEL: Record<Nivel, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};

export const ROTULO_INTENCAO: Record<Intencao, string> = {
  comprar: "Comprar",
  alugar: "Alugar",
  temporada: "Temporada",
  permuta: "Permuta",
  anunciar: "Anunciar imóvel",
  outro: "Outro assunto",
};

export const ROTULO_CRITERIO: Record<Lead["criterio"], string> = {
  escala: "Sorteado entre os corretores escalados do dia",
  reuso_7_dias: "Mesmo corretor de um contato dos últimos 7 dias",
  recepcao: "Ninguém escalado na área: foi para a recepção",
};
