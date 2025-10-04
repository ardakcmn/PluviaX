# 🌦️ PluviaX - AI Weather Assistant

> **NASA Space Apps Challenge 2025 - "Will It Rain On My Parade?"**

An AI-powered weather assistant that provides intelligent weather recommendations for your activities using multi-source weather data.

## ✨ Features

- 🌦️ **Multi-Source Weather Data**: Meteomatics + OpenWeatherMap + NASA POWER
- 🤖 **AI Weather Assistant**: DeepSeek AI for intelligent activity recommendations
- 🌍 **Multi-Language Support**: Turkish/English
- 📊 **Data Export**: CSV/JSON format for data analysis
- 📱 **Responsive Design**: Mobile-friendly modern UI
- 📍 **Location Services**: GPS + manual city input
- 📅 **7-Day Forecast**: Weekly weather overview

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pluvia-weather-ai.git
cd pluvia-weather-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your API keys:
```env
METEOMATICS_USERNAME=your_username
METEOMATICS_PASSWORD=your_password
OPENWEATHER_API_KEY=your_api_key
DEEPSEEK_API_KEY=your_api_key
```

4. **Start the server**
```bash
npm start
```

5. **Open your browser**
```
http://localhost:3000
```

## 🔧 API Endpoints

### Weather Data
- `POST /api/weather` - Get weather data for location and date
- `POST /api/analyze` - AI analysis for activity recommendations

### Data Export
- `GET /api/export/json` - Download weather data as JSON
- `GET /api/export/csv` - Download weather data as CSV

## 📊 Data Sources

- **Meteomatics**: Professional weather data
- **OpenWeatherMap**: Current weather and forecasts
- **NASA POWER**: Solar and meteorological data
- **DeepSeek AI**: Intelligent weather analysis

## 🌍 Supported Languages

- 🇹🇷 Turkish
- 🇬🇧 English

## 📱 Usage

1. **Select Location**: Use GPS or enter city name
2. **Choose Date**: Select date and time for weather data
3. **Ask Activity**: Describe what you want to do
4. **Get AI Advice**: Receive intelligent weather recommendations
5. **Export Data**: Download data in CSV/JSON format

## 🛠️ Development

### Project Structure
```
pluvia-weather-ai/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server.js
├── package.json
└── README.md
```

### Technologies Used
- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **APIs**: Meteomatics, OpenWeatherMap, NASA POWER, DeepSeek AI
- **Data Export**: CSV/JSON generation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 NASA Space Apps Challenge

This project was developed for the **NASA Space Apps Challenge 2025** under the theme **"Will It Rain On My Parade?"**

### Challenge Requirements Met:
- ✅ Multi-source weather data integration
- ✅ AI-powered weather analysis
- ✅ Data accessibility (CSV/JSON export)
- ✅ User-friendly interface
- ✅ Real-time weather recommendations

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

## 🙏 Acknowledgments

- NASA for the Space Apps Challenge
- Meteomatics for professional weather data
- OpenWeatherMap for weather API
- NASA POWER for solar data
- DeepSeek for AI capabilities

---

**Made with ❤️ for NASA Space Apps Challenge 2025**