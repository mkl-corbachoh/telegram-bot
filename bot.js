require("dotenv").config();
const express = require("express");

//const TelegramBot = require("node-telegram-bot-api");
//const bot = new TelegramBot(TOKEN, { polling: false });

const { Telegraf } = require('telegraf');
const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);
// Para que no use pooling  el bot de teleggram porque consume mas recursos
bot.telegram.setWebhook('https://mikorh.ddns.net/webhook');

// ------ Iniciamos la base de datos ------ // 
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    password: process.env.PASS_DB,
    database: process.env.TLBOT_DB
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot escuchando en http://localhost:${PORT}`);
});

