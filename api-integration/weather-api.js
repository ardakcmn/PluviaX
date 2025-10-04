// PluviaX API Integration
// Use this in your existing Node.js/Express app

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Your existing weather API endpoints
app.post('/api/weather', async (req, res) => {
    try {
        const { lat, lon, date } = req.body;
        
        // Call your PluviaX API
        const response = await fetch('https://your-pluvia-api.vercel.app/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lon, date })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { activity, weatherData, language } = req.body;
        
        // Call your PluviaX AI API
        const response = await fetch('https://your-pluvia-api.vercel.app/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity, weatherData, language })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
