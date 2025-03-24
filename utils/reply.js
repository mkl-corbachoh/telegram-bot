const menu = require("../utils/menu_buttons");

module.exports = {
    replyAndClose: (ctx, message) => {
        ctx.editMessageReplyMarkup(null);
        ctx.reply(message, menu.back_menu);
    }
};