
import { GoogleGenAI, Type } from "@google/genai";

// A API KEY é injetada pelo Vite a partir das variáveis de ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async getMotivationalMessage(nickname: string, level: number, tasksCount: number) {
    if (!process.env.API_KEY) return "Prepare sua espada, o destino o aguarda!";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o mestre da guilda de um RPG. O herói ${nickname} (Nível ${level}) acabou de entrar. Ele tem ${tasksCount} quests pendentes. Dê uma mensagem curta de motivação em português, chamando-o de herói ou aventureiro.`,
      });
      return response.text || "Prepare sua espada, o destino o aguarda!";
    } catch (error) {
      console.error("Erro Gemini:", error);
      return "Sua jornada está apenas começando, aventureiro.";
    }
  },

  async suggestQuest(currentTasks: string[]) {
    if (!process.env.API_KEY) return null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Com base nessas tarefas reais: ${currentTasks.join(', ')}, sugira UMA tarefa épica para hoje.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'O título da tarefa sugerida.'
              },
              rarity: {
                type: Type.STRING,
                description: 'A raridade sugerida: raro, epico ou lendario.'
              }
            },
            required: ['title', 'rarity']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Erro Gemini Sugestão:", e);
      return null;
    }
  }
};
