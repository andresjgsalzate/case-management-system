# 📚 Manual de Usuario: Búsqueda en Base de Conocimiento

## Introducción

La Base de Conocimiento te permite buscar y encontrar documentos de forma rápida e inteligente. Este manual te explica cómo aprovechar al máximo las funcionalidades de búsqueda.

---

## 🔍 Búsqueda Básica

### ¿Cómo buscar?

1. Escribe tu búsqueda en el campo de texto
2. Los resultados aparecerán automáticamente mientras escribes
3. No necesitas preocuparte por mayúsculas, minúsculas o acentos

### Ejemplos de búsqueda:

| Escribes           | También encuentra                     |
| ------------------ | ------------------------------------- |
| `configuracion`    | configuración, CONFIGURACIÓN          |
| `análisis`         | analisis, ANÁLISIS                    |
| `error base datos` | error base de datos, Error Base Datos |

> 💡 **Tip:** La búsqueda ignora acentos automáticamente, así que puedes escribir como te resulte más cómodo.

---

## 🎯 Indicador de Relevancia

Cada resultado muestra qué tan relevante es para tu búsqueda:

### Porcentaje de Relevancia (0-100%)

El porcentaje indica qué tan bien coincide el documento con tu búsqueda:

| Porcentaje     | Significado                            |
| -------------- | -------------------------------------- |
| 🟢 **80-100%** | Muy relevante - Coincidencia excelente |
| 🟡 **50-79%**  | Relevante - Buena coincidencia         |
| 🟠 **30-49%**  | Parcialmente relevante                 |
| 🔴 **0-29%**   | Baja relevancia                        |

### Ubicaciones de Coincidencia (T / C / E)

Verás indicadores que muestran **dónde** se encontraron tus palabras:

| Indicador | Significado                                      | Importancia |
| --------- | ------------------------------------------------ | ----------- |
| **T** ✓   | **Título** - La palabra está en el título        | ⭐⭐⭐ Alta |
| **C** ✓   | **Contenido** - La palabra está en el contenido  | ⭐⭐ Media  |
| **E** ✓   | **Etiquetas** - La palabra está en las etiquetas | ⭐ Normal   |

### Ejemplo Visual:

```
┌─────────────────────────────────────────────────┐
│ 📄 Configuración de Base de Datos              │
│                                                 │
│ [85%] 2/3 palabras  |  T✓  C✓  E              │
│       └─────────────────┘  └───────────────┘   │
│       Relevancia           Ubicaciones         │
└─────────────────────────────────────────────────┘
```

Este ejemplo muestra:

- **85%** de relevancia
- **2 de 3** palabras de búsqueda encontradas
- Coincidencias en **Título** (T✓) y **Contenido** (C✓)

---

## 🏷️ Filtros Inteligentes (Cascada)

### ¿Qué son los filtros en cascada?

Los filtros se actualizan automáticamente según tu búsqueda, mostrando solo las opciones que tienen resultados.

### Filtros disponibles:

| Filtro                | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **Tipo de documento** | Filtra por categoría (Manual, Procedimiento, etc.) |
| **Etiquetas**         | Filtra por etiquetas asignadas                     |
| **Autor**             | Filtra por quien creó el documento                 |
| **Estado**            | Publicado, Borrador, Archivado                     |

### ¿Cómo funcionan?

1. **Escribe tu búsqueda** → Los filtros muestran solo opciones relevantes
2. **Selecciona un filtro** → Los demás filtros se ajustan
3. **Los números entre paréntesis** indican cuántos documentos hay en cada opción

### Ejemplo:

```
Búsqueda: "error conexión"

Tipo de documento:
  ☐ Manual técnico (3)
  ☐ Procedimiento (5)
  ☐ FAQ (2)

Etiquetas sugeridas:
  ☐ base-datos (4)
  ☐ red (3)
  ☐ configuración (2)
```

> 💡 **Tip:** Si un filtro no aparece, significa que no hay documentos con esa característica para tu búsqueda actual.

---

## 📝 Frase Exacta

Cuando buscas varias palabras juntas como una frase, el sistema detecta si aparecen consecutivamente:

| Badge               | Significado                             |
| ------------------- | --------------------------------------- |
| 🎯 **Frase exacta** | Tus palabras aparecen juntas y en orden |

**Ejemplo:**

- Búsqueda: `error de conexión`
- Si el documento contiene exactamente "error de conexión", verás el badge de frase exacta
- Esto indica mayor relevancia

---

## 💡 Tips para Mejores Búsquedas

### ✅ Recomendado:

1. **Usa palabras clave específicas**

   - ✅ `configurar servidor correo`
   - ❌ `cómo puedo configurar el servidor de correo`

2. **Combina filtros con búsqueda**

   - Busca "error" + Filtro tipo: "FAQ" = FAQs sobre errores

3. **Revisa los indicadores de ubicación**
   - Si solo coincide en etiquetas (E), el documento podría ser menos específico

### ⚠️ Ten en cuenta:

- Los resultados se ordenan por **relevancia** (más relevantes primero)
- Los documentos **publicados** de otros usuarios también aparecen
- Tus **borradores** solo los ves tú

---

## 🔄 Limpiar Búsqueda

Para empezar una nueva búsqueda:

1. Borra el texto del campo de búsqueda
2. O haz clic en la **X** para limpiar
3. Los filtros activos se pueden quitar haciendo clic en ellos

---

## 📊 Resumen de Iconos

| Icono | Significado             |
| ----- | ----------------------- |
| 🟢    | Alta relevancia         |
| 🟡    | Relevancia media        |
| 🟠    | Relevancia baja         |
| ✓     | Coincidencia encontrada |
| T     | Título                  |
| C     | Contenido               |
| E     | Etiquetas               |
| 🎯    | Frase exacta encontrada |

---

## ❓ Preguntas Frecuentes

### ¿Por qué no encuentro un documento que sé que existe?

- Verifica que el documento esté **publicado**
- Prueba con sinónimos o palabras diferentes
- Revisa si tienes filtros activos que lo excluyan

### ¿Por qué algunos filtros no muestran opciones?

- Los filtros en cascada solo muestran opciones con resultados
- Si no hay documentos que cumplan el criterio, la opción no aparece

### ¿Puedo buscar por número de caso asociado?

- Sí, escribe el número de caso en el campo de búsqueda
- Los documentos vinculados a ese caso aparecerán

---

_Última actualización: Diciembre 2025_
