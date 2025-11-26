
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // process.env.API_KEY is replaced by Vite during build based on vite.config.ts define
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const generateSongDescription = async (title: string, artist: string): Promise<string> => {
  try {
    const ai = getAiClient();
    // Updated prompt to ask for Chinese response
    const prompt = `为歌曲《${title}》（歌手：${artist}）生成一段简短、充满诗意且大气的中文乐评（20字以内）。氛围要高端、神秘。不要使用引号。`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || '声音中包裹着谜团。';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return 'AI 分析暂时不可用。';
  }
};
