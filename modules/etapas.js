const mysql = require("mysql2/promise");
const config = require("../config/config");

const pool = mysql.createPool(config.dbConfig);

async function getStages() {
    const [rows] = await pool.query("SELECT id, name FROM stages ORDER BY id ASC");
    return rows;
}

async function getStageDetails(id) {
    const [rows] = await pool.query("SELECT * FROM stages WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { getStages, getStageDetails };
