#!/bin/bash

# =================================
# DEBUG FRONTEND PERMISSIONS
# =================================

echo "🔍 =================================================="
echo "🔍 DEBUG DE PERMISOS EN FRONTEND (PRODUCCIÓN)"
echo "🔍 =================================================="

USER_EMAIL="hjurgensen@todosistemassti.co"
PERMISSION_NAME="cases.create.own"

echo ""
echo "👤 Usuario de prueba: $USER_EMAIL"
echo "🔐 Permiso a verificar: $PERMISSION_NAME"
echo ""

echo "💻 INSTRUCCIONES PARA EL NAVEGADOR (PRODUCCIÓN):"
echo ""
echo "1. Abre las herramientas de desarrollador (F12)"
echo "2. Ve a la pestaña Console"
echo "3. Copia y pega este código JavaScript:"
echo ""
echo "// =============================================="
echo "// SCRIPT DE DIAGNÓSTICO DE PERMISOS FRONTEND"
echo "// =============================================="
echo ""
cat << 'EOF'
// Función de diagnóstico completo
function debugPermissions() {
  console.log('🔍 ===== DEBUG DE PERMISOS FRONTEND =====');
  
  // 1. Verificar AuthStore
  const authStore = window?.authStore || localStorage.getItem('auth-storage');
  if (authStore) {
    console.log('✅ AuthStore encontrado');
    try {
      let parsedAuthStore;
      if (typeof authStore === 'string') {
        parsedAuthStore = JSON.parse(authStore);
      } else {
        parsedAuthStore = authStore;
      }
      console.log('📊 AuthStore completo:', parsedAuthStore);
      
      const state = parsedAuthStore.state || parsedAuthStore;
      console.log('👤 Usuario:', state.user);
      console.log('🔐 Permisos del usuario:', state.userPermissions);
      console.log('✅ Permisos cargados:', state.permissionsLoaded);
      console.log('⏳ Cargando permisos:', state.isLoadingPermissions);
      
      // Buscar el permiso específico
      const targetPermission = 'cases.create.own';
      const hasTargetPermission = state.userPermissions?.some(p => p.name === targetPermission || p === targetPermission);
      console.log(`🎯 ¿Tiene permiso "${targetPermission}"?:`, hasTargetPermission);
      
      // Verificar función hasPermission si existe
      if (state.hasPermission && typeof state.hasPermission === 'function') {
        console.log(`🎯 hasPermission("${targetPermission}"):`, state.hasPermission(targetPermission));
      }
      
    } catch (e) {
      console.error('❌ Error parseando AuthStore:', e);
    }
  } else {
    console.log('❌ AuthStore no encontrado');
  }
  
  // 2. Verificar localStorage de autenticación
  console.log('\n🔍 === VERIFICACIÓN DE LOCALSTORAGE ===');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('token') || key.includes('user')) {
      console.log(`📝 ${key}:`, localStorage.getItem(key));
    }
  });
  
  // 3. Verificar React Router actual
  console.log('\n🔍 === VERIFICACIÓN DE RUTA ACTUAL ===');
  console.log('🌐 URL actual:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  
  // 4. Verificar contexto de React si está disponible
  const reactFiber = document.querySelector('#root')?._reactInternalFiber || 
                    document.querySelector('#root')?._reactInternals;
  if (reactFiber) {
    console.log('⚛️ React Fiber encontrado');
  }
  
  console.log('\n🏁 Diagnóstico completo');
}

// Ejecutar diagnóstico
debugPermissions();

// También intentar navegar programáticamente para ver qué error da
console.log('\n🔍 === INTENTANDO NAVEGACIÓN PROGRAMÁTICA ===');
try {
  // Verificar si React Router está disponible
  if (window.history && window.history.pushState) {
    console.log('✅ History API disponible');
    console.log('🚀 Intentando navegar a /cases/new...');
    window.history.pushState({}, '', '/cases/new');
    console.log('✅ Navegación programática exitosa');
    
    // Verificar si la URL cambió
    setTimeout(() => {
      console.log('📍 URL después de navegación:', window.location.pathname);
      
      // Intentar volver atrás
      window.history.back();
    }, 1000);
  }
} catch (e) {
  console.error('❌ Error en navegación programática:', e);
}
EOF

echo ""
echo "// =============================================="
echo ""
echo "4. Después de ejecutar el script, intenta navegar a /cases/new"
echo "5. Observa si aparecen errores en la consola"
echo "6. Copia y pega TODA la salida de la consola aquí"
echo ""
echo "🎯 TAMBIÉN PUEDES PROBAR:"
echo "   - Ir directamente a: [URL_PRODUCCION]/cases/new"
echo "   - Verificar si te redirige a /unauthorized"
echo "   - Si es así, el problema está en ProtectedRoute del frontend"
echo ""
echo "🏁 Ejecuta este diagnóstico y comparte los resultados"