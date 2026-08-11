const fs = require('fs');
let code = fs.readFileSync('server/semantic-api.ts', 'utf8');

const oldApi = `semanticRouter.post('/parse-pdf', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).send('Missing pdfBase64');
    
    // Prompt carefully constructed to meet user's PDF parsing requirements
    const prompt = \`Convert this PDF document into clean Markdown.
Please follow these formatting rules exactly:
- Preserve paragraph breaks as accurately as possible.
- Detect headings and convert them to Markdown headings (#, ##, etc.).
- Preserve bold and italic text when possible.
- Convert lists into Markdown lists, using the '✦' character as the bullet symbol.
- Detect tables and convert them into Markdown tables where possible.
- For images or figures, insert a placeholder like \\\`![Figure from PDF]()\\\` or describe it.
- Preserve blockquotes / pull quotes using '> '.
- If formatting cannot be confidently preserved, prefer clean readable Markdown over trying to reproduce the layout exactly.
- Do NOT wrap the output in \\\`\\\`\\\`markdown ... \\\`\\\`\\\` code blocks, just return the raw text.\`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64
              }
            }
          ]
        }
      ]
    });
    
    let text = response.text || '';
    if (text.startsWith('\\\`\\\`\\\`markdown\\n')) {
      text = text.substring(12);
      if (text.endsWith('\\\`\\\`\\\`')) {
        text = text.substring(0, text.length - 3);
      }
    } else if (text.startsWith('\\\`\\\`\\\`\\n')) {
      text = text.substring(4);
      if (text.endsWith('\\\`\\\`\\\`')) {
        text = text.substring(0, text.length - 3);
      }
    }

    res.json({ markdown: text });
  } catch (err: any) {
    console.error("PDF Parsing error:", err);
    res.status(500).json({ error: err.message });
  }
});`;

const newApi = `import express from 'express';\n\nsemanticRouter.post('/parse-pdf', express.raw({ type: 'application/pdf', limit: '50mb' }), async (req, res) => {
  try {
    const pdfBuffer = req.body;
    if (!Buffer.isBuffer(pdfBuffer)) return res.status(400).json({ error: 'Missing PDF body or wrong Content-Type' });
    
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Prompt carefully constructed to meet user's PDF parsing requirements
    const prompt = \`Convert this PDF document into clean Markdown.
Please follow these formatting rules exactly:
- Preserve paragraph breaks as accurately as possible.
- Detect headings and convert them to Markdown headings (#, ##, etc.).
- Preserve bold and italic text when possible.
- Convert lists into Markdown lists, using the '✦' character as the bullet symbol.
- Detect tables and convert them into Markdown tables where possible.
- For images or figures, insert a placeholder like \\\`![Figure from PDF]()\\\` or describe it.
- Preserve blockquotes / pull quotes using '> '.
- If formatting cannot be confidently preserved, prefer clean readable Markdown over trying to reproduce the layout exactly.
- Do NOT wrap the output in \\\`\\\`\\\`markdown ... \\\`\\\`\\\` code blocks, just return the raw text.\`;

    const response = await getAi().models.generateContent({
      model: 'gemini-2.0-flash', // Corrected model name
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64
              }
            }
          ]
        }
      ]
    });
    
    let text = response.text || '';
    if (text.startsWith('\\\`\\\`\\\`markdown\\n')) {
      text = text.substring(12);
      if (text.endsWith('\\\`\\\`\\\`\\n')) {
        text = text.substring(0, text.length - 4);
      } else if (text.endsWith('\\\`\\\`\\\`')) {
        text = text.substring(0, text.length - 3);
      }
    } else if (text.startsWith('\\\`\\\`\\\`\\n')) {
      text = text.substring(4);
      if (text.endsWith('\\\`\\\`\\\`\\n')) {
        text = text.substring(0, text.length - 4);
      } else if (text.endsWith('\\\`\\\`\\\`')) {
        text = text.substring(0, text.length - 3);
      }
    }

    res.json({ markdown: text });
  } catch (err: any) {
    console.error("PDF Parsing error:", err);
    res.status(500).json({ error: err.message });
  }
});`;

if (code.includes('const { pdfBase64 } = req.body;')) {
  code = code.replace(oldApi, newApi);
}

// Ensure express is imported for express.raw
if (code.includes('import express from') && !code.includes('import { Router, express }')) {
  // It's already handled by the newApi replacement adding \`import express from 'express';\`
} else if (!code.includes('import express from')) {
  code = "import express from 'express';\n" + code;
}

fs.writeFileSync('server/semantic-api.ts', code);
