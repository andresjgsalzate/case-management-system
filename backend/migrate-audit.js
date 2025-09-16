const { AppDataSource } = require("./dist/config/database.js");

async function runMigration() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Agregar columnas si no existen
    await AppDataSource.query(`
      ALTER TABLE audit_logs 
      ADD COLUMN IF NOT EXISTS operation_success BOOLEAN NOT NULL DEFAULT true;
    `);

    await AppDataSource.query(`
      ALTER TABLE audit_logs 
      ADD COLUMN IF NOT EXISTS error_message TEXT;
    `);

    // Actualizar registros existentes
    await AppDataSource.query(`
      UPDATE audit_logs 
      SET operation_success = true 
      WHERE operation_success IS NULL;
    `);

    console.log("✅ Migración ejecutada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error ejecutando migración:", error);
    process.exit(1);
  }
}

runMigration();
