# 🔧 Configuración de Entornos

Este proyecto soporta múltiples configuraciones de entorno para desarrollo y producción.

## 📁 Archivos de Configuración

### Frontend (`/frontend`)

- `.env.local` - Configuración activa (no versionar)
- `.env.local.localhost` - Desarrollo local (localhost)
- `.env.local.network` - Desarrollo en red (192.168.x.x)
- `.env.production.example` - Ejemplo para producción
- `switch-env.sh` - Script para cambiar entre configuraciones

### Backend (`/backend`)

- `.env` - Configuración activa (no versionar)
- `.env.example` - Plantilla de ejemplo
- `.env.production` - Configuración para producción

## 🚀 Configuraciones Disponibles

### 1. Desarrollo Local (localhost)

```bash
cd frontend
./switch-env.sh localhost
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- **Uso**: Desarrollo en tu máquina local

### 2. Desarrollo en Red (192.168.5.113)

```bash
cd frontend
./switch-env.sh network
npm run dev
```

- Frontend: `http://192.168.5.113:5173`
- Backend: `http://192.168.5.113:3000`
- **Uso**: Otros dispositivos en la red pueden acceder

### 3. Producción

```bash
cd frontend
cp .env.production.example .env.production
# Editar .env.production con URLs reales
npm run build
```

## 🌐 Ejemplos para Producción

### Con Dominio

```env
VITE_API_BASE_URL=https://api.miempresa.com/api
VITE_BACKEND_URL=https://api.miempresa.com
```

### Con IP Pública

```env
VITE_API_BASE_URL=http://203.0.113.10:3000/api
VITE_BACKEND_URL=http://203.0.113.10:3000
```

### Con Subdominio

```env
VITE_API_BASE_URL=https://case-management.miempresa.com/api
VITE_BACKEND_URL=https://case-management.miempresa.com
```

## ⚙️ Backend CORS

Asegúrate de configurar el CORS en el backend (`/backend/.env`):

```env
# Para desarrollo
CORS_ORIGIN=http://localhost:5173,http://192.168.5.113:5173

# Para producción
CORS_ORIGIN=https://miempresa.com,https://www.miempresa.com
```

## 🔍 Troubleshooting

### Error de Conexión

1. Verificar que el backend esté corriendo: `curl http://localhost:3000`
2. Verificar proxy de Vite: `curl http://localhost:5173/api/`
3. Verificar configuración de CORS en backend

### Error de Red

1. Verificar que la IP sea accesible: `ping 192.168.5.113`
2. Verificar que no haya firewall bloqueando el puerto
3. Verificar configuración de red del servidor

### Cambios no se Aplican

1. Reiniciar servidor de desarrollo: `Ctrl+C` y `npm run dev`
2. Limpiar caché: `npm run dev -- --force`
3. Verificar archivo `.env.local` activo
