let currentLocation = null;
let currentDate = null;
let currentLanguage = localStorage.getItem('language') || 'tr';

// Çoklu Dil Sistemi
const translations = {
    tr: {
        subtitle: 'Yapay zeka destekli hava durumu asistanı',
        locationTitle: '📍 Konum ve Tarih',
        useLocation: '📍 Konumumu Kullan',
        or: 'veya',
        locationPlaceholder: 'Şehir adı girin (örn: Istanbul)',
        dateLabel: '📅 Tarih ve Saat Seçin',
        activityTitle: '💬 Aktivite Sorgusu',
        welcomeMessage: 'Merhaba! 👋 Yapmak istediğin aktiviteyi yaz, hava durumuna göre sana tavsiye vereyim.',
        activityPlaceholder: 'Örn: Piknik yapmak istiyorum...',
        send: 'Gönder',
        weatherTitle: 'Hava Durumu',
        weeklyForecast: '📅 7 Günlük Hava Tahmini',
        footer: 'NASA Space Apps Challenge 2025 - Will It Rain On My Parade? 🌧️',
        locationError: 'Konum alınamadı. Lütfen manuel olarak şehir girin.',
        cityNotFound: 'Şehir bulunamadı. Lütfen tekrar deneyin.',
        locationSearchError: 'Konum aranırken hata oluştu.',
        enterActivity: 'Lütfen bir aktivite yazın.',
        selectLocation: 'Lütfen önce konum seçin.',
        errorOccurred: 'Üzgünüm, bir hata oluştu: ',
        selectedLocation: '📍 Seçili Konum:',
        coordinates: 'Koordinatlar:',
        days: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
        exportJSON: '📄 JSON İndir',
        exportCSV: '📊 CSV İndir',
        exportSuccess: 'Veri başarıyla indirildi!',
        exportError: 'Veri indirilemedi: '
    },
    en: {
        subtitle: 'AI-powered weather assistant',
        locationTitle: '📍 Location and Date',
        useLocation: '📍 Use My Location',
        or: 'or',
        locationPlaceholder: 'Enter city name (e.g: Istanbul)',
        dateLabel: '📅 Select Date and Time',
        activityTitle: '💬 Activity Query',
        welcomeMessage: 'Hello! 👋 Tell me what activity you want to do, and I\'ll give you weather advice.',
        activityPlaceholder: 'E.g: I want to have a picnic...',
        send: 'Send',
        weatherTitle: 'Weather',
        weeklyForecast: '📅 7-Day Forecast',
        footer: 'NASA Space Apps Challenge 2025 - Will It Rain On My Parade? 🌧️',
        locationError: 'Location unavailable. Please enter city manually.',
        cityNotFound: 'City not found. Please try again.',
        locationSearchError: 'Error occurred while searching location.',
        enterActivity: 'Please enter an activity.',
        selectLocation: 'Please select a location first.',
        errorOccurred: 'Sorry, an error occurred: ',
        selectedLocation: '📍 Selected Location:',
        coordinates: 'Coordinates:',
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        exportJSON: '📄 Download JSON',
        exportCSV: '📊 Download CSV',
        exportSuccess: 'Data downloaded successfully!',
        exportError: 'Failed to download data: '
    }
};

// Dil değiştirme fonksiyonu
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Tüm data-i18n elementlerini güncelle
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Placeholder'ları güncelle
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Dil butonlarını güncelle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    
    // Eğer 7 günlük tahmin gösteriliyorsa, yenile (çeviriler için)
    const forecastSection = document.getElementById('weeklyForecast');
    if (forecastSection && !forecastSection.classList.contains('hidden') && currentLocation) {
        fetch7DayForecast(currentLocation.lat, currentLocation.lon);
    }
}

