import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Bichinho de pixel art, desenhado como grade de caracteres e convertido em retângulos SVG
// (fica nítido em qualquer tamanho). Acordado: pisca, flutua e a antena acende.
// Dormindo: olhos fechados, cinza, respirando devagar, com os "z" subindo.
//
//   B corpo   L brilho   S sombra   D contorno/fones   E olho   W reflexo do olho
//   G antena acesa   M boca   . vazio

const PALETA: Record<string, string> = {
  B: "oklch(0.7 0.17 150)",
  L: "oklch(0.85 0.14 150)",
  S: "oklch(0.56 0.15 150)",
  D: "oklch(0.36 0.09 150)",
  E: "oklch(0.2 0.03 150)",
  W: "oklch(0.98 0 0)",
  G: "oklch(0.88 0.16 90)",
  M: "oklch(0.3 0.06 150)",
};

const ACORDADO = [
  ".......GG.......",
  ".......DD.......",
  "...LLLLLLLLLL...",
  "..BBBBBBBBBBBB..",
  "..BBBBBBBBBBBB..",
  "DDBBWEBBBBWEBBDD",
  "DDBBEEBBBBEEBBDD",
  "DDBBEEBBBBEEBBDD",
  "DDBBBBBBBBBBBBDD",
  "..BBBBMBBMBBBB..",
  "..SSSSSMMSSSSS..",
  "....DDD..DDD....",
  "....DDD..DDD....",
];

const DORMINDO = [
  ".......DD.......",
  ".......DD.......",
  "...LLLLLLLLLL...",
  "..BBBBBBBBBBBB..",
  "..BBBBBBBBBBBB..",
  "DDBBBBBBBBBBBBDD",
  "DDBBBBBBBBBBBBDD",
  "DDBBEEBBBBEEBBDD",
  "DDBBBBBBBBBBBBDD",
  "..BBBBBMMBBBBB..",
  "..SSSSSSSSSSSS..",
  "....DDD..DDD....",
  "....DDD..DDD....",
];

interface Retangulo {
  x: number;
  y: number;
  largura: number;
  cor: string;
}

/** Junta pixels vizinhos da mesma cor na mesma linha em um retângulo só */
function paraRetangulos(linhas: string[]) {
  const corpo: Retangulo[] = [];
  const olhos: Retangulo[] = [];
  linhas.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const c = linha[x];
      let fim = x;
      while (fim + 1 < linha.length && linha[fim + 1] === c) fim += 1;
      if (c !== ".") (c === "E" || c === "W" ? olhos : corpo).push({ x, y, largura: fim - x + 1, cor: PALETA[c] });
      x = fim + 1;
    }
  });
  return { corpo, olhos };
}

const FIGURAS = { acordado: paraRetangulos(ACORDADO), dormindo: paraRetangulos(DORMINDO) };

function Pixels({ itens, className }: { itens: Retangulo[]; className?: string }) {
  return (
    <g className={className}>
      {itens.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.largura} height={1} fill={r.cor} />
      ))}
    </g>
  );
}

export function Mascote({
  acordado = true,
  bloqueado = false,
  tamanho = 112,
  className,
}: {
  acordado?: boolean;
  /** agente ainda não liberado: só a silhueta, parada, com um cadeado */
  bloqueado?: boolean;
  tamanho?: number;
  className?: string;
}) {
  const { corpo, olhos } = acordado && !bloqueado ? FIGURAS.acordado : FIGURAS.dormindo;
  const vivo = acordado && !bloqueado;

  return (
    <span aria-hidden className={cn("relative inline-flex flex-col items-center", className)} style={{ width: tamanho }}>
      {/* a chave faz o pulinho de "acordar" tocar de novo a cada troca de estado */}
      <span key={String(vivo)} className={cn("block w-full", !bloqueado && "mascote-acordar")}>
        <svg
          viewBox="0 0 16 13"
          shapeRendering="crispEdges"
          className={cn(
            "block h-auto w-full drop-shadow-[0_4px_0_oklch(0_0_0/0.08)]",
            bloqueado ? "opacity-20 brightness-0 drop-shadow-none dark:opacity-30 dark:invert" : vivo ? "mascote-flutuar" : "mascote-dormir opacity-80 grayscale",
          )}
        >
          <Pixels itens={corpo.filter((r) => !(vivo && r.cor === PALETA.G))} />
          {vivo ? <Pixels itens={corpo.filter((r) => r.cor === PALETA.G)} className="mascote-antena" /> : null}
          <Pixels itens={olhos} className={vivo ? "mascote-olhos" : undefined} />
        </svg>
      </span>

      {/* sombra no chão */}
      {bloqueado ? null : <span className="mt-1 h-1.5 w-3/5 rounded-full bg-foreground/10" />}

      {bloqueado ? (
        <span className="absolute -right-2 -bottom-1 grid size-8 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm">
          <Lock className="size-4" />
        </span>
      ) : vivo ? (
        <>
          <span className="mascote-brilho absolute top-[8%] left-[2%] size-1.5 bg-amber-300" />
          <span className="mascote-brilho absolute top-[2%] right-[6%] size-1 bg-emerald-300 [animation-delay:0.7s]" />
          <span className="mascote-brilho absolute top-[58%] -left-[4%] size-1 bg-emerald-300 [animation-delay:1.3s]" />
          <span className="mascote-brilho absolute top-[48%] -right-[2%] size-1.5 bg-amber-300 [animation-delay:0.3s]" />
        </>
      ) : (
        <>
          <span className="mascote-zzz absolute top-[6%] right-[8%] text-xs font-bold text-muted-foreground">z</span>
          <span className="mascote-zzz absolute top-[-4%] right-[-2%] text-sm font-bold text-muted-foreground [animation-delay:1.4s]">Z</span>
        </>
      )}
    </span>
  );
}
