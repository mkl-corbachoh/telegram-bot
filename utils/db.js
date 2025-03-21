const mysql = require("mysql2/promise");
const config = require("../config/config");

const pool = mysql.createPool(config.dbConfig);

async function isUserAuthorized(telegramId) {
    try {
        const [rows] = await pool.query("SELECT is_authorized FROM users WHERE telegram_id = ?", [telegramId]);
        return rows.length > 0 && rows[0].is_authorized === 1;
    } catch (error) {
        console.error("Error consultando la base de datos:", error);
        return false;
    }
}

module.exports = { isUserAuthorized };
