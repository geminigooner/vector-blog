const fs = require('fs');
let code = fs.readFileSync('src/PublicApp.tsx', 'utf8');

const replacement = `const posts = raw.map(fa => ({
          id: fa.id,
          title: fa.title,
          subtitle: fa.subtitle,
          date: new Date(fa.publishedAt || fa.createdAt || Date.now()).toLocaleDateString(),
          type: fa.type,
          excerpt: fa.excerpt,
          bodyMarkdown: fa.bodyMarkdown,
          inlineMedia: fa.inlineMedia,
          coverMedia: fa.coverMedia,
          authorIntent: fa.authorIntent || 'Unspecified',`;

code = code.replace(/const posts = raw\.map\(fa => \(\{[\s\S]*?authorIntent: fa\.authorIntent \|\| 'Unspecified',/, replacement);

fs.writeFileSync('src/PublicApp.tsx', code);
console.log("Updated PublicApp.tsx");
