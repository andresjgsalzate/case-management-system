# 📋 Sistema de Políticas Automatizadas

## Gestión Inteligente del Ciclo de Vida de Casos y Tareas

---

## 🎯 Concepto General

Un sistema de políticas automatizadas que define reglas de negocio para gestionar automáticamente el ciclo de vida de casos, TODOs, usuarios y otros elementos del sistema. Estas políticas aseguran la limpieza automática, generan alertas proactivas y mantienen el sistema organizado sin intervención manual constante.

---

## 🔧 Arquitectura del Sistema de Políticas

### Componentes Principales

#### 1. **Motor de Políticas**

- **Evaluador de reglas**: Ejecuta políticas en intervalos definidos
- **Scheduler**: Programador de tareas (cron jobs)
- **Sistema de eventos**: Triggers automáticos basados en acciones
- **Logger de auditoría**: Registro de todas las acciones automáticas

#### 2. **Base de Datos de Políticas**

```sql
-- Tabla principal de políticas
CREATE TABLE system_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50), -- 'case', 'todo', 'user', etc.
    rule_type VARCHAR(50), -- 'time_based', 'status_based', 'activity_based'
    conditions JSONB, -- Condiciones de la política
    actions JSONB, -- Acciones a ejecutar
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de ejecuciones de políticas
CREATE TABLE policy_executions (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES system_policies(id),
    executed_at TIMESTAMP DEFAULT NOW(),
    affected_records INTEGER,
    execution_result JSONB,
    status VARCHAR(20) -- 'success', 'error', 'partial'
);
```

#### 3. **Interface de Configuración**

- **Panel de administración**: Para configurar políticas
- **Editor de reglas**: Interface visual para crear condiciones
- **Simulador**: Probar políticas antes de activarlas
- **Dashboard de monitoreo**: Ver ejecuciones y resultados

---

## 📚 Políticas por Categoría

### 🗂️ Políticas de Casos

#### **1. Archivado Automático de Casos Terminados**

```javascript
{
  name: "Archivar casos terminados",
  description: "Archivar automáticamente casos que llevan más de X días en estado 'terminado'",
  entity_type: "case",
  rule_type: "time_based",
  conditions: {
    status: "terminado",
    days_in_status: 30,
    has_pending_todos: false,
    has_recent_activity: false // Sin actividad en los últimos 7 días
  },
  actions: {
    move_to_archive: true,
    notify_assigned_users: true,
    create_audit_log: true,
    notification_template: "El caso #{case_id} ha sido archivado automáticamente"
  },
  schedule: "daily_at_02:00"
}
```

#### **2. Alertas por Casos Inactivos**

```javascript
{
  name: "Alertar casos inactivos sin registro de tiempo",
  description: "Generar alertas para casos activos sin registro de tiempo por X días",
  entity_type: "case",
  rule_type: "activity_based",
  conditions: {
    status: ["activo", "en_progreso", "asignado"],
    days_without_time_entry: 7,
    is_not_paused: true
  },
  actions: {
    notify_assigned_user: true,
    notify_supervisor: true,
    escalate_after_days: 14,
    auto_pause_after_days: 21,
    notification_levels: [
      { days: 7, type: "info", recipients: ["assigned_user"] },
      { days: 14, type: "warning", recipients: ["assigned_user", "supervisor"] },
      { days: 21, type: "critical", recipients: ["assigned_user", "supervisor", "admin"] }
    ]
  },
  schedule: "daily_at_09:00"
}
```

#### **3. Casos Próximos a Vencer**

```javascript
{
  name: "Alertar casos próximos a fecha límite",
  description: "Notificar cuando un caso está cerca de su fecha límite",
  entity_type: "case",
  rule_type: "time_based",
  conditions: {
    has_due_date: true,
    days_until_due: [7, 3, 1], // Alertas en 7, 3 y 1 día antes
    status: ["activo", "en_progreso", "asignado"]
  },
  actions: {
    send_reminder: true,
    escalate_urgency: true,
    notify_stakeholders: true,
    create_urgent_todo: true // Crear TODO urgente 1 día antes
  },
  schedule: "daily_at_08:00"
}
```

#### **4. Casos Huérfanos**

