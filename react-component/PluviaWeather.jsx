import React, { useState, useEffect } from 'react';
import './PluviaWeather.css';

const PluviaWeather = ({ apiUrl = 'https://your-pluvia-api.vercel.app' }) => {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [activity, setActivity] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  // Get weather data
  const getWeatherData = async () => {
    if (!location) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          date: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('Weather error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get AI analysis
  const getAIAnalysis = async () => {
    if (!activity || !weather) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: activity,
          weatherData: weather,
          language: 'tr'
        })
      });
      
      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      getWeatherData();
    }
  }, [location]);

  return (
    <div className="pluvia-weather">
      <div className="pluvia-header">
        <h2>🌦️ PluviaX Weather Assistant</h2>
        {location && (
          <p>📍 Konum: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}</p>
        )}
      </div>

      {weather && (
        <div className="weather-card">
          <h3>Hava Durumu</h3>
          <div className="weather-info">
            <div className="weather-item">
              <span>🌡️ Sıcaklık:</span>
              <span>{weather.temp}°C</span>
            </div>
            <div className="weather-item">
              <span>💧 Nem:</span>
              <span>{weather.humidity}%</span>
            </div>
            <div className="weather-item">
              <span>💨 Rüzgar:</span>
              <span>{weather.wind_speed} m/s</span>
            </div>
          </div>
        </div>
      )}

      <div className="activity-section">
        <h3>Aktivite Sorgusu</h3>
        <input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Örn: Piknik yapmak istiyorum..."
          className="activity-input"
        />
        <button 
          onClick={getAIAnalysis}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? 'Analiz ediliyor...' : 'AI Analizi Yap'}
        </button>
      </div>

      {aiResponse && (
        <div className="ai-response">
          <h3>🤖 AI Tavsiyesi</h3>
          <p>{aiResponse}</p>
        </div>
      )}
    </div>
  );
};

export default PluviaWeather;
