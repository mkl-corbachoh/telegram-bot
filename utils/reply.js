// const menu = require("./utils/menu_buttons");

module.exports = {
    replyAndClose: (ctx, message) => {
        ctx.reply(message);
        ctx.editMessageReplyMarkup(null);
    }
};