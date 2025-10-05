// Simple AI analysis function for Netlify

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
        
        // Return mock AI response
        const mockResponse = {
            analysis: language === 'tr' 
                ? `Hava durumu: ${weatherData.temperature || 22}°C, ${weatherData.description || 'Açık'}. ${activity} aktivitesi için uygun görünüyor. Detaylı analiz için API anahtarı gerekli.`
                : `Weather: ${weatherData.temperature || 22}°C, ${weatherData.description || 'Clear'}. Looks suitable for ${activity}. API key needed for detailed analysis.`,
            language: language,
            timestamp: new Date().toISOString(),
            mock: true
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockResponse)
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
