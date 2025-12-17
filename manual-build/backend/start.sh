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
