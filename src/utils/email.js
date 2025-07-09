const { Resend } = require('resend');
const config = require('../config/config');

const resend = new Resend(config.resendApiKey);

/**
 * Envía un correo solicitando autorización de un nuevo usuario
 * @param {string|number} telegramId - ID de Telegram del usuario
 * @param {string} userName - Nombre o username del usuario
 * @returns {Promise<void>}
 */
async function sendNewUserRequest(telegramId, userName) {
    const to = config.adminEmail; // Debe estar definido en config.js
    const subject = 'Nuevo registro en el bot: autorización requerida';
    const html = `
        <h2>Nuevo usuario registrado</h2>
        <p><b>Nombre/Usuario:</b> ${userName}</p>
        <p><b>ID de Telegram:</b> ${telegramId}</p>
        <p>Por favor, autoriza a este usuario en la base de datos si corresponde.</p>
    `;
    try {
        await resend.emails.send({
            from: config.fromEmail, // Debe estar definido en config.js
            to,
            subject,
            html
        });
        console.log('Correo de solicitud de autorización enviado.');
    } catch (error) {
        console.error('Error enviando correo de solicitud de autorización:', error);
    }
}

module.exports = { sendNewUserRequest };
