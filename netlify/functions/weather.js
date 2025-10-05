const fetch = require('node-fetch');

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
        
        // Tarihi ISO formatına çevir
        const requestDate = date ? new Date(date).toISOString() : new Date().toISOString();
        const dateObj = new Date(requestDate);
        
        // Paralel olarak tüm API'lerden veri çek
        const [meteomaticsData, openWeatherData, nasaData] = await Promise.allSettled([
            fetchMeteomatics(lat, lon, requestDate),
            fetchOpenWeather(lat, lon, dateObj),
            fetchNASA(lat, lon, dateObj)
        ]);
        
        // Verileri birleştir
        const combinedData = {
            meteomatics: meteomaticsData.status === 'fulfilled' ? meteomaticsData.value : null,
            openweather: openWeatherData.status === 'fulfilled' ? openWeatherData.value : null,
            nasa: nasaData.status === 'fulfilled' ? nasaData.value : null,
            timestamp: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(combinedData)
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

// Meteomatics API
async function fetchMeteomatics(lat, lon, requestDate) {
    const username = process.env.METEOMATICS_USERNAME;
    const password = process.env.METEOMATICS_PASSWORD;
    
    if (!username || !password) {
        throw new Error('Meteomatics credentials missing');
    }
    
    const url = `https://api.meteomatics.com/${requestDate}/t_2m:C,relative_humidity_2m:p,wind_speed_10m:ms,wind_dir_10m:d,weather_symbol_1h:idx/${lat},${lon}/json`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
        }
    });
    
    if (!response.ok) {
        throw new Error(`Meteomatics API error: ${response.status}`);
    }
    
    return await response.json();
}

// OpenWeatherMap API
async function fetchOpenWeather(lat, lon, dateObj) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenWeather API key missing');
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
    }
    
    return await response.json();
}

// NASA POWER API
async function fetchNASA(lat, lon, dateObj) {
    const apiKey = process.env.NASA_API_KEY;
    
    if (!apiKey) {
        throw new Error('NASA API key missing');
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,WS10M,WD10M&community=RE&longitude=${lon}&latitude=${lat}&start=${year}${month}${day}&end=${year}${month}${day}&format=JSON`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
    }
    
    return await response.json();
}
