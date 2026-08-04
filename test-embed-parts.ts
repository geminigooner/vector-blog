import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function getEmbedding(text: string) {
  let parts: any[] = [];
  let lastIndex = 0;
  const regex = /data:(image\/[a-zA-Z+.-]+);base64,([^\s)"']+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    parts.push({
      inlineData: {
        mimeType: match[1],
        data: match[2]
      }
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: parts.length > 0 ? { role: 'user', parts } : text,
  });
  return response.embeddings?.[0]?.values || [];
}

async function run() {
  try {
    const text = "here is an image ![img](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==) and another one";
    const v = await getEmbedding(text);
    console.log("Len:", v.length);
  } catch (e: any) {
    console.log("Err:", e.message);
  }
}
run();
