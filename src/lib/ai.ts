import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function getGroupAIResponse(
  chatHistory: { role: 'user' | 'model'; text: string }[],
  userMessage: string
) {
  try {
    const contents = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: "You are an independent, helpful AI assistant with memory. You remember previous context from our chat history and assist the user accurately.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I had trouble processing that request.";
  }
}