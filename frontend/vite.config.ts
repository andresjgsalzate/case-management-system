import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendUrl = env.VITE_BACKEND_URL || "http://127.0.0.1:3000";

  console.log(`🔧 Vite Config - Mode: ${mode}`);
  console.log(`🎯 Backend URL: ${backendUrl}`);
  console.log(`📡 API Base URL: ${env.VITE_API_BASE_URL || "/api"}`);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
        "@/shared": "../shared",
      },
    },
    define: {
      global: "globalThis",
    },
    server: {
      port: 5173,
      host: "127.0.0.1", // Configurado específicamente para 127.0.0.1
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false, // Para HTTPS auto-firmados
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("❌ Proxy error:", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "🔄 Proxy request:",
                req.method,
                req.url,
                "→",
                proxyReq.path
              );
            });
          },
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
