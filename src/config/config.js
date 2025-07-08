const path = require("path");
require("dotenv").config();

module.exports = {
  port: process.env.PORT,
  host: process.env.HOST,
  baseUrl: process.env.BASE_URL,
  botToken: process.env.TELEGRAM_TOKEN,
  weatherApiKey: process.env.WEATHER_API_KEY,
  dbConfig: {
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    password: process.env.PASS_DB,
    database: process.env.TLBOT_DB,
  },
  reservasPath: path.join(__dirname, "../data/reservas"),
};