import type { Intencao, MotivoEncaminhamento } from "../tipos";

// Monta a conversa do bot a partir dos campos do lead. A voz segue prompts/sdr-system-prompt.md:
// balões curtos, uma pergunta por vez, nunca confirma preço nem disponibilidade, sem travessão.
// O texto é gerado por regra, não pelo modelo; a versão gerada pelo prompt real
// (n8n/simular-conversas.py) entra como carga opcional depois.

export const NOME_BOT = "Natalia";
export const NOME_EMPRESA = "Nativo Imóveis";

export interface PerfilDialogo {
  intencao: Intencao;
  motivo: MotivoEncaminhamento;
  nome: string;
  finalidade: string;
  regiao: string;
  tipoImovel: string;
  caracteristicas: string;
  faixaValor: string;
  pagamento: string;
  prazo: string;
  melhorHorario: string;
  /** resumo para o corretor (3ª pessoa); na reclamação também é a fala do contato */
  observacoes: string;
  /** o que o contato diz por conta própria, em 1ª pessoa */
  falaExtra: string;
  /** anúncio que abre a conversa ("anúncio do Instagram: …"); só molda o diálogo */
  origem: string;
  imovelUrl: string;
  /** hora do dia da primeira mensagem, para o cumprimento */
  hora: number;
  /** o contato desistiu de responder e pediu para falar direto com o corretor */
  cortou: boolean;
}

export interface Fala {
  autor: "cliente" | "bot";
  texto: string;
}

type Campo = "regiao" | "tipoImovel" | "nome" | "caracteristicas" | "faixaValor" | "pagamento" | "prazo" | "finalidade" | "melhorHorario";

const ORDEM: Record<"comprar" | "alugar" | "anunciar", Campo[]> = {
  comprar: ["regiao", "tipoImovel", "nome", "caracteristicas", "faixaValor", "pagamento", "prazo", "melhorHorario"],
  alugar: ["regiao", "tipoImovel", "nome", "caracteristicas", "faixaValor", "pagamento", "prazo", "melhorHorario"],
  anunciar: ["tipoImovel", "regiao", "finalidade", "nome", "faixaValor", "prazo", "melhorHorario"],
};

const PERGUNTAS: Record<"comprar" | "alugar" | "anunciar", Record<string, string>> = {
  comprar: {
    regiao: "Em qual região ou bairro você está procurando?",
    tipoImovel: "E que tipo de imóvel você tem em mente?",
    nome: "Como posso te chamar?",
    caracteristicas: "Tem algo que seja indispensável pra você? Quartos, vagas, quintal...",
    faixaValor: "Qual faixa de investimento você está considerando?",
    pagamento: "E como pretende pagar: financiamento, à vista, FGTS?",
    prazo: "Pra quando você pretende fechar a compra?",
    melhorHorario: "Qual o melhor horário pro corretor te chamar?",
  },
  alugar: {
    regiao: "Em qual região você quer morar?",
    tipoImovel: "Você prefere casa, apartamento ou kitnet?",
    nome: "Como posso te chamar?",
    caracteristicas: "Quantas pessoas vão morar? Precisa de algo específico, como vaga ou aceitar pet?",
    faixaValor: "Qual o valor máximo de aluguel por mês?",
    pagamento: "E qual garantia você teria: fiador, seguro-fiança ou caução?",
    prazo: "Pra quando você precisa se mudar?",
    melhorHorario: "Qual o melhor horário pro corretor te chamar?",
  },
  anunciar: {
    tipoImovel: "Que tipo de imóvel você quer anunciar?",
    regiao: "E onde ele fica?",
    finalidade: "A ideia é vender, alugar ou permutar?",
    nome: "Como posso te chamar?",
    faixaValor: "Já tem um valor pretendido em mente?",
    prazo: "Tem algum prazo ou urgência?",
    melhorHorario: "Qual o melhor horário pro corretor te chamar?",
  },
};

export type Fluxo = "comprar" | "alugar" | "anunciar";
export type CampoFluxo = Campo;

