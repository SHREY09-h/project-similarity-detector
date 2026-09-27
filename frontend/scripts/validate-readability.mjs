import { readFileSync } from 'node:fs';

const stylesheet = [
  '../src/index.css',
  '../src/components/AnalyzerPage.css',
  '../src/components/ServiceLanding.css',
  '../src/components/ScrollExperience.css',
].map(path => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');

const pairs = [
  ['Primary body text', '#f5f7fa', '#07080d'],
  ['Muted application copy', '#b1b8c7', '#07080d'],
  ['Input placeholder', '#858ea1', '#0a0d14'],
  ['Analysis introduction', '#c3c8d4', '#07080d'],
  ['Landing-page body copy', '#d5d7e2', '#04050c'],
  ['Scroll-story caption', '#ddd8e4', '#04050c'],
  ['Method-card copy', '#bfc5d2', '#0d1018'],
  ['Results supporting copy', '#aeb5c4', '#07080d'],
];

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const value = hex.slice(1);
  const channels = [0, 2, 4].map(index => channel(Number.parseInt(value.slice(index, index + 2), 16)));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function ratio(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

for (const [label, foreground, background] of pairs) {
  if (!stylesheet.toLowerCase().includes(foreground)) {
    throw new Error(`Readability validation failed: ${label} color ${foreground} is no longer used`);
  }
  const contrast = ratio(foreground, background);
  if (contrast < 4.5) {
    throw new Error(`Readability validation failed: ${label} contrast is only ${contrast.toFixed(2)}:1`);
  }
}

console.log(`Readability valid: ${pairs.length} essential text combinations meet WCAG AA contrast.`);
