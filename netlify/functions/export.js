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
        const { format, data } = JSON.parse(event.body || '{}');
        
        if (format === 'csv') {
            const csvData = convertToCSV(data);
            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="weather-data.csv"'
                },
                body: csvData
            };
        } else if (format === 'json') {
            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="weather-data.json"'
                },
                body: JSON.stringify(data, null, 2)
            };
        } else {
            throw new Error('Invalid format. Use "csv" or "json"');
        }
    } catch (error) {
        console.error('Export error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Convert data to CSV format
function convertToCSV(data) {
    if (!data || !Array.isArray(data)) {
        return 'No data available';
    }
    
    if (data.length === 0) {
        return 'No data available';
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvHeader = headers.join(',');
    
    // Create CSV data rows
    const csvRows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );
    
    return [csvHeader, ...csvRows].join('\n');
}
