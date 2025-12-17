#!/bin/bash

# =================================
# TEST DE DIAGNÓSTICO DE PERMISOS
# =================================

echo "🔍 ================================="
echo "🔍 TEST DE DIAGNÓSTICO DE PERMISOS"
echo "🔍 ================================="

# Configuración de la base de datos
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_USER="cms_admin"
DB_PASSWORD=".451789.Admin"
DB_NAME="case_management_db"

USER_EMAIL="hjurgensen@todosistemassti.co"
PERMISSION_NAME="cases.create.own"

echo ""
echo "👤 Usuario de prueba: $USER_EMAIL"
echo "🔐 Permiso a verificar: $PERMISSION_NAME"
echo ""

# PASO 1: Obtener información del usuario
echo "📋 PASO 1: Obteniendo información del usuario..."
USER_INFO=$(PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT 
  id || '|' || email || '|' || \"fullName\" || '|' || \"roleId\" || '|' || \"roleName\" || '|' || \"isActive\"
FROM user_profiles 
WHERE email = '$USER_EMAIL';
")

if [ -z "$USER_INFO" ] || [ "$USER_INFO" = "" ]; then
    echo "❌ ERROR: Usuario no encontrado"
    exit 1
fi

# Parsear información del usuario
IFS='|' read -r USER_ID USER_EMAIL_FOUND USER_FULLNAME ROLE_ID ROLE_NAME USER_ACTIVE <<< "$USER_INFO"

# Limpiar espacios en blanco
USER_ID=$(echo "$USER_ID" | xargs)
USER_EMAIL_FOUND=$(echo "$USER_EMAIL_FOUND" | xargs)
USER_FULLNAME=$(echo "$USER_FULLNAME" | xargs)
ROLE_ID=$(echo "$ROLE_ID" | xargs)
ROLE_NAME=$(echo "$ROLE_NAME" | xargs)
USER_ACTIVE=$(echo "$USER_ACTIVE" | xargs)

echo "✅ Usuario encontrado:"
echo "   ID: $USER_ID"
echo "   Email: $USER_EMAIL_FOUND"
echo "   Nombre: $USER_FULLNAME"
echo "   Role ID: $ROLE_ID"
echo "   Role Name: $ROLE_NAME"
echo "   Activo: $USER_ACTIVE"

if [ "$USER_ACTIVE" != "t" ] && [ "$USER_ACTIVE" != "true" ]; then
    echo "❌ ERROR: Usuario no está activo (valor: $USER_ACTIVE)"
    exit 1
fi

if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "" ]; then
    echo "❌ ERROR: Usuario no tiene roleId asignado"
    exit 1
fi

echo ""

