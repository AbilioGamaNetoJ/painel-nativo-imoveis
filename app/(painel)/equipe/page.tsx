"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { MailPlus, MoreHorizontal, QrCode, UserPlus, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { EmailConvite } from "@/components/email-convite";
import { EtiquetaAcesso, EtiquetaArea, EtiquetaWhatsApp } from "@/components/etiquetas";
import { Pagina, SemPermissao } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { Selecao } from "@/components/selecao";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDados } from "@/lib/dados";
import { haQuanto } from "@/lib/datas";
import { formatarTelefone, telefoneValido } from "@/lib/telefone";
import { ROTULO_AREA, type Area, type Colaborador, type Papel } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { useVisao } from "@/lib/visao";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Campo({ rotulo, erro, children, dica }: { rotulo: string; erro?: string; dica?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{rotulo}</Label>
      {children}
      {erro ? <p className="text-xs text-destructive">{erro}</p> : dica ? <p className="text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}

const PAPEIS = [
  { valor: "corretor" as Papel, rotulo: "Corretor / colaborador" },
  { valor: "admin" as Papel, rotulo: "Administrador" },
];
const AREAS_CADASTRO = [
  { valor: "vendas" as Area, rotulo: ROTULO_AREA.vendas },
  { valor: "locacao" as Area, rotulo: ROTULO_AREA.locacao },
  { valor: "captacao" as Area, rotulo: ROTULO_AREA.captacao },
  { valor: "recepcao" as Area, rotulo: ROTULO_AREA.recepcao },
];

function Cadastrar({ aberto, aoFechar, aoConvidar }: { aberto: boolean; aoFechar: () => void; aoConvidar: (email: string, papel: Papel) => void }) {
  const { estado } = useVisao();
  const { cadastrarColaborador } = useDados();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [area, setArea] = useState<Area | "escolher">("escolher");
  const [papel, setPapel] = useState<Papel>("corretor");
  const [darAcesso, setDarAcesso] = useState(true);
  const [tentou, setTentou] = useState(false);

  const erros = {
    nome: nome.trim().length < 3 ? "Informe o nome completo." : "",
    email: !EMAIL.test(email) ? "E-mail inválido." : estado.colaboradores.some((c) => c.email === email.trim().toLowerCase()) ? "Já existe alguém com este e-mail." : "",
    telefone: !telefoneValido(telefone) ? "Informe o WhatsApp com DDD, por exemplo (48) 99999-9999." : "",
    area: papel === "corretor" && area === "escolher" ? "Escolha a área." : "",
  };
  const valido = !Object.values(erros).some(Boolean);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (!valido) return;
    cadastrarColaborador({ nome, email, telefone, area: area === "escolher" ? null : area, papel, darAcesso });
    toast.success(`${nome.trim()} cadastrado${darAcesso ? " e convite enviado" : ""}`);
    if (darAcesso) aoConvidar(email.trim().toLowerCase(), papel);
    setNome("");
    setEmail("");
    setTelefone("");
    setArea("escolher");
    setPapel("corretor");
    setDarAcesso(true);
    setTentou(false);
    aoFechar();
  };

  return (
    <Sheet open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <form onSubmit={enviar} className="flex h-full flex-col" noValidate>
          <SheetHeader>
            <SheetTitle>Cadastrar colaborador</SheetTitle>
            <SheetDescription>O colaborador entra na escala e recebe leads, mesmo sem acesso ao painel.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 py-2">
            <Campo rotulo="Nome completo" erro={tentou ? erros.nome : ""}>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Paula Ribeiro" autoFocus />
            </Campo>
            <Campo rotulo="E-mail" erro={tentou ? erros.email : ""}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com.br" />
            </Campo>
            <Campo rotulo="WhatsApp" erro={tentou ? erros.telefone : ""} dica="O número que recebe o aviso de novo lead.">
              <Input inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(48) 99999-9999" />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Papel">
                <Selecao valor={papel} aoMudar={setPapel} opcoes={PAPEIS} className="w-full" />
              </Campo>
              <Campo rotulo="Área" erro={tentou ? erros.area : ""}>
                <Selecao
                  valor={area}
                  aoMudar={setArea}
                  opcoes={[{ valor: "escolher", rotulo: "Escolha" }, ...AREAS_CADASTRO]}
                  className="w-full"
                />
              </Campo>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Dar acesso ao painel</p>
                <p className="text-xs text-muted-foreground">Envia um convite por e-mail para a pessoa criar a senha.</p>
              </div>
              <Switch checked={darAcesso} onCheckedChange={setDarAcesso} aria-label="Dar acesso ao painel" />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit">
              <UserPlus />
              Cadastrar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Convidar({ aberto, aoFechar, aoEnviar }: { aberto: boolean; aoFechar: () => void; aoEnviar: (email: string, papel: Papel) => void }) {
  const { estado } = useVisao();
  const { convidar } = useDados();
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("corretor");
  const [tentou, setTentou] = useState(false);
  const erro = !EMAIL.test(email) ? "E-mail inválido." : estado.colaboradores.some((c) => c.email === email.trim().toLowerCase()) ? "Já existe alguém com este e-mail." : "";

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (erro) return;
    convidar(email, papel);
    aoEnviar(email.trim().toLowerCase(), papel);
    setEmail("");
    setPapel("corretor");
    setTentou(false);
    aoFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Convidar para o painel</DialogTitle>
            <DialogDescription>A pessoa recebe um e-mail, cria a senha e completa o próprio cadastro (nome, WhatsApp e área).</DialogDescription>
          </DialogHeader>
          <Campo rotulo="E-mail" erro={tentou ? erro : ""}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com.br" autoFocus />
          </Campo>
          <Campo rotulo="Papel" dica={papel === "admin" ? "Administradores veem tudo e gerenciam a equipe e a escala." : "Corretores veem só as próprias conversas e leads."}>
            <Selecao valor={papel} aoMudar={setPapel} opcoes={PAPEIS} className="w-full" />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit">
              <MailPlus />
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InterruptorAtivo({ c, euId }: { c: Colaborador; euId?: string }) {
  const { definirAtivo } = useDados();
  return (
  <Switch
    checked={c.ativo}
    disabled={c.id === euId}
    aria-label={`${c.ativo ? "Desativar" : "Ativar"} ${c.nome}`}
    onCheckedChange={(v) => {
      definirAtivo(c.id, v);
      toast(v ? `${c.nome} ativado` : `${c.nome} desativado`, {
        description: v ? "Volta a entrar na escala e no sorteio." : "Sai do sorteio e perde o acesso. O histórico fica guardado.",
      });
    }}
  />
  );
}

function MenuColaborador({ c, aoVerConvite }: { c: Colaborador; aoVerConvite: (para: string, papel: Papel) => void }) {
  const { darAcessoAoPainel } = useDados();
  return (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Ações de ${c.nome}`} />}>
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {c.papel === "corretor" ? (
        <DropdownMenuItem render={<Link href={`/equipe/${c.id}`} />}>
          <QrCode />
          {c.statusWhatsApp === "conectado" ? "Ver WhatsApp" : "Conectar WhatsApp"}
        </DropdownMenuItem>
      ) : null}
      {c.acesso === "convite_pendente" ? (
        <DropdownMenuItem
          onClick={() => {
            aoVerConvite(c.email, c.papel);
          }}
        >
          <MailPlus />
          Ver convite enviado
        </DropdownMenuItem>
      ) : null}
      {c.acesso === "sem_acesso" ? (
        <DropdownMenuItem
          onClick={() => {
            darAcessoAoPainel(c.id);
            aoVerConvite(c.email, c.papel);
            toast.success(`Convite enviado para ${c.email}`);
          }}
        >
          <MailPlus />
          Dar acesso ao painel
        </DropdownMenuItem>
      ) : null}
    </DropdownMenuContent>
  </DropdownMenu>
  );
}

function CartaoColaborador({ c, euId, aoVerConvite }: { c: Colaborador; euId?: string; aoVerConvite: (para: string, papel: Papel) => void }) {
  return (
    <li className={cn("space-y-3 p-4", !c.ativo && "opacity-60")}>
      <div className="flex items-start gap-3">
        <AvatarPessoa nome={c.nome} tamanho="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {c.nome}
            {c.id === euId ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span> : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">{c.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.papel === "admin" ? "Administrador" : "Corretor"}</p>
        </div>
        <MenuColaborador c={c} aoVerConvite={aoVerConvite} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {c.papel === "admin" && !c.area ? null : <EtiquetaArea area={c.area} />}
        {c.papel === "corretor" ? <EtiquetaWhatsApp status={c.statusWhatsApp} caiu={Boolean(c.sessaoCaiuEm)} /> : null}
        <EtiquetaAcesso acesso={c.acesso} />
      </div>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">{c.ativo ? "Ativo" : "Inativo"}</span>
        <InterruptorAtivo c={c} euId={euId} />
      </div>
    </li>
  );
}

export default function Equipe() {
  const { ehAdmin, eu, estado } = useVisao();
  const [cadastrando, setCadastrando] = useState(false);
  const [convidando, setConvidando] = useState(false);
  const [email, setEmail] = useState<{ para: string; papel: Papel } | null>(null);

  if (!ehAdmin) return <SemPermissao />;

  const colaboradores = [...estado.colaboradores].sort(
    (a, b) => Number(b.ativo) - Number(a.ativo) || Number(b.papel === "admin") - Number(a.papel === "admin") || a.nome.localeCompare(b.nome),
  );
  const caidos = colaboradores.filter((c) => c.ativo && c.papel === "corretor" && c.sessaoCaiuEm && c.statusWhatsApp !== "conectado");

  return (
    <Pagina
      titulo="Equipe"
      descricao={`${colaboradores.filter((c) => c.ativo).length} colaboradores ativos`}
      acoes={
        <>
          <Button variant="outline" size="sm" onClick={() => setConvidando(true)}>
            <MailPlus />
            <span className="hidden sm:inline">Convidar</span>
          </Button>
          <Button size="sm" onClick={() => setCadastrando(true)}>
            <UserPlus />
            <span className="hidden sm:inline">Cadastrar</span>
          </Button>
        </>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        {caidos.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-200">
            <WifiOff className="size-4 shrink-0" />
            <p className="flex-1">
              O WhatsApp de <strong>{c.nome}</strong> desconectou {haQuanto(c.sessaoCaiuEm!)}. As mensagens novas dele não estão chegando ao painel.
            </p>
            <Button size="sm" variant="outline" render={<Link href={`/equipe/${c.id}`} />} nativeButton={false}>
              <QrCode />
              Reconectar
            </Button>
          </div>
        ))}

        <ul className="divide-y rounded-xl border bg-card md:hidden">
          {colaboradores.map((c) => (
            <CartaoColaborador key={c.id} c={c} euId={eu?.id} aoVerConvite={(para, papel) => setEmail({ para, papel })} />
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Painel</TableHead>
                <TableHead className="w-20">Ativo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.map((c) => (
                <TableRow key={c.id} className={c.ativo ? "" : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <AvatarPessoa nome={c.nome} tamanho="md" />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {c.nome}
                          {c.id === eu?.id ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.papel === "admin" ? "Administrador" : "Corretor"}</TableCell>
                  <TableCell>{c.papel === "admin" && !c.area ? <span className="text-muted-foreground">—</span> : <EtiquetaArea area={c.area} />}</TableCell>
                  <TableCell>
                    {c.papel === "admin" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <EtiquetaWhatsApp status={c.statusWhatsApp} caiu={Boolean(c.sessaoCaiuEm)} />
                        {c.telefone ? <span className="text-xs text-muted-foreground tabular-nums">{formatarTelefone(c.telefone)}</span> : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <EtiquetaAcesso acesso={c.acesso} />
                  </TableCell>
                  <TableCell>
                    <InterruptorAtivo c={c} euId={eu?.id} />
                  </TableCell>
                  <TableCell>
                    <MenuColaborador c={c} aoVerConvite={(para, papel) => setEmail({ para, papel })} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Cadastrar aberto={cadastrando} aoFechar={() => setCadastrando(false)} aoConvidar={(para, papel) => setEmail({ para, papel })} />
      <Convidar
        aberto={convidando}
        aoFechar={() => setConvidando(false)}
        aoEnviar={(para, papel) => {
          setEmail({ para, papel });
          toast.success(`Convite enviado para ${para}`);
        }}
      />
      <EmailConvite aberto={Boolean(email)} aoFechar={() => setEmail(null)} para={email?.para ?? ""} papel={email?.papel ?? "corretor"} convidadoPor={eu?.nome ?? "A administração"} />
    </Pagina>
  );
}