export function fluxoDaIntencao(i: Intencao): Fluxo {
  return i === "anunciar" ? "anunciar" : i === "alugar" || i === "temporada" ? "alugar" : "comprar";
}

/** ordem em que o bot pergunta; o gerador corta a lista para fazer leads mornos e frios */
export function camposDoFluxo(i: Intencao): Campo[] {
  return ORDEM[fluxoDaIntencao(i)];
}

const minusculo = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

const artigo = (tipo: string) => (/^(casa|cobertura|kitnet|sala|loja|chácara)/i.test(tipo.trim()) ? "uma" : "um");

function cumprimento(hora: number) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function abertura(p: PerfilDialogo): string {
  if (p.origem.startsWith("anúncio do Instagram")) return "Oi, vi esse anúncio no Instagram. Ainda está disponível?";
  if (p.origem.startsWith("anúncio do Facebook")) return "Olá! Vi o anúncio de vocês no Facebook. Esse imóvel ainda está disponível?";
  if (p.imovelUrl) return `Olá! Tenho interesse nesse imóvel: ${p.imovelUrl}`;
  const c = cumprimento(p.hora);
  if (p.intencao === "alugar" || p.intencao === "temporada") {
    return `${c}! Vocês têm ${p.tipoImovel ? `${artigo(p.tipoImovel)} ${minusculo(p.tipoImovel)}` : "imóvel"} pra alugar${p.regiao ? ` em ${p.regiao}` : ""}?`;
  }
  if (p.intencao === "anunciar") return `${c}, queria anunciar um imóvel com vocês. Como funciona?`;
  if (p.tipoImovel && p.regiao) return `${c}! Vocês têm ${artigo(p.tipoImovel)} ${minusculo(p.tipoImovel)} à venda em ${p.regiao}?`;
  return `${c}, queria saber sobre imóveis à venda.`;
}

const SAUDACAO = `Oi! Eu sou a *${NOME_BOT}*, assistente virtual da ${NOME_EMPRESA} 🙂`;

function fechamento(p: PerfilDialogo): string[] {
  const nome = p.nome ? `, ${p.nome.split(" ")[0]}` : "";
  return [`Perfeito${nome}! Já passei suas informações para um corretor da Nativo.`, "Ele vai te chamar aqui mesmo, neste número. Obrigada! 😊"];
}

