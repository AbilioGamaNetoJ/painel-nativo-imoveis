"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, KeyRound, LogOut, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { EtiquetaArea, EtiquetaWhatsApp } from "@/components/etiquetas";
import { OPCOES_TEMA } from "@/components/opcoes-tema";
import { Pagina } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDados } from "@/lib/dados";
import { diaLongo, hojeISO } from "@/lib/datas";
import { useAcoesSessao } from "@/lib/sessao";
import { useTema } from "@/lib/tema";
import { formatarTelefone, telefoneValido } from "@/lib/telefone";
import { ROTULO_AREA, type Colaborador } from "@/lib/tipos";
import { useVisao } from "@/lib/visao";
import { cn } from "@/lib/utils";

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {descricao ? <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Campo({ rotulo, erro, dica, children }: { rotulo: string; erro?: string; dica?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{rotulo}</Label>
      {children}
      {erro ? <p className="text-xs text-destructive">{erro}</p> : dica ? <p className="text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}

function DadosPessoais({ eu }: { eu: Colaborador }) {
  const admin = eu.papel === "admin";
  const { atualizarPerfil } = useDados();
  const [nome, setNome] = useState(eu.nome);
  const [telefone, setTelefone] = useState(eu.telefone ? formatarTelefone(eu.telefone) : "");
  const [tentou, setTentou] = useState(false);

  const erros = {
    nome: nome.trim().length < 3 ? "Informe o nome completo." : "",
    telefone: !telefoneValido(telefone) ? "Informe o WhatsApp com DDD, por exemplo (48) 99999-9999." : "",
  };
  const alterado = nome.trim() !== eu.nome || telefone !== (eu.telefone ? formatarTelefone(eu.telefone) : "");

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (erros.nome || erros.telefone) return;
    atualizarPerfil(eu.id, { nome, telefone });
    setTentou(false);
    toast.success("Perfil atualizado");
  };

  return (
    <form onSubmit={salvar} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome completo" erro={tentou ? erros.nome : ""}>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        </Campo>
        <Campo rotulo={admin ? "Telefone de contato" : "WhatsApp de trabalho"} erro={tentou ? erros.telefone : ""} dica={admin ? "Usado pela equipe para falar com a administração." : "Recebe o aviso de novo lead."}>
          <Input inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(48) 99999-9999" />
        </Campo>
        <Campo rotulo="E-mail de acesso" dica="Para trocar o e-mail, peça a um administrador.">
          <Input value={eu.email} disabled readOnly />
        </Campo>
        <Campo rotulo="Área de atendimento" dica="Definida pela administração.">
          <Input value={eu.area ? ROTULO_AREA[eu.area] : "Sem área (administração)"} disabled readOnly />
        </Campo>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!alterado}>
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

function Aparencia() {
  const { tema, definirTema } = useTema();
  return (
    <div role="radiogroup" aria-label="Tema do painel" className="grid grid-cols-3 gap-2 sm:gap-3">
      {OPCOES_TEMA.map((t) => {
        const ativo = tema === t.valor;
        return (
          <button
            key={t.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => definirTema(t.valor)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              ativo ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary" : "hover:bg-muted",
            )}
          >
            <t.icone className="size-5" />
            {t.rotulo}
            <span className="hidden text-[11px] font-normal text-muted-foreground sm:block">{t.dica}</span>
          </button>
        );
      })}
    </div>
  );
}

function AlterarSenha() {
  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [tentou, setTentou] = useState(false);

  const erros = {
    atual: atual.length < 1 ? "Informe a senha atual." : "",
    nova: nova.length < 8 ? "Use pelo menos 8 caracteres." : "",
    confirmar: confirmar !== nova ? "As senhas não são iguais." : "",
  };

  const fechar = () => {
    setAberto(false);
    setAtual("");
    setNova("");
    setConfirmar("");
    setTentou(false);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (Object.values(erros).some(Boolean)) return;
    toast.success("Senha alterada", { description: "Na demonstração nada é gravado." });
    fechar();
  };

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <KeyRound />
        Alterar senha
      </Button>
      <Dialog open={aberto} onOpenChange={(o) => (o ? setAberto(true) : fechar())}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={enviar} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Alterar senha</DialogTitle>
              <DialogDescription>No sistema real, a senha é do Supabase Auth e pode ser trocada também pelo e-mail de recuperação.</DialogDescription>
            </DialogHeader>
            <Campo rotulo="Senha atual" erro={tentou ? erros.atual : ""}>
              <Input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" />
            </Campo>
            <Campo rotulo="Nova senha" erro={tentou ? erros.nova : ""}>
              <Input type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" />
            </Campo>
            <Campo rotulo="Repetir a nova senha" erro={tentou ? erros.confirmar : ""}>
              <Input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" />
            </Campo>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={fechar}>
                Cancelar
              </Button>
              <Button type="submit">Salvar senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProximosPlantoes({ eu }: { eu: Colaborador }) {
  const { estado } = useVisao();
  const hoje = hojeISO();
  const proximos = estado.escala
    .filter((i) => i.colaboradorId === eu.id && i.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 6);

  if (!proximos.length) {
    return <p className="text-sm text-muted-foreground">Você não está em nenhum plantão nos próximos dias. A administração monta a escala.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border text-sm">
      {proximos.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" />
            <span className="first-letter:uppercase">{i.data === hoje ? "Hoje" : diaLongo(i.data)}</span>
          </span>
          <EtiquetaArea area={i.area} />
        </li>
      ))}
    </ul>
  );
}

const PERMISSOES_ADMIN = [
  "Ver todas as conversas do bot e dos corretores",
  "Auditar para quem cada lead foi, com data e hora",
  "Montar a escala e escolher quem recebe lead em cada dia",
  "Cadastrar e convidar a equipe e conectar o WhatsApp dos corretores",
];
const PERMISSOES_CORRETOR = [
  "Ver as conversas do bot dos leads que você recebeu",
  "Ver a conversa do seu WhatsApp de trabalho (somente leitura)",
  "Consultar seus leads e registrar a origem de cada um",
];

export default function Perfil() {
  const router = useRouter();
  const { eu, ehAdmin } = useVisao();
  const { sair } = useAcoesSessao();

  if (!eu) return null;
  const permissoes = ehAdmin ? PERMISSOES_ADMIN : PERMISSOES_CORRETOR;

  return (
    <Pagina titulo="Meu perfil" descricao="Seus dados, aparência e acesso ao painel">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <section className="flex flex-col items-center gap-4 rounded-xl border bg-card p-5 text-center sm:flex-row sm:text-left">
          <AvatarPessoa nome={eu.nome} tamanho="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{eu.nome}</h2>
            <p className="truncate text-sm text-muted-foreground">{eu.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-1.5 py-0.5 text-xs leading-4 font-medium text-accent-foreground">
                <ShieldCheck className="size-3" />
                {ehAdmin ? "Administrador" : "Corretor"}
              </span>
              {eu.area ? <EtiquetaArea area={eu.area} /> : null}
            </div>
          </div>
        </section>

        <Secao titulo="Dados pessoais">
          <DadosPessoais key={eu.id} eu={eu} />
        </Secao>

        <Secao titulo="Aparência" descricao="Vale só para este navegador.">
          <Aparencia />
        </Secao>

        {ehAdmin ? null : (
          <Secao titulo="WhatsApp de trabalho" descricao="Espelho somente leitura das suas conversas no painel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <EtiquetaWhatsApp status={eu.statusWhatsApp} caiu={Boolean(eu.sessaoCaiuEm)} />
                <span className="text-sm text-muted-foreground tabular-nums">{eu.telefone ? formatarTelefone(eu.telefone) : "Número não informado"}</span>
              </div>
              <Button variant="outline" render={<Link href={`/equipe/${eu.id}`} />} nativeButton={false}>
                <QrCode />
                {eu.statusWhatsApp === "conectado" ? "Ver conexão" : eu.sessaoCaiuEm ? "Reconectar" : "Conectar"}
              </Button>
            </div>
          </Secao>
        )}

        {ehAdmin ? null : (
          <Secao titulo="Meus próximos plantões" descricao="Nos dias de plantão você entra no sorteio de leads da sua área.">
            <ProximosPlantoes eu={eu} />
          </Secao>
        )}

        <Secao titulo="O que seu perfil pode fazer">
          <ul className="space-y-2 text-sm">
            {permissoes.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {p}
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Segurança">
          <div className="flex flex-wrap gap-2">
            <AlterarSenha />
            <Button
              variant="ghost"
              onClick={() => {
                sair();
                router.push("/login");
              }}
            >
              <LogOut />
              Sair
            </Button>
          </div>
        </Secao>
      </div>
    </Pagina>
  );
}
