# Sistema de Equipos - Plan de Implementación

## Resumen Ejecutivo

Este documento describe la implementación de un **Sistema de Equipos** para el sistema de gestión de casos actual. El sistema permitirá organizar usuarios en equipos funcionales como Desarrollo, Soporte de Aplicaciones, Infraestructura, etc., integrándose completamente con el sistema de permisos existente.

## Estado Actual del Sistema

### Arquitectura de Permisos Existente

El sistema actual cuenta con una arquitectura robusta de permisos basada en:

1. **Entidades Principales:**

   - `UserProfile`: Usuarios del sistema
   - `Role`: Roles asignados a usuarios
   - `Permission`: Permisos granulares del sistema
   - `RolePermission`: Relación entre roles y permisos

2. **Estructura de Permisos:**

   - **Formato:** `modulo.accion.scope`
   - **Módulos:** disposiciones, casos, notas, dashboard, etc.
   - **Acciones:** ver, crear, editar, eliminar, gestionar
   - **Scopes:** `own` (propio), `team` (equipo), `all` (todos)

3. **Roles Existentes:**
   - Administrador (acceso completo)
   - Supervisor (permisos intermedios)
   - Usuario (permisos básicos)

## Diseño del Sistema de Equipos

### 1. Nueva Estructura de Entidades

#### Entidad Team

```typescript
@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @Column({ type: "varchar", unique: true })
  code!: string; // Código corto: DEV, SUPP, INFRA

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", nullable: true })
  color?: string; // Color para UI (#FF5733)

  @Column({ type: "uuid", nullable: true })
  managerId?: string; // Líder del equipo

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // Relaciones
  @ManyToOne(() => UserProfile, { nullable: true })
  @JoinColumn({ name: "managerId" })
  manager?: UserProfile;

  @OneToMany(() => TeamMember, (teamMember) => teamMember.team)
  members!: TeamMember[];
}
```

#### Entidad TeamMember

```typescript
@Entity("team_members")
export class TeamMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  teamId!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", default: "member" })
  role!: "manager" | "lead" | "senior" | "member";

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  joinedAt?: Date;

  @Column({ type: "timestamptz", nullable: true })
  leftAt?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // Relaciones
  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: "teamId" })
  team!: Team;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "userId" })
  user!: UserProfile;

  // Índice único para evitar duplicados
  @Index("unique_team_user_active", { synchronize: false })
  // Se crea manualmente en migración con condición WHERE isActive = true
}
```

### 2. Modificaciones a Entidades Existentes

#### UserProfile - Agregar relación con equipos

```typescript
// Agregar a la entidad UserProfile existente:

@OneToMany(() => TeamMember, (teamMember) => teamMember.user)
teamMemberships!: TeamMember[];

// Método helper para obtener equipos activos
getActiveTeams(): Promise<Team[]> {
  return this.teamMemberships
    .filter(membership => membership.isActive)
    .map(membership => membership.team);
}
```

### 3. Evolución del Sistema de Permisos

#### Scope "team" - Interpretación Actualizada

El scope `team` existente en los permisos ahora se interpretará como:

- **Antes:** Sin implementación específica
- **Después:** Acceso a recursos del/los equipo(s) del usuario

#### Nuevos Permisos para Gestión de Equipos

```sql
-- Permisos para gestión de equipos
INSERT INTO permissions (name, description, module, action, scope, "isActive") VALUES
-- Ver equipos
('equipos.ver.own', 'Ver mis equipos', 'equipos', 'ver', 'own', true),
('equipos.ver.team', 'Ver equipos relacionados', 'equipos', 'ver', 'team', true),
('equipos.ver.all', 'Ver todos los equipos', 'equipos', 'ver', 'all', true),

-- Crear equipos
('equipos.crear.all', 'Crear nuevos equipos', 'equipos', 'crear', 'all', true),

-- Editar equipos
('equipos.editar.own', 'Editar equipos que gestiono', 'equipos', 'editar', 'own', true),
('equipos.editar.all', 'Editar cualquier equipo', 'equipos', 'editar', 'all', true),

-- Gestionar miembros
('equipos.miembros.gestionar.own', 'Gestionar miembros de mis equipos', 'equipos', 'miembros', 'own', true),
('equipos.miembros.gestionar.all', 'Gestionar miembros de cualquier equipo', 'equipos', 'miembros', 'all', true),

-- Eliminar equipos
('equipos.eliminar.all', 'Eliminar equipos', 'equipos', 'eliminar', 'all', true);
```

