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

  const response = await getAi().models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: parts.length > 0 ? { role: 'user', parts } : text,
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

semanticRouter.post('/embed-visual', async (req, res) => {
  try {
    const { artifactId, imageDataUrl } = req.body;
    if (!artifactId || !imageDataUrl) return res.status(400).send('Missing args');

    // 2. Strip the data:image/jpeg;base64, prefix
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

    // 3. POST to Space
    const hfUrl = process.env.HF_SPACE_URL;
    if (!hfUrl) throw new Error("Missing HF_SPACE_URL");
    const token = process.env.HF_TOKEN;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const spaceBase = hfUrl.replace(/\/$/, '');
    const initRes = await fetch(`${spaceBase}/gradio_api/call/embed`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: [base64Data] }) 
    });

    if (!initRes.ok) throw new Error(`Gradio init failed: ${initRes.status}`);
    const initData = await initRes.json();
    const eventId = initData.event_id;
    if (!eventId) throw new Error("No event_id from Gradio");

    const streamRes = await fetch(`${spaceBase}/gradio_api/call/embed/${eventId}`, { headers });
    if (!streamRes.ok) throw new Error(`Gradio stream failed`);
    
    const streamText = await streamRes.text();
    let resultVec: number[] | null = null;
    for (const line of streamText.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data && data.length > 0 && Array.isArray(data[0])) {
            resultVec = data[0];
          }
        } catch(e) {}
      }
    }
    
    if (!resultVec) throw new Error("No vector returned");

    // 4. Write to Firestore
    await db.collection('visualEmbeddings').doc(artifactId).set({
      artifactId,
      vector: resultVec,
      dim: 768,
      model: "google/siglip2-base-patch16-224",
      sourceImageHash: "", // To be implemented properly if hashing is needed
      updatedAt: Date.now()
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

semanticRouter.post('/reembed-visual-all', async (req, res) => {
  try {
    const snap = await db.collection('artifacts').where('status', '==', 'published').get();
    let count = 0;
    
    const hfUrl = process.env.HF_SPACE_URL;
    if (!hfUrl) throw new Error("Missing HF_SPACE_URL");
    const token = process.env.HF_TOKEN;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const spaceBase = hfUrl.replace(/\/$/, '');

    for (const doc of snap.docs) {
      const artifact = doc.data();
      const match = artifact.bodyMarkdown?.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
      if (!match) continue;
      
      const imageDataUrl = match[1];
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      
      // Delay to avoid overwhelming free tier
      await new Promise(r => setTimeout(r, 1000));
      
      const initRes = await fetch(`${spaceBase}/gradio_api/call/embed`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: [base64Data] })
      });
      if (!initRes.ok) continue;
      const initData = await initRes.json();
      const eventId = initData.event_id;
      if (!eventId) continue;
      
      const streamRes = await fetch(`${spaceBase}/gradio_api/call/embed/${eventId}`, { headers });
      if (!streamRes.ok) continue;
      const streamText = await streamRes.text();
      let resultVec: number[] | null = null;
      for (const line of streamText.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data && data.length > 0 && Array.isArray(data[0])) {
              resultVec = data[0];
            }
          } catch(e) {}
        }
      }
      
      if (resultVec) {
        await db.collection('visualEmbeddings').doc(artifact.id).set({
          artifactId: artifact.id,
          vector: resultVec,
          dim: 768,
          model: "google/siglip2-base-patch16-224",
          sourceImageHash: "",
          updatedAt: Date.now()
        });
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { semanticRouter };
