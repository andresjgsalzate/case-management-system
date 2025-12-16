const crypto = require("crypto");

/**
 * Script para generar claves seguras
 * Uso: node scripts/generate-keys.js [longitud]
 */

const length = parseInt(process.argv[2]) || 64;

console.log("🔑 Generador de claves seguras");
console.log("================================");

// Generar clave aleatoria
const randomKey = crypto.randomBytes(length).toString("hex");

// Generar JWT secret
const jwtSecret = crypto.randomBytes(64).toString("hex");

// Generar JWT refresh secret
const jwtRefreshSecret = crypto.randomBytes(64).toString("hex");

// Generar clave de encriptación
const encryptionKey = crypto.randomBytes(32).toString("hex");

console.log("");
console.log("🔐 Claves JWT generadas (128 caracteres cada una):");
console.log("==================================================");
console.log("");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`ENV_ENCRYPTION_KEY=${encryptionKey}`);
console.log("");
console.log("� INSTRUCCIONES:");
console.log("1. Copia las líneas JWT_SECRET y JWT_REFRESH_SECRET");
console.log("2. Pégalas en backend/.env.production");
console.log("3. Reemplaza las líneas existentes");
console.log("");
console.log("💡 Consejos de seguridad:");
console.log("- Estas claves son para PRODUCCIÓN únicamente");
console.log("- Guárdalas en un lugar seguro");
console.log("- Nunca las subas a repositorios públicos");
console.log("");
