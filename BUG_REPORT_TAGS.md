# 🐛 Bug Report: Etiquetas Incorrectas en Base de Conocimiento

## 📋 **Problema Identificado**

En el módulo de Base de Conocimiento, las etiquetas que se muestran como "Relacionadas" no corresponden a las etiquetas realmente asociadas al documento.

### 🔍 **Síntomas:**

- Un documento muestra etiquetas en la sección "Relacionadas" en la vista de lista
- Al entrar al documento, esas etiquetas no están realmente asociadas
- Inconsistencia entre vista de lista y vista de detalle

## 🎯 **Causa Raíz**

### **Frontend (KnowledgeBase.tsx)**

```typescript
// PROBLEMA: Se muestran etiquetas populares como "relacionadas"
const getRelatedTags = (doc: KnowledgeDocument) => {
  if (!popularTags) return [];

  const documentTagNames = doc.tags?.map((tag) => tag.tagName) || [];

  // BUG: Muestra etiquetas populares que NO están en el documento
  const relatedTags = popularTags
    .filter((tag) => !documentTagNames.includes(tag.tagName))
    .slice(0, 3);

  return relatedTags;
};
```

### **Backend (knowledge-document.service.ts)**

```typescript
// PROBLEMA: createQueryBuilder NO carga etiquetas
private createQueryBuilder(): SelectQueryBuilder<KnowledgeDocument> {
  return this.knowledgeDocumentRepository
    .createQueryBuilder("doc")
    .leftJoinAndSelect("doc.documentType", "type")
    .leftJoinAndSelect("doc.createdByUser", "creator")
    .leftJoinAndSelect("doc.lastEditedByUser", "editor");
    // FALTA: .leftJoinAndSelect para etiquetas
}
```

## 🔧 **Solución Propuesta**

### **1. Corregir Backend - Cargar etiquetas en consulta principal**

```typescript
private createQueryBuilder(): SelectQueryBuilder<KnowledgeDocument> {
  return this.knowledgeDocumentRepository
    .createQueryBuilder("doc")
    .leftJoinAndSelect("doc.documentType", "type")
    .leftJoinAndSelect("doc.createdByUser", "creator")
    .leftJoinAndSelect("doc.lastEditedByUser", "editor")
    // FIX: Agregar join para etiquetas
    .leftJoinAndSelect("doc.tagRelations", "tagRelations")
    .leftJoinAndSelect("tagRelations.tag", "tags");
}
```

### **2. Corregir Frontend - Mostrar solo etiquetas reales**

```typescript
// OPCIÓN A: Eliminar etiquetas "relacionadas" confusas
const getDisplayTags = (doc: KnowledgeDocument) => {
  const docTags = doc.tags || [];
  return {
    documentTags: docTags.slice(0, 4),
    relatedTags: [], // Eliminar etiquetas relacionadas
    totalDocTags: docTags.length,
    showMore: docTags.length > 4,
  };
};

// OPCIÓN B: Cambiar etiquetas "relacionadas" por "sugeridas"
const getSuggestedTags = (doc: KnowledgeDocument) => {
  // Solo sugerir si el documento tiene menos de 2 etiquetas
  if (!doc.tags || doc.tags.length >= 2) return [];

  const documentTagNames = doc.tags.map((tag) => tag.tagName);
  return popularTags
    .filter((tag) => !documentTagNames.includes(tag.tagName))
    .slice(0, 2);
};
```

### **3. Actualizar Vista para Claridad**

```tsx
{
  /* Cambiar "Relacionadas:" por "Sugeridas:" */
}
<span className="text-xs text-gray-400 self-center mr-1">Sugeridas:</span>;
```

## 📝 **Archivos a Modificar**

1. **`backend/src/services/knowledge-document.service.ts`**

   - Método `createQueryBuilder()`: Agregar join para etiquetas
   - Eliminar llamada redundante a `loadDocumentTags()`

2. **`frontend/src/pages/KnowledgeBase.tsx`**
   - Método `getRelatedTags()`: Cambiar lógica o eliminar
   - Método `getDisplayTags()`: Simplificar para mostrar solo etiquetas reales
   - UI: Cambiar texto "Relacionadas:" por "Sugeridas:" si se mantiene

## ⚡ **Beneficios de la Solución**

- ✅ **Consistencia:** Las etiquetas mostradas serán las realmente asociadas
- ✅ **Performance:** Una sola consulta en lugar de N+1 queries
- ✅ **UX:** Usuario no se confundirá con etiquetas falsas
- ✅ **Claridad:** Si se mantienen sugerencias, serán claramente marcadas

## 🧪 **Pruebas Necesarias**

1. Verificar que las etiquetas mostradas en lista coincidan con las del documento
2. Confirmar que la performance no se degrada
3. Validar que los filtros por etiquetas sigan funcionando
4. Probar con documentos sin etiquetas

## 🎯 **Implementación Recomendada**

**Prioridad 1:** Corregir backend para cargar etiquetas correctamente
**Prioridad 2:** Simplificar frontend para mostrar solo etiquetas reales
**Prioridad 3:** Opcional - Agregar sugerencias claras solo cuando sea útil
