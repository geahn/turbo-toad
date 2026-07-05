import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the built app work from any subfolder (GitHub Pages, file host, etc.)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
