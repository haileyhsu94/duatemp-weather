
import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ForecastDay, HourlyForecast } from '../types';

interface ForecastViewProps {
  description: string;
  forecast: ForecastDay[];
  hourly: HourlyForecast[];
  uvIndex: number;
  rainChance: number;
  feelsLike: number;
  highTemp: number;
  lowTemp: number;
  sourceUrl?: string;
}

const ForecastView: React.FC<ForecastViewProps> = ({ 
  forecast, 
  hourly,
  uvIndex,
  rainChance,
  feelsLike,
  sourceUrl 
}) => {
  // Toggle only applies to the 7-day forecast now, as Hourly shows both.
  const [isCelsius, setIsCelsius] = useState(true);

  const toDisplayTemp = (c: number) => isCelsius ? Math.round(c) : Math.round((c * 9/5) + 32);
  const toFahrenheit = (c: number) => Math.round((c * 9/5) + 32);

  // --- Hourly Chart Logic ---
  const itemWidth = 70; // Slightly wider for dual text
  const chartHeight = 160; // Taller for dual labels
  const chartPaddingTop = 40;
  const chartPaddingBottom = 30;
  const chartActualHeight = chartHeight - chartPaddingTop - chartPaddingBottom;
  const totalWidth = Math.max(hourly.length * itemWidth, 300);

  const hourlyTemps = hourly.map(h => h.temp_c);
  const minH = Math.min(...hourlyTemps);
  const maxH = Math.max(...hourlyTemps);
  const rangeH = maxH - minH || 1;

  const getHourlyY = (temp: number) => {
    return chartPaddingTop + (chartActualHeight - ((temp - minH) / rangeH) * chartActualHeight);
  };

  const points = hourly.map((h, i) => {
    const x = (i * itemWidth) + (itemWidth / 2);
    const y = getHourlyY(h.temp_c);
    return `${x},${y}`;
  }).join(' ');

  // --- 7-Day Logic ---
  const allLows = forecast.map(d => toDisplayTemp(d.tempLow));
  const allHighs = forecast.map(d => toDisplayTemp(d.tempHigh));
  const minW = Math.min(...allLows); 
  const maxW = Math.max(...allHighs); 
  const rangeW = maxW - minW || 1;

  return (
    <div className="w-full space-y-8">
      
      {/* Section 1: Hourly Trend (Scrollable) */}
      <div className="border-y border-black py-6">
        <h3 className="font-headline text-2xl font-bold uppercase mb-4 flex items-center px-1">
          <span className="w-4 h-4 bg-black mr-2 rounded-sm"></span>
          Hourly Trend
        </h3>
        
        <div className="w-full overflow-x-auto no-scrollbar border border-black bg-white rounded-xl">
          <div style={{ width: `${totalWidth}px`, height: `${chartHeight}px` }} className="relative">
            <svg width={totalWidth} height={chartHeight} className="overflow-visible">
              
              {/* Grid Lines */}
              {hourly.map((_, i) => {
                 const x = (i * itemWidth) + (itemWidth / 2);
                 return (
                   <line key={`grid-${i}`} x1={x} y1={20} x2={x} y2={chartHeight - 20} stroke="#f0f0f0" strokeWidth="1" />
                 );
              })}

              {/* The Line Connection */}
              <polyline 
                fill="none" 
                stroke="black" 
                strokeWidth="2" 
                points={points} 
              />

              {/* Data Points */}
              {hourly.map((h, i) => {
                const x = (i * itemWidth) + (itemWidth / 2);
                const y = getHourlyY(h.temp_c);
                const tempC = Math.round(h.temp_c);
                const tempF = toFahrenheit(h.temp_c);

                return (
                  <g key={i}>
                    {/* Point */}
                    <circle cx={x} cy={y} r="4" fill="white" stroke="black" strokeWidth="2" />
                    
                    {/* Temps Label (Dual Stacked) */}
                    <text 
                      x={x} 
                      y={y - 24} 
                      textAnchor="middle" 
                      className="text-[12px] font-black fill-black font-headline"
                    >
                      {tempC}°
                    </text>
                    <text 
                      x={x} 
                      y={y - 12} 
                      textAnchor="middle" 
                      className="text-[10px] font-bold fill-gray-500 font-mono"
                    >
                      {tempF}°
                    </text>

                    {/* Time Label (Bottom) */}
                    <text 
                      x={x} 
                      y={chartHeight - 5} 
                      textAnchor="middle" 
                      className="text-[10px] font-bold uppercase fill-gray-500"
                    >
                      {h.time}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Section 2: Details Grid */}
      <div className="grid grid-cols-3 gap-4 border-b border-black pb-8">
        <div className="border-r border-black pr-4 text-center">
           <span className="block text-xs font-bold uppercase text-gray-500 mb-1">Feels Like</span>
           <div className="text-2xl font-headline font-bold">{Math.round(feelsLike)}°</div>
        </div>
        <div className="border-r border-black px-4 text-center">
           <span className="block text-xs font-bold uppercase text-gray-500 mb-1">Rain</span>
           <div className="text-2xl font-headline font-bold">{rainChance}%</div>
        </div>
        <div className="pl-4 text-center">
           <span className="block text-xs font-bold uppercase text-gray-500 mb-1">UV Index</span>
           <div className="text-2xl font-headline font-bold">{uvIndex}</div>
        </div>
      </div>

      {/* Section 3: 7-Day Outlook */}
      <div className="bg-white border border-black p-6 relative rounded-2xl">
        
        <div className="flex justify-between items-end mb-6 border-b border-black pb-2">
          <h2 className="font-headline text-3xl font-bold uppercase">7-Day Forecast</h2>
          
          {/* C/F Toggle */}
          <div className="flex border border-black bg-white z-10 rounded-lg overflow-hidden">
            <button 
              onClick={() => setIsCelsius(true)}
              className={`px-3 py-1 text-xs font-bold transition-colors ${isCelsius ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              °C
            </button>
            <button 
              onClick={() => setIsCelsius(false)}
              className={`px-3 py-1 text-xs font-bold transition-colors ${!isCelsius ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              °F
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {/* Header Row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_3fr_1fr] gap-2 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-2 text-center">
            <div className="text-left">Day</div>
            <div>Cond.</div>
            <div className="text-right pr-2">Low</div>
            <div>Range</div>
            <div className="text-left pl-2">High</div>
          </div>

          {forecast.map((day, index) => {
            const low = toDisplayTemp(day.tempLow);
            const high = toDisplayTemp(day.tempHigh);
            
            // Calculate relative position for the bar
            // To ensure the bar is visible even if range is 0, we give it a min width via logic
            const rangePercent = ((high - low) / rangeW) * 100;
            const leftPercent = ((low - minW) / rangeW) * 100;

            return (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_3fr_1fr] gap-2 items-center py-3 border-b border-dotted border-gray-300 last:border-0 hover:bg-gray-50 group first:rounded-t-lg last:rounded-b-lg">
                
                {/* Day Name */}
                <div className="flex flex-col text-left">
                    <span className="font-bold font-headline text-lg uppercase leading-none">{day.day}</span>
                </div>

                {/* Icon */}
                <div className="text-center text-2xl" title={day.condition}>
                    {day.emoji}
                </div>

                {/* Low Temp */}
                <div className="text-right font-mono text-sm font-bold text-gray-600 pr-2">
                    {low}°
                </div>

                {/* Range Visual */}
                <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="absolute h-full bg-black rounded-full opacity-80"
                        style={{ 
                            left: `${leftPercent}%`, 
                            width: `${Math.max(rangePercent, 5)}%` 
                        }}
                    ></div>
                </div>

                {/* High Temp */}
                <div className="text-left font-mono text-sm font-bold text-black pl-2">
                    {high}°
                </div>

              </div>
            );
          })}
        </div>

        {sourceUrl && (
          <div className="mt-6 text-right">
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase inline-flex items-center hover:bg-black hover:text-white px-2 py-1 transition-colors rounded-md"
            >
              Check Source <ArrowUpRight className="w-3 h-3 ml-1" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastView;
