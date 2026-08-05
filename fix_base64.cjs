const fs = require('fs');

let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*if \(id\) \{[\s\S]*?\}\s*\}, \[id\]\);/;

const replacement = `useEffect(() => {
    if (id) {
      getDoc(doc(db, 'artifacts', id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as FirebaseArtifact;
          
          // Cleanup legacy base64 in bodyMarkdown
          if (data.bodyMarkdown && data.bodyMarkdown.includes('data:')) {
            let updatedBody = data.bodyMarkdown;
            const inlineMedia = data.inlineMedia || [];
            
            // Extract all data URIs
            const regex = /!\\[(.*?)\\]\\((data:[^)]+)\\)/g;
            let match;
            while ((match = regex.exec(data.bodyMarkdown)) !== null) {
              const alt = match[1];
              const dataUri = match[2];
              
              // Check if already in inlineMedia
              let idx = inlineMedia.indexOf(dataUri);
              if (idx === -1) {
                idx = inlineMedia.length;
                inlineMedia.push(dataUri);
              }
              
              // Replace in body
              const isVideo = dataUri.startsWith('data:video/');
              const replacement = \`![\${alt}](\${isVideo ? 'video' : 'image'} inline:\${idx})\`;
              updatedBody = updatedBody.replace(match[0], replacement);
            }
            
            data.bodyMarkdown = updatedBody;
            data.inlineMedia = inlineMedia;
          }
          
          setArtifact(data);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load artifact", err);
        setLoading(false);
      });
    }
  }, [id]);`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/studio/Editor.tsx', code);
  console.log("Patched Editor useEffect for base64 cleanup");
} else {
  console.log("Target not found");
}

