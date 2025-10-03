# 🔐 Guía de Seguridad para Variables de Entorno

## ⚠️ **PROBLEMA ACTUAL**

Los archivos `.env` contienen credenciales en texto plano, lo que representa un riesgo de seguridad.

## 🛡️ **SOLUCIONES DE SEGURIDAD**

### 1. **Encriptación de Variables (Recomendado)**

#### Instalar herramienta de encriptación:

```bash
npm install dotenv-encrypted
# o
npm install @encryption/dotenv
```

#### Crear `.env.encrypted`:

```bash
# Generar archivo encriptado
npx dotenv-encrypted encrypt .env
```

#### Uso en código:

```typescript
// backend/src/config/environment.ts
import { config } from "dotenv-encrypted";

// Cargar variables encriptadas
config({
  path: ".env.encrypted",
  key: process.env.ENCRYPTION_KEY, // Esta clave se maneja por separado
});
```

### 2. **Separación de Secretos por Niveles**

#### Estructura recomendada:

```
backend/
├── .env.public          # Variables no sensibles
├── .env.secrets         # Solo credenciales (nunca commitear)
├── .env.encrypted       # Versión encriptada para repositorio
└── .gitignore          # Excluir archivos sensibles
```

#### `.env.public` (se puede commitear):

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### `.env.secrets` (NUNCA commitear):

```env
DB_USERNAME=postgres
DB_PASSWORD=451789
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production_12345
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-app
```

### 3. **Variables de Sistema (Producción)**

#### En servidores usar variables del sistema:

```bash
# En lugar de archivos .env, usar:
export DB_PASSWORD="contraseña_super_segura"
export JWT_SECRET="jwt_key_ultra_segura"
export SMTP_PASS="password_email_seguro"

# O con Docker:
docker run -e DB_PASSWORD="contraseña_segura" mi-app
```

### 4. **Gestores de Secretos Profesionales**

#### **AWS Secrets Manager:**

```typescript
import { SecretsManager } from "aws-sdk";

const secretsManager = new SecretsManager({ region: "us-east-1" });

export const getSecret = async (secretName: string) => {
  const result = await secretsManager
    .getSecretValue({
      SecretId: secretName,
    })
    .promise();

  return JSON.parse(result.SecretString || "{}");
};
```

#### **Azure Key Vault:**

```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const client = new SecretClient(
  "https://tu-keyvault.vault.azure.net/",
  new DefaultAzureCredential()
);

export const getSecret = async (name: string) => {
  const secret = await client.getSecret(name);
  return secret.value;
};
```

#### **HashiCorp Vault:**

```typescript
import vault from "node-vault";

const vaultClient = vault({
  apiVersion: "v1",
  endpoint: "http://127.0.0.1:8200",
  token: process.env.VAULT_TOKEN,
});

export const getSecret = async (path: string) => {
  const result = await vaultClient.read(`secret/data/${path}`);
  return result.data.data;
};
```

## 🔧 **IMPLEMENTACIÓN RÁPIDA**

### Opción 1: Encriptación Simple

```bash
# 1. Instalar
npm install crypto-js dotenv

# 2. Script de encriptación
node scripts/encrypt-env.js
```

### Script `scripts/encrypt-env.js`:

```javascript
const crypto = require("crypto-js");
const fs = require("fs");

// Leer archivo .env
const envContent = fs.readFileSync(".env", "utf8");

// Generar clave (guárdala en lugar seguro)
const key = process.env.ENV_ENCRYPTION_KEY || "tu-clave-maestra-ultra-segura";

// Encriptar
const encrypted = crypto.AES.encrypt(envContent, key).toString();

// Guardar archivo encriptado
fs.writeFileSync(".env.encrypted", encrypted);
console.log("✅ Archivo .env encriptado correctamente");
```

### Script de desencriptación `src/config/decrypt-env.ts`:

```typescript
import * as crypto from "crypto-js";
import * as fs from "fs";

export const loadEncryptedEnv = () => {
  const encryptedContent = fs.readFileSync(".env.encrypted", "utf8");
  const key = process.env.ENV_ENCRYPTION_KEY!;

  const decrypted = crypto.AES.decrypt(encryptedContent, key).toString(
    crypto.enc.Utf8
  );

  // Parsear y cargar variables
  decrypted.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
};
```

## 🚨 **MEDIDAS DE SEGURIDAD ADICIONALES**

### 1. **Actualizar `.gitignore`:**

```gitignore
# Variables de entorno sensibles
.env
.env.local
.env.secrets
.env.*.local

# Pero permitir archivos encriptados
!.env.encrypted
!.env.public
```

### 2. **Rotación de Secretos:**

```bash
# Script para generar nuevas claves JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. **Validación en Runtime:**

```typescript
// src/config/environment.ts
const requiredSecrets = ["DB_PASSWORD", "JWT_SECRET", "JWT_REFRESH_SECRET"];

requiredSecrets.forEach((secret) => {
  if (!process.env[secret]) {
    throw new Error(
      `❌ Variable de entorno requerida no encontrada: ${secret}`
    );
  }
});
```

## 📋 **CHECKLIST DE SEGURIDAD**

- [ ] ✅ Archivos `.env` en `.gitignore`
- [ ] ✅ Credenciales encriptadas o en gestor de secretos
- [ ] ✅ Claves JWT generadas aleatoriamente
- [ ] ✅ Validación de variables requeridas
- [ ] ✅ Rotación periódica de secretos
- [ ] ✅ Variables de sistema en producción
- [ ] ✅ Acceso limitado a archivos de configuración
- [ ] ✅ Monitoreo de accesos a credenciales

## 🎯 **RECOMENDACIÓN FINAL**

**Para desarrollo:** Usar encriptación simple con `crypto-js`
**Para producción:** Usar gestor de secretos profesional (AWS, Azure, Vault)

¿Quieres que implemente alguna de estas soluciones en tu proyecto?
