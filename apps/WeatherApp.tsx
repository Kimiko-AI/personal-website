import React, { useState, useEffect } from 'react';

// Interfaces for weather.gov API responses
interface WeatherPointProperties {
    forecast: string;
    relativeLocation: {
        properties: {
            city: string;
            state: string;
        }
    }
}

interface ForecastPeriod {
    number: number;
    name: string;
    temperature: number;
    temperatureUnit: string;
    windSpeed: string;
    windDirection: string;
    icon: string;
    shortForecast: string;
    detailedForecast: string;
}

interface ForecastProperties {
    periods: ForecastPeriod[];
}

const WeatherApp: React.FC = () => {
    const [weatherData, setWeatherData] = useState<ForecastProperties | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const getWeatherIcon = (shortForecast: string) => {
        const forecast = shortForecast.toLowerCase();
        if (forecast.includes('sunny') || forecast.includes('clear')) return '☀️';
        if (forecast.includes('partly cloudy')) return '⛅️';
        if (forecast.includes('cloudy')) return '☁️';
        if (forecast.includes('rain') || forecast.includes('showers')) return '🌧️';
        if (forecast.includes('thunderstorm')) return '⛈️';
        if (forecast.includes('snow')) return '❄️';
        if (forecast.includes('fog')) return '🌫️';
        return '🌍';
    };

    useEffect(() => {
        const fetchWeather = async (latitude: number, longitude: number) => {
            try {
                setLoading(true);
                setError(null);
                // 1. Get grid endpoint from coordinates
                const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`);
                if (!pointsResponse.ok) {
                    throw new Error('Could not retrieve weather data for your location. This service is only available in the US.');
                }
                const pointsData: { properties: WeatherPointProperties } = await pointsResponse.json();
                
                const { city, state } = pointsData.properties.relativeLocation.properties;
                setLocation(`${city}, ${state}`);

                // 2. Get forecast from grid endpoint
                const forecastUrl = pointsData.properties.forecast;
                const forecastResponse = await fetch(forecastUrl);
                if (!forecastResponse.ok) {
                    throw new Error('Failed to fetch forecast.');
                }
                const forecastData: { properties: ForecastProperties } = await forecastResponse.json();

                setWeatherData(forecastData.properties);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
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
            return <div className="flex items-center justify-center h-full"><p className="text-center text-red-400 p-4">{error}</p></div>;
        }
        if (weatherData && weatherData.periods.length > 0) {
            const current = weatherData.periods[0];
            const forecast = weatherData.periods.slice(1, 5);
            return (
                <>
                    <div className="text-center border-b border-slate-700 pb-4 mb-4">
                        <h2 className="text-xl font-bold">{location}</h2>
                        <div className="text-6xl my-2">{getWeatherIcon(current.shortForecast)} {current.temperature}°{current.temperatureUnit}</div>
                        <p className="text-lg text-slate-300">{current.shortForecast}</p>
                        <p className="text-sm text-slate-400">Wind: {current.windSpeed} {current.windDirection}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2 px-4">Forecast</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-2">
                            {forecast.map(period => (
                                <div key={period.number} className="bg-slate-800 p-3 rounded-lg text-center">
                                    <p className="font-bold text-sm">{period.name}</p>
                                    <p className="text-3xl my-1">{getWeatherIcon(period.shortForecast)}</p>
                                    <p className="text-lg font-semibold">{period.temperature}°{period.temperatureUnit}</p>
                                    <p className="text-xs text-slate-400">{period.shortForecast}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            );
        }
        return <div className="flex items-center justify-center h-full"><p>No weather data available.</p></div>;
    };

    return (
        <div className="w-full h-full bg-slate-900 text-white overflow-y-auto p-4">
            {renderContent()}
        </div>
    );
};

export default WeatherApp;
