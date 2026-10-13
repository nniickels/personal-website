export type PostcardStampKind = "food" | "nature" | "tea" | "bar" | "museum";

const labels: Record<PostcardStampKind, string> = {
  food: "good food", nature: "outdoors", tea: "tea & treats", bar: "cheers", museum: "exhibits",
};

// Small engraved illustrations, drawn in the stamp's ink colour.
const drawings = {
  food: <>
    <g transform="rotate(-13 7 12)"><path d="M4 3v5m3-5v6m3-6v5c0 2-1.3 3-3 3S4 10 4 8M7 11v10" /><path d="M6 14h2v7H6Z" fill="currentColor" fillOpacity=".22" /></g>
    <g transform="rotate(13 17 12)"><ellipse cx="17" cy="7" rx="3" ry="4" fill="currentColor" fillOpacity=".18" /><path d="M17 11v10m-1-6h2v6h-2Z" /></g>
    <path d="m10 2 1 1m2 0 1-1" strokeWidth=".8" />
  </>,
  nature: <>
    <path d="m12 2-5 6h3l-5 5h4l-6 5h18l-6-5h4l-5-5h3Z" fill="currentColor" fillOpacity=".2" />
    <path d="M10.5 18v4h3v-4" fill="currentColor" fillOpacity=".35" />
    <path d="M12 6v10m0-5-2-2m2 5 3-3M7 23h10" strokeWidth=".8" />
  </>,
  tea: <>
    <path d="M4 10h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" fill="currentColor" fillOpacity=".15" />
    <path d="M17 11h2a3 3 0 0 1 0 6h-2M2 22h20M8 2c-2 2 2 3 0 5m5-5c-2 2 2 3 0 5" />
    <path d="M8 15c2-2 4-1 5-2 0 3-2 5-5 2Zm0 0 3 1" strokeWidth=".8" />
  </>,
  bar: <>
    <path d="M3 8h18c-1 4-4 6-9 6S4 12 3 8Z" fill="currentColor" fillOpacity=".2" /><path d="M12 14v7m-4 1h8M8 3l3 5" />
    <path d="M17 8a3.5 3.5 0 1 0-3.5-3.5M14 2l3 3m-1-3-1 3" strokeWidth="1" />
    <path d="m3 3 .5 1.5L5 5l-1.5.5L3 7l-.5-1.5L1 5l1.5-.5Z" fill="currentColor" stroke="none" />
  </>,
  museum: <>
    <path d="m2 7 10-5 10 5H2Z" fill="currentColor" fillOpacity=".16" /><path d="M3 9h18M3 20h18M2 23h20M5 10v8m4-8v8m6-8v8m4-8v8" />
    <path d="M4 10h6m4 0h6M4 18h6m4 0h6" strokeWidth=".8" /><circle cx="12" cy="5" r=".8" fill="currentColor" stroke="none" />
    <path d="M7 11v6m10-6v6" strokeWidth=".6" />
  </>,
};

// Perforations are cut into the paper silhouette, rather than a dashed border.
let perforatedEdge = "M0 0";
for (let x = 0; x < 64; x += 8) perforatedEdge += `Q${x + 4} 4 ${x + 8} 0`;
for (let y = 0; y < 80; y += 8) perforatedEdge += `Q60 ${y + 4} 64 ${y + 8}`;
for (let x = 64; x > 0; x -= 8) perforatedEdge += `Q${x - 4} 76 ${x - 8} 80`;
for (let y = 80; y > 0; y -= 8) perforatedEdge += `Q4 ${y - 4} 0 ${y - 8}`;
perforatedEdge += "Z";

export function PostcardStamp({ kind }: { kind: PostcardStampKind }) {
  return <>
    <svg className="postcard-stamp-paper" viewBox="0 0 64 80" aria-hidden="true" focusable="false">
      <path d={perforatedEdge} fill="var(--stamp-paper)" />
      <rect x="8" y="8" width="48" height="64" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".65" />
      <path d="M12 57h40" stroke="currentColor" strokeWidth=".5" opacity=".5" />
    </svg>
    <svg className="postcard-stamp-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {drawings[kind]}
    </svg>
    <span className="postcard-stamp-label">{labels[kind]}</span>
  </>;
}
