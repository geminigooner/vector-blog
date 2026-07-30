import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initEmbeddings, getArtifacts } from "./server/embeddings";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize embeddings cache on startup
  console.log("Initializing embeddings...");
  try {
    await initEmbeddings();
    console.log("Embeddings initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize embeddings on startup:", err);
  }

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/artifacts", async (req, res) => {
    try {
      const q = req.query.q as string | undefined;
      const results = await getArtifacts(q);
      res.json({ artifacts: results });
    } catch (err: any) {
      console.error("Failed to get artifacts:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
