"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bot, Check, CheckCheck, Loader2, Play, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { AvatarBot, AvatarPessoa } from "@/components/pessoa";
import { Selecao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NOME_BOT, useDados } from "@/lib/dados";
import { montarDialogo, type PerfilDialogo } from "@/lib/dados/dialogo-bot";
import { diaISO, hora } from "@/lib/datas";
import { areaDoLead, classificarNivel, sortearCorretor } from "@/lib/regras";
import { chaveTelefone, primeiroNome } from "@/lib/telefone";
import { ROTULO_AREA, ROTULO_INTENCAO, ROTULO_NIVEL, type Area, type Colaborador, type Conversa, type Lead, type Mensagem, type Nivel } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";
import { cn } from "@/lib/utils";

// Conversa gravada, não gerada na hora: não depende de rede e sempre sai igual na reunião.
// O sorteio roda de verdade, sobre a escala de hoje, e o lead entra na auditoria e nas conversas.

interface Cenario {
  titulo: string;
  descricao: string;
  nomeWhatsApp: string;
  observacoes: string;
  perfil: Omit<PerfilDialogo, "hora">;
}

const BASE = { motivo: "qualificado", imovelUrl: "", observacoes: "", falaExtra: "", pagamento: "", prazo: "", melhorHorario: "", finalidade: "", caracteristicas: "", faixaValor: "" } as const;

const CENARIOS: Record<string, Cenario> = {
  compra: {
    titulo: "Compra, vem de anúncio (lead quente)",
    descricao: "Casa nos Ingleses, vem do anúncio do Instagram e responde tudo.",
    nomeWhatsApp: "Camila D.",
    observacoes: "Quer ficar perto da praia",
    perfil: {
      ...BASE,
      intencao: "comprar",
      nome: "Camila Duarte",
      regiao: "Ingleses do Rio Vermelho",
      tipoImovel: "casa",
      caracteristicas: "3 quartos e quintal",
      faixaValor: "até R$ 850 mil",
      pagamento: "financiamento com FGTS",
      prazo: "nos próximos 3 meses",
      melhorHorario: "depois das 18h",
      falaExtra: "Quero ficar perto da praia",
      origem: 'anúncio do Instagram: "Casa à venda em Ingleses do Rio Vermelho"',
      imovelUrl: "nativoterrenos.com.br/imovel/nt-2481",
      cortou: false,
    },
  },
  aluguel: {
    titulo: "Aluguel, contato direto (lead morno)",
    descricao: "Apartamento em Canasvieiras; o contato prefere falar direto com o corretor.",
    nomeWhatsApp: "Rodrigo",
    observacoes: "",
    perfil: {
      ...BASE,
      intencao: "alugar",
      nome: "Rodrigo Pires",
      regiao: "Canasvieiras",
      tipoImovel: "apartamento",
      caracteristicas: "2 pessoas e 1 vaga",
      origem: "",
      cortou: true,
    },
  },
  anunciar: {
    titulo: "Proprietário quer anunciar (captação)",
    descricao: "Terreno em Ponta das Canas: o lead vai para a escala de captação.",
    nomeWhatsApp: "Marta Q.",
    observacoes: "",
    perfil: {
      ...BASE,
      intencao: "anunciar",
      nome: "Marta Quintana",
      finalidade: "venda",
      regiao: "Ponta das Canas",
      tipoImovel: "terreno",
      faixaValor: "R$ 420 mil",
      prazo: "sem pressa",
      melhorHorario: "de manhã",
      origem: "",
      cortou: false,
    },
  },
};

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Fase = "parado" | "conversando" | "processando" | "pronto";

interface Passo {
  rotulo: string;
  detalhe?: ReactNode;
  estado: "pendente" | "ativo" | "feito";
}

function MoldurCelular({ titulo, subtitulo, avatar, children, rodape }: { titulo: string; subtitulo: string; avatar: ReactNode; children: ReactNode; rodape?: ReactNode }) {
  return (
    <div className="mx-auto flex h-[470px] w-[17rem] flex-col overflow-hidden rounded-[2rem] border-[7px] border-neutral-900 dark:border-neutral-600 bg-background shadow-lg">
      <div className="flex shrink-0 items-center gap-2.5 bg-primary px-3 py-2.5 text-primary-foreground">
        {avatar}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{titulo}</p>
          <p className="truncate text-[11px] opacity-80">{subtitulo}</p>
        </div>
      </div>
      {children}
      {rodape ? <div className="shrink-0 border-t bg-muted/50 px-3 py-1.5 text-center text-[10px] text-muted-foreground">{rodape}</div> : null}
    </div>
  );
}

