# INSTRUCCIONES PARA RESOLVER PROBLEMAS CRÍTICOS EN PRODUCCIÓN

## PROBLEMA 1: Error 401 en /api/auth/permissions

El usuario no puede acceder al dashboard porque el frontend recibe HTTP 401 Unauthorized.

### CAUSA RAÍZ:

- El login funciona pero falla al crear audit logs debido al enum `audit_logs_action_enum`
- Los valores `LOGIN`, `LOGOUT`, `LOGOUT_ALL`, `FORCE_LOGOUT` no existen en el enum
- Esto impide que se guarde correctamente la sesión del usuario
- Sin sesión activa, el token JWT no pasa la validación en `validateActiveSession()`

## SOLUCIÓN INMEDIATA:

### 1. Cambiar ownership del enum (como superuser postgres):

```bash
# Paso 1: Conectar como postgres
sudo -u postgres psql -d case_management_db

# Paso 2: Ejecutar en psql
ALTER TYPE audit_logs_action_enum OWNER TO cms_admin;
\q
```

### 2. Agregar valores al enum (como cms_admin):

```bash
# Conectar como cms_admin
psql -h 127.0.0.1 -U cms_admin -d case_management_db

# Ejecutar en psql:
ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGIN';
ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGOUT';
ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGOUT_ALL';
ALTER TYPE audit_logs_action_enum ADD VALUE 'FORCE_LOGOUT';

# Verificar
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

\q
```

### 2. Aplicar permisos adicionales de casos:

```bash
# Ejecutar desde terminal
psql -d case_management -f database/migrations/add_cases_permissions.sql
```

### 3. Reiniciar el backend:

```bash
pm2 restart cms-backend
```

## PROBLEMA 2: No puede crear casos

El rol "Analista de Aplicaciones" no tiene permisos para crear casos.

### SOLUCIÓN:

Ya incluido en el script `add_cases_permissions.sql` - se agregan permisos:

- `cases.create.own`
- `cases.update.own`
- `cases.delete.own`

## VERIFICACIÓN FINAL:

1. **Confirmar que el enum está arreglado:**

```bash
pm2 logs cms-backend --lines 50
```

No debería haber más errores "invalid input value for enum"

2. **Probar acceso al dashboard:**

- Ir a https://casemanagement.todosistemassti.co
- Login como hjurgensen@todosistemassti.co
- Verificar que carga el dashboard sin errores 403

3. **Probar creación de casos:**

- Intentar crear un nuevo caso
- Verificar que no recibe error de permisos

## COMANDOS RESUMIDOS:

```bash
# 1. Cambiar ownership (como postgres)
sudo -u postgres psql -d case_management_db -c "ALTER TYPE audit_logs_action_enum OWNER TO cms_admin;"

# 2. Agregar valores al enum (como cms_admin)
psql -h 127.0.0.1 -U cms_admin -d case_management_db -f database/migrations/fix_enum_cms_admin.sql

# 3. Agregar permisos de casos
psql -h 127.0.0.1 -U cms_admin -d case_management_db -f database/migrations/add_cases_permissions.sql

# 4. Reiniciar backend
pm2 restart cms-backend

# 4. Verificar logs
pm2 logs cms-backend --lines 20
```

## ESTADO ACTUAL:

- ✅ Permisos de métricas agregados (24 permisos)
- ✅ Rol "Analista de Aplicaciones" tiene permisos de dashboard
- ❌ Enum audit_logs_action_enum falta valores LOGIN/LOGOUT
- ❌ Faltan permisos de creación de casos

Una vez ejecutados estos pasos, ambos problemas deberían estar resueltos.
