// Controlador para acciones relacionadas con reservas
const { format } = require("date-fns");
const { es } = require("date-fns/locale");
const path = require("path");
const fs = require("fs").promises;
const { getBookingList, getBookingDetails } = require("../modules/hostels");
const messages = require("../utils/messages");
const menu = require("../utils/menu_buttons");
const config = require("../config/config");

async function showBookings(ctx) {
    try {
        const bookings = await getBookingList();
        if (bookings.length === 0) {
            return ctx.reply(messages.noBookings, menu.back_menu);
        }
        ctx.editMessageReplyMarkup(null);
        const buttons = bookings.map(booking => {
            const checkIn = format(new Date(booking.check_in), "dd 'de' MMMM", { locale: es });
            const checkOut = format(new Date(booking.check_out), "dd 'de' MMMM", { locale: es });
            return [
                { text: `${booking.hostel_name} (${checkIn} - ${checkOut})`, callback_data: `booking_${booking.id}` }
            ];
        });
        buttons.push([{ text: "Cerrar menú", callback_data: "close" }]);
        buttons.push([{ text: 'Volver al menú principal', callback_data: 'menu' }]);
        ctx.reply("Selecciona una reserva para ver más información:", {
            reply_markup: { inline_keyboard: buttons }
        });
    } catch (error) {
        console.error("Error al obtener las reservas:", error);
        ctx.reply("hubo un error al obtener las reservas.");
    }
}

async function showBookingDetails(ctx) {
    const bookingId = ctx.match[1];
    try {
        const booking = await getBookingDetails(bookingId);
        if (!booking) {
            return ctx.reply(messages.bookingNotFound, menu.back_menu);
        }
        ctx.editMessageReplyMarkup(null);
        const checkIn = format(new Date(booking.check_in), "dd 'de' MMMM", { locale: es });
        const checkOut = format(new Date(booking.check_out), "dd 'de' MMMM", { locale: es });
        let msg = `🏨 *${booking.hostel_name}*\n\n`;
        msg += `📅 *Check-in:* ${checkIn}\n`;
        msg += `📅 *Check-out:* ${checkOut}\n`;
        msg += `📍 *Dirección:* ${booking.address || "No disponible"}\n`;
        msg += `📞 *Teléfono:* ${booking.phone || "No disponible"}\n`;
        msg += `📧 *Email:* ${booking.email || "No disponible"}\n`;
        msg += `📝 *Notas:* ${booking.notes || "Sin notas"}\n\n`;
        const buttons = [
            [{ text: 'Volver al menú principal', callback_data: 'menu' }]
        ];
        if (booking.pdf_path) {
            const bookingPdf = path.join(config.reservasPath, booking.pdf_path);
            try {
                await fs.access(bookingPdf);
                buttons.unshift([{ text: '📄 Descargar PDF', callback_data: `download_${booking.pdf_path}` }]);
            } catch (error) {
                console.error("El archivo PDF no existe:", error);
            }
        }
        ctx.replyWithMarkdown(msg, {
            reply_markup: { inline_keyboard: buttons }
        });
    } catch (error) {
        console.error("Error al obtener los detalles de la reserva:", error);
        ctx.reply(messages.bookingDetailsError, menu.back_menu);
    }
}

async function downloadBookingPDF(ctx) {
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

module.exports = {
    showBookings,
    showBookingDetails,
    downloadBookingPDF
};
