import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";

const directory = new URL("../public/buttons/", import.meta.url);
const image = async (file, height) => {
  const png = await sharp(fileURLToPath(new URL(`sources/${file}`, directory)))
    .resize({ height }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
};
const owl = await image("falseknees-owl.webp", 100);
const text = await image("falseknees-text.png", 44);
// Use the same stepped, colour-matched bevel as build-linked-buttons.mjs.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31" viewBox="0 0 88 31"><title>falseknees</title>
<rect width="88" height="31" fill="#fffffd"/>
<image x="3" y="3" width="21" height="25" href="${owl}"/>
<image x="25" y="10" width="55" height="11" href="${text}"/>
<g shape-rendering="crispEdges" aria-label="color-matched pixel bevel">
<path d="M0 0H88V2H2V29H0Z" fill="#e8f1e5"/>
<path d="M2 2H86V3H3V28H2Z" fill="#d2dfd2"/>
<path d="M88 0V31H0V29H86V2H88Z" fill="#98bcb0"/>
<path d="M85 3H86V29H2V28H85Z" fill="#739b90"/>
</g></svg>\n`;
await writeFile(new URL("falseknees-button.svg", directory), svg);
console.log("Built falseknees button from the supplied owl crop and lettering.");
