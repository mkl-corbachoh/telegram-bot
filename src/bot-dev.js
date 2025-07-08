const { format } = require("date-fns");
const { es } = require("date-fns/locale");
const config = require("./config/config");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");

// Modulos propios.
const {getWeather, getWeatherByCoordinates} = require("./modules/weather");        // Modulo para obtener el clima
const { replyAndClose } = require("./utils/reply");     // Modulo para responder y cerrar el menú
const { isUserAuthorized } = require("./utils/db");     // Modulo para verificar si el usuario está autorizado
const { getStagesTravel, getStagesRute, getStageDetails } = require("./modules/stages"); // Modulo para obtener las etapas   
const { getBookingList, getBookingDetails } = require("./modules/hostels"); // Modulo para obtener las reservas

const messages = require("./utils/messages");           // Modulo para los mensajes de error/éxito
const menu = require("./utils/menu_buttons");           // Modulo para las botoneras de menu

const authorizedUsers = new Set(); // Caché en memoria

const { Telegraf } = require('telegraf');
const TOKEN = config.botToken;
const bot = new Telegraf(TOKEN);

// Express app para healthcheck en desarrollo
const app = express();
app.use(express.json());

// Healthcheck endpoint para Docker/dev
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- MODO POLLING PARA DESARROLLO LOCAL ---
bot.launch();

