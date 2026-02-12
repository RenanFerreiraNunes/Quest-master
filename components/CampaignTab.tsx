
import React from 'react';
import { User } from '../types';
import { CAMPAIGN_CHAPTERS } from '../constants';

interface CampaignTabProps {
  user: User;
  onClaim: (missionId: string) => void;
}

const CampaignTab: React.FC<CampaignTabProps> = ({ user, onClaim }) => {
  const chapters = CAMPAIGN_CHAPTERS;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-rpg text-white uppercase tracking-tighter">O Mapa do <span className="text-red-600">Destino</span></h2>
        <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Cumpra as crônicas para se tornar uma lenda</p>
      </header>

      {/* Progress Line */}
      <div className="relative pt-10 pb-20 px-8">
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-zinc-900 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-8 h-1 bg-red-600 -translate-y-1/2 transition-all duration-1000"
          style={{ width: `${(user.campaignProgress / chapters.length) * 100}%` }}
        />
        
        <div className="relative z-10 flex justify-between">
          {chapters.map((ch, idx) => {
            const isCompleted = user.campaignProgress > idx;
            const isCurrent = user.campaignProgress === idx;
            const isLocked = user.campaignProgress < idx;

            return (
              <div key={ch.id} className="flex flex-col items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-4 transition-all ${
                  isCompleted ? 'bg-red-600 border-red-400 text-white' : 
                  isCurrent ? 'bg-zinc-900 border-red-600 text-white animate-pulse' :
                  'bg-zinc-950 border-zinc-800 text-zinc-800'
                }`}>
                  {idx + 1}
                </div>
                <div className="text-center absolute mt-20">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-zinc-800' : 'text-zinc-400'}`}>Capítulo {idx + 1}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chapter Details */}
      <div className="space-y-6">
        {chapters.map((ch, idx) => {
          const isAvailable = user.campaignProgress === idx;
          const isCompleted = user.campaignProgress > idx;
          const canClaim = isAvailable && user.level >= ch.requiredLevel;

          return (
            <div 
              key={ch.id}
              className={`p-8 rounded-[3rem] border-2 transition-all ${
                isCompleted ? 'bg-zinc-900/20 border-zinc-800 opacity-50' :
                isAvailable ? 'bg-zinc-900 border-red-600/30 shadow-2xl' :
                'bg-zinc-950 border-zinc-900 grayscale opacity-30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-rpg text-white">{ch.title}</h3>
                    {user.level < ch.requiredLevel && !isCompleted && (
                      <span className="text-[9px] bg-zinc-800 px-3 py-1 rounded-full text-zinc-500 uppercase font-black">Nível {ch.requiredLevel} necessário</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm">{ch.description}</p>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Recompensas</p>
                    <div className="flex gap-4 font-bold text-xs">
                      <span className="text-indigo-400">✨ {ch.xpReward} XP</span>
                      <span className="text-amber-400">💰 {ch.goldReward} G</span>
                    </div>
                  </div>
                  
                  {isAvailable && (
                    <button 
                      disabled={!canClaim}
                      onClick={() => onClaim(ch.id)}
                      className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canClaim ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-600'}`}
                    >
                      {user.level >= ch.requiredLevel ? 'Cumprir Crônica' : 'Bloqueado'}
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-green-500 font-black text-sm">CONCLUÍDO</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignTab;
