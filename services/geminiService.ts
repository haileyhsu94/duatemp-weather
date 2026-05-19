import { WeatherData } from "../types";

const WEATHER_CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY_PREFIX = 'weather_cache_v3_';
const CITY_SUGGESTIONS_TTL = 24 * 60 * 60 * 1000;

const citySuggestionsCache = new Map<string, { data: string[]; timestamp: number }>();

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface ResolvedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface ReverseGeocodingResult {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

interface WeatherCodeInfo {
  condition: string;
  emoji: string;
}

const weatherCodes: Record<number, WeatherCodeInfo> = {
  0: { condition: 'Clear', emoji: '☀️' },
  1: { condition: 'Mostly Clear', emoji: '🌤️' },
  2: { condition: 'Partly Cloudy', emoji: '⛅' },
  3: { condition: 'Cloudy', emoji: '☁️' },
  45: { condition: 'Foggy', emoji: '🌫️' },
  48: { condition: 'Freezing Fog', emoji: '🌫️' },
  51: { condition: 'Light Drizzle', emoji: '🌦️' },
  53: { condition: 'Drizzle', emoji: '🌦️' },
  55: { condition: 'Heavy Drizzle', emoji: '🌧️' },
  56: { condition: 'Freezing Drizzle', emoji: '🌧️' },
  57: { condition: 'Freezing Drizzle', emoji: '🌧️' },
  61: { condition: 'Light Rain', emoji: '🌧️' },
  63: { condition: 'Rain', emoji: '🌧️' },
  65: { condition: 'Heavy Rain', emoji: '🌧️' },
  66: { condition: 'Freezing Rain', emoji: '🌧️' },
  67: { condition: 'Freezing Rain', emoji: '🌧️' },
  71: { condition: 'Light Snow', emoji: '🌨️' },
  73: { condition: 'Snow', emoji: '🌨️' },
  75: { condition: 'Heavy Snow', emoji: '❄️' },
  77: { condition: 'Snow Grains', emoji: '❄️' },
  80: { condition: 'Light Showers', emoji: '🌦️' },
  81: { condition: 'Showers', emoji: '🌧️' },
  82: { condition: 'Heavy Showers', emoji: '🌧️' },
  85: { condition: 'Snow Showers', emoji: '🌨️' },
  86: { condition: 'Heavy Snow Showers', emoji: '❄️' },
  95: { condition: 'Thunderstorm', emoji: '⛈️' },
  96: { condition: 'Thunderstorm With Hail', emoji: '⛈️' },
  99: { condition: 'Thunderstorm With Hail', emoji: '⛈️' },
};

const getWeatherCodeInfo = (code?: number): WeatherCodeInfo =>
  weatherCodes[code ?? -1] ?? { condition: 'Unknown', emoji: '🌤️' };

const formatForecastDay = (date: string, index: number): string => {
  if (index === 0) return 'Today';

  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString('en-US', { weekday: 'short' });
};

const normalizeWeatherCacheKey = (query: string): string => {
  const trimmed = query.toLowerCase().trim();
  const coordinateMatch = trimmed.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);

  if (!coordinateMatch) return trimmed;

  const latitude = Number(coordinateMatch[1]);
  const longitude = Number(coordinateMatch[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return trimmed;

  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
};

const formatLocationName = (location: GeocodingResult): string => {
  const region = location.admin1 && location.admin1 !== location.name ? location.admin1 : location.country;
  return [location.name, region].filter(Boolean).join(', ');
};

const reverseGeocodeCoords = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: 'en',
    });
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`);

    if (!response.ok) return null;

    const data = await response.json() as ReverseGeocodingResult;
    const place = data.city || data.locality;
    const region = data.principalSubdivision && data.principalSubdivision !== place
      ? data.principalSubdivision
      : data.countryName;

    return [place, region].filter(Boolean).join(', ') || null;
  } catch (error) {
    console.error("Reverse geocoding error", error);
    return null;
  }
};

const resolveLocation = async (query: string): Promise<ResolvedLocation> => {
  const coordinateMatch = query.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);

  if (coordinateMatch) {
    const latitude = Number(coordinateMatch[1]);
    const longitude = Number(coordinateMatch[2]);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const resolvedName = await reverseGeocodeCoords(latitude, longitude);

      return {
        name: resolvedName || `Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
        latitude,
        longitude,
      };
    }
  }

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  );

  if (!response.ok) {
    throw new Error('Unable to search for that location. Please retry.');
  }

  const data = await response.json();
  const firstResult = data.results?.[0] as GeocodingResult | undefined;

  if (!firstResult) {
    throw new Error(`No matching location found for "${query}".`);
  }

  return {
    name: formatLocationName(firstResult),
    latitude: firstResult.latitude,
    longitude: firstResult.longitude,
  };
};

