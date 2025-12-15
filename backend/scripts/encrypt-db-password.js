const crypto = require("crypto");
const readline = require("readline");

/**
 * Script para encriptar contraseña de base de datos
 * Solicita la contraseña al usuario y genera la versión encriptada
 * Uso: node backend/scripts/encrypt-db-password.js
 */

// Crear interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔐 Encriptador de Contraseña de Base de Datos");
console.log("============================================");
console.log("");
console.log("Este script te ayudará a encriptar la contraseña de PostgreSQL");
console.log("para usarla de forma segura en producción.");
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
    console.log("🔐 RESULTADO DE LA ENCRIPTACIÓN:");
    console.log("================================");
    console.log("");
    console.log("Copia y pega esta línea en tu archivo .env.production:");
    console.log("");
    console.log(`DB_PASSWORD=${securePassword}`);
    console.log("");
    console.log("💡 INSTRUCCIONES:");
    console.log("1. Abre backend/.env.production");
    console.log("2. Busca la línea que contiene DB_PASSWORD");
    console.log("3. Reemplázala con la línea de arriba");
    console.log("4. Guarda el archivo");
    console.log("5. Ejecuta: ./build-for-apache.sh");
    console.log("");
    console.log("🚨 IMPORTANTE:");
    console.log(
      "- Esta contraseña encriptada es específica para esta aplicación"
    );
    console.log("- NO la compartas ni la subas a repositorios públicos");
    console.log(
      "- En el servidor de producción, configurar PostgreSQL con la contraseña original"
    );
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
