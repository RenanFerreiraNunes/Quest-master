
import React, { useState } from 'react';
import { SHOP_ITEMS } from '../constants';
import { User, InventoryItem, ItemType, EquipmentSlot } from '../types';
import ItemDetailsModal from './ItemDetailsModal';

interface ShopProps {
  user: User;
  onPurchase: (item: InventoryItem) => void;
}

const Shop: React.FC<ShopProps> = ({ user, onPurchase }) => {
  const [activeCategory, setActiveCategory] = useState<ItemType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const categories: { id: ItemType | 'all', label: string, icon: string }[] = [
    { id: 'all', label: 'Tudo', icon: '🏛️' },
    { id: 'buff', label: 'Itens', icon: '🧪' },
    { id: 'equipment', label: 'Equipos', icon: '⚔️' },
    { id: 'skin', label: 'Skins', icon: '🛡️' },
    { id: 'theme', label: 'Temas', icon: '🔮' },
  ];

  const filteredItems = SHOP_ITEMS.filter(i => activeCategory === 'all' || i.type === activeCategory);

  const handleLocalPurchase = (item: InventoryItem) => {
    if (user.gold >= item.price) {
      onPurchase(item);
      setPurchasedId(item.id);
      setTimeout(() => setPurchasedId(null), 800);
    }
  };

  const getComparison = (item: InventoryItem) => {
    if (item.type !== 'equipment' || !item.slot) return null;
    
    const equippedId = user.equipment[item.slot];
    const equippedItem = equippedId ? SHOP_ITEMS.find(i => i.id === equippedId) : null;
    
    if (!equippedItem && !item.statBoost) return null;

    const currentVal = equippedItem?.boostValue || 0;
    const newVal = item.boostValue || 0;
    const diff = newVal - currentVal;

    // Fix: Updated return keys to match the usage in JSX below (currentVal and newVal)
    return {
      currentVal,
      newVal,
      diff,
      statName: item.statBoost || equippedItem?.statBoost || 'Status'
    };
  };

  return (
    <div className="space-y-10">
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all ${activeCategory === cat.id ? 'bg-white text-black shadow-xl scale-105' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredItems.map((item) => {
          const canAfford = user.gold >= item.price;
          const alreadyHas = user.inventory.some(i => i.id === item.id);
          const comp = getComparison(item);
          const isSelected = selectedItem?.id === item.id;
          const isRecentlyPurchased = purchasedId === item.id;

          return (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`group relative bg-zinc-950 border-2 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-between transition-all shadow-lg cursor-pointer 
                ${isRecentlyPurchased ? 'animate-purchase-success' : isSelected 
                  ? 'border-white/40 ring-2 ring-white/10 scale-[1.02] bg-zinc-900/50' 
                  : 'border-zinc-900 hover:border-zinc-700 hover:translate-y-[-4px]'
                } 
                ${item.isAnimated && !isSelected && !isRecentlyPurchased ? 'border-amber-500/30' : ''}`}
            >
              {item.isAnimated && !isRecentlyPurchased && (
                <div className="absolute top-4 right-4 animate-ping w-2 h-2 bg-amber-500 rounded-full" />
              )}
              
              {isSelected && !isRecentlyPurchased && (
                <div className="absolute inset-0 bg-white/5 rounded-[2rem] md:rounded-[2.5rem] pointer-events-none animate-pulse" />
              )}

              <div>
                <div className="text-4xl md:text-5xl mb-4 md:mb-6 transition-transform group-hover:scale-110 duration-500 drop-shadow-xl">{item.icon}</div>
                <h3 className="text-base md:text-xl font-black text-zinc-100 mb-1 md:mb-2 font-rpg truncate">{item.name}</h3>
                <p className="text-[9px] md:text-[10px] text-zinc-500 leading-tight md:leading-relaxed font-medium min-h-[36px] mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                  {item.description}
                </p>

                {item.type === 'equipment' && (
                  <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-colors space-y-1 md:space-y-2 ${isSelected ? 'bg-zinc-800/80 border-white/10' : 'bg-zinc-900/50 border-zinc-800/50'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Atributo</span>
                      <span className="text-[7px] md:text-[9px] font-black text-indigo-400 uppercase">{item.statBoost}</span>
                    </div>
                    {comp && (
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-[10px] md:text-xs font-bold text-zinc-400">{comp.currentVal}%</span>
                        <span className="text-zinc-600 text-[10px] md:text-xs">→</span>
                        <span className={`text-[10px] md:text-xs font-black ${comp.diff > 0 ? 'text-emerald-400' : comp.diff < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                          {comp.newVal}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-4 md:mt-8 flex items-center justify-between border-t border-zinc-900 pt-4 md:pt-6">
                <div className="flex items-center gap-1 text-amber-400 font-black text-base md:text-lg">
                  <span className="text-xs">💰</span> {item.price}
                </div>
                <button
                  disabled={!canAfford || (alreadyHas && item.type !== 'buff')}
                  onClick={(e) => { e.stopPropagation(); handleLocalPurchase(item); }}
                  className={`px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                    alreadyHas && item.type !== 'buff'
                      ? "bg-zinc-900 text-zinc-700 border border-zinc-800"
                      : canAfford 
                        ? "bg-white text-black hover:bg-zinc-200 shadow-xl" 
                        : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                  } ${isSelected ? 'ring-2 ring-white/20' : ''}`}
                >
                  {isRecentlyPurchased ? "✨" : alreadyHas && item.type !== 'buff' ? "✓" : "Comprar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <ItemDetailsModal 
          item={selectedItem} 
          user={user} 
          onClose={() => setSelectedItem(null)} 
          onAction={handleLocalPurchase}
          actionLabel={user.gold >= selectedItem.price ? "Comprar" : "Ouro Insuficiente"}
        />
      )}
    </div>
  );
};

export default Shop;
