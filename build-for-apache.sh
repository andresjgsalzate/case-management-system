#!/bin/bash

# ==========================================
# Script MEJORADO de build para Apache
# Maneja Backend + Frontend de forma simple
# ==========================================

set -e  # Exit on any error

echo "🚀 Case Management System - Build para Apache"
echo "=============================================="
echo "   Este script creará TODO lo necesario para Apache"
echo ""

# Variables
BACKEND_DIR="backend"
FRONTEND_DIR="frontend" 
BUILD_DIR="apache-build"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

# Función para verificar configuración de seguridad
check_security_setup() {
    print_security "Verificando configuración de seguridad..."
    
    local security_ok=true
    
    # Verificar que existen las claves JWT en .env.production
    if [ ! -f "$BACKEND_DIR/.env.production" ]; then
        print_error "No se encontró $BACKEND_DIR/.env.production"
        echo "   Ejecuta: node backend/scripts/generate-keys.js"
        echo "   Y configura manualmente las claves en .env.production"
        security_ok=false
    else
        # Verificar que tiene claves JWT largas (seguras)
        if ! grep -q "JWT_SECRET=.*[a-f0-9]\{64,\}" "$BACKEND_DIR/.env.production"; then
            print_error "JWT_SECRET no es segura (debe tener al menos 64 caracteres hex)"
            echo "   Ejecuta: node backend/scripts/generate-keys.js"
            echo "   Y actualiza JWT_SECRET en .env.production"
            security_ok=false
        fi
        
        if ! grep -q "JWT_REFRESH_SECRET=.*[a-f0-9]\{64,\}" "$BACKEND_DIR/.env.production"; then
            print_error "JWT_REFRESH_SECRET no es segura"
            echo "   Ejecuta: node backend/scripts/generate-keys.js" 
            echo "   Y actualiza JWT_REFRESH_SECRET en .env.production"
            security_ok=false
        fi
    fi
    
    # Verificar configuración de contraseña de BD
    if [ -f "$BACKEND_DIR/.env.production" ]; then
        if grep -q "DB_PASSWORD=CAMBIAR_PASSWORD_DE_BASE_DATOS" "$BACKEND_DIR/.env.production"; then
            print_error "La contraseña de base de datos no está configurada"
            echo "   Ejecuta: node backend/scripts/encrypt-db-password.js"
            echo "   Y actualiza DB_PASSWORD en .env.production"
            security_ok=false
        fi
    fi
    
    if [ "$security_ok" = true ]; then
        print_success "Configuración de seguridad verificada"
        return 0
    else
        echo ""
        print_warning "CONFIGURACIÓN DE SEGURIDAD REQUERIDA:"
        echo "   1. Ejecuta: node backend/scripts/generate-keys.js"
        echo "   2. Ejecuta: node backend/scripts/encrypt-db-password.js" 
        echo "   3. Actualiza manualmente los archivos .env.production"
        echo "   4. Vuelve a ejecutar este script"
        echo ""
        return 1
    fi
}

# Función para verificar dependencias
check_requirements() {
    print_step "Verificando dependencias..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    
    print_success "Dependencias verificadas"
}

# Función para build del backend
build_backend() {
    print_step "Building backend..."
    
    cd $BACKEND_DIR
    
    # Instalar dependencias si no existen
    if [ ! -d "node_modules" ]; then
        echo "   📦 Instalando dependencias del backend..."
        npm install
    fi
    
    # Build del código
    echo "   🔨 Compilando TypeScript..."
    npm run build
    
    print_success "Backend compilado correctamente"
    cd ..
}

# Función para build del frontend
build_frontend() {
    print_step "Building frontend..."
    
    cd $FRONTEND_DIR
    
    # Verificar archivo de configuración de producción
    if [ ! -f ".env.production" ]; then
        print_error "No se encontró .env.production en el frontend"
        echo "   El archivo .env.production debe existir con:"
        echo "   1. VITE_API_BASE_URL=http://127.0.0.1:3000/api"
        echo "   2. VITE_BACKEND_URL=http://127.0.0.1:3000"
        echo ""
        echo "   Asegúrate de que el archivo esté configurado correctamente."
        exit 1
    fi
    
    # Instalar dependencias si no existen
    if [ ! -d "node_modules" ]; then
        echo "   📦 Instalando dependencias del frontend..."
        npm install
    fi
    
    # Build del frontend
    echo "   🔨 Compilando frontend..."
    npm run build
    
    print_success "Frontend compilado correctamente"
    cd ..
}

