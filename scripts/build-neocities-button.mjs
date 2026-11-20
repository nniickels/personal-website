import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const out="public/buttons";
await mkdir(out,{recursive:true});
// Keep the logo at source resolution inside the SVG. No pixel-grid conversion.
const logoPNG=await sharp(await readFile("public/buttons/sources/neocities-logo.png")).trim().png().toBuffer();
const glyphs={n:["000","110","101","101","101"],i:["010","000","010","010","010"],c:["000","011","100","100","011"],k:["100","101","110","101","101"],e:["000","010","101","110","011"],l:["110","010","010","010","011"],s:["000","011","110","001","110"],o:["000","010","101","101","010"],t:["010","111","010","010","011"],">": ["100","010","001","010","100"]," ":["000","000","000","000","000"]};
function text(label,x,y,fill="#fff3d9") {
 let result=`<g shape-rendering="crispEdges">`;
 for(const ch of label){for(let yy=0;yy<5;yy++)for(let xx=0;xx<3;xx++)if(glyphs[ch][yy][xx]==="1")result+=`<rect x="${x+xx}" y="${y+yy}" width="1" height="1" fill="${fill}"/>`;x+=4;}
 return result+"</g>";
}
function bevel([light,mid,shadow,dark]){return `<g shape-rendering="crispEdges"><path d="M0 0H88V2H2V29H0Z" fill="${light}"/><path d="M2 2H86V3H3V28H2Z" fill="${mid}"/><path d="M88 0V31H0V29H86V2H88Z" fill="${shadow}"/><path d="M85 3H86V29H2V28H85Z" fill="${dark}"/></g>`;}
function logo(x,y,w,h){return `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${logoPNG.toString('base64')}"/>`;}
const frame=["#628a95","#2f5b67","#203c47","#0d1c23"];
const art=text("> nickels",7,9)+text("neocities",7,18,"#fe5d73")+logo(50,3,30,25);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31" viewBox="0 0 88 31"><title>Nickels — Neocities profile</title><rect width="88" height="31" fill="#16272f"/>${art}${bevel(frame)}</svg>\n`;
await writeFile(`${out}/neocities-button.svg`,svg);
console.log("Built the selected Neocities typewriter button.");
