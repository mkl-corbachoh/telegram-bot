# Telegram Bot con Docker Compose

Este proyecto es un bot de Telegram desarrollado en Node.js, preparado para ejecutarse fácilmente en entornos locales o de producción utilizando Docker y Docker Compose.

## Estructura del Proyecto

```
telegram-bot/
│
├── app/
│   ├── bot.js                # Código principal del bot
│   ├── package.json          # Dependencias y scripts de Node.js
│   ├── Dockerfile            # Imagen Docker para el bot
│   ├── docker-compose.yml    # Orquestación de servicios en desarrollo
│   ├── config/
│   │   └── config.js         # Configuración de la aplicación
│   ├── data/                 # Carpeta para datos persistentes
│   ├── modules/              # Módulos funcionales del bot
│   └── utils/                # Utilidades y helpers
│
├── docker/
│   ├── docker-compose.yml        # Compose base
│   ├── docker-compose.prod.yml   # Compose para producción
│   ├── mysql/
│   │   ├── init-db.sql           # Script de inicialización de la base de datos
│   │   └── init-db.template      # Plantilla de inicialización
│   └── node/
│       └── dockerfile            # Dockerfile alternativo para Node.js
│
└── README.md
```

## Uso con Docker Compose

### 1. Requisitos previos
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Comandos básicos

#### Desarrollo
Desde la carpeta raíz del proyecto:

```powershell
cd app
# Construir y levantar los servicios
docker compose up --build
```

#### Producción
Desde la carpeta `docker/`:

```powershell
cd docker
# Usar el archivo de producción
docker compose -f docker-compose.prod.yml up --build -d
```

### 3. Variables de entorno
Configura tus variables de entorno en los archivos correspondientes (`.env` o directamente en los archivos de configuración).

### 4. Persistencia de datos
La carpeta `data/` y los volúmenes de Docker aseguran que los datos importantes no se pierdan al reiniciar los contenedores.

---

Para más detalles sobre la configuración de módulos, base de datos o personalización, revisa los archivos dentro de cada carpeta o contacta al mantenedor del proyecto.
