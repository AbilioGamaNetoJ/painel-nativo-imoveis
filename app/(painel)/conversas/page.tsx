"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { ListaConversas, type FiltroCanal, type ItemConversa } from "@/components/conversas/lista";
import { PainelContato } from "@/components/conversas/painel-contato";
import { ThreadConversa } from "@/components/conversas/thread";
import { useVisao } from "@/lib/visao";

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const idNaUrl = params.get("c");
  const { conversas, leadsPorId, mensagensPorConversa, porId, ehAdmin } = useVisao();
  const [filtro, setFiltro] = useState<FiltroCanal>("todas");
  const [busca, setBusca] = useState("");

  const itens = useMemo<ItemConversa[]>(
    () =>
      [...conversas]
        .sort((a, b) => b.ultimaMensagemEm.localeCompare(a.ultimaMensagemEm))
        .map((conversa) => {
          const msgs = mensagensPorConversa.get(conversa.id) ?? [];
          const lead = conversa.leadId ? leadsPorId.get(conversa.leadId) : undefined;
          return {
            conversa,
            ultima: msgs[msgs.length - 1],
            lead,
            dono: porId.get(conversa.colaboradorId ?? lead?.colaboradorId ?? ""),
          };
        }),
    [conversas, mensagensPorConversa, leadsPorId, porId],
  );

  const contagem = useMemo(
    () => ({
      todas: itens.length,
      bot: itens.filter((i) => i.conversa.canal === "bot").length,
      corretor: itens.filter((i) => i.conversa.canal === "corretor").length,
    }),
    [itens],
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");
    return itens.filter((i) => {
      if (filtro !== "todas" && i.conversa.canal !== filtro) return false;
      if (!termo) return true;
      return i.conversa.nomeCliente.toLowerCase().includes(termo) || (digitos.length > 2 && i.conversa.telefoneCliente.includes(digitos));
    });
  }, [itens, filtro, busca]);

  // sem conversa na URL, abre a mais recente (no celular a lista fica na frente)
  const selecionada = itens.find((i) => i.conversa.id === idNaUrl) ?? (idNaUrl ? undefined : visiveis[0]);
  const aberta = selecionada?.conversa;

  const selecionar = (id: string) => router.replace(`/conversas?c=${id}`, { scroll: false });

  return (
    <div className="flex h-full min-h-0">
      <ListaConversas
        itens={visiveis}
        selecionadaId={aberta?.id ?? null}
        aoSelecionar={selecionar}
        filtro={filtro}
        aoFiltrar={setFiltro}
        contagem={contagem}
        busca={busca}
        aoBuscar={setBusca}
        escondidaNoCelular={Boolean(idNaUrl)}
        podeFiltrarCanal={ehAdmin}
      />

      {aberta && selecionada ? (
        <>
          <div className={idNaUrl ? "flex min-w-0 flex-1" : "hidden min-w-0 flex-1 md:flex"}>
            <ThreadConversa
              key={aberta.id}
              conversa={aberta}
              mensagens={mensagensPorConversa.get(aberta.id) ?? []}
              dono={selecionada.dono}
              ehAdmin={ehAdmin}
              painel={<PainelContato conversa={aberta} lead={selecionada.lead} />}
            />
          </div>
          <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-l p-4 xl:block">
            <PainelContato conversa={aberta} lead={selecionada.lead} />
          </aside>
        </>
      ) : (
        <div className="hidden flex-1 place-items-center md:grid">
          <div className="text-center text-muted-foreground">
            <MessageSquareText className="mx-auto mb-2 size-8" />
            <p className="text-sm">Selecione uma conversa para ver as mensagens.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaginaConversas() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
