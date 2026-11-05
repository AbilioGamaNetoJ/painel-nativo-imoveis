import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvedorTema } from "@/components/provedor-tema";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SCRIPT_TEMA } from "@/lib/tema";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painel Nativo Imóveis · Demonstração",
  description:
    "Prévia do painel da Nativo Imóveis com dados fictícios: conversas do bot e dos corretores, auditoria de leads e escala do dia.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ProvedorTema>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </ProvedorTema>
      </body>
    </html>
  );
}