// Hava durumu sembolleri için açıklamalar ve icon'lar
const weatherSymbols = {
    1: { tr: 'Açık hava', en: 'Clear sky', icon: '☀️' },
    2: { tr: 'Az bulutlu', en: 'Few clouds', icon: '🌤️' },
    3: { tr: 'Parçalı bulutlu', en: 'Partly cloudy', icon: '⛅' },
    4: { tr: 'Çok bulutlu', en: 'Mostly cloudy', icon: '☁️' },
    5: { tr: 'Yağmurlu', en: 'Rainy', icon: '🌧️' },
    6: { tr: 'Sağanak yağışlı', en: 'Showers', icon: '🌦️' },
    7: { tr: 'Kar yağışlı', en: 'Snowy', icon: '❄️' },
    8: { tr: 'Gök gürültülü fırtına', en: 'Thunderstorm', icon: '⛈️' },
    9: { tr: 'Sisli', en: 'Foggy', icon: '🌫️' },
    10: { tr: 'Puslu', en: 'Hazy', icon: '🌁' },
    11: { tr: 'Karlı fırtına', en: 'Blizzard', icon: '🌨️' },
    12: { tr: 'Dolu', en: 'Hail', icon: '🧊' },
    13: { tr: 'Hafif yağmur', en: 'Light rain', icon: '🌦️' },
    14: { tr: 'Orta yağmur', en: 'Moderate rain', icon: '🌧️' },
    15: { tr: 'Şiddetli yağmur', en: 'Heavy rain', icon: '⛈️' },
    // Geçersiz değerler için fallback
    101: { tr: 'Bilinmeyen', en: 'Unknown', icon: '🌡️' }
};

// Hava durumu simgesi döndür
function getWeatherIcon(symbolIdx) {
    const symbol = weatherSymbols[Math.round(symbolIdx)];
    return symbol ? symbol.icon : '🌡️';
}

// Hava durumu açıklaması döndür
function getWeatherDescription(symbolIdx) {
    const symbol = weatherSymbols[Math.round(symbolIdx)];
    if (!symbol) {
        console.warn('Weather symbol not found for index:', symbolIdx);
        return 'Bilinmeyen';
    }
    // currentLanguage kontrolü
    const lang = currentLanguage || 'tr';
    const result = symbol[lang] || symbol.tr;
    return result;
}

