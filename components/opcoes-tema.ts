import { Monitor, Moon, Sun } from "lucide-react";
import type { Tema } from "@/lib/tema";

export const OPCOES_TEMA: { valor: Tema; rotulo: string; dica: string; icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", dica: "Fundo branco", icone: Sun },
  { valor: "escuro", rotulo: "Escuro", dica: "Descansa a vista", icone: Moon },
  { valor: "sistema", rotulo: "Automático", dica: "Segue o aparelho", icone: Monitor },
];
