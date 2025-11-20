
import React from 'react';
import { MapPin, Trash2, Pin } from 'lucide-react';
import { LocationItem } from '../types';

interface FavoritesProps {
  favorites: LocationItem[];
  onSelect: (location: string) => void;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const Favorites: React.FC<FavoritesProps> = ({ favorites, onSelect, onRemove, onSetDefault }) => {
  if (favorites.length === 0) return null;

  return (
    <div className="w-full mt-12 pt-4 border-t-2 double-border border-black">
      <h3 className="font-headline font-bold text-xl uppercase mb-4 flex items-center">
        <span className="bg-black text-white px-2 mr-2 text-sm tracking-widest rounded-sm">Classifieds</span>
        Saved Locations
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className={`group relative flex items-center justify-between p-3 border border-black bg-white hover:bg-gray-50 transition-colors rounded-xl ${fav.isDefault ? 'bg-gray-100' : ''}`}
          >
            {fav.isDefault && (
                <div className="absolute -top-2 -right-2 bg-black text-white text-[8px] font-bold px-1 py-0.5 uppercase border border-white rounded-sm">
                    Default
                </div>
            )}
            
            <button
              onClick={() => onSelect(fav.name)}
              className="flex items-center flex-grow text-left overflow-hidden"
            >
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-black" />
              <span className="font-bold text-sm truncate uppercase">{fav.name}</span>
            </button>
            
            <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-300">
              <button
                 onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(fav.id);
                }}
                className={`p-1.5 hover:bg-gray-200 rounded-lg ${fav.isDefault ? 'text-black' : 'text-gray-400'}`}
                title="Set as Default"
              >
                <Pin className={`w-3 h-3 ${fav.isDefault ? 'fill-black' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(fav.id);
                }}
                className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors rounded-lg"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
