const config = require("./config/config");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");

// Modulos propios.
const getWeather = require("./modules/weather");        // Modulo para obtener el clima
const { replyAndClose } = require("./utils/reply");     // Modulo para responder y cerrar el menú
const { isUserAuthorized } = require("./utils/db");     // Modulo para verificar si el usuario está autorizado
const { getStages, getStageDetails } = require("./modules/stages"); // Modulo para obtener las etapas   
const { getBookingList, getBookingDetails } = require("./modules/hostals"); // Modulo para obtener las reservas
const messages = require("./utils/messages");           // Modulo para los mensajes de error/éxito

const authorizedUsers = new Set(); // Caché en memoria

const { Telegraf } = require('telegraf');
const TOKEN = config.botToken;
const bot = new Telegraf(TOKEN);
// Para que no use pooling  el bot de teleggram porque consume mas recursos
bot.telegram.setWebhook('https://mikorh.ddns.net/webhook');

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
        ctx.reply(ctx, "Hubo un error al obtener el clima.");
    }
});

bot.action('booking', (ctx) => {
    // var reservasList = [];
    try{

        const bookings=  getBookingList();

        if (bookings.length === 0) {
            return ctx.reply(messages.noBookings);
        }

        // Crear botones para cada reserva
        const buttons = bookings.map(booking => [
            { text: `${booking.hostel_name} (${booking.check_in} - ${booking.check_out})`, callback_data: `booking_${booking.id}` }
        ]);
        buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);

        replyAndClose("Selecciona una reserva para ver más información:", {
            reply_markup: { inline_keyboard: buttons }
        });

    } catch (error) {
        console.error("Error al obtener las reservas:", error);
        ctx.reply("hubo un error al obtener las reservas.");
    }
});

// Acción para mostrar detalles de una reserva
bot.action(/^booking_(\d+)$/, async (ctx) => {
    const bookingId = ctx.match[1];

    try {
        // Consultar los detalles de la reserva
        const booking = await getBookingDetails(bookingId);

        if (!booking) {
            return ctx.reply(messages.bookingNotFound);
        }

        // Formatear el mensaje con los detalles de la reserva
        let msg = `🏨 *${booking.hostel_name}*\n\n`;
        msg += `📅 *Check-in:* ${booking.check_in}\n`;
        msg += `📅 *Check-out:* ${booking.check_out}\n`;
        msg += `📍 *Dirección:* ${booking.address || "No disponible"}\n`;
        msg += `📞 *Teléfono:* ${booking.phone || "No disponible"}\n`;
        msg += `📧 *Email:* ${booking.email || "No disponible"}\n`;
        msg += `📝 *Notas:* ${booking.notes || "Sin notas"}\n\n`;

        if (booking.pdf_path) {
            const bookingPdf = `./reservas/${booking.pdf_path}`;
            msg += `📄 *Reserva PDF:* [Descargar archivo](${bookingPdf})\n`;
        }

        ctx.replyWithMarkdown(msg);
        ctx.editMessageReplyMarkup(null); // Cierra el menú
    } catch (error) {
        console.error("Error al obtener los detalles de la reserva:", error);
        ctx.reply(messages.bookingDetailsError);
    }
});

// Acción para descargar un PDF
bot.action(/^download_(.+)$/, (ctx) => {
    const fileName = ctx.match[1];
    const filePath = path.join(config.reservasPath, fileName);

    if (!fileName.endsWith(".pdf") || !fs.existsSync(filePath)) {
        return ctx.reply(messages.invalidFile);
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
    ctx.reply("En estos momentos no puedo procesar documentos. Disculpa las molestias.");
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
        return ctx.reply(messages.noStages);
    }

    // Crear botones para cada etapa
    const buttons = stages.map(stage => [{ text: stage.name, callback_data: `stage_${stage.id}` }]);
    buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
    
    replyAndClose("Selecciona una etapa para ver más información:", {
        reply_markup: { inline_keyboard: buttons }
    });
});

// Acción al seleccionar una etapa
bot.action(/^stage_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    const stage = await getStageDetails(id);

    if (!stage) {
        return ctx.reply(messages.stageNotFound);
    }

    // let msg = `📍 *${stage.name}*\n\n`;
    // msg += `📏 *Distancia:* ${stage.distance_km} km\n\n`;
    // msg += `⏳ *Duración estimada:* ${stage.hours_duration} horas\n\n`;
    // msg += `📝 *Descripción:* ${stage.description}\n\n`;
    let msg = `📍 *${stage.name}*\n\n`;
    msg += `\`\`\`
    ┌───────────────────────────────┐
    │         Información           │
    ├───────────────────────────────┤
    │ 📏 Distancia: ${stage.distance_km} km       │
    │ ⏳ Duración: ${stage.hours_duration} horas │
    ├───────────────────────────────┤
    │ 📝 Descripción:               │
    │ ${stage.description}          │
    └───────────────────────────────┘
    \`\`\`\n`;
    
    if (stage.enlace_maps) {
        msg += `🗺 *Ruta en Google Maps:*\n[Haz clic aquí para ver la ruta](${stage.maps_link})`;
    }

    ctx.replyWithMarkdown(msg);
    ctx.editMessageReplyMarkup(null); // Cierra el menú
});

bot.action("close", (ctx) => ctx.editMessageReplyMarkup(null)); // Cierra el menú con el botón.

// lanzamos el bot.
// bot.launch(); //  No es necesario porque usamos webhooks
console.log('Bot iniciado 🚀');

// Escuchamos en el puerto 3000
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`Bot escuchando en http://localhost:${PORT}`);
});

