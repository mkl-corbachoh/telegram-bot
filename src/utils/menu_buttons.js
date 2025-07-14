module.exports = {
    back_menu: {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Volver al menú principal', callback_data: 'menu' }]
            ]
        }
    },
    print_menu: {
        reply_markup: {
        inline_keyboard: [
            [{ text: 'Ver perfil', callback_data: 'profile' }],
            [{ text: 'Clima en tu ubicacion', callback_data: 'weather' }],
            [{ text: 'Clima en el viaje', callback_data: 'weather_travel' }],
            [{ text: 'Reservas', callback_data: 'booking' }],
            [{ text: 'Rutas', callback_data: 'stages' }],
            // [{ text: 'Recomendaciones', callback_data: 'recommendations' }],
            [{ text: 'Ayuda', callback_data: 'help' }],
        ]}
    },
    recommendations_menu: {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Restaurantes', callback_data: 'recommend_restaurants' }],
                [{ text: 'Eventos', callback_data: 'recommend_events' }],
                [{ text: 'Volver al menú principal', callback_data: 'menu' }]
            ]
        }
    }
}