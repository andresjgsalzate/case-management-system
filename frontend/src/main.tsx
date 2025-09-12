import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "react-hot-toast"; // Removido - usando ToastContext
import { ThemeProvider } from "./providers/ThemeProvider";
import App from "./App.tsx";
import "./index.css";

// Polyfill for Buffer in browser environment
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 segundos - reducido para documentos actualizados
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
