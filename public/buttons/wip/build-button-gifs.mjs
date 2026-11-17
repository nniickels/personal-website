import { readFile, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";

// Original SVGs are the drawings. No frames are resized, warped or interpolated.
// Sprite poses are integer translations of a single rendered sprite; colour
// drawings edit named cells of the original SVG grid with discrete palettes.
const width = 88, height = 31, channels = 4;
const raster = svg => sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
const names = ["boris", "bunny", "bird", "moon", "floral", "galaxy", "black-hole", "flowers-water"];
const rgba = hex => [...hex.slice(1).match(/../g).map(v => parseInt(v, 16)), 255];
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
const key = (x, y) => `${x},${y}`;
function inner(svg) {
  const start = svg.indexOf("<svg", svg.indexOf("<svg") + 4);
  const end = svg.indexOf("</svg>", start);
  const openingEnd = svg.indexOf(">", start) + 1;
  return { content: svg.slice(openingEnd, end), replace: content => svg.slice(0, openingEnd) + content + svg.slice(end) };
}
function cells(content) {
  const flat = content.replace(/<g fill="([^"]+)">([\s\S]*?)<\/g>/g, (_, fill, body) =>
    body.replace(/<rect\b[^>]*\/>/g, tag => attr(tag, "fill") ? tag : tag.replace("/>", ` fill="${fill}"/>`)));
  const map = new Map();
  for (const tag of flat.match(/<rect\b[^>]*\/>/g) ?? []) {
    const x = +attr(tag, "x"), y = +attr(tag, "y");
    for (let dy = 0; dy < +attr(tag, "height"); dy++) for (let dx = 0; dx < +attr(tag, "width"); dx++)
      map.set(key(x + dx, y + dy), attr(tag, "fill").toLowerCase());
  }
  return map;
}
const drawCells = map => [...map].map(([k, fill]) => {
  const [x, y] = k.split(",");
  return `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
}).join("");
function stamp(frame, sprite, dx = 0, dy = 0) {
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const source = (y * width + x) * channels;
    if (!sprite[source + 3]) continue;
    const tx = x + dx, ty = y + dy;
    if (tx < 3 || tx >= 85 || ty < 3 || ty >= 28) continue;
    sprite.copy(frame, (ty * width + tx) * channels, source, source + channels);
  }
}
async function sprite(svg, layer, selection) {
  // Retain exactly the original SVG viewport, position and pixel rendering.
  const opening = layer.replace("").match(/<svg\b[^>]*>/g).at(-1);
  return raster(`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31" shape-rendering="crispEdges">${opening}${drawCells(selection)}</svg></svg>`);
}
function components(map) {
  const remaining = new Set(map.keys()), result = [];
  while (remaining.size) {
    const first = remaining.values().next().value;
    remaining.delete(first);
    const queue = [first], component = new Map();
    while (queue.length) {
      const k = queue.pop(), [x, y] = k.split(",").map(Number);
      component.set(k, map.get(k));
      for (const next of [key(x-1,y),key(x+1,y),key(x,y-1),key(x,y+1)])
        if (remaining.delete(next)) queue.push(next);
    }
    result.push(component);
  }
  return result;
}
// Discrete drawings of the same petal material, including the transition hues.
// Every flower uses the same palette in every frame; stems/centres are untouched.
const flowerPalettes = [
  ["#c71c41", "#570a35"], ["#bd4879", "#683351"], ["#b97dae", "#70476f"],
  ["#c1a0df", "#77508f"], ["#b9b5e7", "#705f98"], ["#b3c8ec", "#67759f"],
  ["#acd9f1", "#608bab"], ["#cce4ed", "#819da9"], ["#e7efe9", "#a1adae"],
  ["#fffdf3", "#c2bdb0"], ["#eed6d4", "#a78688"], ["#db8f9b", "#88455a"],
];
const glint = await sharp(await readFile(new URL("./assets/minecraft-enchantment-glint.png", import.meta.url)))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
function sampleGlint(u, v, channel) {
  const x = ((Math.floor(u) % glint.info.width) + glint.info.width) % glint.info.width;
  const y = ((Math.floor(v) % glint.info.height) + glint.info.height) % glint.info.height;
  return glint.data[(y * glint.info.width + x) * 4 + channel];
}

const review = [];
const validation = [];
const hash = buffer => createHash("sha256").update(buffer).digest("hex");
for (const name of names) {
  const svg = await readFile(`public/buttons/${name}-button.svg`, "utf8");
  const base = await raster(svg), frames = [], delays = [];
  const add = (frame, delay) => { frames.push(frame); delays.push(delay); };
  if (name === "boris") {
    // The requested Minecraft glint is the sole continuous overlay exception.
    for (let f = 0; f < 64; f++) {
      const frame = Buffer.from(base), travel = f / 64 * glint.info.width;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        for (const [layer, angle] of [-50 * Math.PI / 180, 10 * Math.PI / 180].entries()) {
          const u = 1.35 * (x * Math.cos(angle) - y * Math.sin(angle)) + (layer ? -travel : travel);
          const v = 1.35 * (x * Math.sin(angle) + y * Math.cos(angle)) + (layer ? travel : 0);
          for (let c = 0; c < 3; c++) {
            const value = sampleGlint(u, v, c);
            frame[o+c] = Math.min(255, Math.round(frame[o+c] + value * value / 255 * 0.32));
          }
        }
      }
      add(frame, 80);
    }
  } else if (name === "bunny") {
    // Recolour the final raster's existing silhouette; never rerasterize its pose.
    const old = rgba("#5d4038"), light = rgba("#a77e6c");
    for (let active = 0; active < 3; active++) {
      const frame = Buffer.from(base);
      for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
        const o=(y*width+x)*4, bunny=x<32?0:x<55?1:2;
        if (bunny===active && old.every((v,c)=>base[o+c]===v)) for(let c=0;c<3;c++) frame[o+c]=light[c];
      }
      add(frame, 550);
    }
  } else if (name === "bird") {
    const layer = inner(svg), original = cells(layer.content);
    const birds = [new Map(),new Map(),new Map(),new Map(),new Map()], perch = new Map();
    for (const [k, colour] of original) {
      const [x,y] = k.split(",").map(Number);
      // The grey horizontal perch is scenery, not part of any bird sprite.
      if (y===13 && colour==="#a5a5a5") { perch.set(k,colour); continue; }
      birds[x<20?0:x<32?1:x<47?2:x<64?3:4].set(k,colour);
    }
    const backdrop = await raster(layer.replace(drawCells(perch)));
    const sprites = await Promise.all(birds.map(bird=>sprite(svg,layer,bird)));
    // Lift, hang, land, settle. One complete sprite moves, in whole output pixels.
    for (let active=0;active<5;active++) for (const [lift,delay] of [[0,240],[1,110],[3,140],[3,110],[1,110],[0,280]]) {
      const frame=Buffer.from(backdrop);
      sprites.forEach((bird,i)=>stamp(frame,bird,0,i===active?-lift:0));
      add(frame,delay);
    }
  } else if (name === "floral") {
    const layer=inner(svg), original=cells(layer.content);
    // Each flower has its own drawn lobe facing away from its centre. These
    // terminal cells tuck inward for one pose, then return to the original
    // open petal. No complete head, stem or centre is stretched or translated.
    const foldedTips=[[23,1,25],[35,1,37],[50,14,52],[62,1,64]];
    for (let i=0;i<flowerPalettes.length;i++) {
      const palette=flowerPalettes[i], drawing=new Map(original);
      for(const [k,colour]of original) {
        if(colour==="#c71c41") drawing.set(k,palette[0]);
        if(colour==="#570a35") drawing.set(k,palette[1]);
      }
      if(i%3===1) for(const [x0,y,x1]of foldedTips) for(let x=x0;x<=x1;x++) {
        const k=key(x,y);
        if(original.get(k)==="#c71c41") drawing.delete(k);
      }
      add(await raster(layer.replace(drawCells(drawing))), i%3===0?550:140);
    }
  } else if (name === "moon") {
    const layer=inner(svg), original=cells(layer.content), fixed=new Map(original), waves=[];
    for (const component of components(original)) {
      const coords=[...component.keys()].map(k=>k.split(",").map(Number));
      const minX=Math.min(...coords.map(p=>p[0])), maxX=Math.max(...coords.map(p=>p[0]));
      // Only whole disconnected outer wave strokes move; the moon and every
      // stroke joined to it stay intact. No row-by-row tearing or resampling.
      if (maxX<=21 || minX>=69) {
        waves.push({image:await sprite(svg,layer,component),side:minX>=69?1:-1});
        for(const k of component.keys()) fixed.delete(k);
      }
    }
    const backdrop=await raster(layer.replace(drawCells(fixed)));
    for (const lift of [0,0,1,1,0,0,-1,-1]) {
      const frame=Buffer.from(backdrop);
      for(const wave of waves) stamp(frame,wave.image,0,lift*wave.side);
      add(frame,180);
    }
  } else {
    const layer=name==="flowers-water"?null:inner(svg);
    const original=cells(layer?layer.content:svg);
    const draw=map=>raster(layer?layer.replace(drawCells(map)):svg.replace(/<rect\b[^>]*\/>/g,tag=>{
      const colour=map.get(key(+attr(tag,"x"),+attr(tag,"y")));
      return colour?tag.replace(/fill="[^"]+"/,`fill="${colour}"`):tag;
    }));
    // All three drawings retain the exact original cell positions and silhouettes.
    const pristine=await draw(original);
    if (!pristine.equals(base)) throw new Error(`${name}: source-grid reconstruction changed the original`);
    if (name==="galaxy") {
      // Three existing star-cloud clusters along the spiral arms. Each authored
      // patch has a compact centre and a restrained surrounding light/shadow edge.
      const clusters=[[[48,6,52,8],[47,5,54,9]],[[22,15,26,17],[20,14,28,18]],[[40,8,44,10],[38,7,46,11]]];
      const brighter={"#944c58":"#c77b7d","#c77b7d":"#e39b97","#e39b97":"#d7d4cf"};
      const drawings=[[-1,0], [0,1], [0,2], [0,1], [-1,0], [1,1], [1,2], [1,1], [-1,0], [2,1], [2,2], [2,1]];
      for (const [active,pose] of drawings) {
        const frame=new Map(original);
        if(active>=0) {
          const [x0,y0,x1,y1]=clusters[active][pose===2?1:0];
          for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
            const k=key(x,y), old=original.get(k);
            if(brighter[old]) frame.set(k,brighter[old]);
          }
        }
        add(await draw(frame),pose===2?170:220);
      }
    } else if(name==="black-hole") {
      // Hand-placed material knots travel along the original diagonal disk.
      // They only replace existing disk colours: no added glow or warped ring.
      const track=[[15,27],[22,24],[29,21],[36,19],[43,17],[50,15],[57,13],[64,11],[71,9],[78,7],[85,6],[91,5]];
      for(let f=0;f<track.length;f++) {
        const frame=new Map(original);
        for(let tail=0;tail<3;tail++) {
          const [cx,cy]=track[(f-tail+track.length)%track.length];
          const pattern=tail===0?[[0,0],[1,0],[2,0],[1,-1]]:tail===1?[[0,0],[1,0]]:[[0,0]];
          for(const [dx,dy]of pattern) {
            const k=key(cx+dx,cy+dy), old=original.get(k);
            if(old==="#fff1bd") frame.set(k,tail===0?"#ddae22":"#ee6c29");
            else if(old==="#ddae22") frame.set(k,"#fff1bd");
          }
        }
        add(await draw(frame),170);
      }
    } else {
      // Trace the EXISTING water ribbons, not hypothetical circular ripples.
      // These authored segments follow the vertical bends around the flowers.
      const ribbons=[
        [[28,3,32,5],[30,6,34,8],[32,9,36,11],[32,12,37,14],[30,15,34,17],[28,18,32,21]],
        [[51,15,54,17],[52,18,56,20],[54,21,58,23],[57,24,61,26],[61,26,65,28],[66,27,70,28]],
        [[76,3,80,5],[76,6,80,8],[74,9,78,11],[71,12,75,14],[66,13,70,15],[62,12,66,14]],
      ];
      const waterShades={"#3e4056":"#43465f","#42445c":"#474961","#43465f":"#5d6077","#474961":"#5d6077"};
      for(let f=0;f<12;f++) {
        const frame=new Map(original);
        for(let r=0;r<ribbons.length;r++) {
          const segment=ribbons[r][(Math.floor(f/2)+r*2)%6];
          const [x0,y0,x1,y1]=segment;
          for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
            const k=key(x,y), old=original.get(k);
            // Exact original water shades only. Pale petal cells never change.
            if(waterShades[old]) frame.set(k,waterShades[old]);
          }
        }
        add(await draw(frame),190);
      }
    }
  }
  if (["bird", "moon", "floral", "galaxy"].includes(name) && !frames[0].equals(base))
    throw new Error(`${name}: resting drawing must exactly match the original`);
  if (name !== "boris") {
    for (const frame of frames) for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
      if(x>=3 && x<85 && y>=3 && y<28) continue;
      const o=(y*width+x)*4;
      if(!frame.subarray(o,o+4).equals(base.subarray(o,o+4)))
        throw new Error(`${name}: border changed at ${x},${y}`);
    }
  }
  await sharp(Buffer.concat(frames),{raw:{width,height:height*frames.length,channels,pageHeight:height}})
    .gif({loop:0,delay:delays,colours:256,dither:0,effort:7}).toFile(`public/buttons/wip/${name}-button.gif`);
  // Encoding must not introduce dithering, substitute colours, or lose pixels.
  const encoded = sharp(`public/buttons/wip/${name}-button.gif`,{animated:true});
  const metadata = await encoded.metadata();
  const decoded = await encoded.ensureAlpha().raw().toBuffer();
  const expected = new Set(frames.map(hash));
  if(name!=="boris") for(let page=0;page<metadata.pages;page++) {
    const chunk=decoded.subarray(page*width*height*4,(page+1)*width*height*4);
    if(!expected.has(hash(chunk))) throw new Error(`${name}: GIF encoder altered a pixel drawing`);
  }
  if(metadata.width!==width || metadata.pageHeight!==height || metadata.loop!==0
    || metadata.delay.reduce((a,b)=>a+b,0)!==delays.reduce((a,b)=>a+b,0))
    throw new Error(`${name}: incorrect GIF dimensions, timing or loop`);
  validation.push({name,drawings:frames.length,gifFrames:metadata.pages,loopMs:delays.reduce((a,b)=>a+b,0),
    exactPixelsVerified:name!=="boris",originalRestPoseVerified:["bird","moon","floral","galaxy"].includes(name)});
  review.push({name,base,frames});
  console.log(`${name}: ${frames.length} deliberate frames, ${delays.reduce((a,b)=>a+b,0)} ms loop`);
}
// Contact sheet: original followed by six actual animation frames, nearest-neighbour
// enlargement for inspection only. GIFs themselves are never enlarged/resampled.
await mkdir("outputs",{recursive:true});
const tiles=[];
for(let row=0;row<review.length;row++) {
  const {base,frames}=review[row];
  for(let col=0;col<7;col++) {
    const frame=col===0?base:frames[Math.floor((col-1)*frames.length/6)];
    tiles.push({input:await sharp(frame,{raw:{width,height,channels}}).resize(352,124,{kernel:"nearest"}).png().toBuffer(),left:col*360,top:row*148+20});
  }
}
await sharp({create:{width:2520,height:1184,channels:3,background:"#ddd"}}).composite(tiles).png().toFile("outputs/button-animation-frames.png");
await writeFile("outputs/button-animation-frames.txt","Columns: original SVG, then six frames from the GIF.\nRows: "+names.join(", ")+".\n");

await writeFile("outputs/button-animation-validation.json",JSON.stringify(validation,null,2)+"\n");
