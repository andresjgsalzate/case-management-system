import React, { useState } from "react";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
import {
  downloadPDF,
  createFallbackPDF,
} from "../../services/pdfExportService";
import type { KnowledgeDocumentPDF, PDFExportOptions } from "../../types/pdf";

interface PDFExportButtonProps {
  document?: KnowledgeDocumentPDF;
  title?: string;
  content?: string;
  className?: string;
  variant?: "primary" | "secondary" | "icon";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  options?: PDFExportOptions;
  onExportStart?: () => void;
  onExportSuccess?: () => void;
  onExportError?: (error: string) => void;
}

/**
 * Componente botón para exportar documentos a PDF
 * Mantiene el mismo estilo visual del sistema antiguo
 */
export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  document,
  title,
  content,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  options = {},
  onExportStart,
  onExportSuccess,
  onExportError,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estilos base del botón
  const baseStyles =
    "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variantes de estilo
  const variantStyles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-blue-500",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 focus:ring-gray-500",
    icon: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800 p-2 focus:ring-gray-500",
  };

  // Tamaños
  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Estilos de estado deshabilitado
  const disabledStyles = "opacity-50 cursor-not-allowed";

  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${variant !== "icon" ? sizeStyles[size] : ""}
    ${disabled || isExporting ? disabledStyles : ""}
    ${className}
  `.trim();

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    setError(null);

    try {
      onExportStart?.();

      if (document) {
        // Exportar documento completo
        await downloadPDF(document, {
          fileName: document.title ? `${document.title}.pdf` : "documento.pdf",
          ...options,
        });
      } else if (title || content) {
        // Crear PDF fallback con título y contenido simple
        await createFallbackPDF(
          title || "Documento",
          content || "Sin contenido disponible"
        );
      } else {
        throw new Error("No hay documento, título o contenido para exportar");
      }

      onExportSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al exportar PDF";
      setError(errorMessage);
      onExportError?.(errorMessage);
      console.error("❌ [PDF Export] Error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Contenido del botón según la variante
  const renderButtonContent = () => {
    if (variant === "icon") {
      return (
        <>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </>
      );
    }

    return (
      <>
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        <span>{isExporting ? "Generando PDF..." : "Exportar PDF"}</span>
      </>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={buttonClasses}
        title={variant === "icon" ? "Exportar a PDF" : undefined}
      >
        {renderButtonContent()}
      </button>

      {/* Mensaje de error */}
      {error && (
        <div className="absolute top-full left-0 mt-2 z-50 max-w-xs">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Error al exportar
                </p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente simplificado para casos donde solo se necesita el ícono
 */
export const PDFExportIconButton: React.FC<{
  document?: KnowledgeDocumentPDF;
  title?: string;
  content?: string;
  className?: string;
  disabled?: boolean;
  options?: PDFExportOptions;
}> = (props) => {
  return <PDFExportButton {...props} variant="icon" />;
};

/**
 * Hook personalizado para manejar la exportación de PDF
 */
export const usePDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToPDF = async (
    document?: KnowledgeDocumentPDF,
    options: PDFExportOptions = {}
  ) => {
    setIsExporting(true);
    setError(null);

    try {
      if (!document) {
        throw new Error("No se proporcionó documento para exportar");
      }

      await downloadPDF(document, {
        fileName: document.title ? `${document.title}.pdf` : "documento.pdf",
        ...options,
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  const exportFallbackPDF = async (title: string, content: string) => {
    setIsExporting(true);
    setError(null);

    try {
      await createFallbackPDF(title, content);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isExporting,
    error,
    exportToPDF,
    exportFallbackPDF,
    clearError,
  };
};

export default PDFExportButton;
