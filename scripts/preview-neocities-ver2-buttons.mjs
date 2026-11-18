import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

// Static 88 × 31 proposals, separate from the live button wall. The flower
// imagery comes from the user's Neocities ver2 artwork. The finished SVGs are
// integer-grid vector rectangles: no embedded bitmap, filters, or animation.
const out="public/buttons/previews/neocities-ver2";
await mkdir(out,{recursive:true});
const palette=["#14191d","#192429","#20343b","#2b454e","#36565c","#496d6b","#638573","#819b7a","#9ab38b","#b7c99d","#d5deb1","#e0e8c5"];
const colours=palette.map(hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)));
const font={
 n:["000","110","101","101","101"],i:["010","000","010","010","010"],c:["000","011","100","100","011"],
 k:["100","101","110","101","101"],e:["000","010","101","110","011"],l:["110","010","010","010","011"],
 s:["000","011","110","001","110"],o:["000","010","101","101","010"],t:["010","111","010","010","011"],
 ">": ["100","010","001","010","100"]," ":["000","000","000","000","000"],
};
const canvas=()=>Array.from({length:31},()=>Array(88).fill(0));
function text(a,label,x,y,colour=10) {
  for(const letter of label) {
    const glyph=font[letter];
    for(let yy=0;yy<5;yy++) for(let xx=0;xx<3;xx++) if(glyph[yy][xx]==="1") a[y+yy][x+xx]=colour;
    x+=4;
  }
}
function bevel(a,style="bevel") {
  if(style==="line") {
    for(let x=0;x<88;x++){a[0][x]=4;a[30][x]=1;}
    for(let y=0;y<31;y++){a[y][0]=4;a[y][87]=1;}
    return;
  }
  for(let y=0;y<31;y++)for(let x=0;x<88;x++) {
    if(y===0||x===0)a[y][x]=8;
    else if(y===30||x===87)a[y][x]=0;
    else if(y===1||x===1)a[y][x]=4;
    else if(y===29||x===86)a[y][x]=1;
  }
}
function closest(r,g,b) {
  let best=0,error=Infinity;
  for(let i=0;i<colours.length;i++) {
    const [rr,gg,bb]=colours[i];
    const d=(r-rr)**2*0.85+(g-gg)**2*1.1+(b-bb)**2;
    if(d<error){error=d;best=i;}
  }
  return best;
}
async function photo(a,file,box,x,y,w,h,{cover=true}={}) {
  let source=sharp(file);
  if(box)source=source.extract(box);
  const {data,info}=await source.resize(w,h,{fit:cover?"cover":"fill",kernel:"lanczos3"}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++) {
    const tx=x+xx,ty=y+yy;
    if(tx<2||tx>85||ty<2||ty>28)continue;
    const o=(yy*info.width+xx)*4,alpha=data[o+3]/255,bg=colours[a[ty][tx]];
    a[ty][tx]=closest(...bg.map((v,c)=>Math.round(v*(1-alpha)+data[o+c]*alpha)));
  }
}
const page="/tmp/neocities-ver2-buttons-source.png";
await sharp("../neocities/ver2/page-no-text.svg").png().toFile(page);
const flower="../neocities/ver2/flower1.svg", icon="../neocities/ver2/favicon.svg";
const designs=[];
let a=canvas();
await photo(a,page,{left:960,top:0,width:960,height:350},2,2,84,27);
bevel(a);designs.push({id:"a-flower-field",title:"A · Flower field",pixels:a});
a=canvas();
await photo(a,flower,{left:0,top:0,width:337,height:360},48,2,36,36);
text(a,"nickels",7,13);bevel(a);designs.push({id:"b-signature",title:"B · Signature",pixels:a});
a=canvas();
await photo(a,page,{left:860,top:415,width:1060,height:665},2,2,84,27);
// A quiet dark plaque is drawn on the same native grid, not a filter overlay.
for(let y=19;y<27;y++)for(let x=25;x<62;x++)a[y][x]=0;
text(a,"nickels",30,21);bevel(a);designs.push({id:"c-night-garden",title:"C · Night garden",pixels:a});
a=canvas();
await photo(a,flower,{left:0,top:0,width:337,height:252},-6,-5,55,41);
text(a,"nickels",51,13);bevel(a);designs.push({id:"d-close-bloom",title:"D · Close bloom",pixels:a});
a=canvas();
await photo(a,page,{left:1000,top:0,width:920,height:1035},49,2,36,27);
await photo(a,flower,null,3,3,15,28);
text(a,"nickels",19,12);bevel(a);designs.push({id:"e-tall-stems",title:"E · Tall stems",pixels:a});
a=canvas();
await photo(a,flower,{left:0,top:0,width:337,height:252},49,3,36,27);
text(a,"> nickels",7,9);text(a,"neocities",7,17,7);
bevel(a,"line");designs.push({id:"f-terminal",title:"F · Flower terminal",pixels:a});
const previews=[];
for(const {id,title,pixels} of designs) {
  const rectangles=[];
  for(let y=0;y<31;y++)for(let x=0;x<88;) {
    const colour=pixels[y][x],start=x;
    while(x<88&&pixels[y][x]===colour)x++;
    rectangles.push(`<rect x="${start}" y="${y}" width="${x-start}" height="1" fill="${palette[colour]}"/>`);
  }
  // Match the galaxy button's 2px outer / 1px inner bevel, in ver2 greens.
  const frame=id==="f-terminal"?`<g aria-label="color-matched pixel bevel">
    <path d="M0 0H88V2H2V29H0Z" fill="#B7C99D"/>
    <path d="M2 2H86V3H3V28H2Z" fill="#638573"/>
    <path d="M88 0V31H0V29H86V2H88Z" fill="#0C1419"/>
    <path d="M85 3H86V29H2V28H85Z" fill="#060B0E"/>
  </g>`:"";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31" viewBox="0 0 88 31" shape-rendering="crispEdges"><title>${title}</title>${rectangles.join("")}${frame}</svg>\n`;
  await writeFile(`${out}/${id}.svg`,svg);
  const png=await sharp(Buffer.from(svg)).png().toBuffer();
  previews.push({id,title,png});
}
// Native-size and 4× nearest-neighbour samples on a labelled comparison sheet.
const overlays=[];
for(let i=0;i<previews.length;i++) {
  const {title,png}=previews[i],x=24+(i%2)*416,y=22+Math.floor(i/2)*216;
  overlays.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="380" height="24"><text x="0" y="17" fill="#d5deb1" font-family="monospace" font-size="15">${title}</text></svg>`),left:x,top:y});
  overlays.push({input:await sharp(png).resize(352,124,{kernel:"nearest"}).png().toBuffer(),left:x,top:y+32});
  overlays.push({input:png,left:x,top:y+165});
}
await sharp({create:{width:856,height:660,channels:3,background:palette[0]}}).composite(overlays).png().toFile(`${out}/comparison.png`);
await writeFile(`${out}/README.md`,"# Neocities ver2 button previews\n\nSix static 88 × 31 SVG proposals. These are not connected to the site.\n\nFlower imagery is adapted from the user's `neocities/ver2` artwork into a fixed 12-colour grid. Each finished SVG consists solely of integer-coordinate pixel rectangles. `comparison.png` shows a 4× nearest-neighbour enlargement and a native-size example.\n\nRegenerate from the personal-website root with `node scripts/preview-neocities-ver2-buttons.mjs` while the sibling Neocities ver2 folder is available.\n");
console.log(`Wrote six SVG previews and ${out}/comparison.png`);
