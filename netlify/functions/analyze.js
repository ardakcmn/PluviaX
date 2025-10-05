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
        const { activity, weatherData, language = 'tr' } = JSON.parse(event.body || '{}');
        
        // DeepSeek AI API
        const aiResponse = await fetchDeepSeekAI(activity, weatherData, language);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(aiResponse)
        };
    } catch (error) {
        console.error('AI Analysis error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// DeepSeek AI API
async function fetchDeepSeekAI(activity, weatherData, language) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
        throw new Error('DeepSeek API key missing');
    }
    
    // Weather data summary
    const weatherSummary = {
        temperature: weatherData.temperature || 'N/A',
        humidity: weatherData.humidity || 'N/A',
        windSpeed: weatherData.windSpeed || 'N/A',
        description: weatherData.description || 'N/A',
        condition: weatherData.condition || 'N/A'
    };
    
    // AI prompt based on language
    const prompt = language === 'tr' 
        ? `Sen bir hava durumu uzmanısın. Kullanıcı "${activity}" aktivitesini yapmak istiyor. Hava durumu: ${JSON.stringify(weatherSummary)}. Bu aktivite için hava durumu uygun mu? Detaylı tavsiye ver.`
        : `You are a weather expert. User wants to do "${activity}". Weather: ${JSON.stringify(weatherSummary)}. Is the weather suitable for this activity? Give detailed advice.`;
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
        analysis: data.choices[0].message.content,
        language: language,
        timestamp: new Date().toISOString()
    };
}
