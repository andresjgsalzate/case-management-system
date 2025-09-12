// Script para probar el archivado de TODOs
const fetch = require("node-fetch");

async function testTodoArchiving() {
  const baseUrl = "http://localhost:3000/api";

  try {

    // 1. Primero obtener la lista de TODOs para ver cuáles están disponibles
    const todosResponse = await fetch(`${baseUrl}/todos`);
    const todosData = await todosResponse.json();

    if (!todosData.success || !todosData.data || todosData.data.length === 0) {
      return;
    }


    // Buscar un TODO completado
    const completedTodo = todosData.data.find((todo) => todo.isCompleted);

    if (!completedTodo) {
        "📝 Los TODOs deben estar completados para poder ser archivados"
      );
      return;
    }

      `📋 TODO a archivar: "${completedTodo.title}" (ID: ${completedTodo.id})`
    );

    // 2. Archivar el TODO
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
        `   - Tiempo total: ${archiveData.data.totalTimeMinutes} minutos`
      );
    } else {
    }

    // 3. Verificar que el TODO ya no está en la lista activa
      "\n🔍 3. Verificando que el TODO fue removido de la lista activa..."
    );
    const todosAfterResponse = await fetch(`${baseUrl}/todos`);
    const todosAfterData = await todosAfterResponse.json();

    if (todosAfterData.success) {
      const stillExists = todosAfterData.data.find(
        (todo) => todo.id === completedTodo.id
      );
      if (stillExists) {
      } else {
      }
    }

    // 4. Verificar estadísticas del archivo
    const statsResponse = await fetch(`${baseUrl}/archive/stats`);
    const statsData = await statsResponse.json();

    if (statsData.success) {
        `   - Casos archivados: ${statsData.data.totalArchivedCases}`
      );
        `   - TODOs archivados: ${statsData.data.totalArchivedTodos}`
      );
        `   - Archivados este mes: ${statsData.data.archivedThisMonth}`
      );
    }

  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
}

// Ejecutar la prueba
testTodoArchiving();
