// MODIFICACIÓN en backend/src/config/environment-simple.ts
// Si quieres usar .env en lugar de .env.production

// ANTES (línea ~31):
const prodPath = path.join(process.cwd(), ".env.production");

// DESPUÉS:
const prodPath = path.join(process.cwd(), ".env");

// Y cambiar el mensaje (línea ~33):
console.log("✅ Configuración de producción cargada (.env)");
