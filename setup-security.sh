#!/bin/bash

# ==========================================
# Script de configuración de seguridad
# Configura claves JWT y contraseña de BD
# ==========================================

set -e

echo "🔐 Case Management System - Configuración de Seguridad"
echo "======================================================"
echo ""
echo "Este script te ayudará a configurar la seguridad del sistema:"
echo "1. Generará claves JWT seguras"
echo "2. Te pedirá la contraseña de la base de datos"
echo "3. Configurará automáticamente los archivos .env.production"
echo ""

BACKEND_DIR="backend"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_security() {
    echo -e "${CYAN}🔐 $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "$BACKEND_DIR" ]; then
    print_error "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

print_step "Generando claves JWT seguras..."

# Ejecutar generador de claves
cd $BACKEND_DIR
if [ ! -f "scripts/generate-keys.js" ]; then
    print_error "No se encontró el script generate-keys.js"
    exit 1
fi

key_output=$(node scripts/generate-keys.js)
echo "$key_output"

# Extraer claves
jwt_secret=$(echo "$key_output" | grep "JWT_SECRET=" | cut -d'=' -f2)
jwt_refresh_secret=$(echo "$key_output" | grep "JWT_REFRESH_SECRET=" | cut -d'=' -f2)
encryption_key=$(echo "$key_output" | grep "ENV_ENCRYPTION_KEY=" | cut -d'=' -f2)

if [ -z "$jwt_secret" ] || [ -z "$jwt_refresh_secret" ]; then
    print_error "Error al generar las claves JWT"
    exit 1
fi

print_success "Claves JWT generadas correctamente"
cd ..

print_step "Configurando contraseña de base de datos..."



# Solicitar contraseña de base de datos
echo ""
echo "Ahora necesitamos la contraseña de PostgreSQL para encriptarla:"
echo -n "Ingresa la contraseña de PostgreSQL: "
read -s db_password
echo ""  # Nueva línea después del input

if [ -z "$db_password" ] || [ ${#db_password} -lt 6 ]; then
    print_error "La contraseña debe tener al menos 6 caracteres"
    exit 1
fi

# Mostrar la contraseña para confirmar
echo ""
print_security "Confirmación de contraseña:"
echo "Contraseña ingresada: '$db_password'"
echo ""
print_warning "IMPORTANTE: Verifica que la contraseña sea correcta."
echo "Esta será la contraseña que debes configurar en PostgreSQL."
echo ""
read -p "¿Es correcta esta contraseña? (y/N): " confirm_password

if [[ $confirm_password != [yY] && $confirm_password != [yY][eE][sS] ]]; then
    print_warning "Contraseña no confirmada. Reinicia el proceso."
    exit 1
fi

# Generar la encriptación usando Node.js de forma segura
print_step "Encriptando contraseña..."

# Crear archivo temporal para evitar problemas con caracteres especiales
temp_script=$(mktemp)
cat > "$temp_script" << 'EOF'
const crypto = require('crypto');
const password = process.argv[2];
const salt = crypto.randomBytes(32).toString('hex');
const iterations = 100000;
const keyLength = 64;
const digest = 'sha512';
const encryptedPassword = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');
const securePassword = `pbkdf2:${digest}:${iterations}:${salt}:${encryptedPassword}`;
console.log(securePassword);
EOF

# Ejecutar el script pasando la contraseña como argumento
encrypted_result=$(node "$temp_script" "$db_password")

# Limpiar archivo temporal
rm "$temp_script"

print_success "Contraseña encriptada correctamente"
echo ""
print_security "RESULTADO DE LA ENCRIPTACIÓN:"
echo "================================="
echo ""
echo "Contraseña original: '$db_password'"
echo "Versión encriptada: DB_PASSWORD=$encrypted_result"
echo ""
print_warning "RECUERDA:"
echo "- Usa la contraseña ORIGINAL ('$db_password') en PostgreSQL"
echo "- Usa la versión ENCRIPTADA en el archivo .env.production"
echo ""

print_warning "PAUSA: Configuración Manual Requerida"
echo ""
echo "Ahora necesitas configurar manualmente el archivo .env.production"
echo ""
echo "📝 INSTRUCCIONES DE CONFIGURACIÓN MANUAL:"
echo "1. Abre: $BACKEND_DIR/.env.production"
echo "2. Busca y actualiza estas líneas:"
echo ""
echo "   JWT_SECRET=$jwt_secret"
echo "   JWT_REFRESH_SECRET=$jwt_refresh_secret"
echo "   DB_PASSWORD=$encrypted_result"
echo ""
echo "3. Guarda el archivo"
echo ""

read -p "¿Has completado la configuración manual? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    print_warning "Configuración pendiente. Completa los pasos y ejecuta:"
    echo "   ./build-for-apache.sh"
    exit 0
fi

print_success "Configuración de seguridad completada"
echo ""
print_step "Verificando configuración..."

# Verificar que las claves estén en .env.production
if [ -f "$BACKEND_DIR/.env.production" ]; then
    if grep -q "JWT_SECRET=.*[a-f0-9]\{64,\}" "$BACKEND_DIR/.env.production"; then
        print_success "JWT_SECRET configurada correctamente"
    else
        print_error "JWT_SECRET no está configurada correctamente"
    fi
    
    if ! grep -q "DB_PASSWORD=CAMBIAR_PASSWORD_DE_BASE_DATOS" "$BACKEND_DIR/.env.production"; then
        print_success "DB_PASSWORD configurada"
    else
        print_error "DB_PASSWORD aún no está configurada"
    fi
else
    print_error "Archivo .env.production no encontrado"
fi

echo ""
print_success "🚀 Configuración lista!"
echo ""
echo "Ahora puedes ejecutar:"
echo "   ./build-for-apache.sh"
echo ""