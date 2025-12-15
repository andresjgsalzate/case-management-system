# 📖 GUÍA DEFINITIVA: Publicar en Apache

## 🎯 **RESUMEN RÁPIDO**

Esta es la guía más fácil y completa para publicar tu sistema Case Management en Apache. Solo sigue los pasos en orden.

---

## ✅ **ANTES DE EMPEZAR - CHECKLIST**

### 1. **Requisitos del Servidor**

- [ ] Apache instalado y funcionando
- [ ] Node.js instalado (versión 18+)
- [ ] PostgreSQL instalado y configurado
- [ ] Dominio configurado (opcional, puedes usar IP)

### 2. **Módulos de Apache necesarios**

```bash
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo systemctl restart apache2
```

---

## 🔧 **PASO 1: CONFIGURAR ANTES DEL BUILD**

### **Backend - Editar configuración de producción**

```bash
# 1. Ir al directorio del proyecto
cd /ruta/a/tu/proyecto/backend

# 2. Copiar plantilla de producción
cp .env.production.example .env.production

# 3. Editar configuración (IMPORTANTE!)
nano .env.production
```

**Edita estos valores en `.env.production`:**

```env
# Base de datos (cambiar por tus datos reales)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=tu_usuario_postgres
DB_PASSWORD=TU_PASSWORD_SUPER_SEGURO
DB_DATABASE=case_management_prod

# Seguridad (GENERAR CLAVES NUEVAS!)
JWT_SECRET=GENERAR_CLAVE_ULTRA_SEGURA_64_CARACTERES_MINIMO
JWT_REFRESH_SECRET=GENERAR_OTRA_CLAVE_ULTRA_SEGURA_64_CARACTERES_MINIMO

# CORS (cambiar por tu dominio)
CORS_ORIGIN=http://tu-dominio.com,https://tu-dominio.com

# Email (si necesitas notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
EMAIL_FROM=noreply@tu-dominio.com
```

**💡 Para generar claves seguras:**

```bash
# Backend tiene un generador automático
cd backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Frontend - Editar configuración de producción**

```bash
# 1. Ir al directorio frontend
cd ../frontend

# 2. Copiar plantilla
cp .env.production.example .env.production

# 3. Editar configuración
nano .env.production
```

**Edita estos valores en `.env.production`:**

```env
# Cambiar por tu dominio real
VITE_BACKEND_URL=http://tu-dominio.com

# Si NO tienes dominio, usa la IP:
# VITE_BACKEND_URL=http://203.0.113.10:3000
```

---

## 🚀 **PASO 2: EJECUTAR BUILD**

```bash
# Volver al directorio raíz del proyecto
cd ..

# Ejecutar build (esto hace TODO automáticamente)
./build-for-apache.sh
```

**El script hace todo automáticamente:**

- ✅ Verifica configuraciones
- ✅ Instala dependencias
- ✅ Compila backend y frontend
- ✅ Crea estructura para Apache
- ✅ Genera archivos de configuración

**Resultado:** Carpeta `apache-build/` lista para usar.

---

## 🌐 **PASO 3: CONFIGURAR APACHE**

### **Crear Virtual Host**

```bash
# Crear archivo de configuración
sudo nano /etc/apache2/sites-available/case-management.conf
```

### **Configuración para Opción A (Estructura Simple):**

```apache
<VirtualHost *:80>
    # Cambiar por tu dominio
    ServerName tu-dominio.com

    # Ruta donde copiaste apache-build/public
    DocumentRoot /var/www/case-management/public

    # Proxy para la API (backend)
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    # Configuración de archivos estáticos
    <Directory "/var/www/case-management/public">
        AllowOverride All
        Require all granted
    </Directory>

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/case-management-error.log
    CustomLog ${APACHE_LOG_DIR}/case-management-access.log combined
</VirtualHost>
```

### **Configuración para Opción B (Estructura Estándar):**

```apache
<VirtualHost *:80>
    # Cambiar por tu dominio
    ServerName tu-dominio.com

    # Frontend servido desde /var/www/html
    DocumentRoot /var/www/html

    # Proxy para la API (backend corre desde /opt/)
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    # Configuración de archivos estáticos del frontend
    <Directory "/var/www/html">
        AllowOverride All
        Require all granted

        # Configuración para SPA (Single Page Application)
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/case-management-error.log
    CustomLog ${APACHE_LOG_DIR}/case-management-access.log combined
