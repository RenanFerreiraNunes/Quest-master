
import React from 'react';
import { InventoryItem, User } from '../types';
import { SHOP_ITEMS } from '../constants';

interface ItemDetailsModalProps {
  item: InventoryItem;
  user: User;
  onClose: () => void;
  onAction?: (item: InventoryItem) => void;
  actionLabel?: string;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, user, onClose, onAction, actionLabel }) => {
  const equippedId = item.slot ? user.equipment[item.slot] : null;
  const equippedItem = equippedId ? SHOP_ITEMS.find(i => i.id === equippedId) : null;

  const getComparison = () => {
    if (item.type !== 'equipment' || !item.slot) return null;
    const currentVal = equippedItem?.boostValue || 0;
    const newVal = item.boostValue || 0;
    const diff = newVal - currentVal;
    return { currentVal, newVal, diff, stat: item.statBoost };
  };

  const comp = getComparison();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300"
        style={{ borderColor: item.isAnimated ? '#fbbf24' : undefined }}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors z-10"
        >
          ✕
        </button>

        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-3xl bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-5xl shadow-inner ${item.isAnimated ? 'animate-pulse' : ''}`}>
              {item.icon}
            </div>
            <div>
              <h2 className="text-3xl font-black font-rpg text-white tracking-tight uppercase leading-none">{item.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">{item.type}</span>
                {item.slot && <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-800 text-zinc-500 rounded-lg border border-zinc-700">{item.slot}</span>}
              </div>
            </div>
          </div>

          {/* Description & Lore */}
          <div className="space-y-4">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Efeito de Atributo</h4>
              <p className="text-zinc-100 font-bold text-sm">{item.description}</p>
            </div>
            {item.lore && (
              <div className="bg-zinc-800/30 p-4 rounded-2xl italic border border-zinc-800/50">
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Lore do Item</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">"{item.lore}"</p>
              </div>
            )}
          </div>

          {/* Stat Comparison Table */}
          {comp && (
            <div className="space-y-4">
              <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Simulação de Equipamento</h4>
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
                <div className="text-center space-y-1">
                   <span className="text-[8px] text-zinc-600 uppercase font-black">Equipado</span>
                   <p className="text-sm font-bold text-zinc-400">{comp.currentVal}% {comp.stat}</p>
                </div>
                <div className="flex justify-center">
                   <span className="text-zinc-700 text-2xl">→</span>
                </div>
                <div className="text-center space-y-1">
                   <span className="text-[8px] text-zinc-600 uppercase font-black">Novo Impacto</span>
                   <p className={`text-sm font-black ${comp.diff > 0 ? 'text-emerald-400' : comp.diff < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                    {comp.newVal}% {comp.stat}
                    {comp.diff !== 0 && (
                      <span className="block text-[10px]">
                        ({comp.diff > 0 ? '+' : ''}{comp.diff}%)
                      </span>
                    )}
                   </p>
                </div>
              </div>
              {comp.diff > 0 ? (
                <p className="text-[10px] text-emerald-500/80 font-black uppercase text-center tracking-widest">▲ Este item é superior ao atual</p>
              ) : comp.diff < 0 ? (
                <p className="text-[10px] text-red-500/80 font-black uppercase text-center tracking-widest">▼ Este item reduz seus atributos</p>
              ) : null}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
             <div className="flex items-center gap-2 text-amber-400 font-black text-xl">
                <span className="text-sm">💰</span> {item.price}
             </div>
             <div className="flex gap-3">
               <button 
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 hover:text-white transition-all"
               >
                 Fechar
               </button>
               {onAction && (
                 <button 
                  onClick={() => { onAction(item); onClose(); }}
                  className="px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-200 shadow-xl transition-all"
                 >
                   {actionLabel || 'Ação'}
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
