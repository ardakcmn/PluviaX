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
        
        // Check if we have required environment variables
        const hasMeteomatics = process.env.METEOMATICS_USERNAME && process.env.METEOMATICS_PASSWORD;
        const hasOpenWeather = process.env.OPENWEATHER_API_KEY;
        const hasNASA = process.env.NASA_API_KEY;
        
        // Build promises array based on available APIs
        const promises = [];
        const promiseNames = [];
        
        if (hasMeteomatics) {
            promises.push(fetchMeteomatics(lat, lon, requestDate));
            promiseNames.push('meteomatics');
        }
        
        if (hasOpenWeather) {
            promises.push(fetchOpenWeather(lat, lon, dateObj));
            promiseNames.push('openweather');
        }
        
        if (hasNASA) {
            promises.push(fetchNASA(lat, lon, dateObj));
            promiseNames.push('nasa');
        }
        
        // If no APIs are configured, return mock data
        if (promises.length === 0) {
            const mockData = {
                meteomatics: null,
                openweather: {
                    main: { temp: 22, humidity: 65 },
                    weather: [{ description: "Clear sky", id: 800 }],
                    wind: { speed: 3.5, deg: 180 }
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
        }
        
        // Paralel olarak tüm API'lerden veri çek
        const results = await Promise.allSettled(promises);
        
        // Verileri birleştir
        const combinedData = {
            meteomatics: null,
            openweather: null,
            nasa: null,
            timestamp: new Date().toISOString()
        };
        
        // Map results to their respective APIs
        results.forEach((result, index) => {
            const apiName = promiseNames[index];
            if (result.status === 'fulfilled') {
                combinedData[apiName] = result.value;
            }
        });

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
