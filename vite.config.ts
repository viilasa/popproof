import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The SPA serves index.html for every path, so crawlers that don't run JavaScript
// would see the home page's canonical on /terms, /privacy and /refund. Write a copy
// of the built index.html for each, with its own canonical, og:url and title.
const SITE = 'https://www.proofedge.io';
const STATIC_PAGES = [
  { path: 'terms', title: 'Terms of Service – ProofEdge' },
  { path: 'privacy', title: 'Privacy Policy – ProofEdge' },
  { path: 'refund', title: 'Refund Policy – ProofEdge' },
];

function legalPagesHtml(): Plugin {
  let outDir = 'dist';
  return {
    name: 'legal-pages-html',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const html = readFileSync(join(outDir, 'index.html'), 'utf8');
      for (const page of STATIC_PAGES) {
        const url = `${SITE}/${page.path}`;
        const out = html
          .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
          .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
          .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
        mkdirSync(join(outDir, page.path), { recursive: true });
        writeFileSync(join(outDir, page.path, 'index.html'), out);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), legalPagesHtml()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
