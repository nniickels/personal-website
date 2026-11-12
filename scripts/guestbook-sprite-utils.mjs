import sharp from "sharp";

export async function extractGuestbookSprite(path, index, columns, rows) {
  const metadata = await sharp(path).metadata();
  const left = Math.round(index % columns * metadata.width / columns);
  const top = Math.round(Math.floor(index / columns) * metadata.height / rows);
  const width = Math.round((index % columns + 1) * metadata.width / columns) - left;
  const height = Math.round((Math.floor(index / columns) + 1) * metadata.height / rows) - top;
  const { data } = await sharp(path).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(width * height);
  let largest = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || data[start * 4 + 3] < 96) continue;
    const component = [start];
    seen[start] = 1;
    for (let i = 0; i < component.length; i++) {
      const point = component[i], x = point % width, y = Math.floor(point / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || seen[next] || data[next * 4 + 3] < 96) continue;
        seen[next] = 1;
        component.push(next);
      }
    }
    if (component.length > largest.length) largest = component;
  }
  if (!largest.length) throw new Error(`No sprite in cell ${index} of ${path}`);
  const cleaned = Buffer.alloc(data.length);
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (const point of largest) {
    const x = point % width, y = Math.floor(point / width);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    data.copy(cleaned, point * 4, point * 4, point * 4 + 3);
    cleaned[point * 4 + 3] = 255;
  }
  const fitted = await sharp(cleaned, { raw: { width, height, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(52, 52, { fit: "contain", background: "#0000", kernel: "nearest" })
    .extend({ top: 6, bottom: 6, left: 6, right: 6, background: "#0000" }).png().toBuffer();
  return fitted;
}
