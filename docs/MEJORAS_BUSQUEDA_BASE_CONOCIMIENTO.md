# 🔍 Propuestas de Mejora para la Búsqueda en Base de Conocimiento

> **Fecha:** 23 de diciembre de 2025  
> **Módulo:** Base de Conocimiento - Sistema de Búsqueda  
> **Última actualización:** 23 de diciembre de 2025

---

## 📊 Análisis de la Situación Actual

El sistema de búsqueda actual cuenta con:

| Característica                        | Estado                                  |
| ------------------------------------- | --------------------------------------- |
| Búsqueda con `ILIKE` en PostgreSQL    | ✅ Implementado                         |
| Case insensitive                      | ✅ Implementado                         |
| Ignora acentos/tildes                 | ✅ **Implementado** (usando `unaccent`) |
| Búsqueda en título                    | ✅ Implementado                         |
| Búsqueda en contenido                 | ✅ Implementado                         |
| Búsqueda en etiquetas                 | ✅ Implementado                         |
| Búsqueda en casos asociados           | ✅ Implementado                         |
| Sugerencias inteligentes con debounce | ✅ Implementado                         |
| Filtrado secundario sobre resultados  | ✅ **Implementado** (Fase 2)            |

### ✅ Problema Resuelto (23-dic-2025)

La búsqueda ahora **ES tolerante a acentos** gracias a la extensión `unaccent` de PostgreSQL:

```
"Migracion de Fondos"  → ✅ Encuentra "Migración de Fondos"
"Migraciòn de Fondos"  → ✅ Encuentra "Migración de Fondos"
"Migración de fondos"  → No encuentra "Migracion de Fondos"
```

**El usuario debería poder encontrar el documento sin importar las variaciones en acentuación.**

---

## 🚀 Propuesta 1: Búsqueda Insensible a Acentos

### Opción A: Usando extensión `unaccent` de PostgreSQL (⭐ Recomendada)

#### Paso 1: Crear migración SQL

```sql
-- Archivo: database/migrations/add_unaccent_extension.sql

-- Habilitar la extensión unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Crear una función de búsqueda normalizada para reutilizar
CREATE OR REPLACE FUNCTION normalize_search(text) RETURNS text AS $$
  SELECT lower(unaccent($1));
$$ LANGUAGE SQL IMMUTABLE;

-- Crear índices funcionales para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_knowledge_title_unaccent
  ON knowledge_documents (normalize_search(title));

CREATE INDEX IF NOT EXISTS idx_knowledge_content_unaccent
  ON knowledge_documents (normalize_search(content));

-- Opcional: Índice GIN para búsqueda full-text en español
CREATE INDEX IF NOT EXISTS idx_knowledge_title_gin
  ON knowledge_documents USING gin(to_tsvector('spanish', unaccent(coalesce(title, ''))));

CREATE INDEX IF NOT EXISTS idx_knowledge_content_gin
  ON knowledge_documents USING gin(to_tsvector('spanish', unaccent(coalesce(content, ''))));
```

#### Paso 2: Modificar el servicio de backend

**Archivo:** `backend/src/services/knowledge-document.service.ts`

```typescript
// ANTES (líneas 727-731)
private applyFilters(
  queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
  query: KnowledgeDocumentQueryDto
): void {
  if (query.search) {
    queryBuilder.andWhere(
      "(doc.title ILIKE :search OR doc.content ILIKE :search)",
      { search: `%${query.search}%` }
    );
  }
  // ...
}

// DESPUÉS
private applyFilters(
  queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
  query: KnowledgeDocumentQueryDto
): void {
  if (query.search) {
    // Búsqueda insensible a acentos usando unaccent
    queryBuilder.andWhere(
      `(unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
        OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search)))`,
      { search: `%${query.search}%` }
    );
  }
  // ...
}
```

#### Paso 3: Actualizar también el método `searchContent`

