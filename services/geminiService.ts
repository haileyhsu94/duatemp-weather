
import { GoogleGenAI } from "@google/genai";
import { WeatherData } from "../types";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === 'your_api_key_here') {
  console.error("⚠️ GEMINI_API_KEY is missing or invalid. Please set it in .env.local");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const getCitySuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 3) return [];

  const model = "gemini-2.5-flash";
  const prompt = `
    Task: List 5 distinct real-world cities/locations that start with or match "${query}".
    Output: JSON Array of strings ONLY. No markdown.
    Example: ["London, UK", "London, Ontario", "Lone Tree, CO"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text || "[]";
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Autocomplete error", error);
    return [];
  }
};

// Helper to fix common emoji issues (e.g. Japanese Kanji returning as emoji)
const sanitizeEmoji = (emoji: string): string => {
  if (!emoji) return "🌤️";
  // "曇" is Kanji for Cloudy.
  if (emoji.includes("曇")) return "☁️";
  if (emoji.includes("晴")) return "☀️";
  if (emoji.includes("雨")) return "🌧️";
  if (emoji.includes("雪")) return "❄️";
  return emoji;
};

export const getWeather = async (query: string): Promise<WeatherData> => {
  const model = "gemini-2.5-flash"; 
  
  // Optimized prompt for speed and structure
  const prompt = `
    Goal: Get accurate weather for "${query}" via Google Search.
    
    Output: JSON ONLY. No markdown. No filler.
    
    CRITICAL INSTRUCTION: 
    - Ensure 'current_condition' and 'condition' are in ENGLISH (e.g., 'Cloudy', not '曇り').
    - Ensure 'current_emoji' and 'emoji' are standard unicode EMOJIS (e.g. ☁️), not text characters.
    
    Structure:
    {
      "location_name": "City Name",
      "current_temp_c": number,
      "current_condition": "Short text in ENGLISH (e.g. 'Mostly Sunny')",
      "current_emoji": "Single emoji (e.g. 🌤️)",
      "feels_like_c": number,
      "high_c": number,
      "low_c": number,
      "uv_index": number,
      "rain_chance_percent": number,
      "summary": "Short, witty editorial vibe check (max 2 sentences).",
      "outfit_suggestion": "One sentence style advice based on weather (e.g., 'Trench coat weather', 'Linen shirt day').",
      "hourly": [
        { "time": "14:00", "temp_c": number, "emoji": "☀️" },
        ... (next 10-12 hours. Use 24-hour clock format e.g. 13:00, 14:00)
      ],
      "forecast": [
        { "day": "Mon", "low_c": number, "high_c": number, "condition": "Rain", "emoji": "🌧️" },
        ... (7 days)
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const fullText = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    const cleanJson = fullText.replace(/```json|```/g, '').trim();
    let parsedData: any = {};

    try {
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse JSON", cleanJson);
      throw new Error("Invalid data format received");
    }

    let sourceUrl = "";
    if (groundingChunks && groundingChunks.length > 0) {
        const firstChunk = groundingChunks[0] as any; 
        if (firstChunk.web?.uri) {
            sourceUrl = firstChunk.web.uri;
        }
    }

    return {
      locationName: parsedData.location_name || query,
      tempCelsius: parsedData.current_temp_c ?? 0,
      condition: parsedData.current_condition || "Unknown",
      currentEmoji: sanitizeEmoji(parsedData.current_emoji),
      description: parsedData.summary || "Enjoy the weather!",
      outfitSuggestion: parsedData.outfit_suggestion || "Wear whatever feels right.",
      
      feelsLike: parsedData.feels_like_c ?? parsedData.current_temp_c,
      tempHigh: parsedData.high_c ?? parsedData.current_temp_c + 5,
      tempLow: parsedData.low_c ?? parsedData.current_temp_c - 5,
      uvIndex: parsedData.uv_index ?? 0,
      rainChance: parsedData.rain_chance_percent ?? 0,
      
      hourly: parsedData.hourly?.map((h: any) => ({
        time: h.time,
        temp_c: h.temp_c,
        emoji: sanitizeEmoji(h.emoji)
      })) || [],
      
      forecast: parsedData.forecast?.map((day: any) => ({
        day: day.day,
        tempLow: day.low_c,
        tempHigh: day.high_c,
        condition: day.condition,
        emoji: sanitizeEmoji(day.emoji)
      })) || [],
      groundingSource: sourceUrl
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Provide more helpful error messages
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === 'your_api_key_here') {
      throw new Error("API key is missing or invalid. Please set GEMINI_API_KEY in .env.local");
    }
    
    if (error?.message?.includes('API_KEY')) {
      throw new Error("Invalid API key. Please check your GEMINI_API_KEY in .env.local");
    }
    
    if (error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
      throw new Error("API key permission denied. Please check your API key permissions.");
    }
    
    throw new Error(`Failed to fetch weather data: ${error?.message || 'Unknown error'}`);
  }
};
