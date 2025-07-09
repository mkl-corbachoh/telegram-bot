const mysql = require("mysql2/promise");
const config = require("../config/config");
const messages = require("./messages");

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

async function addUser(telegramId,userName) {
    try {
        const [result] = await pool.query(
            "INSERT INTO users (username, telegram_id, is_authorized) VALUES (?, ?, 0)",
            [userName, telegramId]
        );
        return result.insertId;
    } catch (error) {
        // Manejo específico de error por clave duplicada
        if (error.code === 'ER_DUP_ENTRY') {
            console.warn(`El usuario con telegram_id ${telegramId} ya existe.`);
            return null; // O puedes retornar un valor especial o el id existente si lo consultas
        }
        console.error("Error al agregar el usuario a la base de datos:", error);
        return false;
    }
}

module.exports = { isUserAuthorized, addUser };
