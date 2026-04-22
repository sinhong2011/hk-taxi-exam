// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
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
});
