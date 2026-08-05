const fs = require('fs');

let code = fs.readFileSync('src/components/ArtifactDrawer.tsx', 'utf8');

// 1. Add imports
code = code.replace(/import \{ X, ChevronRight, Hash \} from 'lucide-react';/,
  "import { X, ChevronRight, Hash, Edit2 } from 'lucide-react';\nimport { Link } from 'react-router-dom';\nimport { useAuth } from '../contexts/AuthContext';");

// 2. Add useAuth to ArtifactDrawer
code = code.replace(/export function ArtifactDrawer\(\{ artifact, onClose \}: ArtifactDrawerProps\) \{/,
  "export function ArtifactDrawer({ artifact, onClose }: ArtifactDrawerProps) {\n  const { user } = useAuth();");

// 3. Update Mobile Close
const mobileCloseRegex = /\{\/\* Close Button \(Mobile\) \*\/\}\s*<button[\s\S]*?<\/button>/;
const mobileCloseReplacement = `{/* Close Button (Mobile) */}
            <div className="absolute top-4 right-4 z-50 md:hidden flex gap-2">
              {user && (
                <Link
                  to={\`/studio/editor/\${artifact.id}\`}
                  className="p-2 bg-carbon border border-silver/20 text-silver hover:text-ivory"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-carbon border border-silver/20 text-silver hover:text-ivory"
              >
                <X className="w-4 h-4" />
              </button>
            </div>`;
code = code.replace(mobileCloseRegex, mobileCloseReplacement);

// 4. Update Desktop Close
const desktopCloseRegex = /\{\/\* Close Button \(Desktop\) \*\/\}\s*<div className="hidden md:flex justify-end mb-8">\s*<button[\s\S]*?<\/button>\s*<\/div>/;
const desktopCloseReplacement = `{/* Close Button (Desktop) */}
              <div className="hidden md:flex justify-end mb-8 gap-2">
                {user && (
                  <Link
                    to={\`/studio/editor/\${artifact.id}\`}
                    className="p-2 border border-silver/20 text-silver hover:text-ivory bg-graphite hover:bg-silver/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={onClose}
                  className="p-2 border border-silver/20 text-silver hover:text-ivory bg-graphite hover:bg-silver/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>`;
code = code.replace(desktopCloseRegex, desktopCloseReplacement);

fs.writeFileSync('src/components/ArtifactDrawer.tsx', code);
console.log("Updated ArtifactDrawer with edit button");
