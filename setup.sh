#!/bin/bash

# =========================================
# CONFIGURACIÓN RÁPIDA - Case Management
# =========================================

echo "🚀 Configuración rápida del sistema"
echo "=================================="

# Función para mostrar menú
show_menu() {
    echo ""
    echo "¿Qué quieres configurar?"
    echo "1) 🔧 Desarrollo (crear .env desde ejemplos)"
    echo "2) 🏭 Producción (preparar para Apache)"
    echo "3) 🔑 Generar claves de producción"
    echo "4) 📦 Build completo para Apache"
    echo "5) ❌ Salir"
    echo ""
    read -p "Selecciona una opción (1-5): " choice
}

# Función para configurar desarrollo
setup_dev() {
    echo ""
    echo "🔧 Configurando para desarrollo..."
    
    # Backend
    cd backend
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Backend: .env creado desde ejemplo"
        echo "   Edita backend/.env con tus datos de base de datos"
    else
        echo "⚠️  Backend: .env ya existe"
    fi
    cd ..
    
    # Frontend
    cd frontend
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        echo "✅ Frontend: .env.local creado desde ejemplo"
    else
        echo "⚠️  Frontend: .env.local ya existe"
    fi
    cd ..
    
    echo ""
    echo "🎯 Configuración de desarrollo lista!"
    echo "   Backend: npm run dev"
    echo "   Frontend: npm run dev"
}

# Función para configurar producción
setup_prod() {
    echo ""
    echo "🏭 Configurando para producción..."
    
    # Backend
    cd backend
    if [ ! -f ".env.production" ]; then
        cp .env.production.example .env.production
        echo "✅ Backend: .env.production creado desde ejemplo"
        echo "   ⚠️  IMPORTANTE: Edita backend/.env.production con datos reales"
    else
        echo "⚠️  Backend: .env.production ya existe"
    fi
    cd ..
    
    # Frontend
    cd frontend
    if [ ! -f ".env.production" ]; then
        cp .env.production.example .env.production
        echo "✅ Frontend: .env.production creado desde ejemplo"
        echo "   ⚠️  IMPORTANTE: Edita frontend/.env.production con tu dominio"
    else
        echo "⚠️  Frontend: .env.production ya existe"
    fi
    cd ..
    
    echo ""
    echo "🏭 Configuración de producción lista!"
    echo "   Ahora edita los archivos .env.production"
    echo "   Luego ejecuta: ./build-for-apache.sh"
}

# Función para generar claves
generate_keys() {
    echo ""
    echo "🔑 Generando claves de producción..."
    cd backend
    npm run generate-keys
    cd ..
    echo ""
    echo "💡 Copia estas claves a backend/.env.production"
}

# Función para build completo
build_apache() {
    echo ""
    echo "📦 Ejecutando build para Apache..."
    ./build-for-apache.sh
}

# Bucle principal
while true; do
    show_menu
    
    case $choice in
        1)
            setup_dev
            ;;
        2)
            setup_prod
            ;;
        3)
            generate_keys
            ;;
        4)
            build_apache
            ;;
        5)
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo "❌ Opción inválida. Por favor selecciona 1-5."
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
done