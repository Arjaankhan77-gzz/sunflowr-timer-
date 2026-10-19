import JSZip from 'jszip';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Glob all source and config files as raw strings
  const files = import.meta.glob<string>(
    ['/src/**/*', '/index.html', '/package.json', '/tsconfig.json', '/vite.config.ts', '/metadata.json'],
    { query: '?raw', import: 'default', eager: true }
  );

  for (const [path, content] of Object.entries(files)) {
    // Strip leading slash
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    zip.file(relativePath, content);
  }

  // Add README.md with clear run instructions
  const readmeContent = `# Sunflower Timer & Athletic Clock

A clean minimalist sunflower clock, precision athletic stopwatch with double-tap safety stop and lap marking, customizable sunflower alarms with custom device music, celebration animation, countdown training timer, and world clock. Designed for Arjaan.

## How to run locally:

1. Extract this ZIP file.
2. In the folder, install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the local development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open http://localhost:3000 in your browser!
`;
  zip.file('README.md', readmeContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sunflower-timer-source.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
