const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const oldFunc = `  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };`;

const newFunc = `  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit for Gemini API
      alert("PDF file is too large. Max size is 20MB.");
      return;
    }
    
    setPdfUploading(true);
    let downloadUrl = "";
    
    try {
      // 1. Upload to storage (ignore failure if rules block it, just warn)
      try {
        const storageRef = ref(storage, \`pdfs/\${Date.now()}_\${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}\`);
        await uploadBytes(storageRef, file);
        downloadUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        // Continue to parse anyway, just won't have download link
      }
      
      // 2. Send raw file buffer to backend to prevent iOS Safari memory crash
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: file
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'PDF parsing failed');
      }
      
      const data = await res.json();
      
      const newMarkdown = (artifact.bodyMarkdown ? artifact.bodyMarkdown + '\\n\\n---\\n\\n' : '') 
        + data.markdown
        + (downloadUrl ? \`\\n\\n[Download original PDF](\${downloadUrl})\` : '');
        
      setArtifact(prev => ({
        ...prev,
        bodyMarkdown: newMarkdown
      }));
      
    } catch (err: any) {
      console.error(err);
      alert("Failed to parse PDF: " + err.message);
    } finally {
      setPdfUploading(false);
      e.target.value = ''; // reset
    }
  };`;

if (code.includes('const storageRef = ref(storage, `pdfs/${Date.now()}_${file.name}`);')) {
  code = code.replace(oldFunc, newFunc);
}

fs.writeFileSync('src/studio/Editor.tsx', code);
