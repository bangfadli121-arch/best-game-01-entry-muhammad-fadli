// Copy the playable entry and write the deterministic competition dossier.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(output, { recursive: true });
cpSync(resolve(root, 'game'), resolve(output, 'game'), { recursive: true });
mkdirSync(resolve(output, 'screenshots'), { recursive: true });
if (existsSync(resolve(root, 'screenshots'))) {
  cpSync(resolve(root, 'screenshots'), resolve(output, 'screenshots'), { recursive: true });
}
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(resolve(output, 'dossier.json'), dossier);
