/**
 * Plantilla de documentación para la Base de Conocimiento
 * Basada en las 4 preguntas clave para documentar casos resueltos
 */

export const DOCUMENTATION_TEMPLATE = [
  {
    id: "heading-1",
    type: "heading",
    props: {
      level: 2,
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "1. Descripción del Problema", styles: {} },
    ],
    children: [],
  },
  {
    id: "q1a",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "¿QUÉ está ocurriendo?", styles: { bold: true } },
    ],
    children: [],
  },
  {
    id: "q1a-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Describir el problema reportado de manera clara y concisa)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q1a-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "q1b",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [{ type: "text", text: "¿CÓMO ocurre?", styles: { bold: true } }],
    children: [],
  },
  {
    id: "q1b-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Explicar los pasos para reproducir el problema, si es posible)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q1b-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "q1c",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "¿POR QUÉ es importante resolverlo?",
        styles: { bold: true },
      },
    ],
    children: [],
  },
  {
    id: "q1c-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Indicar el impacto que tiene en el usuario o en el sistema)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q1c-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "heading-2",
    type: "heading",
    props: {
      level: 2,
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "2. Diagnóstico del Resolutor", styles: {} },
    ],
    children: [],
  },
  {
    id: "q2a",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "Análisis del caso", styles: { bold: true } },
    ],
    children: [],
  },
  {
    id: "q2a-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(El resolutor indica si el problema es conforme a lo reportado y añade cualquier observación relevante)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q2a-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "q2b",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "Confirmación de causa", styles: { bold: true } },
    ],
    children: [],
  },
  {
    id: "q2b-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Indicar si el problema se debe a error del usuario, falla del sistema, configuración incorrecta, etc.)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q2b-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "heading-3",
    type: "heading",
    props: {
      level: 2,
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [{ type: "text", text: "3. Solución Aplicada", styles: {} }],
    children: [],
  },
  {
    id: "q3a",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "Acciones tomadas", styles: { bold: true } },
    ],
    children: [],
  },
  {
    id: "q3a-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Lista de pasos realizados para resolver el problema)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q3a-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "q3b",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "Resultado final", styles: { bold: true } },
    ],
    children: [],
  },
  {
    id: "q3b-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Indicar si el problema se resolvió completamente, si requiere seguimiento o si hay una solución alternativa)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q3b-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "q3c",
    type: "heading",
    props: {
      level: 3,
      textColor: "blue",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      { type: "text", text: "Tiempo empleado", styles: { bold: true } },
    ],
    children: [],
  },
  {
    id: "q3c-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Tiempo estimado en la resolución del caso)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q3c-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
  {
    id: "heading-4",
    type: "heading",
    props: {
      level: 2,
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [{ type: "text", text: "4. Notas y Observaciones", styles: {} }],
    children: [],
  },
  {
    id: "q4-desc",
    type: "paragraph",
    props: {
      textColor: "gray",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "(Cualquier información adicional relevante sobre el caso)",
        styles: { italic: true },
      },
    ],
    children: [],
  },
  {
    id: "q4-content",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
];

/**
 * Estructura vacía para documentos sin plantilla
 */
export const EMPTY_DOCUMENT_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};
