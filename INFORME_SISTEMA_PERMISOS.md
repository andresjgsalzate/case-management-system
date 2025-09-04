# INFORME: SISTEMA DE PERMISOS Y ROLES

## Migración desde Sistema Antiguo a Nueva Arquitectura

### FECHA: 29 de Agosto de 2025

### VERSIÓN: 1.0

---

## 📋 RESUMEN EJECUTIVO

Este informe analiza el sistema de permisos y roles del Sistema Antiguo y propone una implementación adaptada para la nueva arquitectura basada en **Frontend (React)**, **Backend (Express.js + TypeORM)** y **Base de Datos (PostgreSQL)**.

### Características del Sistema Antiguo:

- **Framework**: Supabase con Row Level Security (RLS)
- **Arquitectura**: Cliente directo a base de datos
- **Seguridad**: Políticas RLS + Funciones PostgreSQL
- **Gestión**: RBAC (Role-Based Access Control) granular

### Propuesta para el Sistema Nuevo:

- **Framework**: Express.js + TypeORM + JWT
- **Arquitectura**: Cliente → API → Base de Datos
- **Seguridad**: Middleware de autenticación + Decoradores
- **Gestión**: RBAC con middleware personalizado

---

## 🏗️ ARQUITECTURA DEL SISTEMA ANTIGUO

### 1. ESTRUCTURA DE BASE DE DATOS

#### Tablas Core:

```sql
-- Roles del sistema
roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Permisos granulares
permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  description TEXT,
  resource VARCHAR(50),  -- 'cases', 'todos', 'dispositions', etc.
  action VARCHAR(20),    -- 'read', 'create', 'update', 'delete'
  scope VARCHAR(10),     -- 'own', 'team', 'all'
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Relación roles-permisos
role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  created_at TIMESTAMP
)

-- Usuarios con rol asignado
user_profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Roles Predefinidos:

1. **Administrador**: Acceso completo al sistema
2. **Supervisor**: Supervisión de equipos y casos
3. **Técnico**: Gestión de casos asignados
4. **Invitado**: Solo lectura de información básica

### 2. SISTEMA DE PERMISOS GRANULAR

#### Estructura de Permisos:

```
[recurso].[acción]_[alcance]

Ejemplos:
- cases.read_own      (Ver casos propios)
- cases.read_team     (Ver casos del equipo)
- cases.read_all      (Ver todos los casos)
- cases.create_own    (Crear casos propios)
- cases.update_team   (Actualizar casos del equipo)
- todos.assign        (Asignar TODOs)
- dispositions.delete_all (Eliminar cualquier disposición)
```

#### Recursos del Sistema:

- **cases**: Gestión de casos
- **todos**: Gestión de tareas
- **time_entries**: Control de tiempo
- **dispositions**: Gestión de disposiciones de scripts
- **notes**: Gestión de notas
- **users**: Gestión de usuarios
- **reports**: Generación de reportes
- **dashboard**: Acceso al dashboard
- **archive**: Gestión de archivo
- **search**: Búsquedas en el sistema

#### Acciones Disponibles:

- **read**: Lectura de datos
- **create**: Creación de nuevos elementos
- **update**: Actualización de elementos
- **delete**: Eliminación de elementos
- **assign**: Asignación a usuarios
- **archive**: Archivado de elementos
- **restore**: Restauración de elementos
- **escalate**: Escalación de casos

#### Alcances (Scopes):

- **own**: Solo elementos propios del usuario
- **team**: Elementos del equipo/departamento
- **all**: Todos los elementos del sistema

### 3. FUNCIONES DE SEGURIDAD

#### Funciones PostgreSQL Clave:

```sql
-- Verificar si un usuario tiene un permiso específico
has_permission(user_id UUID, permission_name TEXT) RETURNS BOOLEAN

-- Obtener el rol de un usuario
get_user_role(user_id UUID) RETURNS TEXT

