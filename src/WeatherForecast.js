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
      
      // 同時獲取當前天氣和9天預報
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc'),
        axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc')
      ]);
      
      setCurrentData(currentResponse.data);
      setForecastData(forecastResponse.data);
      setError(null);
    } catch (err) {
      console.error('獲取天氣數據失敗:', err);
      setError('無法獲取天氣數據，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconNumber) => {
    // 根據天文台的天氣圖標編號返回對應的 Bootstrap 圖標
    const iconMap = {
      50: 'bi-sun',      // 晴朗
      51: 'bi-sun',      // 陽光充沛
      52: 'bi-cloud-sun', // 大致晴朗
      53: 'bi-cloud-sun', // 短暫陽光
      54: 'bi-clouds',    // 多雲
      60: 'bi-clouds',    // 陰天
      61: 'bi-cloud-drizzle', // 有驟雨
      62: 'bi-cloud-rain', // 間中有雨
      63: 'bi-cloud-rain-heavy', // 有雨
      64: 'bi-cloud-rain-heavy', // 有大雨
      65: 'bi-cloud-lightning-rain', // 雷暴
      70: 'bi-snow',      // 有雪
      71: 'bi-snow',      // 有雪花
      72: 'bi-snow',      // 有雪花
      73: 'bi-snow',      // 有雪花
      74: 'bi-snow',      // 有雪花
      75: 'bi-snow',      // 有雪花
      76: 'bi-cloud-hail', // 有冰雹
      77: 'bi-cloud-hail', // 有冰雹
      80: 'bi-wind',      // 有風
      81: 'bi-wind',      // 乾燥
      82: 'bi-wind',      // 潮濕
      83: 'bi-wind',      // 霧
      84: 'bi-wind',      // 薄霧
      85: 'bi-wind',      // 煙霞
      90: 'bi-thermometer-high', // 酷熱
      91: 'bi-thermometer-low',  // 寒冷
      92: 'bi-thermometer-high', // 乾燥
      93: 'bi-moisture',  // 潮濕
    };
    return iconMap[iconNumber] || 'bi-cloud';
  };

  const getPSRIcon = (psr) => {
    // 顯著降雨概率圖標 - 統一使用雨傘
    // 支援英文和中文PSR值
    if (psr === 'High' || psr === '高') return 'bi-umbrella-fill text-danger';
    if (psr === 'Medium High' || psr === '中高') return 'bi-umbrella-fill text-warning';
    if (psr === 'Medium' || psr === '中') return 'bi-umbrella text-info';
    if (psr === 'Medium Low' || psr === '中低') return 'bi-umbrella text-secondary';
    return 'bi-umbrella text-success'; // Low/低 或其他值
  };

  const getPSRText = (psr) => {
    const psrMap = {
      // 英文版本
      'High': '高 (≥70%)',
      'Medium High': '中高 (55-69%)',
      'Medium': '中 (45-54%)',
      'Medium Low': '中低 (30-44%)',
      'Low': '低 (<30%)',
      // 中文版本
      '高': '高 (≥70%)',
      '中高': '中高 (55-69%)',
      '中': '中 (45-54%)',
      '中低': '中低 (30-44%)',
      '低': '低 (<30%)'
    };
    return psrMap[psr] || `${psr} (降雨概率)`;
  };

  // 安全地提取數值的幫助函數
  const getValue = (data, fieldName = 'value') => {
    if (data === null || data === undefined) return '--';
    
    // 如果是物件，嘗試提取 value 屬性或指定的屬性
    if (typeof data === 'object' && !Array.isArray(data)) {
      if (data[fieldName] !== undefined) {
        return data[fieldName];
      }
      
      // 如果沒有找到指定屬性，嘗試一些常見的屬性
      const commonFields = ['value', 'text', 'name', 'description'];
      for (const field of commonFields) {
        if (data[field] !== undefined) {
          console.warn(`Expected field '${fieldName}' not found, using '${field}' instead for:`, data);
          return data[field];
        }
      }
      
      // 如果是物件但沒有常見屬性，返回物件的字符串表示或第一個值
      const values = Object.values(data);
      if (values.length > 0) {
        console.warn(`No suitable field found, returning first value for:`, data);
        return values[0];
      }
    }
    
    // 如果是陣列，返回第一個元素
    if (Array.isArray(data)) {
      console.warn(`Received array, returning first element:`, data);
      return data.length > 0 ? getValue(data[0], fieldName) : '--';
    }
    
    // 如果是原始值，直接返回
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    console.warn(`Unexpected data type for field '${fieldName}':`, typeof data, data);
    
    // 回退方案
    try {
      return String(data);
    } catch (e) {
      console.error(`Failed to convert to string:`, e);
      return '--';
    }
    
    return '--';
  };

  // 格式化日期函數
  const formatDate = (dateString, weekString) => {
    try {
      const date = getValue(dateString);
      const week = getValue(weekString);
      
      if (!date) return `第${weekString}天`;
      
      // 處理 YYYYMMDD 格式 (如: 20250803)
      if (date.length === 8 && /^\d{8}$/.test(date)) {
        const year = date.substring(0, 4);
        const month = parseInt(date.substring(4, 6));
        const day = parseInt(date.substring(6, 8));
        return `${month}月${day}日 ${week}`;
      }
      
      // 處理 YYYY-MM-DD 格式
      const parts = date.split('-');
      if (parts.length === 3) {
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        return `${month}月${day}日 ${week}`;
      }
      
      // 如果解析失敗，回退到原有格式
      return `${date} ${week}`;
    } catch (error) {
      return `第${weekString}天`;
    }
  };

  // 格式化更新時間函數
  const formatUpdateTime = (isoDateString) => {
    try {
      const dateStr = getValue(isoDateString);
      if (!dateStr) return '未知時間';
      
      // 處理 ISO 格式：2025-08-03T00:00:00+08:00
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return dateStr; // 如果無法解析，返回原始字符串
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      return `${year}年${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('格式化更新時間失敗:', error);
      return getValue(isoDateString);
    }
  };

  // 準備圖表數據 - 包含今日和9天預報
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

  // 獲取當前天氣狀況以決定背景顏色
  const getWeatherBackground = () => {
    // 檢查當前天氣圖標
    if (currentData?.icon && currentData.icon.length > 0) {
      const iconNumber = getValue(currentData.icon[0]);
      
      if ([50, 51, 52].includes(iconNumber)) return 'sunny';
      if ([53, 54, 60].includes(iconNumber)) return 'cloudy';
      if ([61, 62, 63, 64].includes(iconNumber)) return 'rainy';
      if ([65].includes(iconNumber)) return 'stormy';
      if ([70, 71, 72, 73, 74, 75, 76, 77].includes(iconNumber)) return 'snowy';
    }
    
    // 如果有警告信息，根據警告類型決定背景
    if (currentData?.warningMessage && currentData.warningMessage.length > 0) {
      const warning = currentData.warningMessage[0].toLowerCase();
      if (warning.includes('雷暴') || warning.includes('暴雨')) return 'stormy';
      if (warning.includes('雨')) return 'rainy';
    }
    
    // 如果有特別天氣提示，通常表示惡劣天氣
    if (currentData?.specialWxTips && currentData.specialWxTips.length > 0) {
      return 'stormy';
    }
    
    return 'cloudy'; // 默認多雲
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在載入天氣資料...</div>
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
        {/* 風格標題區域 */}
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

        {/* 當前天氣大卡片 */}
        {currentData && (
          <section className="current-weather">
            <h2 className="current-weather-title text-white">今天</h2>
            {/* 顯示香港天文台的溫度 */}
            {currentData.temperature?.data && (
              <div className="current-temp">
                {(() => {
                  // 優先使用香港天文台的溫度
                  const hkoTemp = currentData.temperature.data.find(item => 
                    getValue(item.place) === '香港天文台'
                  );
                  if (hkoTemp) {
                    return `${getValue(hkoTemp)}°`;
                  }
                  // 如果沒有香港天文台數據，使用第一個可用數據
                  return currentData.temperature.data.length > 0 
                    ? `${getValue(currentData.temperature.data[0])}°`
                    : '--°';
                })()}
              </div>
            )}
            
            {/* 顯示天氣警告信息（如果有） */}
            {currentData.warningMessage && currentData.warningMessage.length > 0 && (
              <div className="current-description">
                {currentData.warningMessage[0]}
              </div>
            )}
            
            {/* 如果沒有警告信息，顯示一般天氣概況 */}
            {(!currentData.warningMessage || currentData.warningMessage.length === 0) && 
             forecastData?.generalSituation && (
              <div className="current-description">
                {getValue(forecastData.generalSituation)}
              </div>
            )}
            
            <div className="current-details">
              {/* 濕度數據 */}
              {currentData.humidity?.data && currentData.humidity.data.length > 0 && (
                <div className="current-detail-item">
                  <div className="current-detail-label">濕度</div>
                  <div className="current-detail-value">
                    {getValue(currentData.humidity.data[0])}%
                  </div>
                </div>
              )}
              
              {/* 紫外線指數 */}
              {currentData.uvindex && (
                <div className="current-detail-item">
                  <div className="current-detail-label">紫外線指數</div>
                  <div className="current-detail-value">
                    {currentData.uvindex || '--'}
                  </div>
                </div>
              )}
              
              {/* 當前降雨量（顯示最高降雨量地區） */}
              {currentData.rainfall?.data && currentData.rainfall.data.length > 0 && (
                <div className="current-detail-item">
                  <div className="current-detail-label">降雨量</div>
                  <div className="current-detail-value">
                    {(() => {
                      // 找出降雨量最高的地區
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
              
              {/* 溫度記錄時間 */}
              {currentData.temperature?.recordTime && (
                <div className="current-detail-item">
                  <div className="current-detail-label">記錄時間</div>
                  <div className="current-detail-value">
                    {formatUpdateTime(currentData.temperature.recordTime)}
                  </div>
                </div>
              )}
            </div>
            
            {/* 特別天氣提示 */}
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

        {/* 九天預報 */}
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
                    <span className="forecast-temp-high">{getValue(day.forecastMaxtemp)}°</span>
                    <span className="forecast-temp-low">{getValue(day.forecastMintemp)}°</span>
                  </div>
                  
                  <div className="forecast-details">
                    <div className="forecast-detail">
                      <span className="forecast-detail-label">濕度</span>
                      <span className="forecast-detail-value">
                        {getValue(day.forecastMinrh)}-{getValue(day.forecastMaxrh)}%
                      </span>
                    </div>
                    
                    {day.PSR && (
                      <div className="forecast-detail">
                        <span className="forecast-detail-label">降雨概率</span>
                        <span className="forecast-detail-value">
                          <i className={`${getPSRIcon(getValue(day.PSR)).split(' ')[0]} me-1`}></i>
                          {getPSRText(getValue(day.PSR))}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 圖表區域 */}
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
                    // 處理 YYYYMMDD 格式
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