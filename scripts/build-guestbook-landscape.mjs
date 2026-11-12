import sharp from "sharp";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

const directory = new URL("../public/guestbook/", import.meta.url);
const width = 1024, height = 576, pixelWidth = 240, pixelHeight = 135;
const zones = ["sky", "land", "lake", "tree", "snow", "mountain", "trunk"];
const zoneColours = [[82, 153, 229], [84, 178, 65], [44, 107, 183], [30, 99, 46], [255, 255, 255], [128, 128, 128], [115, 72, 37]];
const palette = {
  sky: ["#9fcbe9", "#acd4ed", "#b4d9f0", "#c7e2f1"],
  land: ["#709757", "#7da562", "#8bb16e", "#98bb7b", "#a8c78a", "#b3ce97"],
  lake: ["#8cc5d7", "#75b4ca", "#a5d5df", "#c1e3e8"],
  tree: ["#375d3c", "#466e43", "#567f4b", "#679057", "#7aa260", "#90b370"],
  snow: ["#ffffff", "#f0f5f8", "#dce8f2", "#bdcfe2"],
  mountain: ["#8e9baa", "#78899d", "#a5afbc", "#697d94"],
  trunk: ["#82725a", "#695b4a", "#c7c4ad"],
};
const mountains = [
  { peakX: .27, peakY: .25, left: .08, right: .49, base: .56 },
  { peakX: .71, peakY: .20, left: .45, right: .95, base: .56 },
  { peakX: .46, peakY: .14, left: .25, right: .73, base: .56 },
];
const trees = [
  { kind: "oak", x: .14, y: .43, rx: .1, ry: .23, base: .70 },
  { kind: "oak", x: .90, y: .44, rx: .07, ry: .20, base: .70 },
  { kind: "cherry", x: .365, y: .53, rx: .045, ry: .09, base: .77 },
];
const lake = { x: .68, y: .78, rx: .25, ry: .16 };
function ellipse(x, y, shape) { return ((x - shape.x) / shape.rx) ** 2 + ((y - shape.y) / shape.ry) ** 2 <= 1; }
function canopy(x, y, tree) {
  if (tree.kind === "pine") return [0, .28, .52].some((tier, index) => {
    const start = tree.y - tree.ry + tier * tree.ry * 2;
    const length = tree.ry * (index ? 1.05 : 1.25);
    return y >= start && y <= start + length && Math.abs(x - tree.x) <= tree.rx * (.65 + index * .18) * (y - start) / length;
  });
  return ellipse(x, y, tree) || (tree.kind === "oak" && (
    ellipse(x, y, { x: tree.x - tree.rx * .55, y: tree.y + .03, rx: tree.rx * .65, ry: tree.ry * .61 }) ||
    ellipse(x, y, { x: tree.x + tree.rx * .65, y: tree.y + .07, rx: tree.rx * .65, ry: tree.ry * .57 })
  ));
}
function mountainAt(x, y) {
  return [...mountains].reverse().find(mountain => {
    if (y < mountain.peakY || y >= mountain.base) return false;
    const distance = (y - mountain.peakY) / (mountain.base - mountain.peakY);
    return x >= mountain.peakX + (mountain.left - mountain.peakX) * distance
      && x <= mountain.peakX + (mountain.right - mountain.peakX) * distance;
  });
}
function classify(x, y) {
  if (trees.some(tree => canopy(x, y, tree))) return "tree";
  if (trees.some(tree => Math.abs(x - tree.x) < (tree.kind === "cherry" ? .006 : .009) && y > tree.y && y < tree.base)) return "trunk";
  if (ellipse(x, y, lake)) return "lake";
  if (y >= .56) return "land";
  const mountain = mountainAt(x, y);
  if (mountain) {
    const ridgeDistance = Math.abs(x - mountain.peakX) / (mountain.right - mountain.left);
    const snowLine = mountain.peakY + (mountain.base - mountain.peakY) * (.76 - ridgeDistance * .22 + Math.sin(x * 93) * .035);
    return y < snowLine ? "snow" : "mountain";
  }
  return "sky";
}
function colour(column, row, zone) {
  const x = (column + .5) / pixelWidth, y = (row + .5) / pixelHeight;
  const colours = zone === "tree" && trees.find(tree => canopy(x, y, tree))?.kind === "cherry"
    ? ["#855568", "#a96f83", "#bf8a9e", "#d3a0b3", "#e5b9c8", "#f1d2dc"] : palette[zone];
  switch (zone) {
    case "sky": return colours[Math.min(3, Math.floor(y * 7))];
    case "snow": {
      const mountain = mountainAt(x, y);
      const ridge = mountain.peakX + (y - mountain.peakY) * .12;
      return colours[x > ridge ? (Math.sin(x * 65 + y * 13) > .6 ? 2 : 3) : (Math.sin(x * 79 - y * 11) > .8 ? 1 : 0)];
    }
    case "mountain": {
      const mountain = mountainAt(x, y);
      const ridge = mountain.peakX + (y - mountain.peakY) * .12;
      return colours[x > ridge ? 1 : (Math.sin(x * 55 - y * 16) > .8 ? 0 : 2)];
    }
    case "land": {
      const distance = (y - .56) / .44;
      const field = Math.sin(x * 17 + Math.sin(y * 19)) * .3 + Math.sin(y * 23 - x * 9) * .2;
      let light = 3.7 - distance * .8 + field;
      const grain = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
      if (grain - Math.floor(grain) > .97) light += .7;
      if (grain - Math.floor(grain) < .02) light -= .6;
      return colours[Math.max(0, Math.min(5, Math.floor(light)))];
    }
    case "lake": {
      const edge = ((x - lake.x) / lake.rx) ** 2 + ((y - lake.y) / lake.ry) ** 2;
      if (edge > .88) return colours[2];
      const ripples = [[.54,.73,.045],[.68,.68,.035],[.79,.77,.05],[.61,.86,.05],[.82,.86,.045],[.71,.91,.04],[.50,.81,.025]];
      if (ripples.some(([cx,cy,half]) => Math.abs(y-cy) < .004 && Math.abs(x-cx) < half)) return colours[3];
      return colours[y < .77 ? 1 : 0];
    }
    case "tree": {
      const tree = trees.find(item => canopy(x, y, item));
      const dx = (x - tree.x) / tree.rx, dy = (y - tree.y) / tree.ry;
      let light;
      if (tree.kind === "pine") light = 3.2 - dx * .9 - dy * .45 + Math.sin(dy * 9 + Math.abs(dx)) * .65;
      else {
        const clusters = tree.kind === "birch" ? [[0,-.25,.95,.85],[.1,.5,.85,.65]]
          : [[-.35,-.45,.8,.65],[.4,-.15,.85,.85],[-.65,.35,.85,.65],[.15,.65,.85,.65],[.85,.5,.65,.6]];
        let depth = -1;
        light = 1.5 - dx * .6 - dy * .3;
        for (const [cx,cy,rx,ry] of clusters) {
          const nx = (dx-cx)/rx, ny = (dy-cy)/ry, nz = Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
          if (nz > depth) { depth = nz; light = 1.2+nz*2.6-nx*.8-ny*.8; }
        }
        light += Math.sin(x*761+Math.sin(y*229))*Math.sin(y*547-x*101)*.38;
      }
      return colours[Math.max(0, Math.min(5, Math.floor(light)))];
    }
    case "trunk": return colours[column % 2];
  }
}
const smallImage = Buffer.alloc(pixelWidth * pixelHeight * 4), smallMask = Buffer.alloc(pixelWidth * pixelHeight);
for (let row = 0; row < pixelHeight; row++) for (let column = 0; column < pixelWidth; column++) {
  const zone = classify((column + .5) / pixelWidth, (row + .5) / pixelHeight);
  const hex = colour(column, row, zone).slice(1), index = row * pixelWidth + column;
  for (let channel = 0; channel < 3; channel++) smallImage[index * 4 + channel] = parseInt(hex.slice(channel * 2, channel * 2 + 2), 16);
  smallImage[index * 4 + 3] = 255;
  smallMask[index] = zones.indexOf(zone);
}
const image = Buffer.alloc(width * height * 4), mask = Buffer.alloc(width * height), regionPixels = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const source = Math.floor(y * pixelHeight / height) * pixelWidth + Math.floor(x * pixelWidth / width), target = y * width + x;
  smallImage.copy(image, target * 4, source * 4, source * 4 + 4);
  mask[target] = smallMask[source];
  for (let channel = 0; channel < 3; channel++) regionPixels[target * 3 + channel] = zoneColours[mask[target]][channel];
}
const png = await sharp(image, { raw: { width, height, channels: 4 } }).png().toBuffer();
await writeFile(new URL("landscape.png", directory), png);
await writeFile(new URL("landscape-regions.png", directory), await sharp(regionPixels, { raw: { width, height, channels: 3 } }).png().toBuffer());
const runs = [];
let start = 0;
for (let i = 1; i <= mask.length; i++) if (i === mask.length || mask[i] !== mask[start]) {
  runs.push((i - start).toString(36) + mask[start]); start = i;
}
await writeFile(new URL("../src/guestbook-map.json", import.meta.url), JSON.stringify({ width, height, zones, runs: runs.join(".") }) + "\n");
await writeFile(new URL("landscape-sources.json", directory), JSON.stringify({
  description: "Soft pixel-art meadow based on the supplied earlier site reference, with three heavily snow-covered peaks. Grass meets the mountain bases directly.",
  pixelWidth, pixelHeight, mountains, trees, sources: [],
  sceneSha256: createHash("sha256").update(png).digest("hex"),
}, null, 2) + "\n");
console.log(`Built reference-style snowy range (${mountains.length} peaks), scene and matching placement map.`);
