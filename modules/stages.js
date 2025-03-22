const mysql = require("mysql2/promise");
const config = require("../config/config");

const pool = mysql.createPool(config.dbConfig);

async function getStagesRute() {
    const [rows] = await pool.query("SELECT id, name FROM stages WHERE type = 1 ORDER BY n_order,id ASC");
    return rows;
}

async function getStagesTravel() {
    const [rows] = await pool.query("SELECT id, name FROM stages WHERE type = 0 ORDER BY n_order,id ASC");
    return rows;
}

async function getStageDetails(id) {
    const [rows] = await pool.query("SELECT * FROM stages WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { getStagesRute, getStagesTravel, getStageDetails };