// Multi-source weather data parser (Meteomatics + OpenWeather + NASA)
function parseWeatherData(combinedData) {
    try {
        const weatherInfo = {};
        
        // Meteomatics verisi
        if (combinedData.meteomatics && combinedData.meteomatics.data) {
            combinedData.meteomatics.data.forEach(param => {
                const paramName = param.parameter;
                const value = param.coordinates[0].dates[0].value;
                
                if (paramName.startsWith('t_2m:C')) {
                    weatherInfo.temp = value;
                } else if (paramName.startsWith('t_apparent:C')) {
                    weatherInfo.feels_like = value;
                } else if (paramName.startsWith('relative_humidity_2m:p')) {
                    weatherInfo.humidity = value;
                } else if (paramName.startsWith('wind_speed_10m:ms')) {
                    weatherInfo.wind_speed = value;
                } else if (paramName.startsWith('prob_precip_1h:p')) {
                    weatherInfo.rain_probability = value;
                } else if (paramName.startsWith('precip_1h:mm')) {
                    weatherInfo.precipitation = value;
                } else if (paramName.startsWith('weather_symbol_1h:idx')) {
                    weatherInfo.symbolIdx = value;
                    weatherInfo.description = getWeatherDescription(value);
                    weatherInfo.icon = getWeatherIcon(value);
                } else if (paramName.startsWith('uv:idx')) {
                    // UV index kontrolü - geçerli range (0-15)
                    if (value >= 0 && value <= 15) {
                        weatherInfo.uv_index = value;
                    }
                } else if (paramName.startsWith('wind_gusts')) {
                    weatherInfo.wind_gust = value;
                }
            });
        }
        
        // OpenWeather verisi - fallback ve ek bilgiler
        if (combinedData.openweather && combinedData.openweather.current) {
            const ow = combinedData.openweather.current;
            
            // Meteomatics'ten yoksa OpenWeather'dan al
            if (!weatherInfo.temp && ow.main) weatherInfo.temp = ow.main.temp;
            if (!weatherInfo.feels_like && ow.main) weatherInfo.feels_like = ow.main.feels_like;
            if (!weatherInfo.humidity && ow.main) weatherInfo.humidity = ow.main.humidity;
            if (!weatherInfo.wind_speed && ow.wind) weatherInfo.wind_speed = ow.wind.speed;
            
            // OpenWeather özel verileri
            // Visibility - OpenWeather metre cinsinden veriyor
            if (ow.visibility !== undefined && ow.visibility > 0) {
                weatherInfo.visibility = ow.visibility / 1000; // km'ye çevir
                weatherInfo.visibility_raw = ow.visibility; // Ham veri (debug için)
            }
            // Basınç kontrolü - geçerli range (850-1100 hPa)
            if (ow.main && ow.main.pressure) {
                const pressure = ow.main.pressure;
                if (pressure > 850 && pressure < 1100) {
                    weatherInfo.pressure = pressure;
                }
            }
            if (ow.clouds) weatherInfo.cloud_cover = ow.clouds.all;
            
            // Eğer icon yoksa OpenWeather'dan al
            if (!weatherInfo.icon && ow.weather && ow.weather[0]) {
                const owIcon = ow.weather[0].icon;
                weatherInfo.icon = getOpenWeatherIcon(owIcon);
                weatherInfo.description = ow.weather[0].description;
            }
        }
        
        // NASA POWER verisi - UV index (en güvenilir kaynak)
        if (combinedData.nasa && combinedData.nasa.properties && combinedData.nasa.properties.parameter) {
            const nasa = combinedData.nasa.properties.parameter;
            
            // UV Index (NASA'dan daha güvenilir) - sadece geçerli değerler
            if (nasa.ALLSKY_SFC_UV_INDEX) {
                const dates = Object.keys(nasa.ALLSKY_SFC_UV_INDEX);
                if (dates.length > 0) {
                    const latestDate = dates[dates.length - 1];
                    const uvValue = nasa.ALLSKY_SFC_UV_INDEX[latestDate];
                    // -999 veya negatif değerler "no data" anlamına gelir
                    // UV Index normalde 0-15 arasındadır
                    if (uvValue >= 0 && uvValue <= 15) {
                        weatherInfo.uv_index_nasa = uvValue;
                    }
                }
            }
        }
        
        // Data source bilgisi ve doğruluk hesaplama
        weatherInfo.sources = {
            meteomatics: !!combinedData.meteomatics,
            openweather: !!combinedData.openweather,
            nasa: !!combinedData.nasa
        };
        
        // Veri doğruluğu hesapla (0-100%)
        let accuracy = 0;
        let dataPoints = 0;
        let availablePoints = 0;
        
        // Temel veriler (zorunlu)
        if (weatherInfo.temp !== undefined) dataPoints++;
        if (weatherInfo.humidity !== undefined) dataPoints++;
        if (weatherInfo.wind_speed !== undefined) dataPoints++;
        availablePoints += 3;
        
        // Ek veriler (bonus)
        if (weatherInfo.feels_like !== undefined) dataPoints++;
        if (weatherInfo.rain_probability !== undefined) dataPoints++;
        if (weatherInfo.uv_index || weatherInfo.uv_index_nasa) dataPoints++;
        if (weatherInfo.pressure) dataPoints++;
        if (weatherInfo.visibility) dataPoints++;
        availablePoints += 5;
        
        // API sayısına göre bonus
        const apiCount = (weatherInfo.sources.meteomatics ? 1 : 0) + 
                        (weatherInfo.sources.openweather ? 1 : 0) + 
                        (weatherInfo.sources.nasa ? 1 : 0);
        
        // Doğruluk hesapla: veri noktaları (80%) + API çeşitliliği (20%)
        const dataScore = (dataPoints / availablePoints) * 80;
        const apiScore = (apiCount / 3) * 20;
        accuracy = Math.round(dataScore + apiScore);
        
        weatherInfo.accuracy = accuracy;
        
        return weatherInfo;
    } catch (error) {
        console.error('Parse error:', error);
        return null;
    }
}

// OpenWeather icon'larını emoji'ye çevir
function getOpenWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌙',
        '02d': '🌤️', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌡️';
}

