# Latent Affairs

**A blog that arranges itself by meaning.**

Posts aren't sorted by date or tags. Every essay, project, and meme is embedded into vector space, projected down to 2D, and placed on a map — so things that are *about* similar things end up physically near each other. The layout is a consequence of the content, not a decision I made.

Built entirely from a phone.

🔗 **Live:** [latentaffairs.keito.uk](https://latentaffairs.keito.uk)



---

## How it works

```
post ──▶ Gemini embedding (text)            ──┐
     └─▶ SigLIP embedding (images, HF Space) ─┴──▶ PCA ──▶ 2D ──▶ D3 force sim ──▶ map
```

1. **Embed.** Text goes through Gemini's embedding model. Images go through a SigLIP model running on a Hugging Face Space, so the visual content is represented too, not just the caption.
2. **Reduce.** PCA takes the high-dimensional vectors down to two components. The x and y axes aren't labeled because they don't mean anything nameable — they're just the two directions the corpus varies most along.
3. **Lay out.** A D3 force simulation uses those coordinates as targets, with a collision force so cards don't stack on top of each other. Semantic position is preserved; overlap isn't.
4. **Render.** The map is the primary view. There's also a list view for people who want a normal blog.

The archive is arranged twice: once by the machine, once by its author.

## Stack

| | |
|---|---|
| Runtime | Bun |
| Build | Vite + TypeScript |
| Frontend | React, D3 (force simulation) |
| Text embeddings | Gemini embedding API |
| Image embeddings | SigLIP, hosted on a Hugging Face Space (`hf-space/`) |
| Data | Firebase / Firestore |
| Hosting | Custom domain via Cloudflare |

## Layout

```
src/         frontend
server/      API layer
server.ts    entry point
hf-space/    SigLIP embedding service (Hugging Face Space)
*.cjs        debugging archaeology, see below
```

## Running it

```bash
bun install
cp .env.example .env    # add your keys
bun run dev
```

You'll need a Gemini API key and a Firebase project. The SigLIP Space can be swapped for any endpoint that returns image embeddings — see `hf-space/` for the interface it expects.

## About the loose scripts

There are around forty `fix_*.cjs`, `patch_*.cjs`, and `test_*.cjs` files in the root. They're not part of the build. They're the record of every bug I hit while working this out, kept because I was debugging a system I was learning at the same time and each one was a hypothesis.

Some highlights, if you want the honest version:

- **The PCA was fake for about two weeks.** It looked plausible. It was not doing PCA. Posts were arranged by something, just not by meaning.
- **Firestore write storms.** A re-embed loop that rewrote the whole collection on every render.
- **Base64 handling** for image embeddings — silently producing garbage vectors instead of failing.
- **Field name mismatches** between the write path and the read path, so half the corpus embedded into nothing.
- **D3 collide radius** set from a value that was sometimes `undefined`, which does not error, it just quietly explodes the layout.

They'll get cleaned up. They're documentation for now.

## Why

I started coding in April 2026. I don't have a CS degree and I don't have a laptop — every line of this was written on an iPhone. It's here partly because the thing itself is interesting and partly as an existence proof.

If you want to know how any part of it works, open an issue. I'll answer.

---

*Part of [Provenance Systems](https://studio.keito.uk).*
