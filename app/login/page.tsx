"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { MarcaNativo } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { useAcoesSessao, useSessao } from "@/lib/sessao";

// Na prévia não há senha: o login é escolher o perfil. No sistema real a entrada é só por
// convite (Supabase Auth), sem botão de criar conta.
const ADMIN = { papel: "admin", colaboradorId: "col-helena" } as const;
const CORRETOR = { papel: "corretor", colaboradorId: "col-lucas" } as const;

export default function Login() {
  const router = useRouter();
  const { sessao } = useSessao();
  const { entrar } = useAcoesSessao();

  useEffect(() => {
    if (sessao) router.replace("/inicio");
  }, [sessao, router]);

  const entrarComo = (perfil: typeof ADMIN | typeof CORRETOR) => {
    entrar(perfil);
    router.push("/inicio");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-secondary/60 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <MarcaNativo mostrarNome={false} className="scale-125" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrar no painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nativo Imóveis · atendimento e encaminhamento de leads</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-sm">
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
          <span>Demonstração com dados fictícios. Escolha um perfil para entrar, sem senha.</span>
        </p>

        <div className="flex flex-col gap-3">
          <Button size="lg" className="h-11 justify-start gap-3 px-4" onClick={() => entrarComo(ADMIN)}>
            <ShieldCheck className="size-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>Entrar como Administrador</span>
              <span className="text-[11px] font-normal opacity-80">Conversas, auditoria, escala e equipe</span>
            </span>
          </Button>
          <Button size="lg" variant="outline" className="h-11 justify-start gap-3 px-4" onClick={() => entrarComo(CORRETOR)}>
            <UserRound className="size-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>Entrar como Corretor</span>
              <span className="text-[11px] font-normal text-muted-foreground">Só as próprias conversas e leads</span>
            </span>
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <KeyRound className="size-3.5" />
        No sistema real, o acesso é somente por convite do administrador.
      </p>
    </main>
  );
}
