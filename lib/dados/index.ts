// Única porta de entrada das telas para os dados. Hoje: demonstração fictícia no navegador.
// Depois do contrato: Supabase, com a mesma assinatura.
export { DadosProvider, useDados, type NovoColaborador, type NovoEncaminhamento } from "./provedor";
export { gerarDemonstracao } from "./ficticio";
export { NOME_BOT, NOME_EMPRESA } from "./dialogo-bot";
