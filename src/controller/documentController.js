// Controlador para acciones de documentos
const path = require("path");
const fs = require("fs").promises;
const config = require("../config/config");

async function downloadPDF(ctx) {
    const fileName = ctx.match[1];
    const filePath = path.join(config.reservasPath, fileName);
    try {
        await fs.access(filePath);
        await ctx.replyWithDocument({ source: filePath, filename: fileName });
    } catch (error) {
        console.error("Error al enviar el archivo:", error);
        ctx.reply("❌ Hubo un error al enviar el archivo. Es posible que no exista.");
    }
}

async function onDocument(ctx) {
    ctx.reply("En estos momentos no puedo procesar documentos. Disculpa las molestias.");
    // Lógica comentada para guardar documentos si se desea en el futuro
}

module.exports = {
    downloadPDF,
    onDocument
};
