// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Production URL — used by BaseLayout for canonical links + absolute og:image.
  site: "https://hktaxiexam.vercel.app",

  integrations: [react()],
  devToolbar: { enabled: false },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "react-dom/client",
        "react-dom",
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      needsInterop: ["react-dom/client", "react-dom"],
    },
  },

  adapter: cloudflare(),
});