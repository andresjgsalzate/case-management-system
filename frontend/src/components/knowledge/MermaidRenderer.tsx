import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidRendererProps {
  code: string;
  id?: string;
  className?: string;
}

// Initialize mermaid with default config
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
  sequence: {
    useMaxWidth: true,
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    messageMargin: 40,
  },
  pie: {
    useMaxWidth: true,
  },
  er: {
    useMaxWidth: true,
  },
  gantt: {
    useMaxWidth: true,
  },
});

const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  code,
  id,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugCode, setDebugCode] = useState<string>("");

  useEffect(() => {
    const renderDiagram = async () => {
      // Limpiar y normalizar el código
      const cleanCode = code?.trim() || "";
      setDebugCode(cleanCode);

      if (!cleanCode) {
        setError("Código del diagrama vacío");
        setIsLoading(false);
        return;
      }

      if (!containerRef.current) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate unique ID for rendering
        const uniqueId =
          id ||
          `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Reinicializar mermaid antes de cada render
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        // Intentar renderizar directamente (mermaid.render valida internamente)
        const { svg: renderedSvg } = await mermaid.render(uniqueId, cleanCode);

        if (renderedSvg) {
          setSvg(renderedSvg);
          setError(null);
        } else {
          setError("El renderizado no produjo resultado");
        }
      } catch (err: any) {
        console.error("Mermaid rendering error:", err);
        console.error("Code that failed:", cleanCode);
        setError(err?.message || "Error al renderizar el diagrama");
        setSvg("");
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [code, id]);

  if (isLoading) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
          Renderizando diagrama...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
      >
        <div className="flex items-start gap-2">
          <span className="text-red-500 dark:text-red-400">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error en el diagrama Mermaid
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
              {error}
            </p>
            <details className="mt-2">
              <summary className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline">
                Ver código fuente
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-x-auto text-red-800 dark:text-red-200">
                {code}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        ref={containerRef}
        className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}
      >
        <div className="flex items-start gap-2">
          <span className="text-yellow-500">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              No se pudo renderizar el diagrama
            </p>
            <details className="mt-2">
              <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer hover:underline">
                Ver código recibido ({debugCode.length} caracteres)
              </summary>
              <pre className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs overflow-x-auto text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                {debugCode || "(vacío)"}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram overflow-auto p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidRenderer;

// Helper function to detect if content is mermaid code
export function isMermaidCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;

  // Limpiar el código: remover espacios extras y convertir a minúsculas
  const trimmed = code.trim();
  const firstLine = trimmed.split("\n")[0].trim().toLowerCase();

  // Patrones que indican código Mermaid (case-insensitive)
  const mermaidPatterns = [
    /^(graph|flowchart)\s+(td|tb|bt|rl|lr)/i,
    /^sequencediagram/i,
    /^classdiagram/i,
    /^statediagram/i,
    /^erdiagram/i,
    /^journey/i,
    /^gantt/i,
    /^pie/i,
    /^requirement/i,
    /^gitgraph/i,
    /^mindmap/i,
    /^timeline/i,
    /^%%\s*{init:/i, // Mermaid config directive
    /^c4context/i,
    /^c4container/i,
    /^c4component/i,
    /^c4dynamic/i,
    /^c4deployment/i,
  ];

  // Probar con la primera línea para mejor detección
  return mermaidPatterns.some(
    (pattern) => pattern.test(firstLine) || pattern.test(trimmed),
  );
}

// Common mermaid diagram templates
export const MERMAID_TEMPLATES = {
  flowchart: `graph TD
    A[Inicio] --> B{Decisión}
    B -->|Sí| C[Acción 1]
    B -->|No| D[Acción 2]
    C --> E[Fin]
    D --> E`,

  sequence: `sequenceDiagram
    participant Usuario
    participant Sistema
    participant BaseDatos
    
    Usuario->>Sistema: Solicitud
    Sistema->>BaseDatos: Consulta
    BaseDatos-->>Sistema: Datos
    Sistema-->>Usuario: Respuesta`,

  classDiagram: `classDiagram
    class Usuario {
        +String nombre
        +String email
        +login()
        +logout()
    }
    class Documento {
        +String titulo
        +String contenido
        +guardar()
    }
    Usuario --> Documento : crea`,

  stateDiagram: `stateDiagram-v2
    [*] --> Borrador
    Borrador --> EnRevision : enviar
    EnRevision --> Aprobado : aprobar
    EnRevision --> Rechazado : rechazar
    Rechazado --> Borrador : corregir
    Aprobado --> Publicado : publicar
    Publicado --> [*]`,

  entityRelationship: `erDiagram
    USUARIO ||--o{ DOCUMENTO : crea
    USUARIO ||--o{ COMENTARIO : escribe
    DOCUMENTO ||--o{ COMENTARIO : tiene
    DOCUMENTO }|--|| CATEGORIA : pertenece`,

  gantt: `gantt
    title Cronograma del Proyecto
    dateFormat  YYYY-MM-DD
    section Planificación
    Análisis      :a1, 2024-01-01, 7d
    Diseño        :a2, after a1, 5d
    section Desarrollo
    Backend       :b1, after a2, 14d
    Frontend      :b2, after a2, 14d
    section Pruebas
    Testing       :c1, after b1, 7d`,

  pie: `pie title Distribución de Tareas
    "Desarrollo" : 45
    "Testing" : 25
    "Documentación" : 15
    "Reuniones" : 15`,

  mindmap: `mindmap
  root((Base de Conocimiento))
    Documentación
      Guías
      Tutoriales
      FAQs
    Categorías
      Técnico
      Procesos
      Soporte
    Gestión
      Revisión
      Aprobación
      Publicación`,
};
