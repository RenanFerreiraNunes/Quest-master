
import React from 'react';
import { User, Talent, TalentTreeType } from '../types';
import { CLASS_PASSIVES } from '../constants';

interface SkillsManagerProps {
  user: User;
  onUpgrade: (talentId: string) => void;
}

const SkillsManager: React.FC<SkillsManagerProps> = ({ user, onUpgrade }) => {
  const talents = user.talents || [];
  const passive = CLASS_PASSIVES[user.charClass];

  const renderTree = (type: TalentTreeType, title: string, color: string, icon: string) => {
    const treeTalents = talents.filter(t => t.tree === type);
    
    return (
      <div className="space-y-8 bg-zinc-900/20 p-8 rounded-[3rem] border border-zinc-800 shadow-xl relative overflow-hidden flex flex-col">
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-10 ${color}`} />
        <header className="flex items-center gap-4 border-b border-zinc-800 pb-4">
           <span className="text-4xl">{icon}</span>
           <div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
             <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Trilha de Especialização</p>
           </div>
        </header>

        <div className="flex flex-col gap-6 relative flex-1">
          {treeTalents.map((talent, idx) => {
            const isUnlocked = !talent.requiredTalentId || talents.find(t => t.id === talent.requiredTalentId)!.level > 0;
            const canUpgrade = user.talentPoints > 0 && isUnlocked && talent.level < talent.maxLevel;
            
            return (
              <div key={talent.id} className="relative">
                {idx > 0 && (
                  <div className="absolute -top-6 left-8 w-0.5 h-6 bg-zinc-800" />
                )}
                <div className={`p-5 rounded-3xl border-2 transition-all flex items-center gap-5 ${talent.level > 0 ? 'border-indigo-500 bg-indigo-500/5 shadow-lg' : isUnlocked ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-900 bg-zinc-950 opacity-40'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${talent.level > 0 ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-900 border-zinc-800'}`}>
                    {isUnlocked ? talent.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-white text-sm">{talent.name}</h4>
                      <span className="text-[10px] font-black text-indigo-400">{talent.level}/{talent.maxLevel}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-1">{talent.description}</p>
                  </div>
                  {canUpgrade && (
                    <button 
                      onClick={() => onUpgrade(talent.id)}
                      className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black hover:bg-indigo-400 transition-all shadow-xl active:scale-90"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8 bg-zinc-900/40 p-10 rounded-[4rem] border border-zinc-800 shadow-3xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-glow-indigo">✨</div>
          <div>
            <h2 className="text-5xl font-rpg text-white tracking-tighter uppercase">Arcana de <span className="text-indigo-500">Talentos</span></h2>
            <div className="flex items-center gap-3 mt-1">
               <span className="px-3 py-1 bg-zinc-950 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">Pontos Disponíveis: {user.talentPoints}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/60 p-6 rounded-3xl border border-zinc-800 flex items-center gap-6 shadow-inner">
           <div className="text-3xl">{passive.icon}</div>
           <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Passiva de {user.charClass}</p>
              <h4 className="text-white font-black">{passive.name}</h4>
              <p className="text-[10px] text-indigo-400 font-bold">{passive.effect}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {renderTree('vitalidade', 'Vitalidade', 'bg-red-500', '🩸')}
        {renderTree('sabedoria', 'Sabedoria', 'bg-indigo-500', '📖')}
        {renderTree('prosperidade', 'Prosperidade', 'bg-amber-500', '💰')}
        {renderTree('combate', 'Combate', 'bg-orange-500', '⚔️')}
      </div>

      <style>{`
        .shadow-glow-indigo { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
      `}</style>
    </div>
  );
};

export default SkillsManager;
