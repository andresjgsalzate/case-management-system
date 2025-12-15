const crypto = require("crypto-js");
const fs = require("fs");
const path = require("path");

/**
 * Script para desencriptar variables de entorno
 * Uso: node scripts/decrypt-env.js [archivo_encriptado]
 */

console.log("🔓 Iniciando desencriptación de variables de entorno...");

// Obtener archivo a desencriptar (por defecto .env.encrypted)
const encryptedFile =
  process.argv[2] || path.join(__dirname, "..", ".env.encrypted");

if (!fs.existsSync(encryptedFile)) {
  console.error(`❌ Error: No se encontró el archivo ${encryptedFile}`);
  process.exit(1);
}

// Obtener clave de encriptación del entorno o archivo de secretos
let encryptionKey = process.env.ENV_ENCRYPTION_KEY;

if (!encryptionKey) {
  const secretsPath = path.join(__dirname, "..", ".env.secrets");
  if (fs.existsSync(secretsPath)) {
    const secretsContent = fs.readFileSync(secretsPath, "utf8");
    const lines = secretsContent.split("\n");

    for (const line of lines) {
      if (line.startsWith("ENV_ENCRYPTION_KEY=")) {
        encryptionKey = line.split("=")[1];
        break;
      }
    }
  }
}

if (!encryptionKey) {
  console.error("❌ Error: No se encontró ENV_ENCRYPTION_KEY");
  console.error("   Opciones:");
  console.error("   1. Agregar ENV_ENCRYPTION_KEY como variable de entorno");
  console.error("   2. Asegurar que existe en .env.secrets");
  process.exit(1);
}

try {
  // Leer archivo encriptado
  const fileContent = fs.readFileSync(encryptedFile, "utf8");

  // Extraer solo la parte encriptada (omitir comentarios)
  const lines = fileContent.split("\n");
  const encryptedContent = lines.find(
    (line) => !line.startsWith("#") && line.trim().length > 0
  );

  if (!encryptedContent) {
    console.error("❌ Error: No se encontró contenido encriptado válido");
    process.exit(1);
  }

  // Desencriptar
  const decrypted = crypto.AES.decrypt(
    encryptedContent,
    encryptionKey
  ).toString(crypto.enc.Utf8);

  if (!decrypted) {
    console.error("❌ Error: No se pudo desencriptar (clave incorrecta?)");
    process.exit(1);
  }

  // Guardar archivo .env desencriptado
  const outputPath = path.join(__dirname, "..", ".env");
  fs.writeFileSync(outputPath, decrypted);

  console.log("✅ Variables de entorno desencriptadas correctamente");
  console.log("📁 Archivo creado:", outputPath);
  console.log("");
  console.log("⚠️  IMPORTANTE:");
  console.log("   El archivo .env contiene información sensible");
  console.log("   NO lo commitees al repositorio");
} catch (error) {
  console.error("❌ Error durante la desencriptación:", error.message);
  process.exit(1);
}
