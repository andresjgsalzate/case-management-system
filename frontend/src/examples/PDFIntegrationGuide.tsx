/**
 * GUÍA DE INTEGRACIÓN - Exportar PDF en Knowledge Base
 * ====================================================
 *
 * Este archivo muestra cómo integrar el botón de exportar PDF
 * en las páginas existentes del sistema de Knowledge Base.
 *
 * CARACTERÍSTICAS IMPLEMENTADAS:
 * - ✅ Syntax highlighting para bloques de código (mismo estilo sistema antiguo)
 * - ✅ Estilos profesionales con metadatos, etiquetas y adjuntos
 * - ✅ Manejo de imágenes externas con placeholders por CORS
 * - ✅ Página separada para adjuntos documentales
 * - ✅ Componente reutilizable con múltiples variantes
 * - ✅ Hook personalizado para manejo de estados
 * - ✅ Manejo de errores con mensajes informativos
 */

import React from "react";
import {
  PDFExportButton,
  PDFExportIconButton,
  usePDFExport,
} from "../components/knowledge/PDFExportButton";
import type { KnowledgeDocumentPDF } from "../types/pdf";

// =================== EJEMPLO 1: BOTÓN EN TOOLBAR ===================

/**
 * Ejemplo de integración en toolbar de documento
 * (Similar a la barra de herramientas de BlockNote)
 */
const DocumentToolbar: React.FC<{ document: KnowledgeDocumentPDF }> = ({
  document,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
      {/* Otros botones del toolbar */}
      <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
        Guardar
      </button>
      <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
        Compartir
      </button>

      {/* Separador */}
      <div className="h-4 w-px bg-gray-300" />

      {/* Botón PDF - Variante icono para espacios reducidos */}
      <PDFExportIconButton document={document} className="hover:bg-gray-100" />

      {/* O variante completa */}
      <PDFExportButton document={document} variant="secondary" size="sm" />
    </div>
  );
};

// =================== EJEMPLO 2: BOTÓN EN HEADER DE PÁGINA ===================

/**
 * Ejemplo de integración en header principal de documento
 */
