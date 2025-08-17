import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeatherForecast = () => {
  const [forecastData, setForecastData] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      
      // Fetch current weather and 9-day forecast simultaneously
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc'),
        axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc')
      ]);

      
      setCurrentData(currentResponse.data);
      setForecastData(forecastResponse.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
      setError('無法獲取天氣數據，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconNumber) => {
    // Return corresponding Bootstrap icons based on Observatory weather icon numbers
    const iconMap = {
      50: 'bi-sun',      // Sunny
      51: 'bi-sun',      // Bright sunshine
      52: 'bi-cloud-sun', // Mainly sunny
      53: 'bi-cloud-sun', // Brief sunshine
      54: 'bi-clouds',    // Cloudy
      60: 'bi-clouds',    // Overcast
      61: 'bi-cloud-drizzle', // Showers
      62: 'bi-cloud-rain', // Occasional rain
      63: 'bi-cloud-rain-heavy', // Rain
      64: 'bi-cloud-rain-heavy', // Heavy rain
      65: 'bi-cloud-lightning-rain', // Thunderstorm
      70: 'bi-snow',      // Snow
      71: 'bi-snow',      // Snowflakes
      72: 'bi-snow',      // Snowflakes
      73: 'bi-snow',      // Snowflakes
      74: 'bi-snow',      // Snowflakes
      75: 'bi-snow',      // Snowflakes
      76: 'bi-cloud-hail', // Hail
      77: 'bi-cloud-hail', // Hail
      80: 'bi-wind',      // Windy
      81: 'bi-wind',      // Dry
      82: 'bi-wind',      // Humid
      83: 'bi-wind',      // Fog
      84: 'bi-wind',      // Mist
      85: 'bi-wind',      // Haze
      90: 'bi-thermometer-high', // Very hot
      91: 'bi-thermometer-low',  // Cold
      92: 'bi-thermometer-high', // Dry
      93: 'bi-moisture',  // Humid
    };
    return iconMap[iconNumber] || 'bi-cloud';
  };

  const getPSRIcon = (psr) => {
    // Significant rainfall probability icons - using umbrella consistently
    // Support both English and Chinese PSR values
    if (psr === 'High' || psr === '高') return 'bi-umbrella-fill text-danger';
    if (psr === 'Medium High' || psr === '中高') return 'bi-umbrella-fill text-warning';
    if (psr === 'Medium' || psr === '中') return 'bi-umbrella text-info';
    if (psr === 'Medium Low' || psr === '中低') return 'bi-umbrella text-secondary';
    return 'bi-umbrella text-success'; // Low/低 or other values
  };

  const getPSRText = (psr) => {


    const psrMap = {
      // English version
      'High': '高 (≥70%)',
      'Medium High': '中高 (55-69%)',
      'Medium': '中 (45-54%)',
      'Medium Low': '中低 (30-44%)',
      'Low': '低 (<30%)',
      // Chinese version
      '高': '高 (≥70%)',
      '中高': '中高 (55-69%)',
      '中': '中 (45-54%)',
      '中低': '中低 (30-44%)',
      '低': '低 (<30%)'
    };
    return psrMap[psr] || `${psr} (降雨概率)`;
  };

  // Helper function to safely extract values
  const getValue = (data, fieldName = 'value') => {

    
    if (data === null || data === undefined) return '--';
    
    // If it's an object, try to extract the value attribute or specified attribute
    if (typeof data === 'object' && !Array.isArray(data)) {
      if (data[fieldName] !== undefined) {
        return data[fieldName];
      }
      
      // If specified attribute not found, try some common attributes
      const commonFields = ['value', 'text', 'name', 'description'];
      for (const field of commonFields) {
        if (data[field] !== undefined) {
          console.warn(`Expected field '${fieldName}' not found, using '${field}' instead for:`, data);
          return data[field];
        }
      }
      
      // If it's an object but has no common attributes, return string representation or first value
      const values = Object.values(data);
      if (values.length > 0) {
        console.warn(`No suitable field found, returning first value for:`, data);
        return values[0];
      }
    }
    
    // If it's an array, return the first element
    if (Array.isArray(data)) {
      console.warn(`Received array, returning first element:`, data);
      return data.length > 0 ? getValue(data[0], fieldName) : '--';
    }
    
    // If it's a primitive value, return directly
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    console.warn(`Unexpected data type for field '${fieldName}':`, typeof data, data);
    
    // Fallback option - ensure we never return an object
    try {
      const stringValue = String(data);
      // If String() returns "[object Object]", it means we're trying to convert an object
      if (stringValue === "[object Object]") {
        console.warn(`Returning object as string would result in "[object Object]", using fallback:`, data);
        return '--';
      }
      return stringValue;
    } catch (e) {
      console.error(`Failed to convert to string:`, e);
      return '--';
    }
  };

  // Date formatting function
  const formatDate = (dateString, weekString) => {
    try {
      const date = getValue(dateString);
      const week = getValue(weekString);
      
      if (!date) return `第${weekString}天`;
      
      // Handle YYYYMMDD format (e.g.: 20250803)
      if (date.length === 8 && /^\d{8}$/.test(date)) {
        const year = date.substring(0, 4);
        const month = parseInt(date.substring(4, 6));
        const day = parseInt(date.substring(6, 8));
        return `${month}月${day}日 ${week}`;
      }
      
      // Handle YYYY-MM-DD format
      const parts = date.split('-');
      if (parts.length === 3) {
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        return `${month}月${day}日 ${week}`;
      }
      
      // If parsing fails, fallback to original format
      return `${date} ${week}`;
    } catch (error) {
      return `第${weekString}天`;
    }
  };

  // Format update time function
  const formatUpdateTime = (isoDateString) => {
    try {
      const dateStr = getValue(isoDateString);
      if (!dateStr) return '未知時間';
      
      // Handle ISO format: 2025-08-03T00:00:00+08:00
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return dateStr; // If unable to parse, return original string
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      return `${year}年${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Failed to format update time:', error);
      return getValue(isoDateString);
    }
  };

  // Prepare chart data - including today and 9-day forecast
  const prepareChartData = () => {
    if (!forecastData?.weatherForecast) return [];
    
    return forecastData.weatherForecast.map((day, index) => ({
      date: getValue(day.forecastDate),
      maxTemp: getValue(day.forecastMaxtemp),
      minTemp: getValue(day.forecastMintemp),
      maxHumidity: getValue(day.forecastMaxrh),
      minHumidity: getValue(day.forecastMinrh),
    }));
  };

  // Get current weather conditions to determine background color
  const getWeatherBackground = () => {
    // Check current weather icon
    if (currentData?.icon && currentData.icon.length > 0) {
      const iconNumber = getValue(currentData.icon[0]);
      
      if ([50, 51, 52].includes(iconNumber)) return 'sunny';
      if ([53, 54, 60].includes(iconNumber)) return 'cloudy';
      if ([61, 62, 63, 64].includes(iconNumber)) return 'rainy';
      if ([65].includes(iconNumber)) return 'stormy';
      if ([70, 71, 72, 73, 74, 75, 76, 77].includes(iconNumber)) return 'snowy';
    }
    
    // If there are warning messages, determine background based on warning type
    if (currentData?.warningMessage && currentData.warningMessage.length > 0) {
      const warning = currentData.warningMessage[0].toLowerCase();
      if (warning.includes('雷暴') || warning.includes('暴雨')) return 'stormy';
      if (warning.includes('雨')) return 'rainy';
    }
    
    // If there are special weather tips, usually indicates severe weather
    if (currentData?.specialWxTips && currentData.specialWxTips.length > 0) {
      return 'stormy';
    }
    
    return 'cloudy'; // Default cloudy
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-text">正在載入天氣資料...</div>
          <div className="loading-subtext">
            正在從香港天文台獲取最新數據
          </div>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <i className="bi bi-exclamation-triangle-fill error-icon"></i>
        <h3 className="error-title">載入失敗</h3>
        <p className="error-message">{error}</p>
        <button className="error-button" onClick={fetchWeatherData}>
          重新載入
        </button>
      </div>
    );
  }

  if (!forecastData && !currentData) {
    return null;
  }

  const chartData = prepareChartData();
  const weatherBg = getWeatherBackground();

  return (
    <div className={`weather-app ${weatherBg}`}>
      <div className="weather-container">
        {/* Stylish header section */}
        <header className="weather-header">
          <h1 className="weather-title">香港天氣</h1>
          <p className="weather-subtitle">香港天文台提供</p>
          {forecastData?.updateTime && (
            <div className="weather-update-time">
              <i className="bi bi-clock"></i>
              <span>最後更新：{formatUpdateTime(forecastData.updateTime)}</span>
            </div>
          )}
        </header>

        {/* Current weather main card */}
        {currentData && (
          <section className="current-weather">
            <h2 className="current-weather-title text-white">今天</h2>
            {/* Display Hong Kong Observatory temperature */}
            {currentData.temperature?.data && (
              <div className="current-temp">
                {(() => {
                  // Prioritize Hong Kong Observatory temperature
                  const hkoTemp = currentData.temperature.data.find(item => 
                    getValue(item.place) === '香港天文台'
                  );
                  if (hkoTemp) {
                    return `${getValue(hkoTemp, 'value')}°`;
                  }
                  // If no Hong Kong Observatory data, use first available data
                  return currentData.temperature.data.length > 0 
                    ? `${getValue(currentData.temperature.data[0], 'value')}°`
                    : '--°';
                })()}
              </div>
            )}
            
            {/* Display weather warning messages (if any) */}
            {currentData.warningMessage && currentData.warningMessage.length > 0 && (
              <div className="current-description">
                {currentData.warningMessage[0]}
              </div>
            )}
            
            {/* If no warning messages, display general weather conditions */}
            {(!currentData.warningMessage || currentData.warningMessage.length === 0) && 
             forecastData?.generalSituation && (
              <div className="current-description">
                {getValue(forecastData.generalSituation) || '一般天氣情況'}
              </div>
            )}
            
            <div className="current-details">
              {/* Humidity data */}
              {currentData.humidity?.data && currentData.humidity.data.length > 0 && (
                <div className="current-detail-item">
                  <div className="current-detail-label">濕度</div>
                  <div className="current-detail-value">
                    {getValue(currentData.humidity.data[0], 'value')}%
                  </div>
                </div>
              )}
              
              {/* UV index */}
              {currentData.uvindex && (
                <div className="current-detail-item">
                  <div className="current-detail-label">紫外線指數</div>
                  <div className="current-detail-value">
                    {getValue(currentData.uvindex) || '--'}
                  </div>
                </div>
              )}
              
              {/* Current rainfall (display highest rainfall area) */}
              {currentData.rainfall?.data && currentData.rainfall.data.length > 0 && (
                <div className="current-detail-item">
                  <div className="current-detail-label">降雨量</div>
                  <div className="current-detail-value">
                    {(() => {
                      // Find the area with highest rainfall
                      const maxRainfall = currentData.rainfall.data.reduce((max, current) => {
                        const currentMax = getValue(current, 'max') || 0;
                        const maxMax = getValue(max, 'max') || 0;
                        return currentMax > maxMax ? current : max;
                      });
                      return `${getValue(maxRainfall, 'max')}mm`;
                    })()}
                  </div>
                </div>
              )}
              
              {/* Temperature recording time */}
              {currentData.temperature?.recordTime && (
                <div className="current-detail-item">
                  <div className="current-detail-label">記錄時間</div>
                  <div className="current-detail-value">
                    {formatUpdateTime(currentData.temperature.recordTime)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Special weather tips */}
            {currentData.specialWxTips && currentData.specialWxTips.length > 0 && (
              <div className="weather-warning">
                <h4 className="warning-title">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  特別天氣提示
                </h4>
                <p className="warning-text">
                  {currentData.specialWxTips[0]}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Nine-day forecast */}
        {forecastData?.weatherForecast && (
          <section className="forecast-section">
            <h2 className="forecast-title">九天預報</h2>
            <div className="forecast-grid">
              {forecastData.weatherForecast.map((day, index) => (
                <article key={index} className="forecast-card">
                  <div className="forecast-date">
                    {formatDate(day.forecastDate, day.week)}
                  </div>
                  
                  <div className="forecast-icon">
                    <i className={getWeatherIcon(getValue(day.ForecastIcon))}></i>
                  </div>
                  
                  <div className="forecast-temps">
                    <span className="forecast-temp-high">{getValue(day.forecastMaxtemp) || '--'}°</span>
                    <span className="forecast-temp-low">{getValue(day.forecastMintemp) || '--'}°</span>
                  </div>
                  
                  <div className="forecast-details">
                    <div className="forecast-detail">
                      <span className="forecast-detail-label">濕度</span>
                      <span className="forecast-detail-value">
                        {getValue(day.forecastMinrh) || '--'}-{getValue(day.forecastMaxrh) || '--'}%
                      </span>
                    </div>
                    
                    {day.PSR && (
                      <div className="forecast-detail">
                        <span className="forecast-detail-label">降雨概率</span>
                        <span className="forecast-detail-value">
                          <i className={`${getPSRIcon(getValue(day.PSR) || '').split(' ')[0]} me-1`}></i>
                          {getPSRText(getValue(day.PSR) || '')}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Chart section */}
        {chartData.length > 0 && (
          <section className="chart-section">
            <h3 className="chart-title">溫度變化趨勢</h3>
            <ResponsiveContainer width="100%" height={window.innerWidth < 576 ? 250 : 300}>
              <LineChart data={chartData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: window.innerWidth < 576 ? 10 : 12, fill: 'rgba(255,255,255,0.7)'}}
                  tickFormatter={(value) => {
                    if (!value) return '';
                    // Handle YYYYMMDD format
                    if (value.length === 8 && /^\d{8}$/.test(value)) {
                      const month = parseInt(value.substring(4, 6));
                      const day = parseInt(value.substring(6, 8));
                      return `${month}/${day}`;
                    }
                    // 處理 YYYY-MM-DD 格式
                    if (value.includes('-')) {
                      const parts = value.split('-');
                      if (parts.length === 3) {
                        return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                      }
                    }
                    return value?.slice(-5) || '';
                  }}
                  stroke="rgba(255,255,255,0.5)"
                />
                <YAxis 
                  tick={{fontSize: window.innerWidth < 576 ? 10 : 12, fill: 'rgba(255,255,255,0.7)'}}
                  stroke="rgba(255,255,255,0.5)"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#ffffff' 
                  }}
                  labelFormatter={(value) => `日期: ${value}`}
                  formatter={(value, name) => [
                    `${value}°C`,
                    name === 'maxTemp' ? '最高溫度' : '最低溫度'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxTemp" 
                  stroke="rgba(255,255,255,0.9)" 
                  strokeWidth={3}
                  name="最高溫度"
                  dot={{ fill: 'rgba(255,255,255,0.9)', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="minTemp" 
                  stroke="rgba(255,255,255,0.6)" 
                  strokeWidth={3}
                  name="最低溫度"
                  dot={{ fill: 'rgba(255,255,255,0.6)', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

      </div>
    </div>
  );
};

export default WeatherForecast;