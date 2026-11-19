import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const directory="public/buttons";
const bevel=([light,mid,shadow,dark])=>`<g shape-rendering="crispEdges" aria-label="color-matched pixel bevel">
<path d="M0 0H88V2H2V29H0Z" fill="${light}"/>
<path d="M2 2H86V3H3V28H2Z" fill="${mid}"/>
<path d="M88 0V31H0V29H86V2H88Z" fill="${shadow}"/>
<path d="M85 3H86V29H2V28H85Z" fill="${dark}"/>
</g>`;
const wrapper=(title,art,colours)=>`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31" viewBox="0 0 88 31" shape-rendering="crispEdges"><title>${title}</title>${art}${bevel(colours)}</svg>\n`;
const outputs=[];
async function save(name,title,art,colours,writeSVG=true) {
  const svg=wrapper(title,art,colours);
  if(writeSVG) await writeFile(`${directory}/${name}-button.svg`,svg);
  outputs.push({name,title,svg});
}
// Keep supplied GIFs animated with their original timings and loop setting.
// Caramel Fevers supplies a 4× button; reduce it on the pixel grid to 88 × 31.
// First frames are kept in memory for validation; only active assets are written.
for(const [name,file,title,colours]of [
  ["wildbread","wildbread.gif","wild bread",["#fff1dc","#e0c3a0","#9b7252","#70503b"]],
  ["coffeeplant","coffeeplant.png","coffeeplant",["#c4b397","#776448","#34251e","#140e0b"]],
  ["ribo","ribo.gif","ribo.zone",["#e2fff5","#86c2ad","#2c705d","#154a3b"]],
  ["caramelfevers","caramelfevers.gif","caramelfevers",["#fff3c9","#cbbf99","#a25f66","#573d3f"]],
]) {
  const input=await readFile(`${directory}/sources/${file}`);
  const metadata=await sharp(input,{page:0,pages:1}).metadata();
  const resize=name==="caramelfevers";
  if(resize ? metadata.width!==352 || metadata.height!==124 : metadata.width!==88 || metadata.height!==31)
    throw Error(`${name}: unexpected artwork dimensions`);
  const frame=page=>{
    const image=sharp(input,{page,pages:1});
    return resize ? image.resize(88,31,{kernel:"nearest"}) : image;
  };
  const png=await frame(0).png().toBuffer();
  await save(name,title,`<image x="0" y="0" width="88" height="31" href="data:image/png;base64,${png.toString("base64")}"/>`,colours,!file.endsWith(".gif"));
  // Check the complete interior against the uploaded source, bit for bit.
  const svgPixels=await sharp(Buffer.from(outputs.at(-1).svg)).extract({left:3,top:3,width:82,height:25}).ensureAlpha().raw().toBuffer();
  const sourcePixels=await sharp(png).extract({left:3,top:3,width:82,height:25}).ensureAlpha().raw().toBuffer();
  if(!svgPixels.equals(sourcePixels))throw Error(`${name}: source artwork changed`);
  if(file.endsWith(".gif")) {
    const overlay=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31">${bevel(colours)}</svg>`);
    const frames=[];
    for(let page=0;page<metadata.pages;page++) {
      frames.push(await sharp(await frame(page).png().toBuffer()).ensureAlpha().composite([{input:overlay}]).raw().toBuffer());
    }
    const path=`${directory}/${name}-button.gif`;
    await sharp(Buffer.concat(frames),{raw:{width:88,height:31*frames.length,channels:4,pageHeight:31}})
      .gif({loop:metadata.loop,delay:metadata.delay,colours:256,dither:0,
        interFrameMaxError:0,interPaletteMaxError:0,keepDuplicateFrames:true}).toFile(path);
    const encoded=await sharp(path,{animated:true}).metadata();
    if(encoded.pages!==metadata.pages || encoded.loop!==metadata.loop
      || JSON.stringify(encoded.delay)!==JSON.stringify(metadata.delay))throw Error(`${name}: animation timing changed`);
    for(let page=0;page<metadata.pages;page++) {
      const expected=await sharp(await frame(page).png().toBuffer()).extract({left:3,top:3,width:82,height:25}).ensureAlpha().raw().toBuffer();
      const actual=await sharp(path,{page,pages:1}).extract({left:3,top:3,width:82,height:25}).ensureAlpha().raw().toBuffer();
      if(!actual.equals(expected))throw Error(`${name}: animation pixels changed on frame ${page}`);
    }
    console.log(`${name}: preserved all ${metadata.pages} frames, original delays, loop and ${resize ? "resized " : ""}interior pixels`);
  }
}
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
// A complete side-view cart, drawn on the final output grid. Fine wire mesh,
// stepped basket edges, a continuous chassis, and two separate rubber wheels.
let cart=rect(0,0,88,31,"#b3baa2");
const steel="#465958",silver="#9aaea5",shine="#e3e8d3",rubber="#293537";
cart+=rect(27,26,43,1,"#939f89");
cart+=rect(22,5,8,2,"#9c5743")+rect(23,5,6,1,"#d49568");
cart+=rect(29,6,2,4,steel)+rect(30,10,2,4,steel)+rect(31,14,2,4,steel)+rect(32,18,2,3,steel);
cart+=rect(31,8,35,2,steel)+rect(32,8,33,1,shine);
cart+=rect(32,10,2,4,steel)+rect(33,14,2,3,steel)+rect(34,17,2,2,steel);
cart+=rect(64,10,2,3,steel)+rect(63,13,2,3,steel)+rect(62,16,2,3,steel);
for(const x of [37,43,49,55,61])cart+=rect(x,10,1,8,silver)+rect(x+1,10,1,7,shine);
cart+=rect(34,12,30,1,silver)+rect(35,15,28,1,silver);
cart+=rect(35,18,28,2,steel)+rect(36,18,26,1,shine);
cart+=rect(33,21,29,2,steel)+rect(34,21,27,1,silver);
cart+=rect(36,20,1,2,steel)+rect(59,20,1,2,steel);
for(const x of [36,58])cart+=rect(x+1,23,3,4,rubber)+rect(x,24,5,2,rubber)+rect(x+2,24,1,1,shine);
await save("shopping-cart","stray shopping cart project",cart,["#edf0d7","#cbd4b6","#697762","#3b4b43"]);

await mkdir("outputs",{recursive:true});
const layers=[];
for(let i=0;i<outputs.length;i++) {
  const {title,svg}=outputs[i];
  layers.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="352" height="24"><text x="0" y="17" font-family="monospace" font-size="15" fill="#333">${title}</text></svg>`),left:16,top:12+i*160});
  layers.push({input:await sharp(Buffer.from(svg)).resize(352,124,{kernel:"nearest"}).png().toBuffer(),left:16,top:38+i*160});
}
await sharp({create:{width:384,height:814,channels:3,background:"#e5e4dc"}}).composite(layers).png().toFile("outputs/new-site-buttons.png");
console.log("Built five 88 × 31 buttons, including supplied animations. Interiors checked against the source at display size.");
