#!/bin/bash
# Script automatizado para build de producción
# Case Management System

set -e  # Salir si algún comando falla

echo "🏗️  INICIANDO BUILD DE PRODUCCIÓN"
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

PROJECT_ROOT=$(pwd)
print_step "Directorio del proyecto: $PROJECT_ROOT"

# 1. LIMPIAR BUILDS ANTERIORES
print_step "Limpiando builds anteriores..."
rm -rf backend/dist
rm -rf frontend/dist
rm -rf manual-build/backend/*
rm -rf public/*
print_success "Builds anteriores limpiados"

# 2. BUILD DEL BACKEND
print_step "Compilando backend TypeScript..."
cd "$PROJECT_ROOT/backend"

if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json en backend/"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    print_error "Error compilando el backend"
    exit 1
fi
print_success "Backend compilado exitosamente"

# 3. BUILD DEL FRONTEND
print_step "Compilando frontend React..."
cd "$PROJECT_ROOT/frontend"

if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json en frontend/"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    print_error "Error compilando el frontend"
    exit 1
fi
print_success "Frontend compilado exitosamente"

# 4. PREPARAR ESTRUCTURA DE PRODUCCIÓN
cd "$PROJECT_ROOT"
print_step "Preparando estructura de producción..."

# Crear directorios si no existen
mkdir -p manual-build/backend
mkdir -p public

# Copiar backend compilado
print_step "Copiando backend compilado a manual-build..."
cp -r backend/dist/* manual-build/backend/
cp backend/package.json manual-build/backend/
cp -r backend/node_modules manual-build/backend/
print_success "Backend copiado a manual-build/"

# Copiar frontend compilado
print_step "Copiando frontend compilado a public..."
cp -r frontend/dist/* public/
print_success "Frontend copiado a public/"

# 5. CREAR/RECREAR start.sh
print_step "Creando script start.sh para producción..."
cat > manual-build/backend/start.sh << 'EOF'
#!/bin/bash
# Script de inicio para el backend

echo "🚀 Iniciando Case Management Backend..."

# Configurar para producción
export NODE_ENV=production

# Verificar que existe la configuración
if [ ! -f ".env.production" ]; then
    echo "❌ No se encontró .env.production"
    exit 1
fi

# Iniciar aplicación
echo "✅ Iniciando servidor..."
node server.js
EOF

# Dar permisos de ejecución
chmod +x manual-build/backend/start.sh
print_success "Script start.sh creado y configurado"

# 6. VERIFICAR ESTRUCTURA FINAL
print_step "Verificando estructura de producción..."

if [ ! -f "manual-build/backend/server.js" ]; then
    print_error "No se encontró server.js compilado"
    exit 1
fi

if [ ! -f "public/index.html" ]; then
    print_error "No se encontró index.html del frontend"
    exit 1
fi

if [ ! -f "manual-build/backend/start.sh" ]; then
    print_error "No se encontró start.sh"
    exit 1
fi

# 7. MOSTRAR RESUMEN
echo ""
echo "🎉 BUILD DE PRODUCCIÓN COMPLETADO"
echo "================================="
print_success "Backend compilado: manual-build/backend/"
print_success "Frontend compilado: public/"
print_success "Script de inicio: manual-build/backend/start.sh"

echo ""
echo "📁 ESTRUCTURA DE PRODUCCIÓN:"
echo "manual-build/"
echo "├── backend/"
echo "│   ├── server.js"
echo "│   ├── package.json"
echo "│   ├── node_modules/"
echo "│   ├── start.sh"
echo "│   └── ..."
echo "└── nginx-config.conf"
echo ""
echo "public/"
echo "├── index.html"
echo "└── assets/"
echo ""

print_success "¡Listo para producción! 🚀"
echo ""
echo "Para iniciar en producción:"
echo "  cd manual-build/backend && ./start.sh"