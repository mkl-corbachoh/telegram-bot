// Controlador para acciones generales del menú y respuestas rápidas
const menu = require("../utils/menu_buttons");
const { replyAndClose } = require("../utils/reply");

function showMenu(ctx) {
    ctx.reply('¿Qué te gustaría hacer?', menu.print_menu);
}

function closeMenu(ctx) {
    ctx.editMessageReplyMarkup(null);
}

function showProfile(ctx) {
    replyAndClose(ctx, `Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
}

function showHelpAction(ctx) {
    replyAndClose(ctx, "Comandos disponibles: /start, /help, /info, /menu, /register");
}

module.exports = {
    showMenu,
    closeMenu,
    showProfile,
    showHelpAction
};
