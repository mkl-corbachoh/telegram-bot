const config = require("./config/config");
const express = require("express");

// Controladores
const userController = require("./controller/userController");
const menuController = require("./controller/menuController");
const recommendationsController = require("./controller/recommendationsController");
const weatherController = require("./controller/weatherController");
const bookingController = require("./controller/bookingController");
const stageController = require("./controller/stageController");
const documentController = require("./controller/documentController");

const authorizedUsers = new Set(); // Caché en memoria

const { Telegraf } = require('telegraf');
const TOKEN = config.botToken;
const URL = config.baseUrl;
const bot = new Telegraf(TOKEN);
// Para que no use pooling  el bot de telegram porque consume mas recursos
bot.telegram.setWebhook(URL+'/webhook');

// Endpoint del bot
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/webhook')); // Usa webhooks en vez de pooling

// Telegraf
bot.use(async (ctx,next) => {
    // Si el mensaje NO es un comando, dejarlo pasar sin verificar permisos
    if (!ctx.message || !ctx.message.text || !ctx.message.text.startsWith("/")) {
        return next();
    }

    const userId = ctx.from.id;

    if (authorizedUsers.has(userId)) {
        return next(); // Si el usuario ya está en caché, no consultamos la DB
    }

    const { isUserAuthorized } = require("./utils/db");
    const isAuthorized = await isUserAuthorized(userId);

    if (!isAuthorized && ctx.message.text === '/register') {
        return next(); // Permitir el comando /register sin autorización previa
    }

    if (!isAuthorized) {
        return ctx.reply("❌ No tienes permiso para usar este bot.");
    }

    // Si está autorizado, lo agregamos a la caché
    authorizedUsers.add(userId);
    return next(); // Si está autorizado, continúa con el siguiente middleware
});

// Comandos y acciones delegados a controladores
bot.start(userController.start);
bot.command('info', userController.info);
bot.command('register', userController.register);
bot.help(userController.help);
bot.command('menu', menuController.showMenu);
bot.action('menu', menuController.showMenu);
// bot.action('recommendations', recommendationsController.showRecommendationsMenu);
// bot.action('recommend_restaurants', recommendationsController.setRecommendationType('restaurants'));
// bot.action('recommend_events', recommendationsController.setRecommendationType('events'));
// bot.on('location', recommendationsController.handleLocation);
bot.action('close', menuController.closeMenu);
bot.action('profile', menuController.showProfile);
bot.action('help', menuController.showHelpAction);

// Clima
bot.action('weather', weatherController.askForLocation);
bot.action('weather_travel', weatherController.showWeatherTravel);
bot.on('location', weatherController.showWeatherByCoordinates);

// Reservas
bot.action('booking', bookingController.showBookings);
bot.action(/^booking_(\d+)$/, bookingController.showBookingDetails);
bot.action(/^download_(.+)$/, bookingController.downloadBookingPDF);

// Documentos
bot.on('document', documentController.onDocument);

// Etapas
bot.action('stages', stageController.showStagesMenu);
bot.action('stages_rute', stageController.showStagesRute);
bot.action('stages_travel', stageController.showStagesTravel);
bot.action(/^stage_(\d+)$/, stageController.showStageDetails);

console.log('Bot iniciado 🚀');

// Escuchamos en el puerto 3000
const PORT = config.port || 3000;
const HOST = config.host || 'localhost';
app.listen(PORT, () => {
    console.log(`Bot escuchando en ${HOST}:${PORT}`);
});

// Healthcheck endpoint para Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
