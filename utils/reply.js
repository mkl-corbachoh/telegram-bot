module.exports = {
    replyAndClose: (ctx, message) => {
        ctx.reply(message);
        ctx.editMessageReplyMarkup(null);
    }
};