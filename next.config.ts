import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A prévia roda no navegador (dados em localStorage, nada vem do servidor), então Cache
  // Components e pré-busca parcial não têm o que otimizar e só geravam um erro vermelho de
  // "navegação instantânea" no console de desenvolvimento. Ligar de novo com o Supabase.
  cacheComponents: false,
  partialPrefetching: false,
  // o indicador flutuante do modo de desenvolvimento cobre o menu do usuário
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
