const axios = require("axios");
const config = require("../config/config");

async function getWeather(location) {
    const apiKey = config.weatherApiKey;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=es`;

    try {
        const response = await axios.get(url);
        const { main, weather } = response.data;
        return `🌤 Clima en ${location}: ${weather[0].description}, Temp: ${main.temp}°C`;
    } catch (error) {
        return "❌ No se pudo obtener el clima.";
    }
}

async function getWeatherByCoordinates(lat, lon) {
    const apiKey = config.weatherApiKey; // Asegúrate de tener tu API Key en la configuración
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    return `🌡 *Temperatura:* ${data.main.temp}°C\n` +
        `🌬 *Viento:* ${data.wind.speed} m/s\n` +
        `☁ *Descripción:* ${data.weather[0].description}`;
}

module.exports = {getWeather, getWeatherByCoordinates}; 
