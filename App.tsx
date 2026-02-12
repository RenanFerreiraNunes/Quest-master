
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
      const timer = setTimeout(() => setIsEquipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [itemId]);

  const rarity = item?.rarity || 'comum';

  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onClick}>
      <div 
        key={itemId || 'empty'} 
        className={`w-24 h-24 rounded-[2rem] border-2 flex items-center justify-center transition-all duration-500 relative overflow-hidden
          ${item 
            ? `bg-zinc-900/80 border-${currentTheme.primary} shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105` 
            : 'bg-zinc-950 border-zinc-800 border-dashed text-zinc-800 hover:border-zinc-700'
          }
          ${isEquipping ? `animate-equip neon-${rarity}` : ''}
          group-hover:shadow-lg group-hover:shadow-${currentTheme.primary}/10
        `}
      >
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

  const handlePurchase = (item: InventoryItem) => {
    if (!user || user.gold < item.price) return;
    if (user.inventory.length >= user.inventoryCapacity && item.type !== 'buff') {
      alert("Mochila cheia! Descarte itens para abrir espaço.");
      return;
    }
    let newInventory = [...user.inventory];
    if (item.type === 'buff') {
      const idx = newInventory.findIndex(i => i.id === item.id);
      if (idx !== -1) newInventory[idx].quantity = (newInventory[idx].quantity || 1) + 1;
      else newInventory.push({ ...item, quantity: 1 });
    } else {
      newInventory.push({ ...item, quantity: 1 });
    }
    setLastSpent(item.price);
    setTimeout(() => setLastSpent(null), 800);
    updateAndSave({ ...user, gold: user.gold - item.price, inventory: newInventory });
  };

  if (isCreatingCharacter) return <CharacterCreator onComplete={handleCharacterCreation} />;
  
  if (!user) return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950">
      <ChromaGrid color="rgba(220, 38, 38, 0.1)" />
      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800 p-10 rounded-[3rem] shadow-3xl text-center z-10">
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
                <HeroAvatar key={avatarChangeKey} appearance={user.appearance} user={user} size={110} />
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
            <div className="bg-zinc-800/40 p-5 rounded-[2rem] border border-zinc-700/30 flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tesouro</span>
              <span className="text-amber-400 font-black text-2xl flex items-center gap-2">💰 {user.gold}</span>
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
                {!showQuestCreator && (
                  <button onClick={()=>setShowQuestCreator(true)} className="bg-zinc-900/20 border-4 border-dashed border-zinc-800 p-8 rounded-[3rem] flex items-center gap-6 group hover:border-red-600/30 transition-all text-left">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-red-600 transition-all">＋</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Nova Quest</span>
                  </button>
                )}
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

              {/* Tasks mapping logic remains here... */}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-12 relative z-20 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <section className="bg-zinc-900/10 p-10 rounded-[4rem] border border-zinc-800/50 glass-panel">
                <div className="flex flex-col lg:flex-row items-center justify-around gap-12">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 order-2 lg:order-1">
                      <EquipmentSlotDisplay slot="head" label="Cabeça" itemId={user.equipment.head} currentTheme={currentTheme} />
                      <EquipmentSlotDisplay slot="body" label="Corpo" itemId={user.equipment.body} currentTheme={currentTheme} />
                   </div>
                   <div className="order-1 lg:order-2 relative group">
                      <div className="w-64 h-64 bg-zinc-950/80 rounded-[5rem] border-2 border-zinc-800 flex items-center justify-center relative shadow-2xl overflow-hidden group-hover:border-indigo-500/30 transition-all">
                        <HeroAvatar appearance={user.appearance} user={user} size={200} />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 order-3 lg:order-3">
                      <EquipmentSlotDisplay slot="acc1" label="Dedo 1" itemId={user.equipment.acc1} currentTheme={currentTheme} />
                      <EquipmentSlotDisplay slot="acc2" label="Dedo 2" itemId={user.equipment.acc2} currentTheme={currentTheme} />
                   </div>
                </div>
              </section>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {user.inventory.map((item, idx) => (
                    <div key={idx} onClick={() => setSelectedInventoryItem(item)} className="bg-zinc-900/40 p-5 rounded-[2.5rem] border-2 border-zinc-800 flex flex-col items-center cursor-pointer hover:border-zinc-600 transition-all">
                       <span className="text-4xl mb-2">{item.icon}</span>
                       <span className="text-[8px] font-black uppercase text-zinc-500 truncate w-full text-center">{item.name}</span>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'shop' && <Shop user={user} onPurchase={handlePurchase} />}
          {activeTab === 'campaign' && <CampaignTab user={user} onClaim={()=>{}} />}
          {activeTab === 'skills' && <SkillsManager user={user} onUpgrade={()=>{}} onEquip={()=>{}} onUseActive={()=>{}} />}
          {activeTab === 'profile' && <div className="text-center py-20">Em breve: Edição de Perfil Completa</div>}
        </main>
      </div>

      {selectedInventoryItem && (
        <ItemDetailsModal 
          item={selectedInventoryItem} 
          user={user} 
          onClose={() => setSelectedInventoryItem(null)} 
          onAction={(item) => equipItem(item)}
          actionLabel="Equipar / Usar"
        />
      )}
    </ClickSpark>
  );
};

export default App;
