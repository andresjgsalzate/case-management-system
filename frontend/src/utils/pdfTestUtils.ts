/**
 * PRUEBA DE ADJUNTOS PDF - Debug y Validación
 * ===========================================
 *
 * Este archivo contiene funciones de utilidad para probar
 * y debuggear el renderizado de adjuntos en PDF.
 */

// Datos de ejemplo para probar el renderizado de adjuntos
export const testAttachments = [
  {
    id: "att-1",
    fileName: "Resumen_Disposiciones_Septiembre_2025.xlsx", // Test Excel
    filePath: "/uploads/documents/resumen.xlsx",
    fileType: "spreadsheet",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 1048576, // 1MB
    isEmbedded: false,
    createdAt: "2025-09-11T10:30:00Z",
  },
  {
    id: "att-2",
    fileName: "Corazon.jpg", // Test Image
    filePath: "/uploads/images/corazon.jpg",
    fileType: "image",
    mimeType: "image/jpeg",
    fileSize: 245760, // 240KB
    isEmbedded: false,
    createdAt: "2025-09-11T11:00:00Z",
  },
  {
    id: "att-3",
    fileName: "test.txt", // Test Text
    filePath: "/uploads/documents/test.txt",
    fileType: "text",
    mimeType: "text/plain",
    fileSize: 1024, // 1KB
    isEmbedded: false,
    createdAt: "2025-09-11T11:30:00Z",
  },
  {
    id: "att-4",
    fileName: "Manual_Usuario.pdf", // Test PDF
    filePath: "/uploads/documents/manual.pdf",
    fileType: "pdf",
    mimeType: "application/pdf",
    fileSize: 2097152, // 2MB
    isEmbedded: false,
    createdAt: "2025-09-11T12:00:00Z",
  },
];

// Función para validar el mapeo de adjuntos
export const validateAttachmentMapping = (attachment: any) => {
  const mapped = {
    id: attachment.id,
    file_name: attachment.fileName || attachment.file_name || attachment.name,
    file_path: attachment.filePath || attachment.file_path || attachment.path,
    file_type: attachment.fileType || attachment.file_type || "document",
    mime_type:
      attachment.mimeType || attachment.mime_type || "application/octet-stream",
    file_size:
      attachment.fileSize || attachment.file_size || attachment.size || 0,
    is_embedded: attachment.isEmbedded || attachment.is_embedded || false,
    created_at:
      attachment.createdAt || attachment.created_at || new Date().toISOString(),
  };

  return mapped;
};

// Función para probar iconos de archivos
export const testFileIcons = () => {
  const testCases = [
    { fileName: "documento.pdf", fileType: "pdf", expected: "[PDF]" },
    {
      fileName: "hoja_calculo.xlsx",
      fileType: "spreadsheet",
      expected: "[XLS]",
    },
    { fileName: "imagen.jpg", fileType: "image", expected: "[IMG]" },
    { fileName: "texto.txt", fileType: "text", expected: "[TXT]" },
    {
      fileName: "presentacion.pptx",
      fileType: "presentation",
      expected: "[PPT]",
    },
    { fileName: "archivo.zip", fileType: "archive", expected: "[ZIP]" },
    { fileName: "desconocido.xyz", fileType: "unknown", expected: "[FILE]" },
  ];

  testCases.forEach((_test) => {
    // Aquí simularíamos la función getAttachmentIcon
  });
};

// Ejemplo de uso en el componente
export const examplePDFDocument = {
  id: "doc-test",
  title: "Documento de Prueba con Adjuntos",
  content: [
    {
      id: "block-1",
      type: "heading",
      props: { level: 1 },
      content: [{ text: "Documento de Prueba", type: "text", styles: {} }],
      children: [],
    },
    {
      id: "block-2",
      type: "paragraph",
      content: [
        {
          text: "Este documento contiene varios tipos de adjuntos para probar el renderizado en PDF.",
          type: "text",
          styles: {},
        },
      ],
      props: {},
      children: [],
    },
  ],
  document_type: { name: "Prueba", code: "test" },
  priority: "medium",
  difficulty_level: 2,
  is_published: true,
  view_count: 1,
  version: 1,
  tags: [
    { id: "tag-1", tag_name: "Prueba", color: "#3B82F6" },
    { id: "tag-2", tag_name: "Adjuntos", color: "#F59E0B" },
  ],
  attachments: testAttachments.map(validateAttachmentMapping),
  created_at: "2025-09-11T10:00:00Z",
  updated_at: "2025-09-11T12:00:00Z",
  createdByUser: {
    fullName: "Usuario de Prueba",
    email: "test@example.com",
  },
};

export default {
  testAttachments,
  validateAttachmentMapping,
  testFileIcons,
  examplePDFDocument,
};
