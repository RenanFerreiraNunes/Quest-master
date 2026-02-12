
import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, Rarity, InventoryItem, Difficulty, CharacterClass, Appearance, EquipmentSlot, Skill } from './types';
import { db } from './services/db';
import { geminiService } from './services/gemini';
import { RARITIES, DIFFICULTIES, CLASSES, THEMES, INITIAL_SKILLS, CLASS_STATS, SHOP_ITEMS, CAMPAIGN_CHAPTERS, BASE_INVENTORY_CAPACITY } from './constants';
import StatsBar from './components/StatsBar';
import Shop from './components/Shop';
import HeroAvatar from './components/HeroAvatar';
import ChromaGrid from './components/ChromaGrid';
import ClickSpark from './components/ClickSpark';
import ElectricBorder from './components/ElectricBorder';
import QuestStepper from './components/QuestStepper';
import SkillsManager from './components/SkillsManager';
import CharacterCreator from './components/CharacterCreator';
import CampaignTab from './components/CampaignTab';
import ItemDetailsModal from './components/ItemDetailsModal';

const EquipmentSlotDisplay: React.FC<{
  slot: EquipmentSlot;
  label: string;
  itemId: string | null;
  currentTheme: any;
  onClick?: () => void;
}> = ({ slot, label, itemId, currentTheme, onClick }) => {
  const item = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null;
  const [isEquipping, setIsEquipping] = useState(false);

  // Trigger animation whenever the itemId changes (equipping a new item)
  useEffect(() => {
    if (itemId) {
      setIsEquipping(true);
      const timer = setTimeout(() => setIsEquipping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [itemId]);

  const getRarityClass = () => {
    if (!item) return "";
    const rarity = (item as any).rarity || 'comum'; // Check if item has explicit rarity or assume based on ID/context if needed, but here we use SHOP_ITEMS which don't have Rarity field in types, let's fix that or use defaults.
    // However, in our constants.tsx, shop items don't have explicit rarities, but we can infer them or add them.
    // Let's assume some defaults for the equipment if rarity isn't explicitly in the item type.
    if (item.id.includes('legend')) return 'lendario';
    if (item.price >= 500) return 'epico';
    if (item.price >= 150) return 'raro';
    return 'comum';
  };

  const rarity = getRarityClass();

  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onClick}>
      <div 
        key={itemId || 'empty'} 
        className={`w-24 h-24 rounded-[2rem] border-2 flex items-center justify-center transition-all duration-500 relative overflow-hidden
          ${item 
            ? `bg-zinc-900/80 border-${currentTheme.primary} shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105` 
            : 'bg-zinc-950 border-zinc-800 border-dashed text-zinc-800 hover:border-zinc-700'
          }
          ${isEquipping ? `animate-equip animate-neon-${rarity}` : ''}
          group-hover:shadow-lg group-hover:shadow-${currentTheme.primary}/10
        `}
      >
        {/* Slot Glow/Flash overlay during animation */}
        {isEquipping && (
          <div className={`absolute inset-0 bg-${currentTheme.primary} opacity-20 animate-pulse z-0`} />
        )}
        
        {item && (
          <div className={`absolute inset-0 bg-gradient-to-br from-${currentTheme.primary}/10 to-transparent opacity-50`} />
        )}
        
        {item ? (
          <div className="flex flex-col items-center gap-1 z-10">
            <span className="text-4xl drop-shadow-2xl transform transition-transform group-hover:scale-110">{item.icon}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="text-xl">🕳️</span>
            <span className="text-[7px] font-black uppercase tracking-[0.2em]">{label}</span>
          </div>
        )}
        <div className={`absolute inset-0 border-2 border-transparent group-hover:border-${currentTheme.primary}/20 rounded-[2rem] transition-all`} />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] group-hover:text-zinc-300 transition-colors">{label}</span>
        {item && <span className="text-[7px] text-indigo-400 font-bold uppercase truncate max-w-[80px]">{item.name}</span>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'quests' | 'campaign' | 'shop' | 'inventory' | 'profile' | 'skills'>('quests');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [avatarChangeKey, setAvatarChangeKey] = useState(0);
  const [lastSpent, setLastSpent] = useState<number | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  
  const [aiMessage, setAiMessage] = useState<string>('O mestre da guilda observa sua coragem...');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const currentTheme = THEMES[user?.activeTheme as keyof typeof THEMES] || THEMES['theme-default'];

  const getThemeColor = () => {
    switch(user?.activeTheme) {
      case 'theme-emerald': return '#10b981';
      case 'theme-arcane': return '#6366f1';
      default: return '#dc2626';
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sessionEmail = db.getSession();
    if (sessionEmail) {
      const userData = db.getUser(sessionEmail);
      if (userData) {
        if (!userData.charClass) {
          setIsCreatingCharacter(true);
        } else {
          if (userData.inventoryCapacity === undefined) {
             userData.inventoryCapacity = BASE_INVENTORY_CAPACITY;
          }
          setUser(userData);
          fetchAiGreeting(userData);
        }
      }
    }
  }, []);

  const fetchAiGreeting = async (u: User) => {
    const msg = await geminiService.getMotivationalMessage(u.nickname, u.level, u.tasks.filter(t => !t.done).length);
    setAiMessage(msg);
  };

  const updateAndSave = useCallback((updated: User) => {
    setUser(updated);
    db.saveUser(updated);
  }, []);

  const handleSuggestQuest = async () => {
    if (!user) return;
    setIsSuggesting(true);
    const tasksTitles = user.tasks.map(t => t.title);
    const suggestion = await geminiService.suggestQuest(tasksTitles);
    if (suggestion && suggestion.title) {
      const task: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: suggestion.title,
        rarity: (suggestion.rarity as Rarity) || 'raro',
        difficulty: 'medio',
        durationMinutes: 30,
        startTime: null,
        done: false,
        createdAt: Date.now()
      };
      updateAndSave({ ...user, tasks: [task, ...user.tasks] });
    }
    setIsSuggesting(false);
  };

  const handleLogin = () => {
    if (!email) return;
    let existing = db.getUser(email);
    if (!existing) {
      setIsCreatingCharacter(true);
    } else {
      db.setSession(email);
      if (existing.inventoryCapacity === undefined) existing.inventoryCapacity = BASE_INVENTORY_CAPACITY;
      setUser(existing);
      fetchAiGreeting(existing);
    }
  };

  const handleCharacterCreation = (data: { nickname: string, charClass: CharacterClass, appearance: Appearance }) => {
    const initialStats = CLASS_STATS[data.charClass];
    const newUser: User = {
      email, nickname: data.nickname, charClass: data.charClass, avatar: '🛡️', appearance: data.appearance,
      xp: 0, level: 1, gold: 100, hp: initialStats.hp, maxHp: initialStats.hp, inventoryCapacity: BASE_INVENTORY_CAPACITY,
      activeTheme: 'theme-default', tasks: [], inventory: [], skills: INITIAL_SKILLS, equippedSkills: [],
      equipment: { head: null, body: null, acc1: null, acc2: null, special: null }, campaignProgress: 0
    };
    db.saveUser(newUser);
    db.setSession(email);
    setUser(newUser);
    setIsCreatingCharacter(false);
    fetchAiGreeting(newUser);
  };

  const equipItem = (item: InventoryItem) => {
    if (!user) return;
    setAvatarChangeKey(prev => prev + 1);
    if (item.type === 'skin') {
      const currentSkin = user.appearance.outfitId;
      updateAndSave({ ...user, appearance: { ...user.appearance, outfitId: currentSkin === item.id ? undefined : item.id } });
      return;
    }
    if (!item.slot) return;
    const newEquipment = { ...user.equipment };
    newEquipment[item.slot] = newEquipment[item.slot] === item.id ? null : item.id;
    updateAndSave({ ...user, equipment: newEquipment });
  };

  const useConsumable = (item: InventoryItem) => {
    if (!user || item.type !== 'buff') return;
    
    // Lógica de cura baseada no ID (Maçã ou Poção)
    const healAmount = item.id === 'potion-0' ? 5 : item.id === 'potion-1' ? 20 : 0;
    const newHp = Math.min(user.maxHp, user.hp + healAmount);

    // Decrementar quantidade ou remover do inventário
    let newInventory = [...user.inventory];
    const itemIdx = newInventory.findIndex(i => i.id === item.id);
    
    if (itemIdx !== -1) {
      const currentQty = newInventory[itemIdx].quantity || 1;
      if (currentQty > 1) {
        newInventory[itemIdx] = { ...newInventory[itemIdx], quantity: currentQty - 1 };
      } else {
        newInventory.splice(itemIdx, 1);
      }
    }

    updateAndSave({ ...user, hp: newHp, inventory: newInventory });
  };

  const completeTask = (task: Task) => {
    if (!user || task.done || !task.startTime) return;
    const rConfig = RARITIES[task.rarity];
    const dConfig = DIFFICULTIES[task.difficulty];
    const classBase = CLASS_STATS[user.charClass];
    let xpMult = classBase.xpMod;
    let goldMult = classBase.goldMod;

    Object.values(user.equipment).forEach(id => {
      if (!id) return;
      const item = SHOP_ITEMS.find(i => i.id === id);
      if (item?.statBoost === 'XP') xpMult += (item.boostValue || 0) / 100;
      if (item?.statBoost === 'Gold') goldMult += (item.boostValue || 0) / 100;
    });

    const earnedXp = Math.floor(rConfig.xp * dConfig.multiplier * xpMult);
    const earnedGold = Math.floor(rConfig.gold * dConfig.multiplier * goldMult);
    let newXp = user.xp + earnedXp;
    let newLevel = user.level;
    while (newXp >= newLevel * 200) { newXp -= (newLevel * 200); newLevel++; }
    updateAndSave({ ...user, tasks: user.tasks.map(t => t.id === task.id ? { ...t, done: true } : t), xp: newXp, level: newLevel, gold: user.gold + earnedGold });
  };

  const handleClaimCampaign = (missionId: string) => {
    if (!user) return;
    const mission = CAMPAIGN_CHAPTERS.find(m => m.id === missionId);
    if (!mission) return;
    let newXp = user.xp + mission.xpReward;
    let newLevel = user.level;
    while (newXp >= newLevel * 200) { newXp -= (newLevel * 200); newLevel++; }
    updateAndSave({ ...user, xp: newXp, level: newLevel, gold: user.gold + mission.goldReward, campaignProgress: user.campaignProgress + 1 });
  };

  const handleSkillUpgrade = (skillId: string) => {
    if (!user) return;
    const skill = user.skills.find(s => s.id === skillId);
    if (!skill || skill.level >= skill.maxLevel) return;
    const cost = Math.floor(skill.xpCostBase * Math.pow(1.5, skill.level));
    if (user.xp < cost) return;
    const updatedSkills = user.skills.map(s => s.id === skillId ? { ...s, level: s.level + 1 } : s);
    updateAndSave({ ...user, xp: user.xp - cost, skills: updatedSkills });
  };

  const formatQuestTimer = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePurchase = (item: InventoryItem) => {
    if (!user || user.gold < item.price) return;

    let newInventory = [...user.inventory];
    const stackable = item.type === 'buff';
    const existingIdx = newInventory.findIndex(i => i.id === item.id);

    if (stackable && existingIdx !== -1) {
      // Incrementar Stack
      newInventory[existingIdx] = { 
        ...newInventory[existingIdx], 
        quantity: (newInventory[existingIdx].quantity || 1) + 1 
      };
    } else {
      // Novo Item
      if (newInventory.length >= user.inventoryCapacity) {
        alert("Mochila cheia! Descarte itens para abrir espaço.");
        return;
      }
      newInventory.push({ ...item, quantity: 1 });
    }

    setLastSpent(item.price);
    setTimeout(() => setLastSpent(null), 800);
    updateAndSave({ ...user, gold: user.gold - item.price, inventory: newInventory });
  };

  const getComparison = (item: InventoryItem) => {
    if (item.type !== 'equipment' || !item.slot) return null;
    const equippedId = user?.equipment[item.slot];
    const equippedItem = equippedId ? SHOP_ITEMS.find(i => i.id === equippedId) : null;
    const currentVal = equippedItem?.boostValue || 0;
    const newVal = item.boostValue || 0;
    return { current: currentVal, new: newVal, diff: newVal - currentVal };
  };

  if (isCreatingCharacter) return <CharacterCreator onComplete={handleCharacterCreation} />;
  if (!user) return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.1)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800 p-10 rounded-[3rem] shadow-3xl text-center">
        <h1 className="text-5xl font-rpg mb-10 tracking-tighter text-white font-black uppercase">QUEST<span className="text-red-600">MASTER</span></h1>
        <input type="email" placeholder="Email do Herói" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white mb-4 outline-none focus:ring-2 focus:ring-red-600 text-center" value={email} onChange={e => setEmail(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-red-600 hover:bg-red-500 py-5 rounded-2xl font-black text-white shadow-2xl uppercase tracking-[0.3em] text-xs transition-all active:scale-95">Entrar no Reino</button>
      </div>
    </div>
  );

  return (
    <ClickSpark>
      <div className={`h-screen flex flex-col md:flex-row text-zinc-100 ${currentTheme.bg} transition-colors duration-1000 overflow-hidden`}>
        <aside className="w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 p-6 flex flex-col h-full overflow-y-auto z-20 scrollbar-hide">
          <div className="flex flex-col items-center mb-10 gap-6">
            <div className="relative group">
              <div className={`w-36 h-36 rounded-[3.5rem] bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shadow-3xl overflow-hidden transition-all group-hover:scale-105`}>
                <HeroAvatar key={avatarChangeKey} appearance={user.appearance} user={user} size={110} className={avatarChangeKey > 0 ? "animate-equip" : ""} />
              </div>
              <div className={`absolute -top-3 -right-3 w-12 h-12 bg-${currentTheme.primary} rounded-2xl border-4 border-zinc-900 flex items-center justify-center text-xl shadow-2xl animate-bounce`}>{user.avatar}</div>
            </div>
            <div className="text-center">
              <h1 className="font-rpg text-3xl font-black leading-none">{user.nickname}</h1>
              <p className={`text-[9px] uppercase font-black tracking-[0.4em] mt-3 ${currentTheme.text}`}>NÍVEL {user.level}</p>
            </div>
          </div>
          <div className="space-y-6 flex-1">
            <StatsBar label="Vitalidade" current={user.hp} max={user.maxHp} color="bg-red-600" icon="❤️" />
            <StatsBar label="Alma (XP)" current={user.xp} max={user.level * 200} color={`bg-${currentTheme.primary}`} icon="✨" />
            <div className={`relative bg-zinc-800/40 p-5 rounded-[2rem] border transition-all duration-300 flex justify-between items-center ${lastSpent ? 'border-red-500/50 bg-red-900/10 scale-[0.98]' : 'border-zinc-700/30'}`}>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tesouro</span>
              <div className="flex items-center gap-2 relative">
                <span className={`text-amber-400 font-black text-2xl flex items-center gap-2 transition-colors ${lastSpent ? 'text-red-400' : ''}`}>
                  💰 {user.gold}
                </span>
                {lastSpent && (
                  <span className="absolute -top-6 right-0 text-red-500 font-black text-sm animate-float-up-red">
                    -{lastSpent}
                  </span>
                )}
              </div>
            </div>
            <div className={`bg-${currentTheme.primary}/5 border border-${currentTheme.primary}/20 rounded-[2rem] p-6 italic text-xs ${currentTheme.text}`}>"{aiMessage}"</div>
          </div>
          <button onClick={() => { db.logout(); window.location.reload(); }} className="mt-8 py-4 rounded-2xl border border-zinc-800 text-[9px] font-black uppercase text-zinc-600 hover:text-red-500 tracking-[0.3em]">Retirar-se do Reino</button>
        </aside>

        <main className="flex-1 overflow-y-auto relative p-4 md:p-10 z-10 scrollbar-hide">
          <ChromaGrid color={currentTheme.primary === 'red-600' ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255,255,255,0.03)'} />
          <nav className="flex items-center gap-4 mb-12 overflow-x-auto pb-6 sticky top-0 z-40 bg-zinc-950/20 backdrop-blur-md">
            {[{id:'quests',l:'Quests',i:'⚔️'},{id:'campaign',l:'Campanha',i:'🗺️'},{id:'skills',l:'Poderes',i:'🔥'},{id:'shop',l:'Bazar',i:'💎'},{id:'inventory',l:'Mochila',i:'🎒'},{id:'profile',l:'Perfil',i:'🎭'}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 shrink-0 ${activeTab===tab.id?'bg-white text-black shadow-3xl scale-105':'bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800'}`}>
                <span className="text-2xl">{tab.i}</span> {tab.l}
              </button>
            ))}
          </nav>

          {activeTab === 'quests' && (
            <div className="max-w-5xl mx-auto space-y-12 relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!showQuestCreator ? (
                  <button onClick={()=>setShowQuestCreator(true)} className="bg-zinc-900/20 border-4 border-dashed border-zinc-800 p-8 rounded-[3rem] flex items-center gap-6 group hover:border-red-600/30 transition-all text-left">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-red-600 transition-all">＋</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Nova Quest</span>
                  </button>
                ) : null}
                
                <button 
                  disabled={isSuggesting}
                  onClick={handleSuggestQuest} 
                  className={`bg-zinc-900/20 border-4 border-dashed border-zinc-800 p-8 rounded-[3rem] flex items-center gap-6 group hover:border-indigo-600/30 transition-all text-left ${isSuggesting ? 'animate-pulse opacity-50' : ''}`}
                >
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-indigo-600 transition-all">🔮</div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    {isSuggesting ? 'O Oráculo Medita...' : 'Consultar Oráculo'}
                  </span>
                </button>
              </div>

              {showQuestCreator && (
                <QuestStepper 
                  onComplete={data => { 
                    updateAndSave({
                      ...user, 
                      tasks:[{
                        id:Math.random().toString(36).substr(2,9),
                        title: data.title,
                        rarity: data.rarity,
                        difficulty: data.difficulty,
                        durationMinutes: data.duration, 
                        startTime:null,
                        done:false,
                        createdAt:Date.now()
                      },...user.tasks]
                    }); 
                    setShowQuestCreator(false); 
                  }} 
                  onCancel={()=>setShowQuestCreator(false)} 
                />
              )}

              <div className="space-y-8">
                {user.tasks.map(task => {
                  const config = RARITIES[task.rarity];
                  const diff = DIFFICULTIES[task.difficulty];
                  let progress = 0; let timeLeftSeconds = 0;
                  const dMinutes = task.durationMinutes || 0;
                  if (task.startTime && !task.done) {
                    const elapsedMs = currentTime - task.startTime;
                    const totalMs = dMinutes * 60 * 1000;
                    progress = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 100;
                    timeLeftSeconds = totalMs > 0 ? Math.max(0, Math.floor((totalMs - elapsedMs) / 1000)) : 0;
                  }
                  const canComplete = progress >= 100;

                  const cardContent = (
                    <div className={`p-6 md:p-8 border-2 ${config.color} ${config.bg} rounded-[3rem] relative transition-all group hover:scale-[1.01] overflow-hidden ${task.done?'opacity-30 grayscale':''}`}>
                      <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                        <div className="flex-1 space-y-5">
                          <div className="flex items-start md:items-center gap-4">
                            <span className="text-4xl shrink-0 filter drop-shadow-md">{task.rarity === 'lendario' ? '👑' : task.rarity === 'epico' ? '💎' : task.rarity === 'raro' ? '🛡️' : '📜'}</span>
                            <div className="flex flex-col">
                              <h3 className="text-2xl md:text-3xl font-black font-rpg tracking-tight break-words leading-tight">{task.title}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-950/50 border border-zinc-800 ${config.color.split(' ')[0]}`}>{task.rarity}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Dificuldade: {diff.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                                    <span className="text-amber-500">💰 {Math.floor(config.gold * diff.multiplier)} G</span>
                                    <span className="text-indigo-400">✨ {Math.floor(config.xp * diff.multiplier)} XP</span>
                                </div>
                                <span className="flex items-center gap-2">⏳ {dMinutes}min de Foco</span>
                            </div>
                            {task.startTime && !task.done && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end text-[8px] font-black uppercase tracking-widest">
                                        <span className="text-zinc-500">Progresso da Jornada</span>
                                        <span className={canComplete ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}>{Math.floor(progress)}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-zinc-950/80 rounded-full border border-zinc-800/50 p-0.5 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 relative ${canComplete ? 'animate-pulse' : ''}`} style={{ width: `${progress}%`, backgroundColor: getThemeColor() }}>
                                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                                        </div>
                                    </div>
                                </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800/50">
                          {!task.done && (
                            !task.startTime ? (
                              <button onClick={()=>updateAndSave({...user,tasks:user.tasks.map(t=>t.id===task.id?{...t,startTime:Date.now()}:t)})} className="w-full sm:w-auto px-10 py-5 bg-white text-black text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Aceitar Quest</button>
                            ) : (
                              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
                                <div className="flex flex-col items-center sm:items-start bg-zinc-950/40 p-3 px-5 rounded-2xl border border-zinc-800/50 w-full sm:w-auto">
                                    <span className="text-[7px] text-zinc-600 uppercase font-black mb-1">Restante</span>
                                    <span className={`text-2xl md:text-3xl font-mono font-black tabular-nums ${timeLeftSeconds < 60 ? 'text-red-500 animate-pulse' : 'text-zinc-100'}`}>{formatQuestTimer(timeLeftSeconds)}</span>
                                </div>
                                <button disabled={!canComplete} onClick={()=>completeTask(task)} className={`w-full sm:w-auto px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${canComplete ? 'bg-white text-black animate-pulse shadow-2xl' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>{canComplete ? 'Finalizar' : 'Em Jornada'}</button>
                              </div>
                            )
                          )}
                          <button onClick={()=>updateAndSave({...user,tasks:user.tasks.filter(t=>t.id!==task.id)})} className="absolute top-2 right-2 md:relative md:top-0 md:right-0 p-3 text-zinc-800 hover:text-red-500 transition-colors">✕</button>
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <div key={task.id} className="w-full">
                      {(task.rarity === 'lendario' || task.difficulty === 'dificil') && !task.done ? (
                        <ElectricBorder color={task.rarity === 'lendario' ? '#fbbf24' : '#ef4444'}>{cardContent}</ElectricBorder>
                      ) : cardContent}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-12 relative z-20 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-10 gap-8">
                <div>
                  <h2 className="text-5xl md:text-7xl font-rpg uppercase leading-none">Cofre de <span className={currentTheme.text}>Guerra</span></h2>
                  <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4">Organize seus tesouros e fortaleça sua lenda</p>
                </div>
                <div className="w-full md:w-64 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span>Ocupação</span>
                    <span>{user.inventory.length} / {user.inventoryCapacity}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div className={`h-full bg-indigo-500 transition-all duration-1000`} style={{width:`${(user.inventory.length/user.inventoryCapacity)*100}%`}} />
                  </div>
                </div>
              </header>

              <section className="bg-zinc-900/10 p-10 rounded-[4rem] border border-zinc-800/50 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row items-center justify-around gap-12">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 order-2 lg:order-1">
                      <EquipmentSlotDisplay slot="head" label="Cabeça" itemId={user.equipment.head} currentTheme={currentTheme} />
                      <EquipmentSlotDisplay slot="body" label="Corpo" itemId={user.equipment.body} currentTheme={currentTheme} />
                   </div>
                   <div className="order-1 lg:order-2 relative group">
                      <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full scale-150 animate-pulse"></div>
                      <div className="w-64 h-64 bg-zinc-950/80 rounded-[5rem] border-2 border-zinc-800 flex items-center justify-center relative shadow-2xl overflow-hidden group-hover:border-indigo-500/30 transition-all">
                        <HeroAvatar appearance={user.appearance} user={user} size={200} />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 px-6 py-2 rounded-full border border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-400 shadow-xl whitespace-nowrap">
                         Visual de Combate
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 order-3 lg:order-3">
                      <EquipmentSlotDisplay slot="acc1" label="Dedo 1" itemId={user.equipment.acc1} currentTheme={currentTheme} />
                      <EquipmentSlotDisplay slot="acc2" label="Dedo 2" itemId={user.equipment.acc2} currentTheme={currentTheme} />
                      <div className="sm:col-span-2 flex justify-center">
                        <EquipmentSlotDisplay slot="special" label="Especial" itemId={user.equipment.special} currentTheme={currentTheme} />
                      </div>
                   </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🎒</span>
                  <h3 className="text-2xl font-rpg uppercase text-zinc-400">Mochila do Aventureiro</h3>
                </div>

                {user.inventory.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/20 border-4 border-dashed border-zinc-800 rounded-[3rem]">
                    <p className="text-zinc-600 font-black uppercase tracking-widest text-xs italic">Sua mochila está vazia. Visite o bazar!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {user.inventory.map((item, idx) => {
                      const isEquipped = item.slot ? user.equipment[item.slot] === item.id : (item.type==='skin'?user.appearance.outfitId===item.id:false);
                      const isConsumable = item.type === 'buff';
                      const comp = getComparison(item);
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedInventoryItem(item)}
                          className={`bg-zinc-900/40 p-5 rounded-[3rem] border-2 flex flex-col items-center text-center group transition-all duration-300 relative overflow-hidden cursor-pointer
                            ${isEquipped ? `border-${currentTheme.primary} bg-zinc-900/80 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105 animate-equip` : 'border-zinc-800 hover:border-zinc-700'}
                          `}
                        >
                          {isEquipped && (
                            <div className={`absolute inset-0 bg-${currentTheme.primary}/5 animate-pulse z-0 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]`} />
                          )}

                          {isEquipped && (
                             <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-${currentTheme.primary} text-white text-[6px] font-black uppercase tracking-widest shadow-xl animate-bounce`}>
                               Equipado
                             </div>
                          )}

                          <div className="relative mb-4 transform transition-transform group-hover:scale-110 drop-shadow-xl z-10">
                            <span className="text-5xl">{item.icon}</span>
                            {item.quantity && item.quantity > 1 && (
                                <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-indigo-400">
                                  x{item.quantity}
                                </span>
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-1 w-full overflow-hidden z-10">
                            <h3 className={`font-black text-[10px] font-rpg truncate w-full px-2 transition-colors ${isEquipped ? 'text-white' : 'text-zinc-400'}`} title={item.name}>{item.name}</h3>
                            <p className="text-[7px] text-zinc-600 uppercase tracking-widest font-black">{item.slot || item.type}</p>
                            
                            {item.statBoost && (
                              <div className="pt-2">
                                <span className="text-[7px] text-indigo-400 font-bold uppercase tracking-tighter">+{item.boostValue}% {item.statBoost}</span>
                                {!isEquipped && comp && comp.diff !== 0 && (
                                   <div className={`text-[6px] font-black ${comp.diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {comp.diff > 0 ? '▲ Melhoria' : '▼ Perda'} ({comp.diff > 0 ? '+' : ''}{comp.diff}%)
                                   </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-6 w-full space-y-2 relative z-10">
                            {isConsumable ? (
                              <button 
                                onClick={(e)=>{ e.stopPropagation(); useConsumable(item); }} 
                                className="w-full py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-all"
                              >
                                Usar
                              </button>
                            ) : (
                              <button 
                                onClick={(e)=>{ e.stopPropagation(); equipItem(item); }} 
                                className={`w-full py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                  isEquipped 
                                    ? `bg-white text-black shadow-xl ring-2 ring-${currentTheme.primary}/20` 
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                              >
                                {isEquipped ? 'Remover' : 'Equipar'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {selectedInventoryItem && (
                <ItemDetailsModal 
                  item={selectedInventoryItem} 
                  user={user} 
                  onClose={() => setSelectedInventoryItem(null)} 
                  onAction={(item) => item.type === 'buff' ? useConsumable(item) : equipItem(item)}
                  actionLabel={selectedInventoryItem.type === 'buff' ? 'Usar Agora' : (user.equipment[selectedInventoryItem.slot!] === selectedInventoryItem.id ? 'Remover' : 'Equipar')}
                />
              )}
            </div>
          )}

          {activeTab === 'profile' && (
             <div className="max-w-4xl mx-auto space-y-12 relative z-20 pb-20">
               <header className="space-y-4">
                 <h2 className="text-4xl md:text-6xl font-rpg uppercase">Refúgio do <span className={currentTheme.text}>Herói</span></h2>
                 <p className="text-zinc-500 font-black uppercase tracking-widest mt-2 text-[10px]">Ajuste seus detalhes e mude seu destino.</p>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-zinc-900/20 p-10 rounded-[4rem] border border-zinc-800 backdrop-blur-sm">
                 <div className="space-y-8">
                   <section className="space-y-4">
                     <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Codinome</label>
                     <input type="text" value={user.nickname} onChange={e => updateAndSave({...user, nickname: e.target.value})} className="w-full bg-zinc-900/50 p-5 rounded-2xl outline-none border border-zinc-800 focus:border-red-600 transition-all font-bold text-white" />
                   </section>
                   <section className="space-y-4">
                     <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Expressão Facial</label>
                     <div className="grid grid-cols-3 gap-3">
                       {['neutral', 'happy', 'focused', 'grin', 'tired'].map(ex => (
                         <button key={ex} onClick={() => updateAndSave({...user, appearance: {...user.appearance, expression: ex as any}})} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${user.appearance.expression === ex ? 'bg-white text-black shadow-lg scale-105' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>{ex}</button>
                       ))}
                     </div>
                   </section>
                   <section className="space-y-4">
                     <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Cores de Combate</label>
                     <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                         <span className="text-[10px] text-zinc-600 uppercase font-black block">Pele</span>
                         <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
                           <input type="color" value={user.appearance.skinColor} onChange={e => updateAndSave({...user, appearance: {...user.appearance, skinColor: e.target.value}})} className="w-10 h-10 rounded-xl bg-zinc-900 p-1 cursor-pointer border-none" />
                           <span className="text-[8px] font-mono text-zinc-500">{user.appearance.skinColor}</span>
                         </div>
                       </div>
                       <div className="space-y-3">
                         <span className="text-[10px] text-zinc-600 uppercase font-black block">Cabelo</span>
                         <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
                           <input type="color" value={user.appearance.hairColor} onChange={e => updateAndSave({...user, appearance: {...user.appearance, hairColor: e.target.value}})} className="w-10 h-10 rounded-xl bg-zinc-900 p-1 cursor-pointer border-none" />
                           <span className="text-[8px] font-mono text-zinc-500">{user.appearance.hairColor}</span>
                         </div>
                       </div>
                     </div>
                   </section>
                 </div>
                 <div className="flex flex-col items-center justify-center gap-8">
                   <div className="w-64 h-64 bg-zinc-950 rounded-[4rem] border-2 border-zinc-800 flex items-center justify-center relative shadow-2xl overflow-hidden group">
                     <div className="absolute inset-0 bg-indigo-500/5 animate-pulse blur-3xl"></div>
                     <HeroAvatar appearance={user.appearance} user={user} size={200} />
                   </div>
                   <div className="text-center space-y-3">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Vocação Atual</p>
                     <span className="px-6 py-2 bg-zinc-950 rounded-full text-indigo-400 font-black text-xs border border-indigo-500/30 uppercase tracking-[0.2em] shadow-lg">{user.charClass}</span>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'shop' && <Shop user={user} onPurchase={handlePurchase} />}
          {activeTab === 'campaign' && <CampaignTab user={user} onClaim={handleClaimCampaign} />}
          {activeTab === 'skills' && <SkillsManager user={user} onUpgrade={handleSkillUpgrade} onEquip={handleSkillUpgrade} onUseActive={handleLogin} />}
        </main>
      </div>
    </ClickSpark>
  );
};

export default App;
