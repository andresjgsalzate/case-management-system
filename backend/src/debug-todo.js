// Debug script para verificar el TODO y sus controles
const { AppDataSource } = require("./config/database");

async function debugTodo() {
  try {
    // Inicializar la conexión a la base de datos
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Obtener el repositorio directamente
    const todoRepo = AppDataSource.getRepository("Todo");
    const controlRepo = AppDataSource.getRepository("TodoControl");

    const todoId = "2599f2bc-f527-4cb3-878c-1059e0c63034";

    console.log("\n🔍 Debug - Checking TODO and controls...");

    // 1. Verificar si el TODO existe
    const todo = await todoRepo.findOne({ where: { id: todoId } });
    console.log("📋 TODO exists:", !!todo);
    if (todo) {
      console.log("   - Title:", todo.title);
      console.log("   - ID:", todo.id);
    }

    // 2. Verificar controles directamente en la tabla
    const controls = await controlRepo.find({ where: { todoId } });
    console.log("🎛️  Controls in database:", controls.length);
    controls.forEach((control, index) => {
      console.log(`   - Control ${index + 1}:`);
      console.log(`     * ID: ${control.id}`);
      console.log(`     * User ID: ${control.userId}`);
      console.log(`     * Timer Active: ${control.isTimerActive}`);
      console.log(`     * Timer Start: ${control.timerStartAt}`);
    });

    // 3. Probar la consulta con joins
    const todoWithControls = await todoRepo
      .createQueryBuilder("todo")
      .leftJoinAndSelect("todo.controls", "controls")
      .where("todo.id = :id", { id: todoId })
      .getOne();

    console.log("🔗 TODO with controls via JOIN:");
    console.log(
      "   - Controls loaded:",
      todoWithControls?.controls?.length || 0
    );
    if (todoWithControls?.controls) {
      todoWithControls.controls.forEach((control, index) => {
        console.log(
          `   - Control ${index + 1}: Timer Active = ${control.isTimerActive}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Debug error:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

debugTodo();