// Sayfa yüklendiğinde bugünün tarihini ayarla
document.addEventListener('DOMContentLoaded', () => {
    // Dil sistemini başlat
    changeLanguage(currentLanguage);
    
    // Dil değiştirme butonları
    document.getElementById('langTR').addEventListener('click', () => changeLanguage('tr'));
    document.getElementById('langEN').addEventListener('click', () => changeLanguage('en'));
    
    const now = new Date();
    const dateInput = document.getElementById('dateInput');
    
    // Local timezone'da datetime-local formatı
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    currentDate = dateInput.value;
});

// Mevcut konumu al
document.getElementById('getCurrentLocation').addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoader();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                
                // Reverse geocoding ile şehir adını al
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.lat}&lon=${currentLocation.lon}&format=json`
                    );
                    const data = await response.json();
                    const cityName = data.address.city || data.address.town || data.address.village || 'Konum';
                    
                    displayLocation(cityName, currentLocation.lat, currentLocation.lon);
                } catch (error) {
                    const locationText = currentLanguage === 'tr' ? 'Konum alındı' : 'Location received';
                    displayLocation(locationText, currentLocation.lat, currentLocation.lon);
                }
                hideLoader();
            },
            (error) => {
                hideLoader();
                alert(translations[currentLanguage].locationError);
            }
        );
    } else {
        const browserErrorMsg = currentLanguage === 'tr' ? 
            'Tarayıcınız konum servisini desteklemiyor.' : 
            'Your browser does not support location services.';
        alert(browserErrorMsg);
    }
});

// Manuel konum girişi
document.getElementById('locationInput').addEventListener('change', async (e) => {
    const cityName = e.target.value;
    if (cityName) {
        showLoader();
        try {
            // Geocoding ile şehir adından koordinat al
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`
            );
            const data = await response.json();
            
            if (data.length > 0) {
                currentLocation = {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
                displayLocation(data[0].display_name, currentLocation.lat, currentLocation.lon);
            } else {
                alert(translations[currentLanguage].cityNotFound);
            }
        } catch (error) {
            alert(translations[currentLanguage].locationSearchError);
        }
        hideLoader();
    }
});

// Tarih değişikliği
document.getElementById('dateInput').addEventListener('change', (e) => {
    currentDate = e.target.value;
});

// Aktivite gönder
document.getElementById('sendActivity').addEventListener('click', sendActivity);
document.getElementById('activityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendActivity();
    }
});

// Export butonları
document.getElementById('exportJSON').addEventListener('click', () => exportData('json'));
document.getElementById('exportCSV').addEventListener('click', () => exportData('csv'));

async function sendActivity() {
    const activityInput = document.getElementById('activityInput');
    const activity = activityInput.value.trim();
    
    if (!activity) {
        alert(translations[currentLanguage].enterActivity);
        return;
    }
    
    if (!currentLocation) {
        alert(translations[currentLanguage].selectLocation);
        return;
    }
    
    // Kullanıcı mesajını göster
    addMessage(activity, 'user');
    activityInput.value = '';
    
    showLoader();
    
    try {
        // Hava durumu verisini al
        const weatherResponse = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: currentLocation.lat,
                lon: currentLocation.lon,
                date: currentDate
            })
        });
        
        const weatherData = await weatherResponse.json();
        
        if (!weatherResponse.ok) {
            throw new Error(weatherData.error || 'Hava durumu alınamadı');
        }
        
        // Multi-source weather data parse et
        const weatherInfo = parseWeatherData(weatherData);
        
        if (!weatherInfo) {
            throw new Error('Hava durumu verisi işlenemedi');
        }
        
        // Hava durumu kartını göster
        displayWeather(weatherInfo);
        
        // AI analizi yap
        const aiResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activity: activity,
                weatherData: weatherInfo,
                language: currentLanguage
            })
        });
        
        const aiData = await aiResponse.json();
        
        if (!aiResponse.ok) {
            throw new Error(aiData.error || 'AI analizi yapılamadı');
        }
        
        // Bot yanıtını göster
        addMessage(aiData.response, 'bot');
        
    } catch (error) {
        console.error('Error:', error);
        addMessage(translations[currentLanguage].errorOccurred + error.message, 'bot');
    }
    
    hideLoader();
}

