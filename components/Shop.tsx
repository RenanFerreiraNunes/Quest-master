
import React, { useState } from 'react';
import { SHOP_ITEMS, RARITIES } from '../constants';
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

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.id)}
            className={`px-10 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shrink-0 transition-all ${activeCategory === cat.id ? 'bg-white text-black shadow-3xl scale-105' : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => {
          const canAfford = user.gold >= item.price;
          const userItem = user.inventory.find(i => i.id === item.id);
          const alreadyHasNonStackable = userItem && item.type !== 'buff';
          const isSelected = selectedItem?.id === item.id;
          const isRecentlyPurchased = purchasedId === item.id;
          const rarity = RARITIES[item.rarity] || RARITIES.comum;

          return (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`group relative bg-zinc-900/30 border-2 p-8 rounded-[3.5rem] flex flex-col justify-between transition-all shadow-xl cursor-pointer hover:translate-y-[-8px]
                ${isRecentlyPurchased ? 'animate-purchase-success border-white' : isSelected 
                  ? 'border-indigo-500/50 bg-indigo-500/5' 
                  : 'border-zinc-800 hover:border-zinc-700'
                } 
                ${rarity.bg}`}
            >
              <div>
                <div className="text-6xl mb-8 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${rarity.color.split(' ')[0]}`}>{item.rarity}</span>
                      {userItem && item.type === 'buff' && <span className="text-[10px] font-black text-indigo-400">Possuído: x{userItem.quantity}</span>}
                   </div>
                   <h3 className="text-2xl font-black text-white font-rpg">{item.name}</h3>
                   <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{item.description}</p>
                </div>
              </div>
              
              <div className="mt-10 flex items-center justify-between border-t border-zinc-800/50 pt-8">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-600 uppercase mb-1">Custo</span>
                  <span className="text-amber-400 font-black text-2xl tracking-tighter">💰 {item.price}</span>
                </div>
                <button
                  disabled={!canAfford || alreadyHasNonStackable}
                  onClick={(e) => { e.stopPropagation(); handleLocalPurchase(item); }}
                  className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    alreadyHasNonStackable
                      ? "bg-zinc-800 text-zinc-600 border border-zinc-700"
                      : canAfford 
                        ? "bg-white text-black hover:bg-zinc-200 shadow-2xl" 
                        : "bg-zinc-950 text-zinc-700 cursor-not-allowed border border-zinc-900"
                  }`}
                >
                  {isRecentlyPurchased ? "✨" : alreadyHasNonStackable ? "✓ ÚNICO" : "ADQUIRIR"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <ItemDetailsModal 
          item={selectedItem} user={user} onClose={() => setSelectedItem(null)} 
          onAction={handleLocalPurchase}
          actionLabel={user.gold >= selectedItem.price ? "Comprar Agora" : "Ouro Insuficiente"}
        />
      )}
    </div>
  );
};

export default Shop;
