
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
  const [damageEffect, setDamageEffect] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'equipment' | 'buff' | 'cosmetic'>('all');
  
  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [scrollPos, setScrollPos] = useState(0);

  const mainRef = useRef<HTMLElement>(null);
  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sessionEmail = db.getSession();
    if (sessionEmail) {
      const userData = db.getUser(sessionEmail);
      if (userData) {
        setUser(userData);
        fetchAiGreeting(userData);
      }
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrollPos(e.currentTarget.scrollTop);
  };

  const fetchAiGreeting = async (u: User) => {
    try {
      const msg = await geminiService.getMotivationalMessage(u.nickname, u.level, u.tasks.filter(t => !t.done).length);
      setAiMessage(msg);
    } catch (e) {
      console.warn("AI Greet falhou:", e);
    }
  };

  const updateAndSave = useCallback((updated: User) => {
    if (updated.isBroken && updated.hp >= updated.maxHp) {
      updated.isBroken = false;
      alert("✨ Sua alma foi restaurada!");
    }

    if (updated.hp <= 0 && !updated.isBroken) {
      const penalty = Math.floor(updated.gold * 0.1);
      updated.hp = Math.floor(updated.maxHp * 0.2); 
      updated.gold = Math.max(0, updated.gold - penalty);
      updated.tasks = updated.tasks.map(t => ({ ...t, startTime: null, isPaused: false, accumulatedTimeMs: 0 })); 
      alert(`☠️ Você sucumbiu! Perdeu ${penalty}G.`);
    }
    setUser(updated);
    db.saveUser(updated);
  }, []);

  const triggerDamage = () => {
    setDamageEffect(true);
    setTimeout(() => setDamageEffect(false), 500);
  };

  // Lógica de Compra com Stacking
  const handlePurchase = (item: InventoryItem) => {
    if (!user) return;
    const isStackable = item.type === 'buff';
    let newInventory = [...user.inventory];
    
    if (isStackable) {
      const existingIdx = newInventory.findIndex(i => i.id === item.id);
      if (existingIdx > -1) {
        newInventory[existingIdx] = { 
          ...newInventory[existingIdx], 
          quantity: (newInventory[existingIdx].quantity || 1) + 1 
        };
      } else {
        newInventory.push({ ...item, quantity: 1 });
      }
    } else {
      newInventory.push({ ...item, quantity: 1 });
    }

    updateAndSave({
      ...user,
      gold: user.gold - item.price,
      inventory: newInventory
    });
  };

  const handleUseItem = (item: InventoryItem) => {
    if (!user) return;
    if (item.type === 'buff') {
      const heal = item.id === 'potion-0' ? 5 : 20;
      let newInventory = [...user.inventory];
      const idx = newInventory.findIndex(i => i.id === item.id);
      
      if (idx > -1) {
        const currentQty = newInventory[idx].quantity || 1;
        if (currentQty > 1) {
          newInventory[idx] = { ...newInventory[idx], quantity: currentQty - 1 };
        } else {
          newInventory.splice(idx, 1);
        }
      }

      updateAndSave({
        ...user,
        hp: Math.min(user.maxHp, user.hp + heal),
        inventory: newInventory
      });
      setSelectedInventoryItem(null);
    }
  };

  const handleEquipItem = (item: InventoryItem) => {
    if (!user || !item.slot) return;
    const currentEquipped = user.equipment[item.slot];
    const newEquipment = { ...user.equipment, [item.slot]: currentEquipped === item.id ? null : item.id };
    updateAndSave({ ...user, equipment: newEquipment });
  };

  // Funções de Task
  const handleStartTask = (taskId: string) => {
    if (!user || user.isBroken) return;
    updateAndSave({
      ...user,
      hp: Math.max(1, user.hp - 5), 
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, startTime: Date.now(), isPaused: false } : t)
    });
  };

  const handlePauseTask = (taskId: string) => {
    if (!user) return;
    const task = user.tasks.find(t => t.id === taskId);
    if (!task || !task.startTime || task.isPaused) return;
    const elapsed = Date.now() - task.startTime;
    updateAndSave({
      ...user,
      tasks: user.tasks.map(t => t.id === taskId ? { 
        ...t, startTime: null, accumulatedTimeMs: t.accumulatedTimeMs + elapsed, isPaused: true 
      } : t)
    });
  };

  const completeTask = (task: Task) => {
    if (!user || task.done) return;
    let totalElapsedMs = task.accumulatedTimeMs + (task.startTime ? (Date.now() - task.startTime) : 0);
    
    if (totalElapsedMs < task.minDurationSeconds * 1000) {
       triggerDamage();
       updateAndSave({
         ...user,
         hp: Math.max(1, user.hp - 10),
         tasks: user.tasks.map(t => t.id === task.id ? { ...t, startTime: null, isPaused: false, accumulatedTimeMs: 0 } : t)
       });
       alert("💥 BACKLASH! Você falhou prematuramente.");
       return;
    }

    const rConfig = RARITIES[task.rarity] || RARITIES.comum;
    const dConfig = DIFFICULTIES[task.difficulty] || DIFFICULTIES.facil;
    const earnedXp = Math.floor(rConfig.xp * dConfig.multiplier);
    const earnedGold = Math.floor(rConfig.gold * dConfig.multiplier);
    
    let newXp = user.xp + earnedXp;
    let newLevel = user.level;
    while (newXp >= newLevel * 200) { newXp -= (newLevel * 200); newLevel++; }

    updateAndSave({ 
      ...user, 
      tasks: user.tasks.map(t => t.id === task.id ? { ...t, done: true, doneAt: Date.now(), startTime: null, isPaused: false } : t), 
      xp: newXp, level: newLevel, gold: user.gold + earnedGold,
      hp: Math.min(user.maxHp, user.hp + 2)
    });
  };

  const filteredInventory = user?.inventory?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = inventoryCategory === 'all' || 
                            (inventoryCategory === 'equipment' && item.type === 'equipment') ||
                            (inventoryCategory === 'buff' && item.type === 'buff') ||
                            (inventoryCategory === 'cosmetic' && (item.type === 'skin' || item.type === 'theme'));
    return matchesSearch && matchesCategory;
  }) || [];

  if (isCreatingCharacter) return <CharacterCreator onComplete={(data) => {
    const newUser: User = {
      ...data, email, xp: 0, level: 1, gold: 100, hp: 100, maxHp: 100, isBroken: false, avatar: '🛡️',
      inventoryCapacity: BASE_INVENTORY_CAPACITY, activeTheme: 'theme-default', tasks: [], inventory: [],
      skills: INITIAL_SKILLS, equippedSkills: [], equipment: { head: null, body: null, acc1: null, acc2: null, special: null },
      campaignProgress: 0
    };
    db.saveUser(newUser); db.setSession(email); setUser(newUser); setIsCreatingCharacter(false);
  }} />;
  
  if (!user) return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.1)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800 p-10 rounded-[3rem] shadow-3xl text-center relative z-10">
        <h1 className="text-5xl font-rpg mb-10 text-white font-black uppercase tracking-tighter">QUEST<span className="text-red-600">MASTER</span></h1>
        <input type="email" placeholder="Email do Herói" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white mb-4 text-center" value={email} onChange={e => setEmail(e.target.value)} />
        <button onClick={() => {
           if (!email) return;
           let existing = db.getUser(email);
           if (!existing) setIsCreatingCharacter(true);
           else { db.setSession(email); setUser(existing); fetchAiGreeting(existing); }
        }} className="w-full bg-red-600 py-5 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-xs">Entrar no Reino</button>
      </div>
    </div>
  );

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} transition-all duration-500 overflow-hidden`}>
        {/* Sidebar */}
        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="flex flex-col items-center mb-12 gap-8">
            <div className="relative group">
              <div className={`w-40 h-40 rounded-[4rem] bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-3xl overflow-hidden ${damageEffect ? 'animate-shake' : ''}`}>
                <HeroAvatar appearance={user.appearance} user={user} size={130} />
              </div>
              <div className={`absolute -top-3 -right-3 w-12 h-12 bg-${currentTheme.primary} rounded-2xl border-4 border-zinc-900 flex items-center justify-center text-xl shadow-2xl`}>
                {user.isBroken ? '💀' : user.avatar}
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="font-rpg text-3xl font-black tracking-tight">{user.nickname}</h1>
              <div className={`px-4 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-black tracking-widest ${currentTheme.text}`}>
                {user.charClass} • Lvl {user.level}
              </div>
            </div>
          </div>
          
          <div className="space-y-8 flex-1">
            <StatsBar label="Vida" current={user.hp} max={user.maxHp} color={user.isBroken ? "bg-zinc-700" : (user.hp < 30 ? "bg-red-800" : "bg-red-600")} icon="❤️" />
            <StatsBar label="Experiência" current={user.xp} max={user.level * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            <div className="bg-zinc-800/30 p-6 rounded-[2.5rem] border border-zinc-700/30 flex justify-between items-center shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tesouro</span>
                <span className="text-amber-400 font-black text-2xl">💰 {user.gold}</span>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-xl">🏦</div>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <p className="text-[10px] italic text-zinc-600 text-center px-4 leading-relaxed">"{aiMessage}"</p>
            <button onClick={() => { db.logout(); window.location.reload(); }} className="w-full py-4 rounded-2xl border border-zinc-800 text-[9px] font-black uppercase text-zinc-600 hover:text-red-500 tracking-[0.3em] transition-all">Sair</button>
          </div>
        </aside>

        {/* Main Area */}
        <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative p-8 md:p-14 z-10 scrollbar-hide">
          <ChromaGrid scrollOffset={scrollPos} color={currentTheme.primary === 'red-600' ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255,255,255,0.03)'} />
          
          <nav className="flex items-center gap-6 mb-16 overflow-x-auto pb-6 sticky top-0 z-40 bg-transparent backdrop-blur-md">
            {[
              {id:'quests',l:'Missões',i:'⚔️'},
              {id:'campaign',l:'História',i:'🗺️'},
              {id:'skills',l:'Talentos',i:'🔥'},
              {id:'shop',l:'Bazar',i:'💎'},
              {id:'inventory',l:'Mochila',i:'🎒'},
              {id:'profile',l:'Herói',i:'🎭'}
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-3xl scale-105':'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                <span>{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
              <header className="flex justify-between items-end">
                <div className="space-y-4">
                  <h2 className="text-6xl font-rpg uppercase">Seu <span className="text-indigo-500">Espólio</span></h2>
                  <div className="flex gap-4">
                    <span className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-zinc-500 uppercase">Espaços: {user.inventory.length}/{user.inventoryCapacity}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                   <input type="text" placeholder="Filtrar itens..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold w-64 focus:border-indigo-500 outline-none" />
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Character Profile Card */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                  <div className="relative aspect-[3/4] bg-zinc-900/40 rounded-[5rem] border-2 border-zinc-800 flex flex-col items-center p-12 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent opacity-50" />
                    
                    {/* Equipment Slots Socketed */}
                    <div className="absolute inset-0 p-10 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="col-start-2 flex justify-center"><EquipSlot slot="head" user={user} onSelect={setSelectedInventoryItem} /></div>
                      <div className="row-start-2 col-start-1 flex items-center"><EquipSlot slot="acc1" user={user} onSelect={setSelectedInventoryItem} /></div>
                      <div className="row-start-2 col-start-3 flex items-center justify-end"><EquipSlot slot="acc2" user={user} onSelect={setSelectedInventoryItem} /></div>
                      <div className="row-start-3 col-start-2 flex justify-center items-end"><EquipSlot slot="body" user={user} onSelect={setSelectedInventoryItem} /></div>
                      <div className="row-start-3 col-start-3 flex justify-end items-end"><EquipSlot slot="special" user={user} onSelect={setSelectedInventoryItem} /></div>
                    </div>

                    <div className="mt-12 mb-auto z-10 flex flex-col items-center">
                       <div className="w-56 h-56 bg-zinc-950/60 rounded-full border border-zinc-800 flex items-center justify-center shadow-inner relative">
                          <HeroAvatar appearance={user.appearance} user={user} size={180} />
                          <div className="absolute -bottom-4 bg-zinc-900 border border-zinc-700 px-6 py-2 rounded-full text-xs font-black font-rpg">LEVEL {user.level}</div>
                       </div>
                    </div>

                    <div className="w-full space-y-4 z-10">
                       <div className="grid grid-cols-3 gap-2">
                          {[
                            {l: 'Poder', v: '+12%', i: '⚔️'},
                            {l: 'Defesa', v: '+8%', i: '🛡️'},
                            {l: 'Sorte', v: '+5%', i: '🍀'}
                          ].map(s => (
                            <div key={s.l} className="bg-black/40 border border-zinc-800/50 p-4 rounded-3xl text-center">
                               <p className="text-[7px] text-zinc-600 uppercase font-black">{s.l}</p>
                               <p className="text-sm font-black text-zinc-200">{s.v}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Grid */}
                <div className="lg:col-span-7">
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-4 overflow-y-auto pr-2 max-h-[700px] scrollbar-hide">
                    {filteredInventory.map((item, idx) => {
                      const isEquipped = Object.values(user.equipment).includes(item.id);
                      const rarity = RARITIES[item.rarity] || RARITIES.comum;
                      return (
                        <div 
                          key={`${item.id}-${idx}`}
                          onClick={() => setSelectedInventoryItem(item)}
                          className={`group aspect-square relative rounded-3xl border-2 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center gap-1 ${rarity.color.split(' ')[1]} ${rarity.bg} ${isEquipped ? 'ring-2 ring-white/30' : ''}`}
                        >
                          <span className="text-4xl group-hover:scale-110 transition-all">{item.icon}</span>
                          <span className={`text-[7px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors`}>{item.name.split(' ')[0]}</span>
                          {item.quantity && item.quantity > 1 && (
                            <div className="absolute top-2 right-2 bg-black/80 border border-zinc-700 px-2 py-0.5 rounded-lg text-[8px] font-black text-white">x{item.quantity}</div>
                          )}
                          {isEquipped && <div className="absolute -bottom-2 bg-white text-black px-2 py-0.5 rounded-full text-[6px] font-black">EQUIP</div>}
                        </div>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <div className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-[3rem] text-center opacity-30">Vazio</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shop' && <Shop user={user} onPurchase={handlePurchase} />}
          {activeTab === 'quests' && (
            <div className="max-w-4xl mx-auto space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!user.isBroken && (
                  <button onClick={()=>setShowQuestCreator(true)} className="bg-zinc-900/30 border-4 border-dashed border-zinc-800 p-10 rounded-[3.5rem] flex items-center gap-6 hover:border-red-600/40 transition-all group">
                    <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-all">＋</div>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 group-hover:text-zinc-200">Nova Missão</span>
                  </button>
                )}
              </div>
              {showQuestCreator && <QuestStepper onCancel={()=>setShowQuestCreator(false)} onComplete={data => {
                const task: Task = { ...data, id: Math.random().toString(36).substr(2,9), startTime: null, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now() };
                updateAndSave({...user, tasks: [task, ...user.tasks]});
                setShowQuestCreator(false);
              }} />}
              <div className="space-y-8">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700">Contratos Pendentes</h3>
                 {user.tasks.filter(t => !t.done).map(task => {
                   const config = RARITIES[task.rarity] || RARITIES.comum;
                   return (
                     <div key={task.id} className={`p-10 rounded-[4rem] border-2 ${config.color} ${config.bg} shadow-2xl flex flex-col md:flex-row items-center gap-8`}>
                        <div className="flex-1 space-y-4">
                           <h3 className="text-4xl font-rpg font-black">{task.title}</h3>
                           <div className="flex gap-4">
                              <span className="text-amber-500 font-bold text-sm">💰 {config.gold}G</span>
                              <span className="text-indigo-400 font-bold text-sm">✨ {config.xp}XP</span>
                           </div>
                        </div>
                        <button onClick={()=>handleStartTask(task.id)} className="px-12 py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all">Iniciar</button>
                     </div>
                   );
                 })}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-12">
               <h2 className="text-5xl font-rpg text-center">Refúgio do <span className="text-red-500">Herói</span></h2>
               <div className="bg-zinc-900/40 p-12 rounded-[4rem] border border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Codinome</label>
                        <input type="text" value={user.nickname} onChange={e => updateAndSave({...user, nickname: e.target.value})} className="w-full bg-zinc-950 p-6 rounded-3xl border border-zinc-800 font-bold text-white focus:border-red-600 outline-none" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Atributos Primários</label>
                        <div className="space-y-4">
                           <StatsBar label="Força" current={85} max={100} color="bg-orange-600" />
                           <StatsBar label="Mente" current={40} max={100} color="bg-indigo-600" />
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center justify-center">
                     <div className="w-64 h-64 bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center shadow-inner relative">
                        <HeroAvatar appearance={user.appearance} user={user} size={200} />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'campaign' && <CampaignTab user={user} onClaim={(id) => {
            const mission = CAMPAIGN_CHAPTERS.find(m => m.id === id);
            if (mission) updateAndSave({ ...user, gold: user.gold + mission.goldReward, campaignProgress: user.campaignProgress + 1 });
          }} />}
          {activeTab === 'skills' && <SkillsManager user={user} onUpgrade={(id) => {
            const skill = user.skills.find(s => s.id === id);
            if (skill) updateAndSave({ ...user, xp: user.xp - 100, skills: user.skills.map(s => s.id === id ? { ...s, level: s.level + 1 } : s) });
          }} onEquip={(id) => {
            updateAndSave({ ...user, equippedSkills: user.equippedSkills.includes(id) ? user.equippedSkills.filter(s => s !== id) : [...user.equippedSkills, id] });
          }} onUseActive={(id) => {
            if (id === 'meditation') updateAndSave({ ...user, hp: Math.min(user.maxHp, user.hp + 15) });
          }} />}

          {selectedInventoryItem && (
            <ItemDetailsModal 
              item={selectedInventoryItem} user={user} onClose={() => setSelectedInventoryItem(null)} 
              onAction={selectedInventoryItem.type === 'buff' ? handleUseItem : handleEquipItem}
              actionLabel={selectedInventoryItem.type === 'buff' ? 'Consumir' : (Object.values(user.equipment).includes(selectedInventoryItem.id) ? 'Remover' : 'Equipar')}
            />
          )}
        </main>
      </div>
    </ClickSpark>
  );
};

const EquipSlot: React.FC<{ slot: EquipmentSlot, user: User, onSelect: (item: InventoryItem) => void }> = ({ slot, user, onSelect }) => {
  const itemId = user.equipment[slot];
  const item = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null;
  const icons: Record<EquipmentSlot, string> = { head: '👤', body: '👕', acc1: '💍', acc2: '💍', special: '✨' };
  const rarity = item ? (RARITIES[item.rarity] || RARITIES.comum) : null;

  return (
    <div 
      onClick={() => item && onSelect(item)}
      className={`w-20 h-20 rounded-[1.8rem] border-2 flex flex-col items-center justify-center transition-all relative cursor-pointer pointer-events-auto shadow-xl
        ${item ? (rarity?.color.split(' ')[1] + ' ' + rarity?.bg + ' animate-equip scale-110') : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'}
      `}
    >
      <span className="text-3xl">{item ? item.icon : icons[slot]}</span>
      <span className="text-[6px] font-black uppercase text-zinc-600 absolute -bottom-5 tracking-widest">{slot}</span>
      {item && <div className="absolute inset-0 rounded-[1.8rem] ring-2 ring-white/10" />}
    </div>
  );
};

export default App;
