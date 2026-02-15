
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Task, Rarity, InventoryItem, Difficulty, CharacterClass, Appearance, EquipmentSlot, ItemType, Talent, Monster } from './types';
import { db } from './services/db';
import { geminiService } from './services/gemini';
import { RARITIES, DIFFICULTIES, CLASSES, THEMES, INITIAL_TALENTS, CLASS_STATS, SHOP_ITEMS, CAMPAIGN_CHAPTERS, BASE_INVENTORY_CAPACITY, CLASS_PASSIVES } from './constants';
import StatsBar from './components/StatsBar';
import Shop from './components/Shop';
import HeroAvatar from './components/HeroAvatar';
import ChromaGrid from './components/ChromaGrid';
import ClickSpark from './components/ClickSpark';
import QuestStepper from './components/QuestStepper';
import SkillsManager from './components/SkillsManager';
import CharacterCreator from './components/CharacterCreator';
import SocialTab from './components/SocialTab';
import SettingsTab from './components/SettingsTab';
import CombatTab from './components/CombatTab';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'quests' | 'combat' | 'shop' | 'inventory' | 'profile' | 'skills' | 'social' | 'settings'>('quests');
  const [questSubTab, setQuestSubTab] = useState<'active' | 'completed' | 'defeats'>('active');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentTheme = useMemo(() => {
    if (!user) return THEMES['theme-default'];
    return THEMES[user.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];
  }, [user]);

  // Listener para sincronização de dados externos (Ex: Novos pedidos de amizade vindo de outros usuários)
  useEffect(() => {
    const syncData = async () => {
      if (user?.email) {
        const freshData = await db.getUser(user.email);
        if (freshData) setUser(freshData);
      }
    };
    window.addEventListener('storage_sync', syncData);
    return () => window.removeEventListener('storage_sync', syncData);
  }, [user?.email]);

  // Regeneração Passiva Paladino
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (user && user.charClass === 'Paladino' && user.hp < user.maxHp) {
        setUser(prev => {
          if (!prev) return null;
          return { ...prev, hp: Math.min(prev.maxHp, prev.hp + 0.1) };
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.charClass]);

  const updateAndSave = useCallback(async (updated: User) => {
    const vitLevel = updated.talents.find(t => t.id === 'vit_1')?.level || 0;
    const stats = CLASS_STATS[updated.charClass] || { hp: 100 };
    updated.maxHp = stats.hp + (updated.level * 15) + (vitLevel * 20);
    
    const xpNeeded = updated.level * 200;
    if (updated.xp >= xpNeeded) { 
      updated.level += 1; 
      updated.xp -= xpNeeded; 
      updated.hp = updated.maxHp; 
      updated.talentPoints = (updated.talentPoints || 0) + 1;
    }
    
    if (updated.hp <= 0) {
      updated.gold = Math.max(0, updated.gold - 50);
      updated.hp = Math.floor(updated.maxHp * 0.2);
      alert("Você desmaiou por exaustão! Perdeu 50 moedas de ouro.");
    } 

    setUser(updated); 
    await db.saveUser(updated);
  }, []);

  const handleCombatWin = async (monster: Monster) => {
    if (!user) return;
    const updated = {
      ...user,
      xp: user.xp + monster.rewards.xp,
      gold: user.gold + monster.rewards.gold,
    };
    await updateAndSave(updated);
  };

  const handleCombatLose = async (damage: number) => {
    if (!user) return;
    const updated = { ...user, hp: Math.max(0, user.hp - damage) };
    await updateAndSave(updated);
  };

  const handleQuestComplete = async (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task) return;

    const rarityCfg = RARITIES[task.rarity];
    const diffCfg = DIFFICULTIES[task.difficulty];
    
    let xpBonus = 1.0;
    if (user.charClass === 'Mago') xpBonus = 1.2;
    const wisdomTalent = user.talents.find(t => t.id === 'sab_1')?.level || 0;
    xpBonus += (wisdomTalent * 0.05);

    let goldBonus = 1.0;
    if (user.charClass === 'Guerreiro') goldBonus = 1.2;
    const prosTalent = user.talents.find(t => t.id === 'pro_1')?.level || 0;
    goldBonus += (prosTalent * 0.05);

    const xpGain = rarityCfg.xp * diffCfg.multiplier * xpBonus;
    const goldGain = rarityCfg.gold * diffCfg.multiplier * goldBonus;
    
    const updatedUser = {
      ...user,
      gold: user.gold + goldGain,
      xp: user.xp + xpGain,
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, done: true, doneAt: Date.now() } : t)
    };
    await updateAndSave(updatedUser);
  };

  const handleAbandonQuest = async (taskId: string) => {
    const confirmAbandon = confirm("Deseja abandonar este contrato? O esforço gasto causará exaustão (perda de HP).");
    if (!confirmAbandon || !user) return;

    const taskIndex = user.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = user.tasks[taskIndex];
    const rarityCfg = RARITIES[task.rarity];
    let hpCost = rarityCfg.hpCost || 10;

    if (user.charClass === 'Ladino' && Math.random() < 0.15) {
      alert("Sombra e Agilidade! Você evitou a exaustão ao abandonar o contrato.");
      hpCost = 0;
    }

    let updatedHp = Math.max(0, user.hp - hpCost);
    let updatedGold = user.gold;
    
    if (updatedHp <= 0) {
      updatedGold = Math.max(0, user.gold - 50);
      updatedHp = Math.floor(user.maxHp * 0.2);
      alert("Você desmaiou por exaustão ao abandonar a missão! Perdeu 50 moedas de ouro.");
    }

    const updatedTasks = user.tasks.filter(t => t.id !== taskId);
    const updatedUser = {
      ...user,
      hp: updatedHp,
      gold: updatedGold,
      tasks: updatedTasks
    };

    await updateAndSave(updatedUser);
  };

  const handleTaskTick = async (taskId: string) => {
    setUser(prev => {
      if (!prev) return null;
      const tasks = prev.tasks.map(t => {
        if (t.id === taskId && !t.isPaused && !t.done && t.startTime) {
          const acc = t.accumulatedTimeMs + 1000;
          return { ...t, accumulatedTimeMs: acc };
        }
        return t;
      });
      return { ...prev, tasks };
    });
  };

  useEffect(() => {
    const initSession = async () => {
      const sessionEmail = db.getSession();
      if (sessionEmail) {
        const userData = await db.getUser(sessionEmail);
        if (userData) setUser(userData);
      }
      setIsLoading(false);
    };
    initSession();
  }, []);

  const handleLogin = async () => {
    if (!email) return;
    setIsLoading(true);
    const existing = await db.getUser(email);
    if (!existing) {
      setIsCreatingCharacter(true);
    } else {
      db.setSession(email);
      setUser(existing);
    }
    setIsLoading(false);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user && !isCreatingCharacter) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
      <ChromaGrid />
      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-3xl border border-zinc-800 p-8 md:p-12 rounded-[4rem] shadow-3xl flex flex-col items-center text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-rpg mb-10 text-white font-black tracking-tighter uppercase w-full text-center leading-none">
          Quest<span className="text-red-600">Master</span>
        </h1>
        <div className="space-y-6 w-full">
          <input type="email" placeholder="Seu Email de Herói" className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white text-center outline-none focus:ring-4 ring-red-600/20 font-bold text-lg" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-red-600 py-6 rounded-3xl font-black text-white uppercase tracking-[0.3em] hover:bg-red-500 transition-all border-b-8 border-red-900 shadow-2xl active:translate-y-2 active:border-b-0">Acessar Reino</button>
        </div>
      </div>
    </div>
  );

  if (isCreatingCharacter || isEditingProfile) return <CharacterCreator initialData={isEditingProfile ? user! : undefined} onComplete={async (data) => {
    if (isEditingProfile) {
      await updateAndSave({ ...user!, appearance: data.appearance, nickname: data.nickname, charClass: data.charClass });
      setIsEditingProfile(false);
    } else {
      const stats = CLASS_STATS[data.charClass];
      const newUser: User = { 
        ...data, email, xp: 0, level: 1, gold: 100, hp: stats.hp, maxHp: stats.hp, 
        isBroken: false, inventoryCapacity: 16, activeTheme: 'theme-default', 
        tasks: [], inventory: [], talents: INITIAL_TALENTS, talentPoints: 0, 
        equipment: { head: null, body: null, acc1: null, acc2: null, special: null }, 
        campaignProgress: 0, friends: [], friendRequests: [], guildId: null 
      };
      await db.saveUser(newUser); 
      db.setSession(email); 
      setUser(newUser);
      setIsCreatingCharacter(false);
    }
  }} onCancel={isEditingProfile ? () => setIsEditingProfile(false) : undefined} />;

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} overflow-hidden relative transition-all duration-700`}>
        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full z-20">
          <div className="flex flex-col items-center mb-10 gap-6">
            <div className="w-32 h-32 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden relative group">
              <HeroAvatar appearance={user.appearance} user={user} size={140} className="translate-y-10" />
              <button onClick={() => setActiveTab('profile')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-widest">Ver Herói</button>
            </div>
            <div className="text-center space-y-2">
              <h1 className="font-rpg text-2xl font-black tracking-tight">{user.nickname}</h1>
              <div className="px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[8px] uppercase font-black tracking-widest text-red-500">Lv. {user.level} {user.charClass}</div>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            <StatsBar label="Vitalidade" current={Math.floor(user.hp)} max={user.maxHp} color="bg-red-600" icon="❤️" />
            <StatsBar label="Prestígio" current={Math.floor(user.xp)} max={user.level * 200} color="bg-indigo-600" icon="✨" />
            <div className="bg-zinc-950/60 p-5 rounded-3xl border border-zinc-800 space-y-4">
               <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-500 uppercase">Tesouro</span><span className="text-amber-400 font-black text-sm">💰 {user.gold.toFixed(0)}</span></div>
               <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-500 uppercase">Talento</span><span className="text-indigo-400 font-black text-sm">✨ {user.talentPoints} TP</span></div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
             <button onClick={()=>setActiveTab('settings')} className={`w-full py-4 rounded-2xl border border-zinc-800 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab==='settings'?'bg-white text-black':'text-zinc-500 hover:text-white bg-zinc-900/40'}`}>⚙️ Ajustes</button>
             <button onClick={()=>{db.logout(); window.location.reload();}} className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-zinc-700 hover:text-red-500 transition-all">Deslogar</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative p-6 md:p-12 z-10 scrollbar-hide">
          <nav className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 sticky top-0 z-[100] backdrop-blur-md">
            {[ 
              {id:'quests',l:'Missões',i:'📜'}, {id:'combat',l:'Combate',i:'⚔️'}, 
              {id:'shop',l:'Bazar',i:'💎'}, {id:'inventory',l:'Mochila',i:'🎒'}, 
              {id:'skills',l:'Talentos',i:'✨'}, {id:'social',l:'Aliança',i:'🤝'} 
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-6 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-2xl scale-105':'bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                <span className="text-lg">{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'quests' && (
            <div className="max-w-6xl mx-auto space-y-10 pb-32">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                 <div className="bg-zinc-900/50 p-1.5 rounded-[2rem] border border-zinc-800 flex gap-2">
                   {[
                     { id: 'active', label: 'MURAL', icon: '📜' },
                     { id: 'completed', label: 'GRIMÓRIO', icon: '📖' },
                     { id: 'defeats', label: 'DERROTAS', icon: '💀' }
                   ].map(st => (
                     <button 
                       key={st.id} 
                       onClick={() => setQuestSubTab(st.id as any)}
                       className={`px-8 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${questSubTab === st.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                     >
                       {st.label}
                     </button>
                   ))}
                 </div>

                 <div className="flex gap-4">
                   <select 
                     value={rarityFilter} 
                     onChange={(e) => setRarityFilter(e.target.value as any)}
                     className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-[9px] font-black uppercase text-zinc-400 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                   >
                     <option value="all">TODAS RARIDADES</option>
                     {Object.keys(RARITIES).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                   </select>
                   <select 
                     value={diffFilter} 
                     onChange={(e) => setDiffFilter(e.target.value as any)}
                     className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-[9px] font-black uppercase text-zinc-400 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                   >
                     <option value="all">TODAS DIFICULDADES</option>
                     {Object.keys(DIFFICULTIES).map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                   </select>
                 </div>
               </div>

               {questSubTab === 'active' && (
                 <button onClick={()=>setShowQuestCreator(true)} className="w-full bg-zinc-900/20 border-4 border-dashed border-zinc-800 p-10 rounded-[4rem] flex flex-col items-center gap-4 hover:border-indigo-600/50 hover:bg-indigo-600/5 transition-all group">
                    <span className="text-5xl group-hover:scale-125 transition-transform duration-500">📜</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600 group-hover:text-indigo-400">Firmar Novo Contrato</span>
                 </button>
               )}

               {showQuestCreator && <QuestStepper onComplete={async data => { 
                 const newTask = {...data, id: Math.random().toString(36).substr(2,9), startTime: null, lastTickTime: 0, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now(), durationMinutes: data.duration};
                 await updateAndSave({...user!, tasks: [newTask, ...user!.tasks]});
                 setShowQuestCreator(false); 
               }} onCancel={()=>setShowQuestCreator(false)} />}

               <div className="grid grid-cols-1 gap-8 mt-10">
                 {user.tasks
                  .filter(t => {
                    if (questSubTab === 'active') return !t.done;
                    if (questSubTab === 'completed') return t.done;
                    return false;
                  })
                  .filter(t => rarityFilter === 'all' || t.rarity === rarityFilter)
                  .filter(t => diffFilter === 'all' || t.difficulty === diffFilter)
                  .map(task => {
                   const progress = Math.min(100, (task.accumulatedTimeMs / (task.minDurationSeconds * 1000)) * 100);
                   const isReady = progress >= 100;
                   const rarityCfg = RARITIES[task.rarity];
                   const diffCfg = DIFFICULTIES[task.difficulty];
                   const remainingMs = Math.max(0, (task.minDurationSeconds * 1000) - task.accumulatedTimeMs);

                   return (
                     <div 
                        key={task.id} 
                        className={`p-10 rounded-[4rem] border-2 relative overflow-hidden transition-all duration-500 flex flex-col ${rarityCfg.bg} ${rarityCfg.color} ${rarityCfg.shadow}`}
                        style={{ boxShadow: rarityCfg.shadow.includes('shadow-') ? undefined : rarityCfg.shadow }} 
                     >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                           <div className="lg:col-span-7 space-y-6">
                              <div className="flex flex-wrap gap-3">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border bg-zinc-950/50 border-current`}>{task.rarity}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border bg-zinc-950/50 opacity-60`}>{task.difficulty}</span>
                              </div>
                              <h3 className="text-7xl font-black text-white font-rpg tracking-tighter uppercase leading-none">{task.title}</h3>
                              <div className="flex gap-4 pt-2">
                                <div className="flex items-center gap-2 bg-zinc-950/60 px-5 py-2 rounded-2xl border border-amber-500/20"><span className="text-amber-400 text-lg">💰</span> <span className="text-amber-400 font-black text-xs">{rarityCfg.gold * diffCfg.multiplier}G</span></div>
                                <div className="flex items-center gap-2 bg-zinc-950/60 px-5 py-2 rounded-2xl border border-indigo-500/20"><span className="text-indigo-400 text-lg">✨</span> <span className="text-indigo-400 font-black text-xs">{rarityCfg.xp * diffCfg.multiplier}XP</span></div>
                              </div>
                           </div>

                           <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center h-full">
                              {task.startTime || isReady ? (
                                <div className="bg-zinc-950/80 p-8 rounded-[3rem] border border-zinc-800/50 text-center min-w-[300px] shadow-inner">
                                   <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3">Tempo Restante</p>
                                   <p className={`text-7xl font-black font-mono tracking-tighter ${isReady ? 'text-indigo-400' : 'text-white'}`}>{formatTime(remainingMs)}</p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4 items-center">
                                  <button onClick={async () => {
                                    const updatedTasks = user.tasks.map(t => t.id === task.id ? { ...t, startTime: Date.now(), isPaused: false } : t);
                                    await updateAndSave({ ...user, tasks: updatedTasks });
                                  }} className="px-16 py-8 bg-white text-black rounded-[3rem] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 shadow-2xl transition-all active:scale-95">Iniciar Missão</button>
                                  <button onClick={() => handleAbandonQuest(task.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline hover:text-red-400 transition-colors">Abandonar Contrato</button>
                                </div>
                              )}
                           </div>
                        </div>

                        {task.startTime && !task.done && (
                          <div className="mt-auto pt-12 space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                               <div className="flex gap-4 order-2 md:order-1">
                                  {!isReady && (
                                    <button onClick={async () => {
                                      const updatedTasks = user.tasks.map(t => t.id === task.id ? { ...t, isPaused: !t.isPaused } : t);
                                      await updateAndSave({...user, tasks: updatedTasks});
                                    }} className="px-10 py-5 bg-zinc-900/60 border border-zinc-800 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">{task.isPaused ? 'RETOMAR' : 'PAUSAR'}</button>
                                  )}
                                  <button onClick={() => handleAbandonQuest(task.id)} className="px-10 py-5 bg-zinc-900/60 border border-red-900/20 text-red-600 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest hover:bg-red-950/20 transition-all">ABANDONAR</button>
                               </div>
                               <div className="text-center md:text-right order-1 md:order-2">
                                  {isReady ? (
                                    <button onClick={() => handleQuestComplete(task.id)} className="px-14 py-6 bg-white text-black rounded-[2.5rem] font-black uppercase text-xs tracking-widest hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all animate-bounce">Concluir Jornada</button>
                                  ) : (
                                    <div className="bg-indigo-600/10 px-8 py-5 rounded-[1.8rem] border border-indigo-500/20">
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Caminhando na jornada...</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                            <div className="w-full h-2.5 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden relative">
                               <div className={`h-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.4)] ${isReady ? 'bg-indigo-400' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}

                        <QuestTicker taskId={task.id} isActive={!task.isPaused && !task.done && !!task.startTime} onTick={() => handleTaskTick(task.id)} />
                     </div>
                   );
                 })}

                 {user.tasks.filter(t => questSubTab==='active' ? !t.done : t.done).length === 0 && (
                    <div className="py-32 text-center space-y-8 opacity-20">
                       <p className="text-9xl">🕯️</p>
                       <p className="text-xs font-black uppercase tracking-[0.5em] text-white">Nenhum registro encontrado nestas terras...</p>
                    </div>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
               <div className="bg-zinc-900/40 p-12 rounded-[4rem] border-2 border-zinc-800 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden shadow-3xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px]" />
                  <div className="w-72 h-72 rounded-[4rem] bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl relative">
                     <HeroAvatar appearance={user.appearance} user={user} size={350} className="translate-y-24" />
                  </div>
                  <div className="space-y-8 flex-1 text-center md:text-left">
                     <div className="space-y-2">
                        <h2 className="text-6xl font-rpg text-white tracking-tighter uppercase">{user.nickname}</h2>
                        <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs">O lendário {user.charClass}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950/60 p-5 rounded-3xl border border-zinc-800">
                           <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Nível de Poder</p>
                           <p className="text-3xl font-black text-indigo-500">{user.level}</p>
                        </div>
                        <div className="bg-zinc-950/60 p-5 rounded-3xl border border-zinc-800">
                           <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Total Prestígio</p>
                           <p className="text-2xl font-black text-white">{user.xp.toFixed(0)}</p>
                        </div>
                     </div>
                     <button onClick={() => setIsEditingProfile(true)} className="w-full py-5 bg-zinc-800 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 border-b-4 border-zinc-950 shadow-xl transition-all">Reforgar Aparência</button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'combat' && <CombatTab user={user} onWin={handleCombatWin} onLose={handleCombatLose} onRetreat={async (penalty) => await updateAndSave({...user, hp: Math.max(0, user.hp - penalty)})} />}
          {activeTab === 'skills' && <SkillsManager user={user} onUpgrade={async (tid) => {
            const updatedTalents = user.talents.map(t => (t.id === tid && t.level < t.maxLevel) ? { ...t, level: t.level + 1 } : t);
            await updateAndSave({ ...user, talentPoints: user.talentPoints - 1, talents: updatedTalents });
          }} />}
          {activeTab === 'shop' && <Shop user={user} onPurchase={async (item) => {
            const negoTalent = user.talents.find(t => t.id === 'pro_2')?.level || 0;
            const finalPrice = item.price * (1 - (negoTalent * 0.05));
            if (user.gold < finalPrice) return;
            const updatedUser = { ...user, gold: user.gold - finalPrice };
            const existing = updatedUser.inventory.findIndex(i => i.id === item.id);
            if (existing > -1 && item.type === 'buff') {
              updatedUser.inventory[existing].quantity = (updatedUser.inventory[existing].quantity || 1) + 1;
            } else {
              updatedUser.inventory.push({ ...item, quantity: 1 });
            }
            await updateAndSave(updatedUser);
          }} />}
          {activeTab === 'social' && <SocialTab user={user} onUpdate={(u) => setUser(u)} />}
          {activeTab === 'settings' && <SettingsTab user={user} onEditProfile={()=>setIsEditingProfile(true)} onLogout={()=>{db.logout(); window.location.reload();}} onResetData={()=>{localStorage.clear(); window.location.reload();}} onCheat={async (cmd)=>{
            if(cmd === '/ouro') await updateAndSave({...user, gold: user.gold + 1000});
            if(cmd === '/xp') await updateAndSave({...user, xp: user.xp + 500});
            if(cmd === '/vida') await updateAndSave({...user, hp: user.maxHp});
          }} animationsEnabled={animationsEnabled} setAnimationsEnabled={setAnimationsEnabled} />}
          
          {activeTab === 'inventory' && (
             <div className="max-w-7xl mx-auto space-y-12 pb-32">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6 p-10 bg-zinc-900/20 rounded-[4rem] border border-zinc-800 shadow-3xl">
                   {user.inventory.map(item => (
                      <div key={item.id} className="aspect-square relative rounded-3xl bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-4xl hover:scale-110 hover:border-indigo-500 transition-all cursor-pointer group shadow-lg">
                        <span className="group-hover:animate-bounce">{item.icon}</span>
                        {item.quantity && item.quantity > 1 && <span className="absolute bottom-2 right-2 text-[10px] font-black text-indigo-400 bg-zinc-900 px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                      </div>
                   ))}
                   {Array.from({ length: Math.max(0, 16 - user.inventory.length) }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-3xl bg-zinc-950/20 border-2 border-dashed border-zinc-800/40 opacity-10" />
                   ))}
                </div>
             </div>
          )}
        </main>
      </div>
    </ClickSpark>
  );
};

const QuestTicker: React.FC<{ taskId: string, isActive: boolean, onTick: () => void }> = ({ isActive, onTick }) => {
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => { onTick(); }, 1000);
    return () => clearInterval(interval);
  }, [isActive, onTick]);
  return null;
};

export default App;
