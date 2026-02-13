
import React from 'react';
import { User } from '../types';
import { CAMPAIGN_CHAPTERS } from '../constants';

interface CampaignTabProps {
  user: User;
  onClaim: (missionId: string) => void;
}

const CampaignTab: React.FC<CampaignTabProps> = ({ user, onClaim }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="text-center space-y-4">
        <h2 className="text-6xl font-rpg text-white uppercase tracking-tighter">Crônicas do <span className="text-red-600">Reino</span></h2>
        <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-[9px]">Sua lenda é escrita a cada vitória</p>
      </header>

      {/* Trilha do Herói */}
      <div className="relative p-12 bg-zinc-900/30 rounded-[4rem] border-2 border-zinc-800/50 shadow-inner overflow-hidden">
        <div className="absolute top-1/2 left-10 right-10 h-1 bg-zinc-800 -translate-y-1/2" />
        <div className="absolute top-1/2 left-10 h-1 bg-red-600 -translate-y-1/2 transition-all duration-1000" style={{ width: `${(user.campaignProgress / CAMPAIGN_CHAPTERS.length) * 100}%` }} />
        
        <div className="relative z-10 flex justify-between gap-4">
          {CAMPAIGN_CHAPTERS.map((ch, idx) => {
            const isCompleted = user.campaignProgress > idx;
            const isCurrent = user.campaignProgress === idx;
            return (
              <div key={ch.id} className="flex flex-col items-center gap-4 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border-4 transition-all ${isCompleted ? 'bg-red-600 border-red-400' : isCurrent ? 'bg-zinc-950 border-red-600 animate-pulse' : 'bg-zinc-950 border-zinc-800 text-zinc-800'}`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[7px] font-black uppercase tracking-widest ${isCurrent ? 'text-red-500' : 'text-zinc-700'}`}>Cap. {idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {CAMPAIGN_CHAPTERS.map((ch, idx) => {
          const isAvailable = user.campaignProgress === idx;
          const isCompleted = user.campaignProgress > idx;
          const canClaim = isAvailable && user.level >= ch.requiredLevel;
          return (
            <div key={ch.id} className={`p-8 rounded-[3rem] border-2 transition-all flex flex-col md:flex-row justify-between items-center gap-8 ${isCompleted ? 'bg-zinc-900/20 border-zinc-800 opacity-40' : isAvailable ? 'bg-zinc-900 border-red-600/30 shadow-2xl scale-[1.02]' : 'bg-zinc-950 border-zinc-900 grayscale opacity-20'}`}>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-3xl font-rpg text-white">{ch.title}</h3>
                <p className="text-zinc-400 text-sm max-w-md">{ch.description}</p>
                {isAvailable && user.level < ch.requiredLevel && <p className="text-red-500 text-[8px] font-black uppercase">Requer Nível {ch.requiredLevel}</p>}
              </div>
              <div className="flex items-center gap-10">
                <div className="text-right"><span className="text-[10px] font-black text-zinc-600 uppercase block mb-1">Tesouros</span><div className="flex gap-4 font-bold text-[10px]"><span className="text-indigo-400">✨ {ch.xpReward} XP</span><span className="text-amber-400">💰 {ch.goldReward} G</span></div></div>
                {isAvailable && <button disabled={!canClaim} onClick={()=>onClaim(ch.id)} className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canClaim ? 'bg-white text-black hover:bg-zinc-200 shadow-xl' : 'bg-zinc-800 text-zinc-600'}`}>Concluir</button>}
                {isCompleted && <span className="text-green-500 font-black text-[10px] uppercase">✓ Cronista</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignTab;