export function montarDialogo(p: PerfilDialogo): Fala[] {
  const f: Fala[] = [];
  const bot = (...t: string[]) => t.forEach((texto) => f.push({ autor: "bot", texto }));
  const cliente = (texto: string) => f.push({ autor: "cliente", texto });

  if (p.motivo === "reclamacao") {
    cliente("Estou tentando falar com vocês há dias e ninguém me responde");
    bot(SAUDACAO, "Sinto muito por isso. Posso deixar registrado o que aconteceu e passar para a equipe da Nativo?");
    cliente(p.observacoes || "Combinaram de me retornar e não ligaram");
    bot("Obrigada por explicar. Já deixei tudo registrado e vou passar agora para a equipe, que vai entrar em contato.");
    cliente("Tá bom, obrigado");
    bot("Por nada. Sentimos muito pelo transtorno.");
    return f;
  }

  if (p.motivo === "pedido_humano" && p.intencao === "outro") {
    cliente("Oi, quero falar com um corretor");
    bot(SAUDACAO, "Claro! Vou te passar agora para um corretor da Nativo.");
    bot("Ele vai te chamar aqui mesmo, neste número, tudo bem?");
    cliente("Ok, obrigado");
    bot("Por nada! 😊");
    return f;
  }

  const chave: "comprar" | "alugar" | "anunciar" =
    p.intencao === "anunciar" ? "anunciar" : p.intencao === "alugar" || p.intencao === "temporada" ? "alugar" : "comprar";
  const verbo = chave === "anunciar" ? "Anunciar" : chave === "alugar" ? "Alugar" : p.intencao === "permuta" ? "Permuta" : "Comprar";

  cliente(abertura(p));
  const chegouComImovel = p.origem !== "" || p.imovelUrl !== "";
  if (chegouComImovel) {
    bot(SAUDACAO, "Sobre disponibilidade e valor, quem confirma é o corretor, mas já vou reunindo algumas informações pra agilizar, tudo bem?");
    cliente("Pode ser!");
    bot(chave === "anunciar" ? "Você quer anunciar um imóvel com a gente?" : "Você está pensando em comprar ou alugar?");
    cliente(verbo === "Permuta" ? "Quero permutar" : verbo === "Anunciar" ? "Isso, quero anunciar" : verbo);
  } else {
    bot(SAUDACAO, "Você está buscando comprar, alugar ou anunciar um imóvel?");
    cliente(verbo === "Permuta" ? "Quero permutar" : verbo === "Anunciar" ? "Anunciar" : verbo);
  }

  const campos = ORDEM[chave];
  let respondeu = 0;
  for (const campo of campos) {
    const resposta = p[campo];
    if (!resposta) continue;
    bot(PERGUNTAS[chave][campo]);
    cliente(campo === "tipoImovel" ? minusculo(resposta) : resposta);
    respondeu++;
  }

  if (p.cortou || respondeu < campos.length) {
    const pergunta = campos.find((c) => !p[c] && c !== "melhorHorario");
    if (pergunta) {
      bot(PERGUNTAS[chave][pergunta]);
      cliente("Prefiro conversar direto com o corretor, pode ser?");
      bot("Pode sim! Vou passar o que já tenho pra ele.");
    }
  }

  if (p.falaExtra) {
    cliente(p.falaExtra);
    bot(
      p.motivo === "duvida_fora_da_base"
        ? "Essa confirmação é com o corretor. Vou passar a sua dúvida pra ele junto com o que você me contou."
        : "Anotado, vou deixar isso registrado pro corretor.",
    );
  }

  bot(...fechamento(p));
  return f;
}

/** conversas sem encaminhamento: curioso, fora da área e uma em andamento */
export type CasoSemLead = "curioso" | "fora_da_area" | "em_andamento";

export function dialogoSemLead(caso: CasoSemLead, hora: number): Fala[] {
  const c = cumprimento(hora);
  if (caso === "curioso") {
    return [
      { autor: "cliente", texto: `${c}` },
      { autor: "bot", texto: SAUDACAO },
      { autor: "bot", texto: "Você está buscando comprar, alugar ou anunciar um imóvel?" },
      { autor: "cliente", texto: "Só estou olhando por enquanto" },
      { autor: "bot", texto: "Sem problema! Se quiser dar uma olhada nos imóveis, o site é nativoterrenos.com.br." },
      { autor: "bot", texto: "Qualquer dúvida é só chamar por aqui 🙂" },
      { autor: "cliente", texto: "Beleza, obrigado" },
    ];
  }
  if (caso === "fora_da_area") {
    return [
      { autor: "cliente", texto: `${c}, procuro um apartamento em São Paulo, zona sul` },
      { autor: "bot", texto: SAUDACAO },
      { autor: "bot", texto: "A Nativo atua na Grande Florianópolis e em algumas cidades do litoral catarinense, então não consigo te ajudar com um imóvel em São Paulo." },
      { autor: "bot", texto: "Se algum dia pensar em Florianópolis, é só chamar! 😊" },
      { autor: "cliente", texto: "Entendi, valeu" },
    ];
  }
  return [
    { autor: "cliente", texto: "Oi, vocês têm terreno à venda em Ponta das Canas?" },
    { autor: "bot", texto: SAUDACAO },
    { autor: "bot", texto: "Você está buscando comprar, alugar ou anunciar um imóvel?" },
    { autor: "cliente", texto: "Comprar" },
    { autor: "bot", texto: "Que tipo de imóvel você tem em mente?" },
    { autor: "cliente", texto: "terreno, de uns 400 m²" },
    { autor: "bot", texto: "Como posso te chamar?" },
  ];
}