```typescript
// En el método searchContent (línea ~370)
async searchContent(
  searchTerm: string,
  limit: number = 10,
  userId?: string,
  userPermissions?: string[]
): Promise<KnowledgeDocument[]> {
  const queryBuilder = this.knowledgeDocumentRepository
    .createQueryBuilder("doc")
    .leftJoinAndSelect("doc.tags", "tags")
    .leftJoinAndSelect("doc.documentType", "type")
    .leftJoinAndSelect("doc.createdByUser", "creator")
    .andWhere(
      `(
        unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
        OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search))
        OR unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search))
        OR doc."associated_cases"::jsonb @> (:searchTermJson)::jsonb
        OR EXISTS (
          SELECT 1 FROM cases c
          WHERE doc."associated_cases"::jsonb ? c.id::text
          AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:search))
        )
      )`,
      {
        search: `%${searchTerm}%`,
        searchTermJson: JSON.stringify([searchTerm]),
      }
    );
  // ...
}
```

---

### Opción B: Normalización en Frontend + Backend (Alternativa)

Si no es posible usar la extensión `unaccent` en PostgreSQL, se puede implementar normalización en código:

#### Crear utilidad de normalización

**Archivo:** `shared/utils/searchUtils.ts`

```typescript
/**
 * Normaliza texto removiendo acentos y diacríticos
 * @param text - Texto a normalizar
 * @returns Texto sin acentos en minúsculas
 *
 * @example
 * normalizeText("Migración") // "migracion"
 * normalizeText("Niño")      // "nino"
 * normalizeText("Café")      // "cafe"
 */
export const normalizeText = (text: string): string => {
  if (!text) return "";

  return text
    .toLowerCase()
    .normalize("NFD") // Descompone caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas
    .replace(/ñ/g, "n") // Caso especial para ñ
    .trim();
};

/**
 * Verifica si un texto contiene otro (ignorando acentos)
 */
export const containsNormalized = (text: string, search: string): boolean => {
  return normalizeText(text).includes(normalizeText(search));
};

/**
 * Resalta coincidencias en texto (para mostrar resultados)
 */
export const highlightMatch = (text: string, search: string): string => {
  if (!search) return text;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(search);
  const index = normalizedText.indexOf(normalizedSearch);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + search.length);
  const after = text.slice(index + search.length);

  return `${before}<mark>${match}</mark>${after}`;
};
```

---

## 🚀 Propuesta 2: Búsqueda sobre Resultados (Filtrado en Cascada)

### Concepto

Permitir al usuario **refinar** los resultados de búsqueda sin perder el contexto de la búsqueda original. El usuario puede:

1. Hacer una búsqueda inicial: "Migración"
2. Filtrar sobre esos resultados: "Fondos"
3. Seguir refinando: "2024"
4. Deshacer filtros uno por uno o todos a la vez

### Implementación en Frontend

**Archivo:** `frontend/src/pages/KnowledgeBase.tsx`

```tsx
// Nuevos estados para filtrado en cascada
const [resultHistory, setResultHistory] = useState<KnowledgeDocument[][]>([]);
const [activeFilters, setActiveFilters] = useState<string[]>([]);
const [isRefiningSearch, setIsRefiningSearch] = useState(false);

// Función para búsqueda inicial
const handleInitialSearch = async (term: string, filters?: any) => {
  try {
    setIsAdvancedSearch(true);
    setIsRefiningSearch(false);
    const result = await knowledgeApi.documents.enhancedSearch({
      search: term,
      ...filters,
    });
    setSearchResults(result.documents);
    setSearchQuery(term);
    setActiveFilters([term]);
    setResultHistory([]); // Limpiar historial al hacer nueva búsqueda
  } catch (error) {
    showError("Error al realizar la búsqueda");
  }
};

// Función para refinar búsqueda sobre resultados existentes
const handleRefineSearch = (newTerm: string) => {
  if (!searchResults || !newTerm.trim()) return;

  // Guardar estado actual en historial
  setResultHistory((prev) => [...prev, searchResults]);

  // Filtrar resultados actuales
  const filtered = searchResults.filter(
    (doc) =>
      containsNormalized(doc.title, newTerm) ||
      containsNormalized(doc.content || "", newTerm) ||
      doc.tags?.some((tag) => containsNormalized(tag.tagName, newTerm))
  );

  setSearchResults(filtered);
  setActiveFilters((prev) => [...prev, newTerm]);
  setIsRefiningSearch(true);
};

// Función para deshacer último filtro
const handleUndoFilter = () => {
  if (resultHistory.length === 0) return;

  const previousResults = resultHistory[resultHistory.length - 1];
  setSearchResults(previousResults);
  setResultHistory((prev) => prev.slice(0, -1));
  setActiveFilters((prev) => prev.slice(0, -1));

  if (resultHistory.length === 1) {
    setIsRefiningSearch(false);
  }
};

// Función para eliminar un filtro específico
const handleRemoveFilter = (index: number) => {
  if (index === 0) {
    // Si se elimina el primer filtro, limpiar todo
    clearAdvancedSearch();
    return;
  }

  // Reconstruir búsqueda desde el historial
  const newFilters = activeFilters.slice(0, index);
  const targetResults = resultHistory[index - 1] || [];

  setSearchResults(targetResults);
  setActiveFilters(newFilters);
  setResultHistory((prev) => prev.slice(0, index - 1));
};

// Función para limpiar toda la búsqueda
const clearAdvancedSearch = () => {
  setIsAdvancedSearch(false);
  setIsRefiningSearch(false);
  setSearchResults(null);
  setSearchQuery("");
  setActiveFilters([]);
  setResultHistory([]);
};
```

