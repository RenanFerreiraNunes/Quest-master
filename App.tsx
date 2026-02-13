
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'quests' | 'campaign' | 'shop' | 'inventory' | 'profile' | 'skills'>('quests');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [damageEffect, setDamageEffect] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [taskToAbandon, setTaskToAbandon] = useState<string | null>(null);
  const [exhaustionEndTime, setExhaustionEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [lastRecoveryTime, setLastRecoveryTime] = useState(Date.now());

  const [inventorySearch, setInventorySearch] = useState('');
  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [scrollPos, setScrollPos] = useState(0);

  const mainRef = useRef<HTMLElement>(null);
  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

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

        const updatedTasks = updatedUser.tasks.map(t => {
          if (t.startTime && !t.isPaused && !t.done) {
            const targetMs = (t.durationMinutes || 5) * 60 * 1000;
            if (t.accumulatedTimeMs >= targetMs) return { ...t, accumulatedTimeMs: targetMs };
            const lastTick = t.lastTickTime || t.startTime;
            const delta = currentTime - lastTick;
            if (delta >= 1000) {
              needsUpdate = true;
              return { 
                ...t, 
                accumulatedTimeMs: Math.min(targetMs, (t.accumulatedTimeMs || 0) + delta),
                lastTickTime: currentTime 
              };
            }
          }
          return t;
        });

        if (exhaustionEndTime && currentTime >= exhaustionEndTime) {
          updatedUser.isBroken = false;
          updatedUser.hp = Math.floor(updatedUser.maxHp * 0.2);
          setExhaustionEndTime(null);
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
        setUser(userData);
        fetchAiGreeting(userData);
        if (userData.hp <= 0 || userData.isBroken) setExhaustionEndTime(Date.now() + 60000);
      }
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => setScrollPos(e.currentTarget.scrollTop);

  const fetchAiGreeting = async (u: User) => {
    try {
      const msg = await geminiService.getMotivationalMessage(u.nickname, u.level, u.tasks.filter(t => !t.done).length);
      setAiMessage(msg);
    } catch (e) { console.warn("AI Greet falhou"); }
  };

  const updateAndSave = useCallback((updated: User) => {
    const xpNeeded = updated.level * 200;
    if (updated.xp >= xpNeeded) {
      updated.level += 1;
      updated.xp -= xpNeeded;
      updated.maxHp += 10;
      updated.hp = updated.maxHp;
    }

    if (updated.hp <= 0 && !updated.isBroken) {
      setDamageEffect(true);
      setTimeout(() => setDamageEffect(false), 500);
      const penalty = Math.floor(updated.gold * 0.1);
      updated.gold = Math.max(0, updated.gold - penalty);
      updated.hp = 0; 
      updated.isBroken = true;
      setExhaustionEndTime(Date.now() + 60000);
      updated.tasks = updated.tasks.map(t => ({ 
        ...t, startTime: null, accumulatedTimeMs: 0, lastTickTime: undefined 
      })); 
    }
    setUser(updated);
    db.saveUser(updated);
  }, []);

  const handleStartTask = (taskId: string) => {
    if (!user || user.isBroken) return;
    const nowTime = Date.now();
    updateAndSave({
      ...user,
      hp: Math.max(0, user.hp - 5),
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, startTime: nowTime, lastTickTime: nowTime, isPaused: false, accumulatedTimeMs: 0 } : t)
    });
  };

  const handleCompleteTask = (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task) return;
    const config = RARITIES[task.rarity];
    const diff = DIFFICULTIES[task.difficulty];
    const stats = CLASS_STATS[user.charClass];
    const earnedGold = Math.floor(config.gold * diff.multiplier * (stats.goldMod || 1));
    const earnedXp = Math.floor(config.xp * diff.multiplier * (stats.xpMod || 1));
    updateAndSave({
      ...user,
      gold: user.gold + earnedGold,
      xp: user.xp + earnedXp,
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, done: true, doneAt: Date.now() } : t)
    });
  };

  const handleCancelTask = (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task) return;
    const rarityConfig = RARITIES[task.rarity];
    const penalty = rarityConfig.hpCost || 10;
    updateAndSave({
      ...user,
      hp: Math.max(0, user.hp - penalty), 
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, startTime: null, accumulatedTimeMs: 0, lastTickTime: undefined } : t)
    });
    setTaskToAbandon(null);
  };

  const handlePurchase = (item: InventoryItem) => {
    if (!user || user.gold < item.price) return;
    const isStackable = item.type === 'buff';
    const existingIndex = user.inventory.findIndex(i => i.id === item.id);
    let newInventory = [...user.inventory];
    if (isStackable && existingIndex >= 0) {
      newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: (newInventory[existingIndex].quantity || 0) + 1 };
    } else {
      if (user.inventory.length >= user.inventoryCapacity && !isStackable) return;
      newInventory.push({ ...item, quantity: 1 });
    }
    updateAndSave({ ...user, gold: user.gold - item.price, inventory: newInventory });
  };

  const handleUseItem = (item: InventoryItem) => {
    if (!user) return;
    let updatedHp = user.hp;
    if (item.id === 'potion-0') updatedHp = Math.min(user.maxHp, user.hp + 5);
    if (item.id === 'potion-1') updatedHp = Math.min(user.maxHp, user.hp + 20);
    const newInventory = user.inventory.map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 1) - 1 } : i).filter(i => (i.quantity || 0) > 0);
    const isNowHealthy = updatedHp > 0;
    if (isNowHealthy) setExhaustionEndTime(null);
    updateAndSave({ ...user, hp: updatedHp, isBroken: isNowHealthy ? false : user.isBroken, inventory: newInventory });
  };

  const handleEquipItem = (item: InventoryItem) => {
    if (!user || !item.slot) return;
    const isEquipped = user.equipment[item.slot] === item.id;
    const newEquipment = { ...user.equipment, [item.slot]: isEquipped ? null : item.id };
    let newAppearance = { ...user.appearance };
    if (item.type === 'skin') newAppearance.outfitId = isEquipped ? undefined : item.id;
    updateAndSave({ ...user, equipment: newEquipment, appearance: newAppearance });
  };

  const formatTime = (ms: number) => {
    if (isNaN(ms) || ms < 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isExhausted = exhaustionEndTime !== null && now < exhaustionEndTime;
  const exhaustionSecondsLeft = isExhausted ? Math.ceil((exhaustionEndTime! - now) / 1000) : 0;
  const activeQuest = user?.tasks.find(t => t.startTime && !t.done);

  const filteredInventory = user?.inventory.filter(item => 
    item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.type.toLowerCase().includes(inventorySearch.toLowerCase())
  ) || [];

  if (!user && !isCreatingCharacter) return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.1)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-10 md:p-14 rounded-[3.5rem] shadow-3xl text-center relative z-10 animate-in fade-in zoom-in-95 duration-700 overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-rpg mb-12 text-white font-black uppercase tracking-tighter whitespace-nowrap">QUEST<span className="text-red-600">MASTER</span></h1>
        <div className="space-y-6">
          <input type="email" placeholder="Email do Herói" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 text-white text-center outline-none focus:ring-4 ring-red-600/30 transition-all font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={() => { if (!email) return; let existing = db.getUser(email); if (!existing) setIsCreatingCharacter(true); else { db.setSession(email); setUser(existing); fetchAiGreeting(existing); } }} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-xs transition-all active:scale-95 shadow-2xl hover:bg-red-500 border-b-4 border-red-800">Entrar no Reino</button>
        </div>
      </div>
    </div>
  );

  if (isCreatingCharacter) return <CharacterCreator onComplete={(data) => {
    const stats = CLASS_STATS[data.charClass];
    const newUser: User = { ...data, email, xp: 0, level: 1, gold: 100, hp: stats.hp, maxHp: stats.hp, isBroken: false, avatar: '🛡️', inventoryCapacity: BASE_INVENTORY_CAPACITY, activeTheme: 'theme-default', tasks: [], inventory: [], skills: INITIAL_SKILLS, equippedSkills: [], equipment: { head: null, body: null, acc1: null, acc2: null, special: null }, campaignProgress: 0 };
    db.saveUser(newUser); db.setSession(email); setUser(newUser); setIsCreatingCharacter(false);
  }} />;

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} transition-all duration-700 overflow-hidden relative`}>
        <div className={`fixed inset-0 z-[60] pointer-events-none transition-all duration-1000 ${isExhausted ? 'bg-red-950/40 opacity-100' : 'bg-transparent opacity-0'}`} />

        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full overflow-y-auto scrollbar-hide z-10">
          <div className="flex flex-col items-center mb-8 gap-6">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-[3.5rem] bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-3xl overflow-hidden ${damageEffect || isExhausted ? 'animate-shake' : ''}`}>
                <HeroAvatar appearance={user.appearance} user={user} size={100} />
              </div>
              <div className={`absolute -top-2 -right-2 w-10 h-10 bg-${isExhausted ? 'red-600' : currentTheme.primary} rounded-2xl border-4 border-zinc-900 flex items-center justify-center text-xl shadow-2xl transition-all`}>
                {user.isBroken ? '💀' : user.avatar}
              </div>
            </div>
            <div className="text-center">
              <h1 className="font-rpg text-2xl font-black tracking-tight">{user.nickname}</h1>
              <div className={`px-3 py-1 mt-1 rounded-full bg-zinc-900 border border-zinc-800 text-[8px] uppercase font-black tracking-widest ${isExhausted ? 'text-red-500 border-red-900' : currentTheme.text}`}>
                {user.isBroken ? 'EXAUSTO' : `Lvl ${user.level} ${user.charClass}`}
              </div>
            </div>
          </div>
          <div className="space-y-6 flex-1">
            <StatsBar label="Vida" current={user.hp} max={user.maxHp} color={user.hp < 30 ? "bg-red-800" : "bg-red-600"} icon="❤️" />
            <StatsBar label="XP" current={user.xp} max={user.level * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            <div className="bg-zinc-800/30 p-4 rounded-[2rem] border border-zinc-700/30 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Ouro</span>
                <span className="text-amber-400 font-black text-xl">💰 {user.gold}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-[10px] italic text-zinc-600 text-center leading-relaxed">"{aiMessage}"</p>
            <button onClick={() => { db.logout(); window.location.reload(); }} className="w-full py-4 rounded-2xl border border-zinc-800 text-[8px] font-black uppercase text-zinc-600 hover:text-red-500 tracking-[0.3em] transition-all">Sair</button>
          </div>
        </aside>

        <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative p-6 md:p-10 z-10 scrollbar-hide">
          <ChromaGrid scrollOffset={scrollPos} color={isExhausted ? 'rgba(239, 68, 68, 0.1)' : (currentTheme.primary === 'red-600' ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255,255,255,0.03)')} />
          
          <nav className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 sticky top-0 z-40 bg-transparent backdrop-blur-md">
            {[ {id:'quests',l:'Missões',i:'⚔️'}, {id:'campaign',l:'História',i:'🗺️'}, {id:'shop',l:'Bazar',i:'💎'}, {id:'inventory',l:'Mochila',i:'🎒'}, {id:'skills',l:'Talentos',i:'🔥'}, {id:'profile',l:'Herói',i:'🎭'} ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-6 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-3xl scale-105':'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                <span>{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
              <header className="flex justify-between items-end">
                <h2 className="text-5xl font-rpg uppercase text-white">Sua <span className="text-indigo-500">Mochila</span></h2>
                <div className="relative w-64">
                  <input type="text" placeholder="Pesquisar itens..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/10" />
                </div>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-7">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 p-2">
                    {filteredInventory.map((item, idx) => {
                      const isEquipped = Object.values(user.equipment).includes(item.id);
                      return (
                        <div key={`${item.id}-${idx}`} onClick={() => setSelectedInventoryItem(item)} className={`aspect-square relative rounded-[2.5rem] border-2 cursor-pointer transition-all hover:scale-110 flex flex-col items-center justify-center gap-2 ${RARITIES[item.rarity].bg} ${isEquipped ? 'ring-4 ring-indigo-500/30 border-indigo-500 shadow-2xl' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                          <span className="text-4xl drop-shadow-lg">{item.icon}</span>
                          {item.quantity && item.quantity > 1 && <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 rounded-lg border border-zinc-700 text-[9px] font-black text-white">x{item.quantity}</div>}
                          {isEquipped && <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] shadow-xl border-2 border-zinc-950">✓</div>}
                        </div>
                      );
                    })}
                    {user.inventory.length === 0 && <div className="col-span-full py-32 text-center border-4 border-dashed border-zinc-900 rounded-[4rem]"><p className="text-zinc-700 font-black uppercase text-xs tracking-widest">Nenhum item encontrado na jornada</p></div>}
                  </div>
                </div>
                <div className="lg:col-span-5 flex flex-col items-center sticky top-28">
                  <div className="relative w-full aspect-[0.9/1] bg-zinc-900/20 rounded-[5rem] border-2 border-zinc-800/30 flex flex-col shadow-3xl p-12 backdrop-blur-sm">
                    <div className="flex justify-center mb-10"><EquipSlot slot="head" user={user} onSelect={setSelectedInventoryItem} /></div>
                    <div className="flex items-center justify-between gap-4 flex-1">
                      <EquipSlot slot="acc1" user={user} onSelect={setSelectedInventoryItem} />
                      <div className="p-4 bg-zinc-950/40 rounded-[4rem] border border-zinc-800/50 shadow-inner">
                        <HeroAvatar appearance={user.appearance} user={user} size={200} />
                      </div>
                      <EquipSlot slot="acc2" user={user} onSelect={setSelectedInventoryItem} />
                    </div>
                    <div className="flex justify-center gap-16 mt-10">
                       <EquipSlot slot="body" user={user} onSelect={setSelectedInventoryItem} />
                       <EquipSlot slot="special" user={user} onSelect={setSelectedInventoryItem} />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] whitespace-nowrap shadow-2xl">Equipamento Atual</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700 pb-32">
               <div className="text-center space-y-4">
                  <h2 className="text-7xl font-rpg uppercase tracking-tighter text-white">Sua <span className="text-red-600">Lenda</span></h2>
                  <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-xs">A história do mundo será escrita por suas mãos</p>
               </div>

               {!isEditingProfile ? (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-5 bg-zinc-900/30 rounded-[5rem] border-2 border-zinc-800 p-12 flex flex-col items-center gap-10 shadow-3xl">
                      <div className="w-full aspect-square bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center shadow-inner relative">
                        <HeroAvatar appearance={user.appearance} user={user} size={280} />
                      </div>
                      <div className="text-center space-y-6 w-full">
                        <h3 className="text-5xl font-rpg text-white tracking-tight">{user.nickname}</h3>
                        <div className="flex flex-col gap-3">
                           <div className="px-6 py-2 bg-red-600/10 border border-red-600/30 rounded-full text-red-500 text-xs font-black uppercase tracking-widest">{user.charClass} Nível {user.level}</div>
                           <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Membro Honorário da Guilda</div>
                        </div>
                        <button onClick={() => setIsEditingProfile(true)} className="w-full py-6 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 transition-all shadow-xl border-b-4 border-zinc-300 active:scale-95">Editar Aparência</button>
                      </div>
                   </div>
                   <div className="lg:col-span-7 space-y-8">
                     <div className="p-10 bg-zinc-900/20 rounded-[4rem] border border-zinc-800/50 space-y-8">
                        <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-4"><span className="w-8 h-[2px] bg-zinc-800"></span> Resumo de Atributos <span className="w-8 h-[2px] bg-zinc-800"></span></h4>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800/50 space-y-2">
                              <span className="text-[8px] font-black text-zinc-600 uppercase">Vitalidade</span>
                              <p className="text-3xl font-black text-white">{user.maxHp} HP</p>
                           </div>
                           <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800/50 space-y-2">
                              <span className="text-[8px] font-black text-zinc-600 uppercase">Fortuna</span>
                              <p className="text-3xl font-black text-amber-500">{user.gold} G</p>
                           </div>
                           <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800/50 space-y-2">
                              <span className="text-[8px] font-black text-zinc-600 uppercase">Capacidade</span>
                              <p className="text-3xl font-black text-indigo-400">{user.inventory.length}/{user.inventoryCapacity}</p>
                           </div>
                           <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800/50 space-y-2">
                              <span className="text-[8px] font-black text-zinc-600 uppercase">Progresso</span>
                              <p className="text-3xl font-black text-red-500">{Math.floor((user.campaignProgress / CAMPAIGN_CHAPTERS.length) * 100)}%</p>
                           </div>
                        </div>
                     </div>
                     <div className="p-10 bg-zinc-900/20 rounded-[4rem] border border-zinc-800/50 space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Equipamento Ativo</h4>
                        <div className="flex flex-wrap gap-4">
                           {(['head', 'body', 'acc1', 'acc2', 'special'] as EquipmentSlot[]).map(slot => {
                             const itemId = user.equipment[slot];
                             const item = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null;
                             return (
                               <div key={slot} className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all ${item ? 'bg-zinc-900 border-indigo-500/50 text-white' : 'bg-zinc-950 opacity-20 border-zinc-800 text-zinc-800'}`}>
                                 {item ? item.icon : '•'}
                               </div>
                             );
                           })}
                        </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="lg:col-span-5 flex flex-col items-center gap-10">
                       <div className="w-full aspect-square bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center shadow-inner">
                          <HeroAvatar appearance={user.appearance} user={user} size={280} />
                       </div>
                       <button onClick={() => setIsEditingProfile(false)} className="w-full py-5 border-2 border-zinc-800 text-zinc-500 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Cancelar Edição</button>
                    </div>
                    <div className="lg:col-span-7 bg-zinc-900/30 rounded-[5rem] border border-zinc-800/50 p-12 space-y-12">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 text-center">Painel de Customização</h3>
                       <div className="space-y-10">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase text-zinc-600">Expressão Facial</label>
                             <div className="grid grid-cols-5 gap-3">
                                {['neutral', 'happy', 'focused', 'grin', 'tired'].map(exp => (
                                  <button key={exp} onClick={()=>setUser({...user, appearance: {...user.appearance, expression: exp as any}})} className={`h-14 rounded-2xl border-2 transition-all flex items-center justify-center text-2xl ${user.appearance.expression === exp ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-950 opacity-40 hover:opacity-100'}`}>
                                     {exp === 'neutral' ? '😐' : exp === 'happy' ? '😊' : exp === 'focused' ? '🧐' : exp === 'grin' ? '😁' : '😴'}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase text-zinc-600">Corte de Cabelo</label>
                             <div className="grid grid-cols-3 gap-3">
                                {['none', 'short', 'spiky', 'long', 'hood'].map(style => (
                                  <button key={style} onClick={()=>setUser({...user, appearance: {...user.appearance, hairStyle: style as any}})} className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${user.appearance.hairStyle === style ? 'border-indigo-600 bg-indigo-600/10 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-600 hover:border-zinc-700'}`}>{style}</button>
                                ))}
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-zinc-600">Pele</label>
                                <input type="color" value={user.appearance.skinColor} onChange={e=>setUser({...user, appearance: {...user.appearance, skinColor: e.target.value}})} className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer p-1" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-zinc-600">Cabelo</label>
                                <input type="color" value={user.appearance.hairColor} onChange={e=>setUser({...user, appearance: {...user.appearance, hairColor: e.target.value}})} className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer p-1" />
                             </div>
                          </div>
                          <button onClick={()=>{updateAndSave(user); setIsEditingProfile(false);}} className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 transition-all shadow-xl border-b-4 border-zinc-300">Gravar Alterações</button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in zoom-in-95 duration-700">
              {isExhausted ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-12">
                  <div className="text-9xl animate-bounce drop-shadow-[0_0_60px_rgba(239,68,68,0.7)]">💀</div>
                  <div className="text-center space-y-4"><h2 className="text-8xl font-rpg text-red-600 font-black uppercase tracking-tighter">EXAUSTO</h2><p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-sm">A morte é apenas um contratempo.</p></div>
                  <div className="p-16 bg-red-950/20 border-4 border-red-600 rounded-[5rem] text-center shadow-[0_0_150px_rgba(239,68,68,0.3)] min-w-[300px]"><span className="text-xs font-black text-red-500 uppercase tracking-widest block mb-6">Renascendo em</span><span className="text-[10rem] font-black font-mono text-white leading-none tabular-nums">{exhaustionSecondsLeft}s</span></div>
                </div>
              ) : (
                <>
                  <button onClick={()=>setShowQuestCreator(true)} className="w-full bg-zinc-900/30 border-4 border-dashed border-zinc-800 p-12 rounded-[4rem] flex items-center justify-center gap-8 hover:border-red-600/50 transition-all group"><span className="text-4xl group-hover:scale-125 transition-all">📜</span><span className="text-sm font-black uppercase tracking-[0.5em] text-zinc-500 group-hover:text-zinc-200">Novo Contrato de Missão</span></button>
                  {showQuestCreator && <QuestStepper onComplete={data => { const task: Task = { ...data, durationMinutes: data.duration, id: Math.random().toString(36).substr(2,9), startTime: null, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now() }; updateAndSave({...user, tasks: [task, ...user.tasks]}); setShowQuestCreator(false); }} onCancel={()=>setShowQuestCreator(false)} />}
                  <div className="space-y-8">
                     {user.tasks.filter(t => !t.done).map(task => {
                       const config = RARITIES[task.rarity];
                       const isRunning = task.startTime !== null;
                       const targetMs = (task.durationMinutes || 5) * 60 * 1000;
                       const progress = Math.min(100, ((task.accumulatedTimeMs || 0) / targetMs) * 100);
                       const isReady = progress >= 100;
                       const remainingMs = Math.max(0, targetMs - (task.accumulatedTimeMs || 0));
                       return (
                         <div key={task.id} className={`p-12 rounded-[4.5rem] border-2 transition-all duration-700 flex flex-col gap-10 ${isReady ? 'border-amber-500 bg-amber-500/10' : isRunning ? 'border-indigo-500/60 bg-indigo-500/10' : `${config.color} ${config.bg}`}`}>
                            <div className="flex flex-col md:flex-row items-center gap-10">
                              <div className="flex-1 text-center md:text-left space-y-4">
                                 <h3 className="text-5xl font-rpg font-black tracking-tighter">{task.title}</h3>
                                 <div className="flex flex-wrap justify-center md:justify-start gap-6 font-black uppercase tracking-widest text-xs"><span className="text-amber-500">💰 {Math.floor(config.gold * DIFFICULTIES[task.difficulty].multiplier)}G</span><span className="text-indigo-400">✨ {Math.floor(config.xp * DIFFICULTIES[task.difficulty].multiplier)}XP</span>{!isRunning && <span className="text-red-500">❤️ -5 HP</span>}</div>
                              </div>
                              <div className="flex flex-col items-center md:items-end gap-6">
                                 {isRunning && !isReady && <div className="text-center md:text-right"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Tempo Restante</span><span className="text-6xl md:text-7xl font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-2xl">{formatTime(remainingMs)}</span></div>}
                                 <div className="flex gap-6">{isRunning && !isReady && <button onClick={()=>setTaskToAbandon(task.id)} className="px-8 py-5 border-2 border-red-500/20 text-red-500/50 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all text-[10px]">Abandonar</button>}{!isRunning ? <button onClick={()=>handleStartTask(task.id)} className="px-12 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Iniciar</button> : isReady ? <button onClick={()=>handleCompleteTask(task.id)} className="px-14 py-7 bg-amber-500 text-black rounded-[2.5rem] font-black uppercase tracking-widest animate-pulse hover:scale-110 transition-all shadow-2xl">Finalizar</button> : <div className="px-10 py-5 bg-indigo-500/20 text-indigo-400 border-2 border-indigo-500/30 rounded-3xl font-black uppercase text-[10px] tracking-widest">Jornada Ativa...</div>}</div>
                              </div>
                            </div>
                            {isRunning && <div className="w-full h-4 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{width:`${progress}%`}} /></div>}
                         </div>
                       );
                     })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'campaign' && <CampaignTab user={user} onClaim={(id) => { const mission = CAMPAIGN_CHAPTERS.find(m => m.id === id); if (mission) updateAndSave({...user, xp: user.xp + mission.xpReward, gold: user.gold + mission.goldReward, campaignProgress: user.campaignProgress + 1}); }} />}
          {activeTab === 'shop' && <Shop user={user} onPurchase={handlePurchase} />}
          {activeTab === 'skills' && <SkillsManager user={user} onUpgrade={(id) => { const skill = user.skills.find(s => s.id === id); const cost = Math.floor(skill!.xpCostBase * Math.pow(1.5, skill!.level)); if (user.xp >= cost) updateAndSave({ ...user, xp: user.xp - cost, skills: user.skills.map(s => s.id === id ? { ...s, level: s.level + 1 } : s) }); }} onEquip={(id) => { updateAndSave({ ...user, equippedSkills: user.equippedSkills.includes(id) ? user.equippedSkills.filter(s => s !== id) : [...user.equippedSkills, id] }); }} onUseActive={(id) => { if (id === 'meditation') updateAndSave({ ...user, hp: Math.min(user.maxHp, user.hp + 15) }); }} />}

          {taskToAbandon && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-500">
               <div className="max-w-md w-full bg-zinc-900 border-4 border-red-600 rounded-[5rem] p-16 text-center shadow-[0_0_150px_rgba(220,38,38,0.6)] animate-in zoom-in-95 slide-in-from-bottom-12 duration-500"><div className="text-9xl mb-10 animate-pulse">🩸</div><h3 className="text-5xl font-rpg text-red-600 font-black uppercase mb-6 tracking-tighter">Impacto!</h3><p className="text-zinc-400 font-bold leading-relaxed mb-12 text-lg">Abandonar custará <span className="text-red-500 text-4xl font-black block mt-2">-{RARITIES[user.tasks.find(t=>t.id===taskToAbandon)?.rarity || 'comum'].hpCost} HP</span></p><div className="flex flex-col gap-6"><button onClick={()=>handleCancelTask(taskToAbandon)} className="w-full py-7 bg-red-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all border-b-4 border-red-800">Aceitar Dano</button><button onClick={()=>setTaskToAbandon(null)} className="w-full py-7 border-2 border-zinc-800 text-zinc-500 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Manter Foco</button></div></div>
            </div>
          )}

          {selectedInventoryItem && <ItemDetailsModal item={selectedInventoryItem} user={user} onClose={() => setSelectedInventoryItem(null)} onAction={selectedInventoryItem.type === 'buff' ? handleUseItem : handleEquipItem} actionLabel={selectedInventoryItem.type === 'buff' ? 'Consumir' : (Object.values(user.equipment).includes(selectedInventoryItem.id) ? 'Remover' : 'Equipar')} />}
        </main>
      </div>
    </ClickSpark>
  );
};

const EquipSlot: React.FC<{ slot: EquipmentSlot, user: User, onSelect: (item: InventoryItem) => void }> = ({ slot, user, onSelect }) => {
  const itemId = user.equipment[slot];
  const item = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null;
  const icons: Record<EquipmentSlot, string> = { head: '👤', body: '👕', acc1: '💍', acc2: '💍', special: '✨' };
  const labels: Record<EquipmentSlot, string> = { head: 'Cabeça', body: 'Corpo', acc1: 'Aces. 1', acc2: 'Aces. 2', special: 'Especial' };
  const rarity = item ? (RARITIES[item.rarity] || RARITIES.comum) : null;
  return (
    <div className="flex flex-col items-center gap-2">
      <div onClick={() => item && onSelect(item)} className={`w-14 h-14 md:w-20 md:h-20 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all relative cursor-pointer shadow-xl ${item ? (item.rarity === 'lendario' ? 'animate-equip-legendary border-amber-500 scale-110' : (rarity?.color.split(' ')[1] + ' ' + rarity?.bg + ' animate-equip scale-110')) : 'border-zinc-800 bg-zinc-950/40 opacity-30 border-dashed hover:opacity-100 hover:scale-105'}`}>
        <span className="text-2xl md:text-4xl drop-shadow-2xl">{item ? item.icon : icons[slot]}</span>
      </div>
      <span className="text-[7px] font-black uppercase text-zinc-600 tracking-widest text-center mt-1">{labels[slot]}</span>
    </div>
  );
};

export default App;
