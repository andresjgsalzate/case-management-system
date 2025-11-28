# Case Management System v1.1.0

Sistema completo de gestión de casos con backend en Node.js/TypeScript y frontend en React/TypeScript.

## 🚀 Estado del Proyecto

### ✅ **Funcionalidades Implementadas**

- **Dashboard**: Métricas en tiempo real con datos reales de la base de datos
- **Gestión de Casos**: CRUD completo con control de estados y asignación
- **Sistema de Permisos**: Autenticación JWT y control de acceso basado en roles
- **Disposiciones**: Gestión completa de disposiciones mensuales
- **TODOs**: Sistema de tareas con prioridades y seguimiento
- **Control de Tiempo**: Registro manual y automático de tiempo por caso
- **Notas**: Sistema de anotaciones por caso
- **Roles y Usuarios**: Administración completa de usuarios y permisos
- **🆕 Sistema de Equipos**: Gestión completa de equipos de trabajo con roles y permisos granulares
- **🆕 Sistema de Auditoría Completo**: Trazabilidad total de todas las operaciones del sistema

### � **Sistema de Equipos v1.1.0** _(NUEVO)_

#### **Gestión Completa de Equipos**

- ✅ **9 Equipos Predefinidos**: DEV, SUPP, INFRA, QA, BA, PM, ARCH, SEC, UNASSIGN
- ✅ **Roles de Equipo**: Manager, Lead, Member con permisos específicos
- ✅ **Membresía Dinámica**: Asignación y remoción de miembros en tiempo real
- ✅ **Colores y Códigos**: Identificación visual única por equipo
- ✅ **Estadísticas**: Métricas y reportes por equipo

#### **API RESTful Completa**

- **CRUD de Equipos**: Crear, leer, actualizar, eliminar equipos
- **Gestión de Miembros**: Asignar/remover usuarios, cambiar roles
- **Operaciones Masivas**: Asignación múltiple de miembros
- **Transferencia de Liderazgo**: Cambio de managers
- **Consultas Avanzadas**: Filtros, búsqueda, paginación

#### **Sistema de Permisos Granular**

- **15 Permisos Específicos**: Desde `equipos.ver.own` hasta `equipos.reportes.all`
- **3 Niveles de Scope**: own (propios), team (equipo), all (todos)
- **Integración con Middleware**: Autorización automática en todos los endpoints

#### **Documentación API**: Ver [TEAMS_SYSTEM_API.md](./TEAMS_SYSTEM_API.md)

### �🔍 **Sistema de Auditoría v1.1.0** _(NUEVO)_

#### **Cobertura Completa de Módulos**

- ✅ **Base de Conocimiento**: Documentos, tags y tipos de documento
- ✅ **Administración**: Usuarios, roles, permisos, aplicaciones, orígenes
- ✅ **Archivos y Reportes**: Descargas, visualizaciones y acceso a métricas
- ✅ **Casos y TODOs**: Operaciones principales del sistema
- ✅ **Tiempo y Notas**: Seguimiento de actividades

#### **Acciones Auditadas**

- **CREATE**: Creación de registros
- **UPDATE**: Modificaciones de datos
- **DELETE**: Eliminación de registros
- **READ**: Acceso a información sensible
- **DOWNLOAD**: Descargas de archivos
- **VIEW**: Visualización de documentos
- **EXPORT**: Exportación de datos
- **ARCHIVE/RESTORE**: Archivado y restauración

#### **Información Capturada**

- **Usuario**: ID, email, nombre, rol
- **Operación**: Acción, módulo, entidad afectada
- **Contexto**: IP, navegador, sesión, ruta
- **Cambios**: Valores anteriores y nuevos
- **Timestamp**: Fecha y hora exacta
- **Estado**: Éxito o fallo de la operación

#### **Características Avanzadas**

- **Detección Automática**: Identificación inteligente de módulos
- **Campos Sensibles**: Protección de información confidencial
- **Contexto Enriquecido**: Información detallada de cada operación
- **Middleware Universal**: Captura automática en todas las rutas
- **Interfaz Frontend**: Visualización completa de logs de auditoría

