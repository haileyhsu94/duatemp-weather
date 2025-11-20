
import React from 'react';

interface DualTempDisplayProps {
  celsius: number;
}

const DualTempDisplay: React.FC<DualTempDisplayProps> = ({ celsius }) => {
  // Calculate Fahrenheit: (C * 9/5) + 32
  const fahrenheit = Math.round((celsius * 9) / 5 + 32);
  const roundedCelsius = Math.round(celsius);

  return (
    <div className="bg-white border border-black p-6 relative h-full flex flex-col justify-center rounded-2xl overflow-hidden">
      <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-br-lg">
        Current Conditions
      </div>

      <div className="flex items-center justify-around mt-4">
        
        {/* Celsius Block */}
        <div className="flex flex-col items-center">
          <div className="font-headline text-6xl md:text-7xl font-black tracking-tighter leading-none">
            {roundedCelsius}°
          </div>
          <span className="text-xs font-bold uppercase tracking-widest border-t border-black pt-1 mt-1 w-full text-center">
            Celsius
          </span>
        </div>

        {/* Divider */}
        <div className="h-16 w-px bg-black mx-4 rotate-12"></div>
        
        {/* Fahrenheit Block */}
        <div className="flex flex-col items-center">
          <div className="font-headline text-6xl md:text-7xl font-black tracking-tighter leading-none text-gray-800">
            {fahrenheit}°
          </div>
          <span className="text-xs font-bold uppercase tracking-widest border-t border-black pt-1 mt-1 w-full text-center">
            Fahrenheit
          </span>
        </div>

      </div>
    </div>
  );
};

export default DualTempDisplay;
