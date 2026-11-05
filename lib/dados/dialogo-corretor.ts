import { primeiroNome } from "../telefone";
import type { Colaborador, Lead, TipoMensagem } from "../tipos";

// Conversa do corretor com o cliente, como o espelho do WhatsApp dele mostraria.
// Escrita por regra a partir do lead; fotos livres de imóveis em public/midia.

export interface FalaCorretor {
  autor: "cliente" | "corretor";
  tipo: TipoMensagem;
  texto: string;
  midia?: string;
  duracao?: number;
  /** minutos depois da fala anterior (a primeira conta a partir do encaminhamento) */
  minutosDepois: number;
}

const CASAS = ["/midia/imovel-1.jpg", "/midia/imovel-3.jpg", "/midia/imovel-4.jpg", "/midia/imovel-5.jpg", "/midia/imovel-8.jpg", "/midia/imovel-2.jpg"];
const INTERIORES = ["/midia/imovel-6.jpg", "/midia/imovel-7.jpg"];

const minusculo = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const artigo = (t: string) => (/^(casa|cobertura|kitnet|sala|loja|chácara)/i.test(t.trim()) ? "uma" : "um");
const regiaoCurta = (r: string) => r.split(/\s+ou\s+|,/)[0].trim();

export function dialogoCorretor(lead: Lead, corretor: Colaborador, variante: number): FalaCorretor[] {
  const eu = primeiroNome(corretor.nome);
  const n = primeiroNome(lead.nome || lead.nomeWhatsApp);
  const tipo = lead.tipoImovel ? `${artigo(lead.tipoImovel)} ${minusculo(lead.tipoImovel)}` : "um imóvel";
  const regiao = lead.regiao ? ` em ${regiaoCurta(lead.regiao)}` : "";
  const foto = (i: number) => CASAS[(variante + i) % CASAS.length];
  const interior = (i: number) => INTERIORES[(variante + i) % INTERIORES.length];
  const f: FalaCorretor[] = [];
  const corr = (texto: string, minutosDepois: number) => f.push({ autor: "corretor", tipo: "texto", texto, minutosDepois });
  const cli = (texto: string, minutosDepois: number) => f.push({ autor: "cliente", tipo: "texto", texto, minutosDepois });
  const imagem = (midia: string, texto: string, minutosDepois: number) => f.push({ autor: "corretor", tipo: "imagem", texto, midia, minutosDepois });
  const audio = (duracao: number, minutosDepois: number) => f.push({ autor: "cliente", tipo: "audio", texto: "", duracao, minutosDepois });

  if (corretor.area === "recepcao") {
    corr(`Oi ${n}, tudo bem? Aqui é a ${eu}, da recepção da Nativo Imóveis. Vi que você conversou com a nossa assistente virtual.`, 6);
    cli("Oi! Isso, pedi pra falar com alguém", 4);
    corr("Já anotei o seu caso e vou te passar para o corretor certo ainda hoje, tudo bem?", 2);
    cli("Tudo bem, obrigado!", 3);
    return f;
  }

  if (lead.intencao === "alugar" || lead.intencao === "temporada") {
    corr(`Oi ${n}, tudo bem? Aqui é a ${eu}, da Nativo Imóveis. Recebi seu contato sobre aluguel de ${tipo}${regiao}.`, 9);
    cli("Oi! Isso mesmo", 5);
    corr("Tenho uma opção que aceita pet e fica pertinho da praia. Posso te mandar as fotos?", 2);
    cli("Pode sim", 3);
    imagem(interior(0), "Sala e cozinha integradas", 2);
    imagem(interior(1), "Quarto e varanda", 0.3);
    if (variante % 2 === 0) audio(9 + (variante % 5), 7);
    else cli("Gostei bastante! Qual o dia pra ver pessoalmente?", 7);
    corr("Posso te mostrar na quinta, depois das 18h. Funciona?", 3);
    cli("Funciona!", 4);
    corr("Combinado, te mando o endereço na quarta. 👍", 2);
    return f.slice(0, lead.nivel === "quente" ? f.length : lead.nivel === "morno" ? 6 : 4);
  }

  // compra, permuta e captação
  corr(`Oi ${n}, tudo bem? Aqui é ${eu === "Felipe" || eu === "Lucas" ? "o" : "a"} ${eu}, da Nativo Imóveis. Vi seu contato sobre ${tipo}${regiao}.`, 12);
  cli(`Oi ${eu}! Tudo bem sim`, 4);
  corr("Separei alguns imóveis que combinam com o que você passou. Esse é o primeiro:", 3);
  imagem(foto(0), `${lead.tipoImovel ? lead.tipoImovel[0].toUpperCase() + lead.tipoImovel.slice(1) : "Imóvel"}${regiao}`, 0.3);
  if (variante % 3 === 0) audio(11 + (variante % 7), 6);
  else cli("Gostei bastante! Tem mais fotos?", 6);
  imagem(foto(1), "Área externa", 4);
  imagem(foto(2), "Mais uma opção na mesma região", 0.4);
  corr("Vamos marcar uma visita? Tenho amanhã às 10h ou sábado de manhã.", 1);
  cli("Sábado de manhã fica bom pra mim", 9);
  corr("Combinado! Te mando o endereço certinho na sexta. 👍", 2);
  return f.slice(0, lead.nivel === "quente" ? f.length : lead.nivel === "morno" ? 6 : 3);
}
