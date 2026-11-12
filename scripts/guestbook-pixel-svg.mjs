// Horizontal runs keep adjacent logical cells seamless when the art scales.
export function pixelSvg(data, width, height) {
  const colours = new Map();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width;) {
      const offset = (y * width + x) * 4;
      if (!data[offset + 3]) { x++; continue; }
      const rgba = [...data.subarray(offset, offset + 4)];
      let end = x + 1;
      while (end < width && rgba.every((value, channel) => value === data[(y * width + end) * 4 + channel])) end++;
      const key = rgba.join(",");
      const run = `M${x} ${y}h${end - x}v1h-${end - x}z`;
      colours.set(key, (colours.get(key) || "") + run);
      x = end;
    }
  }
  const paths = [...colours].map(([key, path]) => {
    const [r, g, b, alpha] = key.split(",").map(Number);
    const fill = "#" + [r, g, b].map(value => value.toString(16).padStart(2, "0")).join("");
    return `<path fill="${fill}"${alpha < 255 ? ` fill-opacity="${alpha / 255}"` : ""} d="${path}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${paths}</svg>\n`;
}
