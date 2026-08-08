const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const newFunc = `
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') return;
    
    setPdfUploading(true);
    try {
      // 1. Upload to storage
      const storageRef = ref(storage, \`pdfs/\${Date.now()}_\${file.name}\`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // 2. Read as base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          const base64 = dataUrl.split(',')[1];
          
          const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64 })
          });
          
          if (!res.ok) throw new Error('PDF parsing failed');
          const data = await res.json();
          
          const newMarkdown = (artifact.bodyMarkdown ? artifact.bodyMarkdown + '\\n\\n---\\n\\n' : '') 
            + data.markdown
            + \`\\n\\n[Download original PDF](\${downloadUrl})\`;
            
          setArtifact(prev => ({
            ...prev,
            bodyMarkdown: newMarkdown
          }));
        } catch (err) {
          console.error(err);
          alert("Failed to parse PDF.");
        } finally {
          setPdfUploading(false);
          e.target.value = ''; // reset
        }
      };
      reader.onerror = () => {
        alert("Failed to read PDF file.");
        setPdfUploading(false);
        e.target.value = '';
      };
    } catch (err) {
      console.error(err);
      alert("Failed to upload PDF.");
      setPdfUploading(false);
      e.target.value = ''; // reset
    }
  };

  const handleDelete = async () => {`;

code = code.replace("  const handleDelete = async () => {", newFunc);

fs.writeFileSync('src/studio/Editor.tsx', code);
