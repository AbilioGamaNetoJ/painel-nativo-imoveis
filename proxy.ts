import { NextResponse, type NextRequest } from "next/server";

// Senha simples da prévia (Basic Auth), para o link não circular. Só vale quando a variável
// PREVIA_SENHA existe: em desenvolvimento, sem ela, fica aberto. Não substitui o login
// real do sistema (Supabase Auth, só por convite).
export function proxy(request: NextRequest) {
  const senha = process.env.PREVIA_SENHA;
  if (!senha) return NextResponse.next();

  const [tipo, credencial] = (request.headers.get("authorization") ?? "").split(" ");
  if (tipo === "Basic" && credencial) {
    const decodificada = atob(credencial);
    // o usuário é livre; só a senha conta (e pode ter ":")
    if (decodificada.slice(decodificada.indexOf(":") + 1) === senha) return NextResponse.next();
  }

  return new NextResponse("Acesso restrito à demonstração da Nativo Imóveis.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Prévia Nativo Imóveis", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
