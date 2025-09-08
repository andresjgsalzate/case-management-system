// Script para probar el archivado de TODOs
const fetch = require("node-fetch");

async function testTodoArchiving() {
  const baseUrl = "http://localhost:3000/api";

  try {
    console.log("🧪 Iniciando prueba de archivado de TODOs...\n");

    // 1. Primero obtener la lista de TODOs para ver cuáles están disponibles
    console.log("📋 1. Obteniendo lista de TODOs...");
    const todosResponse = await fetch(`${baseUrl}/todos`);
    const todosData = await todosResponse.json();

    if (!todosData.success || !todosData.data || todosData.data.length === 0) {
      console.log("❌ No hay TODOs disponibles para archivar");
      return;
    }

    console.log(`✅ Encontrados ${todosData.data.length} TODOs`);

    // Buscar un TODO completado
    const completedTodo = todosData.data.find((todo) => todo.isCompleted);

    if (!completedTodo) {
      console.log("❌ No hay TODOs completados disponibles para archivar");
      console.log(
        "📝 Los TODOs deben estar completados para poder ser archivados"
      );
      return;
    }

    console.log(
      `📋 TODO a archivar: "${completedTodo.title}" (ID: ${completedTodo.id})`
    );

    // 2. Archivar el TODO
    console.log("\n📦 2. Archivando TODO...");
    const archiveResponse = await fetch(
      `${baseUrl}/archive/todo/${completedTodo.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1, // ID de usuario de prueba
          reason: "Prueba de archivado automático",
        }),
      }
    );

    const archiveData = await archiveResponse.json();

    if (archiveData.success) {
      console.log("✅ TODO archivado exitosamente!");
      console.log("📄 Detalles del archivo:");
      console.log(`   - ID del archivo: ${archiveData.data.id}`);
      console.log(`   - Título: ${archiveData.data.title}`);
      console.log(
        `   - Tiempo total: ${archiveData.data.totalTimeMinutes} minutos`
      );
      console.log(`   - Archivado por: ${archiveData.data.archivedBy}`);
      console.log(`   - Razón: ${archiveData.data.archiveReason}`);
    } else {
      console.log("❌ Error al archivar TODO:");
      console.log(archiveData);
    }

    // 3. Verificar que el TODO ya no está en la lista activa
    console.log(
      "\n🔍 3. Verificando que el TODO fue removido de la lista activa..."
    );
    const todosAfterResponse = await fetch(`${baseUrl}/todos`);
    const todosAfterData = await todosAfterResponse.json();

    if (todosAfterData.success) {
      const stillExists = todosAfterData.data.find(
        (todo) => todo.id === completedTodo.id
      );
      if (stillExists) {
        console.log("⚠️ El TODO aún aparece en la lista activa");
      } else {
        console.log("✅ El TODO fue removido correctamente de la lista activa");
      }
    }

    // 4. Verificar estadísticas del archivo
    console.log("\n📊 4. Verificando estadísticas del archivo...");
    const statsResponse = await fetch(`${baseUrl}/archive/stats`);
    const statsData = await statsResponse.json();

    if (statsData.success) {
      console.log("📈 Estadísticas del archivo:");
      console.log(
        `   - Casos archivados: ${statsData.data.totalArchivedCases}`
      );
      console.log(
        `   - TODOs archivados: ${statsData.data.totalArchivedTodos}`
      );
      console.log(
        `   - Archivados este mes: ${statsData.data.archivedThisMonth}`
      );
    }

    console.log("\n🎉 Prueba completada exitosamente!");
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
}

// Ejecutar la prueba
testTodoArchiving();
