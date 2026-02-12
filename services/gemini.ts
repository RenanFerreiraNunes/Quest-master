
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// A API KEY é injetada automaticamente a partir do ambiente
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // 429 is Resource Exhausted (Rate Limit)
      if (error?.message?.includes('429') || error?.status === 429) {
        // Reduzi o tempo de espera e o número de retries para evitar travar a UI
        const waitTime = 1000 + Math.random() * 500;
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const geminiService = {
  async getMotivationalMessage(nickname: string, level: number, tasksCount: number) {
    if (!process.env.API_KEY) return "Prepare sua espada, o destino o aguarda!";
    
    try {
      const ai = getAiClient();
      const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o mestre da guilda de um RPG. O herói ${nickname} (Nível ${level}) acabou de entrar. Ele tem ${tasksCount} quests pendentes. Dê uma mensagem curta de motivação em português, chamando-o de herói ou aventureiro.`,
      }));
      return response.text || "Prepare sua espada, o destino o aguarda!";
    } catch (error) {
      // Falha silenciosa para não quebrar a UI
      console.warn("Gemini Motivational falhou (provavelmente limite de cota)");
      return "Sua jornada está apenas começando, aventureiro.";
    }
  },

  async suggestQuest(currentTasks: string[]) {
    if (!process.env.API_KEY) return null;

    try {
      const ai = getAiClient();
      const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
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
      }));
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text.trim());
    } catch (e) {
      console.warn("Gemini Sugestão falhou (provavelmente limite de cota)");
      return null;
    }
  }
};
