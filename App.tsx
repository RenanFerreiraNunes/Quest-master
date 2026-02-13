
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Task, Rarity, InventoryItem, Difficulty, CharacterClass, Appearance, EquipmentSlot, Skill } from './types';
import { db } from './services/db';
import { geminiService } from './services/gemini';
import { RARITIES, DIFFICULTIES, CLASSES, THEMES, INITIAL_SKILLS, CLASS_STATS, SHOP_ITEMS, CAMPAIGN_CHAPTERS, BASE_INVENTORY_CAPACITY } from './constants';
import StatsBar from './components/StatsBar';
import Shop from './components/Shop';
import HeroAvatar from './components/HeroAvatar';
import ChromaGrid from './components/ChromaGrid';
import ClickSpark from './components/ClickSpark';
import QuestStepper from './components/QuestStepper';
import SkillsManager from './components/SkillsManager';
import CharacterCreator from './components/CharacterCreator';
import CampaignTab from './components/CampaignTab';
import ItemDetailsModal from './components/ItemDetailsModal';
import SocialTab from './components/SocialTab';
import SettingsTab from './components/SettingsTab';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'quests' | 'campaign' | 'shop' | 'inventory' | 'profile' | 'skills' | 'social' | 'settings'>('quests');
  const [questSubTab, setQuestSubTab] = useState<'active' | 'completed' | 'defeats'>('active');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [damageEffect, setDamageEffect] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [taskToAbandon, setTaskToAbandon] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [exhaustionEndTime, setExhaustionEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [lastRecoveryTime, setLastRecoveryTime] = useState(Date.now());
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Filtros de Missão
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');

  const [inventorySearch, setInventorySearch] = useState('');
  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [scrollPos, setScrollPos] = useState(0);

  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

  // Sincronização entre abas
  useEffect(() => {
    const handleSync = () => {
      const sessionEmail = db.getSession();
      if (sessionEmail) {
        const freshData = db.getUser(sessionEmail);
        if (freshData) setUser(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(freshData)) return freshData;
          return prev;
        });
      }
    };
    window.addEventListener('storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setUser(prev => {
        if (!prev) return null;
        let needsUpdate = false;
        let updatedUser = { ...prev };

        if (currentTime - lastRecoveryTime >= 30000) {
          if (updatedUser.hp < updatedUser.maxHp && !updatedUser.isBroken) {
            updatedUser.hp = Math.min(updatedUser.maxHp, updatedUser.hp + 2);
            needsUpdate = true;
          }
          setLastRecoveryTime(currentTime);
        }

        const updatedTasks = (updatedUser.tasks || []).map(t => {
          if (t.startTime && !t.isPaused && !t.done) {
            const targetMs = (t.durationMinutes || 5) * 60 * 1000;
            const tickDifference = currentTime - (t.lastTickTime || t.startTime);
            const newAccumulated = t.accumulatedTimeMs + tickDifference;
            
            if (newAccumulated !== t.accumulatedTimeMs) {
              needsUpdate = true;
              return { 
                ...t, 
                accumulatedTimeMs: Math.min(targetMs, newAccumulated),
                lastTickTime: currentTime 
              };
            }
          }
          return t;
        });

        const isTimeUp = exhaustionEndTime && currentTime >= exhaustionEndTime;
        const isHealed = updatedUser.hp > 10 && updatedUser.isBroken;

        if (isTimeUp || isHealed) {
          updatedUser.isBroken = false;
          if (isTimeUp && updatedUser.hp <= 0) {
            updatedUser.hp = Math.floor(updatedUser.maxHp * 0.2);
          }
          setExhaustionEndTime(null);
          localStorage.removeItem(`exhaustion_${updatedUser.email}`);
          needsUpdate = true;
        }

        if (needsUpdate) {
          updatedUser.tasks = updatedTasks;
          db.saveUser(updatedUser);
          return updatedUser;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.email, exhaustionEndTime, lastRecoveryTime]);

  useEffect(() => {
    const sessionEmail = db.getSession();
    if (sessionEmail) {
      const userData = db.getUser(sessionEmail);
      if (userData) {
        const safeUser = {
          ...userData,
          equipment: userData.equipment || { head: null, body: null, acc1: null, acc2: null, special: null },
          skills: userData.skills || INITIAL_SKILLS,
          inventory: userData.inventory || [],
          equippedSkills: userData.equippedSkills || [],
          tasks: userData.tasks || [],
          friends: userData.friends || [],
          friendRequests: userData.friendRequests || [],
          guildId: userData.guildId || null
        };
        setUser(safeUser);
        fetchAiGreeting(safeUser);
        const storedExhaustion = localStorage.getItem(`exhaustion_${userData.email}`);
        if (storedExhaustion) setExhaustionEndTime(parseInt(storedExhaustion));
      }
    }
  }, []);

  const fetchAiGreeting = async (u: User) => {
    try { const msg = await geminiService.getMotivationalMessage(u.nickname, u.level, (u.tasks || []).filter(t => !t.done).length); setAiMessage(msg); } catch (e) { }
  };

  const updateAndSave = useCallback((updated: User) => {
    const xpNeeded = updated.level * 200;
    if (updated.xp >= xpNeeded) { updated.level += 1; updated.xp -= xpNeeded; updated.maxHp += 10; updated.hp = updated.maxHp; }
    if (updated.hp <= 0 && !updated.isBroken) {
      setDamageEffect(true); setTimeout(() => setDamageEffect(false), 500);
      updated.gold = Math.max(0, updated.gold - Math.floor(updated.gold * 0.1));
      updated.hp = 0; updated.isBroken = true; 
      const end = Date.now() + 60000;
      setExhaustionEndTime(end);
      localStorage.setItem(`exhaustion_${updated.email}`, end.toString());
    } 
    setUser(updated); db.saveUser(updated);
  }, []);

  const handleQuestComplete = (taskId: string, rarity: Rarity, difficulty: Difficulty) => {
    if (!user) return;
    const rarityCfg = RARITIES[rarity] || RARITIES.comum;
    const diffCfg = DIFFICULTIES[difficulty] || DIFFICULTIES.facil;
    const xpGain = rarityCfg.xp * diffCfg.multiplier;
    const goldGain = rarityCfg.gold * diffCfg.multiplier;
    
    const updatedUser = {
      ...user,
      gold: user.gold + goldGain,
      xp: user.xp + xpGain,
      tasks: (user.tasks || []).map(t => t.id === taskId ? { ...t, done: true, failed: false, doneAt: Date.now() } : t)
    };
    if (user.guildId) db.addGuildXp(user.guildId, xpGain);
    updateAndSave(updatedUser);
  };

  const confirmDeleteTask = (taskId: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      tasks: (user.tasks || []).filter(t => t.id !== taskId)
    };
    updateAndSave(updatedUser);
    setTaskToDelete(null);
  };

  const handlePauseToggle = (taskId: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      tasks: (user.tasks || []).map(t => {
        if (t.id === taskId) {
           if (t.isPaused) {
              return { ...t, isPaused: false, lastTickTime: Date.now() };
           } else {
              return { ...t, isPaused: true, lastTickTime: undefined };
           }
        }
        return t;
      })
    };
    updateAndSave(updatedUser);
  };

  const handlePurchase = (item: InventoryItem) => {
    if (!user || user.gold < item.price) return;
    let updated = { ...user };
    updated.gold -= item.price;
    const existingIdx = updated.inventory?.findIndex(i => i.id === item.id) ?? -1;
    if (item.type === 'buff' && existingIdx > -1) {
      const newInv = [...updated.inventory];
      newInv[existingIdx] = { ...newInv[existingIdx], quantity: (newInv[existingIdx].quantity || 1) + 1 };
      updated.inventory = newInv;
    } else {
      updated.inventory = [...(updated.inventory || []), { ...item, quantity: 1 }];
    }
    updateAndSave(updated);
  };

  const handleEquipItem = (item: InventoryItem) => {
    if (!user) return;
    let updated = { ...user };
    const safeEquipment = updated.equipment || { head: null, body: null, acc1: null, acc2: null, special: null };
    if (item.type === 'equipment' && item.slot) {
      const slot = item.slot;
      updated.equipment = { ...safeEquipment, [slot]: safeEquipment[slot] === item.id ? null : item.id };
    } else if (item.type === 'buff') {
      if (item.id === 'potion-0') updated.hp = Math.min(updated.maxHp, updated.hp + 5);
      if (item.id === 'potion-1') updated.hp = Math.min(updated.maxHp, updated.hp + 20);
      const idx = updated.inventory?.findIndex(i => i.id === item.id) ?? -1;
      if (idx > -1) {
        const newInv = [...updated.inventory];
        if (newInv[idx].quantity && newInv[idx].quantity > 1) newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - 1 };
        else newInv.splice(idx, 1);
        updated.inventory = newInv;
      }
    }
    updateAndSave(updated);
    setSelectedInventoryItem(null);
  };

  const handleCheat = (command: string) => {
    if (!user) return;
    let updated = { ...user };
    const cmd = command.trim().toLowerCase();
    if (cmd === '/ouro') updated.gold += 1000;
    else if (cmd === '/xp') updated.xp += 500;
    else if (cmd === '/vida') { updated.hp = updated.maxHp; updated.isBroken = false; setExhaustionEndTime(null); }
    else return;
    updateAndSave(updated);
  };

  const handleCancelTask = (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task) return;
    const rarityConfig = RARITIES[task.rarity] || RARITIES.comum;
    const penalty = rarityConfig.hpCost || 5;
    updateAndSave({
      ...user,
      hp: Math.max(0, user.hp - penalty),
      tasks: (user.tasks || []).map(t => t.id === taskId ? { ...t, done: true, failed: true, doneAt: Date.now(), startTime: null, isPaused: false } : t)
    });
    setTaskToAbandon(null);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTasks = useMemo(() => {
    let list = (user?.tasks || []);
    if (questSubTab === 'active') {
       list = list.filter(t => !t.done);
    } else if (questSubTab === 'completed') {
       list = list.filter(t => t.done && !t.failed);
    } else if (questSubTab === 'defeats') {
       list = list.filter(t => t.done && t.failed);
    }
    
    if (rarityFilter !== 'all') list = list.filter(t => t.rarity === rarityFilter);
    if (diffFilter !== 'all') list = list.filter(t => t.difficulty === diffFilter);
    return list;
  }, [user?.tasks, questSubTab, rarityFilter, diffFilter]);

  const isExhausted = exhaustionEndTime !== null && now < exhaustionEndTime;
  const exhaustionSecondsLeft = isExhausted ? Math.ceil((exhaustionEndTime! - now) / 1000) : 0;

  if (!user && !isCreatingCharacter) return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.05)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-10 rounded-[3.5rem] shadow-3xl text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <h1 className="text-5xl font-rpg mb-12 text-white font-black uppercase tracking-tighter">QUEST<span className="text-red-600">MASTER</span></h1>
        <div className="space-y-6">
          <input type="email" placeholder="Email do Herói" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 text-white text-center outline-none focus:ring-4 ring-red-600/30 font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={() => { if (!email) return; let existing = db.getUser(email); if (!existing) setIsCreatingCharacter(true); else { db.setSession(email); setUser(existing); fetchAiGreeting(existing); } }} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all border-b-4 border-red-800">Entrar no Reino</button>
        </div>
      </div>
    </div>
  );

  if (isCreatingCharacter) return <CharacterCreator onComplete={(data) => {
    const stats = CLASS_STATS[data.charClass] || CLASS_STATS.Guerreiro;
    const newUser: User = { ...data, email, xp: 0, level: 1, gold: 100, hp: stats.hp, maxHp: stats.hp, isBroken: false, avatar: '🛡️', inventoryCapacity: BASE_INVENTORY_CAPACITY, activeTheme: 'theme-default', tasks: [], inventory: [], skills: INITIAL_SKILLS, equippedSkills: [], equipment: { head: null, body: null, acc1: null, acc2: null, special: null }, campaignProgress: 0, friends: [], friendRequests: [], guildId: null };
    db.saveUser(newUser); db.setSession(email); setUser(newUser); setIsCreatingCharacter(false);
  }} />;

  if (isEditingProfile && user) return <CharacterCreator 
    initialData={{ nickname: user.nickname, charClass: user.charClass, appearance: user.appearance }}
    onComplete={(data) => { updateAndSave({ ...user, ...data }); setIsEditingProfile(false); }} 
    onCancel={() => setIsEditingProfile(false)}
  />;

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} transition-all duration-700 overflow-hidden relative`}>
        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full z-10">
          <div className="flex flex-col items-center mb-8 gap-4">
            <div className={`w-28 h-28 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden ${damageEffect || isExhausted ? 'animate-shake' : ''}`}>
              <HeroAvatar appearance={user.appearance} user={user} size={110} />
            </div>
            <div className="text-center">
              <h1 className="font-rpg text-xl font-black">{user.nickname}</h1>
              <div className={`px-3 py-1 mt-1 rounded-full bg-zinc-900 border border-zinc-800 text-[7px] uppercase font-black tracking-widest text-red-600`}>
                Lvl {user.level} {user.charClass}
              </div>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <StatsBar label="Vida" current={user.hp} max={user.maxHp} color="bg-red-600" icon="❤️" />
            <StatsBar label="XP" current={user.xp} max={user.level * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            <div className="bg-zinc-800/30 p-3 rounded-2xl border border-zinc-700/30 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-amber-400">💰 {user.gold} Ouro</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
             <button onClick={()=>setActiveTab('settings')} className={`w-full py-3 rounded-xl border border-zinc-800 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${activeTab==='settings'?'bg-white text-black':'hover:text-white'}`}>⚙️ Ajustes</button>
             <button onClick={()=>{db.logout(); window.location.reload();}} className="w-full py-3 rounded-xl border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-all active:scale-95">Sair</button>
          </div>
        </aside>

        <main onScroll={e => setScrollPos(e.currentTarget.scrollTop)} className="flex-1 overflow-y-auto relative p-6 md:p-10 z-10 scrollbar-hide">
          <ChromaGrid scrollOffset={scrollPos} color={`rgba(220, 38, 38, 0.03)`} />
          
          <nav className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 sticky top-0 z-[100] bg-transparent backdrop-blur-md">
            {[ 
              {id:'quests',l:'Missões',i:'⚔️'}, 
              {id:'campaign',l:'História',i:'🗺️'}, 
              {id:'shop',l:'Bazar',i:'💎'}, 
              {id:'inventory',l:'Mochila',i:'🎒'}, 
              {id:'skills',l:'Talentos',i:'🔥'}, 
              {id:'social',l:'Social',i:'🤝'},
              {id:'profile',l:'Herói',i:'🎭'} 
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-5 py-4 rounded-[1.8rem] text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 flex items-center gap-2 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-xl scale-105':'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                <span>{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'quests' && (
            <div className="max-w-5xl mx-auto space-y-8 pb-32 relative z-[20]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                   <button 
                    onClick={() => setQuestSubTab('active')}
                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${questSubTab === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >
                     Mural
                   </button>
                   <button 
                    onClick={() => setQuestSubTab('completed')}
                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${questSubTab === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >
                     Grimório
                   </button>
                   <button 
                    onClick={() => setQuestSubTab('defeats')}
                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${questSubTab === 'defeats' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >
                     Derrotas
                   </button>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                   <select 
                    value={rarityFilter} 
                    onChange={e => setRarityFilter(e.target.value as any)}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-[8px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all"
                   >
                     <option value="all">Todas Raridades</option>
                     {Object.keys(RARITIES).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                   </select>
                   <select 
                    value={diffFilter} 
                    onChange={e => setDiffFilter(e.target.value as any)}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-[8px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all"
                   >
                     <option value="all">Todas Dificuldades</option>
                     {Object.keys(DIFFICULTIES).map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                   </select>
                </div>
              </div>

              {isExhausted ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-12 animate-in fade-in">
                   <div className="text-9xl animate-bounce drop-shadow-[0_0_60px_rgba(239,68,68,0.7)]">💀</div>
                   <div className="text-center space-y-4">
                     <h2 className="text-8xl font-rpg text-red-600 font-black uppercase tracking-tighter">EXAUSTO</h2>
                     <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-sm">Ressurgindo em {exhaustionSecondsLeft}s</p>
                   </div>
                </div>
              ) : (
                <>
                  {questSubTab === 'active' && (
                    <button onClick={()=>setShowQuestCreator(true)} className="w-full bg-zinc-900/30 border-4 border-dashed border-zinc-800 p-8 rounded-[3rem] flex items-center justify-center gap-6 hover:border-indigo-600/50 hover:bg-indigo-500/5 transition-all group active:scale-[0.98]">
                      <span className="text-3xl group-hover:scale-125 transition-transform">📜</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-indigo-400">Firmar Novo Contrato</span>
                    </button>
                  )}

                  {showQuestCreator && <QuestStepper onComplete={data => { updateAndSave({...user!, tasks: [{...data, durationMinutes: data.duration, id: Math.random().toString(36).substr(2,9), startTime: null, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now()}, ...(user?.tasks || [])]}); setShowQuestCreator(false); }} onCancel={()=>setShowQuestCreator(false)} />}
                  
                  <div className="grid grid-cols-1 gap-8">
                    {filteredTasks.length === 0 ? (
                      <div className="py-32 text-center space-y-6 opacity-30">
                        <p className="text-6xl">🕯️</p>
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado nestas terras...</p>
                      </div>
                    ) : (
                      filteredTasks.map(task => {
                        const isRunning = task.startTime !== null;
                        const targetMs = (task.durationMinutes || 5) * 60 * 1000;
                        const progress = Math.min(100, (task.accumulatedTimeMs / targetMs) * 100);
                        const remainingMs = Math.max(0, targetMs - task.accumulatedTimeMs);
                        const isReady = progress >= 100;
                        const rarityCfg = RARITIES[task.rarity] || RARITIES.comum;
                        const diffCfg = DIFFICULTIES[task.difficulty] || DIFFICULTIES.facil;

                        return (
                          <div key={task.id} className={`p-8 md:p-12 rounded-[3.5rem] border-2 shadow-2xl relative overflow-hidden flex flex-col gap-8 transition-all duration-700 animate-in slide-in-from-bottom-4 group ${rarityCfg.bg} ${rarityCfg.shadow} ${isRunning && !isReady ? 'ring-2 ring-white/10' : ''} ${task.done ? 'opacity-70' : 'hover:scale-[1.01] hover:brightness-110'}`} style={{ borderColor: rarityCfg.color.split(' ')[1].replace('border-', '#').replace('700', '444') }}>
                             
                             {/* Botão de Excluir (X) - SÓ APARECE SE NÃO TIVER COMEÇADO */}
                             {!isRunning && !task.done && (
                               <div className="absolute top-6 right-8">
                                  <button 
                                    onClick={() => setTaskToDelete(task.id)}
                                    className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-lg z-20"
                                    title="Excluir Missão"
                                  >
                                    ✕
                                  </button>
                               </div>
                             )}

                             <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="space-y-4">
                                   <div className="flex items-center gap-4">
                                      <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${rarityCfg.color}`}>{task.rarity}</span>
                                      <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border border-zinc-800 text-zinc-500`}>{task.difficulty}</span>
                                   </div>
                                   <h3 className={`text-5xl font-rpg font-black tracking-tighter uppercase leading-tight drop-shadow-md ${task.failed ? 'text-red-900 line-through' : 'text-white'}`}>{task.title}</h3>
                                   <div className="flex gap-6">
                                      <span className="text-amber-500 font-black text-sm flex items-center gap-2 bg-zinc-950/40 px-4 py-1.5 rounded-xl border border-white/5">💰 {Math.floor(rarityCfg.gold * diffCfg.multiplier)}G</span>
                                      <span className="text-indigo-400 font-black text-sm flex items-center gap-2 bg-zinc-950/40 px-4 py-1.5 rounded-xl border border-white/5">✨ {Math.floor(rarityCfg.xp * diffCfg.multiplier)}XP</span>
                                   </div>
                                </div>
                                {isRunning && !isReady && !task.done && (
                                  <div className={`text-right bg-zinc-950/60 p-6 rounded-3xl border border-white/5 shadow-inner transition-all ${task.isPaused ? 'opacity-40 scale-95 grayscale' : 'opacity-100'}`}>
                                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Tempo Restante</span>
                                     <span className="text-6xl font-black font-mono text-white tracking-tighter tabular-nums">{formatTime(remainingMs)}</span>
                                  </div>
                                )}
                                {task.done && (
                                  <div className="text-right">
                                     <span className={`text-[9px] font-black uppercase tracking-[0.3em] block mb-2 animate-pulse ${task.failed ? 'text-red-500' : 'text-emerald-500'}`}>
                                       {task.failed ? 'Jornada Fracassada' : 'Jornada Consumada'}
                                     </span>
                                     <span className="text-xs text-zinc-500 font-bold italic">
                                       {task.failed ? 'Abandonada em' : 'Finalizada em'} {new Date(task.doneAt!).toLocaleDateString()}
                                     </span>
                                  </div>
                                )}
                             </div>

                             <div className="flex justify-end gap-4 items-center pt-4 border-t border-white/5">
                                {!task.done && (
                                  <>
                                    {isRunning && !isReady && (
                                      <>
                                        {/* Botão de Pausa */}
                                        <button 
                                          onClick={() => handlePauseToggle(task.id)}
                                          className={`px-8 py-4 border rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 ${task.isPaused ? 'bg-amber-600 border-amber-500 text-white' : 'border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                        >
                                          {task.isPaused ? 'Retomar' : 'Pausar'}
                                        </button>
                                        <button onClick={()=>setTaskToAbandon(task.id)} className="px-8 py-4 border border-red-900/40 text-red-600/60 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-red-950/20 hover:text-red-500 transition-all active:scale-95">Abandonar</button>
                                      </>
                                    )}
                                    
                                    {!isRunning ? (
                                      <button onClick={()=>updateAndSave({...user!, tasks: user!.tasks.map(t=>t.id===task.id?{...t, startTime:Date.now(), lastTickTime: Date.now()}:t)})} className="px-12 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:brightness-125 hover:scale-105 transition-all shadow-xl active:scale-90">Iniciar Missão</button>
                                    ) : isReady ? (
                                      <button onClick={()=>handleQuestComplete(task.id, task.rarity, task.difficulty)} className="px-14 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest animate-pulse shadow-2xl hover:bg-indigo-500 active:scale-90 transition-all">Reivindicar Tesouros</button>
                                    ) : (
                                      <div className={`px-12 py-5 bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 rounded-[2rem] font-black uppercase text-[9px] tracking-widest italic ${task.isPaused ? 'opacity-40 animate-none' : 'animate-pulse'}`}>
                                        {task.isPaused ? 'Foco Interrompido' : 'Caminhando na Jornada...'}
                                      </div>
                                    )}
                                  </>
                                )}
                                {task.done && (
                                   <button 
                                    onClick={() => setTaskToDelete(task.id)}
                                    className="px-8 py-4 bg-zinc-800/20 text-zinc-500 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:text-red-500 hover:bg-red-950/20 transition-all active:scale-95 border border-white/5"
                                   >
                                     Expurgar Registro
                                   </button>
                                )}
                             </div>

                             {isRunning && !task.done && (
                               <div className="w-full h-3 bg-zinc-950/80 rounded-full border border-white/5 overflow-hidden mt-2">
                                  <div className={`h-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)] ${task.isPaused ? 'bg-zinc-700 animate-none' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                               </div>
                             )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modais de Confirmação customizados para uma UX Superior */}
          {taskToDelete && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="max-w-md w-full bg-zinc-900 border-2 border-red-600/50 rounded-[4rem] p-16 text-center shadow-3xl animate-in zoom-in-95">
                  <div className="text-6xl mb-8">🗑️</div>
                  <h3 className="text-4xl font-rpg text-white font-black uppercase mb-4">Excluir tarefa?</h3>
                  <p className="text-zinc-500 mb-12 text-sm font-medium">Este registro será removido permanentemente dos arquivos do reino.</p>
                  <div className="flex flex-col gap-4">
                     <button onClick={()=>confirmDeleteTask(taskToDelete)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl active:scale-95">Sim, Excluir</button>
                     <button onClick={()=>setTaskToDelete(null)} className="w-full py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95">Manter Registro</button>
                  </div>
               </div>
            </div>
          )}

          {taskToAbandon && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="max-w-md w-full bg-zinc-900 border-2 border-red-600/50 rounded-[4rem] p-16 text-center shadow-3xl animate-in zoom-in-95">
                  <div className="text-6xl mb-8">🩸</div>
                  <h3 className="text-4xl font-rpg text-red-600 font-black uppercase mb-4">Abandonar?</h3>
                  <p className="text-zinc-500 mb-2 text-xs font-black uppercase tracking-widest">Penalidade de Vida:</p>
                  <p className="text-red-500 text-6xl font-black mb-12">-{RARITIES[user?.tasks?.find(t=>t.id===taskToAbandon)?.rarity || 'comum']?.hpCost || 5} HP</p>
                  <div className="flex flex-col gap-4">
                     <button onClick={()=>handleCancelTask(taskToAbandon)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl active:scale-95">Aceitar Derrota</button>
                     <button onClick={()=>setTaskToAbandon(null)} className="w-full py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95">Continuar Tentando</button>
                  </div>
               </div>
            </div>
          )}

          {/* Outras Abas omitidas para brevidade, mantendo funcionalidade original */}
          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative z-20 px-4">
               <header className="flex justify-between items-end gap-6">
                  <h2 className="text-6xl font-rpg text-white uppercase tracking-tighter">SUA <span className="text-indigo-400">MOCHILA</span></h2>
                  <div className="relative w-full md:w-80 group">
                    <input type="text" placeholder="Filtrar tesouros..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl px-6 py-4 text-[10px] font-bold outline-none focus:border-indigo-500 transition-all" />
                  </div>
               </header>
               {/* Grid de Inventário permanece o mesmo... */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-800/60 rounded-[4rem] p-12 flex flex-col items-center justify-between shadow-3xl">
                     <div className="relative w-full aspect-square max-w-sm flex items-center justify-center">
                        <div className="w-48 h-48 bg-zinc-950/60 rounded-full border border-zinc-800/40 shadow-inner flex items-center justify-center relative z-10 overflow-hidden">
                           <HeroAvatar appearance={user!.appearance} user={user!} size={220} className="translate-y-4" />
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4"><EquipSlot slot="head" user={user!} onSelect={setSelectedInventoryItem} /></div>
                        <div className="absolute bottom-0 left-1/4 -translate-x-1/2 translate-y-4"><EquipSlot slot="body" user={user!} onSelect={setSelectedInventoryItem} /></div>
                        <div className="absolute bottom-0 right-1/4 translate-x-1/2 translate-y-4"><EquipSlot slot="special" user={user!} onSelect={setSelectedInventoryItem} /></div>
                        <div className="absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2"><EquipSlot slot="acc1" user={user!} onSelect={setSelectedInventoryItem} /></div>
                        <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2"><EquipSlot slot="acc2" user={user!} onSelect={setSelectedInventoryItem} /></div>
                     </div>
                     <button className="mt-12 px-12 py-4 bg-zinc-800/40 border border-zinc-700/30 rounded-full text-[8px] font-black uppercase text-zinc-500 tracking-[0.4em] active:scale-95 transition-all">Armaria Ativa</button>
                  </div>
                  <div className="lg:col-span-7 bg-zinc-900/30 border border-zinc-800/60 rounded-[4rem] p-12 shadow-3xl">
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 h-[500px] overflow-y-auto scrollbar-hide pr-2">
                        {(user?.inventory || []).filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase())).map((item, idx) => (
                           <InventorySlot key={`${item.id}-${idx}`} item={item} isEquipped={user?.equipment ? Object.values(user.equipment).includes(item.id) : false} onClick={() => setSelectedInventoryItem(item)} />
                        ))}
                        {Array.from({ length: Math.max(0, (user?.inventoryCapacity || BASE_INVENTORY_CAPACITY) - (user?.inventory?.length || 0)) }).map((_, i) => (
                           <div key={`empty-${i}`} className="aspect-square rounded-[1.8rem] border-2 border-zinc-900/30 bg-zinc-950/20 border-dashed opacity-10" />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500 relative z-20 px-4">
               <div className="bg-zinc-950/40 backdrop-blur-xl border-2 border-zinc-900 rounded-[5rem] p-12 overflow-hidden shadow-3xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                     <div className="lg:col-span-4 flex flex-col items-center bg-zinc-900/20 border border-zinc-800 rounded-[4rem] p-10 gap-10">
                        <div className="w-full aspect-square bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner"><HeroAvatar appearance={user!.appearance} user={user!} size={280} /></div>
                        <div className="text-center space-y-4">
                           <h2 className="text-6xl font-rpg font-black text-white tracking-tighter uppercase">{user!.nickname}</h2>
                           <div className="flex justify-center"><span className="px-6 py-2 bg-red-950/40 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-900/50">LVL {user!.level} {user!.charClass}</span></div>
                        </div>
                        <button onClick={()=>setIsEditingProfile(true)} className="w-full py-6 bg-white text-black rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-zinc-200 active:scale-95 transition-all">Alterar Traços Visuais</button>
                     </div>
                     <div className="lg:col-span-8 flex flex-col gap-10">
                        <div className="bg-zinc-900/20 border border-zinc-800 rounded-[4rem] p-12 flex-1">
                           <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center flex items-center gap-6 justify-center mb-12"><span className="w-12 h-px bg-zinc-800"></span> Registro de Atributos <span className="w-12 h-px bg-zinc-800"></span></h4>
                           <div className="grid grid-cols-2 gap-8">
                              <div className="p-10 bg-zinc-950/60 rounded-3xl border border-zinc-800 text-center"><span className="text-[10px] font-black text-red-500 uppercase">Vitalidade</span><p className="text-6xl font-black text-white">{user!.hp} / {user!.maxHp}</p></div>
                              <div className="p-10 bg-zinc-950/60 rounded-3xl border border-zinc-800 text-center"><span className="text-[10px] font-black text-amber-500 uppercase">Tesouro</span><p className="text-6xl font-black text-amber-500">💰 {user!.gold}</p></div>
                              <div className="p-10 bg-zinc-950/60 rounded-3xl border border-zinc-800 text-center"><span className="text-[10px] font-black text-indigo-400 uppercase">Mochila</span><p className="text-6xl font-black text-indigo-400">{(user?.inventory || []).length} / {user?.inventoryCapacity || BASE_INVENTORY_CAPACITY}</p></div>
                              <div className="p-10 bg-zinc-950/60 rounded-3xl border border-zinc-800 text-center"><span className="text-[10px] font-black text-emerald-400 uppercase">Vitórias</span><p className="text-6xl font-black text-emerald-400">{(user?.tasks || []).filter(t=>t.done && !t.failed).length} OK</p></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'social' && <SocialTab user={user!} onUpdate={(u) => setUser(u)} />}
          {activeTab === 'campaign' && <CampaignTab user={user!} onClaim={(id) => { const mission = CAMPAIGN_CHAPTERS.find(m => m.id === id); if (mission) updateAndSave({...user!, xp: user!.xp + mission.xpReward, gold: user!.gold + mission.goldReward, campaignProgress: user!.campaignProgress + 1}); }} />}
          {activeTab === 'shop' && <Shop user={user!} onPurchase={handlePurchase} />}
          {activeTab === 'skills' && <SkillsManager user={user!} onUpgrade={(id) => { const skill = user!.skills?.find(s => s.id === id); if (!skill) return; const cost = Math.floor(skill.xpCostBase * Math.pow(1.5, skill.level)); if (user!.xp >= cost) updateAndSave({ ...user!, xp: user!.xp - cost, skills: user!.skills.map(s => s.id === id ? { ...s, level: s.level + 1 } : s) }); }} onEquip={(id) => { updateAndSave({ ...user!, equippedSkills: user!.equippedSkills?.includes(id) ? user!.equippedSkills.filter(s => s !== id) : [...(user!.equippedSkills || []), id] }); }} onUseActive={(id) => { if (id === 'meditation') updateAndSave({ ...user!, hp: Math.min(user!.maxHp, user!.hp + 15) }); }} />}
          
          {activeTab === 'settings' && (
            <SettingsTab user={user!} onEditProfile={() => setIsEditingProfile(true)} onLogout={() => { db.logout(); window.location.reload(); }} onResetData={() => { localStorage.clear(); window.location.reload(); }} onCheat={handleCheat} animationsEnabled={animationsEnabled} setAnimationsEnabled={setAnimationsEnabled} />
          )}

          {selectedInventoryItem && (
            <ItemDetailsModal item={selectedInventoryItem} user={user!} onClose={() => setSelectedInventoryItem(null)} onAction={handleEquipItem} actionLabel={user?.equipment && Object.values(user.equipment).includes(selectedInventoryItem.id) ? 'Remover' : 'Equipar'} />
          )}
        </main>
      </div>
    </ClickSpark>
  );
};

const InventorySlot: React.FC<{ item: InventoryItem, isEquipped: boolean, onClick: () => void }> = ({ item, isEquipped, onClick }) => {
  const rarityCfg = RARITIES[item.rarity] || RARITIES.comum;
  return (
    <div onClick={onClick} className={`aspect-square relative rounded-[1.8rem] border-2 cursor-pointer transition-all hover:scale-110 active:scale-90 flex flex-col items-center justify-center gap-1 group overflow-hidden ${rarityCfg.bg} ${isEquipped ? 'ring-2 ring-indigo-500/50 border-indigo-500 bg-indigo-500/10 scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'}`}>
      <span className="text-3xl drop-shadow-lg group-hover:scale-125 transition-transform">{item.icon}</span>
      {item.quantity && item.quantity > 1 && <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/90 rounded-md border border-zinc-700 text-[8px] font-black text-white">x{item.quantity}</div>}
    </div>
  );
};

const EquipSlot: React.FC<{ slot: EquipmentSlot, user: User, onSelect: (item: InventoryItem) => void }> = ({ slot, user, onSelect }) => {
  const itemId = user.equipment?.[slot];
  const item = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null;
  const icons: Record<EquipmentSlot, string> = { head: '👤', body: '👕', acc1: '💍', acc2: '💍', special: '✨' };
  const labels: Record<EquipmentSlot, string> = { head: 'CABEÇA', body: 'CORPO', acc1: 'ACES. 1', acc2: 'ACES. 2', special: 'ESPECIAL' };
  return (
    <div className="flex flex-col items-center gap-2">
      <div onClick={() => item && onSelect(item)} className={`w-16 h-16 rounded-[1.6rem] border-2 flex flex-col items-center justify-center transition-all active:scale-90 relative cursor-pointer shadow-xl ${item?.rarity === 'lendario' ? 'animate-equip-legendary border-amber-500 scale-110 shadow-[0_0_25px_rgba(245,158,11,0.4)]' : item ? 'border-indigo-500/60 bg-indigo-900/10 scale-110' : 'border-zinc-800 bg-zinc-950/40 opacity-30 border-dashed hover:opacity-100 hover:scale-105 hover:border-indigo-500/50'}`}>
        <span className="text-3xl drop-shadow-2xl">{item ? item.icon : icons[slot]}</span>
      </div>
      <span className="text-[7px] font-black uppercase text-zinc-600 tracking-widest">{labels[slot]}</span>
    </div>
  );
};

export default App;
