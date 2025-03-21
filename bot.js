const config = require("./config/config");
const fs = require("fs");
const path = require("path");
const express = require("express");

// Modulos propios.
const getWeather = require("./modules/weather");
const { replyAndClose } = require("./utils/reply");
const { isUserAuthorized } = require("./utils/db");
const { getStages, getStageDetails } = require("./modules/etapas");

const authorizedUsers = new Set(); // Caché en memoria

//const TelegramBot = require("node-telegram-bot-api");
//const bot = new TelegramBot(TOKEN, { polling: false });

const { Telegraf } = require('telegraf');
const TOKEN = config.botToken;
const bot = new Telegraf(TOKEN);
// Para que no use pooling  el bot de teleggram porque consume mas recursos
bot.telegram.setWebhook('https://mikorh.ddns.net/webhook');

// ------ Iniciamos la base de datos ------ // 
// const mysql = require('mysql2');
// const connection = mysql.createConnection({
//     host: config.hostDb,
//     user: config.userDb,
//     password: config.passDb,
//     database: config.database
// });
// connection.connect(err => {
//     if (err) {
//         console.error('Error conectando a la DB:', err);
//         process.exit(1); // Detener la ejecución
//     }
//     console.log('Conectado a MariaDB ✅');
// });
// ------------------------------------ //

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
    const isAuthorized = await isUserAuthorized(userId);

    if (authorizedUsers.has(userId)) {
        return next(); // Si el usuario ya está en caché, no consultamos la DB
    }

    if (!isAuthorized) {
        return ctx.reply("❌ No tienes permiso para usar este bot.");
    }

    return next(); // Si está autorizado, continúa con el siguiente middleware
});
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

bot.action('profile', (ctx) => replyAndClose(ctx, `Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`));
bot.action('help', (ctx) => replyAndClose(ctx, "Comandos disponibles: /start, /help, /info"));
bot.action('weather', async (ctx) => {
    try {
        const msg = await getWeather("Santiago de Compostela");
        replyAndClose(ctx, msg);
    } catch (error) {
        console.error("Error obteniendo el clima:", error);
        replyAndClose(ctx, "Hubo un error al obtener el clima.");
    }
});

bot.action('booking', (ctx) => {
    // var reservasList = [];
    try{
        fs.readdir(config.reservasPath, (err, files) => {
            if (err) {
                console.error("Error al leer la carpeta:", err);
                return ctx.reply("Hubo un error al acceder a las reservas.");
            }
            
            const pdfs = files.filter(file => file.endsWith(".pdf"));
            
            if (pdfs.length === 0) {
                return ctx.reply("No hay archivos PDF disponibles.");
            }
            // Crear botones para cada reserva 
            const buttons = pdfs.map(file => [{ text: file, callback_data: `download_${file}` }]);
            
            ctx.reply("Selecciona una reserva para descargar:", {
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
            ctx.editMessageReplyMarkup(null); // Cierra el menú
        });
    } catch (error) {
        console.error("Error al obtener las reservas:", error);
        ctx.reply("Hubo un error al obtener las reservas.");
    }
});

// Acción para descargar un PDF
bot.action(/^download_(.+)$/, (ctx) => {
    const fileName = ctx.match[1];
    const filePath = path.join(config.reservasPath, fileName);

    if (!fileName.endsWith(".pdf") || !fs.existsSync(filePath)) {
        return ctx.reply("El archivo solicitado no es válido o ya no está disponible.");
    }

    try {
        ctx.replyWithDocument({ source: filePath });
        ctx.editMessageReplyMarkup(null); // Cierra el menú
    } catch (error) {
        console.error("Error al enviar el archivo:", error);
        ctx.reply("Hubo un error al enviar el archivo.");
    }
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

// Comando para listar las etapas
bot.command("stages", async (ctx) => {
    const stages = await getStages();

    if (stages.length === 0) {
        return ctx.reply("No hay etapas registradas.");
    }

    // Crear botones para cada etapa
    const buttons = stages.map(stage => [{ text: stage.name, callback_data: `stage_${stage.id}` }]);

    ctx.reply("Selecciona una etapa para ver más información:", {
        reply_markup: { inline_keyboard: buttons }
    });
});
// Acción al seleccionar una etapa
bot.action(/^stage_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    const stage = await getStageDetails(id);

    if (!stage) {
        return ctx.reply("❌ No se encontró la información de esta etapa.");
    }

    let msg = `📍 *${stage.name}*\n`;
    msg += `📏 *Distancia:* ${stage.distance_km} km\n`;
    msg += `⏳ *Duración estimada:* ${stage.hours_duration} horas\n`;
    msg += `📝 *Descripción:* ${stage.description}\n`;

    if (stage.enlace_maps) {
        msg += `🗺 [Ver ruta en Google Maps](${stage.maps_link})`;
    }

    ctx.replyWithMarkdown(msg);
});

// lanzamos el bot.
// bot.launch(); //  No es necesario porque usamos webhooks
console.log('Bot iniciado 🚀');

// Escuchamos en el puerto 3000
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`Bot escuchando en http://localhost:${PORT}`);
});