</VirtualHost>
```

### **Activar sitio**

```bash
# Habilitar el sitio
sudo a2ensite case-management

# Deshabilitar sitio por defecto (opcional)
sudo a2dissite 000-default

# Reiniciar Apache
sudo systemctl restart apache2
```

---

## 📁 **PASO 4: COPIAR ARCHIVOS AL SERVIDOR**

### **Opción A: Estructura Simple (Todo en /var/www/)**

```bash
# Crear directorio en el servidor
sudo mkdir -p /var/www/case-management
sudo chown -R $USER:www-data /var/www/case-management

# Copiar archivos del build
cp -r apache-build/* /var/www/case-management/

# Ajustar permisos
sudo chown -R www-data:www-data /var/www/case-management
sudo chmod -R 755 /var/www/case-management
sudo chmod -R 777 /var/www/case-management/backend/uploads
```

### **Opción B: Estructura Estándar Linux (Recomendada para producción)**

```bash
# === FRONTEND (archivos estáticos para Apache) ===
sudo mkdir -p /var/www/html
sudo cp -r apache-build/public/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# === BACKEND (aplicación Node.js) ===
sudo mkdir -p /opt/case-management
sudo cp -r apache-build/backend /opt/case-management/
sudo chown -R node:node /opt/case-management/backend/

# === DATOS VARIABLES (uploads, logs, backups) ===
sudo mkdir -p /var/opt/case-management/{uploads,logs,backups}
sudo chown -R node:node /var/opt/case-management/

# === ENLACES SIMBÓLICOS (conectar datos con aplicación) ===
sudo ln -sf /var/opt/case-management/uploads /opt/case-management/backend/uploads
sudo ln -sf /var/opt/case-management/logs /opt/case-management/backend/logs
```

### **Explicación de ubicaciones estándar:**

- **`/var/www/html/`** → Frontend (archivos estáticos servidos por Apache)
- **`/opt/case-management/backend/`** → Aplicación backend (binarios y código)
- **`/var/opt/case-management/`** → Datos variables (uploads, logs, configuraciones)

### **Ventajas de la estructura estándar:**

✅ Separación clara entre aplicación y datos  
✅ Fácil backup (solo `/var/opt/case-management/`)  
✅ Mejor seguridad (permisos específicos por directorio)  
✅ Cumple estándares FHS (Filesystem Hierarchy Standard)  
✅ Facilita actualizaciones sin perder datos

### **¿Qué opción elegir?**

- **Opción A** → Para desarrollo, testing o servidores simples
- **Opción B** → Para producción, servidores empresariales o múltiples aplicaciones

---

## 🗄️ **PASO 5: CONFIGURAR BASE DE DATOS**

```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear base de datos de producción
CREATE DATABASE case_management_prod;
CREATE USER tu_usuario_postgres WITH PASSWORD 'TU_PASSWORD_SUPER_SEGURO';
GRANT ALL PRIVILEGES ON DATABASE case_management_prod TO tu_usuario_postgres;
\q
```

**Importar datos (si tienes backup):**

```bash
# Si tienes un backup de desarrollo
pg_dump case_management > backup_dev.sql
psql -U tu_usuario_postgres -d case_management_prod -f backup_dev.sql
```

---

## ⚡ **PASO 6: INICIAR BACKEND**

### **Si usaste Opción A (Estructura Simple)**

#### **Manual (para pruebas):**

```bash
cd /var/www/case-management/backend
./start.sh
```

#### **Como servicio (recomendado):**

```bash
# Crear servicio
sudo nano /etc/systemd/system/case-management.service
```

**Contenido del servicio (Opción A):**

```ini
[Unit]
Description=Case Management Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/case-management/backend
ExecStart=/var/www/case-management/backend/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### **Si usaste Opción B (Estructura Estándar)**

#### **Manual (para pruebas):**

```bash
cd /opt/case-management/backend
./start.sh
```

#### **Como servicio (recomendado):**

```bash
# Crear servicio
sudo nano /etc/systemd/system/case-management.service
```

**Contenido del servicio (Opción B):**

```ini
[Unit]
Description=Case Management Backend
After=network.target postgresql.service

[Service]
Type=simple
User=node
Group=node
WorkingDirectory=/opt/case-management/backend
ExecStart=/opt/case-management/backend/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=HOME=/opt/case-management/backend

# Limites de recursos (opcional pero recomendado)
LimitNOFILE=65536
LimitNPROC=4096

# Configuración de logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=case-management

[Install]
WantedBy=multi-user.target
```

### **Crear usuario node (solo para Opción B):**

```bash
# Crear usuario del sistema para Node.js (más seguro)
sudo useradd --system --shell /bin/false --home /opt/case-management --create-home node

# Ajustar permisos después de crear el usuario
sudo chown -R node:node /opt/case-management/
sudo chown -R node:node /var/opt/case-management/
```

### **Activar servicio (ambas opciones):**

```bash
sudo systemctl daemon-reload
sudo systemctl enable case-management
sudo systemctl start case-management

# Ver estado
sudo systemctl status case-management

# Ver logs en tiempo real
sudo journalctl -u case-management -f
```

### **Comandos útiles para el servicio:**

```bash
# Reiniciar servicio
sudo systemctl restart case-management

# Parar servicio
sudo systemctl stop case-management

# Ver logs
sudo journalctl -u case-management --no-pager

# Ver estado detallado
sudo systemctl status case-management -l
```

---

## ✅ **PASO 7: VERIFICAR TODO FUNCIONA**

### **1. Verificar Backend**

```bash
# Debe responder con información del sistema
curl http://127.0.0.1:3000/api/health
```

### **2. Verificar Apache**

```bash
# Debe mostrar la página de la aplicación
curl http://tu-dominio.com
```

### **3. Verificar API a través de Apache**

```bash
# Debe responder con información del sistema
curl http://tu-dominio.com/api/health
```

### **4. Abrir en navegador**

- Ve a: `http://tu-dominio.com`
- Debe cargar la aplicación completa

---

## 🔧 **TROUBLESHOOTING**

### **Frontend no carga**

#### **Para Opción A (Estructura Simple):**

```bash
# Verificar permisos
sudo chmod -R 755 /var/www/case-management/public
sudo chown -R www-data:www-data /var/www/case-management/public

# Verificar que existen los archivos
ls -la /var/www/case-management/public/
cat /var/www/case-management/public/index.html

# Verificar .htaccess
cat /var/www/case-management/public/.htaccess
```

#### **Para Opción B (Estructura Estándar):**

```bash
# Verificar permisos del frontend
sudo chmod -R 755 /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

# Verificar que existen los archivos
ls -la /var/www/html/
cat /var/www/html/index.html

# Verificar .htaccess
cat /var/www/html/.htaccess
```

#### **Verificaciones comunes (ambas opciones):**

```bash
# Verificar mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Ver logs de Apache
sudo tail -f /var/log/apache2/case-management-error.log
sudo tail -f /var/log/apache2/error.log

# Verificar configuración de Apache
sudo apache2ctl configtest
sudo systemctl status apache2

# Verificar Virtual Host activo
sudo a2ensite case-management
sudo a2dissite 000-default
sudo systemctl reload apache2

# Probar acceso directo
curl -I http://localhost/
curl -I http://tu-dominio.com/
```

### **Backend no inicia**

#### **Para Opción A (Estructura Simple):**

```bash
# Ver logs del servicio
sudo journalctl -u case-management -f

# Verificar configuración
cd /var/www/case-management/backend
cat .env.production

# Verificar permisos
ls -la /var/www/case-management/backend/

# Probar manualmente
sudo -u www-data ./start.sh
```

#### **Para Opción B (Estructura Estándar):**

```bash
# Ver logs del servicio
sudo journalctl -u case-management -f

# Verificar configuración
cd /opt/case-management/backend
cat .env.production

# Verificar permisos
ls -la /opt/case-management/backend/
ls -la /var/opt/case-management/

# Probar manualmente
sudo -u node ./start.sh

# Verificar enlaces simbólicos
ls -la uploads/
ls -la logs/
```

#### **Problemas comunes:**

```bash
# Error de permisos en uploads
sudo chmod -R 755 /var/opt/case-management/uploads
sudo chown -R node:node /var/opt/case-management/

# Error de Node.js no encontrado
which node
sudo ln -sf $(which node) /usr/local/bin/node

# Error de puerto ocupado
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000
```

### **Error de base de datos**

```bash
# Verificar conexión
sudo -u postgres psql -c "SELECT version();"

# Verificar permisos del usuario
sudo -u postgres psql -c "\\du tu_usuario_postgres"
```

### **Error de CORS**

- Verifica que `CORS_ORIGIN` en `.env.production` incluya tu dominio
- Reinicia el backend después de cambios

---

## 📋 **CHECKLIST FINAL**

- [ ] ✅ Configuraciones editadas (.env.production en ambos)
- [ ] ✅ Build ejecutado sin errores (./build-for-apache.sh)
- [ ] ✅ Apache configurado y Virtual Host activo
- [ ] ✅ Archivos copiados a /var/www/case-management/
- [ ] ✅ Base de datos creada y configurada
- [ ] ✅ Backend corriendo (servicio activo)
- [ ] ✅ Frontend accesible desde navegador
- [ ] ✅ API respondiendo a través de Apache

---

## 🎉 **¡LISTO!**

Tu aplicación Case Management está ahora funcionando en Apache de forma profesional.

**URLs importantes:**

- **Aplicación:** http://tu-dominio.com
- **API Health:** http://tu-dominio.com/api/health
- **Logs Backend:** `sudo journalctl -u case-management -f`
- **Logs Apache:** `sudo tail -f /var/log/apache2/case-management-error.log`

### **Para actualizaciones futuras:**

#### **Opción A (Estructura Simple):**

1. Haz cambios en tu código
2. Ejecuta `./build-for-apache.sh`
3. Copia `apache-build/*` a `/var/www/case-management/`
4. Reinicia: `sudo systemctl restart case-management`

#### **Opción B (Estructura Estándar):**

1. Haz cambios en tu código
2. Ejecuta `./build-for-apache.sh`
3. Actualizar frontend: `sudo cp -r apache-build/public/* /var/www/html/`
4. Actualizar backend: `sudo cp -r apache-build/backend/* /opt/case-management/backend/`
5. Reiniciar backend: `sudo systemctl restart case-management`

### **Script de actualización automática (Opción B):**

```bash
# Crear script de actualización
sudo nano /usr/local/bin/update-case-management.sh
```

**Contenido del script:**

```bash
#!/bin/bash
set -e

echo "🔄 Actualizando Case Management System..."

# Variables
PROJECT_DIR="/ruta/a/tu/proyecto"
FRONTEND_DIR="/var/www/html"
BACKEND_DIR="/opt/case-management/backend"

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR"

# Hacer build
echo "📦 Ejecutando build..."
./build-for-apache.sh

# Parar backend
echo "⏸️  Parando backend..."
sudo systemctl stop case-management

# Actualizar frontend
echo "🎨 Actualizando frontend..."
sudo cp -r apache-build/public/* "$FRONTEND_DIR/"
sudo chown -R www-data:www-data "$FRONTEND_DIR/"

# Actualizar backend (preservando datos)
echo "⚙️  Actualizando backend..."
sudo cp -r apache-build/backend/* "$BACKEND_DIR/"
sudo chown -R node:node "$BACKEND_DIR/"

# Asegurar enlaces simbólicos
sudo ln -sf /var/opt/case-management/uploads "$BACKEND_DIR/uploads"
sudo ln -sf /var/opt/case-management/logs "$BACKEND_DIR/logs"

# Reiniciar backend
echo "▶️  Reiniciando backend..."
sudo systemctl start case-management
sudo systemctl status case-management

echo "✅ Actualización completada!"
```

**Hacer ejecutable:**

```bash
sudo chmod +x /usr/local/bin/update-case-management.sh
```

**Uso:**

```bash
sudo update-case-management.sh
```