### Componente de Filtros Activos

```tsx
// Componente para mostrar chips de filtros
const ActiveFiltersBar: React.FC<{
  filters: string[];
  onRemove: (index: number) => void;
  onUndo: () => void;
  onClearAll: () => void;
  canUndo: boolean;
}> = ({ filters, onRemove, onUndo, onClearAll, canUndo }) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        Filtros:
      </span>

      {filters.map((filter, index) => (
        <span
          key={index}
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            index === 0
              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
          }`}
        >
          {index === 0 ? "🔍" : "➕"} {filter}
          <button
            onClick={() => onRemove(index)}
            className="ml-2 hover:text-red-600 dark:hover:text-red-400"
            title="Eliminar filtro"
          >
            ×
          </button>
        </span>
      ))}

      <div className="flex gap-2 ml-auto">
        {canUndo && (
          <button
            onClick={onUndo}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            ↩️ Deshacer
          </button>
        )}
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Limpiar todo
        </button>
      </div>
    </div>
  );
};
```

### Modificar SmartSearch para soportar refinamiento

```tsx
// Agregar prop para modo refinamiento
interface SmartSearchProps {
  onSearch: (term: string, filters?: any) => void;
  onRefineSearch?: (term: string) => void; // Nueva prop
  onSelectDocument?: (documentId: string) => void;
  placeholder?: string;
  className?: string;
  isRefining?: boolean; // Nueva prop
}

// En el componente, mostrar indicador de refinamiento
{
  isRefining && (
    <div className="absolute top-0 left-0 right-0 -mt-6 text-xs text-green-600 dark:text-green-400">
      🔍 Buscando dentro de los resultados actuales...
    </div>
  );
}
```

---

## 🚀 Propuesta 3: Mejoras Adicionales de UX

### 3.1 Historial de Búsquedas Recientes

**Archivo:** `frontend/src/hooks/useSearchHistory.ts`

```typescript
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "knowledge-search-history";
const MAX_HISTORY = 10;