function displayLocation(name, lat, lon) {
    const display = document.getElementById('locationDisplay');
    display.innerHTML = `
        <strong>${translations[currentLanguage].selectedLocation}</strong> ${name}<br>
        <small>${translations[currentLanguage].coordinates} ${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
    `;
    
    // 7 günlük tahmini otomatik göster
    fetch7DayForecast(lat, lon);
}

// 7 günlük hava tahmini çek
async function fetch7DayForecast(lat, lon) {
    try {
        showLoader();
        
        const forecastDays = [];
        const now = new Date();
        
        // 7 gün için tarihleri oluştur
        for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);
            date.setHours(12, 0, 0, 0); // Öğlen saati
            forecastDays.push(date.toISOString());
        }
        
        // Her gün için veri çek
        const promises = forecastDays.map(date => 
            fetch('/api/weather', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lon, date })
            }).then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        displayWeeklyForecast(results, forecastDays);
        
        hideLoader();
    } catch (error) {
        console.error('7-day forecast error:', error);
        hideLoader();
    }
}

// 7 günlük tahmini göster
function displayWeeklyForecast(dataArray, dates) {
    const forecastSection = document.getElementById('weeklyForecast');
    const forecastDaysContainer = document.getElementById('forecastDays');
    
    forecastDaysContainer.innerHTML = '';
    
    dataArray.forEach((weatherData, index) => {
        const weatherInfo = parseWeatherData(weatherData);
        if (!weatherInfo) return;
        
        const date = new Date(dates[index]);
        const dayName = translations[currentLanguage].days[date.getDay()];
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        
        const dayCard = document.createElement('div');
        dayCard.className = 'forecast-day';
        
        // Hava durumu açıklamasını dile göre al
        let description = weatherInfo.description || '';
        if (weatherInfo.symbolIdx !== undefined) {
            description = getWeatherDescription(weatherInfo.symbolIdx);
        }
        
        dayCard.innerHTML = `
            <div class="forecast-day-name">${dayName}</div>
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-icon">${weatherInfo.icon || '🌡️'}</div>
            <div class="forecast-temp">${weatherInfo.temp ? weatherInfo.temp.toFixed(0) : '--'}°C</div>
            <div class="forecast-description">${description}</div>
            <div class="forecast-details">
                <div>💧 ${weatherInfo.rain_probability ? weatherInfo.rain_probability.toFixed(0) : 0}%</div>
                <div>💨 ${weatherInfo.wind_speed ? weatherInfo.wind_speed.toFixed(1) : 0} m/s</div>
            </div>
        `;
        
        forecastDaysContainer.appendChild(dayCard);
    });
    
    forecastSection.classList.remove('hidden');
}

