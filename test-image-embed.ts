import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.embedContent({ 
      model: 'gemini-embedding-2-preview', 
      contents: [{
        role: "user",
        parts: [
          { text: "hello" },
          { inlineData: { mimeType: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" } }
        ]
      }]
    });
    console.log("WORKS:", res.embeddings?.[0]?.values?.length);
  } catch (e: any) {
    console.log("FAILED:", e.message);
  }
}
run();
