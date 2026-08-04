import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const models = ['text-embedding-004', 'gemini-embedding-2-preview', 'text-embedding-004'];
  for (const m of models) {
    try {
      const res = await ai.models.embedContent({ model: m, contents: 'hello' });
      console.log(m, "WORKS:", res.embeddings?.[0]?.values?.length);
    } catch (e: any) {
      console.log(m, "FAILED:", e.message);
    }
  }
}
run();
