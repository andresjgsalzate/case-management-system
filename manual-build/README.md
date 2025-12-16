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

✅ **Backend compilado correctamente** (TypeScript → JavaScript)  
✅ **Frontend compilado correctamente** (React/Vite → archivos estáticos)  
✅ **Archivos de configuración copiados**  
✅ **Scripts de inicio creados**

## Configuración de Apache

### 1. Configurar Virtual Host

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /ruta/a/manual-build/public

    # Proxy para API del backend
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    # Configuración de archivos estáticos
    <Directory "/ruta/a/manual-build/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 2. Módulos requeridos de Apache

```bash
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo systemctl restart apache2
```

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

1. **Frontend**: http://tu-dominio.com
2. **Backend Health**: http://tu-dominio.com/api/health
3. **Logs del backend**: `sudo journalctl -u case-management -f`

## Troubleshooting

- Si el backend no inicia, verifica las variables de entorno en .env.production
- Si el frontend no carga rutas, verifica que mod_rewrite esté habilitado
- Si hay errores de CORS, verifica la configuración de proxy en Apache

## Archivos importantes

- `.env.production` contiene las configuraciones de producción
- `start.sh` es el script de inicio del backend
- `.htaccess` maneja las rutas de React y CORS
- `uploads/` directorio para archivos subidos por usuarios
