// Copies the Latin WOFF2 fonts the page uses from the Fontsource packages into site/fonts,
// with each family's licence. Run after changing font versions: npm run fonts
import { copyFileSync, mkdirSync } from "node:fs";

const out = "site/fonts";
const families = {
  montserrat: ["600"],
  "ibm-plex-sans": ["400", "500", "600"],
  "ibm-plex-mono": ["400", "500"],
};

mkdirSync(out, { recursive: true });
for (const [family, weights] of Object.entries(families)) {
  const pkg = `node_modules/@fontsource/${family}`;
  for (const w of weights) {
    const file = `${family}-latin-${w}-normal.woff2`;
    copyFileSync(`${pkg}/files/${file}`, `${out}/${file}`);
  }
  copyFileSync(`${pkg}/LICENSE`, `${out}/${family}-LICENSE.txt`);
}
console.log("Fonts copied to", out);
