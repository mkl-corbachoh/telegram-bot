const axios = require("axios");
require("dotenv").config();

async function getWeather(location) {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=es`;

    try {
        const response = await axios.get(url);
        const { main, weather } = response.data;
        return `🌤 Clima en ${location}: ${weather[0].description}, Temp: ${main.temp}°C`;
    } catch (error) {
        return "❌ No se pudo obtener el clima.";
    }
}

module.exports = getWeather;
