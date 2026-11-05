const soDigitos = (v: string) => v.replace(/\D/g, "");

/** DDD + 8 últimos dígitos: ignora o 9 extra e o DDI, a mesma regra do Normalizar no n8n */
export function chaveTelefone(numero: string): string {
  const n = soDigitos(numero);
  const d = n.length === 10 || n.length === 11 ? `55${n}` : n;
  return d.length >= 12 ? d.slice(2, 4) + d.slice(-8) : d;
}

/** 5548900010101 → (48) 90001-0101 */
export function formatarTelefone(numero: string): string {
  const n = soDigitos(numero);
  const nacional = n.startsWith("55") && n.length >= 12 ? n.slice(2) : n;
  if (nacional.length === 11) return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
  if (nacional.length === 10) return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
  return numero;
}

/** Digitação livre → 55 + DDD + número, para guardar no cadastro */
export function normalizarTelefone(entrada: string): string {
  const n = soDigitos(entrada);
  return n.length === 10 || n.length === 11 ? `55${n}` : n;
}

export function telefoneValido(entrada: string): boolean {
  const n = normalizarTelefone(entrada);
  return n.length === 12 || n.length === 13;
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
