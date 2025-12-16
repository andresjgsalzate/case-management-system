# Despliegue Manual en Apache - Case Management System

## Estructura del despliegue

```
manual-build/
├── public/           # Frontend (archivos estáticos para Apache)
│   ├── index.html
│   ├── assets/
│   └── .htaccess    # Configuración de Apache
└── backend/         # Backend (Node.js)
    ├── server.js
    ├── start.sh     # Script de inicio
    ├── .env.production # Variables de producción
    └── uploads/     # Directorio para archivos
```

## Estado del Build

✅ **Backend compilado correctamente** (TypeScript → JavaScript) - **ACTUALIZADO**  
✅ **Frontend compilado correctamente** (React/Vite → archivos estáticos) - **ACTUALIZADO**  
✅ **Archivos de configuración copiados**  
✅ **Scripts de inicio creados**  
✅ **Configuración multi-dominio aplicada**

## Configuración de Apache

### 1. Configurar Virtual Host

````apache
<VirtualHost *:80>
    ServerName casemanagement.todosistemassti.co
    ServerAlias www.casemanagement.todosistemassti.co
    ServerAlias 23.0.125.32
    ServerAlias 127.0.0.1
    DocumentRoot /ruta/a/manual-build/public

    # Proxy para API del backend
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    # Configuración de archivos estáticos
    <Directory "/ruta/a/manual-build/public">
        AllowOverride All
        Require all granted
    </Directory>

    # Headers para CORS y compatibilidad
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</VirtualHost>
```### 2. Módulos requeridos de Apache

```bash
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo systemctl restart apache2
````

## Configuración del Backend

### 1. Iniciar el backend

```bash
cd /ruta/a/manual-build/backend
./start.sh
```

### 2. Configurar como servicio

```bash
sudo nano /etc/systemd/system/case-management.service
```

```ini
[Unit]
Description=Case Management Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/ruta/a/manual-build/backend
ExecStart=/ruta/a/manual-build/backend/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable case-management
sudo systemctl start case-management
```

## Verificación

### URLs de Acceso Configuradas:

1. **http://23.0.125.32** (IP directa)
2. **http://casemanagement.todosistemassti.co** (dominio principal)
3. **http://127.0.0.1** (local)
4. **http://www.casemanagement.todosistemassti.co** (con www)

### Endpoints de Verificación:

- **Frontend**: Cualquiera de las URLs de arriba
- **Backend Health**: `[URL]/api/health`
- **API**: `[URL]/api/`
- **Logs del backend**: `sudo journalctl -u case-management -f`

## Troubleshooting

- Si el backend no inicia, verifica las variables de entorno en .env.production
- Si el frontend no carga rutas, verifica que mod_rewrite esté habilitado
- Si hay errores de CORS, verifica la configuración de proxy en Apache

## Archivos importantes

- `.env.production` contiene las configuraciones de producción
- `start.sh` es el script de inicio del backend
- `.htaccess` maneja las rutas de React y CORS
- `uploads/` directorio para archivos subidos por usuarios