### 🛠 **Tecnologías**

- **Backend**: Node.js, TypeScript, TypeORM, PostgreSQL, Express
- **Frontend**: React 18, TypeScript, TailwindCSS, React Query, React Hook Form
- **Base de Datos**: PostgreSQL con migraciones automáticas
- **Autenticación**: JWT con refresh tokens
- **Validación**: Zod para validaciones de esquemas

## 📁 Estructura del Proyecto

```
case-management-system/
├── backend/                 # API Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── controllers/     # Controladores de API
│   │   ├── entities/        # Entidades de TypeORM
│   │   ├── middleware/      # Middlewares (auth, error handling)
│   │   ├── routes/          # Definición de rutas
│   │   ├── services/        # Lógica de negocio
│   │   └── utils/           # Utilidades
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/      # Componentes React reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── contexts/        # Contextos React (Auth, Theme)
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── services/        # APIs y servicios externos
│   │   └── types/           # Definiciones de tipos
│   ├── package.json
│   └── tsconfig.json
├── database/                # Scripts de migración SQL
├── shared/                  # Código compartido
└── docs/                    # Documentación técnica
```

## 🚦 Instalación y Configuración

### Pre-requisitos

- Node.js (v18+)
- PostgreSQL (v13+)
- npm o yarn

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npm run dev           # Modo desarrollo
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Modo desarrollo
```

### 3. Base de Datos

```sql
-- Crear base de datos en PostgreSQL
CREATE DATABASE case_management;
```

Configurar variables de entorno en `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=case_management
JWT_SECRET=tu_jwt_secret
```

## 📊 Métricas del Dashboard

El dashboard muestra métricas en tiempo real incluyendo:

- **Métricas de Estado**: Casos por estado actual
- **Métricas de Complejidad**: Distribución por complejidad (Baja/Media/Alta)
- **Métricas de Tiempo**: Tiempo promedio por caso y por aplicación
- **Métricas de Aplicaciones**: Casos por aplicación
- **Métricas de Usuario**: Tiempo trabajado por usuario

## 🔐 Sistema de Permisos

Implementación completa de control de acceso basado en:

- **Roles**: Admin, Usuario, Supervisor
- **Permisos granulares**: Por módulo, acción y scope (all/own/team)
- **Middleware de autenticación**: JWT con validación en cada request
- **Control de UI**: Componentes condicionalmente renderizados según permisos

## 🏗 Arquitectura

### Backend (Node.js + TypeScript)

- **Patrón MVC**: Separación clara entre controladores, servicios y datos
- **TypeORM**: ORM para PostgreSQL con migraciones automáticas
- **Middleware**: Autenticación, manejo de errores, logging
- **Validación**: Validación de datos de entrada con esquemas

### Frontend (React + TypeScript)

- **Componentes funcionales**: Hooks para gestión de estado
- **React Query**: Cache y sincronización de datos del servidor
- **Context API**: Gestión de estado global (auth, theme)
- **TailwindCSS**: Diseño responsive y consistente

## 📝 Scripts Disponibles

### Backend

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Compilar TypeScript
npm run start    # Producción
npm run test     # Ejecutar tests
```

### Frontend

```bash
npm run dev      # Desarrollo con Vite
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linting con ESLint
```

## 🧪 Estado de Testing

- ✅ **Backend**: Compilación sin errores TypeScript
- ✅ **Frontend**: Compilación sin errores TypeScript
- ✅ **API**: Endpoints principales testeados
- ✅ **Dashboard**: Métricas funcionando con datos reales

## 📈 Próximas Mejoras

- [ ] Tests unitarios completos
- [ ] Documentación API con Swagger
- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes
- [ ] Integración con sistemas externos

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

Andres Jurgensen Alzate - [@andresjgsalzate](https://github.com/andresjgsalzate) - andresjgsalzate@gmail.com

---

**Fecha de última actualización**: Septiembre 2025
**Estado**: ✅ **Producción Ready** - Todos los errores de TypeScript corregidos
