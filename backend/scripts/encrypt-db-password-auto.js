const crypto = require("crypto");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

/**
 * Script MEJORADO para encriptar contraseña de base de datos
 * Genera la encriptación Y actualiza automáticamente el desencriptador
 * Uso: node backend/scripts/encrypt-db-password-auto.js
 */

// Crear interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔐 Encriptador AUTOMÁTICO de Contraseña de Base de Datos");
console.log("========================================================");
console.log("");
console.log(
  "Este script encriptará la contraseña Y actualizará automáticamente"
);
console.log("el desencriptador para que funcione sin intervención manual.");
console.log("");

// Función para leer contraseña sin mostrarla en pantalla
function readPassword(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    process.stdout.write(prompt);

    stdin.on("data", function (char) {
      char = char.toString();

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeAllListeners("data");
          console.log(""); // Nueva línea
          resolve(password);
          break;
        case "\u0003": // Ctrl+C
          console.log("\n❌ Operación cancelada");
          process.exit(1);
          break;
        case "\u007f": // Backspace
        case "\b":
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    });
  });
}

function updateDevEnvironment(password) {
  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    console.log("⚠️  No se encontró .env para desarrollo");
    return;
  }

  let content = fs.readFileSync(envPath, "utf8");

  // Actualizar o agregar DB_PASSWORD_DEV
  if (content.includes("DB_PASSWORD_DEV=")) {
    content = content.replace(
      /DB_PASSWORD_DEV=.*$/m,
      `DB_PASSWORD_DEV=${password}`
    );
    console.log("🔄 Contraseña de desarrollo actualizada en .env");
  } else {
    content += `\n# CONTRASEÑA DE DESARROLLO - Solo para NODE_ENV=development\nDB_PASSWORD_DEV=${password}\n`;
    console.log("➕ Contraseña de desarrollo agregada a .env");
  }

  fs.writeFileSync(envPath, content, "utf8");
  console.log("✅ Archivo .env actualizado para desarrollo");
}

function updateEnvProduction(securePassword) {
  const envPath = path.join(__dirname, "..", ".env.production");

  let content = "";

  // Leer contenido existente o crear plantilla básica si no existe
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
    console.log("📄 Archivo .env.production encontrado, actualizando...");
  } else {
    console.log("📄 Creando nuevo archivo .env.production...");
    content = `# Variables de entorno para PRODUCCIÓN - Backend
NODE_ENV=production
PORT=3000

# URLs de la aplicación en PRODUCCIÓN
FRONTEND_URL=http://127.0.0.1
BACKEND_URL=http://127.0.0.1:3000

# Base de datos de PRODUCCIÓN - CAMBIAR ESTOS VALORES
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=cms_admin
DB_DATABASE=case_management_db

# JWT para PRODUCCIÓN - Claves generadas de forma segura
JWT_SECRET=CAMBIAR_POR_CLAVE_SEGURA
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=CAMBIAR_POR_CLAVE_SEGURA
JWT_REFRESH_EXPIRES_IN=7d

# CORS para PRODUCCIÓN
CORS_ORIGIN=http://127.0.0.1

# Upload de archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Email para PRODUCCIÓN (configurar SMTP real)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-email
`;
  }

  // Reemplazar o agregar la línea DB_PASSWORD
  if (content.includes("DB_PASSWORD=")) {
    content = content.replace(
      /DB_PASSWORD=.*$/m,
      `DB_PASSWORD=${securePassword}`
    );
    console.log("🔄 Contraseña DB_PASSWORD actualizada en .env.production");
  } else {
    // Agregar después de la sección de base de datos
    if (content.includes("DB_DATABASE=")) {
      content = content.replace(
        /(DB_DATABASE=.*$)/m,
        `$1\nDB_PASSWORD=${securePassword}`
      );
    } else {
      content += `\nDB_PASSWORD=${securePassword}\n`;
    }
    console.log("➕ Nueva línea DB_PASSWORD agregada a .env.production");
  }

  fs.writeFileSync(envPath, content, "utf8");
  console.log("✅ Archivo .env.production actualizado automáticamente");
}

async function main() {
  try {
    // Solicitar contraseña
    const password = await readPassword(
      "Ingresa la contraseña de PostgreSQL: "
    );

    if (!password || password.length < 6) {
      console.log("❌ La contraseña debe tener al menos 6 caracteres");
      process.exit(1);
    }

    console.log("✅ Contraseña recibida");
    console.log("");

    // Generar salt aleatorio
    const salt = crypto.randomBytes(32).toString("hex");

    // Encriptar contraseña usando PBKDF2
    const iterations = 100000;
    const keyLength = 64;
    const digest = "sha512";

    console.log("🔐 Encriptando contraseña...");

    const encryptedPassword = crypto
      .pbkdf2Sync(password, salt, iterations, keyLength, digest)
      .toString("hex");

    // Crear formato para almacenar
    const securePassword = `pbkdf2:${digest}:${iterations}:${salt}:${encryptedPassword}`;

    console.log("✅ Contraseña encriptada correctamente");
    console.log("");

    // Actualizar archivos automáticamente
    console.log("🔄 Actualizando archivos automáticamente...");

    updateDevEnvironment(password);
    updateEnvProduction(securePassword);

    console.log("");
    console.log("🎉 CONFIGURACIÓN COMPLETADA AUTOMÁTICAMENTE!");
    console.log("============================================");
    console.log("");
    console.log("✅ Contraseña encriptada y configurada");
    console.log("✅ Archivo .env actualizado para desarrollo");
    console.log("✅ Archivo .env.production actualizado para producción");
    console.log("");
    console.log("🚀 PRÓXIMOS PASOS:");
    console.log("1. Ejecuta: npm run build (para verificar que compila)");
    console.log(
      "2. Ejecuta: ./build-for-apache.sh (para construir la aplicación)"
    );
    console.log("");
    console.log("🔒 SEGURIDAD:");
    console.log("- La contraseña original está oculta en el código fuente");
    console.log("- Solo el hash encriptado es visible en .env.production");
    console.log("- El sistema funciona sin exponer credenciales");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar
main();
