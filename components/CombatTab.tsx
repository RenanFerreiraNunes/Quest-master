
import React, { useState, useEffect } from 'react';
import { User, Monster, Appearance } from '../types';
import HeroAvatar from './HeroAvatar';

interface CombatTabProps {
  user: User;
  onWin: (monster: Monster) => void;
  onLose: (damage: number) => void;
  onRetreat: (penalty: number) => void;
}

const CombatTab: React.FC<CombatTabProps> = ({ user, onWin, onLose, onRetreat }) => {
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const [turn, setTurn] = useState(0);

  const getRandomAppearance = (): Appearance => {
    const hairStyles: Appearance['hairStyle'][] = ['short', 'spiky', 'long', 'mohawk', 'bob', 'braids'];
    const expressions: Appearance['expression'][] = ['neutral', 'grin', 'angry', 'focused'];
    const colors = ['#4a3728', '#27272a', '#1e293b', '#450a0a', '#064e3b', '#1e1b4b'];
    
    return {
      skinColor: '#84cc16', // Monstros são verdes por padrão
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      hairColor: colors[Math.floor(Math.random() * colors.length)],
      facialHair: 'none',
      facialHairColor: '#000',
      eyebrowStyle: 'angry',
      eyeStyle: 'glow',
      eyeColor: '#ef4444',
      expression: expressions[Math.floor(Math.random() * expressions.length)],
      outfitColor: '#451a03'
    };
  };

  const generateMonster = (isBoss: boolean = false) => {
    const level = isBoss ? user.level + 2 : Math.max(1, user.level + (Math.random() > 0.6 ? 1 : -1));
    const monster: Monster = {
      id: Math.random().toString(36).substr(2, 9),
      name: isBoss ? "Lich Rei do Abismo" : "Orc Renegado",
      hp: level * (isBoss ? 250 : 60),
      maxHp: level * (isBoss ? 250 : 60),
      attack: level * (isBoss ? 18 : 8),
      defense: level * 3,
      level,
      isBoss,
      appearance: getRandomAppearance(),
      rewards: { xp: level * 60, gold: level * 30, itemChance: isBoss ? 100 : 15 }
    };
    setCurrentMonster(monster);
    setBattleLog([`Um ${monster.name} Lv.${monster.level} cruzou seu caminho!`]);
    setTurn(0);
    setIsFighting(false);
  };

  const handleRetreat = () => {
    if (!currentMonster) return;
    if (confirm("Deseja bater em retirada? Recuar causará exaustão (15 HP).")) {
      onRetreat(15);
      setCurrentMonster(null);
      setBattleLog([]);
      setIsFighting(false);
    }
  };

  const handleAction = (type: 'attack' | 'defend') => {
    if (!currentMonster || isFighting) return;
    setIsFighting(true);
    
    // Turno do Jogador
    setTimeout(() => {
      const combatTalent = user.talents.find(t => t.id === 'com_1')?.level || 0;
      const attackMultiplier = 1 + (combatTalent * 0.1);
      const critTalent = user.talents.find(t => t.id === 'com_2')?.level || 0;
      const critChance = 0.1 + (critTalent * 0.05);
      
      const isCrit = Math.random() < critChance;
      let damage = Math.floor((user.level * 12 * (isCrit ? 1.8 : 1) * attackMultiplier) - currentMonster.defense);
      damage = Math.max(8, damage);
      
      const newMonsterHp = Math.max(0, currentMonster.hp - damage);
      setCurrentMonster(prev => prev ? { ...prev, hp: newMonsterHp } : null);
      setBattleLog(prev => [`Herói desfere ${damage} de dano! ${isCrit ? 'CRÍTICO!' : ''}`, ...prev]);

      if (newMonsterHp <= 0) {
        setBattleLog(prev => [`GLÓRIA! O ${currentMonster.name} foi expurgado!`, ...prev]);
        setTimeout(() => { onWin(currentMonster); setCurrentMonster(null); setIsFighting(false); }, 1500);
        return;
      }

      // Turno do Monstro
      setTimeout(() => {
        const resTalent = user.talents.find(t => t.id === 'vit_2')?.level || 0;
        const mitigation = resTalent * 0.05;
        
        let monsterDamage = Math.floor(currentMonster.attack * (1 - mitigation));
        monsterDamage = Math.max(3, monsterDamage);
        
        setBattleLog(prev => [`O ${currentMonster.name} ataca causando ${monsterDamage} de dano!`, ...prev]);
        
        onLose(monsterDamage);
        
        if (user.hp <= monsterDamage) {
           setBattleLog(prev => [`Você desmaiou em combate...`, ...prev]);
           setTimeout(() => { setCurrentMonster(null); setIsFighting(false); }, 1500);
           return;
        }
        
        setIsFighting(false);
        setTurn(prev => prev + 1);
      }, 1000);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4">
      {!currentMonster ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-10 bg-zinc-900/20 border-4 border-dashed border-zinc-800 rounded-[5rem] animate-in zoom-in-95">
           <div className="text-9xl animate-pulse filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">⚔️</div>
           <div className="text-center space-y-4">
              <h2 className="text-6xl font-rpg text-white uppercase tracking-tighter">Campo de Batalha</h2>
              <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Onde heróis são forjados no sangue e aço</p>
           </div>
           <div className="flex flex-col md:flex-row gap-6">
              <button onClick={() => generateMonster(false)} className="px-16 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95 border-b-4 border-zinc-400">Caçar Orcs</button>
              <button onClick={() => generateMonster(true)} className="px-16 py-6 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_40px_rgba(220,38,38,0.4)] active:scale-95 border-b-4 border-red-900">Desafiar Chefe</button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
           <div className="lg:col-span-4 flex flex-col items-center bg-zinc-900/40 p-10 rounded-[4rem] border-2 border-zinc-800 shadow-2xl relative">
              <div className="w-64 h-64 bg-zinc-950 rounded-full border-4 border-indigo-500/30 flex items-center justify-center overflow-hidden mb-8 shadow-inner relative">
                 <HeroAvatar appearance={user.appearance} user={user} size={280} className="translate-y-14" />
                 {isFighting && turn % 2 === 1 && <div className="absolute inset-0 bg-red-600/20 animate-pulse" />}
              </div>
              <div className="text-center space-y-3 w-full">
                 <h4 className="text-3xl font-black text-white uppercase font-rpg">{user.nickname}</h4>
                 <div className="w-full h-5 bg-zinc-800 rounded-full overflow-hidden border-2 border-zinc-700">
                    <div className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" style={{ width: `${(user.hp / user.maxHp) * 100}%` }} />
                 </div>
                 <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{user.hp} / {user.maxHp} HP</p>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8 flex flex-col justify-center h-full">
              <div className="flex flex-col gap-5">
                 <button 
                  onClick={() => handleAction('attack')} 
                  disabled={isFighting} 
                  className={`py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl disabled:opacity-50 transition-all border-b-4 ${isFighting ? 'bg-zinc-800 text-zinc-600 border-zinc-900' : 'bg-white text-black hover:bg-zinc-200 border-zinc-400 active:translate-y-1 active:border-b-0'}`}
                 >
                   Golpear
                 </button>
                 <button onClick={handleRetreat} className="py-4 text-red-500 font-black uppercase tracking-widest text-[10px] hover:underline active:scale-95 transition-all">Retirada Estratégica</button>
              </div>
              
              <div className="bg-zinc-950/80 p-8 rounded-[3rem] border-2 border-zinc-800 h-80 overflow-y-auto scrollbar-hide flex flex-col-reverse gap-4 shadow-inner">
                 {battleLog.map((log, i) => (
                   <div key={i} className={`p-3 rounded-2xl border ${log.includes('dano!') ? 'bg-red-500/5 border-red-900/30 text-red-400' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'} text-[11px] font-bold leading-relaxed animate-in slide-in-from-bottom-2`}>
                     {log}
                   </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-4 flex flex-col items-center bg-zinc-900/40 p-10 rounded-[4rem] border-2 border-red-900/30 shadow-2xl relative">
              {currentMonster.isBoss && <div className="absolute -top-6 bg-red-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] animate-bounce shadow-glow-red">Chefe Final</div>}
              <div className="w-64 h-64 bg-zinc-950 rounded-full border-4 border-red-900/30 flex items-center justify-center overflow-hidden mb-8 shadow-inner relative">
                 <HeroAvatar appearance={currentMonster.appearance} size={280} className="translate-y-14" />
                 {isFighting && turn % 2 === 0 && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
              </div>
              <div className="text-center space-y-3 w-full">
                 <h4 className="text-3xl font-black text-red-500 uppercase font-rpg">{currentMonster.name}</h4>
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Nível de Ameaça {currentMonster.level}</p>
                 <div className="w-full h-5 bg-zinc-800 rounded-full overflow-hidden border-2 border-zinc-700">
                    <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.5)]" style={{ width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%` }} />
                 </div>
                 <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{currentMonster.hp} / {currentMonster.maxHp} HP</p>
              </div>
           </div>
        </div>
      )}
      <style>{`
        .shadow-glow-red { box-shadow: 0 0 20px rgba(220, 38, 38, 0.4); }
      `}</style>
    </div>
  );
};

export default CombatTab;
