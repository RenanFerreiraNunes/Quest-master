
import { User, Guild } from '../types';

const USERS_KEY = 'questmaster_users';
const SESSION_KEY = 'questmaster_session';
const GUILDS_KEY = 'questmaster_guilds';

export const db = {
  getUser: (email: string): User | null => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return users[email] || null;
  },

  getAllUsers: (): User[] => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return Object.values(users);
  },

  saveUser: (user: User) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    users[user.email] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    // Dispara evento para outras abas saberem que houve mudança
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

  // Sociais
  sendFriendRequest: (fromEmail: string, toEmail: string) => {
    const fromUser = db.getUser(fromEmail);
    const toUser = db.getUser(toEmail);
    if (!fromUser || !toUser || fromEmail === toEmail) return;

    if (!toUser.friendRequests) toUser.friendRequests = [];
    if (toUser.friendRequests.some(r => r.fromEmail === fromEmail)) return;
    if (toUser.friends?.includes(fromEmail)) return;

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

    user.friendRequests = (user.friendRequests || []).filter(r => r.fromEmail !== fromEmail);
    if (!user.friends) user.friends = [];
    if (!fromUser.friends) fromUser.friends = [];
    
    if (!user.friends.includes(fromEmail)) user.friends.push(fromEmail);
    if (!fromUser.friends.includes(userEmail)) fromUser.friends.push(userEmail);
    
    db.saveUser(user);
    db.saveUser(fromUser);
  },

  // Guildas
  getAllGuilds: (): Guild[] => {
    return JSON.parse(localStorage.getItem(GUILDS_KEY) || '[]');
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
    // Atualiza o XP total da guilda somando o novo membro
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
      
      // Se a guilda ficar vazia, ela some? Ou se o mestre sair, passa pra outro?
      // Simplificação: Se o mestre sai e há outros, o primeiro vira mestre. Se não há, deleta.
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
