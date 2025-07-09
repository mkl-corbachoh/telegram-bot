const { format } = require("date-fns");
const { es } = require("date-fns/locale");
const config = require("./config/config");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");

// Modulos propios.
const {getWeather, getWeatherByCoordinates} = require("./modules/weather");        // Modulo para obtener el clima
const { replyAndClose } = require("./utils/reply");     // Modulo para responder y cerrar el menú
const { isUserAuthorized, addUser } = require("./utils/db");     // Modulo para verificar si el usuario está autorizado
const { sendNewUserRequest } = require("./utils/email"); // Script para envío de correos
const { getStagesTravel, getStagesRute, getStageDetails } = require("./modules/stages"); // Modulo para obtener las etapas   
const { getBookingList, getBookingDetails } = require("./modules/hostels"); // Modulo para obtener las reservas

const messages = require("./utils/messages");           // Modulo para los mensajes de error/éxito
const menu = require("./utils/menu_buttons");           // Modulo para las botoneras de menu

const authorizedUsers = new Set(); // Caché en memoria

const { Telegraf } = require('telegraf');
const TOKEN = config.botToken;
const URL = config.baseUrl;
const bot = new Telegraf(TOKEN);
// Para que no use pooling  el bot de teleggram porque consume mas recursos
bot.telegram.setWebhook(URL+'/webhook');

// Endpoint del bot
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/webhook')); // Usa webhooks en vez de pooling

// Healthcheck endpoint para Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

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
// Comando de inicio del bot
bot.start((ctx) => ctx.reply('¡Bienvenido! 🤖',menu.print_menu));

// Compueba identificacion del usuario
bot.command('info', (ctx) => {
    ctx.reply(`Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
});

// Comando para registrar al usuario
// Este comando permite a los usuarios registrarse en el bot y ser autorizados para usarlo
bot.command('register', async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.username || ctx.from.first_name;
    const isAuthorized = await isUserAuthorized(userId);
    if (isAuthorized) {
        return ctx.reply("✅ Ya estás registrado y autorizado para usar el bot.");
    }
    // Registrar usuario en la base de datos
    const resp = await addUser(userId, userName);
    if (!resp) {
        return ctx.reply("el usuario ya está registrado.");
    }
    // Enviar correo de solicitud de autorización
    await sendNewUserRequest(userId, userName);
    ctx.reply("✅ Se ha mandado la solicitud de registro del usuario.");
});

bot.help((ctx) => ctx.reply('Comandos disponibles: /start, /help, /info, /menu, /register'));

bot.command('menu', (ctx) => {
    ctx.reply('¿Qué te gustaría hacer?', menu.print_menu);
});

bot.action('menu', (ctx) => {
    ctx.editMessageReplyMarkup(null);
    ctx.reply('¿Qué te gustaría hacer?', menu.print_menu);
});
bot.action("close", (ctx) => ctx.editMessageReplyMarkup(null)); // Cierra el menú con el botón.
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
    // ctx.editMessageReplyMarkup(null);
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
        // Llama a la API de clima con las coordenadas
        const weather = await getWeatherByCoordinates(latitude, longitude);

        // Responde con el clima
        ctx.replyWithMarkdown(`🌤 El clima en tu ubicación actual es:\n\n${weather}`, menu.back_menu);
    } catch (error) {
        console.error('Error al obtener el clima:', error);
        ctx.reply('❌ Hubo un error al obtener el clima. Por favor, inténtalo de nuevo más tarde.');
    }
});

bot.action('booking', async (ctx) => {
    // var reservasList = [];
    try{
        const bookings = await getBookingList();
        // console.log(bookings);
        
        if (bookings.length === 0) {
            return ctx.reply(messages.noBookings, menu.back_menu);
        }
        ctx.editMessageReplyMarkup(null);
        // Crear botones para cada reserva
        // const buttons = bookings.map(booking => [
        //     { text: `${booking.hostel_name} (${booking.check_in} - ${booking.check_out})`, callback_data: `booking_${booking.id}` }
        // ]);
        const buttons = bookings.map(booking => {
            const checkIn = format(new Date(booking.check_in), "dd 'de' MMMM", { locale: es });
            const checkOut = format(new Date(booking.check_out), "dd 'de' MMMM", { locale: es });
            return [
                { text: `${booking.hostel_name} (${checkIn} - ${checkOut})`, callback_data: `booking_${booking.id}` }
            ];
        });
        buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
        buttons.push([{ text: 'Volver al menú principal', callback_data: 'menu' }]);
        // console.log(buttons);

        ctx.reply("Selecciona una reserva para ver más información:", {
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
            return ctx.reply(messages.bookingNotFound, menu.back_menu);
        }
        ctx.editMessageReplyMarkup(null); // Cierra el menú

        const checkIn = format(new Date(booking.check_in), "dd 'de' MMMM", { locale: es });
        const checkOut = format(new Date(booking.check_out), "dd 'de' MMMM", { locale: es });

        // Formatear el mensaje con los detalles de la reserva
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

            // Verifica si el archivo existe antes de agregar el botón
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

// Acción para descargar un PDF
bot.action(/^download_(.+)$/, async (ctx) => {
    const fileName = ctx.match[1];
    const filePath = path.join(config.reservasPath, fileName);

    try {
        // Verifica si el archivo existe antes de enviarlo
        await fs.access(filePath);

        await ctx.replyWithDocument({ source: filePath, filename: fileName });
        //ctx.editMessageReplyMarkup(null); // Cierra el menú después de la descarga
    } catch (error) {
        console.error("Error al enviar el archivo:", error);
        ctx.reply("❌ Hubo un error al enviar el archivo. Es posible que no exista.");
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

// Action para listar las etapas del camino
bot.action("stages_rute", async (ctx) => {
    const stages = await getStagesRute();

    if (stages.length === 0) {
        return ctx.reply(messages.noStages, menu.back_menu);
    }
    ctx.editMessageReplyMarkup(null);
    // Crear botones para cada etapa
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
    // Crear botones para cada etapa
    const buttons = stages.map(stage => [{ text: stage.name, callback_data: `stage_${stage.id}` }]);
    buttons.push([{ text: 'Volver al menú principal', callback_data: 'menu' }]);
    buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
    
    ctx.reply("Selecciona una etapa para ver más información:", {
        reply_markup: { inline_keyboard: buttons }
    });
});

// Acción al seleccionar una etapa
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
    ctx.editMessageReplyMarkup(null); // Cierra el menú
});


// lanzamos el bot.
// bot.launch(); //  No es necesario porque usamos webhooks
console.log('Bot iniciado 🚀');

// Escuchamos en el puerto 3000
const PORT = config.port || 3000;
const HOST = config.host || 'localhost';
app.listen(PORT, () => {
    console.log(`Bot escuchando en ${HOST}:${PORT}`);
});

