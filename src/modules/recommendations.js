const axios = require('axios');
const config = require("../config/config");

const GOOGLE_PLACES_API_KEY = config.googlePlacesApiKey;
const EVENTBRITE_API_KEY = config.eventbriteApiKey;

// Buscar restaurantes cercanos usando Google Places
async function getNearbyRestaurants(location, radius = 2000) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const params = {
        location, // formato: "lat,lng"
        radius,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY,
        language: 'es'
    };
    const { data } = await axios.get(url, { params });
    return data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        place_id: place.place_id
    }));
}

// Buscar eventos cercanos usando Eventbrite
async function getNearbyEvents(location, radius = '10km') {
    const [lat, lng] = location.split(',');
    const url = `https://www.eventbriteapi.com/v3/events/search/`;
    const params = {
        'location.latitude': lat,
        'location.longitude': lng,
        'location.within': radius,
        'expand': 'venue',
        'token': EVENTBRITE_API_KEY,
        'sort_by': 'date'
    };
    const { data } = await axios.get(url, { params });
    return data.events.map(event => ({
        name: event.name.text,
        url: event.url,
        start: event.start.local,
        venue: event.venue ? event.venue.address.localized_address_display : ''
    }));
}

module.exports = {
    getNearbyRestaurants,
    getNearbyEvents
};