```javascript
{
  name: "Detectar casos sin asignación",
  description: "Identificar casos activos sin usuario asignado",
  entity_type: "case",
  rule_type: "status_based",
  conditions: {
    assigned_user: null,
    status: ["activo", "en_progreso"],
    days_unassigned: 1
  },
  actions: {
    notify_supervisors: true,
    auto_assign_to_queue: true,
    escalate_to_admin: true
  },
  schedule: "every_4_hours"
}
```

### ✅ Políticas de TODOs

#### **1. Limpieza de TODOs Completados**

```javascript
{
  name: "Archivar TODOs completados",
  description: "Mover TODOs completados al archivo después de X días",
  entity_type: "todo",
  rule_type: "time_based",
  conditions: {
    status: "completado",
    days_completed: 45,
    is_archived: false
  },
  actions: {
    move_to_archive: true,
    compress_attachments: true,
    notify_creator: false, // Solo para cleanup silencioso
    maintain_audit_trail: true
  },
  schedule: "weekly_sunday_03:00"
}
```

#### **2. TODOs Vencidos**

```javascript
{
  name: "Gestionar TODOs vencidos",
  description: "Alertar y escalar TODOs que han pasado su fecha límite",
  entity_type: "todo",
  rule_type: "time_based",
  conditions: {
    due_date: "< NOW()",
    status: ["pendiente", "en_progreso"],
    days_overdue: [1, 3, 7, 14]
  },
  actions: {
    change_priority: "urgent",
    notify_assigned_user: true,
    notify_creator: true,
    escalate_to_supervisor: true, // Después de 7 días
    auto_reassign: true, // Después de 14 días
    escalation_rules: [
      { days_overdue: 1, action: "notify_user", priority: "high" },
      { days_overdue: 3, action: "notify_supervisor", priority: "urgent" },
      { days_overdue: 7, action: "escalate", priority: "critical" },
      { days_overdue: 14, action: "reassign", priority: "critical" }
    ]
  },
  schedule: "daily_at_10:00"
}
```

#### **3. TODOs Inactivos**

```javascript
{
  name: "Detectar TODOs sin progreso",
  description: "Identificar TODOs que no han tenido actividad reciente",
  entity_type: "todo",
  rule_type: "activity_based",
  conditions: {
    status: ["en_progreso"],
    days_without_update: 10,
    priority: ["high", "urgent"]
  },
  actions: {
    request_status_update: true,
    notify_assigned_user: true,
    suggest_deadline_extension: true,
    flag_for_review: true
  },
  schedule: "daily_at_11:00"
}
```

### 👥 Políticas de Usuarios

#### **1. Usuarios Inactivos**

```javascript
{
  name: "Gestionar usuarios inactivos",
  description: "Detectar y gestionar usuarios que no han ingresado al sistema",
  entity_type: "user",
  rule_type: "activity_based",
  conditions: {
    days_since_last_login: [30, 60, 90],
    is_active: true,
    role: ["user", "analyst"] // Excluir admins
  },
  actions: {
    send_reactivation_email: true,
    disable_after_days: 90,
    reassign_active_cases: true,
    notify_supervisor: true,
    backup_user_data: true,
    deactivation_workflow: [
      { days: 30, action: "send_reminder" },
      { days: 60, action: "notify_supervisor" },
      { days: 90, action: "disable_account" }
    ]
  },
  schedule: "weekly_monday_01:00"
}
```

#### **2. Carga de Trabajo Excesiva**

```javascript
{
  name: "Detectar sobrecarga de usuarios",
  description: "Identificar usuarios con demasiados casos o TODOs asignados",
  entity_type: "user",
  rule_type: "workload_based",
  conditions: {
    active_cases_count: "> 15",
    pending_todos_count: "> 25",
    overdue_items_count: "> 5"
  },
  actions: {
    notify_user: true,
    notify_supervisor: true,
    suggest_reassignment: true,
    block_new_assignments: true,
    generate_workload_report: true
  },
  schedule: "daily_at_16:00"
}
```

### 📊 Políticas de Sistema

#### **1. Limpieza de Logs**

```javascript
{
  name: "Limpiar logs antiguos",
  description: "Eliminar logs del sistema más antiguos que X días",
  entity_type: "system_log",
  rule_type: "time_based",
  conditions: {
    log_age_days: 90,
    log_level: ["debug", "info"], // Mantener warnings y errors más tiempo
    exclude_error_logs: true
  },
  actions: {
    delete_old_logs: true,
    compress_before_delete: true,
    maintain_summary_stats: true,
    backup_critical_logs: true
  },
  schedule: "monthly_first_sunday_04:00"
}
```