function displayWeather(weather) {
    const weatherCard = document.getElementById('weatherCard');
    const weatherInfo = document.getElementById('weatherInfo');
    
    let html = `
        <div class="weather-item">
            <strong>🌡️ ${currentLanguage === 'tr' ? 'Sıcaklık' : 'Temperature'}</strong>
            <span>${weather.temp ? weather.temp.toFixed(1) : '--'}°C</span>
        </div>
        <div class="weather-item">
            <strong>🤚 ${currentLanguage === 'tr' ? 'Hissedilen' : 'Feels Like'}</strong>
            <span>${weather.feels_like ? weather.feels_like.toFixed(1) : '--'}°C</span>
        </div>
        <div class="weather-item">
            <strong>☁️ ${currentLanguage === 'tr' ? 'Durum' : 'Condition'}</strong>
            <span>${weather.icon || '🌡️'} ${weather.description || '--'}</span>
        </div>
        <div class="weather-item">
            <strong>💧 ${currentLanguage === 'tr' ? 'Nem' : 'Humidity'}</strong>
            <span>${weather.humidity ? weather.humidity.toFixed(0) : '--'}%</span>
        </div>
        <div class="weather-item">
            <strong>💨 ${currentLanguage === 'tr' ? 'Rüzgar' : 'Wind'}</strong>
            <span>${weather.wind_speed ? weather.wind_speed.toFixed(1) : '--'} m/s</span>
        </div>
        <div class="weather-item">
            <strong>🌧️ ${currentLanguage === 'tr' ? 'Yağış İhtimali' : 'Rain Probability'}</strong>
            <span>${weather.rain_probability ? weather.rain_probability.toFixed(0) : 0}%</span>
        </div>
    `;
    
    // UV Index (NASA veya Meteomatics'ten) - sadece geçerli değerler
    const uvIndex = weather.uv_index_nasa || weather.uv_index;
    if (uvIndex !== undefined && uvIndex >= 0 && uvIndex <= 15) {
        html += `
        <div class="weather-item">
            <strong>☀️ UV ${currentLanguage === 'tr' ? 'İndeksi' : 'Index'}</strong>
            <span>${uvIndex.toFixed(1)}</span>
        </div>`;
    }
    
    // Görünürlük (OpenWeather'dan) - sadece düşük görüş mesafesinde göster
    if (weather.visibility && weather.visibility > 0 && weather.visibility < 10) {
        // 10 km'den az ise önemli (sis, yağmur vb.)
        const visibilityClass = weather.visibility < 5 ? 'weather-item-warning' : 'weather-item';
        html += `
        <div class="${visibilityClass}">
            <strong>👁️ ${currentLanguage === 'tr' ? 'Görüş Mesafesi' : 'Visibility'}</strong>
            <span>${weather.visibility.toFixed(1)} km ${weather.visibility < 5 ? '⚠️' : ''}</span>
        </div>`;
    }
    
    // Basınç - sadece geçerli değerler (850-1100 hPa arası normal)
    if (weather.pressure && weather.pressure > 850 && weather.pressure < 1100) {
        html += `
        <div class="weather-item">
            <strong>🔽 ${currentLanguage === 'tr' ? 'Basınç' : 'Pressure'}</strong>
            <span>${weather.pressure.toFixed(0)} hPa</span>
        </div>`;
    }
    
    // Rüzgar şiddeti (Meteomatics'ten) - sadece geçerli değerler
    if (weather.wind_gust && weather.wind_gust > 0 && weather.wind_gust < 200) {
        html += `
        <div class="weather-item">
            <strong>💨 ${currentLanguage === 'tr' ? 'Rüzgar Şiddeti' : 'Wind Gust'}</strong>
            <span>${weather.wind_gust.toFixed(1)} m/s</span>
        </div>`;
    }
    
    // Veri doğruluğu
    if (weather.accuracy !== undefined) {
        const accuracyClass = weather.accuracy >= 80 ? 'accuracy-high' : 
                             weather.accuracy >= 60 ? 'accuracy-medium' : 'accuracy-low';
        html += `
        <div class="weather-item weather-accuracy ${accuracyClass}">
            <strong>✓ ${currentLanguage === 'tr' ? 'Veri Doğruluğu' : 'Data Accuracy'}</strong>
            <span class="accuracy-value">${weather.accuracy}%</span>
            <div class="accuracy-bar">
                <div class="accuracy-bar-fill" style="width: ${weather.accuracy}%"></div>
            </div>
        </div>`;
    }
    
    // Veri kaynakları
    if (weather.sources) {
        const sources = [];
        if (weather.sources.meteomatics) sources.push('Meteomatics');
        if (weather.sources.openweather) sources.push('OpenWeather');
        if (weather.sources.nasa) sources.push('NASA');
        
        html += `
        <div class="weather-item weather-sources">
            <strong>📊 ${currentLanguage === 'tr' ? 'Veri Kaynakları' : 'Data Sources'}</strong>
            <span>${sources.join(', ')}</span>
        </div>`;
    }
    
    weatherInfo.innerHTML = html;
    weatherCard.classList.remove('hidden');
}

function addMessage(text, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Export functions
async function exportData(format) {
    if (!currentLocation) {
        alert(translations[currentLanguage].selectLocation);
        return;
    }
    
    try {
        showLoader();
        
        const url = `/api/export/${format}?lat=${currentLocation.lat}&lon=${currentLocation.lon}&date=${currentDate || new Date().toISOString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `weather_data_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(downloadUrl);
        
        alert(translations[currentLanguage].exportSuccess);
        
    } catch (error) {
        console.error('Export error:', error);
        alert(translations[currentLanguage].exportError + error.message);
    } finally {
        hideLoader();
    }
}