const buildSummary = (condition: string, high: number, low: number, rainChance: number): string => {
  const rainLine = rainChance >= 50 ? ` Keep an umbrella close with a ${rainChance}% rain chance.` : '';
  return `${condition} skies are setting the tone, with a high near ${Math.round(high)}°C and a low near ${Math.round(low)}°C.${rainLine}`;
};

const buildOutfitSuggestion = (temp: number, condition: string, rainChance: number): string => {
  if (condition.toLowerCase().includes('snow')) return 'Layer warmly and pick shoes that can handle slush.';
  if (rainChance >= 50 || condition.toLowerCase().includes('rain')) return 'A light waterproof layer is the winning move today.';
  if (temp >= 28) return 'Keep it breezy with light fabrics and sun-friendly layers.';
  if (temp <= 8) return 'Coat weather: add a warm outer layer before heading out.';
  return 'Comfortable layers should carry you through the day.';
};

export const getCitySuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 3) return [];

  const queryLower = query.toLowerCase().trim();
  const cached = citySuggestionsCache.get(queryLower);

  if (cached && Date.now() - cached.timestamp < CITY_SUGGESTIONS_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const result = (data.results ?? []).map((location: GeocodingResult) => formatLocationName(location));

    citySuggestionsCache.set(queryLower, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("Autocomplete error", error);
    return [];
  }
};

export const getWeather = async (query: string): Promise<WeatherData> => {
  const cacheKey = CACHE_KEY_PREFIX + normalizeWeatherCacheKey(query);

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < WEATHER_CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    // Ignore cache errors.
  }

  try {
    const location = await resolveLocation(query);
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'temperature_2m,weather_code,apparent_temperature',
      hourly: 'temperature_2m,weather_code,precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '7',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Weather service failed. Please retry.');
    }

    const data = await response.json();
    const currentInfo = getWeatherCodeInfo(data.current?.weather_code);
    const currentTemp = Math.round(data.current?.temperature_2m ?? 0);
    const highTemp = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp);
    const lowTemp = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp);
    const rainChance = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 0);
    const nowMs = new Date(data.current?.time ?? Date.now()).getTime();
    const startHourlyIndex = Math.max(
      0,
      (data.hourly?.time ?? []).findIndex((time: string) => new Date(time).getTime() >= nowMs)
    );

    const result: WeatherData = {
      locationName: location.name,
      tempCelsius: currentTemp,
      condition: currentInfo.condition,
      currentEmoji: currentInfo.emoji,
      description: buildSummary(currentInfo.condition, highTemp, lowTemp, rainChance),
      outfitSuggestion: buildOutfitSuggestion(currentTemp, currentInfo.condition, rainChance),
      feelsLike: Math.round(data.current?.apparent_temperature ?? currentTemp),
      tempHigh: highTemp,
      tempLow: lowTemp,
      uvIndex: Math.round(data.daily?.uv_index_max?.[0] ?? 0),
      rainChance,
      hourly: (data.hourly?.time ?? []).slice(startHourlyIndex, startHourlyIndex + 10).map((time: string, index: number) => {
        const hourlyIndex = startHourlyIndex + index;
        return {
          time: new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          temp_c: Math.round(data.hourly.temperature_2m[hourlyIndex]),
          emoji: getWeatherCodeInfo(data.hourly.weather_code[hourlyIndex]).emoji,
        };
      }),
      forecast: (data.daily?.time ?? []).map((date: string, index: number) => {
        const forecastInfo = getWeatherCodeInfo(data.daily.weather_code[index]);
        return {
          day: formatForecastDay(date, index),
          tempLow: Math.round(data.daily.temperature_2m_min[index]),
          tempHigh: Math.round(data.daily.temperature_2m_max[index]),
          condition: forecastInfo.condition,
          emoji: forecastInfo.emoji,
        };
      }),
      groundingSource: 'https://open-meteo.com/',
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore localStorage errors.
    }

    return result;
  } catch (error: any) {
    throw new Error(`Failed to fetch weather data: ${error?.message || 'Unknown error'}`);
  }
};
