# Case Management System

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

Andres Salzate - [@andresjgsalzate](https://github.com/andresjgsalzate) - andresjgsalzate@gmail.com

---

**Fecha de última actualización**: Septiembre 2025
**Estado**: ✅ **Producción Ready** - Todos los errores de TypeScript corregidos