# Función para crear estructura de Apache
create_apache_structure() {
    print_step "Creando estructura para Apache..."
    
    # Crear directorio de build si no existe
    rm -rf $BUILD_DIR
    mkdir -p $BUILD_DIR
    
    # Copiar backend compilado
    mkdir -p $BUILD_DIR/backend
    cp -r $BACKEND_DIR/dist/* $BUILD_DIR/backend/
    cp -r $BACKEND_DIR/node_modules $BUILD_DIR/backend/
    cp $BACKEND_DIR/package.json $BUILD_DIR/backend/
    cp $BACKEND_DIR/.env.production $BUILD_DIR/backend/
    
    # Copiar scripts de seguridad
    mkdir -p $BUILD_DIR/backend/scripts
    if [ -f "$BACKEND_DIR/scripts/generate-keys.js" ]; then
        cp $BACKEND_DIR/scripts/generate-keys.js $BUILD_DIR/backend/scripts/
    fi
    if [ -f "$BACKEND_DIR/scripts/encrypt-db-password.js" ]; then
        cp $BACKEND_DIR/scripts/encrypt-db-password.js $BUILD_DIR/backend/scripts/
    fi
    
    # Copiar frontend compilado
    mkdir -p $BUILD_DIR/public
    cp -r $FRONTEND_DIR/dist/* $BUILD_DIR/public/
    
    # Crear directorio uploads
    mkdir -p $BUILD_DIR/backend/uploads/{documents,temp}
    echo "README: Directorio para archivos subidos" > $BUILD_DIR/backend/uploads/README.md
    
    print_success "Estructura de Apache creada"
}

# Función para crear archivos de configuración
create_config_files() {
    print_step "Creando archivos de configuración..."
    
    # Crear .htaccess para el frontend
    cat > $BUILD_DIR/public/.htaccess << 'EOF'
# Configuración para aplicación React SPA
RewriteEngine On

# Manejar rutas de la SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Configuración de CORS
Header always set Access-Control-Allow-Origin "http://127.0.0.1:3000"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Configuración de cache
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>
EOF

    # Crear script de inicio para el backend
    cat > $BUILD_DIR/backend/start.sh << 'EOF'
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

    chmod +x $BUILD_DIR/backend/start.sh
    
    # Crear archivo README de despliegue
    cat > $BUILD_DIR/README.md << 'EOF'
# Despliegue en Apache - Case Management System

## Estructura del despliegue

```
apache-build/
├── public/           # Frontend (archivos estáticos para Apache)
│   ├── index.html
│   ├── assets/
│   └── .htaccess    # Configuración de Apache
└── backend/         # Backend (Node.js)
    ├── server.js
    ├── start.sh     # Script de inicio
    ├── .env.production # Variables de producción
    └── uploads/     # Directorio para archivos
```

## Configuración de Apache

### 1. Configurar Virtual Host

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /ruta/a/apache-build/public
    
    # Proxy para API del backend
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/
    
    # Configuración de archivos estáticos
    <Directory "/ruta/a/apache-build/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 2. Módulos requeridos de Apache

```bash
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo systemctl restart apache2
```

## Configuración del Backend

### 1. Iniciar el backend

```bash
cd /ruta/a/apache-build/backend
./start.sh
```

### 2. Configurar como servicio

```bash
sudo nano /etc/systemd/system/case-management.service
```

```ini
[Unit]
Description=Case Management Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/ruta/a/apache-build/backend
ExecStart=/ruta/a/apache-build/backend/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable case-management
sudo systemctl start case-management
```

## Verificación

1. **Frontend**: http://tu-dominio.com
2. **Backend Health**: http://tu-dominio.com/api/health
3. **Logs del backend**: `sudo journalctl -u case-management -f`

## Troubleshooting

- Si el backend no inicia, verifica las variables de entorno en .env.production
- Si el frontend no carga rutas, verifica que mod_rewrite esté habilitado
- Si hay errores de CORS, verifica la configuración de proxy en Apache
EOF
    
    print_success "Archivos de configuración creados"
}

# Función principal
main() {
    echo "🏗️  Case Management System - Build para Apache"
    echo "==============================================="
    
    # Verificar dependencias básicas
    check_requirements
    
    # Verificar configuración de seguridad
    if ! check_security_setup; then
        exit 1
    fi
    
    # Proceder con el build
    build_backend
    build_frontend
    create_apache_structure
    create_config_files
    
    echo ""
    print_success "Build completado exitosamente!"
    echo ""
    echo "📁 Archivos listos en: $BUILD_DIR/"
    echo "📖 Lee $BUILD_DIR/README.md para instrucciones de despliegue"
    echo ""
    print_security "SEGURIDAD CONFIGURADA:"
    echo "   🔐 Claves JWT verificadas"
    echo "   🔐 Contraseña de BD configurada"
    echo "   🔐 Sistema listo para producción"
    echo ""
}

# Ejecutar si se llama directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi