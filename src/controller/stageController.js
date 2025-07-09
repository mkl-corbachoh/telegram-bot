// Controlador para acciones relacionadas con etapas
const { getStagesTravel, getStagesRute, getStageDetails } = require("../modules/stages");
const messages = require("../utils/messages");
const menu = require("../utils/menu_buttons");

async function showStagesMenu(ctx) {
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
}

async function showStagesRute(ctx) {
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
}

async function showStagesTravel(ctx) {
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
}

async function showStageDetails(ctx) {
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
}

module.exports = {
    showStagesMenu,
    showStagesRute,
    showStagesTravel,
    showStageDetails
};
