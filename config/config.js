require("dotenv").config();

module.exports = {
  port: process.env.PORT,
  botToken: process.env.TELEGRAM_TOKEN,
  weatherApiKey: process.env.WEATHER_API_KEY,
  hostDb: process.env.HOST_DB,
  userDb: process.env.USER_DB,
  passDb: process.env.PASS_DB,
  database: process.env.TLBOT_DB
};