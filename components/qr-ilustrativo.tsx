"use client";

import { useMemo } from "react";

const N = 29;

function aleatorio(semente: string) {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

/** Desenho de QR Code só para a demonstração: não codifica nada e não pode ser lido */
export function QrIlustrativo({ semente, className }: { semente: string; className?: string }) {
  const modulos = useMemo(() => {
    const r = aleatorio(semente);
    const m: boolean[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => r() > 0.52));
    const marcador = (x0: number, y0: number) => {
      for (let y = -1; y <= 7; y++)
        for (let x = -1; x <= 7; x++) {
          const xx = x0 + x;
          const yy = y0 + y;
          if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
          const borda = x === 0 || x === 6 || y === 0 || y === 6;
          const miolo = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          m[yy][xx] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (borda || miolo);
        }
    };
    marcador(0, 0);
    marcador(N - 7, 0);
    marcador(0, N - 7);
    return m;
  }, [semente]);

  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} role="img" aria-label="QR Code ilustrativo" shapeRendering="crispEdges" className={className}>
      <rect x={-2} y={-2} width={N + 4} height={N + 4} fill="white" />
      {modulos.flatMap((linha, y) => linha.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#111" /> : null)))}
    </svg>
  );
}
