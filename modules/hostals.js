const mysql = require("mysql2/promise");
const config = require("../config/config");

const pool = mysql.createPool(config.dbConfig);

async function getBookingList() {
    const [rows] = await pool.query(`
            SELECT * 
            FROM booking
            ORDER BY check_in ASC
        `);
    return rows;
}

async function getBookingDetails(bookingId) {
    // Consultar los detalles de la reserva
    const [rows] = await pool.query(`
            SELECT * 
            FROM booking
            WHERE id = ?
        `, [bookingId]);
    return rows.length > 0 ? rows[0] : null;;
}

module.exports = { getBookingList, getBookingDetails };