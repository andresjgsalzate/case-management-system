# 🚀 Guía Rápida para Despliegue en Producción

## 📋 **Archivos a Modificar**

### 1. **Frontend - `.env.production`**

```env
# Cambiar estas URLs por las de tu servidor de producción
VITE_API_BASE_URL=https://tu-servidor.com/api
VITE_BACKEND_URL=https://tu-servidor.com
VITE_NODE_ENV=production
```

### 2. **Backend - `.env` o crear `.env.production`**

```env
# URLs de producción
FRONTEND_URL=https://tu-servidor.com
BACKEND_URL=https://tu-servidor.com
CORS_ORIGIN=https://tu-servidor.com

# Base de datos de producción
DB_HOST=tu-servidor-db
DB_USERNAME=usuario_prod
DB_PASSWORD=contraseña_segura
DB_DATABASE=case_management_prod

# Claves JWT seguras (cambiar por unas reales)
JWT_SECRET=clave_jwt_super_segura_produccion
JWT_REFRESH_SECRET=clave_refresh_super_segura_produccion

# Email SMTP (configurar según tu proveedor)
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-app
```

## 🔧 **Ejemplos de Configuración**

### **Para IP fija (ej: 192.168.1.100)**

```env
# Frontend
VITE_API_BASE_URL=http://192.168.1.100:3000/api
VITE_BACKEND_URL=http://192.168.1.100:3000

# Backend
FRONTEND_URL=http://192.168.1.100:5173
CORS_ORIGIN=http://192.168.1.100:5173
```

### **Para dominio (ej: miempresa.com)**

```env
# Frontend
VITE_API_BASE_URL=https://miempresa.com/api
VITE_BACKEND_URL=https://miempresa.com

# Backend
FRONTEND_URL=https://miempresa.com
CORS_ORIGIN=https://miempresa.com
```

### **Para subdominios separados**

```env
# Frontend
VITE_API_BASE_URL=https://api.miempresa.com/api
VITE_BACKEND_URL=https://api.miempresa.com

# Backend
FRONTEND_URL=https://app.miempresa.com
CORS_ORIGIN=https://app.miempresa.com
```

## ⚡ **Comandos para Desplegar**

```bash
# 1. Construir frontend
cd frontend
NODE_ENV=production npm run build

# 2. Ejecutar backend en producción
cd backend
NODE_ENV=production npm start
```

## 🔒 **Checklist Importante**

- [ ] ✅ Cambiar URLs en `frontend/.env.production`
- [ ] ✅ Cambiar URLs y DB en `backend/.env`
- [ ] ✅ Generar claves JWT seguras
- [ ] ✅ Configurar credenciales SMTP reales
- [ ] ✅ Verificar acceso a base de datos de producción
- [ ] ✅ Configurar HTTPS/SSL en tu servidor

## 🚨 **Campos Críticos a NO Olvidar**

1. **CORS_ORIGIN** debe coincidir exactamente con la URL desde donde accederán
2. **JWT_SECRET** cambiar por una clave real y segura
3. **DB_PASSWORD** usar contraseña de base de datos de producción
4. **SMTP credentials** para envío de emails

## 🎯 **Resultado Esperado**

Después de estos cambios, la aplicación funcionará correctamente en tu servidor de producción con las URLs correctas y configuraciones seguras.
