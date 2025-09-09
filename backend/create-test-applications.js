import { AppDataSource } from "./src/config/database";
import { Application } from "./src/entities/Application";

async function createTestApplications() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conexión a base de datos establecida");

    const applicationRepository = AppDataSource.getRepository(Application);

    // Verificar si ya existen aplicaciones
    const existingCount = await applicationRepository.count();
    console.log(`📊 Aplicaciones existentes: ${existingCount}`);

    if (existingCount === 0) {
      // Crear aplicaciones de prueba
      const testApplications = [
        {
          nombre: "Sistema de Gestión de Casos",
          descripcion: "Aplicación principal para gestión de casos legales",
          activo: true,
        },
        {
          nombre: "Portal de Clientes",
          descripcion: "Portal web para acceso de clientes a sus casos",
          activo: true,
        },
        {
          nombre: "Módulo de Reportes",
          descripcion: "Sistema de generación de reportes y estadísticas",
          activo: true,
        },
        {
          nombre: "API de Integración",
          descripcion: "API para integración con sistemas externos",
          activo: false,
        },
        {
          nombre: "App Móvil",
          descripcion: "Aplicación móvil para acceso remoto",
          activo: true,
        },
      ];

      for (const appData of testApplications) {
        const application = applicationRepository.create(appData);
        await applicationRepository.save(application);
        console.log(`✅ Creada aplicación: ${appData.nombre}`);
      }

      console.log(
        `🎉 Se crearon ${testApplications.length} aplicaciones de prueba`
      );
    } else {
      console.log("ℹ️ Ya existen aplicaciones en la base de datos");
    }

    await AppDataSource.destroy();
    console.log("✅ Conexión cerrada");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestApplications();
