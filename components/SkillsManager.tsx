
import React from 'react';
import { User, Skill } from '../types';
import { CLASS_STATS } from '../constants';

interface SkillsManagerProps {
  user: User;
  onUpgrade: (skillId: string) => void;
  onEquip: (skillId: string) => void;
  onUseActive: (skillId: string) => void;
}

const SkillsManager: React.FC<SkillsManagerProps> = ({ user, onUpgrade, onEquip, onUseActive }) => {
  const classSkillId = CLASS_STATS[user.charClass]?.activeSkill;
  const skills = user?.skills || [];

  const activeSkills = skills.filter(s => s.type === 'ativa');
  const passiveSkills = skills.filter(s => s.type === 'passiva');

  // Fix: Add key to the props type definition to allow passing it in JSX maps
  const SkillCard = ({ skill }: { skill: Skill; key?: React.Key }) => {
    const isClassSkill = skill.id === classSkillId;
    const isEquipped = user.equippedSkills?.includes(skill.id);
    const upgradeCost = Math.floor(skill.xpCostBase * Math.pow(1.5, skill.level));
    const canUpgrade = user.xp >= upgradeCost && skill.level < skill.maxLevel;
    const isLocked = skill.level === 0;

    return (
      <div 
        className={`group relative p-6 rounded-[2.5rem] bg-zinc-900/40 border-2 transition-all duration-500 flex flex-col justify-between h-full
          ${isEquipped 
            ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-indigo-500/5' 
            : 'border-zinc-800 hover:border-zinc-700 hover:translate-y-[-4px]'
          }
          ${isLocked ? 'opacity-60' : 'opacity-100'}
        `}
      >
        {/* Badge de Especialidade */}
        {isClassSkill && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap z-10">
            Poder de Classe
          </div>
        )}

        {/* Cabeçalho do Card */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-inner border transition-transform group-hover:scale-110 duration-500
            ${isEquipped ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-950 border-zinc-800'}
          `}>
            {isLocked ? '🔒' : skill.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white truncate group-hover:text-indigo-400 transition-colors">{skill.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: skill.maxLevel }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${i < skill.level ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-zinc-800'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Descrição e Efeito */}
        <div className="space-y-4 mb-8">
          <p className="text-zinc-500 text-xs font-medium leading-relaxed italic line-clamp-2">
            "{skill.description}"
          </p>
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/50">
             <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Efeito Atual</span>
             <p className="text-[10px] text-zinc-300 font-bold">{skill.effect}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          {skill.level < skill.maxLevel && (
            <button 
              disabled={!canUpgrade}
              onClick={() => onUpgrade(skill.id)}
              className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-4
                ${canUpgrade 
                  ? 'bg-white text-black hover:bg-zinc-200 border-zinc-300 active:translate-y-[2px] active:border-b-0' 
                  : 'bg-zinc-800 text-zinc-600 border-zinc-900 cursor-not-allowed opacity-50'
                }
              `}
            >
              Melhorar ({upgradeCost} XP)
            </button>
          )}
          
          {!isLocked && (
            <button 
              onClick={() => onEquip(skill.id)}
              className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                ${isEquipped 
                  ? 'bg-indigo-600/20 text-indigo-400 border-2 border-indigo-500/50' 
                  : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-800 hover:border-zinc-700'
                }
              `}
            >
              {isEquipped ? '✓ Ativada' : 'Equipar Perk'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32 animate-in fade-in duration-700 relative z-20 px-4">
      <header className="text-center space-y-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent -z-10" />
        <h2 className="text-6xl font-rpg text-white inline-block px-8 bg-zinc-950">
          Grémium de <span className="text-indigo-500">Talentos</span>
        </h2>
        <div className="flex justify-center items-center gap-4">
           <div className="px-6 py-2 bg-indigo-950/40 border border-indigo-500/30 rounded-full flex items-center gap-3 shadow-glow-indigo">
              <span className="text-lg">✨</span>
              <span className="text-sm font-black text-indigo-300 uppercase tracking-widest">XP Arcano: {user.xp}</span>
           </div>
        </div>
      </header>

      {/* Seção Ativas */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em] whitespace-nowrap">Artes Ativas</h3>
          <div className="h-px w-full bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSkills.map(skill => <SkillCard key={skill.id} skill={skill} />)}
        </div>
      </section>

      {/* Seção Passivas */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em] whitespace-nowrap">Emanações Passivas</h3>
          <div className="h-px w-full bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passiveSkills.map(skill => <SkillCard key={skill.id} skill={skill} />)}
        </div>
      </section>

      <style>{`
        .shadow-glow-indigo { box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); }
      `}</style>
    </div>
  );
};

export default SkillsManager;
