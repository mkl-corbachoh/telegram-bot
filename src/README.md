# Docmuentacion Telegram BOT

```
📂 telegram-bot-camino
│── 📂 config           # Configuración (tokens, claves API, etc.)
│── 📂 data             # Datos estáticos (PDFs de reservas, rutas, etc.)
│── 📂 modules          # Módulos separados para distintas funcionalidades
│── 📂 utils            # Funciones auxiliares
│── 📜 bot.js           # Punto de entrada del bot
│── 📜 package.json     # Dependencias del proyecto
│── 📜 README.md        # Documentación del proyecto
```

- config/ → Guarda claves API en un archivo .env y usa dotenv para cargarlas.
- data/ → Almacena PDFs de reservas y archivos JSON con rutas.
- modules/ → Divide funciones en archivos como weather.js, routes.js, pdf_manager.js.
- utils/ → Funciones auxiliares, como formateo de mensajes o manejo de errores.
- bot.js → Punto de entrada que importa y ejecuta los módulos.

### Funciones principales del bot

#### 📂 1. Gestión de PDFs de reservas

- Opción para subir o listar los PDFs almacenados en el servidor.
- Comando /reserva para enviar el PDF de la reserva de ese día.

#### 🌤 2. Consulta del clima

- Integración con la API de OpenWeather o MeteoBlue.
- Comando /clima para ver el pronóstico de la etapa actual.

#### 📍 3. Información de rutas

- JSON con rutas y fechas.
- Comando /ruta para obtener detalles del tramo del día.

#### 🧠 4. Integración de IA gratuita

- Puedes usar OpenAI Free Tier o Hugging Face API para obtener recomendaciones de puntos de interés.
- Comando /recomienda para sugerencias de qué visitar o dónde comer en la etapa.