#### **2. Optimización de Base de Datos**

```javascript
{
  name: "Mantenimiento automático de BD",
  description: "Ejecutar tareas de optimización de base de datos",
  entity_type: "database",
  rule_type: "maintenance",
  conditions: {
    table_fragmentation: "> 20%",
    index_usage: "< 80%",
    last_vacuum: "> 7 days"
  },
  actions: {
    reindex_tables: true,
    vacuum_analyze: true,
    update_statistics: true,
    optimize_queries: true,
    generate_performance_report: true
  },
  schedule: "weekly_sunday_05:00"
}
```

### 📁 Políticas de Archivos y Documentos

#### **1. Limpieza de Archivos Temporales**

```javascript
{
  name: "Limpiar archivos temporales",
  description: "Eliminar archivos temporales y uploads no asociados",
  entity_type: "file",
  rule_type: "time_based",
  conditions: {
    file_location: "/uploads/temp/",
    days_old: 7,
    is_referenced: false
  },
  actions: {
    delete_files: true,
    free_disk_space: true,
    log_cleanup_stats: true
  },
  schedule: "daily_at_01:00"
}
```

#### **2. Documentos Huérfanos**

```javascript
{
  name: "Detectar documentos no referenciados",
  description: "Identificar archivos que no están asociados a ningún caso o TODO",
  entity_type: "document",
  rule_type: "reference_based",
  conditions: {
    has_case_reference: false,
    has_todo_reference: false,
    has_knowledge_reference: false,
    days_orphaned: 30
  },
  actions: {
    flag_for_review: true,
    notify_admins: true,
    suggest_deletion: true,
    move_to_quarantine: true
  },
  schedule: "monthly_15th_02:00"
}
```

---

## ⚙️ Motor de Ejecución de Políticas

### Tipos de Triggers

#### **1. Basados en Tiempo (Scheduled)**

```typescript
interface ScheduledPolicy {
  schedule: "daily" | "weekly" | "monthly" | "custom";
  time: string; // "HH:MM" formato 24h
  timezone: string; // "America/Bogota"
  custom_cron?: string; // Para schedules personalizados
}
```

#### **2. Basados en Eventos (Event-Driven)**

```typescript
interface EventDrivenPolicy {
  triggers: [
    "case_status_changed",
    "todo_completed",
    "user_login",
    "file_uploaded",
    "custom_event"
  ];
  immediate: boolean; // Ejecutar inmediatamente o en batch
  debounce_seconds?: number; // Evitar ejecuciones múltiples
}
```

#### **3. Basados en Umbral (Threshold-Based)**

```typescript
interface ThresholdPolicy {
  metric: string; // 'disk_usage', 'active_cases', 'pending_todos'
  threshold_value: number;
  threshold_type: ">" | "<" | "=" | ">=" | "<=";
  check_frequency: string; // Cada cuánto verificar
}
```

### Sistema de Condiciones

#### **Operadores Lógicos**

```javascript
{
  conditions: {
    AND: [
      { status: "terminado" },
      { days_in_status: "> 30" }
    ],
    OR: [
      { priority: "low" },
      { assigned_user: null }
    ],
    NOT: {
      has_pending_todos: true
    }
  }
}
```

#### **Funciones de Fecha**

```javascript
{
  conditions: {
    created_at: "< DATE_SUB(NOW(), INTERVAL 30 DAY)",
    updated_at: "BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW()",
    due_date: "< DATE_ADD(NOW(), INTERVAL 3 DAY)"
  }
}
```

### Sistema de Acciones

#### **Acciones Disponibles**

```typescript
interface PolicyAction {
  // Modificación de datos
  update_status?: string;
  update_priority?: "low" | "medium" | "high" | "urgent";
  assign_to?: string | "auto" | "queue";

  // Notificaciones
  notify_users?: string[];
  notification_template?: string;
  notification_channels?: ["email", "push", "sms"];

  // Archivado y limpieza
  archive?: boolean;
  delete?: boolean;
  backup_before_action?: boolean;

  // Escalación
  escalate_to?: string[];
  create_ticket?: boolean;

  // Flujos de trabajo
  trigger_workflow?: string;
  create_todo?: TodoTemplate;

  // Logs y auditoría
  log_action?: boolean;
  audit_trail?: boolean;

  // Acciones personalizadas
  custom_function?: string;
  webhook_url?: string;
}
```

