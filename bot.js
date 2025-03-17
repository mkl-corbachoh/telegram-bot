const config = require("./config/config");
const getWeather = require("./modules/weather");
const express = require("express");

//const TelegramBot = require("node-telegram-bot-api");
//const bot = new TelegramBot(TOKEN, { polling: false });

const { Telegraf } = require('telegraf');
const TOKEN = config.botToken;
const bot = new Telegraf(TOKEN);
// Para que no use pooling  el bot de teleggram porque consume mas recursos
bot.telegram.setWebhook('https://mikorh.ddns.net/webhook');

// ------ Iniciamos la base de datos ------ // 
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: config.hostDb,
    user: config.userDb,
    password: config.passDb,
    database: config.database
});
connection.connect(err => {
    if (err) {
        console.error('Error conectando a la DB:', err);
        return;
    }
    console.log('Conectado a MariaDB ✅');
});
// ------------------------------------ //

// Endpoint del bot
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/webhook')); // Usa webhooks en vez de pooling

// Telegraf
bot.start((ctx) => ctx.reply('¡Bienvenido! 🤖'));
bot.command('info', (ctx) => {
    ctx.reply(`Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
});

bot.command("clima", async (ctx) => {
    const msg = await getWeather("Santiago de Compostela");
    ctx.reply(msg);
});

bot.help((ctx) => ctx.reply('Comandos disponibles: /start, /help, /info'));

bot.command('menu', (ctx) => {
    ctx.reply('¿Qué te gustaría hacer?', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Ver perfil', callback_data: 'profile' }],
                [{ text: 'Ver ayuda', callback_data: 'help' }]
            ]
        }
    });
});

bot.action('profile', (ctx) => {
    ctx.reply(`Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
});

bot.action('help', (ctx) => {
    ctx.reply('Comandos disponibles: /start, /help, /info')
});


bot.launch();
console.log('Bot iniciado 🚀');

// Escuchamos en el puerto 3000
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`Bot escuchando en http://localhost:${PORT}`);
});

