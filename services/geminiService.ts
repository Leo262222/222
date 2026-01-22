import { GoogleGenAI } from "@google/genai";
import { Advisor, Language } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSpiritGuideResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string,
  advisors: Advisor[],
  language: Language
): Promise<string> => {
  try {
    // Create a context string about available advisors
    const advisorContext = advisors.map(
      (a) => {
        const name = language === 'zh' ? (a.name_zh || a.name) : a.name;
        const title = language === 'zh' ? (a.title_zh || a.title) : a.title;
        const specialties = language === 'zh' ? (a.specialties_zh || a.specialties).join(', ') : a.specialties.join(', ');
        return `${name} (ID: ${a.id}): ${title}. Specialties: ${specialties}. Rating: ${a.rating}. Price: $${a.pricePerMinute}/min.`;
      }
    ).join('\n');

    const langInstruction = language === 'zh' 
      ? "You are communicating in Chinese. Reply in simplified Chinese." 
      : "You are communicating in English.";

    const systemInstruction = `
      You are the "Tree Hollow Guardian" (留子树洞守护者), an empathetic AI companion for overseas students (liuzi).
      ${langInstruction}
      Your goal is to help the user find the perfect human listener/mentor from our list, or provide brief emotional support for their studies/life abroad.
      
      Here is the list of our available human listeners/mentors:
      ${advisorContext}

      Rules:
      1. Be warm, supportive, and understanding of the struggles of living abroad (loneliness, academic stress, culture shock).
      2. If the user asks for a specific type of advice (e.g., "I failed my exam"), recommend 1-2 advisors from the list above who match their needs. Mention why you chose them.
      3. Keep responses concise (under 100 words) so the user can quickly browse.
      4. You are a bridge to human connection.
      5. Always use a soothing, non-judgmental tone.
    `;

    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || (language === 'zh' ? "树洞里似乎有回声干扰，请重试。" : "The Tree Hollow echoes are unclear. Please try again.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'zh' 
      ? "我无法连接到树洞深处（API错误）。请稍后再试。" 
      : "I am having trouble connecting to the Tree Hollow depths (API Error). Please try again later.";
  }
};