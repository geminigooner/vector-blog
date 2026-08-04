import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DB_ID = "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9";

let app;
if (getApps().length === 0) {
  let credentialObj;
  if (process.env.SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
      credentialObj = cert(serviceAccount);
    } catch (e) {
      console.error("Failed to parse SERVICE_ACCOUNT_JSON", e);
    }
  } else {
    credentialObj = applicationDefault();
  }
  app = initializeApp({
    credential: credentialObj,
    projectId: "gen-lang-client-0376397936"
  });
} else {
  app = getApp();
}

const db = getFirestore(app, DB_ID);
const semanticRouter = Router();

let ai: GoogleGenAI | null = null;
function getAi() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

async function getEmbedding(text: string) {
    const response = await getAi().models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
    });
  return response.embeddings?.[0]?.values || [];
}

semanticRouter.post('/embed', async (req, res) => {
  try {
    const { artifact } = req.body;
    if (!artifact) return res.status(400).send('Missing artifact');
    
    const textToEmbed = `${artifact.title}\n\nType: ${artifact.type}\nIntent: ${artifact.authorIntent}\n\n${artifact.bodyMarkdown}`;
    const vec = await getEmbedding(textToEmbed);
    
    res.json({ values: vec });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

semanticRouter.post('/embed-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).send('Missing query');
    const vec = await getEmbedding(query);
    res.json({ values: vec });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

semanticRouter.post('/reembed-all', async (req, res) => {
  try {
    const snap = await db.collection('artifacts').get();
    let count = 0;
    for (const doc of snap.docs) {
      const artifact = doc.data();
      const textToEmbed = `${artifact.title}\n\nType: ${artifact.type}\nIntent: ${artifact.authorIntent}\n\n${artifact.bodyMarkdown}`;
      const vec = await getEmbedding(textToEmbed);
      await db.collection('embeddings').doc(artifact.id).set({ values: vec });
      count++;
    }
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { semanticRouter };