## Plan de Implementación

### Fase 1: Estructura de Base de Datos

#### 1.1 Migración de Creación de Tablas

```sql
-- Archivo: database/migrations/create_teams_system.sql

-- Crear tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Formato hex: #FF5733
    "managerId" UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de miembros de equipo
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamId" UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('manager', 'lead', 'senior', 'member')),
    "isActive" BOOLEAN DEFAULT true,
    "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
    "leftAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams("isActive");
CREATE INDEX IF NOT EXISTS idx_teams_manager ON teams("managerId");
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members("teamId");
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members("userId");
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members("isActive");

-- Índice único para evitar membresías duplicadas activas
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_user_active
ON team_members("teamId", "userId")
WHERE "isActive" = true;

-- Triggers para updatedAt
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 1.2 Migración de Permisos de Equipos

```sql
-- Archivo: database/migrations/add_teams_permissions.sql

-- Insertar permisos de equipos
INSERT INTO permissions (name, description, module, action, scope, "isActive") VALUES
-- [Lista completa de permisos como se mostró arriba]

-- Asignar permisos completos al Administrador
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Administrador'
AND p.module = 'equipos'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
```

#### 1.3 Datos Iniciales

```sql
-- Archivo: database/migrations/seed_default_teams.sql

-- Crear equipos por defecto
INSERT INTO teams (id, name, code, description, color, "isActive") VALUES
('10000000-0000-0000-0000-000000000001', 'Desarrollo', 'DEV', 'Equipo de desarrollo de software', '#007ACC', true),
('10000000-0000-0000-0000-000000000002', 'Soporte de Aplicaciones', 'SUPP', 'Equipo de soporte y mantenimiento de aplicaciones', '#28A745', true),
('10000000-0000-0000-0000-000000000003', 'Infraestructura', 'INFRA', 'Equipo de infraestructura y operaciones', '#DC3545', true),
('10000000-0000-0000-0000-000000000004', 'Calidad (QA)', 'QA', 'Equipo de control de calidad y testing', '#FFC107', true),
('10000000-0000-0000-0000-000000000005', 'Análisis de Negocio', 'BA', 'Equipo de análisis y requerimientos de negocio', '#6F42C1', true)
ON CONFLICT (code) DO NOTHING;
```

### Fase 2: Desarrollo de Backend

#### 2.1 Entidades TypeORM

- Crear `Team.ts` y `TeamMember.ts`
- Actualizar `UserProfile.ts` con relaciones de equipo
- Actualizar `index.ts` de entidades

#### 2.2 DTOs

```typescript
// dto/team.dto.ts
export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class AddTeamMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(["manager", "lead", "senior", "member"])
  role: "manager" | "lead" | "senior" | "member";
}
```

#### 2.3 Servicios

```typescript
// services/TeamService.ts
export class TeamService {
  async createTeam(createTeamDto: CreateTeamDto): Promise<Team>;
  async getTeamById(id: string): Promise<Team>;
  async getAllTeams(): Promise<Team[]>;
  async updateTeam(id: string, updateTeamDto: UpdateTeamDto): Promise<Team>;
  async deleteTeam(id: string): Promise<void>;

  // Gestión de miembros
  async addMember(
    teamId: string,
    addMemberDto: AddTeamMemberDto
  ): Promise<TeamMember>;
  async removeMember(teamId: string, userId: string): Promise<void>;
  async updateMemberRole(
    teamId: string,
    userId: string,
    role: string
  ): Promise<TeamMember>;
  async getTeamMembers(teamId: string): Promise<TeamMember[]>;

