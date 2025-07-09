// Controlador para acciones relacionadas con el clima
const { getWeather, getWeatherByCoordinates } = require("../modules/weather");
const menu = require("../utils/menu_buttons");

async function askForLocation(ctx) {
    ctx.reply('Por favor, comparte tu ubicación para obtener el clima actual:', {
        reply_markup: {
            keyboard: [
                [{ text: '📍 Enviar mi ubicación', request_location: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
}

async function showWeatherTravel(ctx) {
    try {
        const msg = await getWeather("Santiago de Compostela");
        ctx.reply(msg);
    } catch (error) {
        console.error("Error obteniendo el clima:", error);
        ctx.reply("Hubo un error al obtener el clima.");
    }
}

async function showWeatherByLocation(ctx) {
    const { latitude, longitude } = ctx.message.location;
    try {
        const weather = await getWeatherByCoordinates(latitude, longitude);
        ctx.replyWithMarkdown(`🌤 El clima en tu ubicación actual es:\n\n${weather}`, menu.back_menu);
    } catch (error) {
        console.error('Error al obtener el clima:', error);
        ctx.reply('❌ Hubo un error al obtener el clima. Por favor, inténtalo de nuevo más tarde.');
    }
}

module.exports = {
    askForLocation,
    showWeatherTravel,
    showWeatherByLocation
};
