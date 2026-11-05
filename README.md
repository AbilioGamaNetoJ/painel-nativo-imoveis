# Painel Nativo Imóveis — prévia

Versão de apresentação do painel da Nativo, com **dados fictícios** e nenhuma integração real. É o começo do painel que será entregue depois do contrato: as telas e os componentes são os mesmos. O bot de atendimento (n8n) e os planos de implementação ficam fora deste repositório.

## Rodar

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
```

Entrada sem senha: na tela de login, "Entrar como Administrador" (Helena) ou "Entrar como Corretor" (Lucas). Para ver o painel como outra pessoa, use o menu do usuário, no canto inferior esquerdo.

## Roteiro da apresentação

1. Entrar como **Administrador**.
2. **Conversas**: abrir um lead, com a ficha ao lado e o histórico; registrar a origem na ficha (quem preenche é o corretor).
3. **Simular lead** (botão no menu): o cliente fala com o bot, o sistema classifica, sorteia o corretor da escala de hoje e o aviso chega no celular dele.
4. **Auditoria**: o lead novo já está lá, com corretor, data e hora.
5. **Escala**: resolver um dia sem corretor escalado, marcar vários dias de uma vez.
6. **Equipe**: cadastrar, convidar (mostra o e-mail), conectar o WhatsApp (QR Code).
7. Trocar para **Corretor**: só as conversas e os leads dele.
8. **Meu perfil** (menu do usuário): dados, tema claro/escuro e, no celular, a barra de navegação inferior.

"Restaurar demonstração" (faixa amarela no topo) volta tudo ao início.

## Telas e dispositivos

- **Celular** (até 767 px): barra de navegação no rodapé; tabelas viram cartões; o avatar no cabeçalho abre o menu do usuário (perfil, tema, trocar de perfil, simular lead).
- **Tablet**: menu lateral minimizado (só ícones) ao abrir.
- **Desktop**: menu lateral aberto. Em tablet e desktop, o botão redondo com seta no meio do menu minimiza e expande (atalho Ctrl+B).
- **Tema**: claro, escuro ou automático, em *Meu perfil* ou no menu do usuário. Fica em `localStorage` (`nativo-previa:tema`).

## Onde rodar a demonstração

Sem conta Pro por enquanto. Na reunião, o mais seguro é rodar no notebook com `pnpm build && pnpm start`: não depende de internet nem de hospedagem. Um link na Vercel (plano Hobby, gratuito) também funciona, mas os termos do Hobby restringem a uso pessoal e não comercial. A conta Pro entra com o projeto real.

## Senha da prévia

Defina `PREVIA_SENHA` (ver `.env.example`) e o `proxy.ts` passa a pedir senha (Basic Auth) em todas as páginas. Sem a variável, fica aberto. É só para o link não circular; não substitui o login real.

## Como os dados funcionam

- `lib/dados/ficticio.ts` gera equipe, escala (2 semanas antes e 2 depois), ~40 leads e as conversas, **sempre em relação a "agora"**: a prévia parece atual em qualquer dia. Os dados são determinísticos (mesma história a cada geração).
- As conversas do bot saem de `lib/dados/dialogo-bot.ts` (voz do prompt real) e as dos corretores de `dialogo-corretor.ts`. São escritas por regra a partir dos campos de cada lead, **não** geradas pelo modelo.
- O estado fica no `localStorage` do navegador e é gerado de novo quando o dia muda.
- `lib/regras.ts` tem a classificação do lead e o sorteio, no mesmo critério do n8n (`preparar-lead.js` e `docs/rodizio-vendedores.md`).
- As telas só falam com `lib/dados` e `lib/visao.ts` (quem vê o quê). Depois do contrato, esta camada passa a ler o Supabase e a RLS decide o acesso.

## O que é simulado

| Recurso | Na prévia |
|---|---|
| Login | Escolha de perfil, sem senha |
| Simular lead | Conversa gravada; o sorteio roda de verdade sobre a escala de hoje |
| QR Code | Desenho ilustrativo; "conecta" sozinho em alguns segundos |
| Áudios | Forma de onda e reprodução ilustrada, sem som |
| Convite | Mostra o e-mail; nada é enviado |
| Fotos | Imagens livres do Unsplash em `public/midia` |
| Permissões | Filtro na tela (depois, RLS no banco) |

## Estrutura

```
app/(painel)/        inicio, conversas, auditoria, escala, equipe, equipe/[id] (WhatsApp)
app/lead/[id]/       ficha do lead em largura de celular (link do aviso)
app/login/
components/          conversas/, simular-lead, ficha-lead, email-convite, ...
lib/dados/           geração dos dados, diálogos e provedor (a camada que vira Supabase)
lib/                 tipos, regras, visão por perfil, sessão, datas, telefone
```

## Notas

- Next.js 16 (Turbopack), Tailwind 4 e shadcn/ui sobre Base UI. `middleware` virou `proxy`, e `params` é uma Promise (`use(params)` em componente de cliente).
- `cacheComponents` e `partialPrefetching` estão desligados em `next.config.ts`: a prévia roda no navegador e só recebia um erro de "navegação instantânea" no console de desenvolvimento. Ligar de novo com o Supabase.
- O logo é provisório. Trocar por `MarcaNativo` (`components/marca.tsx`) quando a Nativo enviar o arquivo em alta.
