import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, API calls go through this proxy so there are no CORS issues.
// Change the target if your FastAPI backend isn't on localhost:8000.
const BACKEND = process.env.VITE_BACKEND_URL || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": BACKEND,
      "/tools": BACKEND,
      "/webcall": BACKEND,
      "/health": BACKEND,
    },
  },
});
