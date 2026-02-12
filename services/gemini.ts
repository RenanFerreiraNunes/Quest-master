
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async getMotivationalMessage(nickname: string, level: number, tasksCount: number) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o mestre da guilda de um RPG. O herói ${nickname} (Nível ${level}) acabou de entrar. Ele tem ${tasksCount} quests pendentes. Dê uma mensagem curta de motivação em português, chamando-o de herói ou aventureiro.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      // .text is a property, not a method
      return response.text || "Prepare sua espada, o destino o aguarda!";
    } catch (error) {
      return "Sua jornada está apenas começando, aventureiro.";
    }
  },

  async suggestQuest(currentTasks: string[]) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Com base nessas tarefas reais: ${currentTasks.join(', ')}, sugira UMA tarefa épica para hoje.`,
        config: {
          responseMimeType: "application/json",
          // Recommended way to get structured JSON is using responseSchema
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
      return null;
    }
  }
};
