"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Mic, Pause, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { hora } from "@/lib/datas";
import type { Mensagem } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/** *negrito* do WhatsApp e domínios do site em destaque */
function Texto({ texto }: { texto: string }) {
  const partes = texto.split(/(\*[^*\n]+\*|\S+\.com\.br\S*)/g);
  return (
    <>
      {partes.map((p, i) => {
        if (/^\*[^*\n]+\*$/.test(p)) return <strong key={i}>{p.slice(1, -1)}</strong>;
        if (/\.com\.br/.test(p)) return <span key={i} className="text-primary underline underline-offset-2">{p}</span>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function formatarDuracao(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Barras da forma de onda, sempre as mesmas para a mesma mensagem */
function barras(id: string, quantidade = 30) {
  let h = 7;
  for (const c of id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: quantidade }, () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return 20 + (h % 80);
  });
}

function Audio({ mensagem }: { mensagem: Mensagem }) {
  const total = mensagem.duracao ?? 10;
  const [tocando, setTocando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const alturas = useMemo(() => barras(mensagem.id), [mensagem.id]);

  // Reprodução ilustrativa: a prévia não tem áudio real, só mostra o progresso
  useEffect(() => {
    if (!tocando) return;
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s + 0.2 >= total) {
          setTocando(false);
          return 0;
        }
        return s + 0.2;
      });
    }, 200);
    return () => clearInterval(t);
  }, [tocando, total]);

  const progresso = segundos / total;
  return (
    <div className="flex w-56 items-center gap-2.5 py-0.5">
      <button
        type="button"
        onClick={() => setTocando((v) => !v)}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        aria-label={tocando ? "Pausar áudio" : "Tocar áudio"}
      >
        {tocando ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
      </button>
      <div className="flex h-7 flex-1 items-center gap-[2px]" aria-hidden>
        {alturas.map((a, i) => (
          <span
            key={i}
            className={cn("w-[2px] rounded-full", i / alturas.length < progresso ? "bg-primary" : "bg-foreground/25")}
            style={{ height: `${a}%` }}
          />
        ))}
      </div>
      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
        <Mic className="size-3" />
        {formatarDuracao(tocando ? segundos : total)}
      </span>
    </div>
  );
}

interface Props {
  mensagem: Mensagem;
  /** primeira da sequência do mesmo autor: mostra o nome */
  mostrarAutor: boolean;
  nomeAutor: string;
}

export function Bolha({ mensagem: m, mostrarAutor, nomeAutor }: Props) {
  const [ampliada, setAmpliada] = useState(false);
  const saida = m.direcao === "saida";
  const estilo =
    m.autor === "cliente" ? "border bg-bubble-in rounded-bl-md" : m.autor === "bot" ? "bg-bubble-bot rounded-br-md" : "bg-bubble-out rounded-br-md";

  return (
    <div className={cn("flex", saida ? "justify-end" : "justify-start", mostrarAutor ? "mt-3" : "mt-0.5")}>
      <div className={cn("max-w-[82%] rounded-2xl px-3 py-1.5 text-sm shadow-xs md:max-w-[70%]", estilo)}>
        {mostrarAutor ? (
          <p className={cn("mb-0.5 text-[11px] font-semibold", m.autor === "cliente" ? "text-muted-foreground" : "text-primary")}>{nomeAutor}</p>
        ) : null}

        {m.tipo === "imagem" && m.midia ? (
          <>
            <button type="button" onClick={() => setAmpliada(true)} className="mb-1 block overflow-hidden rounded-lg" aria-label="Ampliar foto">
              <Image src={m.midia} alt={m.texto || "Foto do imóvel"} width={300} height={200} sizes="300px" className="h-44 w-72 max-w-full object-cover" />
            </button>
            <Dialog open={ampliada} onOpenChange={setAmpliada}>
              <DialogContent className="max-w-3xl gap-2 p-3 sm:max-w-3xl">
                <DialogTitle className="sr-only">Foto enviada na conversa</DialogTitle>
                <DialogDescription className="sr-only">{m.texto}</DialogDescription>
                <Image src={m.midia} alt={m.texto || "Foto do imóvel"} width={900} height={600} className="h-auto w-full rounded-lg" />
                {m.texto ? <p className="text-sm text-muted-foreground">{m.texto}</p> : null}
              </DialogContent>
            </Dialog>
          </>
        ) : null}

        {m.tipo === "audio" ? <Audio mensagem={m} /> : null}
        {m.texto && m.tipo !== "audio" ? (
          <p className="break-words whitespace-pre-wrap">
            <Texto texto={m.texto} />
          </p>
        ) : null}

        <p className="mt-0.5 text-right text-[10px] text-muted-foreground tabular-nums">{hora(m.enviadaEm)}</p>
      </div>
    </div>
  );
}

export function SeparadorDia({ rotulo }: { rotulo: string }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-full bg-background/90 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-xs ring-1 ring-border">{rotulo}</span>
    </div>
  );
}
