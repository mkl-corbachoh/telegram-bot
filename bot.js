const config = require("./config/config");
const fs = require("fs");
const path = require("path");
const express = require("express");

// Modulos propios.
const getWeather = require("./modules/weather");

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


bot.help((ctx) => ctx.reply('Comandos disponibles: /start, /help, /info, /menu'));

bot.command('menu', (ctx) => {
    ctx.reply('¿Qué te gustaría hacer?', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Ver perfil', callback_data: 'profile' }],
                [{ text: 'Clima', callback_data: 'weather' }],
                [{ text: 'Reservas', callback_data: 'booking' }],
                [{ text: 'Ver ayuda', callback_data: 'help' }],
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

bot.action('booking', (ctx) => {
    // var reservasList = [];
    fs.readdir(config.reservasPath, (err, files) => {
        if (err) {
            console.error("Error al leer la carpeta:", err);
            return ctx.reply("Hubo un error al acceder a las reservas.");
        }

        const pdfs = files.filter(file => file.endsWith(".pdf"));

        if (pdfs.length === 0) {
            return ctx.reply("No hay archivos PDF disponibles.");
        }
    });
    // Crear botones para cada reserva
    const botones = pdfs.map(file => [{ text: file, callback_data: `download_${file}` }]);

    ctx.reply("Selecciona una reserva para descargar:", {
        reply_markup: {
            inline_keyboard: botones
        }
    });
});

// Acción para descargar un PDF
bot.action(/^download_(.+)$/, (ctx) => {
    const fileName = ctx.match[1];
    const filePath = path.join(config.reservasPath, fileName);

    if (!fs.existsSync(filePath)) {
        return ctx.reply("El archivo ya no está disponible.");
    }

    ctx.replyWithDocument({ source: filePath });
});

bot.action("weather", async (ctx) => {
    const msg = await getWeather("Santiago de Compostela");
    ctx.reply(msg);
});

// Escucha de documentos
bot.on("document", async (ctx) => {
    ctx.reply("En estosmomentos no puedo procesar documentos. Disculpa las molestias.");
    /*
    const fileId = ctx.message.document.file_id;
    const file = await ctx.telegram.getFile(fileId);
    const filePath = file.file_path;
    const url = `https://api.telegram.org/file/bot${config.botToken}/${filePath}`;
    
    // Definir ruta donde se guardará el archivo
    const savePath = path.join(config.pdfPath, ctx.message.document.file_name);
    
    // Descargar el archivo
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(savePath, buffer);
    
    ctx.reply(`📄 Archivo guardado en el servidor: ${ctx.message.document.file_name}`);
    */
});


// lanzamos el bot.
bot.launch();
console.log('Bot iniciado 🚀');

// Escuchamos en el puerto 3000
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`Bot escuchando en http://localhost:${PORT}`);
});

