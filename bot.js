require("dotenv").config();
const express = require("express");
//const TelegramBot = require("node-telegram-bot-api");
const { Telegraf } = require('telegraf');

const TOKEN = process.env.TELEGRAM_TOKEN;
//const bot = new TelegramBot(TOKEN, { polling: false });

const bot = new Telegraf('TU_TOKEN_AQUI');
// Para que no use pooling  el bot de teleggram porque consume mas recursos
bot.telegram.setWebhook('https://mikorh.ddns.net/webhook');

// Iniciamos la base de datos
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.HOST,
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

// Endpoint del bot
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

// Telegraf
bot.start((ctx) => ctx.reply('¡Bienvenido! 🤖'));
bot.help((ctx) => ctx.reply('Comandos disponibles: /start, /help, /info'));

bot.command('info', (ctx) => {
    ctx.reply(`Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
});

bot.launch();
console.log('Bot iniciado 🚀');

// Telegrgam normal
//app.post(`/bot${TOKEN}`, (req, res) => {
//    bot.processUpdate(req.body);
//    res.sendStatus(200);
//});

//bot.on("message", (msg) => {
//    bot.sendMessage(msg.chat.id, "Hola! Soy tu bot de Telegram 🤖");
//});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot escuchando en http://localhost:${PORT}`);
});
