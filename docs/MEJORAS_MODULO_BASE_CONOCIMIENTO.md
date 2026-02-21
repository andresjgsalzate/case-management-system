# 📋 Ideas de Mejora - Módulo Base de Conocimiento

> **Documento generado:** 24 de enero de 2026  
> **Proyecto:** Case Management System  
> **Módulo:** Base de Conocimiento (Knowledge Base)

---

## 📑 Índice

1. [Búsqueda y Listado](#1-búsqueda-y-listado)
2. [Vista de Documento](#2-vista-de-documento)
3. [Formulario de Edición](#3-formulario-de-edición)
4. [Editor de Contenido](#4-editor-de-contenido)
5. [Sistema de Tags](#5-sistema-de-tags)
6. [Archivos Adjuntos](#6-archivos-adjuntos)
7. [Métricas y Analytics](#7-métricas-y-analytics)
8. [Permisos y Acceso](#8-permisos-y-acceso)
9. [UX/UI General](#9-uxui-general)
10. [Integraciones](#10-integraciones)
11. [Recomendaciones Prioritarias](#-top-10-recomendaciones-prioritarias)

---

## 1. Búsqueda y Listado

**Archivo principal:** `frontend/src/pages/KnowledgeBase.tsx`

| #    | Idea                                  | Descripción                                                                                             | Impacto  |
| ---- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| 1.1  | **Paginación infinita/virtual**       | Actualmente carga todos los documentos. Implementar scroll infinito o paginación para mejor rendimiento | 🔴 Alto  |
| 1.2  | **Filtros avanzados persistentes**    | Guardar filtros en localStorage/URL para que persistan al navegar                                       | 🟡 Medio |
| 1.3  | **Vista de lista vs tarjetas**        | Toggle para alternar entre vista de tarjetas y vista de lista compacta                                  | 🟡 Medio |
| 1.4  | **Filtros por fecha**                 | Agregar filtro de rango de fechas (creado/actualizado esta semana, mes, etc.)                           | 🟡 Medio |
| 1.5  | **Filtros por estado**                | Filtrar por Publicado/Borrador/Archivado/Obsoleto directamente                                          | 🔴 Alto  |
| 1.6  | **Filtros por tipo de documento**     | Selector para filtrar por tipo de documento                                                             | 🔴 Alto  |
| 1.7  | **Ordenamiento por relevancia**       | En búsqueda, ordenar por score de relevancia además de fecha                                            | 🟡 Medio |
| 1.8  | **Preview rápido (hover/modal)**      | Ver resumen del documento sin navegar a la página completa                                              | 🟡 Medio |
| 1.9  | **Búsqueda en contenido de archivos** | Indexar y buscar dentro de PDFs/documentos adjuntos                                                     | 🔴 Alto  |
| 1.10 | **Historial de búsquedas**            | Guardar y mostrar búsquedas recientes del usuario                                                       | 🟢 Bajo  |

### Notas técnicas:

- La paginación podría usar `react-virtual` o `react-window` para virtualización
- Los filtros persistentes pueden usar `useSearchParams` de React Router
- La búsqueda en archivos requiere integración con servicios como Apache Tika o ElasticSearch

---

## 2. Vista de Documento

**Archivo principal:** `frontend/src/pages/KnowledgeDocumentView.tsx`

| #    | Idea                               | Descripción                                                                       | Impacto  |
| ---- | ---------------------------------- | --------------------------------------------------------------------------------- | -------- |
| 2.1  | **Tabla de contenidos automática** | Generar TOC lateral con los encabezados del documento para navegación rápida      | 🔴 Alto  |
| 2.2  | **Tiempo de lectura estimado**     | Calcular y mostrar tiempo de lectura basado en cantidad de texto                  | 🟢 Bajo  |
| 2.3  | **Favoritos funcional**            | El botón `handleToggleFavorite` está vacío (TODO). Implementar lista de favoritos | 🔴 Alto  |
| 2.4  | **Compartir documento**            | Botón para copiar link o compartir por email/slack                                | 🟡 Medio |
| 2.5  | **Modo presentación/impresión**    | Vista optimizada para proyectar o imprimir (sin sidebar, UI limpia)               | 🟢 Bajo  |
| 2.6  | **Historial de versiones visual**  | Mostrar timeline de cambios con diff entre versiones                              | 🔴 Alto  |
| 2.7  | **Documentos relacionados**        | Mostrar documentos similares basados en tags/contenido                            | 🔴 Alto  |
| 2.8  | **Comentarios en documento**       | Sistema de comentarios/discusión sobre el documento                               | 🔴 Alto  |
| 2.9  | **Anclas/bookmarks internos**      | Permitir enlazar a secciones específicas del documento                            | 🟡 Medio |
| 2.10 | **Estadísticas de documento**      | Gráfico de visualizaciones en el tiempo, feedback breakdown                       | 🟢 Bajo  |
| 2.11 | **Breadcrumb de navegación**       | Mostrar ruta de navegación (Ej: Base > Tipo > Documento)                          | 🟢 Bajo  |
| 2.12 | **Indicador de actualización**     | Badge cuando el documento fue actualizado recientemente                           | 🟢 Bajo  |

### Código actual con TODO:

```typescript
// En KnowledgeDocumentView.tsx línea ~153
const handleToggleFavorite = () => {
  // TODO: Implement favorite functionality
};
```

### Notas técnicas:

- La TOC puede generarse parseando `jsonContent` buscando bloques tipo `heading`
- El sistema de favoritos necesita tabla nueva en BD y endpoint en backend
- Para documentos relacionados, considerar algoritmo TF-IDF o embeddings

---

## 3. Formulario de Edición

**Archivo principal:** `frontend/src/pages/KnowledgeDocumentForm.tsx` (1667 líneas)

| #    | Idea                                  | Descripción                                                                       | Impacto  |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| 3.1  | **Edición colaborativa**              | Indicador de quién está editando, bloqueo de documento                            | 🔴 Alto  |
| 3.2  | **Modo borrador offline**             | Usar Service Worker para editar sin conexión                                      | 🔴 Alto  |
| 3.3  | **Templates dinámicos**               | Más plantillas predefinidas seleccionables (FAQ, Tutorial, Troubleshooting, etc.) | 🔴 Alto  |
| 3.4  | **Programar publicación**             | Fecha/hora para publicar automáticamente un borrador                              | 🟡 Medio |
| 3.5  | **Revisión antes de publicar**        | Workflow de aprobación: Borrador → Revisión → Publicado                           | 🔴 Alto  |
| 3.6  | **Contador de palabras/caracteres**   | Mostrar estadísticas del contenido en tiempo real                                 | 🟢 Bajo  |
| 3.7  | **Autocompletado de tags mejorado**   | Sugerir tags basados en el contenido del documento (ML/NLP)                       | 🔴 Alto  |
| 3.8  | **Preview lado a lado**               | Vista split con editor a la izquierda y preview a la derecha                      | 🟡 Medio |
| 3.9  | **Atajos de teclado documentados**    | Modal con lista de atajos (Ctrl+S guardar, etc.)                                  | 🟢 Bajo  |
| 3.10 | **Validaciones más claras**           | Indicadores visuales de campos obligatorios faltantes antes de guardar            | 🟡 Medio |
| 3.11 | **Arrastrar y soltar secciones**      | Drag & drop de bloques de contenido para reordenar                                | 🟡 Medio |
| 3.12 | **Importar desde URL/archivo**        | Convertir página web o archivo Markdown/Word a documento                          | 🔴 Alto  |
| 3.13 | **Exportar a más formatos**           | Markdown, Word (.docx), HTML además de PDF                                        | 🟡 Medio |
| 3.14 | **Indicador de guardado más visible** | Barra de progreso o animación más prominente                                      | 🟢 Bajo  |

### Funcionalidades actuales:

- ✅ Autoguardado cada 1 minuto (`AUTOSAVE_INTERVAL`)
- ✅ Backup local en localStorage
- ✅ Tracking de actividad para sesión
- ✅ Una plantilla de documentación (4 secciones)
- ✅ Sistema de tags con predicción

### Notas técnicas:

- Edición colaborativa requiere WebSockets (Socket.io o similar)
- El workflow de revisión necesita nuevo campo `status` con valores: draft, review, published
- Importación desde URL puede usar bibliotecas como `turndown` para HTML→Markdown

---

## 4. Editor de Contenido

**Archivo principal:** `frontend/src/components/knowledge/BlockNoteEditor.tsx` (1039 líneas)

| #   | Idea                               | Descripción                                             | Impacto  |
| --- | ---------------------------------- | ------------------------------------------------------- | -------- |
| 4.1 | **Bloques personalizados**         | Callout boxes (info, warning, danger), acordeones, tabs | 🔴 Alto  |
| 4.2 | **Menciones (@usuario)**           | Mencionar usuarios en el documento con notificación     | 🔴 Alto  |
| 4.3 | **Referencias a otros documentos** | Autocompletar links a otros documentos de la KB         | 🔴 Alto  |
| 4.4 | **Diagramas**                      | Integrar mermaid.js o draw.io para diagramas inline     | 🔴 Alto  |
| 4.5 | **Embeds de video**                | YouTube, Vimeo embeds con preview                       | 🟡 Medio |
| 4.6 | **Templates de código**            | Snippets predefinidos (ej: comando SSH, query SQL)      | 🟡 Medio |
| 4.7 | **Checklist interactivo**          | Lista de verificación que guarde estado (para procesos) | 🟡 Medio |
| 4.8 | **Variables/placeholders**         | `{{VARIABLE}}` que se reemplacen según contexto         | 🟡 Medio |

### Bloques actualmente soportados:

```typescript
// BlockNoteEditor.tsx - bloques válidos actuales
const validTypes = [
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "codeBlock",
  "table",
  "file",
  "image",
  "video",
  "audio",
];
```

### Ejemplo de bloque callout propuesto:

```typescript
// Nuevo tipo de bloque
{
  type: "callout",
  props: {
    variant: "info" | "warning" | "danger" | "success",
    title: string
  },
  content: [...]
}
```

### Notas técnicas:

- BlockNote permite crear bloques personalizados con `createReactBlockSpec`
- Para diagramas, mermaid.js se puede integrar como bloque custom
- Las menciones requieren endpoint de búsqueda de usuarios

---

## 5. Sistema de Tags

| #   | Idea                               | Descripción                                       | Impacto  |
| --- | ---------------------------------- | ------------------------------------------------- | -------- |
| 5.1 | **Jerarquía de tags**              | Tags padre/hijo (ej: Backend > Node.js > Express) | 🔴 Alto  |
| 5.2 | **Gestión masiva de tags**         | Renombrar/merge/eliminar tags en bulk desde admin | 🔴 Alto  |
| 5.3 | **Tags sugeridos automáticamente** | AI que sugiere tags basado en contenido           | 🔴 Alto  |
| 5.4 | **Nube de tags visual**            | Visualización de tags por frecuencia              | 🟢 Bajo  |
| 5.5 | **Tags obligatorios por tipo**     | Requerir ciertos tags según tipo de documento     | 🟡 Medio |

### Estructura actual de tags:

```typescript
interface KnowledgeDocumentTag {
  id: string;
  tagName: string;
  color: string;
  usageCount: number;
  category?: string;
}
```

### Propuesta para jerarquía:

```typescript
interface HierarchicalTag extends KnowledgeDocumentTag {
  parentId?: string;
  children?: HierarchicalTag[];
  level: number;
  fullPath: string; // "Backend/Node.js/Express"
}
```

---

## 6. Archivos Adjuntos

| #   | Idea                       | Descripción                                                  | Impacto  |
| --- | -------------------------- | ------------------------------------------------------------ | -------- |
| 6.1 | **Preview de archivos**    | Previsualizar PDFs, imágenes, videos sin descargar           | 🔴 Alto  |
| 6.2 | **Versionado de archivos** | Historial de versiones de archivos adjuntos                  | 🟡 Medio |
| 6.3 | **Límite configurable**    | Admin define límite de archivos/tamaño por tipo de documento | 🟢 Bajo  |
| 6.4 | **Galería de imágenes**    | Vista de galería para documentos con muchas imágenes         | 🟢 Bajo  |
| 6.5 | **OCR de imágenes**        | Extraer texto de screenshots para indexación/búsqueda        | 🔴 Alto  |

### Configuración actual:

```typescript
// KnowledgeDocumentForm.tsx
<FileUpload
  documentId={id}
  maxFiles={10}
  maxFileSize={50 * 1024 * 1024} // 50MB
/>
```

### Notas técnicas:

- Preview de PDF puede usar `react-pdf` o `pdfjs`
- OCR puede integrarse con Tesseract.js (cliente) o Google Cloud Vision (servidor)

---

## 7. Métricas y Analytics

| #   | Idea                                | Descripción                                                 | Impacto  |
| --- | ----------------------------------- | ----------------------------------------------------------- | -------- |
| 7.1 | **Dashboard de métricas**           | Vista global de documentos más vistos, feedback, etc.       | 🔴 Alto  |
| 7.2 | **Reportes de uso**                 | Qué usuarios ven qué documentos, tendencias                 | 🔴 Alto  |
| 7.3 | **Alertas de documentos obsoletos** | Notificar cuando un documento no se actualiza hace X tiempo | 🔴 Alto  |
| 7.4 | **Feedback detallado**              | Además de útil/no útil, permitir comentarios de feedback    | 🟡 Medio |
| 7.5 | **Score de calidad**                | Algoritmo que evalúe completitud del documento              | 🟡 Medio |

### Métricas actuales disponibles:

- `viewCount` - Número de visualizaciones
- `helpfulCount` - Feedback positivo
- `notHelpfulCount` - Feedback negativo
- `version` - Número de versión

### Propuesta de dashboard:

```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard Base de Conocimiento                      │
├─────────────────────────────────────────────────────────┤
│  Total Docs: 156  │  Publicados: 142  │  Borradores: 14 │
├─────────────────────────────────────────────────────────┤
│  📈 Top 5 más vistos     │  ⚠️ Necesitan revisión       │
│  1. Guía SSH (2.3k)      │  - Manual VPN (180 días)     │
│  2. Setup Dev (1.8k)     │  - Config DB (120 días)      │
│  3. ...                  │  - ...                       │
├─────────────────────────────────────────────────────────┤
│  👍 Satisfacción: 87%    │  📝 Docs esta semana: 12     │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Permisos y Acceso

| #   | Idea                               | Descripción                                          | Impacto  |
| --- | ---------------------------------- | ---------------------------------------------------- | -------- |
| 8.1 | **Documentos privados**            | Visibles solo para autor o equipos específicos       | 🔴 Alto  |
| 8.2 | **Permisos por tipo de documento** | Solo ciertos roles pueden crear/editar ciertos tipos | 🔴 Alto  |
| 8.3 | **Documentos restringidos**        | Requerir solicitud de acceso para ver                | 🟡 Medio |
| 8.4 | **Auditoría de acceso**            | Log de quién vio/editó cada documento                | 🟡 Medio |

### Permisos actuales:

```typescript
// Del código actual
permissions.canCreateKnowledge;
permissions.canEditKnowledge;
permissions.canDeleteKnowledge;
permissions.canArchiveKnowledge;
permissions.canDuplicateKnowledge;
permissions.canExportKnowledge;
```

### Propuesta de permisos granulares:

```typescript
interface DocumentPermissions {
  visibility: "public" | "internal" | "restricted" | "private";
  allowedRoles?: string[];
  allowedTeams?: string[];
  allowedUsers?: string[];
  requireApproval?: boolean;
}
```

---

## 9. UX/UI General

| #   | Idea                               | Descripción                                                      | Impacto  |
| --- | ---------------------------------- | ---------------------------------------------------------------- | -------- |
| 9.1 | **Modo oscuro mejorado**           | Revisar contraste de colores (algunos tags/badges se ven mal)    | 🟡 Medio |
| 9.2 | **Skeleton loaders**               | Reemplazar spinners por skeletons para mejor percepción de carga | 🟢 Bajo  |
| 9.3 | **Empty states ilustrados**        | Imágenes/ilustraciones en estados vacíos en lugar de solo texto  | 🟢 Bajo  |
| 9.4 | **Tooltips informativos**          | Más tooltips explicativos en iconos y acciones                   | 🟢 Bajo  |
| 9.5 | **Notificaciones toast mejoradas** | Acciones en toasts (ej: "Documento guardado" + botón "Ver")      | 🟡 Medio |
| 9.6 | **Responsive mejorado**            | Revisar experiencia en móvil (el editor puede ser difícil)       | 🔴 Alto  |

### Áreas a revisar en modo oscuro:

- Tags con colores claros sobre fondo oscuro
- Badges de estado (algunos usan `bg-*-100` que no tiene variante dark)
- Bordes sutiles que desaparecen en dark mode

---

## 10. Integraciones

| #    | Idea                       | Descripción                                                | Impacto  |
| ---- | -------------------------- | ---------------------------------------------------------- | -------- |
| 10.1 | **Slack/Teams**            | Compartir documentos directo a canales                     | 🟡 Medio |
| 10.2 | **Integración con casos**  | Crear documento desde un caso con info prellenada          | 🔴 Alto  |
| 10.3 | **Widget embebible**       | Mostrar documentos relevantes en otras partes del sistema  | 🔴 Alto  |
| 10.4 | **API pública**            | Endpoint para consultar documentos desde sistemas externos | 🟡 Medio |
| 10.5 | **Sincronización con Git** | Documentos versionados en repositorio externo              | 🟢 Bajo  |

### Propuesta de widget:

```tsx
// Componente reutilizable para mostrar docs relacionados
<RelatedKnowledgeDocs
  contextType="case"
  contextId={caseId}
  limit={5}
  showPreview={true}
/>
```

---

## 🎯 TOP 10 Recomendaciones Prioritarias

Basado en el análisis del código actual y el impacto en la experiencia de usuario:

| Prioridad | Idea                           | Justificación                                          |
| :-------: | ------------------------------ | ------------------------------------------------------ |
|   **1**   | Favoritos funcional            | El botón ya existe, solo falta implementar. Quick win. |
|   **2**   | Filtros por estado/tipo        | Muy necesario cuando hay muchos documentos             |
|   **3**   | Tabla de contenidos automática | Mejora enorme para documentos largos                   |
|   **4**   | Documentos relacionados        | Aumenta engagement y descubrimiento de contenido       |
|   **5**   | Templates adicionales          | FAQ, Tutorial, Troubleshooting son muy comunes         |
|   **6**   | Dashboard de métricas          | Visibilidad del uso de la KB para admins               |
|   **7**   | Workflow de revisión           | Mejora calidad del contenido publicado                 |
|   **8**   | Bloques callout/warning        | Muy usado en documentación técnica                     |
|   **9**   | Referencias entre documentos   | Interconectar la KB mejora navegación                  |
|  **10**   | Preview rápido en listado      | Reduce navegación innecesaria                          |

---

## 📁 Archivos Principales del Módulo

| Archivo                                                 | Líneas | Descripción                        |
| ------------------------------------------------------- | ------ | ---------------------------------- |
| `frontend/src/pages/KnowledgeBase.tsx`                  | 854    | Listado y búsqueda de documentos   |
| `frontend/src/pages/KnowledgeDocumentView.tsx`          | 761    | Vista de lectura del documento     |
| `frontend/src/pages/KnowledgeDocumentForm.tsx`          | 1667   | Formulario de creación/edición     |
| `frontend/src/components/knowledge/BlockNoteEditor.tsx` | 1039   | Editor de contenido rico           |
| `frontend/src/components/search/SmartSearch.tsx`        | ~500   | Componente de búsqueda inteligente |
| `frontend/src/services/knowledge.service.ts`            | 480    | Servicios de API                   |
| `frontend/src/utils/searchUtils.ts`                     | ~100   | Utilidades de búsqueda             |

---

## 📝 Notas Finales

Este documento sirve como roadmap de mejoras para el módulo de Base de Conocimiento. Las ideas están organizadas por área y priorizadas por impacto.

**Recomendación de implementación:**

1. Comenzar con quick wins (favoritos, filtros básicos)
2. Continuar con mejoras de alto impacto en UX
3. Implementar funcionalidades avanzadas según demanda

---

_Documento generado automáticamente durante revisión de código._
