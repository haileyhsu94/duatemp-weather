
import React, { useState, useEffect } from 'react';
import { MapPin, Star, Navigation, Shirt } from 'lucide-react';
import { getWeather } from './services/geminiService';
import DualTempDisplay from './components/DualTempDisplay';
import SearchBar from './components/SearchBar';
import Favorites from './components/Favorites';
import ForecastView from './components/ForecastView';
import { WeatherData, LocationItem, LoadingState } from './types';

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<LocationItem[]>(() => {
    const saved = localStorage.getItem('duaTempFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [themeClass, setThemeClass] = useState('theme-default');

  // Update background theme based on weather condition
  useEffect(() => {
    if (!weather) {
      setThemeClass('theme-default');
      return;
    }

    const condition = weather.condition.toLowerCase();
    const emoji = weather.currentEmoji;

    // Determine Night time (simple heuristic based on standard moon emojis)
    const isNight = ['🌙', '🌚', '🌜', '🌌', '🌃'].some(e => emoji.includes(e)) || condition.includes('night');

    if (isNight) {
      setThemeClass('theme-night');
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm') || condition.includes('shower')) {
      setThemeClass('theme-rain');
    } else if (condition.includes('snow') || condition.includes('blizzard') || condition.includes('ice')) {
      setThemeClass('theme-snow');
    } else if (condition.includes('cloud') || condition.includes('overcast') || condition.includes('fog') || condition.includes('mist')) {
      setThemeClass('theme-cloudy');
    } else if (condition.includes('sun') || condition.includes('clear') || condition.includes('hot')) {
      setThemeClass('theme-sunny');
    } else {
      setThemeClass('theme-default');
    }
  }, [weather]);

  const fetchWeather = async (query: string) => {
    setStatus(LoadingState.LOADING);
    setError(null);
    try {
      const data = await getWeather(query);
      setWeather(data);
      setStatus(LoadingState.SUCCESS);
    } catch (error: any) {
      console.error("Error fetching weather:", error);
      setStatus(LoadingState.ERROR);
      setError(error?.message || "Connection failed. Please retry.");
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setStatus(LoadingState.LOADING);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(`${latitude}, ${longitude}`);
        },
        () => {
          alert("Unable to retrieve your location");
          setStatus(LoadingState.IDLE);
        }
      );
    }
  };

  const toggleFavorite = () => {
    if (!weather) return;
    const exists = favorites.find(f => f.name === weather.locationName);
    
    let newFavorites;
    if (exists) {
      newFavorites = favorites.filter(f => f.name !== weather.locationName);
    } else {
      const newItem: LocationItem = { 
        id: Date.now().toString(), 
        name: weather.locationName,
        isDefault: favorites.length === 0 
      };
      newFavorites = [...favorites, newItem];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('duaTempFavorites', JSON.stringify(newFavorites));
  };

  const removeFavorite = (id: string) => {
    const newFavorites = favorites.filter(f => f.id !== id);
    setFavorites(newFavorites);
    localStorage.setItem('duaTempFavorites', JSON.stringify(newFavorites));
  };

  const setDefaultLocation = (id: string) => {
    const newFavorites = favorites.map(f => ({
      ...f,
      isDefault: f.id === id
    }));
    setFavorites(newFavorites);
    localStorage.setItem('duaTempFavorites', JSON.stringify(newFavorites));
  };

  useEffect(() => {
    const defaultLoc = favorites.find(f => f.isDefault);
    if (defaultLoc) {
      fetchWeather(defaultLoc.name);
    } else {
      handleCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCurrentFavorite = weather && favorites.some(f => f.name === weather.locationName);
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={`min-h-screen w-full flex flex-col items-center p-4 text-[#1a1a1a] transition-colors duration-1000 ease-in-out bg-newspaper ${themeClass} relative`}>
      
      <div className="w-full max-w-2xl flex flex-col relative z-10">
        
        {/* NEWSPAPER MASTHEAD */}
        <header className="w-full text-center border-b-2 border-black mb-6">
          <div className="flex justify-between items-center border-b border-black pb-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest">Vol. 1, No. 1</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{todayDate}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Late Edition</span>
          </div>
          <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none py-2">
            THE DAILY SKY
          </h1>
          <div className="border-t border-black py-1 flex justify-center items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <span>Weather</span>
            <span>•</span>
            <span>Forecasts</span>
            <span>•</span>
            <span>Lifestyle</span>
          </div>
        </header>

        {/* Toolbar Row */}
        <div className="flex items-center gap-2 mb-6 h-12">
           <div className="flex-grow h-full">
             <SearchBar onSearch={fetchWeather} isLoading={status === LoadingState.LOADING} />
           </div>
           <button 
            onClick={handleCurrentLocation}
            className="h-12 w-12 flex items-center justify-center border border-black bg-white hover:bg-gray-100 transition-colors box-border rounded-xl shadow-sm"
            title="Use Current Location"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        {/* Error State */}
        {status === LoadingState.ERROR && (
          <div className="bg-red-50 border border-red-600 text-red-900 p-4 mb-6 rounded-xl">
            <div className="font-bold text-center uppercase font-mono mb-2">
              !! NOTICE: Connection Failed. Please Retry. !!
            </div>
            {error && (
              <div className="text-sm text-center font-serif mt-2 normal-case">
                {error}
              </div>
            )}
            {error?.includes('API key') && (
              <div className="text-xs text-center mt-3 pt-3 border-t border-red-300">
                <p className="mb-1">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                  <li>Update <code className="bg-red-100 px-1 rounded">.env.local</code> with: <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY=your_actual_key</code></li>
                  <li>Restart the dev server</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {weather && status === LoadingState.SUCCESS && (
          <div className="animate-in fade-in duration-700">
            
            {/* Headline Section (Location) */}
            <div className="w-full flex justify-between items-start mb-4 border-b border-black pb-4">
              <div>
                 <div className="flex items-center space-x-1 mb-1">
                   <MapPin className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase tracking-wider">Current Location</span>
                 </div>
                 <h2 className="font-headline text-4xl font-bold uppercase leading-none">{weather.locationName}</h2>
                 <p className="text-sm italic font-serif mt-1 flex items-center">
                    {weather.condition} 
                    <span className="ml-2 not-italic text-lg">{weather.currentEmoji}</span>
                 </p>
              </div>
              <button 
                onClick={toggleFavorite} 
                className={`p-2 border border-black transition-all rounded-xl ${isCurrentFavorite ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
              >
                <Star className={`w-5 h-5 ${isCurrentFavorite ? 'fill-white' : ''}`} />
              </button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Column 1: Big Temp (Hero) */}
              <div className="md:col-span-2">
                <DualTempDisplay celsius={weather.tempCelsius} />
              </div>
              
              {/* Column 2: Insight (Editorial + Style) */}
              <div className="md:col-span-1 flex flex-col">
                <div className="border border-black p-4 h-full bg-white flex flex-col justify-between rounded-2xl">
                   <div>
                       <span className="block border-b border-black text-xs font-bold uppercase mb-2 pb-1">Editor's Pick</span>
                       <p className="font-headline text-xl leading-tight font-bold mb-2">
                         "Today's Outlook"
                       </p>
                       <p className="font-serif text-lg leading-snug text-justify mb-4">
                         {weather.description}
                       </p>
                   </div>
                   
                   {/* Style Section */}
                   <div className="border-t border-black pt-3 mt-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="bg-black text-white text-[10px] font-bold px-1 uppercase rounded-sm">Style Watch</span>
                            <Shirt className="w-3 h-3" />
                        </div>
                        <p className="font-serif italic text-md leading-snug">
                            "{weather.outfitSuggestion}"
                        </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Forecast Dashboard */}
            <ForecastView 
              description={weather.description} 
              forecast={weather.forecast} 
              hourly={weather.hourly}
              uvIndex={weather.uvIndex}
              rainChance={weather.rainChance}
              feelsLike={weather.feelsLike}
              highTemp={weather.tempHigh}
              lowTemp={weather.tempLow}
              sourceUrl={weather.groundingSource} 
            />
          </div>
        )}

        <Favorites 
          favorites={favorites} 
          onSelect={fetchWeather} 
          onRemove={removeFavorite} 
          onSetDefault={setDefaultLocation}
        />
        
        <footer className="mt-12 py-6 text-center border-t-2 border-black">
           <p className="font-serif italic text-sm text-gray-600">
             Have a lovely day + Made by Cool Cat
           </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
