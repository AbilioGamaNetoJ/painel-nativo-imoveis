"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Bot, Compass, Copy, MapPin, MessageSquare, Pencil, RefreshCw, Send, StickyNote, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AvatarPessoa } from "@/components/pessoa";
import { EtiquetaArea, EtiquetaNivel } from "@/components/etiquetas";
import { Selecao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDados } from "@/lib/dados";
import { dataHora, haQuanto } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { ORIGENS, ROTULO_CRITERIO, ROTULO_INTENCAO, ROTULO_ORIGEM, type CamposLead, type Intencao, type Lead } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";
import { cn } from "@/lib/utils";

const INTENCOES = Object.keys(ROTULO_INTENCAO) as Intencao[];

/** Bloco da ficha: título pequeno com ícone e o conteúdo dentro de um cartão */
function Bloco({ titulo, icone: Icone, children }: { titulo: string; icone: LucideIcon; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-3.5">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icone className="size-3.5" />
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Rótulo pequeno em cima e o valor embaixo; campo vazio aparece como traço, para ver o que falta perguntar */
function Dado({ rotulo, children, largo }: { rotulo: string; children?: ReactNode; largo?: boolean }) {
  return (
    <div className={cn("min-w-0", largo && "col-span-2")}>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 text-sm break-words">{children || <span className="text-muted-foreground/60">—</span>}</dd>
    </div>
  );
}

function Campo({ rotulo, erro, dica, className, children }: { rotulo: string; erro?: string; dica?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{rotulo}</span>
      {children}
      {erro ? <span className="text-xs text-destructive">{erro}</span> : dica ? <span className="text-xs text-muted-foreground">{dica}</span> : null}
    </label>
  );
}

type CampoTexto = Exclude<keyof CamposLead, "intencao" | "observacoes">;

const deLead = (l: Lead): CamposLead => ({
  nome: l.nome,
  intencao: l.intencao,
  finalidade: l.finalidade,
  regiao: l.regiao,
  tipoImovel: l.tipoImovel,
  caracteristicas: l.caracteristicas,
  faixaValor: l.faixaValor,
  pagamento: l.pagamento,
  prazo: l.prazo,
  melhorHorario: l.melhorHorario,
  imovelUrl: l.imovelUrl,
  observacoes: l.observacoes,
});

/** Formulário de edição: os mesmos blocos da ficha, com campos no lugar dos valores */
function FormularioLead({ lead, aoFechar }: { lead: Lead; aoFechar: () => void }) {
  const { atualizarLead } = useDados();
  const inicial = deLead(lead);
  const [campos, setCampos] = useState<CamposLead>(inicial);
  const [tentou, setTentou] = useState(false);

  const nomeCurto = campos.nome.trim().length === 1;
  const erroNome = nomeCurto ? "Use pelo menos 2 letras, ou deixe em branco." : "";
  const alterado = (Object.keys(inicial) as (keyof CamposLead)[]).some((k) => campos[k].trim() !== inicial[k].trim());

  const texto = (chave: CampoTexto, placeholder?: string) => ({
    value: campos[chave],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setCampos((c) => ({ ...c, [chave]: e.target.value })),
    placeholder,
    maxLength: 120,
  });

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (erroNome) return;
    atualizarLead(lead.id, campos);
    toast.success("Ficha atualizada");
    aoFechar();
  };

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-3">
      <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        O corretor, a data, o nível e a área do encaminhamento não mudam: são o registro da auditoria.
      </p>

      <Bloco titulo="Contato" icone={UserRound}>
        <div className="grid gap-3">
          <Campo rotulo="Nome" erro={tentou ? erroNome : ""} dica={lead.nomeWhatsApp ? `Nome no WhatsApp: ${lead.nomeWhatsApp}` : undefined}>
            <Input {...texto("nome")} autoComplete="off" aria-invalid={tentou && Boolean(erroNome)} />
          </Campo>
          <Campo rotulo="Telefone" dica="Identifica o contato nas conversas, por isso não pode ser editado.">
            <Input value={formatarTelefone(lead.telefone)} disabled readOnly />
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="Interesse" icone={MapPin}>
        <div className="grid gap-3">
          <Campo rotulo="Intenção">
            <Selecao
              valor={campos.intencao}
              aoMudar={(v) => setCampos((c) => ({ ...c, intencao: v }))}
              opcoes={INTENCOES.map((i) => ({ valor: i, rotulo: ROTULO_INTENCAO[i] }))}
              className="sm:w-full"
              rotuloAcessivel="Intenção do lead"
            />
          </Campo>
          <Campo rotulo="Finalidade">
            <Input {...texto("finalidade", "Ex.: venda")} />
          </Campo>
          <Campo rotulo="Região">
            <Input {...texto("regiao", "Ex.: Ingleses do Rio Vermelho")} />
          </Campo>
          <Campo rotulo="Tipo de imóvel">
            <Input {...texto("tipoImovel", "Ex.: casa, apartamento, terreno")} />
          </Campo>
          <Campo rotulo="Características">
            <Input {...texto("caracteristicas", "Ex.: 3 quartos e quintal")} />
          </Campo>
          <Campo rotulo="Imóvel de interesse">
            <Input {...texto("imovelUrl", "Link do imóvel no site")} inputMode="url" />
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="Condições" icone={Wallet}>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Faixa de valor" className="col-span-2">
            <Input {...texto("faixaValor", "Ex.: até R$ 850 mil")} />
          </Campo>
          <Campo rotulo="Pagamento" className="col-span-2">
            <Input {...texto("pagamento", "Ex.: financiamento com FGTS")} />
          </Campo>
          <Campo rotulo="Prazo">
            <Input {...texto("prazo", "Ex.: em 3 meses")} />
          </Campo>
          <Campo rotulo="Melhor horário">
            <Input {...texto("melhorHorario", "Ex.: depois das 18h")} />
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="Observações" icone={StickyNote}>
        <Textarea
          value={campos.observacoes}
          onChange={(e) => setCampos((c) => ({ ...c, observacoes: e.target.value }))}
          placeholder="Algo que o corretor precisa saber"
          maxLength={500}
          aria-label="Observações"
        />
      </Bloco>

      {/* a barra acompanha a rolagem do painel, para salvar sem voltar ao topo */}
      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background px-4 py-3">
        <Button type="button" variant="ghost" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!alterado}>
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

export function FichaLead({ lead, className }: { lead: Lead; className?: string }) {
  const { porId, conversas, eu } = useVisao();
  const { definirOrigem } = useDados();
  // guarda o id (e não um booleano): ao trocar de lead no painel, a edição do anterior se desfaz
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = editandoId === lead.id;
  const corretor = porId.get(lead.colaboradorId);
  const doContato = conversas.filter((c) => c.leadId === lead.id || c.chaveTelefone === lead.chaveTelefone);
  const nome = lead.nome || lead.nomeWhatsApp;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`+${lead.telefone}`);
      toast.success("Telefone copiado");
    } catch {
      toast.error("Não consegui copiar o telefone");
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start gap-3">
        <AvatarPessoa nome={nome} tamanho="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{nome}</p>
          <button type="button" onClick={copiar} className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            {formatarTelefone(lead.telefone)}
            <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <EtiquetaNivel nivel={lead.nivel} />
        <EtiquetaArea area={lead.area} />
        {lead.atualizacao ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <RefreshCw className="size-3" />
            Atualização
          </span>
        ) : null}
        {editando ? null : (
          <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => setEditandoId(lead.id)}>
            <Pencil />
            Editar
          </Button>
        )}
      </div>

      {editando ? (
        <FormularioLead lead={lead} aoFechar={() => setEditandoId(null)} />
      ) : (
        <>
          <Bloco titulo="Encaminhamento" icone={Send}>
            <div className="flex items-center gap-2.5">
              <AvatarPessoa nome={corretor?.nome ?? "?"} tamanho="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{corretor?.nome ?? "Sem corretor"}</p>
                <p className="text-xs text-muted-foreground">
                  {dataHora(lead.encaminhadoEm)} · {haQuanto(lead.encaminhadoEm)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{ROTULO_CRITERIO[lead.criterio]}</p>
          </Bloco>

          <Bloco titulo="Origem do contato" icone={Compass}>
            <Selecao
              valor={lead.origem}
              aoMudar={(o) => {
                definirOrigem(lead.chaveTelefone, o, eu?.id ?? "");
                toast.success(o === "nao_informada" ? "Origem removida" : `Origem registrada: ${ROTULO_ORIGEM[o]}`);
              }}
              opcoes={ORIGENS.map((o) => ({ valor: o, rotulo: ROTULO_ORIGEM[o] }))}
              tamanho="sm"
              className="w-full sm:w-full"
              rotuloAcessivel="Origem do lead"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {lead.origemPorId && lead.origemEm
                ? `Informada por ${porId.get(lead.origemPorId)?.nome ?? "—"} · ${dataHora(lead.origemEm)}`
                : "Pergunte ao cliente como conheceu a Nativo e registre aqui."}
            </p>
          </Bloco>

          <Bloco titulo="Interesse" icone={MapPin}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Dado rotulo="Intenção">{ROTULO_INTENCAO[lead.intencao]}</Dado>
              <Dado rotulo="Finalidade">{lead.finalidade}</Dado>
              <Dado rotulo="Região">{lead.regiao}</Dado>
              <Dado rotulo="Tipo">{lead.tipoImovel}</Dado>
              <Dado rotulo="Características" largo>
                {lead.caracteristicas}
              </Dado>
              <Dado rotulo="Imóvel de interesse" largo>
                {lead.imovelUrl ? <span className="text-primary">{lead.imovelUrl}</span> : null}
              </Dado>
            </dl>
          </Bloco>

          <Bloco titulo="Condições" icone={Wallet}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Dado rotulo="Faixa de valor">{lead.faixaValor}</Dado>
              <Dado rotulo="Pagamento">{lead.pagamento}</Dado>
              <Dado rotulo="Prazo">{lead.prazo}</Dado>
              <Dado rotulo="Melhor horário">{lead.melhorHorario}</Dado>
            </dl>
          </Bloco>

          <Bloco titulo="Observações" icone={StickyNote}>
            <p className="text-sm break-words whitespace-pre-wrap">{lead.observacoes || <span className="text-muted-foreground/60">—</span>}</p>
          </Bloco>

          {doContato.length ? (
            <Bloco titulo="Conversas deste contato" icone={MessageSquare}>
              <div className="flex flex-col gap-1.5">
                {doContato.map((c) => (
                  <Button key={c.id} variant="outline" size="sm" className="justify-start" render={<Link href={`/conversas?c=${c.id}`} />} nativeButton={false}>
                    {c.canal === "bot" ? <Bot /> : <MessageSquare />}
                    {c.canal === "bot" ? "Conversa com o bot" : `WhatsApp de ${porId.get(c.colaboradorId ?? "")?.nome ?? "corretor"}`}
                  </Button>
                ))}
              </div>
            </Bloco>
          ) : null}
        </>
      )}
    </div>
  );
}
