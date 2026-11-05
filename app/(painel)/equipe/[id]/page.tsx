"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole, QrCode, ShieldCheck, Smartphone, Unplug } from "lucide-react";
import { toast } from "sonner";
import { EtiquetaWhatsApp } from "@/components/etiquetas";
import { Pagina, SemPermissao } from "@/components/pagina";
import { AvatarPessoa } from "@/components/pessoa";
import { QrIlustrativo } from "@/components/qr-ilustrativo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDados } from "@/lib/dados";
import { dataHora, haQuanto } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { useVisao } from "@/lib/visao";

const SEGUNDOS_PARA_LER = 7;

function Item({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 shrink-0 text-primary">{icone}</span>
      <span>{children}</span>
    </li>
  );
}

export default function ConectarWhatsApp({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ehAdmin, eu, porId } = useVisao();
  const { atualizarWhatsApp } = useDados();
  const colaborador = porId.get(id);
  const [aceitou, setAceitou] = useState(false);
  const [restante, setRestante] = useState(SEGUNDOS_PARA_LER);
  const [rodada, setRodada] = useState(0);

  const status = colaborador?.statusWhatsApp ?? "desconectado";

  // Leitura ilustrativa do QR Code: depois de alguns segundos a sessão aparece como conectada
  useEffect(() => {
    if (status !== "aguardando_qr") return;
    const t = setInterval(() => setRestante((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [status, rodada]);

  useEffect(() => {
    if (status === "aguardando_qr" && restante <= 0) {
      atualizarWhatsApp(id, "conectado");
      toast.success("WhatsApp conectado", { description: "A partir de agora as conversas aparecem no painel." });
    }
  }, [restante, status, id, atualizarWhatsApp]);

  if (!ehAdmin && eu?.id !== id) return <SemPermissao />;
  const voltar = ehAdmin ? { href: "/equipe", rotulo: "Equipe" } : { href: "/perfil", rotulo: "Meu perfil" };
  if (!colaborador) {
    return (
      <Pagina titulo="Colaborador não encontrado">
        <Button variant="outline" render={<Link href={voltar.href} />} nativeButton={false}>
          <ArrowLeft />
          Voltar
        </Button>
      </Pagina>
    );
  }

  const jaAceitou = Boolean(colaborador.termoAceitoEm);
  const podeGerar = jaAceitou || aceitou;

  return (
    <Pagina
      titulo={`WhatsApp de ${colaborador.nome}`}
      descricao="Espelho somente leitura das conversas do chip de trabalho"
      acoes={
        <Button variant="ghost" size="sm" render={<Link href={voltar.href} />} nativeButton={false}>
          <ArrowLeft />
          {voltar.rotulo}
        </Button>
      }
    >
      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border bg-card">
          <header className="flex items-center gap-3 border-b px-5 py-4">
            <AvatarPessoa nome={colaborador.nome} tamanho="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{colaborador.nome}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{colaborador.telefone ? formatarTelefone(colaborador.telefone) : "WhatsApp não informado"}</p>
            </div>
            <EtiquetaWhatsApp status={status} caiu={Boolean(colaborador.sessaoCaiuEm)} />
          </header>

          <div className="p-5">
            {status === "conectado" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-100">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium">Conectado</p>
                    <p className="text-sm">As conversas de {colaborador.nome} aparecem no painel. Nada é enviado a partir dele.</p>
                  </div>
                </div>
                <dl className="divide-y rounded-lg border text-sm">
                  <div className="flex justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">Número</dt>
                    <dd className="tabular-nums">{formatarTelefone(colaborador.telefone)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">Modo</dt>
                    <dd>Somente leitura</dd>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">Termo de ciência</dt>
                    <dd>{colaborador.termoAceitoEm ? `aceito em ${dataHora(colaborador.termoAceitoEm)}` : "—"}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  onClick={() => {
                    atualizarWhatsApp(id, "desconectado");
                    setRestante(SEGUNDOS_PARA_LER);
                    toast("WhatsApp desconectado", { description: "As conversas já guardadas continuam no painel." });
                  }}
                >
                  <Unplug />
                  Desconectar
                </Button>
              </div>
            ) : status === "aguardando_qr" ? (
              <div className="grid gap-5 sm:grid-cols-[14rem_1fr] sm:items-center">
                <div className="mx-auto">
                  <QrIlustrativo key={rodada} semente={`${colaborador.id}-${rodada}`} className="size-56 rounded-xl border p-2" />
                  <p className="mt-1.5 text-center text-[11px] text-muted-foreground">QR Code ilustrativo</p>
                </div>
                <div className="space-y-3">
                  <p className="font-medium">Leia o QR Code com o celular de trabalho</p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                    <li>Abra o WhatsApp no celular de {colaborador.nome.split(" ")[0]}.</li>
                    <li>Toque em Aparelhos conectados.</li>
                    <li>Toque em Conectar um aparelho e aponte para esta tela.</li>
                  </ol>
                  <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <span className="size-2 animate-pulse rounded-full bg-amber-500" />
                    Aguardando a leitura… ({Math.max(restante, 0)}s na demonstração)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        atualizarWhatsApp(id, "conectado");
                        toast.success("WhatsApp conectado");
                      }}
                    >
                      Simular leitura agora
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRodada((r) => r + 1);
                        setRestante(SEGUNDOS_PARA_LER);
                      }}
                    >
                      Gerar novo QR Code
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        atualizarWhatsApp(id, "desconectado");
                        setRestante(SEGUNDOS_PARA_LER);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {colaborador.sessaoCaiuEm ? (
                  <p className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-200">
                    A sessão caiu {haQuanto(colaborador.sessaoCaiuEm)}. Leia o QR Code de novo para voltar a espelhar as conversas.
                  </p>
                ) : null}

                {jaAceitou ? (
                  <p className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    Termo de ciência aceito em {dataHora(colaborador.termoAceitoEm!)}.
                  </p>
                ) : (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                    <Checkbox checked={aceitou} onCheckedChange={(v) => setAceitou(Boolean(v))} className="mt-0.5" />
                    <span className="text-sm">
                      <span className="font-medium">Termo de ciência</span>
                      <span className="mt-1 block text-muted-foreground">
                        Estou ciente de que este WhatsApp de trabalho será espelhado no painel da Nativo Imóveis. A administração poderá ler as conversas, que ficam guardadas pelo
                        prazo definido pela imobiliária. O painel não envia mensagens por este número.
                      </span>
                    </span>
                  </label>
                )}

                <Button
                  disabled={!podeGerar}
                  onClick={() => {
                    setRestante(SEGUNDOS_PARA_LER);
                    atualizarWhatsApp(id, "aguardando_qr");
                  }}
                >
                  <QrCode />
                  {colaborador.sessaoCaiuEm ? "Reconectar com QR Code" : "Gerar QR Code"}
                </Button>
                {!podeGerar ? <p className="text-xs text-muted-foreground">Aceite o termo para gerar o QR Code.</p> : null}
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">O que o painel faz com este WhatsApp</h2>
          <ul className="mt-3 space-y-3">
            <Item icone={<Smartphone className="size-4" />}>Lê e guarda as conversas do chip de trabalho, só a partir da conexão.</Item>
            <Item icone={<LockKeyhole className="size-4" />}>Não envia nenhuma mensagem: o corretor responde pelo próprio WhatsApp.</Item>
            <Item icone={<ShieldCheck className="size-4" />}>Ignora grupos e status e não mostra o aviso de novo lead enviado pelo número do bot.</Item>
            <Item icone={<Unplug className="size-4" />}>Se a sessão cair, o administrador vê um aviso aqui e na tela inicial.</Item>
          </ul>
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Use um chip de trabalho, não o pessoal. Um chip por corretor.</p>
        </aside>
      </div>
    </Pagina>
  );
}
