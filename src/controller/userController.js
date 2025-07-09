// Controlador para acciones generales y de usuario
const { isUserAuthorized, addUser } = require("../utils/db");
const { sendNewUserRequest } = require("../utils/email");
const menu = require("../utils/menu_buttons");

async function start(ctx) {
    ctx.reply('¡Bienvenido! 🤖', menu.print_menu);
}

async function info(ctx) {
    ctx.reply(`Tu ID: ${ctx.from.id}\nNombre: ${ctx.from.first_name}`);
}

async function register(ctx) {
    const userId = ctx.from.id;
    const userName = ctx.from.username || ctx.from.first_name;
    const isAuthorized = await isUserAuthorized(userId);
    if (isAuthorized) {
        return ctx.reply("✅ Ya estás registrado y autorizado para usar el bot.");
    }
    const resp = await addUser(userId, userName);
    if (!resp) {
        return ctx.reply("el usuario ya está registrado.");
    }
    await sendNewUserRequest(userId, userName);
    ctx.reply("✅ Se ha mandado la solicitud de registro del usuario.");
}

async function help(ctx) {
    ctx.reply('Comandos disponibles: /start, /help, /info, /menu, /register');
}

module.exports = {
    start,
    info,
    register,
    help
};
