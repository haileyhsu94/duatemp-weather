
export interface ForecastDay {
  day: string;
  tempLow: number;
  tempHigh: number;
  condition: string;
  emoji: string;
}

export interface HourlyForecast {
  time: string;
  temp_c: number;
  emoji: string;
}

export interface WeatherData {
  locationName: string;
  tempCelsius: number;
  condition: string;
  currentEmoji: string; // New field for the main weather icon
  description: string;
  
  // New details
  outfitSuggestion: string;
  feelsLike: number;
  tempHigh: number;
  tempLow: number;
  uvIndex: number;
  rainChance: number;
  
  hourly: HourlyForecast[];
  forecast: ForecastDay[];
  groundingSource?: string;
}

export interface LocationItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