-- Verificar si el usuario puede acceder a un recurso
can_access_resource(user_id UUID, resource_id UUID, action TEXT) RETURNS BOOLEAN

-- Obtener permisos de un usuario
get_user_permissions(user_id UUID) RETURNS TABLE(permission_name TEXT)
```

---

## 🚀 PROPUESTA PARA EL SISTEMA NUEVO

### 1. ARQUITECTURA DE BASE DE DATOS

#### Entidades TypeORM:

```typescript
// entities/Role.ts
@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 50 })
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// entities/Permission.ts
@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ length: 20 })
  action: string;

  @Column({ length: 10, nullable: true })
  scope: "own" | "team" | "all";

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission
  )
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// entities/RolePermission.ts
@Entity("role_permissions")
export class RolePermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  roleId: string;

  @Column("uuid")
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions)
  @JoinColumn({ name: "roleId" })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: "permissionId" })
  permission: Permission;

  @CreateDateColumn()
  createdAt: Date;
}

// Actualizar entities/User.ts
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column()
  password: string;

  @Column("uuid", { nullable: true })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: "roleId" })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  // ... otros campos existentes
}
```

### 2. SERVICIOS DE BACKEND

#### PermissionService:

```typescript
// services/PermissionService.ts
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>
  ) {}

  // Verificar si un usuario tiene un permiso específico
  async hasPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        "role",
        "role.rolePermissions",
        "role.rolePermissions.permission",
      ],
    });

    if (!user || !user.role || !user.isActive) return false;

    return user.role.rolePermissions.some(
      (rp) => rp.permission.name === permissionName && rp.permission.isActive
    );
  }

  // Obtener todos los permisos de un usuario
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        "role",
        "role.rolePermissions",
        "role.rolePermissions.permission",
      ],
    });

    if (!user || !user.role) return [];

    return user.role.rolePermissions
      .filter((rp) => rp.permission.isActive)
      .map((rp) => rp.permission);
  }

  // Verificar acceso a recurso con alcance
  async canAccessResource(
    userId: string,
    resource: string,
    action: string,
    resourceOwnerId?: string,
    teamId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // Buscar permisos que coincidan con el recurso y acción
    const relevantPermissions = permissions.filter(
      (p) => p.resource === resource && p.action === action
    );

    for (const permission of relevantPermissions) {
      switch (permission.scope) {
        case "all":
          return true;
        case "team":
          // Verificar si pertenece al mismo equipo
          if (teamId) {
            return await this.isInSameTeam(userId, teamId);
          }
          return true; // Por ahora, simplificado
        case "own":
          return resourceOwnerId === userId;
      }
    }

    return false;
  }

  // Crear permiso
  async createPermission(data: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(data);
    return await this.permissionRepository.save(permission);
  }

  // Asignar permiso a rol
  async assignPermissionToRole(
    roleId: string,
    permissionId: string
  ): Promise<void> {
    const rolePermission = this.rolePermissionRepository.create({
      roleId,
      permissionId,
    });
    await this.rolePermissionRepository.save(rolePermission);
  }

  // Obtener permisos agrupados por recurso
  async getPermissionsGroupedByResource(): Promise<
    Record<string, Permission[]>
  > {
    const permissions = await this.permissionRepository.find({
      where: { isActive: true },
      order: { resource: "ASC", action: "ASC" },
    });

    return permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }
}
```

#### RoleService:

```typescript
// services/RoleService.ts
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>
  ) {}

  // Obtener todos los roles
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { isActive: true },
      relations: ["rolePermissions", "rolePermissions.permission"],
      order: { name: "ASC" },
    });
  }

  // Obtener rol por ID con permisos
  async getRoleById(id: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { id },
      relations: ["rolePermissions", "rolePermissions.permission"],
    });
  }

  // Crear nuevo rol
  async createRole(data: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(data);
    return await this.roleRepository.save(role);
  }

  // Actualizar permisos de un rol
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    // Eliminar permisos existentes
    await this.rolePermissionRepository.delete({ roleId });

    // Agregar nuevos permisos
    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({ roleId, permissionId })
    );

    await this.rolePermissionRepository.save(rolePermissions);
  }
}
```

### 3. MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN

#### Auth Middleware:

```typescript
// middleware/auth.middleware.ts
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private permissionService: PermissionService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw new UnauthorizedException("Token no proporcionado");
      }

      const payload = await this.jwtService.verifyAsync(token);
      req["user"] = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException("Token inválido");
    }
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
```

#### Permission Decorators:

```typescript
// decorators/permissions.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireResource = (
  resource: string,
  action: string,
  scope?: string
) => SetMetadata("resource_permission", { resource, action, scope });
```

#### Permission Guard:

```typescript
// guards/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!permissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Verificar si el usuario tiene alguno de los permisos requeridos
    for (const permission of permissions) {
      const hasPermission = await this.permissionService.hasPermission(
        user.userId,
        permission
      );
      if (hasPermission) return true;
    }

    return false;
  }
}
```

### 4. CONTROLADORES CON PERMISOS

#### Ejemplo de Controlador con Permisos:

```typescript
// controllers/disposition.controller.ts
@Controller("dispositions")
@UseGuards(AuthGuard, PermissionGuard)
export class DispositionController {
  constructor(private dispositionService: DispositionService) {}

  @Get()
  @RequirePermission(
    "dispositions.read_own",
    "dispositions.read_team",
    "dispositions.read_all"
  )
  async getAllDispositions(@Req() req: Request) {
    const userId = req["user"].userId;
    return await this.dispositionService.getDispositionsForUser(userId);
  }

  @Post()
  @RequirePermission(
    "dispositions.create_own",
    "dispositions.create_team",
    "dispositions.create_all"
  )
  async createDisposition(
    @Body() data: CreateDispositionDto,
    @Req() req: Request
  ) {
    const userId = req["user"].userId;
    return await this.dispositionService.createDisposition(data, userId);
  }

  @Put(":id")
  @RequireResource("dispositions", "update")
  async updateDisposition(
    @Param("id") id: string,
    @Body() data: UpdateDispositionDto,
    @Req() req: Request
  ) {
    const userId = req["user"].userId;

    // Verificar permisos específicos según el alcance
    const canUpdate = await this.permissionService.canAccessResource(
      userId,
      "dispositions",
      "update",
      await this.getDispositionOwnerId(id)
    );

    if (!canUpdate) {
      throw new ForbiddenException(
        "No tienes permisos para actualizar esta disposición"
      );
    }

    return await this.dispositionService.updateDisposition(id, data);
  }

  @Delete(":id")
  @RequirePermission(
    "dispositions.delete_own",
    "dispositions.delete_team",
    "dispositions.delete_all"
  )
  async deleteDisposition(@Param("id") id: string, @Req() req: Request) {
    const userId = req["user"].userId;

    const canDelete = await this.permissionService.canAccessResource(
      userId,
      "dispositions",
      "delete",
      await this.getDispositionOwnerId(id)
    );

    if (!canDelete) {
      throw new ForbiddenException(
        "No tienes permisos para eliminar esta disposición"
      );
    }

    return await this.dispositionService.deleteDisposition(id);
  }

  private async getDispositionOwnerId(dispositionId: string): Promise<string> {
    const disposition = await this.dispositionService.findById(dispositionId);
    return disposition?.userId;
  }
}
```

### 5. FRONTEND - HOOKS Y SERVICIOS

#### AuthContext con Permisos:

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  canAccessResource: (
    resource: string,
    action: string,
    ownerId?: string
  ) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return permissions.some((p) => p.name === permission);
    },
    [permissions]
  );

  const canAccessResource = useCallback(
    (resource: string, action: string, ownerId?: string): boolean => {
      const resourcePermissions = permissions.filter(
        (p) => p.resource === resource && p.action === action
      );

      return resourcePermissions.some((p) => {
        switch (p.scope) {
          case "all":
            return true;
          case "team":
            return true; // Simplificado por ahora
          case "own":
            return !ownerId || ownerId === user?.id;
          default:
            return false;
        }
      });
    },
    [permissions, user]
  );

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setPermissions(response.permissions);
    localStorage.setItem("token", response.token);
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        hasPermission,
        canAccessResource,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

#### Hook de Permisos:

```typescript
// hooks/usePermissions.ts
export const usePermissions = () => {
  const { hasPermission, canAccessResource } = useAuth();

  const canRead = (resource: string, ownerId?: string) =>
    canAccessResource(resource, "read", ownerId);

  const canCreate = (resource: string) => canAccessResource(resource, "create");

  const canUpdate = (resource: string, ownerId?: string) =>
    canAccessResource(resource, "update", ownerId);

  const canDelete = (resource: string, ownerId?: string) =>
    canAccessResource(resource, "delete", ownerId);

  return {
    hasPermission,
    canAccessResource,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
  };
};
```

#### Componente de Protección:

```typescript
// components/ProtectedComponent.tsx
interface ProtectedComponentProps {
  permission?: string;
  resource?: string;
  action?: string;
  ownerId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  permission,
  resource,
  action,
  ownerId,
  fallback = null,
  children,
}) => {
  const { hasPermission, canAccessResource } = usePermissions();

  const hasAccess = useMemo(() => {
    if (permission) {
      return hasPermission(permission);
    }

    if (resource && action) {
      return canAccessResource(resource, action, ownerId);
    }

    return true;
  }, [permission, resource, action, ownerId, hasPermission, canAccessResource]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

### 6. COMPONENTES DE INTERFAZ

#### Ejemplo de Uso en Componentes:

```typescript
// components/dispositions/DispositionList.tsx
export const DispositionList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { data: dispositions } = useDispositions();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Disposiciones</h2>
        <ProtectedComponent resource="dispositions" action="create">
          <Button onClick={() => setShowCreateModal(true)}>
            Nueva Disposición
          </Button>
        </ProtectedComponent>
      </div>

      <div className="space-y-4">
        {dispositions?.map((disposition) => (
          <div key={disposition.id} className="border p-4 rounded">
            <h3>{disposition.scriptName}</h3>
            <p>{disposition.observations}</p>

            <div className="flex gap-2 mt-2">
              <ProtectedComponent
                resource="dispositions"
                action="update"
                ownerId={disposition.userId}
              >
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </ProtectedComponent>

              <ProtectedComponent
                resource="dispositions"
                action="delete"
                ownerId={disposition.userId}
              >
                <Button variant="destructive" size="sm">
                  Eliminar
                </Button>
              </ProtectedComponent>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos y Entidades (Semana 1-2)

1. **Crear entidades TypeORM**

   - Role, Permission, RolePermission
   - Actualizar User entity
   - Crear migraciones

2. **Seeders de datos iniciales**
   - Roles básicos (Administrador, Supervisor, Técnico, Invitado)
   - Permisos granulares por recurso
   - Asignaciones iniciales de permisos a roles

### Fase 2: Backend - Servicios y Middleware (Semana 2-3)

1. **Implementar servicios**

   - PermissionService
   - RoleService
   - AuthService (actualizado)

2. **Middleware y Guards**

   - AuthMiddleware (actualizado)
   - PermissionGuard
   - Decoradores de permisos

3. **Controladores actualizados**
   - Agregar verificaciones de permisos
   - Implementar alcances (own/team/all)

### Fase 3: Frontend - Contexto y Hooks (Semana 3-4)

1. **AuthContext actualizado**

   - Incluir permisos del usuario
   - Funciones de verificación

2. **Hooks especializados**

   - usePermissions
   - useRoles (para administración)

3. **Componentes de protección**
   - ProtectedComponent
   - ProtectedRoute

### Fase 4: Interfaz de Administración (Semana 4-5)

1. **Gestión de roles**

   - CRUD de roles
   - Asignación de permisos

2. **Gestión de permisos**

   - Visualización agrupada
   - Edición de permisos

3. **Gestión de usuarios**
   - Asignación de roles
   - Vista de permisos efectivos

### Fase 5: Integración y Pruebas (Semana 5-6)

1. **Integración completa**

   - Todos los módulos protegidos
   - Verificación de permisos end-to-end

2. **Pruebas de seguridad**
   - Unit tests para servicios
   - Integration tests para endpoints
   - E2E tests para flujos completos

---

## 🔒 CONSIDERACIONES DE SEGURIDAD

### Backend

- **Validación doble**: Middleware + Guard
- **Logging de accesos**: Auditoría de permisos
- **Rate limiting**: Por usuario y endpoint
- **Sanitización**: Validación de parámetros

### Frontend

- **Ocultación de UI**: Elementos no autorizados
- **Validación cliente**: UX mejorada
- **Tokens seguros**: HTTPOnly cookies opcional
- **Session timeout**: Renovación automática

### Base de Datos

- **Índices optimizados**: Para consultas de permisos
- **Constraints**: Integridad referencial
- **Auditoría**: Logs de cambios de permisos

---

## 📊 MÉTRICAS Y MONITOREO

### KPIs de Seguridad

- Intentos de acceso no autorizados
- Tiempo de verificación de permisos
- Distribución de roles por usuario
- Uso de permisos por recurso

### Alertas

- Múltiples intentos fallidos
- Escalación de privilegios
- Cambios masivos de permisos
- Accesos fuera de horario

---

## 🎯 BENEFICIOS ESPERADOS

### Seguridad

- **Control granular**: Permisos específicos por acción
- **Principio de menor privilegio**: Acceso mínimo necesario
- **Trazabilidad**: Auditoría completa de accesos
- **Flexibilidad**: Roles personalizables

### Mantenimiento

- **Centralización**: Lógica de permisos unificada
- **Escalabilidad**: Fácil agregado de recursos/permisos
- **Reutilización**: Componentes y hooks reutilizables
- **Testing**: Pruebas automatizadas de seguridad

### Experiencia de Usuario

- **Interfaz adaptativa**: Elementos según permisos
- **Feedback claro**: Mensajes de error específicos
- **Performance**: Verificaciones optimizadas
- **Consistency**: Comportamiento uniforme

---

## 🔄 MIGRACIÓN DESDE SISTEMA ANTIGUO

### Datos Existentes

1. **Exportar configuración actual**

   - Roles y permisos existentes
   - Asignaciones de usuarios
   - Configuraciones especiales

2. **Mapeo de datos**

   - Convertir estructura Supabase → TypeORM
   - Mantener IDs compatibles
   - Preservar relaciones

3. **Script de migración**
   - Importación automática
   - Validación de integridad
   - Rollback en caso de error

### Testing Paralelo

1. **Ambiente dual**

   - Sistema antiguo y nuevo en paralelo
   - Comparación de resultados
   - Validación de permisos

2. **Migración gradual**
   - Por módulos/usuarios
   - Feedback continuo
   - Ajustes iterativos

---

## 📞 PRÓXIMOS PASOS

1. **Aprobación del plan**: Revisión y ajustes
2. **Setup del ambiente**: Configuración inicial
3. **Desarrollo Fase 1**: Entidades y migraciones
4. **Review semanal**: Progreso y ajustes
5. **Deploy gradual**: Implementación por fases

---

_Este informe proporciona una guía completa para implementar un sistema de permisos robusto y escalable basado en las mejores prácticas del Sistema Antiguo, adaptado a la nueva arquitectura moderna._
