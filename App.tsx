
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Task, Rarity, InventoryItem, Difficulty, CharacterClass, Appearance, EquipmentSlot, Skill, ItemType } from './types';
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

  const notifiedTasks = useRef<Set<string>>(new Set());

  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');

  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<ItemType | 'all'>('all');

  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [scrollPos, setScrollPos] = useState(0);

  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendPushNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }
  };

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
              
              const progressPct = (newAccumulated / targetMs) * 100;

              if (progressPct >= 80 && progressPct < 100 && !notifiedTasks.current.has(`${t.id}_80`)) {
                sendPushNotification("Quase lá, Herói!", `Sua missão "${t.title}" está 80% concluída. Mantenha o foco!`);
                notifiedTasks.current.add(`${t.id}_80`);
              }
              
              if (progressPct >= 100 && !notifiedTasks.current.has(`${t.id}_100`)) {
                sendPushNotification("Missão Cumprida!", `O contrato "${t.title}" foi finalizado. Reivindique sua recompensa!`);
                notifiedTasks.current.add(`${t.id}_100`);
              }

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
  }, [exhaustionEndTime, lastRecoveryTime]);

  useEffect(() => {
    const sessionEmail = db.getSession();
    if (sessionEmail) {
      const userData = db.getUser(sessionEmail);
      if (userData) {
        setUser(userData);
        fetchAiGreeting(userData);
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
    
    notifiedTasks.current.delete(`${taskId}_80`);
    notifiedTasks.current.delete(`${taskId}_100`);
  };

  const confirmDeleteTask = (taskId: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = {
        ...prev,
        tasks: (prev.tasks || []).filter(t => t.id !== taskId)
      };
      db.saveUser(updatedUser);
      return updatedUser;
    });
    setTaskToDelete(null);
    notifiedTasks.current.delete(`${taskId}_80`);
    notifiedTasks.current.delete(`${taskId}_100`);
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
    } else if (item.type === 'theme' && item.themeClass) {
      updated.activeTheme = item.themeClass;
    } else if (item.type === 'skin') {
      if (item.id === 'skin-hood') {
        const isCurrentlyHood = updated.appearance.hairStyle === 'hood';
        updated.appearance = {
          ...updated.appearance,
          hairStyle: isCurrentlyHood ? 'short' : 'hood'
        };
      }
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
    notifiedTasks.current.delete(`${taskId}_80`);
    notifiedTasks.current.delete(`${taskId}_100`);
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

  const filteredInventory = useMemo(() => {
    let list = (user?.inventory || []);
    if (inventoryTypeFilter !== 'all') {
      list = list.filter(i => i.type === inventoryTypeFilter);
    }
    if (inventorySearch) {
      list = list.filter(i => 
        i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        i.description.toLowerCase().includes(inventorySearch.toLowerCase())
      );
    }
    return list;
  }, [user?.inventory, inventoryTypeFilter, inventorySearch]);

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
    const newUser: User = { 
      ...data, 
      email, 
      xp: 0, 
      level: 1, 
      gold: 100, 
      hp: stats.hp, 
      maxHp: stats.hp, 
      isBroken: false, 
      inventoryCapacity: BASE_INVENTORY_CAPACITY, 
      activeTheme: 'theme-default', 
      tasks: [], 
      inventory: [], 
      skills: INITIAL_SKILLS, 
      equippedSkills: [], 
      equipment: { head: null, body: null, acc1: null, acc2: null, special: null }, 
      campaignProgress: 0, 
      friends: [], 
      friendRequests: [], 
      guildId: null 
    };
    db.saveUser(newUser); 
    db.setSession(email); 
    setUser(newUser); 
    setIsCreatingCharacter(false);
  }} />;

  if (isEditingProfile && user) return <CharacterCreator 
    initialData={{ nickname: user.nickname, charClass: user.charClass, appearance: user.appearance, avatar: user.avatar }}
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
                             
                             {!isRunning && !task.done && (
                               <div className="absolute top-6 right-8">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }}
                                    className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-lg z-20 cursor-pointer"
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
                                   <h3 className={`text-5xl font-rpg font-black tracking-tighter uppercase leading-tight drop-shadow-md ${task.failed ? 'text-red-900 line-through opacity-40' : 'text-white'}`}>{task.title}</h3>
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
                             </div>

                             <div className="flex justify-end gap-4 items-center pt-4 border-t border-white/5">
                                {!task.done && (
                                  <>
                                    {isRunning && !isReady && (
                                      <>
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

          {activeTab === 'inventory' && (
            <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative z-20 px-4 md:px-8">
               <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
                  <div className="space-y-4">
                    <h2 className="text-7xl font-rpg text-white uppercase tracking-tighter leading-none">SUA <span className="text-indigo-400">MOCHILA</span></h2>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                         <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                         <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{user?.inventory.length} / {user?.inventoryCapacity} Capacidade</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="flex p-1.5 bg-zinc-900/60 rounded-[1.8rem] border border-zinc-800 w-full md:w-auto">
                       {[
                         {id:'all', label:'Tudo', icon: '💎'},
                         {id:'equipment', label:'Equipos', icon: '⚔️'},
                         {id:'buff', label:'Itens', icon: '🧪'},
                         {id:'theme', label:'Temas', icon: '🔮'},
                         {id:'skin', label:'Skins', icon: '🎭'}
                       ].map(cat => (
                         <button 
                          key={cat.id} 
                          onClick={() => setInventoryTypeFilter(cat.id as any)}
                          className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${inventoryTypeFilter === cat.id ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
                         >
                           <span className="hidden sm:inline">{cat.icon}</span> {cat.label}
                         </button>
                       ))}
                    </div>
                    <div className="relative w-full md:w-72 group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors">🔍</div>
                      <input 
                        type="text" 
                        placeholder="Buscar no grimório..." 
                        value={inventorySearch} 
                        onChange={e=>setInventorySearch(e.target.value)} 
                        className="w-full bg-zinc-900/40 border border-zinc-800 rounded-3xl pl-12 pr-6 py-4 text-[10px] font-black text-white outline-none focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 transition-all placeholder:text-zinc-700" 
                      />
                    </div>
                  </div>
               </header>

               <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                  <div className="xl:col-span-5 bg-zinc-900/20 border border-zinc-800/40 rounded-[4.5rem] p-10 md:p-14 flex flex-col items-center justify-center shadow-3xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                     
                     <div className="relative w-full aspect-square max-w-md flex items-center justify-center">
                        <div className="w-56 h-56 md:w-64 md:h-64 bg-zinc-950/40 rounded-full border-2 border-zinc-800/30 shadow-inner flex items-center justify-center relative z-10 overflow-hidden backdrop-blur-sm">
                           <HeroAvatar appearance={user!.appearance} user={user!} size={320} className="translate-y-10" />
                        </div>

                        {/* Posicionamento ajustado para evitar sobreposições e manter harmonia */}
                        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 z-20 scale-100">
                          <EquipSlot slot="head" user={user!} onSelect={setSelectedInventoryItem} />
                        </div>
                        <div className="absolute top-[40%] left-[-10%] z-20 scale-100">
                          <EquipSlot slot="acc1" user={user!} onSelect={setSelectedInventoryItem} />
                        </div>
                        <div className="absolute top-[40%] right-[-10%] z-20 scale-100">
                          <EquipSlot slot="acc2" user={user!} onSelect={setSelectedInventoryItem} />
                        </div>
                        <div className="absolute bottom-[-10%] left-[25%] -translate-x-1/2 z-20 scale-100">
                          <EquipSlot slot="body" user={user!} onSelect={setSelectedInventoryItem} />
                        </div>
                        <div className="absolute bottom-[-10%] right-[25%] translate-x-1/2 z-20 scale-100">
                          <EquipSlot slot="special" user={user!} onSelect={setSelectedInventoryItem} />
                        </div>

                        <svg className="absolute inset-[-10%] w-[120%] h-[120%] pointer-events-none opacity-10" viewBox="0 0 100 100">
                           <line x1="50" y1="10" x2="50" y2="30" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />
                           <line x1="10" y1="50" x2="30" y2="50" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />
                           <line x1="90" y1="50" x2="70" y2="50" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />
                        </svg>
                     </div>

                     <div className="mt-20 text-center space-y-2 relative z-10">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.5em]">Arsenal Ativo</p>
                        <p className="text-zinc-600 text-[8px] font-bold italic">Toque em um slot para gerenciar a peça</p>
                     </div>
                  </div>

                  <div className="xl:col-span-7 space-y-8">
                     <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-[4.5rem] p-8 md:p-12 shadow-3xl min-h-[600px] flex flex-col">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5 pr-2 overflow-y-auto max-h-[650px] scrollbar-hide pb-6">
                           {filteredInventory.map((item, idx) => (
                              <InventorySlot 
                                key={`${item.id}-${idx}`} 
                                item={item} 
                                isEquipped={
                                  item.type === 'equipment' 
                                    ? (user?.equipment ? Object.values(user.equipment).includes(item.id) : false)
                                    : (item.type === 'theme' ? user?.activeTheme === item.themeClass : false)
                                } 
                                onClick={() => setSelectedInventoryItem(item)} 
                              />
                           ))}
                           {Array.from({ length: Math.max(0, 15 - filteredInventory.length) }).map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square rounded-[2rem] border-2 border-zinc-900/30 bg-zinc-950/10 border-dashed opacity-10" />
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative z-20 px-4">
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

          {taskToDelete && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="max-w-md w-full bg-zinc-900 border-2 border-red-600/50 rounded-[4rem] p-16 text-center shadow-[0_0_100px_rgba(220,38,38,0.3)] animate-in zoom-in-95">
                  <div className="text-7xl mb-8">🗑️</div>
                  <h3 className="text-4xl font-rpg text-white font-black uppercase mb-4 tracking-tighter">Apagar Lenda?</h3>
                  <p className="text-zinc-500 mb-12 text-sm font-medium">Este registro será removido permanentemente dos arquivos do reino.</p>
                  <div className="flex flex-col gap-4">
                     <button onClick={() => confirmDeleteTask(taskToDelete)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl active:scale-95 border-b-4 border-red-800">Sim, Expurgar</button>
                     <button onClick={() => setTaskToDelete(null)} className="w-full py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95">Manter Registro</button>
                  </div>
               </div>
            </div>
          )}

          {taskToAbandon && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="max-w-md w-full bg-zinc-900 border-2 border-red-600/50 rounded-[4rem] p-16 text-center shadow-[0_0_100px_rgba(220,38,38,0.3)] animate-in zoom-in-95">
                  <div className="text-7xl mb-8">🩸</div>
                  <h3 className="text-4xl font-rpg text-red-600 font-black uppercase mb-4 tracking-tighter">Abandonar?</h3>
                  <p className="text-red-500 text-6xl font-black mb-12">-{RARITIES[user?.tasks?.find(t=>t.id===taskToAbandon)?.rarity || 'comum']?.hpCost || 5} HP</p>
                  <div className="flex flex-col gap-4">
                     <button onClick={()=>handleCancelTask(taskToAbandon)} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl active:scale-95 border-b-4 border-red-800">Aceitar Derrota</button>
                     <button onClick={()=>setTaskToAbandon(null)} className="w-full py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95">Continuar Jornada</button>
                  </div>
               </div>
            </div>
          )}

          {selectedInventoryItem && (
            <ItemDetailsModal 
              item={selectedInventoryItem} 
              user={user!} 
              onClose={() => setSelectedInventoryItem(null)} 
              onAction={handleEquipItem} 
              actionLabel={
                (selectedInventoryItem.type === 'equipment' && user?.equipment && Object.values(user.equipment).includes(selectedInventoryItem.id)) ||
                (selectedInventoryItem.type === 'theme' && user?.activeTheme === selectedInventoryItem.themeClass)
                ? 'Remover / Desativar' 
                : selectedInventoryItem.type === 'equipment' ? 'Equipar no Herói' : selectedInventoryItem.type === 'theme' ? 'Aplicar Tema' : selectedInventoryItem.type === 'skin' ? 'Aplicar Estilo' : 'Usar Item'
              } 
            />
          )}
        </main>
      </div>
    </ClickSpark>
  );
};

const InventorySlot: React.FC<{ item: InventoryItem, isEquipped: boolean, onClick: () => void }> = ({ item, isEquipped, onClick }) => {
  const rarityCfg = RARITIES[item.rarity] || RARITIES.comum;
  
  return (
    <div 
      onClick={onClick} 
      className={`group aspect-square relative rounded-[2rem] border-2 cursor-pointer transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center gap-1 overflow-hidden backdrop-blur-sm
        ${isEquipped 
          ? 'ring-2 ring-indigo-500/50 border-indigo-500 bg-indigo-500/10 scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
          : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-600'
        }
      `}
    >
      <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 ${rarityCfg.bg}`} />
      <span className={`text-4xl drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 relative z-10 ${item.rarity === 'lendario' ? 'animate-pulse' : ''}`}>
        {item.icon}
      </span>
      {item.quantity && item.quantity > 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-zinc-950/80 border border-zinc-700/50 rounded-lg text-[9px] font-black text-indigo-300 backdrop-blur-md z-20">
          x{item.quantity}
        </div>
      )}
      {item.rarity === 'lendario' && (
        <div className="absolute inset-0 border-2 border-amber-500/30 animate-pulse rounded-[2rem] pointer-events-none" />
      )}
      <div className="absolute top-2 left-2 text-[8px] opacity-30 group-hover:opacity-100 transition-opacity">
        {item.type === 'equipment' ? '⚔️' : item.type === 'buff' ? '🧪' : item.type === 'theme' ? '🔮' : '🎭'}
      </div>
    </div>
  );
};

const EquipSlot: React.FC<{ slot: EquipmentSlot, user: User, onSelect: (item: InventoryItem) => void }> = ({ slot, user, onSelect }) => {
  const itemId = user.equipment?.[slot];
  const item = itemId ? (user.inventory.find(i => i.id === itemId) || SHOP_ITEMS.find(i => i.id === itemId)) : null;
  
  const icons: Record<EquipmentSlot, string> = { head: '👤', body: '👕', acc1: '💍', acc2: '💍', special: '✨' };
  const labels: Record<EquipmentSlot, string> = { head: 'CABEÇA', body: 'CORPO', acc1: 'ACESSÓRIO', acc2: 'ACESSÓRIO', special: 'RELÍQUIA' };
  
  const isLegendary = item?.rarity === 'lendario';
  const rarityCfg = item ? RARITIES[item.rarity] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        onClick={() => item && onSelect(item as InventoryItem)} 
        className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all active:scale-90 relative cursor-pointer shadow-3xl backdrop-blur-md group
          ${isLegendary 
            ? 'animate-equip-legendary border-amber-500 scale-110' 
            : item 
              ? `border-indigo-500/60 bg-indigo-900/10 scale-110 shadow-[0_0_25px_rgba(99,102,241,0.3)]` 
              : 'border-zinc-800/50 bg-zinc-950/30 opacity-40 hover:opacity-100 hover:scale-110 hover:border-indigo-500/40'
          }
        `}
      >
        {rarityCfg && (
          <div className={`absolute inset-0 opacity-20 rounded-[1.8rem] ${rarityCfg.bg}`} />
        )}
        <span className={`text-3xl md:text-4xl drop-shadow-2xl relative z-10 transition-transform group-hover:scale-110`}>
          {item ? item.icon : icons[slot]}
        </span>
        {item && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-zinc-950 z-20 shadow-lg" />
        )}
      </div>
      <div className="flex flex-col items-center space-y-1">
        <span className={`text-[7px] font-black uppercase tracking-[0.4em] ${item ? 'text-indigo-400' : 'text-zinc-600'}`}>
          {labels[slot]}
        </span>
        {item && <span className="text-[6px] font-bold text-zinc-500 uppercase truncate max-w-[60px] bg-zinc-900/50 px-2 py-0.5 rounded-full">{item.name}</span>}
      </div>
    </div>
  );
};

export default App;
