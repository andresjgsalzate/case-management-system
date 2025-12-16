#!/bin/bash
# Test para verificar si se puede usar .env en lugar de .env.production

echo "🧪 Test: ¿Puede el sistema usar .env en lugar de .env.production?"
echo "================================================================="
echo ""

# Guardar el archivo original
cp backend/.env.production backend/.env.production.backup

# Test 1: Renombrar .env.production a .env_temp
mv backend/.env.production backend/.env_temp

# Test 2: Copiar contenido de .env.production al .env existente
echo "📝 Copiando contenido de .env.production a .env..."
cp backend/.env_temp backend/.env

# Test 3: Configurar NODE_ENV=production y probar
cd backend
export NODE_ENV=production

echo ""
echo "🔧 Configurando NODE_ENV=production..."
echo "📄 Contenido actual de .env:"
head -5 .env

echo ""
echo "🚀 Intentando cargar configuración..."

# Crear un script de prueba simple
cat > test-env-loading.js << 'EOF'
const { EnvironmentService } = require('./dist/config/environment-simple.js');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

try {
    const envService = EnvironmentService.getInstance();
    envService.loadEnvironment();
    
    console.log('✅ Variables cargadas correctamente');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PASSWORD (primeros 20 chars):', (process.env.DB_PASSWORD || '').substring(0, 20) + '...');
    console.log('JWT_SECRET (primeros 20 chars):', (process.env.JWT_SECRET || '').substring(0, 20) + '...');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
EOF

# Ejecutar el test
node test-env-loading.js

# Test 4: Limpiar
rm test-env-loading.js

# Restaurar archivo original
mv backend/.env_temp backend/.env.production

echo ""
echo "📋 RESULTADO DEL TEST:"
echo "======================"

if [ -f ".env.production" ]; then
    echo "✅ Archivo .env.production restaurado correctamente"
else
    echo "❌ Error: No se pudo restaurar .env.production"
    mv backend/.env.production.backup backend/.env.production
fi

cd ..
echo ""
echo "💡 CONCLUSIÓN:"
echo "El sistema está configurado para buscar específicamente:"
echo "  • En desarrollo: .env"
echo "  • En producción: .env.production"
echo ""
echo "Para usar .env en producción, necesitarías modificar environment-simple.ts"