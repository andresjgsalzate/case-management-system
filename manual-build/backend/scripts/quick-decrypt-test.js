#!/usr/bin/env node

// Script rápido para verificar que el decryptor funciona con el formato nuevo
const path = require("path");
const fs = require("fs");

process.env.NODE_ENV = "production";
// No configurar ENCRYPTION_MASTER_KEY para probar con JWT_SECRET

const envPath = path.join(__dirname, "..", ".env.production");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  if (line && !line.startsWith("#") && line.includes("=")) {
    const [key, ...rest] = line.split("=");
    process.env[key] = rest.join("=");
  }
});

console.log("DB_PASSWORD loaded:", process.env.DB_PASSWORD?.substring(0, 50));

const { PasswordDecryptor } = require("../dist/utils/password-decryptor");

try {
  const decrypted = PasswordDecryptor.getDecryptedDbPassword();
  console.log("Decrypted password:", decrypted);
} catch (err) {
  console.error("Error during decrypt test:", err);
  process.exit(1);
}
