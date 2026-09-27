import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const serveDependenciesDirectly = {
  name: 'serve-dependencies-directly',
  configResolved(config) {
    config.optimizeDeps.noDiscovery = true;
    config.optimizeDeps.include = [];
  },
};

const server = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [react(), serveDependenciesDirectly],
  server: { middlewareMode: true },
  ssr: { external: ['ogl', 'react', 'react-dom', 'react-dom/server'] },
});

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const routes = [
    ['/', 'Find related projects.', true],
    ['/analyze', 'Find related projects.', true],
    ['/projects', 'Browse comparison projects', true],
    ['/how-it-works', 'How the comparison works', true],
    ['/projects/1', 'Loading project', false],
    ['/results/1', 'Loading analysis', false],
    ['/missing', 'Page not found', true],
  ];

  globalThis.location = { pathname: '/' };
  globalThis.history = { pushState() {} };
  globalThis.dispatchEvent = () => true;

  for (const [route, expectedText, expectsHeading] of routes) {
    globalThis.location.pathname = route;
    const html = renderToStaticMarkup(createElement(App));
    if (!html.includes(expectedText)) {
      throw new Error(`Route ${route} did not render its expected content: ${expectedText}`);
    }
    if (!html.includes('Project Similarity')) {
      throw new Error(`Route ${route} did not render the product identity`);
    }
    const headingCount = (html.match(/<h1(?:\s|>)/g) || []).length;
    if (expectsHeading && headingCount !== 1) {
      throw new Error(`Route ${route} must render exactly one primary heading; found ${headingCount}`);
    }
    const mainCount = (html.match(/<main(?:\s|>)/g) || []).length;
    if (mainCount !== 1) {
      throw new Error(`Route ${route} must render exactly one main content landmark; found ${mainCount}`);
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Route ${route} contains duplicate element IDs`);
    }
    const localTargets = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    for (const target of localTargets) {
      if (!ids.includes(target)) throw new Error(`Route ${route} links to missing page section #${target}`);
    }
    const ariaTargets = [...html.matchAll(/\saria-(?:describedby|labelledby)="([^"]+)"/g)]
      .flatMap(match => match[1].split(/\s+/));
    for (const target of ariaTargets) {
      if (!ids.includes(target)) throw new Error(`Route ${route} references missing ARIA target #${target}`);
    }
  }

  console.log(`Render smoke test valid: ${routes.length} application routes rendered successfully.`);
} finally {
  await server.close();
}
