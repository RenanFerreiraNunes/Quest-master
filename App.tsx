
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
  const [scrollPos, setScrollPos] = useState(0);

  const mainRef = useRef<HTMLElement>(null);
  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

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
    if (updated.hp <= 0 && !updated.isBroken) {
      const penalty = Math.floor(updated.gold * 0.1);
      updated.hp = Math.floor(updated.maxHp * 0.2); 
      updated.gold = Math.max(0, updated.gold - penalty);
      updated.tasks = updated.tasks.map(t => ({ ...t, startTime: null, isPaused: false, accumulatedTimeMs: 0 })); 
    }
    setUser(updated);
    db.saveUser(updated);
  }, []);

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
    const currentEquippedId = user.equipment[item.slot];
    
    const newEquipment = { 
      ...user.equipment, 
      [item.slot]: currentEquippedId === item.id ? null : item.id 
    };

    if (item.slot === 'acc1' || item.slot === 'acc2') {
      const otherSlot = item.slot === 'acc1' ? 'acc2' : 'acc1';
      if (newEquipment[otherSlot] === item.id) {
        newEquipment[otherSlot] = null;
      }
    }

    updateAndSave({ ...user, equipment: newEquipment });
  };

  const handleStartTask = (taskId: string) => {
    if (!user || user.isBroken) return;
    updateAndSave({
      ...user,
      hp: Math.max(1, user.hp - 5), 
      tasks: user.tasks.map(t => t.id === taskId ? { ...t, startTime: Date.now(), isPaused: false } : t)
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
        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="flex flex-col items-center mb-8 gap-6">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-[3.5rem] bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-3xl overflow-hidden ${damageEffect ? 'animate-shake' : ''}`}>
                <HeroAvatar appearance={user.appearance} user={user} size={100} />
              </div>
              <div className={`absolute -top-2 -right-2 w-10 h-10 bg-${currentTheme.primary} rounded-2xl border-4 border-zinc-900 flex items-center justify-center text-xl shadow-2xl`}>
                {user.isBroken ? '💀' : user.avatar}
              </div>
            </div>
            <div className="text-center">
              <h1 className="font-rpg text-2xl font-black tracking-tight">{user.nickname}</h1>
              <div className={`px-3 py-1 mt-1 rounded-full bg-zinc-900 border border-zinc-800 text-[8px] uppercase font-black tracking-widest ${currentTheme.text}`}>
                Lvl {user.level} {user.charClass}
              </div>
            </div>
          </div>
          
          <div className="space-y-6 flex-1">
            <StatsBar label="Vida" current={user.hp} max={user.maxHp} color={user.isBroken ? "bg-zinc-700" : (user.hp < 30 ? "bg-red-800" : "bg-red-600")} icon="❤️" />
            <StatsBar label="XP" current={user.xp} max={user.level * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            <div className="bg-zinc-800/30 p-4 rounded-[2rem] border border-zinc-700/30 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Ouro</span>
                <span className="text-amber-400 font-black text-xl">💰 {user.gold}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <p className="text-[10px] italic text-zinc-600 text-center leading-relaxed">"{aiMessage}"</p>
            <button onClick={() => { db.logout(); window.location.reload(); }} className="w-full py-4 rounded-2xl border border-zinc-800 text-[8px] font-black uppercase text-zinc-600 hover:text-red-500 tracking-[0.3em] transition-all">Sair</button>
          </div>
        </aside>

        {/* Main Area */}
        <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative p-6 md:p-10 z-10 scrollbar-hide">
          <ChromaGrid scrollOffset={scrollPos} color={currentTheme.primary === 'red-600' ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255,255,255,0.03)'} />
          
          <nav className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 sticky top-0 z-40 bg-transparent backdrop-blur-md">
            {[
              {id:'quests',l:'Missões',i:'⚔️'},
              {id:'campaign',l:'História',i:'🗺️'},
              {id:'skills',l:'Talentos',i:'🔥'},
              {id:'shop',l:'Bazar',i:'💎'},
              {id:'inventory',l:'Mochila',i:'🎒'},
              {id:'profile',l:'Herói',i:'🎭'}
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-6 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-3xl scale-105':'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}>
                <span>{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                  <h2 className="text-5xl font-rpg uppercase">Seu <span className="text-indigo-500">Espólio</span></h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Espaços: {user.inventory.length}/{user.inventoryCapacity}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   <div className="relative flex-1 md:w-80 group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                      <input 
                        type="text" 
                        placeholder="Pesquisar nos baús..." 
                        value={inventorySearch} 
                        onChange={e=>setInventorySearch(e.target.value)} 
                        className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] pl-14 pr-6 py-4 text-xs font-bold focus:border-indigo-500/50 focus:ring-4 ring-indigo-500/5 outline-none transition-all placeholder:text-zinc-700" 
                      />
                   </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-20">
                {/* Character Profile Card - Ajustado para melhor centralização e espaçamento */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[450px] aspect-[0.9/1] bg-zinc-900/40 rounded-[5rem] border-2 border-zinc-800/50 flex flex-col shadow-3xl overflow-hidden p-10 md:p-14 lg:p-16">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent opacity-40 pointer-events-none" />
                    
                    {/* Head Slot */}
                    <div className="flex justify-center mb-6">
                      <EquipSlot slot="head" user={user} onSelect={setSelectedInventoryItem} />
                    </div>

                    {/* Middle Row: Accessories and Hero Avatar */}
                    <div className="flex items-center justify-between gap-4 flex-1">
                      <div className="shrink-0 scale-90 md:scale-100">
                        <EquipSlot slot="acc1" user={user} onSelect={setSelectedInventoryItem} />
                      </div>
                      
                      <div className="relative flex-1 flex justify-center items-center">
                        <div className="w-44 h-44 md:w-60 md:h-60 bg-zinc-950/40 rounded-full border border-white/5 flex items-center justify-center shadow-inner relative group">
                          {/* Glow background for the avatar */}
                          <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                          
                          <HeroAvatar appearance={user.appearance} user={user} size={220} className="relative z-10" />
                          
                          <div className="absolute -bottom-5 bg-zinc-900 border border-zinc-700 px-6 py-2 rounded-full text-[12px] font-black font-rpg shadow-2xl z-30 ring-4 ring-zinc-950/80">
                            LEVEL {user.level}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 scale-90 md:scale-100">
                        <EquipSlot slot="acc2" user={user} onSelect={setSelectedInventoryItem} />
                      </div>
                    </div>

                    {/* Bottom Row: Body and Special Slots */}
                    <div className="flex justify-center gap-12 md:gap-20 mt-6">
                       <EquipSlot slot="body" user={user} onSelect={setSelectedInventoryItem} />
                       <EquipSlot slot="special" user={user} onSelect={setSelectedInventoryItem} />
                    </div>

                    {/* Quick Stats Panel */}
                    <div className="grid grid-cols-3 gap-3 mt-14">
                      {[
                        {l: 'Poder', v: '+12%', i: '⚔️'},
                        {l: 'Defesa', v: '+8%', i: '🛡️'},
                        {l: 'Sorte', v: '+5%', i: '🍀'}
                      ].map(s => (
                        <div key={s.l} className="bg-black/40 border border-white/5 p-3 rounded-2xl text-center shadow-lg transition-all hover:bg-black/60 hover:scale-105 group">
                           <p className="text-[8px] text-zinc-600 group-hover:text-zinc-400 uppercase font-black tracking-widest mb-1">{s.l}</p>
                           <p className="text-[11px] font-black text-zinc-300">{s.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inventory Grid - Corrigido espaçamento e clipping */}
                <div className="lg:col-span-7">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 overflow-y-auto p-2 pb-10 max-h-[850px] scrollbar-hide overflow-x-visible">
                    {filteredInventory.map((item, idx) => {
                      const isEquipped = Object.values(user.equipment).includes(item.id);
                      const rarity = RARITIES[item.rarity] || RARITIES.comum;
                      return (
                        <div 
                          key={`${item.id}-${idx}`}
                          onClick={() => setSelectedInventoryItem(item)}
                          className={`group aspect-square relative rounded-[3rem] border-2 cursor-pointer transition-all hover:scale-110 hover:z-20 flex flex-col items-center justify-center gap-3 ${rarity.color.split(' ')[1]} ${rarity.bg} ${isEquipped ? 'ring-4 ring-indigo-500/20 shadow-indigo-500/10' : 'hover:shadow-2xl'}`}
                        >
                          <span className="text-4xl md:text-5xl group-hover:scale-125 transition-all drop-shadow-2xl">{item.icon}</span>
                          <span className="text-[10px] md:text-[11px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors truncate px-4 w-full text-center tracking-tighter">{item.name}</span>
                          
                          {item.quantity && item.quantity > 1 && (
                            <div className="absolute top-4 right-4 bg-zinc-950/90 border border-zinc-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black text-indigo-400 z-10 shadow-lg">x{item.quantity}</div>
                          )}
                          
                          {isEquipped && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-5 py-2 rounded-full text-[9px] font-black shadow-2xl z-30 whitespace-nowrap border-4 border-zinc-950 uppercase tracking-widest scale-90 animate-in fade-in zoom-in-50">Equipado</div>
                          )}
                          
                          {/* Aura de Raridade Sutil */}
                          <div className={`absolute inset-0 rounded-[3rem] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${rarity.bg.replace('/10', '/30')}`} />
                          
                          {/* Marcador de Raridade (Dot) */}
                          <div className={`absolute top-4 left-4 w-2.5 h-2.5 rounded-full ${rarity.color.split(' ')[0].replace('text-', 'bg-')} shadow-[0_0_12px_currentColor]`} />
                        </div>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <div className="col-span-full py-48 border-4 border-dashed border-zinc-900 rounded-[5rem] flex flex-col items-center justify-center gap-4 opacity-40">
                        <span className="text-4xl">🕳️</span>
                        <span className="text-sm font-black uppercase tracking-[0.8em] text-zinc-700">Mochila Vazia</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shop' && <Shop user={user} onPurchase={handlePurchase} />}
          {activeTab === 'quests' && (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!user.isBroken && (
                  <button onClick={()=>setShowQuestCreator(true)} className="bg-zinc-900/30 border-4 border-dashed border-zinc-800 p-10 rounded-[3rem] flex items-center gap-6 hover:border-red-600/40 transition-all group">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-all">＋</div>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 group-hover:text-zinc-200">Nova Missão</span>
                  </button>
                )}
              </div>
              {showQuestCreator && <QuestStepper onCancel={()=>setShowQuestCreator(false)} onComplete={data => {
                const task: Task = { ...data, id: Math.random().toString(36).substr(2,9), startTime: null, accumulatedTimeMs: 0, isPaused: false, done: false, createdAt: Date.now() };
                updateAndSave({...user, tasks: [task, ...user.tasks]});
                setShowQuestCreator(false);
              }} />}
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700">Mural de Contratos</h3>
                 {user.tasks.filter(t => !t.done).map(task => {
                   const config = RARITIES[task.rarity] || RARITIES.comum;
                   return (
                     <div key={task.id} className={`p-8 rounded-[2.5rem] border-2 ${config.color} ${config.bg} shadow-xl flex flex-col md:flex-row items-center gap-6`}>
                        <div className="flex-1 space-y-2">
                           <h3 className="text-3xl font-rpg font-black">{task.title}</h3>
                           <div className="flex gap-4">
                              <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">💰 {config.gold} Ouro</span>
                              <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">✨ {config.xp} XP</span>
                           </div>
                        </div>
                        <button onClick={()=>handleStartTask(task.id)} className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all text-[10px]">Iniciar</button>
                     </div>
                   );
                 })}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-12">
               <h2 className="text-5xl font-rpg text-center uppercase">Refúgio do <span className="text-red-500">Herói</span></h2>
               <div className="bg-zinc-900/40 p-10 rounded-[4rem] border border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Codinome</label>
                        <input type="text" value={user.nickname} onChange={e => updateAndSave({...user, nickname: e.target.value})} className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 font-bold text-white focus:border-red-600 outline-none" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status Atuais</label>
                        <div className="space-y-4">
                           <StatsBar label="Força" current={85} max={100} color="bg-orange-600" />
                           <StatsBar label="Destreza" current={40} max={100} color="bg-indigo-600" />
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center justify-center">
                     <div className="w-56 h-56 bg-zinc-950 rounded-[3rem] border-2 border-zinc-800 flex items-center justify-center shadow-inner relative">
                        <HeroAvatar appearance={user.appearance} user={user} size={180} />
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
  const labels: Record<EquipmentSlot, string> = { head: 'CABEÇA', body: 'CORPO', acc1: 'ACES. 1', acc2: 'ACES. 2', special: 'ESPECIAL' };
  const rarity = item ? (RARITIES[item.rarity] || RARITIES.comum) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        onClick={() => item && onSelect(item)}
        className={`w-16 h-16 md:w-24 md:h-24 rounded-[2.5rem] border-2 flex flex-col items-center justify-center transition-all relative cursor-pointer shadow-2xl
          ${item 
            ? (item.rarity === 'lendario' 
                ? 'animate-equip-legendary border-amber-500 scale-110 z-20' 
                : (rarity?.color.split(' ')[1] + ' ' + rarity?.bg + ' animate-equip scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)]')) 
            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/60'}
        `}
      >
        <span className="text-3xl md:text-5xl drop-shadow-2xl transition-transform group-hover:scale-110">{item ? item.icon : icons[slot]}</span>
        {item && <div className="absolute inset-0 rounded-[2.5rem] ring-4 ring-white/5" />}
      </div>
      <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em] text-center whitespace-nowrap mt-1">{labels[slot]}</span>
    </div>
  );
};

export default App;
