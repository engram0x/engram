import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "/" serves from the apex custom domain (0xengram.xyz) on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