---

## 🎛️ Interface de Configuración

### Panel de Administración de Políticas

#### **Vista Principal**

```
┌─────────────────────────────────────────────────────┐
│ 📋 Gestión de Políticas                             │
├─────────────────────────────────────────────────────┤
│ [➕ Nueva Política] [📊 Dashboard] [⚙️ Config]       │
├─────────────────────────────────────────────────────┤
│ Política                    Estado    Última Ejec.  │
├─────────────────────────────────────────────────────┤
│ 🗂️ Archivar casos terminados  ✅ Activa  2h ago     │
│ ⚠️ Casos inactivos sin tiempo  ✅ Activa  1h ago     │
│ 📅 Casos próximos a vencer    ✅ Activa  30m ago    │
│ ✅ Limpiar TODOs completados   ⏸️ Pausada 1d ago     │
│ 👥 Usuarios inactivos         ✅ Activa  12h ago    │
├─────────────────────────────────────────────────────┤
│ 📊 Estadísticas: 5 activas, 1 pausada, 0 errores   │
└─────────────────────────────────────────────────────┘
```

#### **Editor de Políticas**

```
┌─────────────────────────────────────────────────────┐
│ ✏️ Editor de Política: Archivar casos terminados    │
├─────────────────────────────────────────────────────┤
│ 📝 Información Básica                               │
│ Nombre: [Archivar casos terminados              ]   │
│ Descripción: [Archivar automáticamente casos...  ]   │
│ Entidad: [Casos ▼]  Tipo: [Basada en tiempo ▼]     │
├─────────────────────────────────────────────────────┤
│ 🔍 Condiciones                                      │
│ ┌─ SI el caso cumple TODAS estas condiciones ─┐    │
│ │ ✅ Estado es "terminado"                     │    │
│ │ ✅ Días en este estado > [30] días           │    │
│ │ ✅ No tiene TODOs pendientes                 │    │
│ │ ✅ Sin actividad reciente (7 días)           │    │
│ └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ ⚡ Acciones                                          │
│ ┌─ ENTONCES ejecutar estas acciones ───────────┐    │
│ │ ✅ Mover a archivo                           │    │
│ │ ✅ Notificar usuarios asignados              │    │
│ │ ✅ Crear log de auditoría                    │    │
│ │ 📧 Plantilla: "Caso #{id} archivado..."     │    │
│ └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ ⏰ Programación                                     │
│ Frecuencia: [Diario ▼] a las [02:00] GMT-5         │
│ Próxima ejecución: Mañana 16/09/2025 02:00         │
├─────────────────────────────────────────────────────┤
│ [🧪 Simular] [💾 Guardar] [❌ Cancelar]             │
└─────────────────────────────────────────────────────┘
```

#### **Simulador de Políticas**

