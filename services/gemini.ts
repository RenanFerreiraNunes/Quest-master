
import { GoogleGenAI, Type } from "@google/genai";

// Tenta inicializar apenas se a chave existir para evitar crash no carregamento do módulo
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  async getMotivationalMessage(nickname: string, level: number, tasksCount: number) {
    try {
      const ai = getAIClient();
      if (!ai) return "Prepare sua espada, o destino o aguarda!";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o mestre da guilda de um RPG. O herói ${nickname} (Nível ${level}) acabou de entrar. Ele tem ${tasksCount} quests pendentes. Dê uma mensagem curta de motivação em português, chamando-o de herói ou aventureiro.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text || "Prepare sua espada, o destino o aguarda!";
    } catch (error) {
      console.warn("Gemini API Error:", error);
      return "Sua jornada está apenas começando, aventureiro.";
    }
  },

  async suggestQuest(currentTasks: string[]) {
    try {
      const ai = getAIClient();
      if (!ai) return null;

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
      console.warn("Gemini API Suggestion Error:", e);
      return null;
    }
  }
};