interface SearchHistoryItem {
  term: string;
  timestamp: number;
  resultCount?: number;
}

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Cargar historial al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  }, [history]);

  const addToHistory = useCallback((term: string, resultCount?: number) => {
    if (!term.trim()) return;

    setHistory((prev) => {
      // Remover duplicados
      const filtered = prev.filter(
        (item) => item.term.toLowerCase() !== term.toLowerCase()
      );

      // Agregar al inicio
      const newItem: SearchHistoryItem = {
        term: term.trim(),
        timestamp: Date.now(),
        resultCount,
      };

      return [newItem, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const removeFromHistory = useCallback((term: string) => {
    setHistory((prev) => prev.filter((item) => item.term !== term));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};
```

### 3.2 Componente de Historial

```tsx
const SearchHistoryDropdown: React.FC<{
  history: SearchHistoryItem[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}> = ({ history, onSelect, onRemove, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          🕐 Búsquedas recientes
        </span>
        <button
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Limpiar
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={index}
            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer"
            onClick={() => onSelect(item.term)}
          >
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">🔍</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {item.term}
              </span>
              {item.resultCount !== undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  ({item.resultCount} resultados)
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.term);
              }}
              className="text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3.3 Búsqueda por Sinónimos (Opcional Avanzado)

**Archivo:** `shared/data/synonyms.ts`

```typescript
// Diccionario de sinónimos comunes en el dominio
export const DOMAIN_SYNONYMS: Record<string, string[]> = {
  // Términos de migración
  migracion: ["migración", "traslado", "transferencia", "movimiento", "cambio"],
  fondos: ["capital", "recursos", "dinero", "inversión", "activos"],

  // Términos técnicos
  error: ["fallo", "problema", "bug", "incidencia", "issue"],
  configuracion: ["configuración", "ajustes", "setup", "settings"],
  usuario: ["user", "cliente", "operador"],

  // Estados
  activo: ["habilitado", "enabled", "on"],
  inactivo: ["deshabilitado", "disabled", "off"],

  // Acciones
  crear: ["agregar", "añadir", "nuevo", "add"],
  eliminar: ["borrar", "remover", "delete", "quitar"],
  editar: ["modificar", "actualizar", "cambiar", "update"],
};

/**
 * Expande un término de búsqueda incluyendo sinónimos
 */
export const expandSearchTerms = (term: string): string[] => {
  const normalizedTerm = normalizeText(term);
  const terms = new Set<string>([term]);

  for (const [key, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
    const normalizedKey = normalizeText(key);
    const allTerms = [key, ...synonyms];

    // Si el término coincide con alguno del grupo, agregar todos
    if (allTerms.some((t) => normalizeText(t) === normalizedTerm)) {
      allTerms.forEach((t) => terms.add(t));
    }
  }

  return Array.from(terms);
};
```

---

## 🚀 Propuesta 4: Búsqueda Full-Text Avanzada con PostgreSQL

### Configuración de Text Search en Español

```sql
-- Archivo: database/migrations/setup_fulltext_search.sql

-- Crear configuración personalizada para español sin acentos
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS spanish_unaccent (COPY = spanish);

ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;

-- Agregar columna para búsqueda vectorizada
ALTER TABLE knowledge_documents
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Función para actualizar el vector de búsqueda
CREATE OR REPLACE FUNCTION knowledge_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish_unaccent', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish_unaccent', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener actualizado el vector
DROP TRIGGER IF EXISTS knowledge_search_vector_trigger ON knowledge_documents;
CREATE TRIGGER knowledge_search_vector_trigger
  BEFORE INSERT OR UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION knowledge_search_vector_update();

-- Actualizar registros existentes
UPDATE knowledge_documents SET search_vector =
  setweight(to_tsvector('spanish_unaccent', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish_unaccent', coalesce(content, '')), 'B');

-- Índice GIN para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_knowledge_search_vector
  ON knowledge_documents USING gin(search_vector);
```

### Uso en el Backend

```typescript
// Búsqueda full-text con ranking
async fullTextSearch(
  searchTerm: string,
  limit: number = 20
): Promise<{ document: KnowledgeDocument; rank: number }[]> {
  const results = await this.knowledgeDocumentRepository.query(`
    SELECT
      d.*,
      ts_rank(d.search_vector, plainto_tsquery('spanish_unaccent', $1)) as rank
    FROM knowledge_documents d
    WHERE d.search_vector @@ plainto_tsquery('spanish_unaccent', $1)
      AND d.is_archived = false
    ORDER BY rank DESC
    LIMIT $2
  `, [searchTerm, limit]);

  return results;
}
```

---

## 📋 Plan de Implementación

### ✅ Fase 1: Búsqueda Insensible a Acentos (COMPLETADA - 23-dic-2025)

| Paso | Tarea                                        | Estado        |
| ---- | -------------------------------------------- | ------------- |
| 1.1  | Crear migración SQL con extensión `unaccent` | ✅ Completado |
| 1.2  | Ejecutar migración en producción             | ✅ Completado |
| 1.3  | Modificar `applyFilters` en backend          | ✅ Completado |
| 1.4  | Modificar `searchContent` en backend         | ✅ Completado |
| 1.5  | Modificar `getSearchSuggestions` en backend  | ✅ Completado |
| 1.6  | Testing de búsqueda con acentos              | ✅ Completado |
| 1.7  | Despliegue a producción                      | ✅ Completado |

**Archivo de migración:** `database/migrations/add_unaccent_extension.sql`

### ✅ Fase 2: Filtrado sobre Resultados (COMPLETADA - 23-dic-2025)

| Paso | Tarea                                     | Estado        |
| ---- | ----------------------------------------- | ------------- |
| 2.1  | Crear utilidad `searchUtils.ts`           | ✅ Completado |
| 2.2  | Agregar estados en `KnowledgeBase.tsx`    | ✅ Completado |
| 2.3  | Implementar funciones de filtrado         | ✅ Completado |
| 2.4  | Crear componente `ActiveFiltersBar`       | ✅ Completado |
| 2.5  | Modificar `SmartSearch` para refinamiento | ✅ Completado |
| 2.6  | Testing de UX                             | 🔄 Pendiente  |

**Archivos creados/modificados:**

- `frontend/src/utils/searchUtils.ts` - Utilidades de normalización de texto
- `frontend/src/components/search/ActiveFiltersBar.tsx` - Chips de filtros activos
- `frontend/src/pages/KnowledgeBase.tsx` - Estados y funciones de refinamiento
- `frontend/src/components/search/SmartSearch.tsx` - Soporte modo refinamiento

### Fase 3: Mejoras de UX (Prioridad Media) ⬅️ SIGUIENTE

| Paso | Tarea                             | Tiempo Estimado |
| ---- | --------------------------------- | --------------- |
| 3.1  | Implementar `useSearchHistory`    | 1 hora          |
| 3.2  | Crear `SearchHistoryDropdown`     | 1 hora          |
| 3.3  | Integrar historial en SmartSearch | 30 min          |

**Total Fase 3:** ~2.5 horas

### Fase 4: Full-Text Search (Prioridad Baja)

| Paso | Tarea                               | Tiempo Estimado |
| ---- | ----------------------------------- | --------------- |
| 4.1  | Crear migración full-text           | 1 hora          |
| 4.2  | Implementar método `fullTextSearch` | 1 hora          |
| 4.3  | Agregar endpoint en API             | 30 min          |
| 4.4  | Testing y optimización              | 2 horas         |

**Total Fase 4:** ~4.5 horas

---

## 📊 Resumen Ejecutivo

| Propuesta                       | Complejidad | Impacto en UX | Prioridad |
| ------------------------------- | ----------- | ------------- | --------- |
| Búsqueda insensible a acentos   | ⭐⭐ Media  | 🔥🔥🔥 Alto   | 🔴 Alta   |
| Filtrado sobre resultados       | ⭐⭐ Media  | 🔥🔥🔥 Alto   | 🔴 Alta   |
| Historial de búsquedas          | ⭐ Baja     | 🔥🔥 Medio    | 🟡 Media  |
| Chips de filtros activos        | ⭐ Baja     | 🔥🔥 Medio    | 🟡 Media  |
| Sinónimos/términos relacionados | ⭐⭐⭐ Alta | 🔥🔥 Medio    | 🟢 Baja   |
| Full-text search avanzado       | ⭐⭐⭐ Alta | 🔥🔥🔥 Alto   | 🟢 Baja   |

---

## ✅ Siguientes Pasos Recomendados

1. **Inmediato:** Implementar extensión `unaccent` en PostgreSQL
2. **Corto plazo:** Implementar filtrado sobre resultados
3. **Mediano plazo:** Agregar historial de búsquedas
4. **Largo plazo:** Evaluar full-text search según volumen de datos

---

_Documento generado para el proyecto Case Management System_