function BolhaCelular({ saida, children, hora: h }: { saida: boolean; children: ReactNode; hora: string }) {
  return (
    <div className={cn("flex", saida ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded-xl px-2.5 py-1.5 text-[13px] shadow-xs", saida ? "rounded-br-sm bg-bubble-out" : "rounded-bl-sm border bg-bubble-in")}>
        <div className="break-words whitespace-pre-wrap">{children}</div>
        <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground tabular-nums">
          {h}
          {saida ? <CheckCheck className="size-3 text-sky-500" /> : null}
        </p>
      </div>
    </div>
  );
}

function Rolagem({ children, dependencia }: { children: ReactNode; dependencia: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dependencia]);
  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-chat p-2.5">
      {children}
    </div>
  );
}

function formatarTexto(t: string) {
  return t.split(/(\*[^*\n]+\*)/g).map((p, i) => (/^\*[^*\n]+\*$/.test(p) ? <strong key={i}>{p.slice(1, -1)}</strong> : <span key={i}>{p}</span>));
}

interface Resultado {
  lead: Lead;
  corretor: Colaborador | undefined;
  conversa: Conversa;
  candidatos: { colaborador: Colaborador; recebidos: number }[];
  area: Area;
}

export function SimularLead({ compacto = false }: { compacto?: boolean }) {
  const { estado, ehAdmin } = useVisao();
  const { registrarEncaminhamento } = useDados();
  const [aberto, setAberto] = useState(false);
  const [cenarioId, setCenarioId] = useState("compra");
  const [velocidade, setVelocidade] = useState<"1" | "2" | "4">("1");
  const [fase, setFase] = useState<Fase>("parado");
  const [mensagens, setMensagens] = useState<{ id: number; autor: "cliente" | "bot"; texto: string; quando: string }[]>([]);
  const [digitando, setDigitando] = useState(false);
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [passo, setPasso] = useState(0);
  const [aviso, setAviso] = useState(false);
  const token = useRef(0);
  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  const cenario = CENARIOS[cenarioId];

  const parar = () => {
    token.current += 1;
  };
  useEffect(() => () => void (token.current += 1), []);

  const reiniciar = () => {
    parar();
    setFase("parado");
    setMensagens([]);
    setDigitando(false);
    setNivel(null);
    setResultado(null);
    setPasso(0);
    setAviso(false);
  };

  const iniciar = async () => {
    parar();
    const meu = token.current;
    const vivo = () => token.current === meu;
    const v = Number(velocidade);
    const esperar = (ms: number) => dormir(ms / v);

    setMensagens([]);
    setNivel(null);
    setResultado(null);
    setAviso(false);
    setPasso(1);
    setFase("conversando");

    const agora = new Date();
    const perfil: PerfilDialogo = { ...cenario.perfil, hora: agora.getHours() };
    const falas = montarDialogo(perfil);
    const registradas: Mensagem[] = [];
    const seq = estadoRef.current.leads.length + 1;
    const telefone = `554890002${String(1000 + seq).padStart(4, "0")}`;
    const leadId = `lead-sim-${Date.now().toString(36)}`;
    const conversaId = `conv-bot-${leadId}`;

    for (let i = 0; i < falas.length; i++) {
      const f = falas[i];
      if (f.autor === "bot") {
        setDigitando(true);
        await esperar(Math.min(2400, 650 + f.texto.length * 13));
      } else {
        await esperar(900 + Math.random() * 700);
      }
      if (!vivo()) return;
      setDigitando(false);
      const quando = new Date().toISOString();
      setMensagens((m) => [...m, { id: i, autor: f.autor, texto: f.texto, quando }]);
      registradas.push({
        id: `${conversaId}-m${String(i + 1).padStart(2, "0")}`,
        conversaId,
        direcao: f.autor === "cliente" ? "entrada" : "saida",
        autor: f.autor,
        tipo: "texto",
        texto: f.texto,
        enviadaEm: quando,
      });
      if (i === 1) setPasso(2);
    }

    // classificar
    setFase("processando");
    setPasso(3);
    await esperar(900);
    if (!vivo()) return;
    const intencao = perfil.intencao;
    const area = areaDoLead(intencao, perfil.motivo);
    const nivelLead = classificarNivel({
      intencao,
      nome: perfil.nome,
      regiao: perfil.regiao,
      tipoImovel: perfil.tipoImovel,
      faixaValor: perfil.faixaValor,
      prazo: perfil.prazo,
      finalidade: perfil.finalidade,
    });
    setNivel(nivelLead);

    // sortear entre os corretores escalados hoje
    setPasso(4);
    await esperar(900);
    if (!vivo()) return;
    const atual = estadoRef.current;
    const hoje = diaISO(new Date());
    const chave = chaveTelefone(telefone);
    const sorteio = sortearCorretor({
      colaboradores: atual.colaboradores,
      escala: atual.escala,
      leads: atual.leads,
      area,
      chaveTelefone: chave,
      dia: hoje,
      agora: new Date(),
      aleatorio: Math.random,
    });
    const candidatos = atual.escala
      .filter((e) => e.data === hoje && e.area === area)
      .map((e) => ({ colaborador: atual.colaboradores.find((c) => c.id === e.colaboradorId), recebidos: e.recebidos }))
      .filter((c): c is { colaborador: Colaborador; recebidos: number } => Boolean(c.colaborador?.ativo));
    const corretor = atual.colaboradores.find((c) => c.id === sorteio.colaboradorId);
    await esperar(1500);
    if (!vivo()) return;

    // gravar
    setPasso(5);
    const encaminhadoEm = new Date().toISOString();
    const lead: Lead = {
      id: leadId,
      nome: perfil.nome,
      nomeWhatsApp: cenario.nomeWhatsApp,
      telefone,
      chaveTelefone: chave,
      nivel: nivelLead,
      area,
      intencao,
      motivo: perfil.motivo,
      finalidade: perfil.finalidade,
      regiao: perfil.regiao,
      tipoImovel: perfil.tipoImovel,
      caracteristicas: perfil.caracteristicas,
      faixaValor: perfil.faixaValor,
      pagamento: perfil.pagamento,
      prazo: perfil.prazo,
      melhorHorario: perfil.melhorHorario,
      observacoes: cenario.observacoes,
      origem: "nao_informada",
      origemPorId: null,
      origemEm: null,
      imovelUrl: perfil.imovelUrl,
      colaboradorId: sorteio.colaboradorId,
      encaminhadoEm,
      atualizacao: sorteio.atualizacao,
      criterio: sorteio.criterio,
      conversaBotId: conversaId,
    };
    const conversa: Conversa = {
      id: conversaId,
      canal: "bot",
      nomeCliente: perfil.nome,
      telefoneCliente: telefone,
      chaveTelefone: chave,
      colaboradorId: null,
      botPausadoAte: null,
      ultimaMensagemEm: registradas[registradas.length - 1]?.enviadaEm ?? encaminhadoEm,
      leadId,
    };
    registrarEncaminhamento({ lead, conversa, mensagens: registradas, itemEscalaId: sorteio.itemEscalaId });
    setResultado({ lead, corretor, conversa, candidatos, area });
    await esperar(1000);
    if (!vivo()) return;

    // avisar o corretor
    setPasso(6);
    await esperar(700);
    if (!vivo()) return;
    setAviso(true);
    await esperar(600);
    if (!vivo()) return;
    setPasso(7);
    setFase("pronto");
    toast.success("Lead registrado", { description: `${perfil.nome} foi encaminhado para ${corretor?.nome ?? "a recepção"}.` });
  };

  const passos = useMemo<Passo[]>(() => {
    const est = (n: number): Passo["estado"] => (passo > n ? "feito" : passo === n ? "ativo" : "pendente");
    const r = resultado;
    return [
      { rotulo: "Mensagem chega no número do bot", detalhe: "API oficial da Meta → n8n", estado: est(1) },
      { rotulo: `${NOME_BOT} qualifica o contato`, detalhe: "Uma pergunta por vez, sem prometer preço nem disponibilidade", estado: est(2) },
      {
        rotulo: "Classifica o lead",
        detalhe: nivel ? (
          <span className="inline-flex items-center gap-1.5">
            <EtiquetaNivel nivel={nivel} />
            <span>por regra, não pela IA</span>
          </span>
        ) : undefined,
        estado: est(3),
      },
      {
        rotulo: "Sorteia o corretor escalado hoje",
        detalhe: r ? (
          <div className="mt-1 space-y-1">
            {r.candidatos.length ? (
              <ul className="space-y-0.5">
                {r.candidatos.map((c) => (
                  <li
                    key={c.colaborador.id}
                    className={cn("flex items-center gap-1.5 rounded px-1.5 py-0.5", c.colaborador.id === r.corretor?.id && "bg-accent font-medium text-accent-foreground")}
                  >
                    {c.colaborador.id === r.corretor?.id ? <Check className="size-3" /> : <span className="size-3" />}
                    {c.colaborador.nome}
                    <span className="ml-auto text-muted-foreground tabular-nums">{c.recebidos} hoje</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-muted-foreground">
              {r.lead.criterio === "escala"
                ? `Quem recebeu menos entra no sorteio (escala de ${ROTULO_AREA[r.area]}).`
                : r.lead.criterio === "reuso_7_dias"
                  ? "Este contato já foi atendido nos últimos 7 dias: vai para o mesmo corretor."
                  : `Ninguém escalado em ${ROTULO_AREA[r.area]} hoje: o lead vai para a recepção.`}
            </p>
          </div>
        ) : undefined,
        estado: est(4),
      },
      {
        rotulo: "Grava na auditoria e nas conversas",
        detalhe: r ? (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <EtiquetaArea area={r.lead.area} />
            <span>→ {r.corretor?.nome}</span>
          </span>
        ) : undefined,
        estado: est(5),
      },
      { rotulo: "Avisa o corretor por modelo oficial", detalhe: "Curto: a ficha completa fica no painel", estado: est(6) },
    ];
  }, [passo, nivel, resultado]);

  if (!ehAdmin) return null;

  const corretor = resultado?.corretor;
  const lead = resultado?.lead;

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        setAberto(o);
        if (!o) parar();
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size={compacto ? "icon" : "default"}
            title="Simular lead"
            aria-label="Simular lead"
            className={cn("border-primary/30 bg-accent/60 text-accent-foreground hover:bg-accent", compacto ? "mx-auto" : "w-full justify-start")}
          />
        }
      >
        <Sparkles />
        {compacto ? null : "Simular lead"}
      </DialogTrigger>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-1.5rem)] max-w-6xl gap-0 overflow-y-auto p-0 sm:max-w-6xl">
        <div className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Simular um lead chegando
          </DialogTitle>
          <DialogDescription>O cliente fala com o bot, o sistema classifica, sorteia o corretor escalado hoje e avisa no WhatsApp dele.</DialogDescription>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Selecao
              valor={cenarioId}
              aoMudar={(v) => {
                reiniciar();
                setCenarioId(v);
              }}
              opcoes={Object.entries(CENARIOS).map(([valor, c]) => ({ valor, rotulo: c.titulo }))}
              className="min-w-72"
              rotuloAcessivel="Cenário"
            />
            <Selecao valor={velocidade} aoMudar={setVelocidade} opcoes={[{ valor: "1", rotulo: "Velocidade 1x" }, { valor: "2", rotulo: "Velocidade 2x" }, { valor: "4", rotulo: "Velocidade 4x" }]} rotuloAcessivel="Velocidade" />
            <Button onClick={iniciar} disabled={fase === "conversando" || fase === "processando"}>
              {fase === "parado" ? <Play /> : <RotateCcw />}
              {fase === "parado" ? "Iniciar" : "Repetir"}
            </Button>
            {fase !== "parado" ? (
              <Button variant="ghost" onClick={reiniciar}>
                Limpar
              </Button>
            ) : null}
            <p className="basis-full text-xs text-muted-foreground sm:basis-auto">{cenario.descricao}</p>
          </div>
        </div>

        <div className="grid gap-5 bg-secondary/50 p-5 lg:grid-cols-[17rem_1fr_17rem]">
          <div>
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">1 · Cliente no WhatsApp</p>
            <MoldurCelular
              titulo={`${NOME_BOT} · Nativo Imóveis`}
              subtitulo={digitando ? "digitando…" : "assistente virtual"}
              avatar={<AvatarBot tamanho="md" className="bg-primary-foreground/20 text-primary-foreground" />}
              rodape="Número do bot na API oficial da Meta"
            >
              <Rolagem dependencia={`${mensagens.length}-${digitando}`}>
                {mensagens.length === 0 && fase === "parado" ? <p className="px-4 py-10 text-center text-xs text-muted-foreground">Toque em Iniciar para ver a conversa.</p> : null}
                {mensagens.map((m) => (
                  <BolhaCelular key={m.id} saida={m.autor === "cliente"} hora={hora(m.quando)}>
                    {formatarTexto(m.texto)}
                  </BolhaCelular>
                ))}
                {digitando ? (
                  <div className="flex">
                    <div className="flex items-center gap-1 rounded-xl rounded-bl-sm border bg-bubble-in px-3 py-2 shadow-xs">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 120}ms` }} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </Rolagem>
            </MoldurCelular>
          </div>

          <div>
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">2 · O que o sistema faz</p>
            <ol className="rounded-xl border bg-card p-4">
              {passos.map((p, i) => (
                <li key={p.rotulo} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < passos.length - 1 ? <span className="absolute top-6 bottom-0 left-[11px] w-px bg-border" aria-hidden /> : null}
                  <span
                    className={cn(
                      "z-10 grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                      p.estado === "feito" && "border-primary bg-primary text-primary-foreground",
                      p.estado === "ativo" && "border-primary bg-background text-primary",
                      p.estado === "pendente" && "bg-background text-muted-foreground",
                    )}
                  >
                    {p.estado === "feito" ? <Check className="size-3.5" /> : p.estado === "ativo" ? <Loader2 className="size-3.5 animate-spin" /> : i + 1}
                  </span>
                  <div className={cn("min-w-0 flex-1 text-sm", p.estado === "pendente" && "text-muted-foreground")}>
                    <p className="font-medium">{p.rotulo}</p>
                    {p.detalhe && p.estado !== "pendente" ? <div className="text-xs text-muted-foreground">{p.detalhe}</div> : null}
                  </div>
                </li>
              ))}
            </ol>

            {fase === "pronto" && lead ? (
              <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-3 text-sm text-emerald-950 dark:text-emerald-100">
                <p className="font-medium">Lead registrado no painel</p>
                <p className="mt-0.5 text-xs">
                  {lead.nome} aparece agora na Auditoria e nas Conversas, com {corretor?.nome} como corretor, data e hora.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" render={<Link href={`/auditoria?lead=${lead.id}`} onClick={() => setAberto(false)} />} nativeButton={false}>
                    Ver na auditoria
                  </Button>
                  <Button size="sm" variant="outline" render={<Link href={`/conversas?c=${lead.conversaBotId}`} onClick={() => setAberto(false)} />} nativeButton={false}>
                    Ver a conversa
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">3 · WhatsApp do corretor</p>
            <MoldurCelular
              titulo="Nativo Imóveis"
              subtitulo={corretor ? `para ${primeiroNome(corretor.nome)}` : "conta comercial"}
              avatar={<AvatarPessoa nome="Nativo Imoveis" tamanho="md" />}
              rodape="Modelo de utilidade aprovado pela Meta"
            >
              <Rolagem dependencia={aviso}>
                {aviso && lead ? (
                  <div className="max-w-[92%] rounded-xl rounded-bl-sm border bg-bubble-in shadow-xs">
                    <div className="space-y-1 px-3 pt-2 pb-2 text-[13px]">
                      <p className="font-medium">Novo lead da Nativo Imóveis para você.</p>
                      <p>
                        <span className="text-muted-foreground">Nome:</span> {lead.nome}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Intenção:</span> {ROTULO_INTENCAO[lead.intencao]}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Nível:</span> {ROTULO_NIVEL[lead.nivel]}
                      </p>
                      <p className="text-right text-[10px] text-muted-foreground tabular-nums">{hora(lead.encaminhadoEm)}</p>
                    </div>
                    <Link
                      href={`/lead/${lead.id}`}
                      onClick={() => setAberto(false)}
                      className="block border-t px-3 py-2 text-center text-[13px] font-medium text-primary hover:bg-muted/60"
                    >
                      Ver ficha no painel
                    </Link>
                  </div>
                ) : (
                  <p className="px-4 py-10 text-center text-xs text-muted-foreground">O aviso aparece aqui quando o lead for encaminhado.</p>
                )}
              </Rolagem>
            </MoldurCelular>
          </div>
        </div>

        <p className="flex items-center gap-1.5 border-t px-5 py-2.5 text-xs text-muted-foreground">
          <Bot className="size-3.5" />
          Conversa gravada para a demonstração. No sistema real quem conversa é o bot, com o prompt da Nativo.
        </p>
      </DialogContent>
    </Dialog>
  );
}
