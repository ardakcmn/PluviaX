// Simple weather function for Netlify

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { lat, lon, date } = JSON.parse(event.body || '{}');
        
        // Return mock weather data for now
        const mockData = {
            meteomatics: null,
            openweather: {
                main: { 
                    temp: 22, 
                    humidity: 65,
                    pressure: 1013
                },
                weather: [{ 
                    description: "Clear sky", 
                    id: 800,
                    main: "Clear"
                }],
                wind: { 
                    speed: 3.5, 
                    deg: 180 
                },
                coord: { lat, lon }
            },
            nasa: null,
            timestamp: new Date().toISOString(),
            mock: true
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockData)
        };
    } catch (error) {
        console.error('Weather API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
