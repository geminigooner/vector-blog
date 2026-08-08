const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const newStyles = `
.markdown-body ul, .markdown-body ol {
  @apply mb-6 space-y-2;
  list-style: none;
  padding-left: 0;
}
.markdown-body ul > li {
  @apply relative pl-6;
}
.markdown-body ul > li::before {
  content: '✦';
  @apply absolute left-0 text-rose text-sm top-0.5;
}
.markdown-body h1 {
  @apply text-3xl md:text-4xl font-serif text-ivory mb-6 mt-12 font-bold;
}
.markdown-body h2 {
  @apply text-2xl md:text-3xl font-serif text-ivory mb-5 mt-10 font-bold;
}
.markdown-body h3 {
  @apply text-xl md:text-2xl font-serif text-ivory mb-4 mt-8 font-semibold;
}
.markdown-body blockquote {
  @apply border-l-4 border-rose pl-6 py-2 my-8 text-xl italic text-ivory/80 font-serif bg-silver/5;
}
.markdown-body hr {
  @apply border-0 h-px bg-silver/20 my-12 w-1/2 mx-auto;
}
.markdown-body table {
  @apply w-full text-left border-collapse my-8 text-sm md:text-base;
}
.markdown-body th, .markdown-body td {
  @apply border-b border-silver/10 p-3;
}
.markdown-body th {
  @apply font-semibold text-ivory text-xs uppercase tracking-wider bg-carbon/50;
}
.markdown-body tr:hover {
  @apply bg-carbon/30;
}
`;

css = css.replace('.markdown-body h1, .markdown-body h2, .markdown-body h3 {\n  @apply font-serif text-ivory mb-4 mt-8 font-semibold;\n}', '');
css = css.replace('.markdown-body ul, .markdown-body ol {\n  @apply pl-6 mb-4 list-disc;\n}', '');

if (!css.includes('.markdown-body blockquote')) {
  css += newStyles;
}

fs.writeFileSync('src/index.css', css);
