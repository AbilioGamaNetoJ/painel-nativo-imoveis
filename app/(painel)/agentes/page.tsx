"use client";

import { CartaoAgente } from "@/components/agentes/cartao-agente";
import { Pagina, SemPermissao } from "@/components/pagina";
import { useVisao } from "@/lib/visao";

export default function Agentes() {
  const { ehAdmin, estado } = useVisao();

  if (!ehAdmin) return <SemPermissao />;

  return (
    <Pagina titulo="Agentes" descricao="Os agentes de IA que atendem no WhatsApp da Nativo">
      <div className="mx-auto max-w-5xl">
        {/* colunas de largura fixa (até 21 rem): o cartão é quadrado, então a altura segue a largura */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),21rem))] justify-center gap-5 md:justify-start">
          {estado.agentes.map((agente) => (
            <CartaoAgente key={agente.id} agente={agente} />
          ))}
        </div>
      </div>
    </Pagina>
  );
}
