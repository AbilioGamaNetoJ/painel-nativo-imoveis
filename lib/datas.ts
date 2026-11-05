import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/** AAAA-MM-DD no fuso do navegador (o sistema real usa America/Sao_Paulo) */
export function diaISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function hojeISO(): string {
  return diaISO(new Date());
}

/** AAAA-MM-DD → Date ao meio-dia, sem virar o dia por causa do fuso */
export function dataDoDia(dia: string): Date {
  return parseISO(`${dia}T12:00:00`);
}

export function somarDias(dia: string, dias: number): string {
  return diaISO(addDays(dataDoDia(dia), dias));
}

export function hora(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

export function dataHora(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm");
}

export function dataCurta(iso: string): string {
  return format(parseISO(iso), "dd/MM");
}

export function diaSemanaCurto(dia: string): string {
  return format(dataDoDia(dia), "EEE", { locale: ptBR });
}

export function diaLongo(dia: string): string {
  return format(dataDoDia(dia), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function diaDaSemana(dia: string): number {
  return dataDoDia(dia).getDay();
}

/** "agora", "há 12 min", "ontem" ou "03/11" para a lista de conversas */
export function rotuloLista(iso: string, agora = new Date()): string {
  const d = parseISO(iso);
  const min = Math.floor((agora.getTime() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "ontem";
  if (differenceInCalendarDays(agora, d) < 7) return format(d, "EEE", { locale: ptBR });
  return format(d, "dd/MM");
}

/** separador de dia dentro da conversa */
export function rotuloDia(iso: string, agora = new Date()): string {
  const d = parseISO(iso);
  if (isSameDay(d, agora)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd 'de' MMMM", { locale: ptBR });
}

export function mesmoDia(a: string, b: string): boolean {
  return isSameDay(parseISO(a), parseISO(b));
}

export function haQuanto(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { locale: ptBR, addSuffix: true });
}

/** Date → ISO local com fuso, para guardar no estado */
export function agoraISO(d = new Date()): string {
  return d.toISOString();
}
