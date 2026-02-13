
import { User, Guild } from '../types';

const USERS_KEY = 'questmaster_users';
const SESSION_KEY = 'questmaster_session';
const GUILDS_KEY = 'questmaster_guilds';

// Simulação de delay de rede para teste de UX
const networkDelay = () => new Promise(resolve => setTimeout(resolve, 300));

export const db = {
  // Helpers internos para garantir integridade
  _getRawUsers: () => JSON.parse(localStorage.getItem(USERS_KEY) || '{}'),
  _getRawGuilds: () => JSON.parse(localStorage.getItem(GUILDS_KEY) || '[]'),

  getUser: (email: string): User | null => {
    const users = db._getRawUsers();
    const user = users[email] || null;
    if (user) {
      // Garante que campos críticos sejam arrays
      user.friends = user.friends || [];
      user.friendRequests = user.friendRequests || [];
      user.inventory = user.inventory || [];
      user.tasks = user.tasks || [];
    }
    return user;
  },

  getAllUsers: (): User[] => {
    const users = db._getRawUsers();
    return Object.values(users).map((u: any) => ({
      ...u,
      friends: u.friends || [],
      friendRequests: u.friendRequests || []
    }));
  },

  saveUser: (user: User) => {
    const users = db._getRawUsers();
    users[user.email] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('storage_sync'));
  },

  setSession: (email: string) => {
    localStorage.setItem(SESSION_KEY, email);
  },

  getSession: (): string | null => {
    return localStorage.getItem(SESSION_KEY);
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Exportar/Importar Alma
  exportHero: (email: string): string | null => {
    const user = db.getUser(email);
    if (!user) return null;
    return btoa(unescape(encodeURIComponent(JSON.stringify(user))));
  },

  importHero: (code: string): boolean => {
    try {
      const userData: User = JSON.parse(decodeURIComponent(escape(atob(code))));
      if (!userData.email || !userData.nickname) return false;
      db.saveUser(userData);
      return true;
    } catch (e) {
      console.error("Erro ao importar herói:", e);
      return false;
    }
  },

  // Sistema de Amizade (Simulação de Real-time)
  sendFriendRequest: (fromEmail: string, toEmail: string) => {
    const toUser = db.getUser(toEmail);
    const fromUser = db.getUser(fromEmail);
    if (!toUser || !fromUser || fromEmail === toEmail) return;

    if (toUser.friendRequests.some(r => r.fromEmail === fromEmail)) return;
    if (toUser.friends.includes(fromEmail)) return;

    toUser.friendRequests.push({
      fromEmail: fromUser.email,
      fromNickname: fromUser.nickname,
      status: 'pending'
    });
    db.saveUser(toUser);
  },

  acceptFriendRequest: (userEmail: string, fromEmail: string) => {
    const user = db.getUser(userEmail);
    const fromUser = db.getUser(fromEmail);
    if (!user || !fromUser) return;

    user.friendRequests = user.friendRequests.filter(r => r.fromEmail !== fromEmail);
    
    if (!user.friends.includes(fromEmail)) user.friends.push(fromEmail);
    if (!fromUser.friends.includes(userEmail)) fromUser.friends.push(userEmail);
    
    db.saveUser(user);
    db.saveUser(fromUser);
  },

  // Guildas
  getAllGuilds: (): Guild[] => {
    return db._getRawGuilds();
  },

  saveGuilds: (guilds: Guild[]) => {
    localStorage.setItem(GUILDS_KEY, JSON.stringify(guilds));
    window.dispatchEvent(new Event('storage_sync'));
  },

  createGuild: (name: string, masterEmail: string, icon: string, description: string) => {
    const guilds = db.getAllGuilds();
    const user = db.getUser(masterEmail);
    if (!user || user.gold < 500) return null;

    const newGuild: Guild = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      icon,
      masterEmail,
      memberEmails: [masterEmail],
      totalXp: user.xp,
      description,
      requiredLevel: 1
    };

    guilds.push(newGuild);
    db.saveGuilds(guilds);
    
    user.gold -= 500;
    user.guildId = newGuild.id;
    db.saveUser(user);
    
    return newGuild;
  },

  joinGuild: (guildId: string, userEmail: string) => {
    const guilds = db.getAllGuilds();
    const guildIndex = guilds.findIndex(g => g.id === guildId);
    const user = db.getUser(userEmail);
    
    if (guildIndex === -1 || !user || user.guildId) return;

    guilds[guildIndex].memberEmails.push(userEmail);
    guilds[guildIndex].totalXp += user.xp;
    user.guildId = guildId;
    
    db.saveGuilds(guilds);
    db.saveUser(user);
  },

  leaveGuild: (userEmail: string) => {
    const user = db.getUser(userEmail);
    if (!user || !user.guildId) return;

    const guilds = db.getAllGuilds();
    const guildIndex = guilds.findIndex(g => g.id === user.guildId);
    if (guildIndex !== -1) {
      guilds[guildIndex].memberEmails = guilds[guildIndex].memberEmails.filter(e => e !== userEmail);
      guilds[guildIndex].totalXp = Math.max(0, guilds[guildIndex].totalXp - user.xp);
      
      if (guilds[guildIndex].masterEmail === userEmail) {
        if (guilds[guildIndex].memberEmails.length > 0) {
          guilds[guildIndex].masterEmail = guilds[guildIndex].memberEmails[0];
        } else {
          guilds.splice(guildIndex, 1);
        }
      }
    }

    user.guildId = null;
    db.saveGuilds(guilds);
    db.saveUser(user);
  },

  addGuildXp: (guildId: string, amount: number) => {
    const guilds = db.getAllGuilds();
    const guildIndex = guilds.findIndex(g => g.id === guildId);
    if (guildIndex !== -1) {
      guilds[guildIndex].totalXp += amount;
      db.saveGuilds(guilds);
    }
  }
};