# PASO 2: Verificar que el permiso existe y está activo
echo "📋 PASO 2: Verificando que el permiso existe..."
PERMISSION_INFO=$(PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT 
  id || '|' || name || '|' || description || '|' || module || '|' || action || '|' || scope || '|' || \"isActive\"
FROM permissions 
WHERE name = '$PERMISSION_NAME';
")

if [ -z "$PERMISSION_INFO" ] || [ "$PERMISSION_INFO" = "" ]; then
    echo "❌ ERROR: Permiso no encontrado en la tabla permissions"
    exit 1
fi

# Parsear información del permiso
IFS='|' read -r PERM_ID PERM_NAME PERM_DESC PERM_MODULE PERM_ACTION PERM_SCOPE PERM_ACTIVE <<< "$PERMISSION_INFO"

# Limpiar espacios en blanco
PERM_ID=$(echo "$PERM_ID" | xargs)
PERM_NAME=$(echo "$PERM_NAME" | xargs)
PERM_DESC=$(echo "$PERM_DESC" | xargs)
PERM_MODULE=$(echo "$PERM_MODULE" | xargs)
PERM_ACTION=$(echo "$PERM_ACTION" | xargs)
PERM_SCOPE=$(echo "$PERM_SCOPE" | xargs)
PERM_ACTIVE=$(echo "$PERM_ACTIVE" | xargs)

echo "✅ Permiso encontrado:"
echo "   ID: $PERM_ID"
echo "   Name: $PERM_NAME"
echo "   Description: $PERM_DESC"
echo "   Module: $PERM_MODULE"
echo "   Action: $PERM_ACTION"
echo "   Scope: $PERM_SCOPE"
echo "   Activo: $PERM_ACTIVE"

if [ "$PERM_ACTIVE" != "t" ] && [ "$PERM_ACTIVE" != "true" ]; then
    echo "❌ ERROR: Permiso no está activo (valor: $PERM_ACTIVE)"
    exit 1
fi

echo ""

# PASO 3: Verificar la relación role-permission
echo "📋 PASO 3: Verificando relación role-permission..."
RELATION_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM role_permissions rp
WHERE rp.\"roleId\" = '$ROLE_ID' 
  AND rp.\"permissionId\" = '$PERM_ID';
")

RELATION_EXISTS=$(echo "$RELATION_EXISTS" | xargs)

if [ "$RELATION_EXISTS" = "0" ]; then
    echo "❌ ERROR: No existe relación entre el rol y el permiso"
    echo "   Role ID: $ROLE_ID"
    echo "   Permission ID: $PERM_ID"
    
    echo ""
    echo "📝 Verificando qué permisos SÍ tiene el rol..."
    PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT p.name as \"Permiso\", p.description as \"Descripción\"
    FROM role_permissions rp
    JOIN permissions p ON rp.\"permissionId\" = p.id
    WHERE rp.\"roleId\" = '$ROLE_ID'
      AND p.name LIKE 'cases.%'
    ORDER BY p.name;
    "
    exit 1
fi

echo "✅ Relación role-permission encontrada"
echo "   Registros encontrados: $RELATION_EXISTS"

echo ""

# PASO 4: Simular exactamente lo que hace PermissionService.hasPermission
echo "📋 PASO 4: Simulando PermissionService.hasPermission..."
echo "🔍 Llamando hasPermission('$ROLE_ID', '$PERMISSION_NAME')"

# Paso 4a: Buscar permiso activo (igual que hace PermissionService)
PERM_ACTIVE_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM permissions 
WHERE name = '$PERMISSION_NAME' AND \"isActive\" = true;
")

PERM_ACTIVE_CHECK=$(echo "$PERM_ACTIVE_CHECK" | xargs)
echo "🔍 Paso 4a - Buscar permiso activo: $([ "$PERM_ACTIVE_CHECK" -gt "0" ] && echo "ENCONTRADO" || echo "NO ENCONTRADO")"

if [ "$PERM_ACTIVE_CHECK" = "0" ]; then
    echo "❌ PermissionService fallaría aquí: Permiso no encontrado o no activo"
    exit 1
fi

# Paso 4b: Buscar relación role-permission (igual que hace PermissionService)
ROLE_PERM_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM role_permissions 
WHERE \"roleId\" = '$ROLE_ID' AND \"permissionId\" = '$PERM_ID';
")

ROLE_PERM_CHECK=$(echo "$ROLE_PERM_CHECK" | xargs)
echo "🔍 Paso 4b - Buscar relación role-permission: $([ "$ROLE_PERM_CHECK" -gt "0" ] && echo "ENCONTRADO" || echo "NO ENCONTRADO")"

HAS_PERMISSION_RESULT=$([ "$ROLE_PERM_CHECK" -gt "0" ] && echo "true" || echo "false")
echo "🔍 Resultado de hasPermission: $HAS_PERMISSION_RESULT"

echo ""

# RESULTADO FINAL
echo "🎯 ================================="
echo "🎯 RESULTADO FINAL DEL DIAGNÓSTICO"
echo "🎯 ================================="

if [ "$HAS_PERMISSION_RESULT" = "true" ]; then
    echo "✅ ✅ ✅ EL USUARIO DEBERÍA TENER ACCESO ✅ ✅ ✅"
    echo ""
    echo "🚨 PROBLEMA IDENTIFICADO:"
    echo "   La base de datos está correcta, pero el middleware rechaza la petición."
    echo ""
    echo "   Posibles causas:"
    echo "   1. Error en AuthenticationMiddleware (usuario no llega autenticado)"
    echo "   2. Excepción no controlada en PermissionService"
    echo "   3. Problema de configuración de base de datos en producción"
    echo "   4. Cache de permisos desactualizado"
    echo "   5. Variables de entorno diferentes entre desarrollo y producción"
    echo ""
    echo "💡 SIGUIENTE PASO:"
    echo "   1. Revisar logs del servidor cuando se intenta acceder a /cases/new"
    echo "   2. Verificar que las variables de entorno DB_* sean correctas"
    echo "   3. Comparar configuración de .env entre desarrollo y producción"
else
    echo "❌ ❌ ❌ PROBLEMA EN BASE DE DATOS ❌ ❌ ❌"
    echo "   El usuario NO tiene los permisos correctos configurados."
fi

echo ""
echo "🏁 Test completado"