#!/bin/bash
# Script de configuración de Nginx para Case Management System

echo "🔧 Configurando Nginx para Case Management System..."

# Variables (CAMBIAR ESTAS RUTAS)
SITE_NAME="case-management"
BUILD_PATH="/ruta/a/manual-build"  # ← CAMBIAR por la ruta real
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Verificar que Nginx esté instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    sudo apt update
    sudo apt install nginx -y
fi

# Crear el archivo de configuración
echo "📝 Creando configuración del sitio..."
sudo cp nginx-config.conf "$NGINX_AVAILABLE/$SITE_NAME"

# Actualizar las rutas en la configuración
echo "🔄 Actualizando rutas en la configuración..."
sudo sed -i "s|/ruta/a/manual-build|$BUILD_PATH|g" "$NGINX_AVAILABLE/$SITE_NAME"

# Habilitar el sitio
echo "✅ Habilitando el sitio..."
sudo ln -sf "$NGINX_AVAILABLE/$SITE_NAME" "$NGINX_ENABLED/"

# Deshabilitar sitio por defecto si existe
if [ -L "$NGINX_ENABLED/default" ]; then
    echo "🚫 Deshabilitando sitio por defecto..."
    sudo rm "$NGINX_ENABLED/default"
fi

# Verificar la configuración
echo "🔍 Verificando configuración de Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración válida. Reiniciando Nginx..."
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    echo "🎉 ¡Nginx configurado correctamente!"
    echo ""
    echo "📋 URLs disponibles:"
    echo "   - http://23.0.125.32"
    echo "   - http://casemanagement.todosistemassti.co"
    echo "   - http://127.0.0.1"
    echo "   - http://www.casemanagement.todosistemassti.co"
else
    echo "❌ Error en la configuración de Nginx"
    exit 1
fi