  // Métodos de consulta para permisos
  async getUserTeams(userId: string): Promise<Team[]>;
  async isUserInTeam(userId: string, teamId: string): Promise<boolean>;
  async isUserTeamManager(userId: string, teamId: string): Promise<boolean>;
}
```

#### 2.4 Controladores

- `TeamController.ts`: CRUD completo de equipos
- Actualizar `UserController.ts` con endpoints de equipos del usuario

#### 2.5 Middleware de Permisos Actualizado

```typescript
// middleware/PermissionMiddleware.ts - Actualizar para soporte de teams
export class PermissionMiddleware {
  // Método actualizado para resolver scope 'team'
  private async resolveTeamScope(
    userId: string,
    resourceOwnerId?: string
  ): Promise<boolean> {
    if (!resourceOwnerId) return false;

    // Verificar si ambos usuarios están en el mismo equipo
    const userTeams = await this.teamService.getUserTeams(userId);
    const resourceOwnerTeams = await this.teamService.getUserTeams(
      resourceOwnerId
    );

    return userTeams.some((userTeam) =>
      resourceOwnerTeams.some((ownerTeam) => ownerTeam.id === userTeam.id)
    );
  }
}
```

### Fase 3: Desarrollo de Frontend

#### 3.1 Componentes de Equipos

```typescript
// components/teams/TeamList.tsx
// components/teams/TeamCard.tsx
// components/teams/TeamForm.tsx
// components/teams/TeamMemberList.tsx
// components/teams/AddMemberModal.tsx
```

#### 3.2 Páginas

```typescript
// pages/Teams.tsx - Lista de equipos
// pages/TeamDetail.tsx - Detalle de equipo con miembros
// pages/TeamSettings.tsx - Configuración de equipo
```

#### 3.3 Servicios Frontend

```typescript
// services/teamService.ts
export const teamService = {
  getTeams: () => api.get("/teams"),
  getTeam: (id: string) => api.get(`/teams/${id}`),
  createTeam: (data: CreateTeamDto) => api.post("/teams", data),
  updateTeam: (id: string, data: UpdateTeamDto) =>
    api.put(`/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),

  addMember: (teamId: string, data: AddTeamMemberDto) =>
    api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};
```

### Fase 4: Integración con Sistema Existente

#### 4.1 Actualización de Filtros

- Actualizar filtros de casos, todos, notas para incluir scope de equipo
- Agregar filtro por equipo en interfaces de listado

#### 4.2 Dashboard Actualizado

- Agregar métricas por equipo
- Mostrar rendimiento del equipo del usuario
- Comparativas entre equipos

#### 4.3 Notificaciones

- Notificar cambios en equipos a miembros
- Notificar asignaciones de casos/todos al equipo

## Impacto en el Sistema Actual

### Cambios Mínimos Requeridos

1. **Base de Datos:**

   - Agregar 2 nuevas tablas (`teams`, `team_members`)
   - Agregar permisos específicos de equipos
   - No se modifican tablas existentes

2. **Backend:**

   - Actualizar middleware de permisos para interpretar scope 'team'
   - Agregar servicios y controladores de equipos
   - Actualizar consultas existentes para incluir filtrado por equipo

3. **Frontend:**
   - Agregar páginas de gestión de equipos
   - Actualizar filtros existentes
   - Agregar información de equipo en perfiles de usuario

### Beneficios Inmediatos

1. **Organización Clara:** Usuarios organizados por función/área
2. **Permisos Granulares:** Control preciso de acceso por equipo
3. **Colaboración Mejorada:** Identificación rápida de miembros del equipo
4. **Métricas Segmentadas:** Análisis de rendimiento por equipo
5. **Escalabilidad:** Fácil creación de nuevos equipos según necesidades

### Compatibilidad hacia Atrás

- Usuarios sin equipo mantendrán funcionalidad completa
- Permisos existentes seguirán funcionando normalmente
- Scope 'team' se comportará como 'own' para usuarios sin equipo

## Cronograma de Implementación

### Semana 1-2: Base de Datos y Backend Core

- Migraciones de base de datos
- Entidades TypeORM
- Servicios básicos de equipos

### Semana 3-4: API y Permisos

- Controladores completos
- Actualización de middleware de permisos
- Testing de APIs

### Semana 5-6: Frontend Básico

- Componentes de gestión de equipos
- Páginas principales
- Integración con APIs

### Semana 7-8: Integración y Refinamiento

- Actualización de filtros existentes
- Dashboard con métricas de equipo
- Testing integral y refinamientos

## Conclusión

El sistema de equipos propuesto se integra perfectamente con la arquitectura existente, aprovechando el sistema de permisos granular ya implementado. La implementación es evolutiva, manteniendo compatibilidad total con el sistema actual mientras agrega nuevas capacidades organizacionales.

La estructura propuesta es escalable y permite crecimiento orgánico del sistema, facilitando la creación de nuevos equipos y la gestión eficiente de permisos por área funcional.
