import { diaDaSemana, diaISO, somarDias } from "../datas";
import { areaDoLead, classificarNivel, sortearCorretor } from "../regras";
import { chaveTelefone } from "../telefone";
import type {
  Area,
  Colaborador,
  Conversa,
  Estado,
  Intencao,
  ItemEscala,
  Lead,
  Mensagem,
  MotivoEncaminhamento,
  OrigemLead,
} from "../tipos";
import {
  camposDoFluxo,
  dialogoSemLead,
  montarDialogo,
  type CampoFluxo,
  type CasoSemLead,
  type Fala,
  type PerfilDialogo,
} from "./dialogo-bot";
import { dialogoCorretor } from "./dialogo-corretor";

// Dados 100% fictícios. Nomes e telefones inventados (48 90000-xxxx e 48 90001-xxxx),
// bairros e faixas de valor da Nativo (base-conhecimento/nativo.md). Tudo é calculado
// em relação a "agora", então a prévia parece atual em qualquer dia da apresentação.

function criarAleatorio(semente: number) {
  let s = semente;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Aleatorio = () => number;
const sortear = <T>(lista: T[], r: Aleatorio) => lista[Math.floor(r() * lista.length)];
const entre = (min: number, max: number, r: Aleatorio) => min + r() * (max - min);

// ---------------------------------------------------------------- equipe

const telefoneEquipe = (n: number) => `55489000${String(n).padStart(5, "0")}`;

function criarEquipe(agora: Date): Colaborador[] {
  const base = (
    id: string,
    nome: string,
    n: number,
    area: Area | null,
    papel: Colaborador["papel"],
    extra: Partial<Colaborador> = {},
  ): Colaborador => ({
    id,
    nome,
    email: `${nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".")}@nativo.test`,
    telefone: telefoneEquipe(n),
    chaveTelefone: chaveTelefone(telefoneEquipe(n)),
    area,
    papel,
    ativo: true,
    acesso: "ativo",
    statusWhatsApp: "desconectado",
    sessaoCaiuEm: null,
    termoAceitoEm: null,
    ...extra,
  });
  const dias = (d: number) => new Date(agora.getTime() - d * 86400000).toISOString();
  return [
    base("col-helena", "Helena Prado", 1, null, "admin"),
    base("col-ricardo", "Ricardo Alves", 2, null, "admin"),
    base("col-lucas", "Lucas Andrade", 3, "vendas", "corretor", { statusWhatsApp: "conectado", termoAceitoEm: dias(40) }),
    base("col-camila", "Camila Ferraz", 4, "vendas", "corretor", { statusWhatsApp: "conectado", termoAceitoEm: dias(40) }),
    base("col-bruna", "Bruna Teixeira", 5, "locacao", "corretor", {
      termoAceitoEm: dias(35),
      sessaoCaiuEm: new Date(agora.getTime() - 3 * 3600000).toISOString(),
    }),
    base("col-diego", "Diego Martins", 6, "locacao", "corretor", { acesso: "sem_acesso" }),
    base("col-felipe", "Felipe Rocha", 7, "captacao", "corretor", { acesso: "convite_pendente" }),
    base("col-marlene", "Marlene Souza", 8, "recepcao", "corretor", { statusWhatsApp: "conectado", termoAceitoEm: dias(30) }),
  ];
}

// ---------------------------------------------------------------- escala

interface LacunasEscala {
  futuraLocacao: number;
  futuraCaptacao: number;
  passadaLocacao: number;
  passadaCaptacao: number;
}

function criarEscala(hoje: string): { escala: ItemEscala[]; lacunas: LacunasEscala } {
  const util = (i: number) => {
    const d = diaDaSemana(somarDias(hoje, i));
    return d >= 1 && d <= 5;
  };
  const range = (de: number, ate: number) => Array.from({ length: ate - de + 1 }, (_, k) => de + k);
  const futurosUteis = range(2, 14).filter(util);
  const passadosUteis = range(-13, -1).filter(util);
  const lacunas: LacunasEscala = {
    futuraLocacao: futurosUteis[0],
    futuraCaptacao: futurosUteis[4],
    passadaLocacao: passadosUteis[passadosUteis.length - 4],
    passadaCaptacao: passadosUteis[2],
  };

  const escala: ItemEscala[] = [];
  const add = (dia: string, colaboradorId: string, area: Area) =>
    escala.push({ id: `esc-${dia}-${colaboradorId.replace("col-", "")}-${area}`, data: dia, colaboradorId, area, recebidos: 0 });

  for (let i = -14; i <= 14; i++) {
    const dia = somarDias(hoje, i);
    const dow = diaDaSemana(dia);
    const semana = Math.floor((i + 14) / 7);
    if (dow === 0) add(dia, semana % 2 ? "col-lucas" : "col-camila", "vendas");
    else if (dow === 6) add(dia, semana % 2 ? "col-camila" : "col-lucas", "vendas");
    else {
      const k = (((i % 3) + 3) % 3) as 0 | 1 | 2;
      if (k === 0 || k === 1) add(dia, "col-lucas", "vendas");
      if (k === 0 || k === 2) add(dia, "col-camila", "vendas");
    }
    if (dow >= 1 && dow <= 5) {
      if (i !== lacunas.futuraLocacao && i !== lacunas.passadaLocacao) add(dia, dow <= 3 ? "col-bruna" : "col-diego", "locacao");
      if (i !== lacunas.futuraCaptacao && i !== lacunas.passadaCaptacao) add(dia, "col-felipe", "captacao");
      add(dia, "col-marlene", "recepcao");
    }
  }
  return { escala, lacunas };
}

// ---------------------------------------------------------------- leads

interface Kit {
  intencao: Intencao;
  regiao: string;
  tipoImovel: string;
  caracteristicas: string;
  faixaValor: string;
  pagamento: string;
  prazo: string;
  finalidade?: string;
  falaExtra?: string;
  observacoes?: string;
  motivo?: MotivoEncaminhamento;
}

const comprar = (regiao: string, tipoImovel: string, caracteristicas: string, faixaValor: string, pagamento: string, prazo: string, extra: Partial<Kit> = {}): Kit => ({
  intencao: "comprar",
  regiao,
  tipoImovel,
  caracteristicas,
  faixaValor,
  pagamento,
  prazo,
  ...extra,
});
const alugar = (regiao: string, tipoImovel: string, caracteristicas: string, faixaValor: string, pagamento: string, prazo: string): Kit => ({
  intencao: "alugar",
  regiao,
  tipoImovel,
  caracteristicas,
  faixaValor,
  pagamento,
  prazo,
});
const anunciar = (tipoImovel: string, regiao: string, finalidade: string, faixaValor: string, prazo: string, extra: Partial<Kit> = {}): Kit => ({
  intencao: "anunciar",
  regiao,
  tipoImovel,
  caracteristicas: "",
  faixaValor,
  pagamento: "",
  prazo,
  finalidade,
  ...extra,
});
const outro = (motivo: MotivoEncaminhamento, observacoes: string): Kit => ({
  intencao: "outro",
  regiao: "",
  tipoImovel: "",
  caracteristicas: "",
  faixaValor: "",
  pagamento: "",
  prazo: "",
  motivo,
  observacoes,
});

const KITS: Kit[] = [
  comprar("Ingleses do Rio Vermelho ou Rio Vermelho", "casa", "3 quartos, 2 vagas e quintal", "até R$ 900 mil", "financiamento com FGTS", "nos próximos 3 meses", {
    falaExtra: "Trabalho em home office e queria ficar perto da praia",
    observacoes: "Trabalha em home office, quer ficar perto da praia",
  }),
  comprar("Ponta das Canas", "terreno", "uns 400 m², plano", "entre R$ 250 e 350 mil", "à vista", "sem pressa, até 6 meses"),
  alugar("Ingleses do Rio Vermelho", "apartamento", "2 pessoas, 1 vaga, aceita pet", "até R$ 2.800", "fiador", "no início do próximo mês"),
  comprar("Canasvieiras", "apartamento", "2 quartos, 1 vaga, perto do mar", "até R$ 700 mil", "financiamento", "até o fim do ano"),
  comprar("Vargem do Bom Jesus", "casa de condomínio", "4 suítes, piscina e área gourmet", "de R$ 1,8 a 2,5 milhões", "à vista", "nos próximos 60 dias", {
    falaExtra: "Estamos nos mudando de Porto Alegre",
    observacoes: "Família mudando de Porto Alegre",
  }),
  anunciar("terreno", "Vargem do Bom Jesus", "venda", "R$ 380 mil", "sem pressa", {
    falaExtra: "Já tentei vender por conta própria, sem sucesso",
    observacoes: "Já tentou vender por conta própria",
  }),
  comprar("São João do Rio Vermelho", "terreno", "de esquina, de preferência", "até R$ 400 mil", "carta de crédito", "nos próximos 4 meses"),
  outro("pedido_humano", "Pediu para falar com um corretor"),
  comprar("Campeche", "sobrado", "3 quartos, mobiliado", "até R$ 1,2 milhão", "financiamento com FGTS", "entre 3 e 6 meses"),
  alugar("Canasvieiras", "kitnet", "1 pessoa, mobiliada", "até R$ 1.900", "seguro-fiança", "em 15 dias"),
  comprar("Cachoeira do Bom Jesus", "casa", "2 quartos e quintal pro cachorro", "até R$ 650 mil", "financiamento", "agora, já tenho o crédito aprovado", {
    observacoes: "Crédito já aprovado no banco",
  }),
  comprar("Barra da Lagoa", "cobertura", "vista pro mar e 3 suítes", "de R$ 2 a 3 milhões", "à vista", "sem prazo definido"),
  alugar("São João do Rio Vermelho", "casa", "família de 4, 3 quartos e quintal", "até R$ 3.500", "caução", "em 2 meses"),
  comprar("Palhoça", "casa", "3 quartos, 2 banheiros e garagem", "até R$ 480 mil", "financiamento com FGTS", "nos próximos 6 meses"),
  anunciar("casa", "Ingleses do Rio Vermelho", "venda", "R$ 1,1 milhão", "nos próximos 6 meses"),
  comprar("São José (Serraria)", "apartamento", "2 quartos, condomínio com lazer", "até R$ 420 mil", "financiamento", "daqui a 4 meses"),
  outro("reclamacao", "Combinaram de me retornar e não ligaram"),
  comprar("Ingleses do Rio Vermelho", "apartamento", "1 quarto, pra investimento", "até R$ 450 mil", "à vista", "ainda este mês", {
    falaExtra: "É pra investir em aluguel de temporada",
    observacoes: "Compra para investimento em aluguel de temporada",
  }),
  alugar("Campeche", "apartamento", "2 quartos, perto do mercado", "até R$ 3.200", "fiador", "no próximo mês"),
  comprar("Daniela", "terreno", "em condomínio fechado", "de R$ 500 a 700 mil", "à vista", "nos próximos 3 meses"),
  comprar("Vargem Grande", "casa", "3 quartos e espaço pra home office", "até R$ 850 mil", "financiamento", "em 5 meses", {
    motivo: "duvida_fora_da_base",
    falaExtra: "Esse imóvel aceita FGTS? E qual o valor final?",
    observacoes: "Perguntou se o imóvel aceita FGTS e qual o valor final (confirmar)",
  }),
  anunciar("apartamento", "Canasvieiras", "locação", "R$ 3.200 por mês", "o quanto antes"),
  alugar("Rio Vermelho", "casa", "2 quartos e vaga pra 2 carros", "até R$ 3.000", "seguro-fiança", "em 30 dias"),
  outro("pedido_humano", "Pediu para falar com um corretor"),
  comprar("Lagoa da Conceição", "apartamento", "2 quartos, pra morar", "até R$ 900 mil", "financiamento", "no ano que vem", {
    motivo: "duvida_fora_da_base",
    falaExtra: "Consigo aprovar o financiamento?",
    observacoes: "Quer saber se consegue aprovar o financiamento (assunto do banco)",
  }),
  anunciar("terreno", "Ponta das Canas", "permuta", "R$ 600 mil", "sem prazo"),
  comprar("Ribeirão da Ilha", "casa", "3 quartos e terreno grande", "até R$ 800 mil", "permuta com apartamento em Joinville", "nos próximos 4 meses", {
    intencao: "permuta",
    observacoes: "Dá um apartamento em Joinville na troca",
  }),
  alugar("Ponta das Canas", "apartamento", "1 quarto com varanda", "até R$ 2.400", "caução", "no mês que vem"),
  comprar("Canasvieiras", "casa", "4 quartos, pra alugar na temporada", "até R$ 1,5 milhão", "à vista", "nos próximos 2 meses"),
  anunciar("sobrado", "São João do Rio Vermelho", "venda", "R$ 950 mil", "até o fim do ano"),
  outro("pedido_humano", "Pediu para falar com um corretor"),
  alugar("Cachoeira do Bom Jesus", "casa", "2 quartos e quintal", "até R$ 2.600", "seguro-fiança", "imediato"),
  comprar("Ingleses do Rio Vermelho", "casa", "2 quartos, perto do centrinho", "até R$ 600 mil", "permuta + diferença em dinheiro", "sem pressa", {
    intencao: "permuta",
  }),
];

const PRIMEIROS = [
  "Mariana", "Rafael", "Juliana", "Thiago", "Patrícia", "Eduardo", "Fernanda", "Gustavo", "Aline", "Marcelo", "Larissa",
  "André", "Renata", "Bruno", "Vanessa", "Leandro", "Cristiane", "Rodrigo", "Tatiane", "Fábio", "Priscila", "Sérgio",
  "Débora", "Vinícius", "Carla", "Henrique", "Luciana", "Paulo", "Daniela", "Márcio", "Simone", "Alexandre", "Beatriz", "Jonas",
];
const SOBRENOMES = [
  "Souza", "Oliveira", "Santos", "Lima", "Pereira", "Costa", "Ribeiro", "Almeida", "Carvalho", "Gomes", "Martins", "Araújo",
  "Barbosa", "Rocha", "Dias", "Nunes", "Moreira", "Cardoso", "Teixeira", "Mendes",
];

const maiuscula = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function tituloDoAnuncio(k: Kit): string {
  const regiao = k.regiao.split(/\s+ou\s+/)[0];
  if (k.intencao === "alugar") return `${maiuscula(k.tipoImovel)} para alugar em ${regiao}`;
  return `${maiuscula(k.tipoImovel || "imóvel")} à venda em ${regiao}`;
}

type Corte = "todos" | "morno" | "frio";

// ---------------------------------------------------------------- mensagens

function agendar(falas: Fala[], fim: Date, r: Aleatorio): { fala: Fala; quando: Date }[] {
  const gaps: number[] = [];
  falas.forEach((fala, i) => {
    const anterior = falas[i - 1];
    if (!anterior) gaps.push(0);
    else if (fala.autor === "cliente") gaps.push(entre(14, 46, r));
    else if (anterior.autor === "cliente") gaps.push(entre(5, 12, r));
    else gaps.push(entre(2, 4, r));
  });
  const total = gaps.reduce((a, b) => a + b, 0);
  let t = fim.getTime() - (total + entre(4, 8, r)) * 1000;
  return falas.map((fala, i) => {
    t += gaps[i] * 1000;
    return { fala, quando: new Date(t) };
  });
}

export function gerarDemonstracao(agora: Date = new Date()): Estado {
  const r = criarAleatorio(20261104);
  const hoje = diaISO(agora);
  const colaboradores = criarEquipe(agora);
  const { escala, lacunas } = criarEscala(hoje);
  const porId = new Map(colaboradores.map((c) => [c.id, c]));

  // 1. perfis dos leads, do mais antigo ao mais novo
  interface Base {
    kit: Kit;
    corte: Corte;
    quando: Date;
    /** anúncio que abre a conversa; só molda o diálogo, não é gravado no lead */
    anuncio: string;
    /** origem que o corretor registrou na ficha */
    origem: OrigemLead;
    imovelUrl: string;
    nome: string;
    nomeWhatsApp: string;
    telefone: string;
    campos: Record<CampoFluxo, string>;
    cortou: boolean;
  }
  const cortes: Corte[] = ["todos", "morno", "frio", "todos", "morno", "todos", "frio", "morno", "todos", "morno", "todos", "frio"];
  const origens = ["ig", "fb", "site", "direto", "ig", "direto", "site", "ig", "direto", "fb"];
  const horasPico = [9, 10, 11, 12, 12.5, 14, 15, 16, 17.5, 18.5, 19, 19.5, 20, 20.5, 21];

  const bases: Base[] = KITS.map((kit, i) => {
    const corte = kit.intencao === "outro" ? "todos" : cortes[(i * 5 + 1) % cortes.length];
    const primeiro = PRIMEIROS[i % PRIMEIROS.length];
    const sobrenome = SOBRENOMES[(i * 7 + 3) % SOBRENOMES.length];
    const origemTipo = kit.intencao === "outro" ? "direto" : origens[(i * 3 + 2) % origens.length];
    const titulo = tituloDoAnuncio(kit);
    const codigo = `nt-${1100 + i * 37}`;
    const anuncio = origemTipo === "ig" ? `anúncio do Instagram: "${titulo}"` : origemTipo === "fb" ? `anúncio do Facebook: "${titulo}"` : "";
    const ordem = camposDoFluxo(kit.intencao);
    const completos: Record<CampoFluxo, string> = {
      regiao: kit.regiao,
      tipoImovel: kit.tipoImovel,
      nome: `${primeiro} ${sobrenome}`,
      caracteristicas: kit.caracteristicas,
      faixaValor: kit.faixaValor,
      pagamento: kit.pagamento,
      prazo: kit.prazo,
      finalidade: kit.finalidade ?? "",
      melhorHorario: sortear(["depois das 18h", "de manhã", "no fim da tarde", "qualquer horário", "no horário do almoço"], r),
    };
    let manter = ordem.length;
    if (kit.intencao === "outro") manter = kit.motivo === "pedido_humano" && i % 2 === 0 ? 3 : 0;
    else if (corte === "morno") manter = ordem.indexOf("nome") + 1 + (r() < 0.5 ? 1 : 0);
    else if (corte === "frio") manter = 1 + (r() < 0.5 ? 1 : 0);
    else if (r() < 0.3) manter = ordem.length - 1;
    const campos = { regiao: "", tipoImovel: "", nome: "", caracteristicas: "", faixaValor: "", pagamento: "", prazo: "", finalidade: "", melhorHorario: "" } as Record<CampoFluxo, string>;
    ordem.slice(0, manter).forEach((c) => (campos[c] = completos[c]));
    if (kit.intencao === "outro" && kit.motivo === "reclamacao") campos.nome = `${primeiro} ${sobrenome}`;

    // época: espalhar nos últimos 14 dias; hoje, sempre antes de agora
    const diasAtras = 13 - Math.floor((i * 14) / KITS.length);
    const hora = sortear(horasPico, r);
    const quando = new Date(agora);
    quando.setDate(quando.getDate() - diasAtras);
    quando.setHours(Math.floor(hora), Math.round((hora % 1) * 60), Math.floor(r() * 50), 0);
    // o corretor ainda não registrou a origem de alguns leads, sobretudo dos mais recentes
    const diretas: OrigemLead[] = ["google", "indicacao", "placa", "cliente_antigo", "indicacao", "outro"];
    const doTipo: OrigemLead =
      origemTipo === "ig" ? "instagram" : origemTipo === "fb" ? "facebook" : origemTipo === "site" ? "site" : diretas[i % diretas.length];
    const semOrigem = kit.intencao === "outro" || i % 6 === 2 || (diasAtras <= 1 && i % 2 === 0);
    return {
      kit,
      corte,
      quando,
      anuncio,
      origem: semOrigem ? "nao_informada" : doTipo,
      imovelUrl: origemTipo === "direto" ? "" : `nativoterrenos.com.br/imovel/${codigo}`,
      nome: campos.nome,
      nomeWhatsApp: r() < 0.65 ? primeiro : `${primeiro} ${sobrenome[0]}.`,
      telefone: `55489000${String(10101 + i)}`.slice(0, 13),
      campos,
      cortou: manter < ordem.length && kit.intencao !== "outro",
    };
  });

  // fim de semana só tem plantão de vendas: os outros leads vão para a sexta anterior
  for (const b of bases) {
    if (b.kit.intencao === "comprar" || b.kit.intencao === "permuta") continue;
    const dow = b.quando.getDay();
    if (dow === 0) b.quando.setDate(b.quando.getDate() - 2);
    else if (dow === 6) b.quando.setDate(b.quando.getDate() - 1);
  }

  // lacunas da escala no passado: um lead de locação e um de captação caem nesses dias
  const primeiraLocacao = bases.findIndex((b) => b.kit.intencao === "alugar");
  const primeiraCaptacao = bases.findIndex((b) => b.kit.intencao === "anunciar");
  const noDia = (offset: number, hora: number) => {
    const d = new Date(agora);
    d.setDate(d.getDate() + offset);
    d.setHours(Math.floor(hora), Math.round((hora % 1) * 60), 20, 0);
    return d;
  };
  bases[primeiraLocacao].quando = noDia(lacunas.passadaLocacao, 10.6);
  bases[primeiraCaptacao].quando = noDia(lacunas.passadaCaptacao, 15.3);

  // hoje: três leads recentes para a tela inicial
  [0.4, 1.7, 3.2].forEach((horasAtras, k) => {
    const alvo = bases[bases.length - 1 - k];
    alvo.quando = new Date(agora.getTime() - horasAtras * 3600000);
  });
  bases.forEach((b) => {
    if (b.quando.getTime() > agora.getTime() - 15 * 60000) b.quando = new Date(agora.getTime() - 25 * 60000);
  });
  bases.sort((a, b) => a.quando.getTime() - b.quando.getTime());

  // 2. leads, com o corretor escolhido pela mesma regra do sorteio
  const leads: Lead[] = [];
  const escalaPorId = new Map(escala.map((e) => [e.id, e]));

  const montarLead = (b: Base, id: string, quando: Date, conversaBotId: string, sobrescreve: Partial<Lead> = {}): Lead => {
    const intencao = b.kit.intencao;
    const motivo: MotivoEncaminhamento = b.kit.motivo ?? "qualificado";
    const base: Lead = {
      id,
      nome: b.campos.nome,
      nomeWhatsApp: b.nomeWhatsApp,
      telefone: b.telefone,
      chaveTelefone: chaveTelefone(b.telefone),
      nivel: "frio",
      area: areaDoLead(intencao, motivo),
      intencao,
      motivo,
      finalidade: b.campos.finalidade,
      regiao: b.campos.regiao,
      tipoImovel: b.campos.tipoImovel,
      caracteristicas: b.campos.caracteristicas,
      faixaValor: b.campos.faixaValor,
      pagamento: b.campos.pagamento,
      prazo: b.campos.prazo,
      melhorHorario: b.campos.melhorHorario,
      observacoes: b.kit.observacoes ?? "",
      origem: b.origem,
      origemPorId: null,
      origemEm: null,
      imovelUrl: b.imovelUrl,
      colaboradorId: "",
      encaminhadoEm: quando.toISOString(),
      atualizacao: false,
      criterio: "plantao",
      conversaBotId,
      ...sobrescreve,
    };
    base.nivel = classificarNivel({
      intencao: base.intencao,
      nome: base.nome,
      regiao: base.regiao,
      tipoImovel: base.tipoImovel,
      faixaValor: base.faixaValor,
      prazo: base.prazo,
      finalidade: base.finalidade,
    });
    const sorteio = sortearCorretor({
      colaboradores,
      escala,
      leads,
      area: base.area,
      chaveTelefone: base.chaveTelefone,
      dia: diaISO(quando),
      agora: quando,
      aleatorio: r,
    });
    base.colaboradorId = sorteio.colaboradorId;
    if (base.origem !== "nao_informada") {
      base.origemPorId = base.colaboradorId;
      base.origemEm = new Date(Math.min(quando.getTime() + 40 * 60000, agora.getTime() - 60000)).toISOString();
    }
    base.criterio = sorteio.criterio;
    base.atualizacao = sorteio.atualizacao;
    if (sorteio.itemEscalaId) {
      const item = escalaPorId.get(sorteio.itemEscalaId);
      if (item) item.recebidos += 1;
    }
    return base;
  };

  // atualizações: 6 contatos voltam em até 7 dias com algo novo
  interface Atualizacao {
    base: Base;
    quando: Date;
    fala: string;
    resumo: string;
    muda: Partial<Pick<Lead, "faixaValor" | "prazo" | "pagamento" | "caracteristicas">>;
  }
  const candidatos = bases.filter(
    (b) => b.kit.intencao !== "outro" && b.corte !== "frio" && b.quando.getTime() < agora.getTime() - 2.5 * 86400000,
  );
  const variantes = (b: Base): Omit<Atualizacao, "base" | "quando"> => {
    if (b.kit.intencao === "alugar") return { fala: "Oi, preciso me mudar antes, pode ser em 15 dias", resumo: "Atualização: precisa se mudar em 15 dias", muda: { prazo: "em 15 dias" } };
    if (b.kit.intencao === "anunciar") return { fala: "Oi, resolvi aceitar uma proposta um pouco menor", resumo: "Atualização: aceita negociar o valor", muda: { faixaValor: `${b.campos.faixaValor} (aceita negociar)` } };
    return sortear(
      [
        { fala: "Oi, queria atualizar: agora consigo pagar à vista", resumo: "Atualização: agora pretende pagar à vista", muda: { pagamento: "à vista" } },
        { fala: "Oi, mudei de ideia, quero ver casas em condomínio também", resumo: "Atualização: aceita casa de condomínio", muda: { caracteristicas: `${b.campos.caracteristicas}, aceita condomínio` } },
        { fala: "Oi, preciso resolver nas próximas semanas", resumo: "Atualização: prazo adiantado", muda: { prazo: "nas próximas 3 semanas" } },
      ],
      r,
    );
  };
  const atualizacoes: Atualizacao[] = Array.from({ length: 6 }, (_, k) => {
    const original = candidatos[Math.min(candidatos.length - 1, Math.floor(((k + 0.5) * candidatos.length) / 6))];
    const depois = (1 + Math.floor(r() * 5)) * 86400000 + Math.floor(entre(1, 7, r)) * 3600000;
    let quando = new Date(original.quando.getTime() + depois);
    if (quando.getTime() > agora.getTime() - 30 * 60000) quando = new Date(agora.getTime() - (40 + k * 25) * 60000);
    return { base: original, quando, ...variantes(original) };
  });

  // processar em ordem cronológica: bases e atualizações juntas
  type Evento = { quando: Date; base: Base; atualizacao?: Atualizacao };
  const eventos: Evento[] = [
    ...bases.map((b) => ({ quando: b.quando, base: b })),
    ...atualizacoes.map((a) => ({ quando: a.quando, base: a.base, atualizacao: a })),
  ].sort((a, b) => a.quando.getTime() - b.quando.getTime());

  let seq = 0;
  const leadDaBase = new Map<Base, Lead>();
  const conversaBotDaBase = new Map<Base, string>();
  const atualizacoesPorLead = new Map<string, { quando: Date; a: Atualizacao }[]>();
  for (const ev of eventos) {
    seq += 1;
    const id = `lead-${String(seq).padStart(3, "0")}`;
    if (!ev.atualizacao) {
      const conversaId = `conv-bot-${id}`;
      const lead = montarLead(ev.base, id, ev.quando, conversaId);
      leads.push(lead);
      leadDaBase.set(ev.base, lead);
      conversaBotDaBase.set(ev.base, conversaId);
    } else {
      const original = leadDaBase.get(ev.base);
      if (!original) continue;
      const a = ev.atualizacao;
      const lead = montarLead(
        { ...ev.base, campos: { ...ev.base.campos, ...a.muda } },
        id,
        ev.quando,
        original.conversaBotId,
        { observacoes: a.resumo, ...a.muda },
      );
      leads.push(lead);
      const lista = atualizacoesPorLead.get(original.id) ?? [];
      lista.push({ quando: ev.quando, a });
      atualizacoesPorLead.set(original.id, lista);
    }
  }

  // 3. conversas do bot (uma por cliente) e mensagens
  const conversas: Conversa[] = [];
  const mensagens: Mensagem[] = [];
  const contador = new Map<string, number>();
  const novaMensagem = (m: Omit<Mensagem, "id">): Mensagem => {
    const n = (contador.get(m.conversaId) ?? 0) + 1;
    contador.set(m.conversaId, n);
    const msg = { ...m, id: `${m.conversaId}-m${String(n).padStart(2, "0")}` };
    mensagens.push(msg);
    return msg;
  };
  const gravarFalas = (conversaId: string, falas: Fala[], fim: Date) => {
    for (const { fala, quando } of agendar(falas, fim, r)) {
      novaMensagem({
        conversaId,
        direcao: fala.autor === "cliente" ? "entrada" : "saida",
        autor: fala.autor,
        tipo: "texto",
        texto: fala.texto,
        enviadaEm: quando.toISOString(),
      });
    }
  };

  const botPorLead = new Map<string, Conversa>();
  for (const lead of leads.filter((l) => !l.atualizacao)) {
    const b = [...leadDaBase.entries()].find(([, l]) => l.id === lead.id)![0];
    const quando = new Date(lead.encaminhadoEm);
    const perfil: PerfilDialogo = {
      intencao: lead.intencao,
      motivo: lead.motivo,
      nome: lead.nome,
      finalidade: lead.finalidade,
      regiao: lead.regiao,
      tipoImovel: lead.tipoImovel,
      caracteristicas: lead.caracteristicas,
      faixaValor: lead.faixaValor,
      pagamento: lead.pagamento,
      prazo: lead.prazo,
      melhorHorario: lead.melhorHorario,
      observacoes: lead.observacoes,
      falaExtra: b.kit.falaExtra ?? "",
      origem: b.anuncio,
      imovelUrl: lead.imovelUrl,
      hora: quando.getHours(),
      cortou: b.cortou,
    };
    const conv: Conversa = {
      id: lead.conversaBotId,
      canal: "bot",
      nomeCliente: lead.nome || lead.nomeWhatsApp,
      telefoneCliente: lead.telefone,
      chaveTelefone: lead.chaveTelefone,
      colaboradorId: null,
      botPausadoAte: null,
      ultimaMensagemEm: lead.encaminhadoEm,
      leadId: lead.id,
    };
    conversas.push(conv);
    botPorLead.set(lead.id, conv);
    gravarFalas(conv.id, montarDialogo(perfil), quando);
  }
  // atualizações: o contato volta na mesma conversa
  for (const [leadId, lista] of atualizacoesPorLead) {
    const conv = botPorLead.get(leadId)!;
    for (const { quando, a } of lista) {
      gravarFalas(
        conv.id,
        [
          { autor: "cliente", texto: a.fala },
          { autor: "bot", texto: "Claro! Vou avisar o corretor que já está com o seu atendimento." },
          { autor: "bot", texto: "Obrigada por atualizar! 😊" },
        ],
        quando,
      );
    }
  }

  // conversas sem encaminhamento
  const semLead: { caso: CasoSemLead; horasAtras: number; nome: string }[] = [
    { caso: "curioso", horasAtras: 30, nome: "Isabela" },
    { caso: "curioso", horasAtras: 75, nome: "Matheus" },
    { caso: "fora_da_area", horasAtras: 52, nome: "Gabriel Torres" },
    { caso: "curioso", horasAtras: 130, nome: "Natália" },
    { caso: "curioso", horasAtras: 200, nome: "Wesley" },
    { caso: "curioso", horasAtras: 280, nome: "Camilo" },
    { caso: "em_andamento", horasAtras: 0.07, nome: "Ângela" },
  ];
  semLead.forEach((s, i) => {
    const telefone = i === 2 ? "5511900010901" : `554890001${String(800 + i).padStart(4, "0")}`;
    const fim = new Date(agora.getTime() - s.horasAtras * 3600000);
    const conv: Conversa = {
      id: `conv-bot-${s.caso}-${i + 1}`,
      canal: "bot",
      nomeCliente: s.nome,
      telefoneCliente: telefone,
      chaveTelefone: chaveTelefone(telefone),
      colaboradorId: null,
      botPausadoAte: null,
      ultimaMensagemEm: fim.toISOString(),
      leadId: null,
      emAndamento: s.caso === "em_andamento",
    };
    conversas.push(conv);
    gravarFalas(conv.id, dialogoSemLead(s.caso, fim.getHours()), fim);
  });

  // 4. conversas dos corretores, só de quem tem o WhatsApp espelhado
  const espelhados = new Set(
    colaboradores.filter((c) => c.statusWhatsApp === "conectado" || c.sessaoCaiuEm).map((c) => c.id),
  );
  let feitas = 0;
  const recentes = [...leads].filter((l) => !l.atualizacao).reverse();
  for (const lead of recentes) {
    if (feitas >= 20) break;
    const corretor = porId.get(lead.colaboradorId);
    if (!corretor || !espelhados.has(corretor.id)) continue;
    const inicio = new Date(lead.encaminhadoEm);
    const caiu = corretor.sessaoCaiuEm ? new Date(corretor.sessaoCaiuEm) : null;
    if (caiu && inicio.getTime() > caiu.getTime()) continue;
    // leads fora do horário esperam a manhã seguinte
    let t = new Date(inicio);
    if (inicio.getHours() >= 20) {
      t = new Date(inicio);
      t.setDate(t.getDate() + 1);
      t.setHours(8, 40, 0, 0);
    }
    const falas = dialogoCorretor(lead, corretor, feitas);
    const conv: Conversa = {
      id: `conv-cor-${lead.id}`,
      canal: "corretor",
      nomeCliente: lead.nome || lead.nomeWhatsApp,
      telefoneCliente: lead.telefone,
      chaveTelefone: lead.chaveTelefone,
      colaboradorId: corretor.id,
      botPausadoAte: null,
      ultimaMensagemEm: lead.encaminhadoEm,
      leadId: lead.id,
    };
    const geradas: Mensagem[] = [];
    for (const f of falas) {
      t = new Date(t.getTime() + f.minutosDepois * 60000);
      if (t.getTime() > agora.getTime() - 2 * 60000) break;
      geradas.push({
        id: `${conv.id}-m${String(geradas.length + 1).padStart(2, "0")}`,
        conversaId: conv.id,
        direcao: f.autor === "corretor" ? "saida" : "entrada",
        autor: f.autor,
        tipo: f.tipo,
        texto: f.texto,
        midia: f.midia,
        duracao: f.duracao,
        enviadaEm: t.toISOString(),
      });
    }
    if (!geradas.length) continue;
    conv.ultimaMensagemEm = geradas[geradas.length - 1].enviadaEm;
    conversas.push(conv);
    mensagens.push(...geradas);
    feitas += 1;
  }

  // 5. bot pausado onde o corretor já assumiu a conversa (últimos dias)
  const pausar = conversas
    .filter((c) => c.canal === "corretor" && c.leadId)
    .sort((a, b) => b.ultimaMensagemEm.localeCompare(a.ultimaMensagemEm))
    .slice(0, 3);
  for (const c of pausar) {
    const bot = conversas.find((x) => x.canal === "bot" && x.leadId === c.leadId);
    if (bot) bot.botPausadoAte = new Date(agora.getTime() + 7 * 86400000).toISOString();
  }

  // a última mensagem de cada conversa do bot (incluindo as atualizações)
  for (const conv of conversas) {
    if (conv.canal !== "bot") continue;
    const ult = mensagens.filter((m) => m.conversaId === conv.id).map((m) => m.enviadaEm).sort().pop();
    if (ult) conv.ultimaMensagemEm = ult;
  }

  mensagens.sort((a, b) => a.enviadaEm.localeCompare(b.enviadaEm));
  leads.sort((a, b) => a.encaminhadoEm.localeCompare(b.encaminhadoEm));

  return { semente: hoje, colaboradores, escala, conversas, mensagens, leads };
}