const DocumentHeader: React.FC<{ document: KnowledgeDocumentPDF }> = ({
  document,
}) => {
  return (
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {document.title || "Documento Sin Título"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Última modificación:{" "}
          {new Date(
            document.updated_at || document.created_at || Date.now()
          ).toLocaleDateString("es-ES")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Otros botones de acción */}
        <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          Editar
        </button>

        {/* Botón PDF principal */}
        <PDFExportButton
          document={document}
          variant="primary"
          size="md"
          onExportError={(error) => console.error("Error al exportar:", error)}
        />
      </div>
    </div>
  );
};

// =================== EJEMPLO 3: MENÚ CONTEXTUAL ===================

/**
 * Ejemplo de integración en menú desplegable
 */
export const DocumentActionsMenu: React.FC<{
  document: KnowledgeDocumentPDF;
}> = ({ document }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <span>Duplicar</span>
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <span>Mover a categoría</span>
            </button>
            <hr className="my-1" />

            {/* Opción PDF en el menú */}
            <div className="px-4 py-2 hover:bg-gray-100">
              <PDFExportButton
                document={document}
                variant="secondary"
                size="sm"
                className="w-full justify-start"
              />
            </div>

            <hr className="my-1" />
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =================== EJEMPLO 4: USANDO HOOK PERSONALIZADO ===================

/**
 * Ejemplo usando el hook personalizado para control avanzado
 */
const CustomPDFExportComponent: React.FC<{
  document: KnowledgeDocumentPDF;
}> = ({ document }) => {
  const { isExporting, error, exportToPDF, clearError } = usePDFExport();

  const handleExport = async () => {
    clearError();

    const result = await exportToPDF(document, {
      fileName: `${document.title || "documento"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`,
    });

    if (result.success) {
      // Lógica personalizada después de exportar exitosamente
      // Podríamos mostrar un toast, actualizar analytics, etc.
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          ${
            isExporting
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
      >
        {isExporting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Generando PDF...</span>
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Exportar PDF Personalizado</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">Error: {error}</p>
          <button
            onClick={clearError}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

// =================== EJEMPLO 5: CARD DE DOCUMENTO ===================

/**
 * Ejemplo en card de lista de documentos
 */
const DocumentCard: React.FC<{ document: KnowledgeDocumentPDF }> = ({
  document,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {document.title || "Documento Sin Título"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {document.document_type?.name} • {document.view_count || 0}{" "}
            visualizaciones
          </p>

          {/* Etiquetas */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {document.tags.slice(0, 3).map((tag: any, index: number) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: tag.color || "#E5E7EB",
                    color: "#000",
                  }}
                >
                  {tag.tag_name}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{document.tags.length - 3} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2 ml-4">
          <PDFExportIconButton
            document={document}
            className="text-gray-400 hover:text-gray-600"
          />
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// =================== DATOS DE EJEMPLO ===================

/**
 * Ejemplo de estructura de datos compatible
 */
const exampleDocument: KnowledgeDocumentPDF = {
  id: "doc-123",
  title: "Guía de Configuración del Sistema",
  content: [
    {
      id: "block-1",
      type: "heading",
      props: { level: 1 },
      content: [{ text: "Introducción", type: "text", styles: {} }],
      children: [],
    },
    {
      id: "block-2",
      type: "paragraph",
      content: [
        {
          text: "Esta guía explica cómo configurar el sistema correctamente...",
          type: "text",
          styles: {},
        },
      ],
      props: {},
      children: [],
    },
    {
      id: "block-3",
      type: "codeBlock",
      props: { language: "javascript" },
      content: [
        {
          type: "text",
          text: "",
          styles: {},
        },
      ],
      children: [],
    },
  ],
  document_type: { name: "Tutorial", code: "tutorial" },
  priority: "Alta",
  difficulty_level: 3,
  is_published: true,
  view_count: 45,
  version: 1.2,
  tags: [
    { id: "tag-1", tag_name: "Configuración", color: "#3B82F6" },
    { id: "tag-2", tag_name: "Sistema", color: "#10B981" },
    { id: "tag-3", tag_name: "Tutorial", color: "#F59E0B" },
  ],
  attachments: [
    {
      id: "att-1",
      file_name: "configuracion-avanzada.pdf",
      file_path: "/uploads/documents/configuracion-avanzada.pdf",
      file_type: "document",
      mime_type: "application/pdf",
      file_size: 1024000,
      is_embedded: false,
      created_at: "2024-01-15T10:30:00Z",
    },
  ],
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T14:30:00Z",
  createdByUser: {
    fullName: "Juan Pérez",
    email: "juan.perez@empresa.com",
  },
};

// =================== COMPONENTE DE DEMOSTRACIÓN ===================

/**
 * Página de demostración que muestra todas las integraciones
 */
const PDFIntegrationDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Demostración PDF Export
        </h1>
        <p className="text-gray-600 mt-2">
          Ejemplos de integración del botón de exportar PDF en Knowledge Base
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Header de Documento</h2>
          <DocumentHeader document={exampleDocument} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Toolbar</h2>
          <DocumentToolbar document={exampleDocument} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Card de Documento</h2>
          <DocumentCard document={exampleDocument} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            4. Control Personalizado
          </h2>
          <CustomPDFExportComponent document={exampleDocument} />
        </section>
      </div>
    </div>
  );
};

export default PDFIntegrationDemo;

// =================== NOTAS DE IMPLEMENTACIÓN ===================

/**
 * PASOS PARA INTEGRAR EN TU PROYECTO:
 *
 * 1. Importar el componente donde necesites el botón:
 *    import { PDFExportButton } from '../components/knowledge/PDFExportButton';
 *
 * 2. Preparar los datos del documento en formato KnowledgeDocumentPDF:
 *    - Convertir el contenido de BlockNote al formato PDFContentBlock
 *    - Incluir metadatos, etiquetas y adjuntos
 *    - Asegurar que las imágenes tengan URLs accesibles
 *
 * 3. Usar el componente:
 *    <PDFExportButton document={myDocument} variant="primary" />
 *
 * 4. Para control avanzado, usar el hook:
 *    const { exportToPDF, isExporting, error } = usePDFExport();
 *
 * FUNCIONALIDADES INCLUIDAS:
 * - ✅ Syntax highlighting automático para código
 * - ✅ Estilos profesionales idénticos al sistema antiguo
 * - ✅ Manejo de etiquetas con colores
 * - ✅ Página separada para adjuntos documentales
 * - ✅ Placeholders para imágenes externas
 * - ✅ Metadatos completos del documento
 * - ✅ Tipado TypeScript completo
 * - ✅ Manejo de errores robusto
 * - ✅ Estados de carga
 * - ✅ Múltiples variantes de UI
 */