// Telegraf
bot.use(async (ctx,next) => {
    if (!ctx.message || !ctx.message.text || !ctx.message.text.startsWith("/")) {
        return next();
    }
    const userId = ctx.from.id;
    const isAuthorized = await isUserAuthorized(userId);
    if (authorizedUsers.has(userId)) {
        return next();
    }
    if (!isAuthorized) {
        return ctx.reply("❌ No tienes permiso para usar este bot.");
    }
    return next();
});
bot.start((ctx) => ctx.reply('¡Bienvenido! 🤖',menu.print_menu));
bot.command('info', (ctx) => {
    ctx.reply(`Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
});
bot.help((ctx) => ctx.reply('Comandos disponibles: /start, /help, /info, /menu'));
bot.command('menu', (ctx) => {
    ctx.reply('¿Qué te gustaría hacer?', menu.print_menu);
});
bot.action('menu', (ctx) => {
    ctx.editMessageReplyMarkup(null);
    ctx.reply('¿Qué te gustaría hacer?', menu.print_menu);
});
bot.action("close", (ctx) => ctx.editMessageReplyMarkup(null));
bot.action('profile', (ctx) => replyAndClose(ctx, `Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`));
bot.action('help', (ctx) => replyAndClose(ctx, "Comandos disponibles: /start, /help, /info, /menu"));
bot.action('weather', async (ctx) => {
    ctx.reply('Por favor, comparte tu ubicación para obtener el clima actual:', {
        reply_markup: {
            keyboard: [
                [{ text: '📍 Enviar mi ubicación', request_location: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});
bot.action('weather_travel', async (ctx) => {
    try {
        const msg = await getWeather("Santiago de Compostela");
        replyAndClose(ctx, msg);
    } catch (error) {
        console.error("Error obteniendo el clima:", error);
        ctx.reply(ctx, "Hubo un error al obtener el clima.");
    }
});
bot.on('location', async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    try {
        const weather = await getWeatherByCoordinates(latitude, longitude);
        ctx.replyWithMarkdown(`🌤 El clima en tu ubicación actual es:\n\n${weather}`, menu.back_menu);
    } catch (error) {
        console.error('Error al obtener el clima:', error);
        ctx.reply('❌ Hubo un error al obtener el clima. Por favor, inténtalo de nuevo más tarde.');
    }
});
bot.action('booking', async (ctx) => {
    try{
        const bookings = await getBookingList();
        if (bookings.length === 0) {
            return ctx.reply(messages.noBookings, menu.back_menu);
        }
        ctx.editMessageReplyMarkup(null);
        const buttons = bookings.map(booking => {
            const checkIn = format(new Date(booking.check_in), "dd 'de' MMMM", { locale: es });
            const checkOut = format(new Date(booking.check_out), "dd 'de' MMMM", { locale: es });
            return [
                { text: `${booking.hostel_name} (${checkIn} - ${checkOut})`, callback_data: `booking_${booking.id}` }
            ];
        });
        buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
        buttons.push([{ text: 'Volver al menú principal', callback_data: 'menu' }]);
        ctx.reply("Selecciona una reserva para ver más información:", {
            reply_markup: { inline_keyboard: buttons }
        });
    } catch (error) {
        console.error("Error al obtener las reservas:", error);
        ctx.reply("hubo un error al obtener las reservas.");
    }
});
bot.action(/^booking_(\d+)$/, async (ctx) => {
    const bookingId = ctx.match[1];
    try {
        const booking = await getBookingDetails(bookingId);
        if (!booking) {
            return ctx.reply(messages.bookingNotFound, menu.back_menu);
        }
        ctx.editMessageReplyMarkup(null);
        const checkIn = format(new Date(booking.check_in), "dd 'de' MMMM", { locale: es });
        const checkOut = format(new Date(booking.check_out), "dd 'de' MMMM", { locale: es });
        let msg = `🏨 *${booking.hostel_name}*\n\n`;
        msg += `📅 *Check-in:* ${checkIn}\n`;
        msg += `📅 *Check-out:* ${checkOut}\n`;
        msg += `📍 *Dirección:* ${booking.address || "No disponible"}\n`;
        msg += `📞 *Teléfono:* ${booking.phone || "No disponible"}\n`;
        msg += `📧 *Email:* ${booking.email || "No disponible"}\n`;
        msg += `📝 *Notas:* ${booking.notes || "Sin notas"}\n\n`;
        const buttons = [
            [{ text: 'Volver al menú principal', callback_data: 'menu' }]
        ];
        if (booking.pdf_path) {
            const bookingPdf = path.join(config.reservasPath, booking.pdf_path);
            try {
                await fs.access(bookingPdf);
                buttons.unshift([{ text: '📄 Descargar PDF', callback_data: `download_${booking.pdf_path}` }]);
            } catch (error) {
                console.error("El archivo PDF no existe:", error);
            }
        }
        ctx.replyWithMarkdown(msg, {
            reply_markup: { inline_keyboard: buttons }
        });
    } catch (error) {
        console.error("Error al obtener los detalles de la reserva:", error);
        ctx.reply(messages.bookingDetailsError, menu.back_menu);
    }
});
bot.action(/^download_(.+)$/, async (ctx) => {
    const fileName = ctx.match[1];
    const filePath = path.join(config.reservasPath, fileName);
    try {
        await fs.access(filePath);
        await ctx.replyWithDocument({ source: filePath, filename: fileName });
    } catch (error) {
        console.error("Error al enviar el archivo:", error);
        ctx.reply("❌ Hubo un error al enviar el archivo. Es posible que no exista.");
    }
});
bot.on("document", async (ctx) => {
    ctx.reply("En estos momentos no puedo procesar documentos. Disculpa las molestias.");
});
bot.action("stages", async (ctx) => {
    ctx.editMessageReplyMarkup(null);
    const buttons = [
        [{ text: "Ruta del Camino", callback_data: "stages_rute" }],
        [{ text: "Resto de dias", callback_data: "stages_travel" }],
        [{ text: 'Volver al menú principal', callback_data: 'menu' }],
        [{ text: "Cerrar menú", callback_data: "close" }]
    ];
    ctx.reply("Selecciona una etapa para ver más información:", {
        reply_markup: { inline_keyboard: buttons }
    });
});
bot.action("stages_rute", async (ctx) => {
    const stages = await getStagesRute();
    if (stages.length === 0) {
        return ctx.reply(messages.noStages, menu.back_menu);
    }
    ctx.editMessageReplyMarkup(null);
    const buttons = stages.map(stage => [{ text: stage.name, callback_data: `stage_${stage.id}` }]);
    buttons.push([{ text: 'Volver al menú principal', callback_data: 'menu' }]);
    buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
    ctx.reply("Selecciona una etapa para ver más información:", {
        reply_markup: { inline_keyboard: buttons }
    });
});
bot.action("stages_travel", async (ctx) => {
    const stages = await getStagesTravel();
    if (stages.length === 0) {
        return ctx.reply(messages.noStages, menu.back_menu);
    }
    ctx.editMessageReplyMarkup(null);
    const buttons = stages.map(stage => [{ text: stage.name, callback_data: `stage_${stage.id}` }]);
    buttons.push([{ text: 'Volver al menú principal', callback_data: 'menu' }]);
    buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
    ctx.reply("Selecciona una etapa para ver más información:", {
        reply_markup: { inline_keyboard: buttons }
    });
});
bot.action(/^stage_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    const stage = await getStageDetails(id);
    if (!stage) {
        return ctx.reply(messages.stageNotFound, menu.back_menu);
    }
    let msg = `📍 *${stage.name}*\n\n`;
    msg += `📏 *Distancia:* ${stage.distance_km} km\n\n`;
    msg += `⏳ *Duración estimada:* ${stage.hours_duration} horas\n\n`;
    msg += `📝 *Descripción:* ${stage.description}\n\n`;
    if (stage.enlace_maps) {
        msg += `🗺 *Ruta en Google Maps:*\n[Haz clic aquí para ver la ruta](${stage.maps_link})`;
    }
    ctx.replyWithMarkdown(msg, menu.back_menu);
    ctx.editMessageReplyMarkup(null);
});

console.log('Bot DEV iniciado 🚀');

// Escuchamos en el puerto 3000 (o el definido en config)
const PORT = config.port || 3000;
const HOST = config.host || 'localhost';
app.listen(PORT, () => {
    console.log(`Bot DEV escuchando en ${HOST}:${PORT}`);
});
