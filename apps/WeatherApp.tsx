import React, { useState, useEffect } from 'react';

interface CurrentWeather {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    time: string;
}

interface HourlyForecast {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
}

interface DailyForecast {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
}

interface WeatherData {
    current: CurrentWeather;
    hourly: HourlyForecast;
    daily: DailyForecast;
    temperature_unit: string;
}

const WEATHER_CODES: Record<number, { description: string, icon: string }> = {
    0: { description: 'Clear sky', icon: '☀️' },
    1: { description: 'Mainly clear', icon: '🌤️' },
    2: { description: 'Partly cloudy', icon: '⛅️' },
    3: { description: 'Overcast', icon: '☁️' },
    45: { description: 'Fog', icon: '🌫️' },
    48: { description: 'Depositing rime fog', icon: '🌫️' },
    51: { description: 'Light drizzle', icon: '🌦️' },
    53: { description: 'Moderate drizzle', icon: '🌦️' },
    55: { description: 'Dense drizzle', icon: '🌦️' },
    56: { description: 'Light freezing drizzle', icon: '🥶' },
    57: { description: 'Dense freezing drizzle', icon: '🥶' },
    61: { description: 'Slight rain', icon: '🌧️' },
    63: { description: 'Moderate rain', icon: '🌧️' },
    65: { description: 'Heavy rain', icon: '🌧️' },
    66: { description: 'Light freezing rain', icon: '🥶' },
    67: { description: 'Heavy freezing rain', icon: '🥶' },
    71: { description: 'Slight snow fall', icon: '❄️' },
    73: { description: 'Moderate snow fall', icon: '❄️' },
    75: { description: 'Heavy snow fall', icon: '❄️' },
    77: { description: 'Snow grains', icon: '❄️' },
    80: { description: 'Slight rain showers', icon: '🌧️' },
    81: { description: 'Moderate rain showers', icon: '🌧️' },
    82: { description: 'Violent rain showers', icon: '🌧️' },
    85: { description: 'Slight snow showers', icon: '❄️' },
    86: { description: 'Heavy snow showers', icon: '❄️' },
    95: { description: 'Thunderstorm', icon: '⛈️' },
    96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
    99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

const getWeatherInfo = (code: number) => WEATHER_CODES[code] || { description: 'Unknown', icon: '🌍' };

const WeatherApp: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchLocationName = async (latitude: number, longitude: number) => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) {
                    setLocation("Your Location");
                    return;
                }
                const data = await response.json();
                const { city, town, village, state, country } = data.address;
                setLocation(`${city || town || village}, ${state || country}`);
            } catch (err) {
                console.error("Failed to fetch location name", err);
                setLocation("Your Location");
            }
        };

        const fetchWeather = async (latitude: number, longitude: number) => {
            try {
                setLoading(true);
                setError(null);
                const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('Could not retrieve weather data.');
                }
                const data = await response.json();

                if (!data.current || !data.hourly || !data.daily) {
                    throw new Error('Incomplete weather data received.');
                }

                setWeatherData({
                    current: data.current,
                    hourly: data.hourly,
                    daily: data.daily,
                    temperature_unit: data.daily_units.temperature_2m_max.slice(-1)
                });

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchLocationName(latitude, longitude);
                fetchWeather(latitude, longitude);
            },
            (err) => {
                setError('Location permission denied. Please enable location services to use the Weather app.');
                setLoading(false);
            }
        );
    }, []);

    const renderContent = () => {
        if (loading) {
            return <div className="flex items-center justify-center h-full"><p className="text-center text-slate-400">Fetching weather data...</p></div>;
        }
        if (error) {
            return <div className="flex items-center justify-center h-full p-4"><p className="text-center text-red-400">{error}</p></div>;
        }
        if (weatherData) {
            const { current, hourly, daily, temperature_unit } = weatherData;
            const currentHourIndex = hourly.time.findIndex(t => new Date(t) > new Date());

            return (
                <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
                    {/* Current Weather */}
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-bold">{location || 'Current Location'}</h2>
                        <div className="text-5xl sm:text-7xl my-2">{getWeatherInfo(current.weather_code).icon} {Math.round(current.temperature_2m)}°{temperature_unit}</div>
                        <p className="text-lg sm:text-xl text-slate-300">{getWeatherInfo(current.weather_code).description}</p>
                        <p className="text-xs sm:text-sm text-slate-400">Wind: {current.wind_speed_10m.toFixed(1)} km/h {current.wind_direction_10m}°</p>
                    </div>

                    {/* Hourly Forecast */}
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 px-1">Next 24 Hours</h3>
                        <div className="flex overflow-x-auto gap-2 pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4">
                            {hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((time, index) => (
                                <div key={time} className="flex-shrink-0 w-16 sm:w-20 bg-slate-800 p-2 sm:p-3 rounded-lg text-center">
                                    <p className="font-bold text-xs sm:text-sm">{new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true })}</p>
                                    <p className="text-2xl sm:text-3xl my-1">{getWeatherInfo(hourly.weather_code[currentHourIndex + index]).icon}</p>
                                    <p className="text-sm sm:text-lg font-semibold">{Math.round(hourly.temperature_2m[currentHourIndex + index])}°</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Forecast */}
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 px-1">7-Day Forecast</h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {daily.time.map((date, index) => (
                                <div key={date} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg text-sm sm:text-base">
                                    <p className="font-bold w-1/4 truncate">{new Date(date).toLocaleDateString([], { weekday: 'short' })}</p>

                                    <div className="flex items-center gap-1 sm:gap-2 w-1/2 justify-center">
                                        <span className="text-xl sm:text-2xl">{getWeatherInfo(daily.weather_code[index]).icon}</span>
                                        <p className="text-xs sm:text-sm text-slate-300 hidden sm:block truncate">{getWeatherInfo(daily.weather_code[index]).description}</p>
                                    </div>
                                    <p className="font-semibold w-1/4 text-right text-sm sm:text-base">
                                        {Math.round(daily.temperature_2m_max[index])}°
                                        <span className="text-slate-400"> / {Math.round(daily.temperature_2m_min[index])}°</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return <div className="flex items-center justify-center h-full"><p>No weather data available.</p></div>;
    };

    return (
        <div className="w-full h-full bg-slate-900 text-white overflow-y-auto">
            {renderContent()}
        </div>
    );
};

export default WeatherApp;