const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

code = code.replace("import { Save, Eye, EyeOff, UploadCloud, ChevronLeft, Trash } from 'lucide-react';", "import { Save, Eye, EyeOff, UploadCloud, ChevronLeft, Trash, FileText, Loader2 } from 'lucide-react';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';\nimport { storage } from '../lib/firebase';");

fs.writeFileSync('src/studio/Editor.tsx', code);
