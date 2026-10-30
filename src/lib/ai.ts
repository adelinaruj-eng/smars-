import { supabase } from './supabase';

export async function getGroupAIResponse(
  chatHistory: { role: 'user' | 'model'; text: string }[],
  userMessage: string
) {
  try {
    const { data, error } = await supabase.functions.invoke('smars-ai', {
      body: { messages: [...chatHistory, { role: 'user', text: userMessage }] }
    });

    if (error) throw error;
    return data?.reply || data?.text || "No response received from AI.";
  } catch (error) {
    console.error("Supabase AI Function Error:", error);
    return "Sorry, I had trouble processing that request through the backend.";
  }
}