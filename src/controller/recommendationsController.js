const recommendations = require("../modules/recommendations");
const menu = require("../utils/menu_buttons");

function showRecommendationsMenu(ctx) {
    ctx.reply('¿Qué tipo de recomendación quieres?', menu.recommendations_menu);
}

async function askForLocation(ctx) {
    ctx.reply('Por favor, comparte tu ubicación actual.', {
        reply_markup: {
            keyboard: [[{ text: 'Enviar ubicación 📍', request_location: true }]],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
}

async function handleLocation(ctx) {
    const { recommendationType } = ctx.session || {};
    if (!recommendationType) {
        return ctx.reply('Por favor, selecciona primero el tipo de recomendación.');
    }
    const location = ctx.message.location;
    if (!location) return ctx.reply('No se recibió la ubicación.');
    const locString = `${location.latitude},${location.longitude}`;
    if (recommendationType === 'restaurants') {
        const results = await recommendations.getNearbyRestaurants(locString);
        if (!results.length) return ctx.reply('No se encontraron restaurantes cercanos.');
        let msg = 'Restaurantes recomendados:\n';
        results.slice(0, 5).forEach(r => {
            msg += `🍽️ ${r.name}\n${r.address}\nValoración: ${r.rating || 'N/A'}\n\n`;
        });
        ctx.reply(msg, menu.back_menu);
    } else if (recommendationType === 'events') {
        const results = await recommendations.getNearbyEvents(locString);
        if (!results.length) return ctx.reply('No se encontraron eventos cercanos.');
        let msg = 'Eventos recomendados:\n';
        results.slice(0, 5).forEach(e => {
            msg += `🎫 ${e.name}\n${e.venue}\nFecha: ${e.start}\n${e.url}\n\n`;
        });
        ctx.reply(msg, menu.back_menu);
    }
    ctx.session.recommendationType = null;
}

function setRecommendationType(type) {
    return (ctx) => {
        ctx.session = ctx.session || {};
        ctx.session.recommendationType = type;
        askForLocation(ctx);
    };
}

module.exports = {
    showRecommendationsMenu,
    setRecommendationType,
    handleLocation
};
