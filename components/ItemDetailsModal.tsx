
import React from 'react';
import { InventoryItem, User } from '../types';
import { SHOP_ITEMS, RARITIES } from '../constants';

interface ItemDetailsModalProps {
  item: InventoryItem;
  user: User;
  onClose: () => void;
  onAction?: (item: InventoryItem) => void;
  actionLabel?: string;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, user, onClose, onAction, actionLabel }) => {
  const equippedId = item.slot && user.equipment ? user.equipment[item.slot] : null;
  const equippedItem = equippedId ? SHOP_ITEMS.find(i => i.id === equippedId) : null;
  const rarity = RARITIES[item.rarity] || RARITIES.comum;

  const getComparison = () => {
    if (item.type !== 'equipment' || !item.slot) return null;
    const currentVal = equippedItem?.boostValue || 0;
    const newVal = item.boostValue || 0;
    const diff = newVal - currentVal;
    return { currentVal, newVal, diff, stat: item.statBoost };
  };

  const comp = getComparison();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className={`w-full max-w-xl bg-zinc-900 border-2 rounded-[4rem] overflow-hidden shadow-3xl relative animate-in zoom-in-95 duration-300 ${rarity.color.split(' ')[1]}`}
      >
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all z-10"
        >
          ✕
        </button>

        <div className="p-12 space-y-10">
          <div className="flex items-center gap-8">
            <div className={`w-32 h-32 rounded-[2.5rem] bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-6xl shadow-inner ${item.isAnimated ? 'animate-pulse' : ''} ${rarity.bg}`}>
              {item.icon}
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-rpg text-white tracking-tight uppercase">{item.name}</h2>
              <div className="flex gap-3">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-full border ${rarity.color}`}>{item.rarity}</span>
                {item.quantity && item.quantity > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1 bg-zinc-800 text-indigo-400 rounded-full border border-zinc-700">Quantidade: x{item.quantity}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-inner">
              <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Efeito Místico</h4>
              <p className="text-zinc-100 font-bold text-base leading-relaxed">{item.description}</p>
            </div>
            {item.lore && (
              <div className="p-6 bg-zinc-800/10 border border-zinc-800/50 rounded-3xl">
                <p className="text-zinc-500 italic text-sm leading-relaxed font-medium">"{item.lore}"</p>
              </div>
            )}
          </div>

          {comp && (
            <div className="bg-black/40 p-8 rounded-[2.5rem] border border-zinc-800">
               <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-6 text-center">Impacto Estatístico</h4>
               <div className="grid grid-cols-3 items-center text-center">
                  <div>
                    <span className="text-[8px] text-zinc-500 font-black uppercase block mb-1">Equipado</span>
                    <p className="text-zinc-400 font-black">{equippedItem ? `${comp.currentVal}%` : '---'}</p>
                    <p className="text-[7px] text-zinc-600 font-bold uppercase">{equippedItem?.name || 'Nenhum'}</p>
                  </div>
                  <div className="text-3xl text-zinc-800">→</div>
                  <div>
                    <span className="text-[8px] text-zinc-500 font-black uppercase block mb-1">Ao Equipar</span>
                    <p className={`text-2xl font-black ${comp.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {comp.newVal}% {comp.stat}
                    </p>
                    <p className={`text-[8px] font-black uppercase ${comp.diff >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                      {comp.diff > 0 ? `+${comp.diff}` : comp.diff}% de variação
                    </p>
                  </div>
               </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Preço</span>
                <span className="text-amber-400 font-black text-3xl tracking-tighter">💰 {item.price}</span>
             </div>
             <div className="flex gap-4">
               {onAction && (
                 <button 
                  onClick={() => { onAction(item); onClose(); }}
                  className={`px-12 py-5 rounded-3xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${actionLabel?.includes('Insuficiente') ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}
                  disabled={actionLabel?.includes('Insuficiente')}
                 >
                   {actionLabel || 'Confirmar'}
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
