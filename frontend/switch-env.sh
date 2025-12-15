#!/bin/bash

# Script para cambiar entre configuraciones de entorno
# Uso: ./switch-env.sh [localhost|network|production]

ENV_TYPE=${1:-localhost}

case $ENV_TYPE in
  "localhost")
    echo "🔄 Cambiando a configuración LOCAL (127.0.0.1)..."
    cp .env.local.localhost .env.local
    echo "✅ Configurado para desarrollo local"
    echo "   Frontend: http://127.0.0.1:5173"
    echo "   Backend:  http://127.0.0.1:3000"
    ;;
  
  "network")
    echo "🔄 Cambiando a configuración de RED (192.168.5.113)..."
    cp .env.local.network .env.local
    echo "✅ Configurado para desarrollo en red"
    echo "   Frontend: http://192.168.5.113:5173"
    echo "   Backend:  http://192.168.5.113:3000"
    ;;
  
  "production")
    echo "🔄 Cambiando a configuración de PRODUCCIÓN..."
    cp .env.production.example .env.production
    echo "⚠️  Recuerda configurar las URLs de producción en .env.production"
    ;;
  
  *)
    echo "❌ Uso: ./switch-env.sh [localhost|network|production]"
    echo ""
    echo "Configuraciones disponibles:"
    echo "  localhost   - Para desarrollo local (http://localhost)"
    echo "  network     - Para desarrollo en red (http://192.168.5.113)"
    echo "  production  - Para servidor de producción"
    exit 1
    ;;
esac

echo ""
echo "🔄 Reinicia el servidor de desarrollo para aplicar los cambios:"
echo "   npm run dev"