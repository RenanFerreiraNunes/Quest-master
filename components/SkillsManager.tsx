
import React from 'react';
import { User, Skill } from '../types';

interface SkillsManagerProps {
  user: User;
  onUpgrade: (skillId: string) => void;
  onEquip: (skillId: string) => void;
  onUseActive: (skillId: string) => void;
}

const SkillsManager: React.FC<SkillsManagerProps> = ({ user, onUpgrade, onEquip, onUseActive }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-4xl font-rpg text-white">Árvore de <span className="text-indigo-500">Habilidades</span></h2>
        <p className="text-zinc-500 text-sm">Gaste sua experiência para despertar novos poderes.</p>
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
           <span>✨ XP Disponível: {user.xp}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {user.skills.map((skill) => {
          const isEquipped = user.equippedSkills.includes(skill.id);
          const upgradeCost = Math.floor(skill.xpCostBase * Math.pow(1.5, skill.level));
          const canUpgrade = user.xp >= upgradeCost && skill.level < skill.maxLevel;
          const isMaxed = skill.level >= skill.maxLevel;
          const isActive = skill.type === 'ativa';

          return (
            <div 
              key={skill.id}
              className={`relative bg-zinc-900/50 border-2 rounded-[2rem] p-6 transition-all group overflow-hidden ${
                isEquipped ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-zinc-800'
              }`}
            >
              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-all"></div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-zinc-700">
                    {skill.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{skill.name}</h3>
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {skill.type}
                      </span>
                      <span className="text-zinc-500 text-xs font-bold">Lvl {skill.level}/{skill.maxLevel}</span>
                    </div>
                  </div>
                </div>
                
                {isActive && isEquipped && skill.level > 0 && (
                   <button
                    onClick={() => onUseActive(skill.id)}
                    className="p-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black shadow-lg transition-all active:scale-90"
                   >
                     USAR
                   </button>
                )}
              </div>

              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{skill.description}</p>
              
              <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 mb-6">
                 <span className="text-[10px] text-zinc-500 uppercase font-black block mb-1">Efeito Atual</span>
                 <p className="text-indigo-400 text-xs font-bold">{skill.level > 0 ? skill.effect : "Habilidade bloqueada"}</p>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={!canUpgrade || isMaxed}
                  onClick={() => onUpgrade(skill.id)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isMaxed 
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' 
                      : canUpgrade 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl' 
                        : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  {isMaxed ? 'Nível Máximo' : `Melhorar (${upgradeCost} XP)`}
                </button>

                {skill.level > 0 && (
                  <button
                    onClick={() => onEquip(skill.id)}
                    className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      isEquipped 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {isEquipped ? 'Equipada' : 'Equipar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6">
        <h4 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
          <span>ℹ️</span> Sistema de Equipamento
        </h4>
        <p className="text-zinc-500 text-sm">
          Você pode equipar até 2 habilidades simultaneamente. Habilidades passivas dão bônus automáticos, 
          enquanto ativas devem ser usadas estrategicamente.
        </p>
      </div>
    </div>
  );
};

export default SkillsManager;
