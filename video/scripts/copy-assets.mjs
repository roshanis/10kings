// Copy the portraits and fonts the video needs into public/, then build the map.
import {copyFileSync, mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const portraits = {
  vidyadhara: 'chapter_9_vidyadhara_chandela_portrait.png',
  bhoja: 'chapter_10_raja_bhoja_portrait.png',
  simhana: 'chapter_6_simhana_ii_portrait.png',
  jatavarman: 'chapter_5_jatavarman_sundara_portrait.png',
  balban: 'chapter_7_balban_portrait.png',
  alauddin: 'chapter_2_alauddin_khilji_portrait.png',
  bukka: 'chapter_4_bukka_raya_portrait.png',
  kapilendra: 'chapter_8_kapilendra_deva_portrait.png',
  lachit: 'chapter_3_lachit_borphukan_portrait.png',
  marthanda: 'chapter_1_marthanda_varma_portrait.png',
};

const fonts = [
  '@fontsource/cinzel/files/cinzel-latin-500-normal.woff2',
  '@fontsource/cinzel/files/cinzel-latin-700-normal.woff2',
  '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2',
  '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2',
  '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2',
];

mkdirSync('public/portraits', {recursive: true});
mkdirSync('public/fonts', {recursive: true});

// The illustrations are JPEG files with .png names; copy them under the right extension.
for (const [id, file] of Object.entries(portraits)) {
  copyFileSync(`../illustrations/${file}`, `public/portraits/${id}.jpg`);
}
for (const font of fonts) {
  copyFileSync(`node_modules/${font}`, `public/fonts/${font.split('/').pop()}`);
}

execFileSync(process.execPath, ['scripts/build-map.mjs'], {stdio: 'inherit'});
