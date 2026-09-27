import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const C = {
  bg: '#0b0806',
  ink: '#efe4cc',
  dim: '#a8987a',
  gold: '#c9a14a',
  goldFaint: 'rgba(201,161,74,0.35)',
  blood: '#b23a2e',
  land: '#1c160f',
  coast: 'rgba(239,228,204,0.5)',
};

export const serif = "'Cormorant Garamond', Georgia, serif";
export const caps = "'Cinzel', 'Cormorant Garamond', serif";

const faces = [
  {family: 'Cinzel', file: 'cinzel-latin-500-normal.woff2', weight: '500', style: 'normal'},
  {family: 'Cinzel', file: 'cinzel-latin-700-normal.woff2', weight: '700', style: 'normal'},
  {family: 'Cormorant Garamond', file: 'cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal'},
  {family: 'Cormorant Garamond', file: 'cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal'},
  {family: 'Cormorant Garamond', file: 'cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic'},
];

for (const f of faces) {
  loadFont({family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight, style: f.style});
}
