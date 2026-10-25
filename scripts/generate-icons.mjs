import sharp from "sharp";

const source = "public/icon.svg";

const targets = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/icon-maskable-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

for (const target of targets) {
  await sharp(source)
    .resize(target.size, target.size)
    .png({ compressionLevel: 9 })
    .toFile(target.file);
  console.log(`generated ${target.file}`);
}