```
┌─────────────────────────────────────────────────────┐
│ 🧪 Simulación: Archivar casos terminados            │
├─────────────────────────────────────────────────────┤
│ 📊 Resultados de la simulación                      │
│                                                     │
│ Casos que serían afectados: 23                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Caso #1234 - Terminado hace 45 días ✅          │ │
│ │ Caso #1235 - Terminado hace 32 días ✅          │ │
│ │ Caso #1236 - Terminado hace 28 días ❌ (< 30)   │ │
│ │ Caso #1237 - Terminado hace 50 días ✅          │ │
│ │ ...y 19 casos más                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Acciones que se ejecutarían:                       │
│ • 23 casos movidos a archivo                       │
│ • 45 notificaciones enviadas                       │
│ • 23 entradas de auditoría creadas                 │
│                                                     │
│ [🔄 Ejecutar Simulación] [✅ Aprobar] [❌ Cancelar] │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard de Monitoreo

### Métricas Principales

```
┌─────────────────────────────────────────────────────┐
│ 📊 Dashboard de Políticas - Últimas 24h             │
├─────────────────────────────────────────────────────┤
│ 🎯 Resumen Ejecutivo                                │
│ • Políticas ejecutadas: 15                         │
│ • Registros procesados: 1,247                      │
│ • Acciones automáticas: 89                         │
│ • Tiempo total ahorrado: ~4.2 horas                │
├─────────────────────────────────────────────────────┤
│ 📈 Políticas Más Activas                            │
│ 1. Casos inactivos sin tiempo (34 alertas)         │
│ 2. TODOs vencidos (28 escalaciones)                │
│ 3. Recordatorios de fecha límite (23 notif.)       │
├─────────────────────────────────────────────────────┤
│ ⚠️ Alertas y Errores                                │
│ • 2 políticas con warnings (ver detalles)          │
│ • 0 errores críticos                               │
│ • 1 política requiere ajustes                      │
├─────────────────────────────────────────────────────┤
│ 🔧 Próximas Ejecuciones                             │
│ • 02:00 - Archivado automático                     │
│ • 08:00 - Recordatorios de fecha límite            │
│ • 09:00 - Casos inactivos                          │
└─────────────────────────────────────────────────────┘
```

---

## 🛡️ Consideraciones de Seguridad y Auditoría

### Sistema de Auditoría

```sql
CREATE TABLE policy_audit_log (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES system_policies(id),
    execution_id INTEGER REFERENCES policy_executions(id),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    action_taken VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    executed_by VARCHAR(50) DEFAULT 'system',
    executed_at TIMESTAMP DEFAULT NOW(),
    reversal_possible BOOLEAN DEFAULT false,
    reversal_data JSONB
);
```

### Controles de Seguridad

- **Aprobación requerida**: Políticas críticas requieren aprobación manual
- **Modo de prueba**: Simular antes de ejecutar en producción
- **Rollback automático**: Capacidad de revertir acciones automáticas
- **Límites de ejecución**: Máximo de registros afectados por ejecución
- **Notificaciones de seguridad**: Alertar sobre políticas que afectan muchos registros

### Permisos de Políticas

```javascript
{
  permissions: {
    "policies.create": ["admin", "supervisor"],
    "policies.edit": ["admin", "supervisor"],
    "policies.delete": ["admin"],
    "policies.execute": ["system", "admin"],
    "policies.simulate": ["admin", "supervisor", "analyst"],
    "policies.view": ["admin", "supervisor", "analyst"]
  }
}
```

---

## 🚀 Plan de Implementación

### Fase 1 - Fundación (3-4 semanas)

- [x] Diseño de base de datos de políticas
- [x] Motor básico de ejecución
- [x] Sistema de programación (cron jobs)
- [x] 3-5 políticas básicas (archivado, alertas)

### Fase 2 - Interface de Usuario (2-3 semanas)

- [ ] Panel de administración
- [ ] Editor de políticas básico
- [ ] Dashboard de monitoreo
- [ ] Sistema de notificaciones

### Fase 3 - Características Avanzadas (3-4 semanas)

- [ ] Editor visual de condiciones
- [ ] Simulador de políticas
- [ ] Sistema de auditoría completo
- [ ] Políticas basadas en eventos

### Fase 4 - Optimización (2-3 semanas)

- [ ] Políticas basadas en ML/IA
- [ ] Optimización de rendimiento
- [ ] APIs para integraciones externas
- [ ] Documentación y training

---

## 💰 Beneficios y ROI

### Ahorro de Tiempo

- **Archivado manual**: 2 horas/semana → 0 minutos (automatizado)
- **Seguimiento de casos**: 3 horas/semana → 30 minutos (alertas automáticas)
- **Limpieza de datos**: 4 horas/mes → 0 minutos (políticas automáticas)
- **Total ahorrado**: ~9.3 horas/semana por administrador

### Mejora en Eficiencia

- **Casos sin seguimiento**: Reducción del 80%
- **TODOs vencidos**: Reducción del 65%
- **Tiempo de respuesta**: Mejora del 40%
- **Calidad de datos**: Mejora del 90%

### Reducción de Errores

- **Casos archivados incorrectamente**: Reducción del 95%
- **Notificaciones perdidas**: Reducción del 90%
- **Sobrecarga de usuarios**: Reducción del 70%

---

## 🎯 Conclusión

El Sistema de Políticas Automatizadas transforma la gestión reactiva en gestión proactiva, asegurando que el sistema se mantenga limpio, organizado y eficiente sin intervención manual constante. Esto no solo ahorra tiempo valioso al equipo, sino que también mejora la calidad de los datos y la experiencia del usuario final.

La implementación de este sistema representa un paso crucial hacia la automatización inteligente y la gestión predictiva del sistema de casos.

---

**Fecha de creación**: 16 de septiembre de 2025  
**Versión del documento**: 1.0  
**Estado**: Propuesta - Pendiente de análisis técnico
