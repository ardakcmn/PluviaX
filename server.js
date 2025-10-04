require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Weather API endpoint - Multi-source (Meteomatics + OpenWeather + NASA)
app.post('/api/weather', async (req, res) => {
    try {
        const { lat, lon, date } = req.body;
        
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
        
        res.json(combinedData);
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Meteomatics API
async function fetchMeteomatics(lat, lon, requestDate) {
    const username = process.env.METEOMATICS_USERNAME;
    const password = process.env.METEOMATICS_PASSWORD;
    
    if (!username || !password) {
        throw new Error('Meteomatics credentials missing');
    }
    
    const parameters = 't_2m:C,relative_humidity_2m:p,wind_speed_10m:ms,precip_1h:mm,weather_symbol_1h:idx,prob_precip_1h:p,t_apparent:C,uv:idx,wind_gusts_10m_1h:ms';
    const weatherUrl = `https://api.meteomatics.com/${requestDate}/${parameters}/${lat},${lon}/json`;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch(weatherUrl, {
        headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (!response.ok) throw new Error('Meteomatics API error');
    return await response.json();
}

// OpenWeatherMap API
async function fetchOpenWeather(lat, lon, dateObj) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error('OpenWeather API key missing');
    
    // Current + Forecast verisi al
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    const [currentRes, forecastRes] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
    ]);
    
    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    
    return { current, forecast };
}

// NASA POWER API
async function fetchNASA(lat, lon, dateObj) {
    try {
        // NASA POWER API - Solar, meteorological data
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // Son 3 günlük veri al (daha güvenilir)
        const endDate = dateStr;
        const startDate = new Date(dateObj);
        startDate.setDate(startDate.getDate() - 3);
        const startDateStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
        
        // Sadece en güvenilir parametreleri iste
        const params = 'ALLSKY_SFC_UV_INDEX,T2M';
        const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDateStr}&end=${endDate}&format=JSON`;
        
        const response = await fetch(nasaUrl);
        
        if (!response.ok) {
            console.warn('NASA API returned error status:', response.status);
            throw new Error('NASA API error');
        }
        
        const data = await response.json();
        
        // Veri kontrolü
        if (!data.properties || !data.properties.parameter) {
            console.warn('NASA API returned invalid data structure');
            throw new Error('Invalid NASA data');
        }
        
        return data;
    } catch (error) {
        console.warn('NASA API fetch failed:', error.message);
        // NASA API hata verirse null dön, diğer API'ler devam etsin
        return null;
    }
}

// AI Analysis endpoint - DeepSeek
app.post('/api/analyze', async (req, res) => {
    try {
        const { activity, weatherData, language = 'tr' } = req.body;
        
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
            throw new Error('DeepSeek API key eksik');
        }
        
        // Hava durumu özetini hazırla
        const weatherSummary = `
        Sıcaklık: ${weatherData.temp}°C
        Hissedilen: ${weatherData.feels_like}°C
        Hava Durumu: ${weatherData.description}
        Nem: ${weatherData.humidity}%
        Rüzgar: ${weatherData.wind_speed} m/s
        Yağış İhtimali: ${weatherData.rain_probability || 0}%
        `;
        
        // Dile göre prompt oluştur
        const prompts = {
            tr: `Sen yardımcı ve samimi bir hava durumu asistanısın. Kullanıcı şu aktiviteyi yapmak istiyor: "${activity}". 

Hava durumu bilgileri:
${weatherSummary}

Lütfen bu aktivite için hava durumunun uygun olup olmadığını değerlendir. Kısa (2-3 cümle), samimi ve yardımcı bir şekilde cevap ver. Türkçe cevap ver. Emoji kullanabilirsin.`,
            en: `You are a helpful and friendly weather assistant. The user wants to do this activity: "${activity}". 

Weather information:
${weatherSummary}

Please evaluate whether the weather is suitable for this activity. Answer in a short (2-3 sentences), friendly, and helpful way. Respond in English. You can use emojis.`
        };
        
        const prompt = prompts[language] || prompts['tr'];

        // DeepSeek API - OpenAI uyumlu format
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: language === 'en' 
                            ? 'You are a helpful and friendly weather assistant. You provide weather advice for users\' activities.'
                            : 'Sen yardımcı ve samimi bir hava durumu asistanısın. Kullanıcılara aktiviteleri için hava durumu tavsiyeleri veriyorsun.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        
        const aiData = await deepseekResponse.json();
        
        if (!deepseekResponse.ok) {
            console.error('DeepSeek error:', aiData);
            throw new Error(aiData.error?.message || 'AI analizi yapılamadı');
        }
        
        const aiResponse = aiData.choices[0].message.content;
        
        res.json({ response: aiResponse });
    } catch (error) {
        console.error('AI API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Data Export endpoint - CSV/JSON
app.get('/api/export/:format', async (req, res) => {
    try {
        const { format } = req.params;
        const { lat, lon, date } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }
        
        // Hava durumu verisini al
        const requestDate = date ? new Date(date).toISOString() : new Date().toISOString();
        
        const [meteomaticsData, openWeatherData, nasaData] = await Promise.allSettled([
            fetchMeteomatics(lat, lon, requestDate),
            fetchOpenWeather(lat, lon, new Date(requestDate)),
            fetchNASA(lat, lon, new Date(requestDate))
        ]);
        
        // Verileri birleştir
        const combinedData = {
            meteomatics: meteomaticsData.status === 'fulfilled' ? meteomaticsData.value : null,
            openweather: openWeatherData.status === 'fulfilled' ? openWeatherData.value : null,
            nasa: nasaData.status === 'fulfilled' ? nasaData.value : null,
            metadata: {
                timestamp: new Date().toISOString(),
                location: { lat: parseFloat(lat), lon: parseFloat(lon) },
                date: requestDate,
                sources: {
                    meteomatics: meteomaticsData.status === 'fulfilled',
                    openweather: openWeatherData.status === 'fulfilled',
                    nasa: nasaData.status === 'fulfilled'
                }
            }
        };
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="weather_data_${new Date().toISOString().split('T')[0]}.json"`);
            res.json(combinedData);
        } else if (format === 'csv') {
            const csvData = convertToCSV(combinedData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="weather_data_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvData);
        } else {
            res.status(400).json({ error: 'Invalid format. Use json or csv' });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// CSV dönüştürme fonksiyonu
function convertToCSV(data) {
    const rows = [];
    
    // Metadata
    rows.push(['Field', 'Value']);
    rows.push(['Timestamp', data.metadata.timestamp]);
    rows.push(['Latitude', data.metadata.location.lat]);
    rows.push(['Longitude', data.metadata.location.lon]);
    rows.push(['Date', data.metadata.date]);
    rows.push(['Meteomatics Available', data.metadata.sources.meteomatics]);
    rows.push(['OpenWeather Available', data.metadata.sources.openweather]);
    rows.push(['NASA Available', data.metadata.sources.nasa]);
    rows.push([]);
    
    // Meteomatics data
    if (data.meteomatics && data.meteomatics.data) {
        rows.push(['Meteomatics Data']);
        rows.push(['Parameter', 'Value', 'Unit']);
        data.meteomatics.data.forEach(param => {
            const value = param.coordinates[0].dates[0].value;
            rows.push([param.parameter, value, getUnit(param.parameter)]);
        });
        rows.push([]);
    }
    
    // OpenWeather data
    if (data.openweather && data.openweather.current) {
        rows.push(['OpenWeather Data']);
        rows.push(['Field', 'Value', 'Unit']);
        const ow = data.openweather.current;
        if (ow.main) {
            rows.push(['Temperature', ow.main.temp, '°C']);
            rows.push(['Feels Like', ow.main.feels_like, '°C']);
            rows.push(['Humidity', ow.main.humidity, '%']);
            rows.push(['Pressure', ow.main.pressure, 'hPa']);
        }
        if (ow.wind) {
            rows.push(['Wind Speed', ow.wind.speed, 'm/s']);
            rows.push(['Wind Direction', ow.wind.deg, '°']);
        }
        if (ow.weather && ow.weather[0]) {
            rows.push(['Weather', ow.weather[0].description, '']);
        }
        rows.push([]);
    }
    
    // NASA data
    if (data.nasa && data.nasa.properties && data.nasa.properties.parameter) {
        rows.push(['NASA POWER Data']);
        rows.push(['Parameter', 'Value', 'Unit']);
        const nasa = data.nasa.properties.parameter;
        Object.keys(nasa).forEach(param => {
            const dates = Object.keys(nasa[param]);
            if (dates.length > 0) {
                const latestDate = dates[dates.length - 1];
                const value = nasa[param][latestDate];
                rows.push([param, value, getNASAUnit(param)]);
            }
        });
    }
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Unit helper functions
function getUnit(parameter) {
    if (parameter.includes('t_2m') || parameter.includes('t_apparent')) return '°C';
    if (parameter.includes('humidity')) return '%';
    if (parameter.includes('wind_speed') || parameter.includes('wind_gusts')) return 'm/s';
    if (parameter.includes('precip')) return 'mm';
    if (parameter.includes('prob_precip')) return '%';
    if (parameter.includes('uv')) return 'index';
    return '';
}

function getNASAUnit(parameter) {
    if (parameter.includes('UV_INDEX')) return 'W m-2 x 40';
    if (parameter.includes('T2M')) return '°C';
    return '';
}

app.listen(PORT, () => {
    console.log(`🌧️  Pluvia server running on http://localhost:${PORT}`);
});

