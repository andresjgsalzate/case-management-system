const crypto = require("crypto-js");
const fs = require("fs");
const path = require("path");

/**
 * Script para encriptar variables de entorno sensibles
 * Uso: node scripts/encrypt-env.js
 */

console.log("🔐 Iniciando encriptación de variables de entorno...");

// Verificar que existen los archivos necesarios
const publicPath = path.join(__dirname, "..", ".env.public");
const secretsPath = path.join(__dirname, "..", ".env.secrets");
const encryptedPath = path.join(__dirname, "..", ".env.encrypted");

if (!fs.existsSync(publicPath)) {
  console.error("❌ Error: No se encontró .env.public");
  process.exit(1);
}

if (!fs.existsSync(secretsPath)) {
  console.error("❌ Error: No se encontró .env.secrets");
  process.exit(1);
}

try {
  // Leer archivos
  const publicContent = fs.readFileSync(publicPath, "utf8");
  const secretsContent = fs.readFileSync(secretsPath, "utf8");

  // Obtener clave de encriptación
  const lines = secretsContent.split("\n");
  let encryptionKey = null;

  for (const line of lines) {
    if (line.startsWith("ENV_ENCRYPTION_KEY=")) {
      encryptionKey = line.split("=")[1];
      break;
    }
  }

  if (!encryptionKey) {
    console.error(
      "❌ Error: No se encontró ENV_ENCRYPTION_KEY en .env.secrets"
    );
    process.exit(1);
  }

  // Combinar contenidos (público + secretos)
  const combinedContent = `# Archivo generado automáticamente - NO EDITAR MANUALMENTE
# Generado el: ${new Date().toISOString()}

${publicContent}

# ===== VARIABLES ENCRIPTADAS =====
${secretsContent}`;

  // Encriptar contenido completo
  const encrypted = crypto.AES.encrypt(
    combinedContent,
    encryptionKey
  ).toString();

  // Crear archivo encriptado con metadatos
  const encryptedFile = `# Variables de entorno encriptadas
# Generado el: ${new Date().toISOString()}
# Para desencriptar usar: npm run decrypt-env
${encrypted}`;

  // Guardar archivo encriptado
  fs.writeFileSync(encryptedPath, encryptedFile);

  console.log("✅ Variables de entorno encriptadas correctamente");
  console.log("📁 Archivo creado:", encryptedPath);
  console.log("🔑 Clave utilizada: ENV_ENCRYPTION_KEY");
  console.log("");
  console.log("📋 Próximos pasos:");
  console.log("1. Commitea .env.encrypted y .env.public");
  console.log("2. NO commitees .env.secrets");
  console.log("3. En producción usa variables de sistema");
} catch (error) {
  console.error("❌ Error durante la encriptación:", error.message);
  process.exit(1);
}
