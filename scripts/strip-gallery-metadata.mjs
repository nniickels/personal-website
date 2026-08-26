import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const galleryDirectories = [
  "public/photos",
  "public/food-photos",
  "public/natural-things",
  "public/scrapbook",
];

const preservedApplicationMarkers = new Set([
  0xe0, // JFIF/JFXX container information
  0xe2, // ICC colour profile
  0xee, // Adobe colour transform information
]);

function stripJpegMetadata(source, filename) {
  if (source[0] !== 0xff || source[1] !== 0xd8) {
    throw new Error(`${filename} is not a valid JPEG file.`);
  }

  const chunks = [source.subarray(0, 2)];
  let offset = 2;
  let removedSegments = 0;

  while (offset < source.length) {
    const markerStart = offset;
    if (source[offset] !== 0xff) {
      throw new Error(`${filename} contains an invalid JPEG marker at byte ${offset}.`);
    }

    while (source[offset] === 0xff) offset += 1;
    const marker = source[offset];
    offset += 1;

    if (marker === 0xda || marker === 0xd9) {
      chunks.push(source.subarray(markerStart));
      break;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      chunks.push(source.subarray(markerStart, offset));
      continue;
    }

    if (offset + 2 > source.length) {
      throw new Error(`${filename} ends inside a JPEG segment header.`);
    }

    const segmentLength = source.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > source.length) {
      throw new Error(`${filename} contains an invalid JPEG segment length.`);
    }

    const segmentEnd = offset + segmentLength;
    const isApplicationSegment = marker >= 0xe0 && marker <= 0xef;
    const shouldRemove =
      marker === 0xfe ||
      (isApplicationSegment && !preservedApplicationMarkers.has(marker));

    if (shouldRemove) {
      removedSegments += 1;
    } else {
      chunks.push(source.subarray(markerStart, segmentEnd));
    }
    offset = segmentEnd;
  }

  return {
    data: Buffer.concat(chunks),
    removedSegments,
  };
}

async function jpegFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return jpegFiles(entryPath);
    return /\.jpe?g$/i.test(entry.name) ? [entryPath] : [];
  }));
  return files.flat();
}

let changedFiles = 0;
let removedSegments = 0;

for (const directory of galleryDirectories) {
  for (const filename of await jpegFiles(directory)) {
    const source = await readFile(filename);
    const stripped = stripJpegMetadata(source, filename);
    if (stripped.removedSegments === 0) continue;

    await writeFile(filename, stripped.data);
    changedFiles += 1;
    removedSegments += stripped.removedSegments;
  }
}

console.log(
  `Stripped ${removedSegments} metadata segment${removedSegments === 1 ? "" : "s"} from ${changedFiles} gallery image${changedFiles === 1 ? "" : "s"}.`,
);
